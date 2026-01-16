
import { LoanStatus } from "../types";

export default function StatusBadge({ status }: { status: LoanStatus }) {
  const color = status === "PENDING" ? "#f59e0b" : status === "APPROVED" ? "#10b981" : "#ef4444";
  return (
    <span style={{ padding: "2px 6px", borderRadius: 6, background: color, color: "#fff", fontSize: 12 }}>
      {status}
    </span>
  );
}
