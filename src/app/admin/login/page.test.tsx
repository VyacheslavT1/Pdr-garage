import React from "react";
import { act, render, screen } from "@testing-library/react";
import AdminLoginPage from "./page";

let latestOnFinish: ((values: {
  email: string;
  password: string;
  rememberMe?: boolean;
}) => Promise<void> | void) | null = null;

const pushMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

jest.mock("antd", () => {
  const React = require("react");

  const Form = ({
    children,
    onFinish,
  }: {
    children: React.ReactNode;
    onFinish?: (values: unknown) => void | Promise<void>;
  }) => {
    latestOnFinish = onFinish ?? null;
    return (
      <form data-testid="admin-login-form">
        {children}
      </form>
    );
  };
  Form.Item = ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  );

  const Input = (props: React.ComponentProps<"input">) => <input {...props} />;
  Input.Password = (
    props: React.ComponentProps<"input"> & { type?: string },
  ) => <input type="password" {...props} />;

  const Button = ({
    children,
    htmlType = "button",
  }: {
    children: React.ReactNode;
    htmlType?: "button" | "submit";
  }) => <button type={htmlType}>{children}</button>;

  const Checkbox = ({
    children,
    ...rest
  }: {
    children: React.ReactNode;
  }) => (
    <label>
      <input type="checkbox" {...rest} />
      {children}
    </label>
  );

  const Typography = {
    Title: ({ children }: { children: React.ReactNode }) => <h3>{children}</h3>,
    Text: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  };

  const Card = ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  );

  return { Form, Input, Button, Checkbox, Typography, Card };
});

async function submitForm(values: {
  email: string;
  password: string;
  rememberMe?: boolean;
}) {
  await act(async () => {
    await latestOnFinish?.(values);
  });
}

describe("AdminLoginPage", () => {
  beforeEach(() => {
    latestOnFinish = null;
    pushMock.mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("submits credentials and redirects on success", async () => {
    const fetchMock = jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
    } as Response);

    render(<AdminLoginPage />);
    await submitForm({
      email: "user@example.com",
      password: "password123",
      rememberMe: true,
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "user@example.com",
        password: "password123",
        rememberMe: true,
      }),
      credentials: "include",
    });
    expect(pushMock).toHaveBeenCalledWith("/admin");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows an error message when credentials are rejected", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
    } as Response);

    render(<AdminLoginPage />);
    await submitForm({
      email: "user@example.com",
      password: "password123",
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Identifiants incorrects",
    );
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("shows a network error when the request fails", async () => {
    jest.spyOn(global, "fetch").mockRejectedValue(new Error("network error"));

    render(<AdminLoginPage />);
    await submitForm({
      email: "user@example.com",
      password: "password123",
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Erreur réseau. Réessayez",
    );
    expect(pushMock).not.toHaveBeenCalled();
  });
});
