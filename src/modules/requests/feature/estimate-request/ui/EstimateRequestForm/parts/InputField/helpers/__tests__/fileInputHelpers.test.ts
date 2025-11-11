import {
  extractFilesFromChangeEvent,
  mergeUniqueFiles,
  removeFileByIndex,
  applyFilesToNativeInput,
} from "../fileInputHelpers";

class MockDataTransfer {
  private store: File[] = [];

  items = {
    add: (file: File) => {
      this.store.push(file);
    },
  };

  get files(): FileList {
    const files = this.store;
    const fileListLike: any = {
      length: files.length,
      item: (index: number) => files[index] ?? null,
      [Symbol.iterator]: function* iterator() {
        yield* files;
      },
    };
    files.forEach((file, index) => {
      fileListLike[index] = file;
    });
    return fileListLike as FileList;
  }
}

beforeAll(() => {
  if (typeof global.DataTransfer === "undefined") {
    // @ts-expect-error polyfill for test environment
    global.DataTransfer = MockDataTransfer;
  }
});

describe("fileInputHelpers", () => {
  it("извлекает файлы из change события", () => {
    const file = new File(["content"], "avatar.png", { type: "image/png" });
    const input = document.createElement("input");
    Object.defineProperty(input, "files", {
      writable: true,
      value: {
        length: 1,
        item: () => file,
        0: file,
      },
    });
    const event = { target: input } as React.ChangeEvent<HTMLInputElement>;

    expect(extractFilesFromChangeEvent(event)).toEqual([file]);
  });

  it("объединяет массивы файлов без дубликатов", () => {
    const existing = [
      new File(["old"], "doc.pdf", { type: "application/pdf" }),
      new File(["img"], "photo.png", { type: "image/png" }),
    ];
    const incoming = [
      existing[1],
      new File(["new"], "manual.pdf", { type: "application/pdf" }),
    ];

    const result = mergeUniqueFiles(existing, incoming);

    expect(result).toHaveLength(3);
    expect(result[0].name).toBe("doc.pdf");
    expect(result[1].name).toBe("photo.png");
    expect(result[2].name).toBe("manual.pdf");
  });

  it("удаляет файл по индексу, не мутируя исходный массив", () => {
    const files = [
      new File(["1"], "a.txt"),
      new File(["2"], "b.txt"),
      new File(["3"], "c.txt"),
    ];

    const next = removeFileByIndex(files, 1);

    expect(next).toHaveLength(2);
    expect(next.map((f) => f.name)).toEqual(["a.txt", "c.txt"]);
    expect(files).toHaveLength(3);
  });

  it("применяет набор файлов к DOM input через DataTransfer", () => {
    const input = document.createElement("input");
    Object.defineProperty(input, "files", {
      writable: true,
      value: null,
    });

    const files = [new File(["report"], "report.pdf", { type: "application/pdf" })];
    applyFilesToNativeInput(input, files);

    const applied = input.files;
    expect(applied).not.toBeNull();
    expect(applied?.length).toBe(1);
    expect(applied?.item(0)?.name).toBe("report.pdf");
  });
});
