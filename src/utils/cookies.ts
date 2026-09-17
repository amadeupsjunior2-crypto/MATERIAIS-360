/**
 * Cookie utilities for persisting non-sensitive store and identification data in browser cache.
 */

export function setCookie(name: string, value: string, days = 365): void {
  try {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    const expires = `expires=${date.toUTCString()}`;
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)};${expires};path=/;SameSite=Lax`;
  } catch (e) {
    console.error('Error saving cookie:', e);
  }
}

export function getCookie(name: string): string | null {
  try {
    const nameEQ = `${encodeURIComponent(name)}=`;
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const c = cookies[i].trim();
      if (c.indexOf(nameEQ) === 0) {
        return decodeURIComponent(c.substring(nameEQ.length));
      }
    }
    return null;
  } catch (e) {
    console.error('Error reading cookie:', e);
    return null;
  }
}

export function removeCookie(name: string): void {
  try {
    document.cookie = `${encodeURIComponent(name)}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=Lax`;
  } catch (e) {
    console.error('Error removing cookie:', e);
  }
}

// Cookie keys used in the app
export const COOKIE_KEYS = {
  STORE_NUMBER: 'sf_req_store_number',
  STORE_NAME: 'sf_req_store_name',
  RESPONSIBLE_NAME: 'sf_req_responsible_name',
  SUPERVISOR_NAME: 'sf_req_supervisor_name',
  SUPERVISOR_EMAIL: 'sf_req_supervisor_email',
} as const;

export function saveIdentificationCookies(data: {
  storeNumber?: string;
  storeName?: string;
  responsibleName?: string;
  supervisorName?: string;
  supervisorEmail?: string;
}) {
  if (data.storeNumber) setCookie(COOKIE_KEYS.STORE_NUMBER, data.storeNumber);
  if (data.storeName) setCookie(COOKIE_KEYS.STORE_NAME, data.storeName);
  if (data.responsibleName) setCookie(COOKIE_KEYS.RESPONSIBLE_NAME, data.responsibleName);
  if (data.supervisorName) setCookie(COOKIE_KEYS.SUPERVISOR_NAME, data.supervisorName);
  if (data.supervisorEmail) setCookie(COOKIE_KEYS.SUPERVISOR_EMAIL, data.supervisorEmail);
}

export function loadIdentificationCookies() {
  return {
    storeNumber: getCookie(COOKIE_KEYS.STORE_NUMBER) || '',
    storeName: getCookie(COOKIE_KEYS.STORE_NAME) || '',
    responsibleName: getCookie(COOKIE_KEYS.RESPONSIBLE_NAME) || '',
    supervisorName: getCookie(COOKIE_KEYS.SUPERVISOR_NAME) || '',
    supervisorEmail: getCookie(COOKIE_KEYS.SUPERVISOR_EMAIL) || '',
  };
}

export function clearIdentificationCookies() {
  removeCookie(COOKIE_KEYS.STORE_NUMBER);
  removeCookie(COOKIE_KEYS.STORE_NAME);
  removeCookie(COOKIE_KEYS.RESPONSIBLE_NAME);
  removeCookie(COOKIE_KEYS.SUPERVISOR_NAME);
  removeCookie(COOKIE_KEYS.SUPERVISOR_EMAIL);
}
