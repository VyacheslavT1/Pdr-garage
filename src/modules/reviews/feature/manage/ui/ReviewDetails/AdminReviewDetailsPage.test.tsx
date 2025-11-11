import React from "react";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminReviewDetailsPage from "./AdminReviewDetailsPage";

const mockUseParams = jest.fn();
const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useParams: () => mockUseParams(),
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("antd", () => {
  const React = require("react");

  const Typography = {
    Title: ({ children }: { children: React.ReactNode }) => (
      <h2>{children}</h2>
    ),
    Text: ({ children }: { children: React.ReactNode }) => (
      <span>{children}</span>
    ),
  };

  const Button = ({
    children,
    onClick,
    disabled,
    ...rest
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    danger?: boolean;
    loading?: boolean;
  }) => {
    const { danger: _danger, loading: _loading, ...buttonProps } = rest;
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        {...buttonProps}
      >
        {children}
      </button>
    );
  };

  const Card = ({ children }: { children: React.ReactNode }) => (
    <section>{children}</section>
  );

  const Descriptions = ({
    items = [],
  }: {
    items?: Array<{ key: string; label: string; children: React.ReactNode }>;
  }) => (
    <dl>
      {items.map((item) => (
        <div key={item.key}>
          <dt>{item.label}</dt>
          <dd>{item.children}</dd>
        </div>
      ))}
    </dl>
  );

  const Tag = ({ children }: { children: React.ReactNode }) => (
    <span>{children}</span>
  );

  const Rate = ({ value }: { value?: number }) => (
    <div data-testid="rate">{value}</div>
  );

  const Space = ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  );

  const Input = {
    TextArea: ({
      value,
      onChange,
      autoSize: _autoSize,
      ...rest
    }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
      autoSize?: unknown;
    }) => (
      <textarea
        value={value}
        onChange={(event) => onChange?.(event)}
        {...rest}
      />
    ),
  };

  const Popconfirm = ({
    children,
    onConfirm,
  }: {
    children: React.ReactElement;
    onConfirm?: () => void;
  }) => {
    const child = React.Children.only(children);
    return React.cloneElement(child, {
      onClick: (event: React.MouseEvent) => {
        child.props.onClick?.(event);
        onConfirm?.();
      },
    });
  };

  const Spin = () => <div data-testid="spinner" />;

  return {
    Typography,
    Button,
    Card,
    Descriptions,
    Tag,
    Rate,
    Space,
    Input,
    Popconfirm,
    Spin,
  };
});

