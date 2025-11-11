import { GET, POST, PATCH, DELETE } from "./route";
import { supabaseServer } from "@/shared/api/supabase/server";
import { readResponseJson } from "@/tests/utils/readResponseJson";

jest.mock("@/shared/api/supabase/server", () => ({
  supabaseServer: { from: jest.fn() },
}));

const mockSupabaseFrom =
  supabaseServer.from as jest.MockedFunction<typeof supabaseServer.from>;

jest.mock("@/shared/api/next/securityHeaders", () => ({
  securityHeaders: { "x-test": "requests" },
}));

const mapRowToRequestItem = jest
  .fn()
  .mockImplementation((row) => ({ id: row.id, status: row.status }));

jest.mock("@/modules/requests/lib/mappers", () => ({
  mapRowToRequestItem: (row: Record<string, unknown>) =>
    mapRowToRequestItem(row),
}));

const normalizeAndValidateCreate = jest.fn().mockReturnValue({
  payload: {
    clientName: "John Doe",
    phone: "+123456789",
    email: "john@example.com",
    comment: "Hi",
    gender: "male",
  },
  errors: {},
});

jest.mock("@/modules/requests/model/validation", () => ({
  normalizeAndValidateCreate: (body: unknown) =>
    normalizeAndValidateCreate(body),
}));

const normalizeIncomingAttachments = jest.fn().mockReturnValue([]);
const uploadAttachmentsForRequest = jest
  .fn()
  .mockResolvedValue([{ id: "file" }]);

jest.mock("@/modules/requests/lib/attachments", () => ({
  normalizeIncomingAttachments: (value: unknown) =>
    normalizeIncomingAttachments(value),
}));
jest.mock("@/modules/requests/lib/storage", () => ({
  uploadAttachmentsForRequest: (...args: unknown[]) =>
    uploadAttachmentsForRequest(...(args as [unknown, unknown])),
}));

const hasAccessTokenCookie = jest.fn(() => false);

jest.mock("@/modules/auth/lib/cookies", () => ({
  hasAccessTokenCookie: (cookie: string) => hasAccessTokenCookie(cookie),
}));

function createQueryBuilder<T>(result: T) {
  const chain: any = {
    select: jest.fn(() => chain),
    order: jest.fn(() => chain),
    eq: jest.fn(() => chain),
    gte: jest.fn(() => chain),
    lte: jest.fn(() => chain),
    or: jest.fn(() => chain),
    range: jest.fn(() => chain),
    insert: jest.fn(() => chain),
    update: jest.fn(() => chain),
    delete: jest.fn(() => chain),
    single: jest.fn(() => chain),
    limit: jest.fn(() => chain),
    then: (resolve: (value: T) => void, reject?: (reason: unknown) => void) =>
      Promise.resolve(result).then(resolve, reject),
  };
  return chain;
}

