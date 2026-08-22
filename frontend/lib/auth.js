// Gerência simples da sessão do admin no navegador (localStorage).
export const auth = {
  save(token, admin) {
    localStorage.setItem("admin_token", token);
    localStorage.setItem("admin_user", JSON.stringify(admin));
  },
  getUser() {
    try {
      return JSON.parse(localStorage.getItem("admin_user") || "null");
    } catch {
      return null;
    }
  },
  getToken() {
    return localStorage.getItem("admin_token");
  },
  logout() {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
  },
};
