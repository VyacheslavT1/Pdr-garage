import { GET, POST } from "./route";
import { supabaseServer } from "@/shared/api/supabase/server";
import { readResponseJson } from "@/tests/utils/readResponseJson";

jest.mock("@/shared/api/supabase/server", () => ({
  supabaseServer: { from: jest.fn() },
}));

const mockSupabaseFrom =
  supabaseServer.from as jest.MockedFunction<typeof supabaseServer.from>;

jest.mock("@/shared/api/next/securityHeaders", () => ({
  securityHeaders: { "x-test": "reviews-public" },
}));

const mapRowToReviewItem = jest.fn((row) => ({
  id: row.id,
  clientName: row.client_name,
  rating: row.rating,
  comment: row.comment,
  adminReply: row.admin_reply,
  adminReplyAuthor: row.admin_reply_author,
  adminReplyDate: row.admin_reply_date,
  status: "Publié",
}));

jest.mock("@/modules/reviews/lib/mappers", () => ({
  mapRowToReviewItem: (row: Record<string, unknown>) =>
    mapRowToReviewItem(row),
}));

const normalizeAndValidatePublicCreate = jest.fn().mockReturnValue({
  payload: {
    clientName: "Jane",
    rating: 5,
    comment: "Great!",
  },
  errors: {},
});

jest.mock("@/modules/reviews/model/validation", () => ({
  normalizeAndValidatePublicCreate: (body: unknown) =>
    normalizeAndValidatePublicCreate(body),
}));

function createQueryBuilder<T>(result: T) {
  const chain: any = {
    select: jest.fn(() => chain),
    eq: jest.fn(() => chain),
    order: jest.fn(() => chain),
    limit: jest.fn(() => chain),
    insert: jest.fn(() => chain),
    then: (resolve: (value: T) => void, reject?: (reason: unknown) => void) =>
      Promise.resolve(result).then(resolve, reject),
  };
  return chain;
}

