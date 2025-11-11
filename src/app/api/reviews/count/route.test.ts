import { GET } from "./route";
import { supabaseServer } from "@/shared/api/supabase/server";
import { readResponseJson } from "@/tests/utils/readResponseJson";

jest.mock("@/shared/api/supabase/server", () => ({
  supabaseServer: { from: jest.fn() },
}));

const mockSupabaseFrom =
  supabaseServer.from as jest.MockedFunction<typeof supabaseServer.from>;

jest.mock("@/shared/api/next/securityHeaders", () => ({
  securityHeaders: { "x-test": "reviews-count" },
}));

const hasAccessTokenCookie = jest.fn();

jest.mock("@/modules/auth/lib/cookies", () => ({
  hasAccessTokenCookie: (cookieHeader: string) =>
    hasAccessTokenCookie(cookieHeader),
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

describe("/api/reviews/count GET", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejects unauthorized calls", async () => {
    hasAccessTokenCookie.mockReturnValue(false);

    const res = await GET(
      new Request("http://localhost/api/reviews/count", { method: "GET" }),
    );

    expect(res.status).toBe(401);
    await expect(readResponseJson(res)).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns the count for the requested status", async () => {
    hasAccessTokenCookie.mockReturnValue(true);
    mockSupabaseFrom.mockReturnValueOnce(
      createQueryBuilder({ count: 3, error: null }),
    );

    const res = await GET(
      new Request(
        "http://localhost/api/reviews/count?status=Publié",
        { method: "GET", headers: { cookie: "access_token=abc" } },
      ),
    );

    expect(res.status).toBe(200);
    await expect(readResponseJson(res)).resolves.toEqual({
      count: 3,
      status: "Publié",
    });
  });

  it("returns ServerError when Supabase fails", async () => {
    hasAccessTokenCookie.mockReturnValue(true);
    mockSupabaseFrom.mockReturnValueOnce(
      createQueryBuilder({ count: null, error: { message: "db failed" } }),
    );

    const res = await GET(
      new Request("http://localhost/api/reviews/count", {
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

  it("defaults to Brouillon when status query is missing or invalid", async () => {
    hasAccessTokenCookie.mockReturnValue(true);
    const chain = createQueryBuilder({ count: 7, error: null });
    const eqSpy = chain.eq;
    mockSupabaseFrom.mockReturnValueOnce(chain);

    const res = await GET(
      new Request("http://localhost/api/reviews/count?status=foo", {
        method: "GET",
        headers: { cookie: "access_token=abc" },
      }),
    );

    expect(res.status).toBe(200);
    expect(eqSpy).toHaveBeenCalledWith("status", "Brouillon");
    await expect(readResponseJson(res)).resolves.toEqual({
      count: 7,
      status: "Brouillon",
    });
  });

  it("returns Unknown error when Supabase throws a non-Error", async () => {
    hasAccessTokenCookie.mockReturnValue(true);
    mockSupabaseFrom.mockImplementationOnce(() => {
      throw "kaput";
    });

    const res = await GET(
      new Request("http://localhost/api/reviews/count", {
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
