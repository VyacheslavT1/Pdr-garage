import type { SupabaseClient } from "@supabase/supabase-js";

const createClientMock = jest.fn(() => ({ stub: true }) as unknown as SupabaseClient);

jest.mock("@supabase/supabase-js", () => ({
  createClient: createClientMock,
}));

describe("supabaseServer client factory", () => {
  const ORIGINAL_ENV = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
    createClientMock.mockClear();
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it("создаёт клиент Supabase с ожидаемыми параметрами", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";

    const { supabaseServer } = await import("./server");

    expect(createClientMock).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "service-role-key",
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    );
    expect(supabaseServer).toEqual({ stub: true });
  });

  it("передаёт undefined в createClient, если переменные окружения отсутствуют", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    await import("./server");

    expect(createClientMock).toHaveBeenCalledWith(
      undefined,
      undefined,
      expect.any(Object),
    );
  });
});
