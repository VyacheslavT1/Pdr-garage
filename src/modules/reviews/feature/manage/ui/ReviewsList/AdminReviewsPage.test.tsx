import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminReviewsPage from "./AdminReviewsPage";

jest.mock("@/shared/ui/admin-nav/AdminNav", () => ({
  __esModule: true,
  default: () => <nav data-testid="admin-nav" />,
}));

jest.mock("antd", () => {
  const React = require("react");

  const Typography = {
    Title: ({ children, ...rest }: { children: React.ReactNode }) => (
      <h1 {...rest}>{children}</h1>
    ),
    Text: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  };

  const Button = ({
    children,
    ...rest
  }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button type="button" {...rest}>
      {children}
    </button>
  );

  const Space = ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  );
  const Card = ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  );
  const Tag = ({ children }: { children: React.ReactNode }) => (
    <span>{children}</span>
  );

  const Table = ({
    dataSource = [],
    columns = [],
    loading,
  }: {
    dataSource: any[];
    columns: any[];
    loading?: boolean;
  }) => (
    <div data-testid="reviews-table" data-loading={loading ? "true" : "false"}>
      {dataSource.map((record) => (
        <div key={record.id} data-testid="reviews-row">
          {columns.map((column, index) => {
            const key = column.key ?? column.dataIndex ?? index;
            const value =
              column.dataIndex && record[column.dataIndex] !== undefined
                ? record[column.dataIndex]
                : undefined;
            return (
              <div key={key}>
                {column.render ? column.render(value, record) : value}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );

  return { Typography, Button, Space, Card, Table, Tag };
});

const realLocation = window.location;

beforeAll(() => {
  delete (window as any).location;
});

beforeEach(() => {
  (window as any).location = { href: "" };
});

afterAll(() => {
  (window as any).location = realLocation;
});

describe("AdminReviewsPage", () => {
  let fetchMock: jest.SpyInstance;

  beforeEach(() => {
    fetchMock = jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        items: [
          {
            id: "rev-1",
            clientName: "Alice",
            status: "Publié",
            updatedAt: "2024-01-01T00:00:00.000Z",
          },
        ],
      }),
    } as unknown as Response);
  });

  afterEach(() => {
    fetchMock.mockRestore();
  });

  it("renders fetched reviews and navigates to details when action button is clicked", async () => {
    const user = userEvent.setup();
    render(<AdminReviewsPage />);

    await screen.findByText("Alice");
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    const traiterButton = screen.getByRole("button", { name: "Traiter" });
    await user.click(traiterButton);

    expect((window as any).location.href).toBe("/admin/reviews/rev-1");

    const refreshButton = screen.getByRole("button", { name: "Actualiser" });
    await user.click(refreshButton);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("shows diagnostic information when fetching reviews fails in development", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({}),
    } as unknown as Response);

    const previousEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    try {
      render(<AdminReviewsPage />);
      await waitFor(() =>
        expect(fetchMock).toHaveBeenCalledTimes(1),
      );
      const errorMessage = await screen.findByText(
        /Informations techniques: HTTP 500/,
      );
      expect(errorMessage).toBeInTheDocument();
    } finally {
      process.env.NODE_ENV = previousEnv;
    }
  });

  it("renders error block when refresh fails in development", async () => {
    const previousEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    try {
      const user = userEvent.setup();
      render(<AdminReviewsPage />);
      await screen.findByText("Alice");

      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({}),
      } as Response);

      const refreshButton = screen.getByRole("button", { name: "Actualiser" });
      await user.click(refreshButton);

      await screen.findByText("Informations techniques: HTTP 500");
    } finally {
      process.env.NODE_ENV = previousEnv;
    }
  });

  it("ignores unauthorized refresh responses and keeps existing data", async () => {
    const user = userEvent.setup();
    render(<AdminReviewsPage />);

    await screen.findByText("Alice");

    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({}),
    } as unknown as Response);

    const refreshButton = screen.getByRole("button", { name: "Actualiser" });
    await user.click(refreshButton);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });
});
