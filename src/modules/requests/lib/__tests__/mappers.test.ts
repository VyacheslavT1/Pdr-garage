import { mapRowToRequestItem } from "../mappers";
import type { RequestStatus } from "../../model/types";

describe("mapRowToRequestItem", () => {
  it("конвертирует строку базы данных в RequestItem", () => {
    const row = {
      id: "req-1",
      created_at: "2024-11-03T10:00:00.000Z",
      client_name: "Alice",
      gender: "female" as const,
      phone: "+123456",
      email: "alice@example.com",
      comment: "Need help",
      status: "Non traité" as RequestStatus,
      attachments: [
        {
          id: "a1",
          name: "photo.jpg",
          type: "image/jpeg",
          size: 512,
          storagePath: "requests/req-1/a1_photo.jpg",
          publicUrl: "https://cdn.example/req-1/a1_photo.jpg",
          dataUrl: "https://cdn/image",
        },
        { id: 123, name: null, type: null, size: "not-number", dataUrl: null },
      ],
    };

    const mapped = mapRowToRequestItem(row);

    expect(mapped).toMatchObject({
      id: "req-1",
      createdAt: "2024-11-03T10:00:00.000Z",
      clientName: "Alice",
      gender: "female",
      phone: "+123456",
      email: "alice@example.com",
      comment: "Need help",
      status: "Non traité",
      storagePaths: [],
    });

    expect(mapped.attachments).toBeDefined();
    const attachments = mapped.attachments ?? [];

    expect(attachments).toHaveLength(2);
    expect(attachments[0]).toEqual({
      id: "a1",
      name: "photo.jpg",
      type: "image/jpeg",
      size: 512,
      storagePath: "requests/req-1/a1_photo.jpg",
      publicUrl: "https://cdn.example/req-1/a1_photo.jpg",
      dataUrl: "https://cdn/image",
    });
    expect(attachments[1]).toEqual({
      id: "",
      name: "",
      type: "application/octet-stream",
      size: 0,
      dataUrl: null,
      storagePath: null,
      publicUrl: null,
    });
  });

  it("возвращает пустой список вложений, если они отсутствуют", () => {
    const mapped = mapRowToRequestItem({
      id: "req-2",
      created_at: "2024-11-03T10:00:00.000Z",
      client_name: "Bob",
      phone: "+111",
      email: "bob@example.com",
      status: "Non traité" as RequestStatus,
      attachments: null,
    } as any);

    expect(mapped.attachments).toEqual([]);
    expect(mapped.storagePaths).toEqual([]);
  });
});
