import { GET, PUT, POST, DELETE } from "./route";
import { supabaseServer } from "@/shared/api/supabase/server";
import { readResponseJson } from "@/tests/utils/readResponseJson";

jest.mock("@/shared/api/supabase/server", () => ({
  supabaseServer: { from: jest.fn() },
}));

const mockSupabaseFrom =
  supabaseServer.from as jest.MockedFunction<typeof supabaseServer.from>;

jest.mock("@/shared/api/next/securityHeaders", () => ({
  securityHeaders: { "x-test": "reviews" },
}));

const mapRowToReviewItem = jest.fn((row) => ({
  id: row.id,
  status: row.status,
}));

jest.mock("@/modules/reviews/lib/mappers", () => ({
  mapRowToReviewItem: (row: Record<string, unknown>) =>
    mapRowToReviewItem(row),
}));

const normalizeAndValidateAdminUpdate = jest.fn().mockReturnValue({
  update: { status: "Publié" },
  errors: {},
});
const normalizeAndValidateAdminCreate = jest.fn().mockReturnValue({
  payload: { clientName: "John", status: "Brouillon", rating: 5, date: null },
  errors: {},
});

jest.mock("@/modules/reviews/model/validation", () => ({
  normalizeAndValidateAdminUpdate: (body: unknown) =>
    normalizeAndValidateAdminUpdate(body),
  normalizeAndValidateAdminCreate: (body: unknown) =>
    normalizeAndValidateAdminCreate(body),
}));

const hasAccessTokenCookie = jest.fn(() => false);

jest.mock("@/modules/auth/lib/cookies", () => ({
  hasAccessTokenCookie: (value: string) => hasAccessTokenCookie(value),
}));

function createQueryBuilder<T>(result: T) {
  const chain: any = {
    select: jest.fn(() => chain),
    order: jest.fn(() => chain),
    eq: jest.fn(() => chain),
    insert: jest.fn(() => chain),
    update: jest.fn(() => chain),
    delete: jest.fn(() => chain),
    single: jest.fn(() => chain),
    then: (resolve: (value: T) => void, reject?: (reason: unknown) => void) =>
      Promise.resolve(result).then(resolve, reject),
  };
  return chain;
}

