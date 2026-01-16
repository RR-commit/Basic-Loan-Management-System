
export type Role = "USER" | "ADMIN";
export type LoanStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface TokenOut {
  access_token: string;
  token_type: "bearer";
  role?: "USER" | "ADMIN";
  user_id?: number;
  email?: string;
  full_name?: string;
}

export interface UserRegister {
  full_name: string;
  email: string;
  password: string;
  confirm_password: string;
  role: Role;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface Loan {
  id: number;
  user_id: number;
  amount: number;
  income: number;
  credit_score: number;
  term_months: number;
  status: LoanStatus;
  risk_score: number;
}

export interface LoanCreate {
  amount: number;
  income: number;
  credit_score: number;
  term_months: number;
}