describe("/api/reviews/public routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const store = (globalThis as any)
      .__reviewsRateLimitStore as Map<string, { count: number; windowStart: number }>;
    if (store) {
      store.clear();
    } else {
      (globalThis as any).__reviewsRateLimitStore = new Map();
    }
  });

  describe("GET", () => {
    it("returns published items mapped to the public shape", async () => {
      mockSupabaseFrom.mockReturnValueOnce(
        createQueryBuilder({
          data: [
            {
              id: "rv_1",
              client_name: "Jane",
              rating: 5,
              comment: "Great",
              admin_reply: "Thanks",
              admin_reply_author: "Admin",
              admin_reply_date: "2024-01-01",
            },
          ],
          error: null,
        }),
      );

      const res = await GET(
        new Request("http://localhost/api/reviews/public?limit=1", {
          method: "GET",
        }),
      );

      expect(res.status).toBe(200);
      await expect(readResponseJson(res)).resolves.toEqual({
        items: [
          {
            id: "rv_1",
            clientName: "Jane",
            rating: 5,
            comment: "Great",
            date: null,
            adminReply: "Thanks",
            adminReplyAuthor: "Admin",
            adminReplyDate: "2024-01-01",
          },
        ],
      });
    });

    it("returns 500 when Supabase select fails", async () => {
      mockSupabaseFrom.mockReturnValueOnce(
        createQueryBuilder({
          data: null,
          error: { message: "Select failed" },
        }),
      );

      const res = await GET(
        new Request("http://localhost/api/reviews/public", {
          method: "GET",
        }),
      );

      expect(res.status).toBe(500);
      await expect(readResponseJson(res)).resolves.toEqual({
        error: "ServerError",
        details: "Select failed",
      });
    });

    it("handles unexpected thrown values gracefully", async () => {
      mockSupabaseFrom.mockImplementationOnce(() => {
        throw "kaput";
      });

      const res = await GET(
        new Request("http://localhost/api/reviews/public", {
          method: "GET",
        }),
      );

      expect(res.status).toBe(500);
      await expect(readResponseJson(res)).resolves.toEqual({
        error: "ServerError",
        details: "Erreur inconnue",
      });
    });

    it("caps the requested limit to a safe default when query param is invalid", async () => {
      const chain = createQueryBuilder({
        data: [],
        error: null,
      });
      const limitSpy = chain.limit;
      mockSupabaseFrom.mockReturnValueOnce(chain);

      const res = await GET(
        new Request("http://localhost/api/reviews/public?limit=500", {
          method: "GET",
        }),
      );

      expect(res.status).toBe(200);
      expect(limitSpy).toHaveBeenCalledWith(20);
    });
  });

  describe("POST", () => {
    it("returns 400 when body is invalid JSON", async () => {
      const res = await POST(
        new Request("http://localhost/api/reviews/public", {
          method: "POST",
          body: "{invalid",
        }),
      );

      expect(res.status).toBe(400);
      await expect(readResponseJson(res)).resolves.toEqual({
        error: "ValidationError",
        details: { body: "Invalid JSON" },
      });
      expect(normalizeAndValidatePublicCreate).not.toHaveBeenCalled();
    });

    it("returns 204 when honeypot field is filled", async () => {
      const res = await POST(
        new Request("http://localhost/api/reviews/public", {
          method: "POST",
          body: JSON.stringify({ company: "bot" }),
        }),
      );

      expect(res.status).toBe(204);
      expect(mockSupabaseFrom).not.toHaveBeenCalled();
    });

    it("returns 429 when rate limit is exceeded", async () => {
      const store = (globalThis as any)
        .__reviewsRateLimitStore as Map<string, { count: number; windowStart: number }>;
      store.set("192.0.2.1", { count: 8, windowStart: Date.now() });

      const res = await POST(
        new Request("http://localhost/api/reviews/public", {
          method: "POST",
          headers: { "x-forwarded-for": "192.0.2.1" },
          body: JSON.stringify({ clientName: "Jane", comment: "Great" }),
        }),
      );

      expect(res.status).toBe(429);
      await expect(readResponseJson(res)).resolves.toEqual({
        error: "TooManyRequests",
      });
      expect(normalizeAndValidatePublicCreate).not.toHaveBeenCalled();
    });

    it("increments the rate-limit bucket when request is allowed", async () => {
      const store = (globalThis as any)
        .__reviewsRateLimitStore as Map<string, { count: number; windowStart: number }>;
      store.set("198.51.100.5", { count: 3, windowStart: Date.now() });
      mockSupabaseFrom.mockReturnValueOnce(
        createQueryBuilder({ error: null }),
      );

      const res = await POST(
        new Request("http://localhost/api/reviews/public", {
          method: "POST",
          headers: { "x-forwarded-for": "198.51.100.5" },
          body: JSON.stringify({ clientName: "Jane", comment: "Great" }),
        }),
      );

      expect(res.status).toBe(201);
      expect(store.get("198.51.100.5")?.count).toBe(4);
    });

    it("returns validation errors from the normalizer", async () => {
      normalizeAndValidatePublicCreate.mockReturnValueOnce({
        payload: null,
        errors: { clientName: "required" },
      });

      const res = await POST(
        new Request("http://localhost/api/reviews/public", {
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

    it("stores a draft review when payload is valid", async () => {
      mockSupabaseFrom.mockReturnValueOnce(createQueryBuilder({ error: null }));

      const res = await POST(
        new Request("http://localhost/api/reviews/public", {
          method: "POST",
          body: JSON.stringify({ clientName: "Jane", comment: "Great" }),
        }),
      );

      expect(res.status).toBe(201);
      const json = await readResponseJson(res);
      expect(json.item).toMatchObject({
        clientName: "Jane",
        status: "Brouillon",
      });
    });

    it("returns 500 when Supabase insert fails", async () => {
      mockSupabaseFrom.mockReturnValueOnce(
        createQueryBuilder({ error: { message: "Insert failed" } }),
      );

      const res = await POST(
        new Request("http://localhost/api/reviews/public", {
          method: "POST",
          body: JSON.stringify({ clientName: "Jane", comment: "Great" }),
        }),
      );

      expect(res.status).toBe(500);
      await expect(readResponseJson(res)).resolves.toEqual({
        error: "ServerError",
        details: "Insert failed",
      });
    });

    it("returns 500 when unexpected error bubbles up", async () => {
      normalizeAndValidatePublicCreate.mockImplementationOnce(() => {
        throw new Error("Normalizer crashed");
      });

      const res = await POST(
        new Request("http://localhost/api/reviews/public", {
          method: "POST",
          body: JSON.stringify({ clientName: "Jane" }),
        }),
      );

      expect(res.status).toBe(500);
      await expect(readResponseJson(res)).resolves.toEqual({
        error: "ServerError",
        details: "Normalizer crashed",
      });
    });
  });
});
