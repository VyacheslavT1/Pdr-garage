import React from "react";
import { render, screen } from "@testing-library/react";
import AdminLayout from "./layout";

jest.mock("@ant-design/v5-patch-for-react-19", () => ({}));

type ConfigProviderProps = {
  children: React.ReactNode;
  locale: unknown;
};

const mockConfigProvider = jest.fn((props: ConfigProviderProps) => {
  const { children, locale } = props;
  return (
    <div data-testid="config-provider" data-locale={JSON.stringify(locale)}>
      {children}
    </div>
  );
});

type AntdAppProps = { children: React.ReactNode };

const mockAntdApp = jest.fn(({ children }: AntdAppProps) => (
  <div data-testid="antd-app">{children}</div>
));

jest.mock("antd", () => ({
  ConfigProvider: (props: ConfigProviderProps) => mockConfigProvider(props),
  App: (props: AntdAppProps) => mockAntdApp(props),
}));

jest.mock("antd/locale/fr_FR", () => ({
  __esModule: true,
  default: { locale: "fr-FR" },
}));

describe("AdminLayout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("wraps children with ConfigProvider using the French locale", () => {
    render(
      <AdminLayout>
        <span>Child content</span>
      </AdminLayout>,
    );

    expect(mockConfigProvider).toHaveBeenCalledWith(
      expect.objectContaining({
        locale: { locale: "fr-FR" },
      }),
    );

    expect(
      screen.getByTestId("config-provider"),
    ).toHaveTextContent("Child content");
    expect(screen.getByTestId("antd-app")).toHaveTextContent("Child content");
  });
});