describe("AdminReviewDetailsPage", () => {
  const createResponse = (body: unknown, status = 200) => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  });

  let reviewRecord = {
    id: "rev-1",
    clientName: "Alice",
    status: "Brouillon" as const,
    updatedAt: "2024-01-01T00:00:00.000Z",
    rating: 4,
    comment: "Great!",
  };

  let fetchMock: jest.SpyInstance;
  let defaultFetch: (
    url: RequestInfo | URL,
    init?: RequestInit,
  ) => Promise<Response>;

  beforeEach(() => {
    reviewRecord = {
      id: "rev-1",
      clientName: "Alice",
      status: "Brouillon",
      updatedAt: "2024-01-01T00:00:00.000Z",
      rating: 4,
      comment: "Great!",
    };
    mockUseParams.mockReturnValue({ id: "rev-1" });
    mockPush.mockReset();
    defaultFetch = async (url: RequestInfo | URL, init?: RequestInit) => {
      const method = init?.method ?? "GET";
      if (url.toString().startsWith("/api/reviews") && method === "GET") {
        return createResponse({ item: reviewRecord }) as unknown as Response;
      }
      if (method === "PUT") {
        const body = JSON.parse(String(init?.body ?? "{}"));
        reviewRecord = { ...reviewRecord, ...body };
        return createResponse({ item: reviewRecord }) as unknown as Response;
      }
      if (method === "DELETE") {
        return createResponse({}, 204) as unknown as Response;
      }
      return createResponse({}) as unknown as Response;
    };
    fetchMock = jest.spyOn(global, "fetch").mockImplementation(defaultFetch);
  });

  afterEach(() => {
    jest.resetAllMocks();
    mockUseParams.mockReset();
  });

  it("approves a review when clicking Accorder", async () => {
    const user = userEvent.setup();

    render(<AdminReviewDetailsPage />);

    await screen.findByText("Alice");
    const approveButton = screen.getByRole("button", { name: "Accorder" });
    await user.click(approveButton);

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/api/reviews"),
        expect.objectContaining({ method: "PUT" }),
      ),
    );
    expect(screen.getByText("Publié")).toBeInTheDocument();
  });

  it("publishes a reply with keyboard shortcut and deletes the review", async () => {
    const user = userEvent.setup();
    render(<AdminReviewDetailsPage />);

    await screen.findByText("Alice");
    await user.click(screen.getByRole("button", { name: "Répondre" }));

    const textarea = screen.getByRole("textbox");
    await user.type(textarea, "Merci !");
    fireEvent.keyDown(textarea, { key: "Enter", ctrlKey: true });

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/api/reviews"),
        expect.objectContaining({
          method: "PUT",
        }),
      ),
    );

    const deleteButton = screen.getByRole("button", { name: "Supprimer" });
    await user.click(deleteButton);

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/admin/reviews"));
  });

  it("shows error when review id param is missing", async () => {
    mockUseParams.mockReturnValue({});
    render(<AdminReviewDetailsPage />);

    await screen.findByText(
      "Informations techniques: L’identifiant de l’avis est absent dans l’URL.",
    );
  });

  it("shows message when initial fetch returns 404", async () => {
    fetchMock.mockImplementationOnce(async () => createResponse({}, 404) as Response);
    render(<AdminReviewDetailsPage />);

    await screen.findByText(/Avis introuvable ou déjà supprimé\./);
  });

  it("shows message when review payload is empty", async () => {
    fetchMock.mockImplementationOnce(async () =>
      createResponse({ items: [] }) as Response,
    );

    render(<AdminReviewDetailsPage />);

    await screen.findByText(/L’avis est absent dans la réponse du serveur\./);
  });

  it("displays action error when publishing reply fails with 401", async () => {
    const user = userEvent.setup();
    fetchMock.mockImplementation(async (url, init) => {
      const method = init?.method ?? "GET";
      if (method === "PUT") {
        return createResponse({}, 401) as Response;
      }
      return defaultFetch(url, init);
    });

    render(<AdminReviewDetailsPage />);
    await screen.findByText("Alice");
    await user.click(screen.getByRole("button", { name: "Répondre" }));
    const textarea = screen.getByRole("textbox");
    await user.type(textarea, "Bonjour");
    await user.click(screen.getByRole("button", { name: "Publier" }));

    await screen.findByText("Session invalide");
  });

  it("shows action error when deletion fails with 404", async () => {
    const user = userEvent.setup();
    fetchMock.mockImplementation(async (url, init) => {
      const method = init?.method ?? "GET";
      if (method === "DELETE") {
        return createResponse({}, 404) as Response;
      }
      return defaultFetch(url, init);
    });

    render(<AdminReviewDetailsPage />);
    await screen.findByText("Alice");
    await user.click(screen.getByRole("button", { name: "Supprimer" }));

    await screen.findByText("Avis introuvable");
  });

  it("navigates back when clicking Retour", async () => {
    const user = userEvent.setup();
    render(<AdminReviewDetailsPage />);
    await screen.findByText("Alice");

    await user.click(screen.getByRole("button", { name: "Retour" }));
    expect(mockPush).toHaveBeenCalledWith("/admin/reviews");
  });

  it("renders fallback when initial fetch is unauthorized", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({}),
    } as Response);

    render(<AdminReviewDetailsPage />);

    await screen.findByText("Aucune donnée d’avis");
  });

  it("shows technical error when GET returns server error", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({}),
    } as Response);

    render(<AdminReviewDetailsPage />);

    await screen.findByText("Informations techniques: Erreur de chargement: 500");
  });

  it("closes reply editor when cancelling response", async () => {
    const user = userEvent.setup();
    render(<AdminReviewDetailsPage />);

    await screen.findByText("Alice");
    await user.click(screen.getByRole("button", { name: "Répondre" }));
    const textarea = screen.getByRole("textbox");
    await user.type(textarea, "Merci");
    await user.click(screen.getByRole("button", { name: "Annuler" }));

    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });
});
