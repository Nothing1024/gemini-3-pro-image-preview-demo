export const createSessionId = () => `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