describe("/api/reviews routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("GET", () => {
    it("returns 401 when unauthorized", async () => {
      hasAccessTokenCookie.mockReturnValue(false);

      const res = await GET(
        new Request("http://localhost/api/reviews", { method: "GET" }),
      );

      expect(res.status).toBe(401);
      await expect(readResponseJson(res)).resolves.toEqual({ error: "Unauthorized" });
    });

    it("returns a single review when id is provided", async () => {
      hasAccessTokenCookie.mockReturnValue(true);
      mockSupabaseFrom.mockReturnValueOnce(
        createQueryBuilder({
          data: { id: "rv_1", status: "Publié" },
          error: null,
        }),
      );

      const res = await GET(
        new Request("http://localhost/api/reviews?id=rv_1", {
          method: "GET",
          headers: { cookie: "access_token=abc" },
        }),
      );

      expect(res.status).toBe(200);
      await expect(readResponseJson(res)).resolves.toEqual({
        item: { id: "rv_1", status: "Publié" },
      });
    });

    it("returns 404 when review is missing", async () => {
      hasAccessTokenCookie.mockReturnValue(true);
      mockSupabaseFrom.mockReturnValueOnce(
        createQueryBuilder({
          data: null,
          error: { message: "Row not found" },
        }),
      );

      const res = await GET(
        new Request("http://localhost/api/reviews?id=rv_missing", {
          method: "GET",
          headers: { cookie: "access_token=abc" },
        }),
      );

      expect(res.status).toBe(404);
      await expect(readResponseJson(res)).resolves.toEqual({
        error: "NotFound",
      });
    });

    it("returns ServerError when Supabase single call fails unexpectedly", async () => {
      hasAccessTokenCookie.mockReturnValue(true);
      mockSupabaseFrom.mockReturnValueOnce(
        createQueryBuilder({
          data: null,
          error: { message: "db offline" },
        }),
      );

      const res = await GET(
        new Request("http://localhost/api/reviews?id=rv_err", {
          method: "GET",
          headers: { cookie: "access_token=abc" },
        }),
      );

      expect(res.status).toBe(500);
      await expect(readResponseJson(res)).resolves.toEqual({
        error: "ServerError",
        details: "db offline",
      });
    });

    it("returns a list of reviews when no id provided", async () => {
      hasAccessTokenCookie.mockReturnValue(true);
      mockSupabaseFrom.mockReturnValueOnce(
        createQueryBuilder({
          data: [
            { id: "rv_1", status: "Publié" },
            { id: "rv_2", status: "Brouillon" },
          ],
          error: null,
        }),
      );

      const res = await GET(
        new Request("http://localhost/api/reviews", {
          method: "GET",
          headers: { cookie: "access_token=abc" },
        }),
      );

      expect(res.status).toBe(200);
      await expect(readResponseJson(res)).resolves.toEqual({
        items: [
          { id: "rv_1", status: "Publié" },
          { id: "rv_2", status: "Brouillon" },
        ],
      });
    });

    it("returns ServerError when Supabase fails", async () => {
      hasAccessTokenCookie.mockReturnValue(true);
      mockSupabaseFrom.mockReturnValueOnce(
        createQueryBuilder({
          data: null,
          error: { message: "db failed" },
        }),
      );

      const res = await GET(
        new Request("http://localhost/api/reviews", {
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
  });

  describe("PUT", () => {
    it("requires the id parameter", async () => {
      hasAccessTokenCookie.mockReturnValue(true);

      const res = await PUT(
        new Request("http://localhost/api/reviews", { method: "PUT" }),
      );

      expect(res.status).toBe(400);
      await expect(readResponseJson(res)).resolves.toEqual({
        error: "ValidationError",
        details: { id: "L’identifiant est obligatoire" },
      });
    });

    it("returns 401 when unauthorized", async () => {
      hasAccessTokenCookie.mockReturnValue(false);

      const res = await PUT(
        new Request("http://localhost/api/reviews?id=rv_1", {
          method: "PUT",
        }),
      );

      expect(res.status).toBe(401);
      await expect(readResponseJson(res)).resolves.toEqual({
        error: "Unauthorized",
      });
    });

    it("returns 400 when body is not JSON", async () => {
      hasAccessTokenCookie.mockReturnValue(true);

      const res = await PUT(
        new Request("http://localhost/api/reviews?id=rv_1", {
          method: "PUT",
          headers: { cookie: "access_token=abc" },
          body: "not-json",
        }),
      );

      expect(res.status).toBe(400);
      await expect(readResponseJson(res)).resolves.toEqual({
        error: "ValidationError",
        details: { body: "JSON invalide" },
      });
    });

    it("returns validation errors from the update normalizer", async () => {
      hasAccessTokenCookie.mockReturnValue(true);
      normalizeAndValidateAdminUpdate.mockReturnValueOnce({
        update: {},
        errors: { rating: "invalid" },
      });

      const res = await PUT(
        new Request("http://localhost/api/reviews?id=rv_1", {
          method: "PUT",
          headers: { cookie: "access_token=abc" },
          body: JSON.stringify({ rating: 10 }),
        }),
      );

      expect(res.status).toBe(400);
      await expect(readResponseJson(res)).resolves.toEqual({
        error: "ValidationError",
        details: { rating: "invalid" },
      });
    });

    it("updates review successfully", async () => {
      hasAccessTokenCookie.mockReturnValue(true);
      mockSupabaseFrom.mockReturnValueOnce(
        createQueryBuilder({
          data: { id: "rv_1", status: "Publié" },
          error: null,
        }),
      );

      const res = await PUT(
        new Request("http://localhost/api/reviews?id=rv_1", {
          method: "PUT",
          headers: { cookie: "access_token=abc" },
          body: JSON.stringify({ status: "Publié" }),
        }),
      );

      expect(res.status).toBe(200);
      await expect(readResponseJson(res)).resolves.toEqual({
        item: { id: "rv_1", status: "Publié" },
      });
    });

    it("returns 404 when review is missing during update", async () => {
      hasAccessTokenCookie.mockReturnValue(true);
      mockSupabaseFrom.mockReturnValueOnce(
        createQueryBuilder({
          data: null,
          error: { message: "Row not found" },
        }),
      );

      const res = await PUT(
        new Request("http://localhost/api/reviews?id=rv_2", {
          method: "PUT",
          headers: { cookie: "access_token=abc" },
          body: JSON.stringify({ status: "Publié" }),
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

      const res = await PUT(
        new Request("http://localhost/api/reviews?id=rv_3", {
          method: "PUT",
          headers: { cookie: "access_token=abc" },
          body: JSON.stringify({ status: "Publié" }),
        }),
      );

      expect(res.status).toBe(500);
      await expect(readResponseJson(res)).resolves.toEqual({
        error: "ServerError",
        details: "update failed",
      });
    });

    it("maps camelCase update fields to snake_case columns and admin reply metadata", async () => {
      jest.useFakeTimers().setSystemTime(new Date("2024-05-01T10:00:00Z"));
      hasAccessTokenCookie.mockReturnValue(true);
      normalizeAndValidateAdminUpdate.mockReturnValueOnce({
        update: {
          clientName: "Jean",
          rating: 4,
          status: "Publié",
          date: "2024-04-01",
          adminReply: "Merci",
          adminReplyAuthor: "Claire",
        },
        errors: {},
      });
      const chain = createQueryBuilder({
        data: { id: "rv_1", status: "Publié" },
        error: null,
      });
      mockSupabaseFrom.mockReturnValueOnce(chain);

      const res = await PUT(
        new Request("http://localhost/api/reviews?id=rv_1", {
          method: "PUT",
          headers: { cookie: "access_token=abc" },
          body: JSON.stringify({ status: "Publié" }),
        }),
      );

      expect(res.status).toBe(200);
      expect(chain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          client_name: "Jean",
          rating: 4,
          status: "Publié",
          date: "2024-04-01",
          admin_reply: "Merci",
          admin_reply_author: "Claire",
          admin_reply_date: "2024-05-01T10:00:00.000Z",
          updated_at: "2024-05-01T10:00:00.000Z",
        }),
      );
    });

    it("clears admin reply date when admin reply is removed", async () => {
      jest.useFakeTimers().setSystemTime(new Date("2024-05-01T10:00:00Z"));
      hasAccessTokenCookie.mockReturnValue(true);
      normalizeAndValidateAdminUpdate.mockReturnValueOnce({
        update: { adminReply: null },
        errors: {},
      });
      const chain = createQueryBuilder({
        data: { id: "rv_2", status: "Publié" },
        error: null,
      });
      mockSupabaseFrom.mockReturnValueOnce(chain);

      const res = await PUT(
        new Request("http://localhost/api/reviews?id=rv_2", {
          method: "PUT",
          headers: { cookie: "access_token=abc" },
          body: JSON.stringify({ adminReply: null }),
        }),
      );

      expect(res.status).toBe(200);
      expect(chain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          admin_reply: null,
          admin_reply_date: null,
        }),
      );
    });
  });

  describe("POST", () => {
    it("returns validation errors from normalize step", async () => {
      hasAccessTokenCookie.mockReturnValue(true);
      normalizeAndValidateAdminCreate.mockReturnValueOnce({
        payload: null,
        errors: { clientName: "required" },
      });

      const res = await POST(
        new Request("http://localhost/api/reviews", {
          method: "POST",
          body: JSON.stringify({}),
          headers: { cookie: "access_token=abc" },
        }),
      );

      expect(res.status).toBe(400);
      await expect(readResponseJson(res)).resolves.toEqual({
        error: "ValidationError",
        details: { clientName: "required" },
      });
    });

    it("creates a review when validation succeeds", async () => {
      hasAccessTokenCookie.mockReturnValue(true);
      mockSupabaseFrom.mockReturnValueOnce(
        createQueryBuilder({
          data: { id: "rv_new", status: "Brouillon" },
          error: null,
        }),
      );

      const res = await POST(
        new Request("http://localhost/api/reviews", {
          method: "POST",
          headers: { cookie: "access_token=abc" },
          body: JSON.stringify({ clientName: "John" }),
        }),
      );

      expect(res.status).toBe(201);
      await expect(readResponseJson(res)).resolves.toEqual({
        item: { id: "rv_new", status: "Brouillon" },
      });
    });

    it("returns 401 when unauthorized", async () => {
      hasAccessTokenCookie.mockReturnValue(false);

      const res = await POST(
        new Request("http://localhost/api/reviews", { method: "POST" }),
      );

      expect(res.status).toBe(401);
      await expect(readResponseJson(res)).resolves.toEqual({
        error: "Unauthorized",
      });
    });

    it("returns 400 when JSON is invalid", async () => {
      hasAccessTokenCookie.mockReturnValue(true);

      const res = await POST(
        new Request("http://localhost/api/reviews", {
          method: "POST",
          headers: { cookie: "access_token=abc" },
          body: "{bad",
        }),
      );

      expect(res.status).toBe(400);
      await expect(readResponseJson(res)).resolves.toEqual({
        error: "ValidationError",
        details: { body: "JSON invalide" },
      });
    });

    it("returns ServerError when Supabase insert fails", async () => {
      hasAccessTokenCookie.mockReturnValue(true);
      mockSupabaseFrom.mockReturnValueOnce(
        createQueryBuilder({
          data: null,
          error: { message: "insert failed" },
        }),
      );

      const res = await POST(
        new Request("http://localhost/api/reviews", {
          method: "POST",
          headers: { cookie: "access_token=abc" },
          body: JSON.stringify({ clientName: "John" }),
        }),
      );

      expect(res.status).toBe(500);
      await expect(readResponseJson(res)).resolves.toEqual({
        error: "ServerError",
        details: "insert failed",
      });
    });
  });

  describe("DELETE", () => {
    it("requires id query parameter", async () => {
      hasAccessTokenCookie.mockReturnValue(true);

      const res = await DELETE(
        new Request("http://localhost/api/reviews", { method: "DELETE" }),
      );

      expect(res.status).toBe(400);
      await expect(readResponseJson(res)).resolves.toEqual({
        error: "ValidationError",
        details: { id: "L’identifiant est obligatoire" },
      });
    });

    it("returns 401 when unauthorized", async () => {
      hasAccessTokenCookie.mockReturnValue(false);

      const res = await DELETE(
        new Request("http://localhost/api/reviews?id=rv_1", {
          method: "DELETE",
        }),
      );

      expect(res.status).toBe(401);
      await expect(readResponseJson(res)).resolves.toEqual({
        error: "Unauthorized",
      });
    });

    it("deletes a review successfully", async () => {
      hasAccessTokenCookie.mockReturnValue(true);
      mockSupabaseFrom.mockReturnValueOnce(
        createQueryBuilder({ data: { id: "rv_1" }, error: null }),
      );

      const res = await DELETE(
        new Request("http://localhost/api/reviews?id=rv_1", {
          method: "DELETE",
          headers: { cookie: "access_token=abc" },
        }),
      );

      expect(res.status).toBe(204);
    });

    it("returns 404 when review is missing", async () => {
      hasAccessTokenCookie.mockReturnValue(true);
      mockSupabaseFrom.mockReturnValueOnce(
        createQueryBuilder({
          data: null,
          error: { message: "Row not found" },
        }),
      );

      const res = await DELETE(
        new Request("http://localhost/api/reviews?id=rv_missing", {
          method: "DELETE",
          headers: { cookie: "access_token=abc" },
        }),
      );

      expect(res.status).toBe(404);
      await expect(readResponseJson(res)).resolves.toEqual({
        error: "NotFound",
      });
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
        new Request("http://localhost/api/reviews?id=rv_err", {
          method: "DELETE",
          headers: { cookie: "access_token=abc" },
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
