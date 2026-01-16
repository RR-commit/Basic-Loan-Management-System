
import API, { setToken, clearToken } from "./client";
import { TokenOut, LoginRequest, UserRegister } from "../types";

export async function registerUser(payload: UserRegister) {
  const { data } = await API.post("/auth/register", payload);
  return data;
}
export async function login(payload: LoginRequest): Promise<TokenOut> {
  const { data } = await API.post<TokenOut>("/auth/login", payload);
  setToken(data.access_token);
  // Store user role and info for routing and tracking
  if (data.role) localStorage.setItem("user_role", data.role);
  if (data.user_id) localStorage.setItem("user_id", data.user_id.toString());
  if (data.email) localStorage.setItem("user_email", data.email);
  if (data.full_name) localStorage.setItem("full_name", data.full_name);
  return data;
}

export async function logout() {
  try {
    // Call backend logout endpoint to log endtime in MongoDB
    await API.post("/auth/logout");
  } catch (error) {
    console.error("Logout API call failed", error);
  }
  clearToken();
  localStorage.removeItem("user_role");
  localStorage.removeItem("user_id");
  localStorage.removeItem("user_email");
  localStorage.removeItem("full_name");
}
