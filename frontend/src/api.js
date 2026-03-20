import axios from "axios";

const API = process.env.REACT_APP_API_URL;

// ✅ create axios instance
const api = axios.create({
  baseURL: API,
});

// 🔐 Attach JWT token
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem("gs_token");
  if (token) {
    cfg.headers.Authorization = `Bearer ${token}`;
  }
  return cfg;
});

// 🚪 Auto logout on 401
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.clear();
      window.location.href = "/";
    }
    return Promise.reject(err);
  }
);

//
// 🔥 API FUNCTIONS (IMPORTANT PART)
//

export const authAPI = {
  login: (data) => api.post("/auth/login", data),
  register: (data) => api.post("/auth/register", data),
  me: () => api.get("/auth/me"),
  createAdmin: (data) => api.post("/auth/create-admin", data),
};

export const workersAPI = {
  onboard: (data) => api.post("/workers/onboard", data),
  list: (skip=0, limit=50) =>
    api.get(`/workers/?skip=${skip}&limit=${limit}`),
  get: (id) => api.get(`/workers/${id}`),
  platforms: () => api.get("/workers/platforms/all"),
};

export const policiesAPI = {
  create: (data) => api.post("/policies/create", data),
  list: (skip=0, limit=50, status="") =>
    api.get(`/policies/?skip=${skip}&limit=${limit}${status ? "&status=" + status : ""}`),
  get: (id) => api.get(`/policies/${id}`),
  forWorker: (wid) => api.get(`/policies/worker/${wid}`),
};

export const claimsAPI = {
  file: (data) => api.post("/claims/file", data),
  list: (skip=0, limit=50, status="") =>
    api.get(`/claims/?skip=${skip}&limit=${limit}${status ? "&status=" + status : ""}`),
  get: (id) => api.get(`/claims/${id}`),
  forWorker: (wid) => api.get(`/claims/worker/${wid}`),
  autoTrigger: () => api.post("/claims/auto-trigger"),
};

export const analyticsAPI = {
  dashboard: () => api.get("/analytics/dashboard"),
  payouts: () => api.get("/analytics/payouts"),
};

export const integrationsAPI = {
  traffic: (city) => api.get(`/integrations/traffic/${city}`),
  platform: (name) => api.get(`/integrations/platform/${name}`),
  platforms: () => api.get("/integrations/platforms/all"),
  processPayout: (data) => api.post("/integrations/payment/payout", data),
  collectPremium: (data) => api.post("/integrations/payment/premium", data),
  paymentMethods: () => api.get("/integrations/payment/methods"),
};

// ✅ optional export (if needed)
export default api;
