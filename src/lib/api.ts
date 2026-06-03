// Central API base URL — reads from VITE_API_URL env var
// In dev: http://localhost:3000 (from .env.local)
// In production: https://nfc-card-api.onrender.com (from Vercel env var)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export default API_URL
