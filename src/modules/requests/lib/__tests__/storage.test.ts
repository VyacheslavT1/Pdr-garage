import type { RequestAttachment } from "../../model/types";

const uploadMock = jest.fn();
const getPublicUrlMock = jest.fn();

jest.mock("@/shared/api/supabase/server", () => ({
  supabaseServer: {
    storage: {
      from: () => ({
        upload: uploadMock,
        getPublicUrl: getPublicUrlMock,
      }),
    },
  },
}));

import { uploadAttachmentsForRequest } from "../storage";

beforeEach(() => {
  jest.resetAllMocks();
  delete process.env.DISABLE_STORAGE_UPLOADS;
});

describe("uploadAttachmentsForRequest", () => {
  it("возвращает вложения как есть, если загрузка отключена", async () => {
    process.env.DISABLE_STORAGE_UPLOADS = "true";
    const attachments: RequestAttachment[] = [
      { id: "a1", name: "file.png", type: "image/png", size: 10, dataUrl: "data:image/png;base64,Zm9v" },
    ];

    const result = await uploadAttachmentsForRequest("req-1", attachments);

    expect(uploadMock).not.toHaveBeenCalled();
    expect(result).toEqual(attachments);
  });

  it("загружает dataUrl в Supabase и подменяет ссылку на публичную", async () => {
    uploadMock.mockResolvedValue({ error: null });
    getPublicUrlMock.mockReturnValue({ data: { publicUrl: "https://cdn.example/req/a1_file.png" } });

    const [result] = await uploadAttachmentsForRequest("req-2", [
      {
        id: "a1",
        name: "file.png",
        type: "image/png",
        size: NaN,
        dataUrl: "data:image/png;base64,Zm9v", // "foo"
      },
    ]);

    expect(uploadMock).toHaveBeenCalledWith(
      "requests/req-2/a1_file.png",
      expect.any(Buffer),
      expect.objectContaining({ contentType: "image/png", upsert: true }),
    );
    expect(result.dataUrl).toBe("https://cdn.example/req/a1_file.png");
    expect(result.size).toBe(Buffer.from("Zm9v", "base64").byteLength);
  });

  it("оставляет dataUrl пустым при ошибке загрузки", async () => {
    uploadMock.mockResolvedValue({ error: new Error("fail") });
    getPublicUrlMock.mockReturnValue({ data: { publicUrl: "" } });

    const [result] = await uploadAttachmentsForRequest("req-3", [
      {
        id: "a1",
        name: "file.png",
        type: "image/png",
        size: 100,
        dataUrl: "data:image/png;base64,Zm9v",
      },
    ]);

    expect(result.dataUrl).toBeNull();
  });

  it("обнуляет dataUrl при неверном формате base64", async () => {
    uploadMock.mockResolvedValue({ error: null });
    getPublicUrlMock.mockReturnValue({ data: { publicUrl: "" } });

    const [result] = await uploadAttachmentsForRequest("req-4", [
      {
        id: "a1",
        name: "file.png",
        type: "image/png",
        size: 100,
        dataUrl: "not-a-data-url",
      },
    ]);

    expect(result.dataUrl).toBeNull();
  });
});
