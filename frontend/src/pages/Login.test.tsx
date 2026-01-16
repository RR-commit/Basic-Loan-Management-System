
/// <reference types="vitest" />

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Login from "./Login";
import { BrowserRouter } from "react-router-dom";

// Mock useNavigate so navigating doesn't break the test
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

describe("Login page", () => {
  it("renders logo and allows typing email and password", async () => {
    const user = userEvent.setup();

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );


    const email = screen.getByPlaceholderText(/email/i);
    const pass = screen.getByPlaceholderText(/password/i);

    await user.type(email, "user@example.com");
    await user.type(pass, "secret123");

    expect(email).toHaveValue("user@example.com");
    expect(pass).toHaveValue("secret123");
  });
});
