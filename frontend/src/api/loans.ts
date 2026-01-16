
import API from "./client";
import { Loan, LoanCreate, LoanStatus } from "../types";

export async function applyLoan(payload: LoanCreate): Promise<Loan> {
  const { data } = await API.post<Loan>("/loans/", payload);
  return data;
}
export async function getMyLoans(status?: LoanStatus): Promise<Loan[]> {
  const params = status ? { status_filter: status } : {};
  const { data } = await API.get<Loan[]>("/loans/my", { params });
  return data;
}
export async function getPendingLoans(): Promise<Loan[]> {
  const { data } = await API.get<Loan[]>("/loans/pending");
  return data;
}
export async function decideLoan(loanId: number, action?: "APPROVED" | "REJECTED"): Promise<Loan> {
  const body = action ? { action } : {};
  const { data } = await API.post<Loan>(`/loans/${loanId}/decision`, body);
  return data;
}
