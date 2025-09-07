// Dynamic base URL configuration for different environments
const getBaseUrl = () => {
  // Check if we're in development mode
  if (import.meta.env.DEV) {
    // For local development, you can uncomment the local URL if needed
    // return "http://127.0.0.1:5000/api";
    return "https://new-bytewise-backend-production-8c33.up.railway.app/api";
  }
  
  // For production, use environment variable or fallback to current production URL
  return import.meta.env.VITE_API_BASE_URL || "https://new-bytewise-backend-production-8c33.up.railway.app/api";
};

export const BASE_URL = getBaseUrl();