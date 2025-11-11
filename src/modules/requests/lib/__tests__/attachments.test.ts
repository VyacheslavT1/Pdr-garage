import { normalizeIncomingAttachments } from "../attachments";

beforeAll(() => {
  // Ensure crypto.randomUUID exists in the JSDOM environment
  if (typeof global.crypto === "undefined" || typeof global.crypto.randomUUID !== "function") {
    const nodeCrypto = require("crypto");
    const { webcrypto } = nodeCrypto;
    const randomUUID =
      typeof nodeCrypto.randomUUID === "function"
        ? nodeCrypto.randomUUID.bind(nodeCrypto)
        : webcrypto.randomUUID?.bind(webcrypto);

    // @ts-expect-error: приводим webcrypto к ожидаемому виду
    global.crypto = {
      ...webcrypto,
      randomUUID,
    };
  }
});

describe("normalizeIncomingAttachments", () => {
  it("возвращает пустой массив, если входные данные не являются массивом", () => {
    expect(normalizeIncomingAttachments(null)).toEqual([]);
    expect(normalizeIncomingAttachments(undefined)).toEqual([]);
    expect(normalizeIncomingAttachments("not-array")).toEqual([]);
  });

  it("заполняет значения по умолчанию и ограничивает массив десятью элементами", () => {
    const raw = Array.from({ length: 12 }, (_, index) => ({
      id: `id-${index}`,
      name: `file-${index}`,
      type: "image/png",
      size: 100 + index,
      dataUrl: "data:image/png;base64,AAA",
    }));

    const normalized = normalizeIncomingAttachments(raw);

    expect(normalized).toHaveLength(10);
    normalized.forEach((item, index) => {
      expect(item).toMatchObject({
        id: `id-${index}`,
        name: `file-${index}`,
        type: "image/png",
        size: 100 + index,
        dataUrl: "data:image/png;base64,AAA",
      });
    });
  });

  it("заменяет отсутствующие поля значениями по умолчанию и фильтрует не изображение", () => {
    const [valid] = normalizeIncomingAttachments([
      {
        name: null,
        type: null,
        size: "42",
        dataUrl: "data:text/plain;base64,AAA",
      },
    ]);

    expect(valid.name).toBe("file");
    expect(valid.type).toBe("application/octet-stream");
    expect(valid.size).toBe(0);
    expect(valid.dataUrl).toBeNull();
  });
});
