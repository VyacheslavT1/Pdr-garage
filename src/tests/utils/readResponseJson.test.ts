import { readResponseJson } from "./readResponseJson";

describe("readResponseJson", () => {
  it("parses JSON payload", async () => {
    const res = new Response(JSON.stringify({ status: "ok" }));
    await expect(readResponseJson(res)).resolves.toEqual({ status: "ok" });
  });

  it("throws when body is empty", async () => {
    await expect(readResponseJson(new Response(""))).rejects.toThrow(
      "Response body is empty",
    );
  });

  it("throws when body is not valid JSON", async () => {
    await expect(readResponseJson(new Response("{invalid"))).rejects.toThrow();
  });
});
