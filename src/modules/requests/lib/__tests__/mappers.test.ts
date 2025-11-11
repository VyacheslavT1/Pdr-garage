import { mapRowToRequestItem } from "../mappers";

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
      status: "new",
      attachments: [
        { id: "a1", name: "photo.jpg", type: "image/jpeg", size: 512, dataUrl: "https://cdn/image" },
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
      status: "new",
    });

    expect(mapped.attachments).toHaveLength(2);
    expect(mapped.attachments[0]).toEqual({
      id: "a1",
      name: "photo.jpg",
      type: "image/jpeg",
      size: 512,
      dataUrl: "https://cdn/image",
    });
    expect(mapped.attachments[1]).toEqual({
      id: "",
      name: "",
      type: "application/octet-stream",
      size: 0,
      dataUrl: null,
    });
  });

  it("возвращает пустой список вложений, если они отсутствуют", () => {
    const mapped = mapRowToRequestItem({
      id: "req-2",
      created_at: "2024-11-03T10:00:00.000Z",
      client_name: "Bob",
      phone: "+111",
      email: "bob@example.com",
      status: "new",
      attachments: null,
    } as any);

    expect(mapped.attachments).toEqual([]);
  });
});
