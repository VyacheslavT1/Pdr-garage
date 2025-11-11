const getRequestConfigMock = jest.fn((factory: any) => factory);

jest.mock("next-intl/server", () => ({
  getRequestConfig: getRequestConfigMock,
}));

const hasLocaleMock = jest.fn();
jest.mock("next-intl", () => ({
  hasLocale: hasLocaleMock,
}));

jest.mock("./routing", () => ({
  routing: {
    locales: ["fr", "en", "ru"],
    defaultLocale: "fr",
  },
}));

jest.mock("../messages/fr.json", () => ({ default: { message: "fr" } }), {
  virtual: true,
});
jest.mock("../messages/en.json", () => ({ default: { message: "en" } }), {
  virtual: true,
});

describe("i18n request config", () => {
  beforeEach(() => {
    getRequestConfigMock.mockClear();
    hasLocaleMock.mockReset();
  });

  async function loadRequestConfig() {
    let config: (args: { requestLocale: Promise<string> }) => Promise<{
      locale: string;
      messages: Record<string, unknown>;
    }> | undefined;

    await jest.isolateModulesAsync(async () => {
      const module = await import("./request");
      config = module.default;
    });

    if (!config) {
      throw new Error("request config was not loaded");
    }
    return config;
  }

  it("использует запрошенную локаль, если она поддерживается", async () => {
    hasLocaleMock.mockImplementation(
      (locales: string[], candidate: string) => locales.includes(candidate),
    );

    const requestConfig = await loadRequestConfig();
    expect(getRequestConfigMock).toHaveBeenCalledTimes(1);

    const result = await requestConfig({
      requestLocale: Promise.resolve("en"),
    });

    expect(hasLocaleMock).toHaveBeenCalledWith(["fr", "en", "ru"], "en");
    expect(result.locale).toBe("en");
    expect(result.messages?.default).toEqual({ message: "en" });
  });

  it("возвращает локаль по умолчанию, если запрошенная не найдена", async () => {
    hasLocaleMock.mockReturnValue(false);

    const requestConfig = await loadRequestConfig();

    const result = await requestConfig({
      requestLocale: Promise.resolve("es"),
    });

    expect(hasLocaleMock).toHaveBeenCalledWith(["fr", "en", "ru"], "es");
    expect(result.locale).toBe("fr");
    expect(result.messages?.default).toEqual({ message: "fr" });
  });
});
