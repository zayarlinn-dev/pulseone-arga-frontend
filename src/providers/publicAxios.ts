import axios from 'axios';
import { CONFIG } from '@/config/constants';

/**
 * Axios instance for unauthenticated endpoints (login, token refresh).
 * It deliberately has no interceptors: there is no session to attach or renew.
 */
const publicApi = axios.create({
  baseURL: CONFIG.apiUrl,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

export default publicApi;
