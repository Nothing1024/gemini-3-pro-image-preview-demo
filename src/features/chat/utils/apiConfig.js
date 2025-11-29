const API_URL_KEY = 'gemini_api_url';
const API_KEY_KEY = 'gemini_api_key';

export const apiConfig = {
  getUrl: () => localStorage.getItem(API_URL_KEY) || '',
  getKey: () => localStorage.getItem(API_KEY_KEY) || '',
  setUrl: (url) => localStorage.setItem(API_URL_KEY, url),
  setKey: (key) => localStorage.setItem(API_KEY_KEY, key),
  isConfigured: () => !!(localStorage.getItem(API_URL_KEY) && localStorage.getItem(API_KEY_KEY)),
  clear: () => {
    localStorage.removeItem(API_URL_KEY);
    localStorage.removeItem(API_KEY_KEY);
  },
};
