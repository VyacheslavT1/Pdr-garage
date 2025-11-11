import { securityHeaders } from "../securityHeaders";

describe("securityHeaders", () => {
  it("содержит необходимые значения кеширования и безопасности", () => {
    expect(securityHeaders).toEqual({
      "Cache-Control": "no-store",
      Pragma: "no-cache",
      "X-Content-Type-Options": "nosniff",
    });
    Object.freeze(securityHeaders);
    expect(() => {
      // @ts-expect-error проверяем неизменяемость
      securityHeaders.Pragma = "cache";
    }).toThrow();
  });
});
