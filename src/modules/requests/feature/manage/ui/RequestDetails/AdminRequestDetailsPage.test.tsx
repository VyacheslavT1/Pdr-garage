import React from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminRequestDetailsPage from "./AdminRequestDetailsPage";

const mockUseParams = jest.fn();
const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useParams: () => mockUseParams(),
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("antd", () => {
  const React = require("react");

  const Typography = {
    Title: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
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
  }) => {
    const { danger: _danger, loading: _loading, ...buttonProps } = rest;
    return (
      <button type="button" onClick={onClick} {...buttonProps}>
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

  const Space = ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  );

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

  const Image = ({ children, ...props }: { children?: React.ReactNode }) => (
    <img alt="" {...props} />
  );
  Image.PreviewGroup = ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  );

  return {
    Typography,
    Button,
    Card,
    Descriptions,
    Tag,
    Space,
    Popconfirm,
    Spin,
    Image,
  };
});

const originalLocation = window.location;

beforeAll(() => {
  Object.defineProperty(window, "location", {
    configurable: true,
    enumerable: true,
    value: {
      ...originalLocation,
      href: "",
      assign: jest.fn(),
      replace: jest.fn(),
      reload: jest.fn(),
    },
  });
});

afterAll(() => {
  Object.defineProperty(window, "location", {
    configurable: true,
    enumerable: true,
    value: originalLocation,
  });
});

