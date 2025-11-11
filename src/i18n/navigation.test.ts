const navigationResult = {
  Link: jest.fn(),
  redirect: jest.fn(),
  usePathname: jest.fn(),
  useRouter: jest.fn(),
  getPathname: jest.fn(),
};

const createNavigationMock = jest.fn(() => navigationResult);

jest.mock("next-intl/navigation", () => ({
  createNavigation: createNavigationMock,
}));

jest.mock("./routing", () => ({
  routing: {
    locales: ["fr", "en"],
    defaultLocale: "fr",
    localePrefix: "always",
  },
}));

describe("i18n navigation exports", () => {
  beforeEach(() => {
    createNavigationMock.mockClear();
  });

  it("делегирует создание навигации в next-intl и реэкспортирует полученные функции", async () => {
    const module = await import("./navigation");

    expect(createNavigationMock).toHaveBeenCalledWith({
      locales: ["fr", "en"],
      defaultLocale: "fr",
      localePrefix: "always",
    });

    expect(module.Link).toBe(navigationResult.Link);
    expect(module.redirect).toBe(navigationResult.redirect);
    expect(module.usePathname).toBe(navigationResult.usePathname);
    expect(module.useRouter).toBe(navigationResult.useRouter);
    expect(module.getPathname).toBe(navigationResult.getPathname);
  });
});
