import axios from "axios";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// 401s from the silent "am I logged in?" check on mount are expected for
// anonymous visitors and must never trigger a redirect — otherwise a public
// page (login, register, home) reloads itself into an infinite loop.
declare module "axios" {
  export interface AxiosRequestConfig {
    silent?: boolean;
  }
}

// Student API — session lives in an httpOnly "token" cookie, never touched by JS.
const api = axios.create({ baseURL: BASE, withCredentials: true });
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !err.config?.silent) {
      localStorage.removeItem("user");
      if (window.location.pathname !== "/login") window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// Admin API — httpOnly "admin_token" cookie, independent from the student session.
// The X-Auth-Scope header tells the backend which cookie to read, since both
// cookies are sent to the same origin regardless of which axios instance is used.
export const adminApi = axios.create({ baseURL: BASE, withCredentials: true });
adminApi.interceptors.request.use((config) => {
  config.headers["X-Auth-Scope"] = "admin";
  return config;
});
adminApi.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !err.config?.silent) {
      localStorage.removeItem("admin_user");
      if (window.location.pathname !== "/admin/login") window.location.href = "/admin/login";
    }
    return Promise.reject(err);
  }
);

export default api;
