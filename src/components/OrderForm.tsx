import React, { useState } from 'react';
import {
  Send,
  Download,
  RotateCcw,
  AlertCircle,
  Plus,
  Minus,
  Mail,
  UserCheck,
  Check,
  ChevronRight,
  ChevronLeft,
  Store,
  FileCheck,
  Layers,
  Edit3,
} from 'lucide-react';
import { ShirtSizes, Order } from '../types';
import { formatCPF, formatPhone, isValidCPF } from '../utils/masks';
import { downloadOrderPdf } from '../utils/pdfGenerator';
import { buildOrderMailtoUrl } from '../utils/mailtoHelper';
import { ConfirmClearModal } from './ConfirmClearModal';
import {
  loadIdentificationCookies,
  saveIdentificationCookies,
  clearIdentificationCookies,
} from '../utils/cookies';

interface OrderFormProps {
  onSubmitOrder: (formData: Partial<Order>) => Promise<void>;
  onPreviewPdf?: (formData: Partial<Order>) => void;
  isSubmitting: boolean;
  isAdmin?: boolean;
}

export const OrderForm: React.FC<OrderFormProps> = ({
  onSubmitOrder,
  isSubmitting,
}) => {
  // Wizard current step: 1 = Identificação, 2 = Cores e Quantidades, 3 = Resumo do Pedido
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Step 1: Identification state - Store, Responsible Name, Supervisor Name and Supervisor Email loaded from Cookies (cached in browser)
  const [storeNumber, setStoreNumber] = useState(() => loadIdentificationCookies().storeNumber);
  const [storeName, setStoreName] = useState(() => loadIdentificationCookies().storeName);
  const [responsibleName, setResponsibleName] = useState(() => loadIdentificationCookies().responsibleName);
  
  // CPF and Contact/WhatsApp are NEVER stored and ALWAYS start blank on reload
  const [responsibleCpf, setResponsibleCpf] = useState('');
  const [responsibleWhatsapp, setResponsibleWhatsapp] = useState('');
  
  // Supervisor and Supervisor Email loaded from Cookies (cached in browser)
  const [supervisorName, setSupervisorName] = useState(() => loadIdentificationCookies().supervisorName);
  const [supervisorEmail, setSupervisorEmail] = useState(() => loadIdentificationCookies().supervisorEmail);
  
  // Step 2: Shirts count and Notes state
  const [blueShirts, setBlueShirts] = useState<ShirtSizes>({ P: 0, M: 0, G: 0, GG: 0 });
  const [whiteShirts, setWhiteShirts] = useState<ShirtSizes>({ P: 0, M: 0, G: 0, GG: 0 });
  const [notes, setNotes] = useState('');

  // Clear confirmation modal
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  // Errors state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Subtotals and Total
  const blueTotal = (blueShirts.P || 0) + (blueShirts.M || 0) + (blueShirts.G || 0) + (blueShirts.GG || 0);
  const whiteTotal = (whiteShirts.P || 0) + (whiteShirts.M || 0) + (whiteShirts.G || 0) + (whiteShirts.GG || 0);
  const totalShirts = blueTotal + whiteTotal;

  // Handlers for size quantities
  const updateBlue = (size: keyof ShirtSizes, delta: number) => {
    setBlueShirts((prev) => {
      const nextVal = Math.max(0, (prev[size] || 0) + delta);
      return { ...prev, [size]: nextVal };
    });
    setErrors((prev) => {
      const { shirts, ...rest } = prev;
      return rest;
    });
  };

  const setBlueValue = (size: keyof ShirtSizes, val: string) => {
    const cleanDigits = val.replace(/\D/g, '');
    const num = cleanDigits === '' ? 0 : Math.max(0, parseInt(cleanDigits, 10));
    setBlueShirts((prev) => ({ ...prev, [size]: num }));
    setErrors((prev) => {
      const { shirts, ...rest } = prev;
      return rest;
    });
  };

  const updateWhite = (size: keyof ShirtSizes, delta: number) => {
    setWhiteShirts((prev) => {
      const nextVal = Math.max(0, (prev[size] || 0) + delta);
      return { ...prev, [size]: nextVal };
    });
    setErrors((prev) => {
      const { shirts, ...rest } = prev;
      return rest;
    });
  };

  const setWhiteValue = (size: keyof ShirtSizes, val: string) => {
    const cleanDigits = val.replace(/\D/g, '');
    const num = cleanDigits === '' ? 0 : Math.max(0, parseInt(cleanDigits, 10));
    setWhiteShirts((prev) => ({ ...prev, [size]: num }));
    setErrors((prev) => {
      const { shirts, ...rest } = prev;
      return rest;
    });
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    setResponsibleCpf(formatted);
    if (touched.cpf) {
      if (formatted.length === 14 && !isValidCPF(formatted)) {
        setErrors((prev) => ({ ...prev, cpf: 'CPF inválido' }));
      } else {
        setErrors((prev) => {
          const { cpf, ...rest } = prev;
          return rest;
        });
      }
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setResponsibleWhatsapp(formatted);
    if (touched.whatsapp && formatted.trim()) {
      setErrors((prev) => {
        const { whatsapp, ...rest } = prev;
        return rest;
      });
    }
  };

  // Step 1 Validation
  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!storeNumber.trim()) newErrors.storeNumber = 'Número da loja é obrigatório';
    if (!storeName.trim()) newErrors.storeName = 'Nome da loja é obrigatório';
    if (!responsibleName.trim()) newErrors.responsibleName = 'Nome do responsável é obrigatório';
    if (!responsibleCpf.trim()) {
      newErrors.cpf = 'CPF é obrigatório';
    } else if (responsibleCpf.replace(/\D/g, '').length === 11 && !isValidCPF(responsibleCpf)) {
      newErrors.cpf = 'CPF inválido';
    }
    if (!responsibleWhatsapp.trim()) newErrors.whatsapp = 'Contato / WhatsApp é obrigatório';
    if (!supervisorName.trim()) newErrors.supervisorName = 'Nome do Supervisor é obrigatório';
    if (!supervisorEmail.trim()) {
      newErrors.supervisorEmail = 'E-mail do Supervisor é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supervisorEmail.trim())) {
      newErrors.supervisorEmail = 'Informe um e-mail válido (ex: supervisor@dominio.com)';
    }

    setErrors((prev) => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  // Step 2 Validation
  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    if (totalShirts === 0) {
      newErrors.shirts = 'Selecione pelo menos uma camiseta para prosseguir';
    }
    setErrors((prev) => {
      const next = { ...prev };
      if (newErrors.shirts) {
        next.shirts = newErrors.shirts;
      } else {
        delete next.shirts;
      }
      return next;
    });
    return Object.keys(newErrors).length === 0;
  };

  const validateAll = () => {
    const step1Valid = validateStep1();
    const step2Valid = validateStep2();
    return step1Valid && step2Valid;
  };

  const goToStep2 = () => {
    setTouched({
      storeNumber: true,
      storeName: true,
      responsibleName: true,
      cpf: true,
      whatsapp: true,
      supervisorName: true,
      supervisorEmail: true,
    });
    if (validateStep1()) {
      // Save cookies when moving forward
      saveIdentificationCookies({
        storeNumber: storeNumber.trim(),
        storeName: storeName.trim(),
        responsibleName: responsibleName.trim(),
        supervisorName: supervisorName.trim(),
        supervisorEmail: supervisorEmail.trim(),
      });
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToStep3 = () => {
    setTouched((prev) => ({ ...prev, shirts: true }));
    if (validateStep2()) {
      setCurrentStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getFormData = (): Partial<Order> => ({
    storeNumber: storeNumber.trim(),
    storeName: storeName.trim(),
    responsibleName: responsibleName.trim(),
    responsibleCpf: responsibleCpf.trim(),
    responsibleWhatsapp: responsibleWhatsapp.trim(),
    supervisorName: supervisorName.trim(),
    supervisorEmail: supervisorEmail.trim(),
    blueShirts,
    whiteShirts,
    blueTotal,
    whiteTotal,
    totalShirts,
    notes: notes.trim(),
    createdAt: new Date().toISOString(),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAll()) {
      if (!validateStep1()) {
        setCurrentStep(1);
      } else if (!validateStep2()) {
        setCurrentStep(2);
      }
      return;
    }

    const formData = getFormData();

    // Persist store & supervisor identification in browser cookies
    saveIdentificationCookies({
      storeNumber: storeNumber.trim(),
      storeName: storeName.trim(),
      responsibleName: responsibleName.trim(),
      supervisorName: supervisorName.trim(),
      supervisorEmail: supervisorEmail.trim(),
    });

    // 1. Trigger mailto: directly with the supervisor email and complete order content
    const mailtoInfo = buildOrderMailtoUrl(formData);
    window.location.href = mailtoInfo.url;

    // 2. Persist in database in background
    await onSubmitOrder(formData);

    // 3. Reset quantities, CPF and contact for next order, keeping identification in cookies
    setResponsibleCpf('');
    setResponsibleWhatsapp('');
    setBlueShirts({ P: 0, M: 0, G: 0, GG: 0 });
    setWhiteShirts({ P: 0, M: 0, G: 0, GG: 0 });
    setNotes('');
    setTouched({});
    setCurrentStep(1);
  };

  const executeClearForm = () => {
    setStoreNumber('');
    setStoreName('');
    setResponsibleName('');
    setResponsibleCpf('');
    setResponsibleWhatsapp('');
    setSupervisorName('');
    setSupervisorEmail('');
    setNotes('');
    setBlueShirts({ P: 0, M: 0, G: 0, GG: 0 });
    setWhiteShirts({ P: 0, M: 0, G: 0, GG: 0 });
    setErrors({});
    setTouched({});
    clearIdentificationCookies();
    setCurrentStep(1);
  };

  const handleDownloadDirect = () => {
    if (!validateAll()) {
      if (!validateStep1()) setCurrentStep(1);
      else if (!validateStep2()) setCurrentStep(2);
      return;
    }
    downloadOrderPdf(getFormData());
  };

  const stepsList = [
    { number: 1, title: 'Identificação', description: 'Loja e Responsável', icon: Store },
    { number: 2, title: 'Cores e Quantidades', description: 'Tamanhos e Observações', icon: Layers },
    { number: 3, title: 'Resumo do Pedido', description: 'Conferência e Envio', icon: FileCheck },
  ];

  return (
    <>
      <form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto space-y-6">
        {/* Wizard Progress Bar Header */}
        <div className="bg-[#131924] border border-[#232c3d] rounded-2xl p-4 sm:p-5 shadow-xl shadow-black/20">
          <div className="grid grid-cols-3 gap-2 sm:gap-4 relative">
            {stepsList.map((step) => {
              const isCompleted = currentStep > step.number;
              const isActive = currentStep === step.number;
              const StepIcon = step.icon;

              return (
                <button
                  type="button"
                  key={`wizard-step-${step.number}`}
                  onClick={() => {
                    if (step.number === 1) setCurrentStep(1);
                    if (step.number === 2 && validateStep1()) setCurrentStep(2);
                    if (step.number === 3 && validateStep1() && validateStep2()) setCurrentStep(3);
                  }}
                  className={`flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl transition-all text-left group ${
                    isActive
                      ? 'bg-blue-600/15 border border-blue-500/40 shadow-md shadow-blue-500/10'
                      : isCompleted
                      ? 'bg-[#0e1420] border border-emerald-500/30 hover:border-emerald-500/60'
                      : 'bg-[#0d121c]/60 border border-transparent hover:border-slate-800 opacity-60'
                  }`}
                >
                  <div
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/40'
                        : isCompleted
                        ? 'bg-emerald-600 text-white'
                        : 'bg-[#1a2333] text-slate-400'
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4 text-white stroke-[3]" /> : step.number}
                  </div>

                  <div className="min-w-0 flex-1 hidden sm:block">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-xs font-bold tracking-tight block truncate ${
                          isActive
                            ? 'text-blue-400'
                            : isCompleted
                            ? 'text-emerald-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {step.title}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 truncate block">
                      {step.description}
                    </span>
                  </div>

                  {/* Mobile label */}
                  <div className="sm:hidden text-center">
                    <span
                      className={`text-[10px] font-bold block ${
                        isActive ? 'text-blue-400' : isCompleted ? 'text-emerald-400' : 'text-slate-400'
                      }`}
                    >
                      {step.title.split(' ')[0]}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ========================================================= */}
        {/* STEP 1: IDENTIFICAÇÃO DA LOJA E RESPONSÁVEL              */}
        {/* ========================================================= */}
        {currentStep === 1 && (
          <div className="bg-[#131924] border border-[#232c3d] rounded-2xl p-5 sm:p-7 shadow-xl shadow-black/20 space-y-6 animate-in fade-in-50 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Etapa 1 de 3
                </span>
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Identificação da Loja e Responsável
                </h2>
              </div>
            </div>

            <div className="space-y-4">
              {/* Row 1: Loja Number & Loja Name */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                <div className="sm:col-span-5">
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Número da Loja <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    id="input-store-number"
                    value={storeNumber}
                    onChange={(e) => {
                      setStoreNumber(e.target.value);
                      if (errors.storeNumber) {
                        setErrors((p) => {
                          const { storeNumber, ...r } = p;
                          return r;
                        });
                      }
                    }}
                    onBlur={() => setTouched((p) => ({ ...p, storeNumber: true }))}
                    placeholder="Ex: 01, 102, 305..."
                    className={`w-full bg-[#0d121c] border ${
                      errors.storeNumber && touched.storeNumber
                        ? 'border-rose-500 focus:ring-rose-500'
                        : 'border-[#263245] focus:border-blue-500 focus:ring-blue-500/30'
                    } rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all`}
                  />
                  {errors.storeNumber && touched.storeNumber && (
                    <p className="mt-1 text-xs text-rose-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.storeNumber}
                    </p>
                  )}
                </div>

                <div className="sm:col-span-7">
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Nome da Loja <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    id="input-store-name"
                    value={storeName}
                    onChange={(e) => {
                      setStoreName(e.target.value);
                      if (errors.storeName) {
                        setErrors((p) => {
                          const { storeName, ...r } = p;
                          return r;
                        });
                      }
                    }}
                    onBlur={() => setTouched((p) => ({ ...p, storeName: true }))}
                    placeholder="Ex: Supermercado Centro, Filial Norte..."
                    className={`w-full bg-[#0d121c] border ${
                      errors.storeName && touched.storeName
                        ? 'border-rose-500 focus:ring-rose-500'
                        : 'border-[#263245] focus:border-blue-500 focus:ring-blue-500/30'
                    } rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all`}
                  />
                  {errors.storeName && touched.storeName && (
                    <p className="mt-1 text-xs text-rose-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.storeName}
                    </p>
                  )}
                </div>
              </div>

              {/* Row 2: Responsável pelo Pedido */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Responsável pelo Pedido — Nome Completo <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  id="input-responsible-name"
                  value={responsibleName}
                  onChange={(e) => {
                    setResponsibleName(e.target.value);
                    if (errors.responsibleName) {
                      setErrors((p) => {
                        const { responsibleName, ...r } = p;
                        return r;
                      });
                    }
                  }}
                  onBlur={() => setTouched((p) => ({ ...p, responsibleName: true }))}
                  placeholder="Nome de quem está realizando a solicitação na loja..."
                  className={`w-full bg-[#0d121c] border ${
                    errors.responsibleName && touched.responsibleName
                      ? 'border-rose-500 focus:ring-rose-500'
                      : 'border-[#263245] focus:border-blue-500 focus:ring-blue-500/30'
                  } rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all`}
                />
                {errors.responsibleName && touched.responsibleName && (
                  <p className="mt-1 text-xs text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.responsibleName}
                  </p>
                )}
              </div>

              {/* Row 3: CPF and WhatsApp - Always empty on reload */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    CPF do Responsável <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    id="input-responsible-cpf"
                    value={responsibleCpf}
                    onChange={handleCpfChange}
                    onBlur={() => setTouched((p) => ({ ...p, cpf: true }))}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    className={`w-full bg-[#0d121c] border ${
                      errors.cpf && touched.cpf
                        ? 'border-rose-500 focus:ring-rose-500'
                        : 'border-[#263245] focus:border-blue-500 focus:ring-blue-500/30'
                    } rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all font-mono`}
                  />
                  {errors.cpf && touched.cpf && (
                    <p className="mt-1 text-xs text-rose-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.cpf}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Contato / WhatsApp <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    id="input-responsible-whatsapp"
                    value={responsibleWhatsapp}
                    onChange={handlePhoneChange}
                    onBlur={() => setTouched((p) => ({ ...p, whatsapp: true }))}
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                    className={`w-full bg-[#0d121c] border ${
                      errors.whatsapp && touched.whatsapp
                        ? 'border-rose-500 focus:ring-rose-500'
                        : 'border-[#263245] focus:border-blue-500 focus:ring-blue-500/30'
                    } rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all font-mono`}
                  />
                  {errors.whatsapp && touched.whatsapp && (
                    <p className="mt-1 text-xs text-rose-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.whatsapp}
                    </p>
                  )}
                </div>
              </div>

              {/* Row 4: Supervisor e Email */}
              <div className="pt-3 border-t border-slate-800/80">
                <div className="p-4 bg-[#0d121c] border border-blue-900/30 rounded-xl space-y-3.5">
                  <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs uppercase tracking-wider">
                    <UserCheck className="w-4 h-4" />
                    <span>Supervisor Responsável (Destinatário do Pedido)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Supervisor Responsável <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        id="input-supervisor-name"
                        value={supervisorName}
                        onChange={(e) => {
                          setSupervisorName(e.target.value);
                          if (errors.supervisorName) {
                            setErrors((p) => {
                              const { supervisorName, ...r } = p;
                              return r;
                            });
                          }
                        }}
                        onBlur={() => setTouched((p) => ({ ...p, supervisorName: true }))}
                        placeholder="Ex: Carlos Silva, Juliana Souza..."
                        className={`w-full bg-[#131924] border ${
                          errors.supervisorName && touched.supervisorName
                            ? 'border-rose-500 focus:ring-rose-500'
                            : 'border-[#263245] focus:border-blue-500 focus:ring-blue-500/30'
                        } rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all`}
                      />
                      {errors.supervisorName && touched.supervisorName && (
                        <p className="mt-1 text-xs text-rose-400 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {errors.supervisorName}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        E-mail do Supervisor <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="email"
                        id="input-supervisor-email"
                        value={supervisorEmail}
                        onChange={(e) => {
                          setSupervisorEmail(e.target.value);
                          if (errors.supervisorEmail) {
                            setErrors((p) => {
                              const { supervisorEmail, ...r } = p;
                              return r;
                            });
                          }
                        }}
                        onBlur={() => setTouched((p) => ({ ...p, supervisorEmail: true }))}
                        placeholder="supervisor@exemplo.com"
                        className={`w-full bg-[#131924] border ${
                          errors.supervisorEmail && touched.supervisorEmail
                            ? 'border-rose-500 focus:ring-rose-500'
                            : 'border-[#263245] focus:border-blue-500 focus:ring-blue-500/30'
                        } rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all`}
                      />
                      {errors.supervisorEmail && touched.supervisorEmail && (
                        <p className="mt-1 text-xs text-rose-400 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {errors.supervisorEmail}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Footer Step 1 */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800/80">
              <button
                type="button"
                id="btn-clear-step1"
                onClick={() => setIsClearModalOpen(true)}
                className="w-full sm:w-auto px-4 py-2.5 text-slate-400 hover:text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Limpar todos os campos</span>
              </button>

              <button
                type="button"
                id="btn-next-step-1"
                onClick={goToStep2}
                className="w-full sm:w-auto px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <span>Avançar para Cores e Quantidades</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 2: CORES E QUANTIDADES COM OBSERVAÇÕES              */}
        {/* ========================================================= */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in-50 duration-200">
            {/* Blue Shirts Card */}
            <div className="bg-[#131924] border border-[#232c3d] rounded-2xl p-5 sm:p-7 shadow-xl shadow-black/20">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div className="flex items-start gap-3">
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 mt-0.5">
                    Azul
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded bg-blue-500 shadow-sm shadow-blue-500/50 inline-block"></span>
                      <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                        Camisetas Azuis — Serviços Gerais
                      </h2>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Digite o número ou use os botões + e -
                    </p>
                  </div>
                </div>

                <div className="px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-xs font-semibold text-blue-400 self-start sm:self-center">
                  Subtotal: <span className="text-white font-bold ml-1">{blueTotal}</span>
                </div>
              </div>

              {/* Grid of sizes: P, M, G, GG */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                {(['P', 'M', 'G', 'GG'] as (keyof ShirtSizes)[]).map((size) => (
                  <div
                    key={`blue-${size}`}
                    className="bg-[#0d121c] border border-[#232c3d] rounded-xl p-3.5 flex flex-col items-center hover:border-slate-700 transition-colors"
                  >
                    <label className="text-xs font-bold text-slate-300 mb-2.5">Tamanho {size}</label>
                    <div className="flex items-center justify-between w-full bg-[#161d2a] border border-[#2a3548] rounded-xl p-1.5 gap-1.5">
                      <button
                        type="button"
                        id={`btn-dec-blue-${size}`}
                        onClick={() => updateBlue(size, -1)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#0d121c] border border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-700 active:scale-95 transition-all shrink-0"
                        title="Diminuir quantidade"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      
                      {/* Highlighted box for the number */}
                      <div className="flex-1 bg-[#0b0f17] border-2 border-blue-500/50 focus-within:border-blue-400 rounded-lg py-1 px-1 flex items-center justify-center shadow-inner shadow-black/50">
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          id={`input-blue-${size}`}
                          value={blueShirts[size] === 0 ? '' : blueShirts[size]}
                          placeholder="0"
                          onChange={(e) => setBlueValue(size, e.target.value)}
                          className="w-full text-center bg-transparent text-base sm:text-lg font-extrabold text-blue-400 placeholder:text-slate-600 focus:text-white focus:outline-none"
                        />
                      </div>

                      <button
                        type="button"
                        id={`btn-inc-blue-${size}`}
                        onClick={() => updateBlue(size, 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#0d121c] border border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-700 active:scale-95 transition-all shrink-0"
                        title="Aumentar quantidade"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* White Shirts Card */}
            <div className="bg-[#131924] border border-[#232c3d] rounded-2xl p-5 sm:p-7 shadow-xl shadow-black/20">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div className="flex items-start gap-3">
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-700/30 text-slate-300 border border-slate-600/30 mt-0.5">
                    Branca
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded bg-slate-100 border border-slate-300 shadow-sm inline-block"></span>
                      <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                        Camisetas Brancas — Perecíveis
                      </h2>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Digite o número ou use os botões + e -
                    </p>
                  </div>
                </div>

                <div className="px-3.5 py-1.5 rounded-full bg-slate-500/10 border border-slate-500/30 text-xs font-semibold text-slate-300 self-start sm:self-center">
                  Subtotal: <span className="text-white font-bold ml-1">{whiteTotal}</span>
                </div>
              </div>

              {/* Grid of sizes: P, M, G, GG */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                {(['P', 'M', 'G', 'GG'] as (keyof ShirtSizes)[]).map((size) => (
                  <div
                    key={`white-${size}`}
                    className="bg-[#0d121c] border border-[#232c3d] rounded-xl p-3.5 flex flex-col items-center hover:border-slate-700 transition-colors"
                  >
                    <label className="text-xs font-bold text-slate-300 mb-2.5">Tamanho {size}</label>
                    <div className="flex items-center justify-between w-full bg-[#161d2a] border border-[#2a3548] rounded-xl p-1.5 gap-1.5">
                      <button
                        type="button"
                        id={`btn-dec-white-${size}`}
                        onClick={() => updateWhite(size, -1)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#0d121c] border border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-700 active:scale-95 transition-all shrink-0"
                        title="Diminuir quantidade"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      
                      {/* Highlighted box for the number */}
                      <div className="flex-1 bg-[#0b0f17] border-2 border-slate-500/60 focus-within:border-slate-300 rounded-lg py-1 px-1 flex items-center justify-center shadow-inner shadow-black/50">
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          id={`input-white-${size}`}
                          value={whiteShirts[size] === 0 ? '' : whiteShirts[size]}
                          placeholder="0"
                          onChange={(e) => setWhiteValue(size, e.target.value)}
                          className="w-full text-center bg-transparent text-base sm:text-lg font-extrabold text-slate-100 placeholder:text-slate-600 focus:text-white focus:outline-none"
                        />
                      </div>

                      <button
                        type="button"
                        id={`btn-inc-white-${size}`}
                        onClick={() => updateWhite(size, 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#0d121c] border border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-700 active:scale-95 transition-all shrink-0"
                        title="Aumentar quantidade"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Observações Card */}
            <div className="bg-[#131924] border border-[#232c3d] rounded-2xl p-5 sm:p-6 shadow-xl shadow-black/20">
              <div className="flex items-center gap-3 mb-3">
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  Obs
                </span>
                <h2 className="text-sm font-semibold text-slate-300">Observações do Pedido (Opcional)</h2>
              </div>
              <textarea
                id="input-order-notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex.: Observações sobre entrega, turno preferencial, setor específico da loja..."
                className="w-full bg-[#0d121c] border border-[#263245] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all"
              />
            </div>

            {/* Error banner if 0 shirts selected */}
            {errors.shirts && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-sm text-rose-400 flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{errors.shirts}</span>
              </div>
            )}

            {/* Total Counter Banner & Step 2 Footer */}
            <div className="bg-[#131924] border border-[#232c3d] rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl shadow-black/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center font-mono font-bold text-blue-400 text-lg">
                  {totalShirts}
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Total de Camisetas Selecionadas</span>
                  <span className="text-sm font-bold text-white">
                    {blueTotal} Azuis + {whiteTotal} Brancas
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  id="btn-back-step-2"
                  onClick={() => {
                    setCurrentStep(1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="flex-1 sm:flex-initial px-4 py-3 bg-[#172030] hover:bg-[#1f2b40] text-slate-300 hover:text-white border border-slate-700/80 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Voltar</span>
                </button>

                <button
                  type="button"
                  id="btn-next-step-2"
                  onClick={goToStep3}
                  className="flex-1 sm:flex-initial px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  <span>Avançar para o Resumo</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 3: RESUMO DO PEDIDO                                 */}
        {/* ========================================================= */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in-50 duration-200">
            <div className="bg-[#131924] border border-[#232c3d] rounded-2xl p-5 sm:p-7 shadow-xl shadow-black/20 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    Etapa 3 de 3
                  </span>
                  <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    Resumo e Confirmação da Requisição
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Editar Dados</span>
                </button>
              </div>

              {/* Summary Section 1: Store & People */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Store & Requester Card */}
                <div className="bg-[#0d121c] border border-[#232c3d] rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5 text-blue-400" />
                      Dados da Loja e Solicitante
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="text-[11px] text-blue-400 hover:underline"
                    >
                      Alterar
                    </button>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">Loja:</span>
                      <span className="font-semibold text-white">Nº {storeNumber} — {storeName}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">Responsável:</span>
                      <span className="font-semibold text-white">{responsibleName}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">CPF:</span>
                      <span className="font-mono text-slate-200">{responsibleCpf || 'Não informado'}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">WhatsApp / Contato:</span>
                      <span className="font-mono text-slate-200">{responsibleWhatsapp || 'Não informado'}</span>
                    </div>
                  </div>
                </div>

                {/* Supervisor Recipient Card */}
                <div className="bg-[#0d121c] border border-blue-900/30 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider text-blue-400 font-bold flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5" />
                      Destinatário do Pedido
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="text-[11px] text-blue-400 hover:underline"
                    >
                      Alterar
                    </button>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">Supervisor:</span>
                      <span className="font-semibold text-white">{supervisorName}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">E-mail:</span>
                      <span className="font-medium text-blue-400 break-all">{supervisorEmail}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-blue-950/40 border border-blue-900/40 text-[11px] text-blue-300 mt-2 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>O pedido será direcionado ao e-mail deste supervisor.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary Section 2: Shirts Breakdown Grid */}
              <div className="bg-[#0d121c] border border-[#232c3d] rounded-xl p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-400" />
                    Grade de Camisetas Solicitadas
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="text-[11px] text-blue-400 hover:underline"
                  >
                    Alterar Quantidades
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Blue Shirts Summary */}
                  <div className="bg-[#131924] border border-[#263245] rounded-xl p-3.5 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                        <span className="text-xs font-bold text-white">Azuis — Serviços Gerais</span>
                      </div>
                      <span className="text-xs font-bold text-blue-400 font-mono">{blueTotal} un</span>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-center">
                      {(['P', 'M', 'G', 'GG'] as (keyof ShirtSizes)[]).map((sz) => (
                        <div key={`summary-blue-${sz}`} className="bg-[#0d121c] rounded-lg p-2 border border-slate-800">
                          <span className="text-[11px] font-medium text-slate-400 block">{sz}</span>
                          <span className="text-sm font-extrabold text-blue-400 font-mono">
                            {blueShirts[sz] || 0}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* White Shirts Summary */}
                  <div className="bg-[#131924] border border-[#263245] rounded-xl p-3.5 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-slate-300"></span>
                        <span className="text-xs font-bold text-white">Brancas — Perecíveis</span>
                      </div>
                      <span className="text-xs font-bold text-slate-300 font-mono">{whiteTotal} un</span>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-center">
                      {(['P', 'M', 'G', 'GG'] as (keyof ShirtSizes)[]).map((sz) => (
                        <div key={`summary-white-${sz}`} className="bg-[#0d121c] rounded-lg p-2 border border-slate-800">
                          <span className="text-[11px] font-medium text-slate-400 block">{sz}</span>
                          <span className="text-sm font-extrabold text-slate-100 font-mono">
                            {whiteShirts[sz] || 0}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Grand Total Display */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                  <span className="text-sm font-bold text-white">Total Geral de Camisetas:</span>
                  <div className="flex items-baseline gap-1.5 font-mono">
                    <span className="text-2xl font-extrabold text-blue-400">{totalShirts}</span>
                    <span className="text-xs text-slate-400">unidades</span>
                  </div>
                </div>
              </div>

              {/* Summary Section 3: Notes if any */}
              {notes.trim() && (
                <div className="bg-[#0d121c] border border-[#232c3d] rounded-xl p-4 space-y-1.5">
                  <span className="text-xs uppercase tracking-wider text-slate-400 font-bold block">
                    Observações Adicionais
                  </span>
                  <p className="text-xs text-slate-300 whitespace-pre-wrap">{notes}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 space-y-3">
                <button
                  type="submit"
                  id="btn-submit-order"
                  disabled={isSubmitting}
                  className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl text-base shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2.5 transition-all transform active:scale-[0.98]"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Processando Requisição...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Confirmar e Enviar Requisição</span>
                    </>
                  )}
                </button>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    id="btn-download-pdf-direct"
                    onClick={handleDownloadDirect}
                    className="w-full py-3 px-4 bg-[#172030] hover:bg-[#1f2b40] text-slate-200 hover:text-white border border-slate-700/80 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
                  >
                    <Download className="w-4 h-4 text-emerald-400" />
                    <span>Baixar Comprovante em PDF</span>
                  </button>

                  <button
                    type="button"
                    id="btn-back-step-3"
                    onClick={() => {
                      setCurrentStep(2);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="w-full py-3 px-4 bg-[#0d121c] hover:bg-[#131924] text-slate-300 hover:text-white border border-slate-800 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Voltar para Ajustar</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </form>

      {/* Confirmation Modal for Clearing the form */}
      <ConfirmClearModal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={executeClearForm}
      />
    </>
  );
};
