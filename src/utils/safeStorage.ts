// In-memory fallback for environments with blocked localStorage (e.g. restrictive iframe sandboxes)
const memoryStorage: Record<string, string> = {};

export const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn(`[Storage Fallback] Failed to read '${key}' from localStorage. Using in-memory fallback:`, e);
      return memoryStorage[key] || null;
    }
  },

  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn(`[Storage Fallback] Failed to write '${key}' to localStorage. Using in-memory fallback:`, e);
      memoryStorage[key] = value;
    }
  },

  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn(`[Storage Fallback] Failed to remove '${key}' from localStorage. Using in-memory fallback:`, e);
      delete memoryStorage[key];
    }
  }
};