describe("AdminRequestDetailsPage", () => {
  const createResponse = (body: unknown, status = 200) => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  });

  const baseRequest = {
    id: "req-1",
    createdAt: "2024-01-01T10:00:00.000Z",
    clientName: "Jane Doe",
    phone: "+3312345678",
    email: "jane@example.com",
    status: "Non traité" as const,
    attachments: [],
  };

  let fetchMock: jest.SpyInstance;
  let defaultFetchImpl: (
    url: RequestInfo | URL,
    init?: RequestInit,
  ) => Promise<Response>;

  beforeEach(() => {
    mockUseParams.mockReturnValue({ id: "req-1" });
    defaultFetchImpl = async (url: RequestInfo | URL, init?: RequestInit) => {
      const method = init?.method ?? "GET";
      if (url.toString().startsWith("/api/requests") && method === "GET") {
        return createResponse({ item: baseRequest }) as unknown as Response;
      }
      if (method === "PATCH") {
        const body = JSON.parse(String(init?.body));
        const updated = { ...baseRequest, status: body.status };
        return createResponse({ item: updated }) as unknown as Response;
      }
      if (method === "DELETE") {
        return createResponse({}, 204) as unknown as Response;
      }
      return createResponse({}) as unknown as Response;
    };
    fetchMock = jest.spyOn(global, "fetch").mockImplementation(defaultFetchImpl);
    window.location.href = "";
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("loads request details and toggles status", async () => {
    const user = userEvent.setup();
    render(<AdminRequestDetailsPage />);

    await screen.findByText("Jane Doe");

    const toggleButton = screen.getByRole("button", {
      name: "Marquer comme traitée",
    });
    await user.click(toggleButton);

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/api/requests"),
        expect.objectContaining({ method: "PATCH" })
      )
    );
    expect(screen.getByText("Traité")).toBeInTheDocument();
  });

  it("deletes the request and redirects to the list", async () => {
    const user = userEvent.setup();
    render(<AdminRequestDetailsPage />);
    await screen.findByText("Jane Doe");

    const deleteButton = screen.getByRole("button", { name: "Supprimer" });
    await user.click(deleteButton);

    await waitFor(() => expect(window.location.href).toBe("/admin/requests"));
  });

  it("shows error when id param is missing", async () => {
    mockUseParams.mockReturnValue({});
    render(<AdminRequestDetailsPage />);

    await screen.findByText(
      "Informations techniques: L’identifiant de la demande n’est pas présent dans l’URL.",
    );
  });

  it("exports CSV using blob link with sanitized fields", async () => {
    const clickMock = jest.fn();
    const anchorMock = document.createElement("a") as HTMLAnchorElement;
    anchorMock.click = clickMock as unknown as () => void;
    const originalCreateElement = document.createElement.bind(document);
    const createElementSpy = jest
      .spyOn(document, "createElement")
      .mockImplementation(((tagName: string, options?: ElementCreationOptions) =>
        tagName === "a"
          ? anchorMock
          : originalCreateElement(tagName, options)) as typeof document.createElement);
    const originalCreateObjectURL = (URL as any).createObjectURL;
    const originalRevokeObjectURL = (URL as any).revokeObjectURL;
    const objectUrlSpy = jest.fn(() => "blob:request");
    const revokeSpy = jest.fn();
    (URL as any).createObjectURL = objectUrlSpy;
    (URL as any).revokeObjectURL = revokeSpy;

    const user = userEvent.setup();
    render(<AdminRequestDetailsPage />);
    await screen.findByText("Jane Doe");

    await user.click(screen.getByRole("button", { name: "Exporter CSV" }));

    expect(clickMock).toHaveBeenCalled();
    expect(objectUrlSpy).toHaveBeenCalled();
    expect(revokeSpy).toHaveBeenCalledWith("blob:request");

    createElementSpy.mockRestore();
    (URL as any).createObjectURL = originalCreateObjectURL;
    (URL as any).revokeObjectURL = originalRevokeObjectURL;
  });

  it("renders image previews when attachments contain data URLs", async () => {
    fetchMock.mockImplementationOnce(async (url, init) => {
      const method = init?.method ?? "GET";
      if (url.toString().startsWith("/api/requests") && method === "GET") {
        return createResponse({
          item: {
            ...baseRequest,
            attachments: [
              {
                id: "att-1",
                name: "photo.png",
                dataUrl: "data:image/png;base64,abc",
                type: "image/png",
                size: 100,
              },
            ],
          },
        }) as unknown as Response;
      }
      return defaultFetchImpl(url, init);
    });

    render(<AdminRequestDetailsPage />);

    const image = await screen.findByRole("img");
    expect(image).toHaveAttribute("src", "data:image/png;base64,abc");
  });

  it("shows action error when toggling status returns 401", async () => {
    fetchMock.mockImplementation(async (url, init) => {
      const method = init?.method ?? "GET";
      if (url.toString().startsWith("/api/requests") && method === "GET") {
        return createResponse({ item: baseRequest }) as unknown as Response;
      }
      if (method === "PATCH") {
        return createResponse({}, 401) as unknown as Response;
      }
      return defaultFetchImpl(url, init);
    });

    const user = userEvent.setup();
    render(<AdminRequestDetailsPage />);

    await screen.findByText("Jane Doe");
    await user.click(
      screen.getByRole("button", { name: "Marquer comme traitée" }),
    );

    await screen.findByText("Session invalide");
  });

  it("shows action error when deletion fails with 404", async () => {
    fetchMock.mockImplementation(async (url, init) => {
      const method = init?.method ?? "GET";
      if (url.toString().startsWith("/api/requests") && method === "GET") {
        return createResponse({ item: baseRequest }) as unknown as Response;
      }
      if (method === "DELETE") {
        return createResponse({}, 404) as unknown as Response;
      }
      return defaultFetchImpl(url, init);
    });

    const user = userEvent.setup();
    render(<AdminRequestDetailsPage />);
    await screen.findByText("Jane Doe");

    await user.click(screen.getByRole("button", { name: "Supprimer" }));

    await screen.findByText("Demande introuvable");
  });

  it("navigates back when clicking Retour", async () => {
    const user = userEvent.setup();
    render(<AdminRequestDetailsPage />);
    await screen.findByText("Jane Doe");

    await user.click(screen.getByRole("button", { name: "Retour" }));
    expect(mockPush).toHaveBeenCalledWith("/admin/requests");
  });

  it("renders fallback when initial fetch is unauthorized", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({}),
    } as Response);

    render(<AdminRequestDetailsPage />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    await screen.findByText("Aucune donnée de la demande");
  });

  it("shows not found message when GET returns 404", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({}),
    } as Response);

    render(<AdminRequestDetailsPage />);

    await screen.findByText(
      "Informations techniques: Demande introuvable ou déjà supprimée.",
    );
  });

  it("shows message when payload is empty", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ items: [] }),
    } as Response);

    render(<AdminRequestDetailsPage />);
    await screen.findByText(
      "Informations techniques: La demande est absente dans la réponse du serveur.",
    );
  });

  it("shows error when GET throws", async () => {
    fetchMock.mockRejectedValueOnce(new Error("boom load"));

    render(<AdminRequestDetailsPage />);

    await screen.findByText("Informations techniques: boom load");
  });

  it("shows action error when status toggle returns 404", async () => {
    fetchMock
      .mockResolvedValueOnce(
        createResponse({ item: baseRequest }) as unknown as Response,
      )
      .mockResolvedValueOnce(createResponse({}, 404) as Response);

    const user = userEvent.setup();
    render(<AdminRequestDetailsPage />);
    await screen.findByText("Jane Doe");

    await user.click(screen.getByRole("button", { name: "Marquer comme traitée" }));
    await screen.findByText("Demande introuvable");
  });

  it("shows action error when status toggle throws", async () => {
    fetchMock
      .mockResolvedValueOnce(
        createResponse({ item: baseRequest }) as unknown as Response,
      )
      .mockRejectedValueOnce(new Error("update failed"));

    const user = userEvent.setup();
    render(<AdminRequestDetailsPage />);
    await screen.findByText("Jane Doe");

    await user.click(screen.getByRole("button", { name: "Marquer comme traitée" }));
    await screen.findByText("update failed");
  });

  it("sets action error when delete returns 401", async () => {
    fetchMock
      .mockResolvedValueOnce(
        createResponse({ item: baseRequest }) as unknown as Response,
      )
      .mockResolvedValueOnce(createResponse({}, 401) as Response);

    const user = userEvent.setup();
    render(<AdminRequestDetailsPage />);
    await screen.findByText("Jane Doe");

    await user.click(screen.getByRole("button", { name: "Supprimer" }));
    await screen.findByText("Session invalide");
  });

  it("sets action error when delete throws an exception", async () => {
    fetchMock
      .mockResolvedValueOnce(
        createResponse({ item: baseRequest }) as unknown as Response,
      )
      .mockRejectedValueOnce(new Error("delete failed"));

    const user = userEvent.setup();
    render(<AdminRequestDetailsPage />);
    await screen.findByText("Jane Doe");

    await user.click(screen.getByRole("button", { name: "Supprimer" }));
    await screen.findByText("delete failed");
  });

  it("renders fallback when initial fetch is unauthorized", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({}),
    } as Response);

    render(<AdminRequestDetailsPage />);

    await screen.findByText("Aucune donnée de la demande");
  });

  it("shows not found message when GET returns 404", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({}),
    } as Response);

    render(<AdminRequestDetailsPage />);

    await screen.findByText(
      "Informations techniques: Demande introuvable ou déjà supprimée.",
    );
  });

  it("shows message when payload is empty", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ items: [] }),
    } as Response);

    render(<AdminRequestDetailsPage />);

    await screen.findByText(
      "Informations techniques: La demande est absente dans la réponse du serveur.",
    );
  });

  it("shows technical error when GET returns server error", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({}),
    } as Response);

    render(<AdminRequestDetailsPage />);

    await screen.findByText("Informations techniques: Erreur de chargement: 500");
  });

  it("shows action error when status toggle returns 404", async () => {
    fetchMock
      .mockResolvedValueOnce(
        createResponse({ item: baseRequest }) as unknown as Response,
      )
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({}),
      } as Response);

    const user = userEvent.setup();
    render(<AdminRequestDetailsPage />);
    await screen.findByText("Jane Doe");

    await user.click(screen.getByRole("button", { name: "Marquer comme traitée" }));
    await screen.findByText("Demande introuvable");
  });

  it("shows action error when status toggle returns 500", async () => {
    fetchMock
      .mockResolvedValueOnce(
        createResponse({ item: baseRequest }) as unknown as Response,
      )
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({}),
      } as Response);

    const user = userEvent.setup();
    render(<AdminRequestDetailsPage />);
    await screen.findByText("Jane Doe");

    await user.click(screen.getByRole("button", { name: "Marquer comme traitée" }));
    await screen.findByText("Échec de mise à jour: 500");
  });
});
