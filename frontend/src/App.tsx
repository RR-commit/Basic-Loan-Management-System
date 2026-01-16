
import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { loadToken } from "./api/client";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import ApplyLoan from "./pages/ApplyLoan";
import MyLoans from "./pages/MyLoans";
import Admin from "./pages/Admin";
import Nav from "./components/Nav";

export default function App() {
  useEffect(() => {
    loadToken();
  }, []);
  
  return (
    <>
      <Nav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/apply" element={<ApplyLoan />} />
        <Route path="/my-loans" element={<MyLoans />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<div style={{ padding: 20 }}>Not Found</div>} />
      </Routes>
    </>
  );
}
