import { GET } from "./route";
import { supabaseServer } from "@/shared/api/supabase/server";
import { readResponseJson } from "@/tests/utils/readResponseJson";

jest.mock("@/shared/api/supabase/server", () => ({
  supabaseServer: { from: jest.fn() },
}));

const mockSupabaseFrom =
  supabaseServer.from as jest.MockedFunction<typeof supabaseServer.from>;

jest.mock("@/shared/api/next/securityHeaders", () => ({
  securityHeaders: { "x-test": "count" },
}));

const hasAccessTokenCookie = jest.fn();

jest.mock("@/modules/auth/lib/cookies", () => ({
  hasAccessTokenCookie: (cookie: string) => hasAccessTokenCookie(cookie),
}));

function createQueryBuilder<T>(result: T) {
  const chain: any = {
    select: jest.fn(() => chain),
    eq: jest.fn(() => chain),
    then: (resolve: (value: T) => void, reject?: (reason: unknown) => void) =>
      Promise.resolve(result).then(resolve, reject),
  };
  return chain;
}

describe("/api/requests/count GET", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when cookie is missing", async () => {
    hasAccessTokenCookie.mockReturnValue(false);

    const res = await GET(
      new Request("http://localhost/api/requests/count", { method: "GET" }),
    );

    expect(res.status).toBe(401);
    await expect(readResponseJson(res)).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns the count when Supabase succeeds", async () => {
    hasAccessTokenCookie.mockReturnValue(true);
    mockSupabaseFrom.mockReturnValueOnce(
      createQueryBuilder({ count: 5, error: null }),
    );

    const res = await GET(
      new Request(
        "http://localhost/api/requests/count?status=Traité",
        { method: "GET", headers: { cookie: "access_token=abc" } },
      ),
    );

    expect(res.status).toBe(200);
    await expect(readResponseJson(res)).resolves.toEqual({
      count: 5,
      status: "Traité",
    });
  });

  it("returns ServerError when Supabase fails", async () => {
    hasAccessTokenCookie.mockReturnValue(true);
    mockSupabaseFrom.mockReturnValueOnce(
      createQueryBuilder({ count: null, error: { message: "db failed" } }),
    );

    const res = await GET(
      new Request("http://localhost/api/requests/count", {
        method: "GET",
        headers: { cookie: "access_token=abc" },
      }),
    );

    expect(res.status).toBe(500);
    await expect(readResponseJson(res)).resolves.toEqual({
      error: "ServerError",
      details: "db failed",
    });
  });

  it("defaults to 'Non traité' when status param is invalid", async () => {
    hasAccessTokenCookie.mockReturnValue(true);
    const chain = createQueryBuilder({ count: 1, error: null });
    const eqSpy = chain.eq;
    mockSupabaseFrom.mockReturnValueOnce(chain);

    const res = await GET(
      new Request("http://localhost/api/requests/count?status=invalid", {
        method: "GET",
        headers: { cookie: "access_token=abc" },
      }),
    );

    expect(res.status).toBe(200);
    expect(eqSpy).toHaveBeenCalledWith("status", "Non traité");
    await expect(readResponseJson(res)).resolves.toEqual({
      count: 1,
      status: "Non traité",
    });
  });

  it("returns Unknown error when Supabase client throws a non-Error value", async () => {
    hasAccessTokenCookie.mockReturnValue(true);
    mockSupabaseFrom.mockImplementationOnce(() => {
      throw "kaput";
    });

    const res = await GET(
      new Request("http://localhost/api/requests/count", {
        method: "GET",
        headers: { cookie: "access_token=abc" },
      }),
    );

    expect(res.status).toBe(500);
    await expect(readResponseJson(res)).resolves.toEqual({
      error: "ServerError",
      details: "Unknown error",
    });
  });
});
