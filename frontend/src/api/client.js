import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  // Tells the browser to send/receive cookies on cross-origin requests to
  // our API. Without this, the httpOnly auth cookies would never reach the
  // backend even though they're set on the same machine.
  withCredentials: true,
});

// Reads a single cookie's value. Only works for cookies that are NOT
// httpOnly — which is exactly why the CSRF cookies are set that way (JS
// needs to read them), while the actual JWT cookies are not (JS must never
// be able to read those).
function getCookie(name) {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]+)`));
  return match ? match[1] : null;
}

// Automatically attaches the CSRF header on any request that changes state.
// GET requests are skipped since flask-jwt-extended only checks CSRF on
// POST/PUT/PATCH/DELETE by default — this mirrors that.
apiClient.interceptors.request.use((config) => {
  const method = (config.method || "get").toLowerCase();

  if (method !== "get") {
    // /auth/refresh is protected by the refresh token, so it needs the
    // refresh CSRF cookie instead of the access one — every other
    // state-changing route uses the access CSRF cookie.
    const isRefreshCall = config.url?.includes("/auth/refresh");
    const csrfToken = getCookie(
      isRefreshCall ? "csrf_refresh_token" : "csrf_access_token"
    );
    if (csrfToken) {
      config.headers["X-CSRF-TOKEN"] = csrfToken;
    }
  }

  return config;
});

export default apiClient;
