import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import AdminNav from "./AdminNav";

const pushMock = jest.fn();
const fetchSpy = jest.spyOn(global, "fetch");

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(() => "/admin/requests/123"),
  useRouter: () => ({ push: pushMock }),
}));

jest.mock("next/link", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: React.forwardRef<HTMLAnchorElement, React.ComponentPropsWithoutRef<"a">>(
      ({ children, ...props }, ref) => (
        <a ref={ref} {...props}>
          {children}
        </a>
      ),
    ),
  };
});

jest.mock("antd", () => ({
  Space: ({ children }: { children: React.ReactNode }) => <div data-testid="ant-space">{children}</div>,
  Button: ({ children, danger: _danger, loading: _loading, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
}));

describe("AdminNav", () => {
  afterEach(() => {
    fetchSpy.mockReset();
    pushMock.mockReset();
  });

  afterAll(() => {
    fetchSpy.mockRestore();
  });

  it("подсвечивает активный пункт меню", () => {
    render(<AdminNav />);

    const requestsLink = screen.getByRole("link", { name: "Demandes" });
    expect(requestsLink).toHaveAttribute("aria-current", "page");

    const reviewsLink = screen.getByRole("link", { name: "Avis" });
    expect(reviewsLink).not.toHaveAttribute("aria-current");
  });

  it("успешно выполняет выход и редиректит на страницу логина", async () => {
    fetchSpy.mockResolvedValueOnce({ ok: true } as Response);

    render(<AdminNav />);

    fireEvent.click(screen.getByRole("button", { name: "Se déconnecter" }));

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledWith("/api/auth/logout", expect.any(Object)));
    expect(pushMock).toHaveBeenCalledWith("/admin/login");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("отображает ошибку при неудачном выходе", async () => {
    fetchSpy.mockResolvedValueOnce({ ok: false } as Response);

    render(<AdminNav />);

    fireEvent.click(screen.getByRole("button", { name: "Se déconnecter" }));

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Échec de la déconnexion"));
    expect(pushMock).not.toHaveBeenCalled();
  });
});
