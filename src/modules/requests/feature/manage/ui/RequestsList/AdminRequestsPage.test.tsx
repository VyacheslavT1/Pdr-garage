import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminRequestsPage from "./AdminRequestsPage";

jest.mock("@/shared/ui/admin-nav/AdminNav", () => ({
  __esModule: true,
  default: () => <nav data-testid="admin-nav" />,
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    children,
    href,
    onClick,
    ...rest
  }: React.ComponentProps<"a">) => (
    <a
      href={href as string}
      onClick={(event) => {
        onClick?.(event as any);
      }}
      {...rest}
    >
      {children}
    </a>
  ),
}));

jest.mock("antd", () => {
  const React = require("react");

  const Typography = {
    Title: ({ children }: { children: React.ReactNode }) => <h1>{children}</h1>,
    Text: ({ children }: { children: React.ReactNode }) => (
      <span>{children}</span>
    ),
  };

  const Button = ({
    children,
    onClick,
    ...rest
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    danger?: boolean;
    loading?: boolean;
    type?: "primary" | "default";
    size?: "small" | "middle" | "large";
  }) => {
    const {
      danger: _danger,
      loading: _loading,
      type: _type,
      size: _size,
      ...buttonProps
    } = rest as any;
    return (
      <button type="button" onClick={onClick} {...buttonProps}>
        {children}
      </button>
    );
  };

  // ВАЖНО: два триггера — обычный поиск "doe" и пустой поиск ""
  const Input = {
    Search: ({ onSearch }: { onSearch?: (value: string) => void }) => (
      <div>
        <button onClick={() => onSearch?.("doe")} data-testid="search-button">
          run search
        </button>
        <button
          onClick={() => onSearch?.("")}
          data-testid="search-empty-button"
          style={{ display: "none" }}
        >
          run empty search
        </button>
      </div>
    ),
  };

  const Select = ({
    onChange,
    options = [],
  }: {
    onChange?: (value: unknown) => void;
    options?: Array<{ label: string; value: string }>;
  }) => (
    <select
      data-testid="status-filter"
      onChange={(event) => onChange?.(event.target.value)}
    >
      <option value="">Select</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );

  const DatePicker = {
    RangePicker: ({
      onChange,
    }: {
      onChange?: (
        range: [{ format: () => string }, { format: () => string }] | null
      ) => void;
    }) => (
      <button
        type="button"
        data-testid="date-range"
        onClick={() =>
          onChange?.([
            { format: () => "2024-01-01" },
            { format: () => "2024-01-31" },
          ])
        }
      >
        range
      </button>
    ),
  };

  const Card = ({ children }: { children: React.ReactNode }) => (
    <section>{children}</section>
  );

  const Table = ({
    dataSource = [],
    columns = [],
    loading,
  }: {
    dataSource?: any[];
    columns?: any[];
    loading?: boolean;
  }) => (
    <div data-testid="requests-table" data-loading={loading ? "true" : "false"}>
      {dataSource.map((record: any) => (
        <div key={record.id} role="row">
          {columns.map((column: any, index: number) => {
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

  const Tag = ({ children }: { children: React.ReactNode }) => (
    <span>{children}</span>
  );

  const Space = ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  );

  const Popconfirm = ({
    children,
    onConfirm,
  }: {
    children: React.ReactElement;
    onConfirm?: () => void;
    title?: string;
    okText?: string;
    cancelText?: string;
    okButtonProps?: any;
  }) => {
    const child = React.Children.only(children);
    return React.cloneElement(child, {
      onClick: (event: React.MouseEvent) => {
        child.props.onClick?.(event);
        onConfirm?.();
      },
    });
  };

  return {
    Typography,
    Button,
    Input,
    Select,
    DatePicker,
    Card,
    Table,
    Tag,
    Space,
    Popconfirm,
  };
});

const originalLocation = window.location as any;

beforeAll(() => {
  Object.defineProperty(window, "location", {
    configurable: true,
    enumerable: true,
    writable: true,
    value: { href: "" },
  });
});

afterAll(() => {
  window.location = originalLocation;
});

describe("AdminRequestsPage", () => {
  const createResponse = (body: unknown, status = 200) => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  });

  const baseItems = [
    {
      id: "req-1",
      createdAt: "2024-01-01T10:00:00.000Z",
      clientName: "John Doe",
      phone: "+3312345678",
      email: "john@example.com",
      status: "Non traité" as const,
    },
  ];

  let fetchMock: jest.SpyInstance;

  beforeEach(() => {
    fetchMock = jest
      .spyOn(global, "fetch")
      .mockResolvedValue(
        createResponse({ items: baseItems }) as unknown as Response
      );
    (window.location as any).href = "";
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("renders fetched requests and allows navigation plus refresh", async () => {
    const user = userEvent.setup();
    render(<AdminRequestsPage />);

    await screen.findByText("John Doe");

    const traiterButton = screen.getByRole("button", { name: "Traiter" });
    await user.click(traiterButton);
    expect((window.location as any).href).toBe("/admin/requests/req-1");

    const refreshButton = screen.getByRole("button", { name: "Actualiser" });
    await user.click(refreshButton);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });

  it("renders gender prefix 'M.' for male and 'Mme' for female in client cell", async () => {
    // Ответ начальной загрузки: две строки с разным полом
    fetchMock.mockResolvedValueOnce(
      createResponse({
        items: [
          {
            id: "req-male",
            createdAt: "2024-01-02T09:00:00.000Z",
            clientName: "Monsieur Client",
            phone: "+3300000001",
            email: "m@example.com",
            status: "Non traité" as const,
            gender: "male" as const,
          },
          {
            id: "req-female",
            createdAt: "2024-01-02T10:00:00.000Z",
            clientName: "Madame Cliente",
            phone: "+3300000002",
            email: "f@example.com",
            status: "Traité" as const,
            gender: "female" as const,
          },
        ],
      }) as unknown as Response
    );

    render(<AdminRequestsPage />);

    // Проверяем, что отрисованы и префиксы, и имена
    await screen.findByText("Monsieur Client");
    await screen.findByText("Madame Cliente");

    // Префиксы пола
    expect(screen.getByText("M.")).toBeInTheDocument();
    expect(screen.getByText("Mme")).toBeInTheDocument();
  });

  it("shows technical error message in development mode", async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    fetchMock.mockResolvedValueOnce(
      createResponse({}, 500) as unknown as Response
    );

    render(<AdminRequestsPage />);

    await screen.findByText(
      "Informations techniques: Erreur de chargement: 500"
    );

    process.env.NODE_ENV = originalEnv;
  });

  it("triggers search requests and clears table on unauthorized response", async () => {
    const user = userEvent.setup();
    fetchMock
      .mockResolvedValueOnce(
        createResponse({ items: baseItems }) as unknown as Response
      )
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({}),
      } as Response);

    render(<AdminRequestsPage />);

    await screen.findByText("John Doe");
    await user.click(screen.getByTestId("search-button"));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenLastCalledWith(
        "/api/requests?search=doe",
        expect.objectContaining({ method: "GET" })
      )
    );
    await waitFor(() =>
      expect(screen.queryByText("John Doe")).not.toBeInTheDocument()
    );
  });

  it("filters by status and displays the updated result set", async () => {
    const user = userEvent.setup();
    fetchMock
      .mockResolvedValueOnce(
        createResponse({ items: baseItems }) as unknown as Response
      )
      .mockResolvedValueOnce(
        createResponse({
          items: [
            {
              ...baseItems[0],
              id: "req-2",
              clientName: "Jane Roe",
              status: "Traité" as const,
            },
          ],
        }) as unknown as Response
      );

    render(<AdminRequestsPage />);

    await screen.findByText("John Doe");
    await user.selectOptions(screen.getByTestId("status-filter"), "Traité");

    await waitFor(() =>
      expect(fetchMock).toHaveBeenLastCalledWith(
        "/api/requests?status=Trait%C3%A9",
        expect.objectContaining({ method: "GET" })
      )
    );
    await screen.findByText("Jane Roe");
  });

  it("filters by date range using the range picker control", async () => {
    const user = userEvent.setup();
    fetchMock
      .mockResolvedValueOnce(
        createResponse({ items: baseItems }) as unknown as Response
      )
      .mockResolvedValueOnce(
        createResponse({
          items: [
            {
              ...baseItems[0],
              id: "req-range",
              clientName: "Date Filtered",
            },
          ],
        }) as unknown as Response
      );

    render(<AdminRequestsPage />);

    await screen.findByText("John Doe");
    await user.click(screen.getByTestId("date-range"));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenLastCalledWith(
        "/api/requests?from=2024-01-01&to=2024-01-31",
        expect.objectContaining({ method: "GET" })
      )
    );
    await screen.findByText("Date Filtered");
  });

  it("removes a request after successful deletion", async () => {
    const user = userEvent.setup();
    fetchMock
      .mockResolvedValueOnce(
        createResponse({ items: baseItems }) as unknown as Response
      )
      .mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: async () => ({}),
      } as Response);

    render(<AdminRequestsPage />);

    await screen.findByText("John Doe");
    const deleteButton = screen.getByRole("button", { name: "Supprimer" });
    await user.click(deleteButton);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(screen.queryByText("John Doe")).not.toBeInTheDocument()
    );
  });

  it("keeps the row when deletion is unauthorized", async () => {
    const user = userEvent.setup();
    fetchMock
      .mockResolvedValueOnce(
        createResponse({ items: baseItems }) as unknown as Response
      )
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({}),
      } as Response);

    render(<AdminRequestsPage />);

    await screen.findByText("John Doe");
    const deleteButton = screen.getByRole("button", { name: "Supprimer" });
    await user.click(deleteButton);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("navigates through the client link without following the native anchor", async () => {
    const user = userEvent.setup();
    render(<AdminRequestsPage />);

    const nameLink = await screen.findByText("John Doe");
    await user.click(nameLink);

    expect((window.location as any).href).toBe("/admin/requests/req-1");
  });

  it("shows search error message in development when request fails", async () => {
    const previousEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    try {
      const user = userEvent.setup();
      fetchMock
        .mockResolvedValueOnce(
          createResponse({ items: baseItems }) as unknown as Response
        )
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({}),
        } as Response);

      render(<AdminRequestsPage />);
      await screen.findByText("John Doe");
      await user.click(screen.getByTestId("search-button"));
      await screen.findByText(
        "Informations techniques: Erreur de chargement: 500"
      );
    } finally {
      process.env.NODE_ENV = previousEnv;
    }
  });

  it("keeps row when deletion returns 404", async () => {
    const user = userEvent.setup();
    fetchMock
      .mockResolvedValueOnce(
        createResponse({ items: baseItems }) as unknown as Response
      )
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({}),
      } as Response);

    render(<AdminRequestsPage />);
    await screen.findByText("John Doe");
    const deleteButton = screen.getByRole("button", { name: "Supprimer" });
    await user.click(deleteButton);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("handles deletion errors gracefully", async () => {
    const user = userEvent.setup();
    fetchMock
      .mockResolvedValueOnce(
        createResponse({ items: baseItems }) as unknown as Response
      )
      .mockRejectedValueOnce(new Error("delete failed"));

    render(<AdminRequestsPage />);
    await screen.findByText("John Doe");
    const deleteButton = screen.getByRole("button", { name: "Supprimer" });
    await user.click(deleteButton);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("ignores initial load when unauthorized", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({}),
    } as Response);

    render(<AdminRequestsPage />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
  });

  it("ignores refresh when response returns 401", async () => {
    const user = userEvent.setup();
    render(<AdminRequestsPage />);
    await screen.findByText("John Doe");

    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({}),
    } as Response);

    const refreshButton = screen.getByRole("button", { name: "Actualiser" });
    await user.click(refreshButton);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("shows error when manual refresh fails", async () => {
    const previousEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    try {
      const user = userEvent.setup();
      fetchMock
        .mockResolvedValueOnce(
          createResponse({ items: baseItems }) as unknown as Response
        )
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({}),
        } as Response);

      render(<AdminRequestsPage />);
      await screen.findByText("John Doe");

      const refreshButton = screen.getByRole("button", { name: "Actualiser" });
      await user.click(refreshButton);

      await screen.findByText(
        "Informations techniques: Erreur de chargement: 500"
      );
    } finally {
      process.env.NODE_ENV = previousEnv;
    }
  });

  it("clears rows when date range request returns 401", async () => {
    const user = userEvent.setup();
    fetchMock
      .mockResolvedValueOnce(
        createResponse({ items: baseItems }) as unknown as Response
      )
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({}),
      } as Response);

    render(<AdminRequestsPage />);
    await screen.findByText("John Doe");
    await user.click(screen.getByTestId("date-range"));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
  });

  it("shows error when date range request fails in development", async () => {
    const previousEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    try {
      const user = userEvent.setup();
      fetchMock
        .mockResolvedValueOnce(
          createResponse({ items: baseItems }) as unknown as Response
        )
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({}),
        } as Response);

      render(<AdminRequestsPage />);
      await screen.findByText("John Doe");

      await user.click(screen.getByTestId("date-range"));
      await screen.findByText(
        "Informations techniques: Erreur de chargement: 500"
      );
    } finally {
      process.env.NODE_ENV = previousEnv;
    }
  });

  it("shows error when deletion response is 500", async () => {
    const user = userEvent.setup();
    fetchMock
      .mockResolvedValueOnce(
        createResponse({ items: baseItems }) as unknown as Response
      )
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({}),
      } as Response);

    render(<AdminRequestsPage />);
    await screen.findByText("John Doe");
    const deleteButton = screen.getByRole("button", { name: "Supprimer" });
    await user.click(deleteButton);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("displays status filter error message in development on failure", async () => {
    const prevEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    try {
      const user = userEvent.setup();
      fetchMock
        .mockResolvedValueOnce(
          createResponse({ items: baseItems }) as unknown as Response
        )
        .mockRejectedValueOnce(new Error("status failed"));

      render(<AdminRequestsPage />);
      await screen.findByText("John Doe");

      await user.selectOptions(screen.getByTestId("status-filter"), "Traité");

      await screen.findByText("Informations techniques: status failed");
    } finally {
      process.env.NODE_ENV = prevEnv;
    }
  });

  // ДОБАВЛЕНО: ветка "Tous" (пустой value) должна сбрасывать на базовый список
  it("resets to base list when status filter 'Tous' (empty) is selected", async () => {
    const user = userEvent.setup();

    fetchMock
      .mockResolvedValueOnce(
        createResponse({
          items: [
            {
              id: "req-1",
              createdAt: "2024-01-01T10:00:00.000Z",
              clientName: "John Doe",
              phone: "+3312345678",
              email: "john@example.com",
              status: "Non traité" as const,
            },
          ],
        }) as unknown as Response
      )
      .mockResolvedValueOnce(
        createResponse({
          items: [
            {
              id: "req-reset",
              createdAt: "2024-02-01T10:00:00.000Z",
              clientName: "Reset To Base",
              phone: "+3399999999",
              email: "reset@example.com",
              status: "Traité" as const,
            },
          ],
        }) as unknown as Response
      );

    render(<AdminRequestsPage />);

    await screen.findByText("John Doe");

    // Выбор пустого значения (Tous) в селекте
    await user.selectOptions(screen.getByTestId("status-filter"), "");

    await waitFor(() =>
      expect(fetchMock).toHaveBeenLastCalledWith(
        "/api/requests",
        expect.objectContaining({ method: "GET" })
      )
    );

    await screen.findByText("Reset To Base");
  });

  // ДОБАВЛЕНО: ветка пустого поиска (сброс на /api/requests)
  it("resets to base list when search query is empty", async () => {
    fetchMock
      .mockResolvedValueOnce(
        createResponse({
          items: [
            {
              id: "req-1",
              createdAt: "2024-01-01T10:00:00.000Z",
              clientName: "John Doe",
              phone: "+3312345678",
              email: "john@example.com",
              status: "Non traité" as const,
            },
          ],
        }) as unknown as Response
      )
      .mockResolvedValueOnce(
        createResponse({
          items: [
            {
              id: "req-empty-search",
              createdAt: "2024-03-01T12:00:00.000Z",
              clientName: "Empty Query Result",
              phone: "+3300000000",
              email: "empty@example.com",
              status: "Traité" as const,
            },
          ],
        }) as unknown as Response
      );

    const user = userEvent.setup();
    render(<AdminRequestsPage />);

    await screen.findByText("John Doe");

    // Кликаем скрытую кнопку пустого поиска
    await user.click(screen.getByTestId("search-empty-button"));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenLastCalledWith(
        "/api/requests",
        expect.objectContaining({ method: "GET" })
      )
    );

    await screen.findByText("Empty Query Result");
  });
});
