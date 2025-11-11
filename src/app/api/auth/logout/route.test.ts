import { POST } from "./route";
import { NextResponse } from "next/server";
import { readResponseJson } from "@/tests/utils/readResponseJson";

const clearAuthCookies = jest.fn();

jest.mock("@/shared/api/next/securityHeaders", () => ({
  securityHeaders: { "x-test-header": "logout" },
}));

jest.mock("@/modules/auth/lib/cookies", () => ({
  clearAuthCookies: (response: NextResponse) =>
    clearAuthCookies(response),
}));

describe("/api/auth/logout POST", () => {
  beforeEach(() => {
    clearAuthCookies.mockClear();
  });

  it("clears auth cookies and returns success payload", async () => {
    const response = await POST();

    expect(response.status).toBe(200);
    await expect(readResponseJson(response)).resolves.toEqual({ success: true });
    expect(clearAuthCookies).toHaveBeenCalledWith(
      expect.any(NextResponse),
    );
  });
});