describe("/api/requests routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete (globalThis as any).__requestsRateLimitStore;
  });

  describe("GET", () => {
    it("returns 401 when no access token cookie is provided", async () => {
      hasAccessTokenCookie.mockReturnValue(false);

      const res = await GET(
        new Request("http://localhost/api/requests", { method: "GET" }),
      );

      expect(res.status).toBe(401);
      await expect(readResponseJson(res)).resolves.toEqual({ error: "Unauthorized" });
      expect(mockSupabaseFrom).not.toHaveBeenCalled();
    });

    it("returns mapped items when Supabase returns rows", async () => {
      hasAccessTokenCookie.mockReturnValue(true);
      mockSupabaseFrom.mockReturnValueOnce(
        createQueryBuilder({
          data: [
            { id: "rq_1", status: "Non traité" },
            { id: "rq_2", status: "Traité" },
          ],
          error: null,
        }),
      );

      const res = await GET(
        new Request("http://localhost/api/requests?page=1&pageSize=5", {
          method: "GET",
          headers: { cookie: "access_token=123" },
        }),
      );

      expect(res.status).toBe(200);
      await expect(readResponseJson(res)).resolves.toEqual({
        items: [
          { id: "rq_1", status: "Non traité" },
          { id: "rq_2", status: "Traité" },
        ],
      });
    });

    it("applies status, date and search filters", async () => {
      hasAccessTokenCookie.mockReturnValue(true);
      const chain = createQueryBuilder({ data: [], error: null });
      const eqSpy = chain.eq;
      const gteSpy = chain.gte;
      const lteSpy = chain.lte;
      const orSpy = chain.or;
      mockSupabaseFrom.mockReturnValueOnce(chain);

      const res = await GET(
        new Request(
          "http://localhost/api/requests?status=Non%20trait%C3%A9&from=2024-01-01&to=2024-01-31&search=doe",
          {
            method: "GET",
            headers: { cookie: "access_token=123" },
          },
        ),
      );

      expect(res.status).toBe(200);
      expect(eqSpy).toHaveBeenCalledWith("status", "Non traité");
      expect(gteSpy).toHaveBeenCalledWith("created_at", "2024-01-01T00:00:00.000Z");
      expect(lteSpy).toHaveBeenCalledWith("created_at", "2024-01-31T23:59:59.999Z");
      expect(orSpy).toHaveBeenCalledWith(
        expect.stringContaining("client_name.ilike.%doe%"),
      );
    });

    it("returns ServerError when Supabase query fails", async () => {
      hasAccessTokenCookie.mockReturnValue(true);
      mockSupabaseFrom.mockReturnValueOnce(
        createQueryBuilder({ data: null, error: { message: "db failed" } }),
      );

      const res = await GET(
        new Request("http://localhost/api/requests", {
          method: "GET",
          headers: { cookie: "access_token=123" },
        }),
      );

      expect(res.status).toBe(500);
      await expect(readResponseJson(res)).resolves.toEqual({
        error: "ServerError",
        details: "db failed",
      });
    });
  });

  describe("POST", () => {
    it("returns 400 when JSON body is invalid", async () => {
      const res = await POST(
        new Request("http://localhost/api/requests", {
          method: "POST",
          body: "{invalid",
        }),
      );

      expect(res.status).toBe(400);
      await expect(readResponseJson(res)).resolves.toEqual({
        error: "ValidationError",
        details: { body: "Invalid JSON" },
      });
    });

    it("returns 204 when honeypot field is filled", async () => {
      const res = await POST(
        new Request("http://localhost/api/requests", {
          method: "POST",
          body: JSON.stringify({ company: "bot" }),
        }),
      );

      expect(res.status).toBe(204);
      expect(mockSupabaseFrom).not.toHaveBeenCalled();
    });

    it("returns validation errors when normalizer reports issues", async () => {
      normalizeAndValidateCreate.mockReturnValueOnce({
        payload: {
          clientName: "",
          phone: "",
          email: "",
          comment: null,
          gender: undefined,
        },
        errors: { clientName: "required" },
      });

      const res = await POST(
        new Request("http://localhost/api/requests", {
          method: "POST",
          body: JSON.stringify({}),
        }),
      );

      expect(res.status).toBe(400);
      await expect(readResponseJson(res)).resolves.toEqual({
        error: "ValidationError",
        details: { clientName: "required" },
      });
    });

    it("stores a request and returns the created item", async () => {
      mockSupabaseFrom.mockReturnValueOnce(
        createQueryBuilder({ error: null }),
      );

      const res = await POST(
        new Request("http://localhost/api/requests", {
          method: "POST",
          body: JSON.stringify({
            clientName: "John",
            phone: "+123",
            company: "",
          }),
        }),
      );

      expect(res.status).toBe(201);
      const json = await readResponseJson(res);
      expect(json.item).toMatchObject({
        clientName: "John Doe",
        status: "Non traité",
      });
      expect(uploadAttachmentsForRequest).toHaveBeenCalled();
    });

    it("returns 429 when rate limit is exceeded", async () => {
      (globalThis as any).__requestsRateLimitStore = new Map([
        ["10.0.0.1", { count: 8, windowStart: Date.now() }],
      ]);

      const res = await POST(
        new Request("http://localhost/api/requests", {
          method: "POST",
          headers: { "x-forwarded-for": "10.0.0.1" },
          body: JSON.stringify({}),
        }),
      );

      expect(res.status).toBe(429);
      await expect(readResponseJson(res)).resolves.toEqual({
        error: "TooManyRequests",
      });
    });

    it("increments existing rate limit bucket when still under the cap", async () => {
      const store = new Map([
        ["10.0.0.2", { count: 2, windowStart: Date.now() }],
      ]);
      (globalThis as any).__requestsRateLimitStore = store;
      mockSupabaseFrom.mockReturnValueOnce(
        createQueryBuilder({ error: null }),
      );

      const res = await POST(
        new Request("http://localhost/api/requests", {
          method: "POST",
          headers: { "x-forwarded-for": "10.0.0.2" },
          body: JSON.stringify({
            clientName: "John",
            phone: "+33123456789",
          }),
        }),
      );

      expect(res.status).toBe(201);
      expect(store.get("10.0.0.2")?.count).toBe(3);
    });

    it("returns ServerError when Supabase insert fails", async () => {
      mockSupabaseFrom.mockReturnValueOnce(
        createQueryBuilder({ error: { message: "insert failed" } }),
      );

      const res = await POST(
        new Request("http://localhost/api/requests", {
          method: "POST",
          body: JSON.stringify({
            clientName: "John",
            phone: "+123",
          }),
        }),
      );

      expect(res.status).toBe(500);
      await expect(readResponseJson(res)).resolves.toEqual({
        error: "ServerError",
        details: "insert failed",
      });
    });
  });

  describe("PATCH", () => {
    it("requires the id query parameter", async () => {
      hasAccessTokenCookie.mockReturnValue(true);

      const res = await PATCH(
        new Request("http://localhost/api/requests", { method: "PATCH" }),
      );

      expect(res.status).toBe(400);
      await expect(readResponseJson(res)).resolves.toEqual({
        error: "ValidationError",
        details: { id: "L’identifiant est obligatoire" },
      });
    });

    it("returns 401 when access token is missing", async () => {
      hasAccessTokenCookie.mockReturnValue(false);

      const res = await PATCH(
        new Request("http://localhost/api/requests?id=req-1", {
          method: "PATCH",
        }),
      );

      expect(res.status).toBe(401);
      await expect(readResponseJson(res)).resolves.toEqual({
        error: "Unauthorized",
      });
    });

    it("updates request status when payload is valid", async () => {
      hasAccessTokenCookie.mockReturnValue(true);
      mockSupabaseFrom.mockReturnValueOnce(
        createQueryBuilder({
          data: { id: "req-1", status: "Non traité" },
          error: null,
        }),
      );

      const res = await PATCH(
        new Request("http://localhost/api/requests?id=req-1", {
          method: "PATCH",
          headers: { cookie: "access_token=123" },
          body: JSON.stringify({ status: "Non traité" }),
        }),
      );

      expect(res.status).toBe(200);
      await expect(readResponseJson(res)).resolves.toEqual({
        item: { id: "req-1", status: "Non traité" },
      });
    });

    it("returns 404 when the request does not exist", async () => {
      hasAccessTokenCookie.mockReturnValue(true);
      mockSupabaseFrom.mockReturnValueOnce(
        createQueryBuilder({
          data: null,
          error: { message: "Row not found" },
        }),
      );

      const res = await PATCH(
        new Request("http://localhost/api/requests?id=req-unknown", {
          method: "PATCH",
          headers: { cookie: "access_token=123" },
        }),
      );

      expect(res.status).toBe(404);
      await expect(readResponseJson(res)).resolves.toEqual({
        error: "NotFound",
      });
    });

    it("returns ServerError when Supabase update fails", async () => {
      hasAccessTokenCookie.mockReturnValue(true);
      mockSupabaseFrom.mockReturnValueOnce(
        createQueryBuilder({
          data: null,
          error: { message: "update failed" },
        }),
      );

      const res = await PATCH(
        new Request("http://localhost/api/requests?id=req-err", {
          method: "PATCH",
          headers: { cookie: "access_token=123" },
        }),
      );

      expect(res.status).toBe(500);
      await expect(readResponseJson(res)).resolves.toEqual({
        error: "ServerError",
        details: "update failed",
      });
    });
  });

  describe("DELETE", () => {
    it("returns 401 when access token is missing", async () => {
      hasAccessTokenCookie.mockReturnValue(false);

      const res = await DELETE(
        new Request("http://localhost/api/requests?id=req-1", {
          method: "DELETE",
        }),
      );

      expect(res.status).toBe(401);
      await expect(readResponseJson(res)).resolves.toEqual({
        error: "Unauthorized",
      });
    });

    it("returns 400 when id parameter is missing", async () => {
      hasAccessTokenCookie.mockReturnValue(true);

      const res = await DELETE(
        new Request("http://localhost/api/requests", {
          method: "DELETE",
          headers: { cookie: "access_token=123" },
        }),
      );

      expect(res.status).toBe(400);
      await expect(readResponseJson(res)).resolves.toEqual({
        error: "ValidationError",
        details: { id: "L’identifiant est obligatoire" },
      });
    });

    it("returns 404 when the request does not exist", async () => {
      hasAccessTokenCookie.mockReturnValue(true);
      mockSupabaseFrom.mockReturnValueOnce(
        createQueryBuilder({
          data: null,
          error: { message: "no rows" },
        }),
      );

      const res = await DELETE(
        new Request("http://localhost/api/requests?id=req-missing", {
          method: "DELETE",
          headers: { cookie: "access_token=123" },
        }),
      );

      expect(res.status).toBe(404);
      await expect(readResponseJson(res)).resolves.toEqual({
        error: "NotFound",
      });
    });

    it("deletes the request successfully", async () => {
      hasAccessTokenCookie.mockReturnValue(true);
      mockSupabaseFrom.mockReturnValueOnce(
        createQueryBuilder({ data: { id: "req-1" }, error: null }),
      );

      const res = await DELETE(
        new Request("http://localhost/api/requests?id=req-1", {
          method: "DELETE",
          headers: { cookie: "access_token=123" },
        }),
      );

      expect(res.status).toBe(204);
    });

    it("returns ServerError when delete fails", async () => {
      hasAccessTokenCookie.mockReturnValue(true);
      mockSupabaseFrom.mockReturnValueOnce(
        createQueryBuilder({
          data: null,
          error: { message: "delete failed" },
        }),
      );

      const res = await DELETE(
        new Request("http://localhost/api/requests?id=req-err", {
          method: "DELETE",
          headers: { cookie: "access_token=123" },
        }),
      );

      expect(res.status).toBe(500);
      await expect(readResponseJson(res)).resolves.toEqual({
        error: "ServerError",
        details: "delete failed",
      });
    });
  });
});
