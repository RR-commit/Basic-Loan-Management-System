
import axios from "axios";

const API = axios.create({ baseURL: "http://127.0.0.1:8080" });

const TOKEN_KEY = "access_token";

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
  API.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}
export function loadToken() {
  const t = localStorage.getItem(TOKEN_KEY);
  if (t) API.defaults.headers.common["Authorization"] = `Bearer ${t}`;
  return t;
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  delete API.defaults.headers.common["Authorization"];
}

export default API;
