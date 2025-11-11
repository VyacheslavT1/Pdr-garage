import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import AdminHomePage from "./page";

jest.mock("@/shared/ui/admin-nav/AdminNav", () => ({
  __esModule: true,
  default: () => <nav data-testid="admin-nav" />,
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...rest }: React.ComponentProps<"a">) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

jest.mock("antd", () => {
  const React = require("react");
  const Empty = ({ description }: { description?: React.ReactNode }) => (
    <div data-testid="empty">{description}</div>
  );
  const Spin = ({
    children,
    tip,
  }: {
    children: React.ReactNode;
    tip?: React.ReactNode;
  }) => (
    <div data-testid="spin">
      {tip}
      {children}
    </div>
  );
  const Alert = ({
    message,
    description,
  }: {
    message?: React.ReactNode;
    description?: React.ReactNode;
  }) => (
    <div role="alert">
      <strong>{message}</strong>
      <span>{description}</span>
    </div>
  );

  return { Empty, Spin, Alert };
});

describe("AdminHomePage", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("shows notifications with links when new requests and reviews exist", async () => {
    const fetchMock = jest
      .spyOn(global, "fetch")
      .mockImplementation((url: RequestInfo | URL) => {
        const isRequests = String(url).includes("/requests/");
        const body = isRequests ? { count: 2 } : { count: 1 };
        return Promise.resolve({
          ok: true,
          json: async () => body,
        } as Response);
      });

    render(<AdminHomePage />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    const requestsNotice = await screen.findByText(
      "Vous avez 2 nouvelles demandes",
    );
    const reviewsNotice = await screen.findByText(
      "Vous avez 1 nouvel avis",
    );

    expect(requestsNotice.closest("a")).toHaveAttribute(
      "href",
      "/admin/requests",
    );
    expect(reviewsNotice.closest("a")).toHaveAttribute(
      "href",
      "/admin/reviews",
    );
  });

  it("shows a placeholder when there are no updates", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ count: 0 }),
    } as Response);

    render(<AdminHomePage />);

    await waitFor(() =>
      expect(screen.getByTestId("empty")).toBeInTheDocument(),
    );
    expect(screen.getByText("Pas de nouvelle")).toBeInTheDocument();
  });

  it("renders an alert when fetching counts fails", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ count: 0 }),
    } as Response);

    render(<AdminHomePage />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Impossible de charger les données",
    );
    expect(screen.getByText(/Requests count HTTP 500/)).toBeInTheDocument();
  });

  it("renders an alert when reviews endpoint fails", async () => {
    jest.spyOn(global, "fetch").mockImplementation((url: RequestInfo | URL) => {
      if (String(url).includes("/requests/")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ count: 1 }),
        } as Response);
      }

      return Promise.resolve({
        ok: false,
        status: 404,
        json: async () => ({}),
      } as Response);
    });

    render(<AdminHomePage />);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Impossible de charger les données");
    expect(screen.getByText(/Reviews count HTTP 404/)).toBeInTheDocument();
  });

  it("renders Unknown error when fetch rejects with a non-Error value", async () => {
    jest
      .spyOn(global, "fetch")
      .mockRejectedValueOnce("kaput")
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ count: 0 }),
      } as Response);

    render(<AdminHomePage />);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Impossible de charger les données");
    expect(screen.getByText("Unknown error")).toBeInTheDocument();
  });

  it("cancels in-flight updates after unmount to avoid state updates on unmounted component", async () => {
    jest.useFakeTimers();
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const responses: Response[] = [
      {
        ok: true,
        json: async () => ({ count: 2 }),
      } as Response,
      {
        ok: true,
        json: async () => ({ count: 1 }),
      } as Response,
    ];
    jest.spyOn(global, "fetch").mockImplementation(() => {
      return new Promise<Response>((resolve) => {
        setTimeout(() => {
          const next = responses.shift();
          if (next) resolve(next);
        }, 10);
      });
    });

    const { unmount } = render(<AdminHomePage />);
    unmount();

    await act(async () => {
      jest.runAllTimers();
    });

    expect(consoleSpy).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
    jest.useRealTimers();
  });
});
