jest.mock("next/headers", () => ({
  headers: jest.fn(),
}));

import { headers } from "next/headers";
import { submitEstimateRequest } from "./submit";

describe("submitEstimateRequest", () => {
  const headersMock = headers as jest.Mock;
  const originalFetch = global.fetch;
  const fetchMock = jest.fn();
  const uuidSpy = jest.spyOn(global.crypto, "randomUUID");

  beforeAll(() => {
    global.fetch = fetchMock as unknown as typeof global.fetch;
  });

  afterAll(() => {
    global.fetch = originalFetch;
    uuidSpy.mockRestore();
  });

  beforeEach(() => {
    fetchMock.mockReset();
    headersMock.mockReset();
    uuidSpy.mockReturnValue("uuid-123");
    headersMock.mockResolvedValue({
      get: (key: string) => {
        if (key === "x-forwarded-proto") return "https";
        if (key === "host") return "example.com";
        return null;
      },
    });
  });

  it("возвращает ошибки валидации при некорректных данных", async () => {
    const formData = new FormData();
    formData.set("gender", "other");
    formData.set("firstName", "");
    formData.set("lastName", "");
    formData.set("phone", "abc");
    formData.set("email", "wrong");
    formData.set("message", "");

    const result = await submitEstimateRequest(formData);

    expect(result.ok).toBe(false);
    expect(result.fieldErrors).toMatchObject({
      gender: "validationGenderInvalid",
      firstName: "validationFirstNameRequired",
      lastName: "validationLastNameRequired",
      phone: "validationPhoneRequired",
      email: "validationEmailInvalid",
      message: "validationMessageRequired",
      consent: "validationConsentRequired",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("отправляет форму и возвращает ok=true", async () => {
    const formData = new FormData();
    formData.set("gender", "male");
    formData.set("firstName", "Jean");
    formData.set("lastName", "Dupont");
    formData.set("phone", "+33 6 12 34 56 78");
    formData.set("email", "jean@example.com");
    formData.set("message", "Bonjour");
    formData.set("consentToContact", "on");

    const sampleImage = new File([Buffer.from("image")], "photo.png", {
      type: "image/png",
    });
    Object.defineProperty(sampleImage, "arrayBuffer", {
      value: async () => Buffer.from("image"),
      configurable: true,
    });
    formData.append("attachment", sampleImage);

    fetchMock.mockResolvedValueOnce({ status: 201 } as Response);

    const result = await submitEstimateRequest(formData);

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.com/api/requests",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          Accept: "application/json",
        }),
      }),
    );

    const [, requestInit] = fetchMock.mock.calls[0];
    const parsedBody = JSON.parse(
      String((requestInit as RequestInit)?.body),
    ) as Record<string, unknown>;

    expect(parsedBody).toMatchObject({
      clientName: "Jean Dupont",
      phone: "+33 6 12 34 56 78",
      email: "jean@example.com",
      comment: "Bonjour",
      attachments: [
        expect.objectContaining({
          id: "att_uuid-123",
          name: "photo.png",
          type: "image/png",
          dataUrl: expect.stringContaining("data:image/png;base64,"),
        }),
      ],
    });
  });

  it("возвращает formError, если запрос завершился ошибкой", async () => {
    const formData = new FormData();
    formData.set("gender", "male");
    formData.set("firstName", "Jean");
    formData.set("lastName", "Dupont");
    formData.set("phone", "+33 6 12 34 56 78");
    formData.set("email", "jean@example.com");
    formData.set("message", "Bonjour");
    formData.set("consentToContact", "on");

    fetchMock.mockResolvedValueOnce({ status: 500 } as Response);

    const result = await submitEstimateRequest(formData);

    expect(result).toEqual({ ok: false, formError: "formSubmitFailed" });
  });

  it("возвращает formError, если запрос завершился исключением", async () => {
    const formData = new FormData();
    formData.set("gender", "male");
    formData.set("firstName", "Jean");
    formData.set("lastName", "Dupont");
    formData.set("phone", "+33 6 12 34 56 78");
    formData.set("email", "jean@example.com");
    formData.set("message", "Bonjour");
    formData.set("consentToContact", "on");

    fetchMock.mockRejectedValueOnce(new Error("network error"));

    const result = await submitEstimateRequest(formData);

    expect(result).toEqual({ ok: false, formError: "formSubmitFailed" });
  });

  it("возвращает ошибку вложения для неподдерживаемого типа файла", async () => {
    const formData = new FormData();
    formData.set("gender", "male");
    formData.set("firstName", "Jean");
    formData.set("lastName", "Dupont");
    formData.set("phone", "+33 6 12 34 56 78");
    formData.set("email", "jean@example.com");
    formData.set("message", "Bonjour");
    formData.set("consentToContact", "on");

    const invalidAttachment = new File([Buffer.from("content")], "note.txt", {
      type: "text/plain",
    });
    formData.set("attachment", invalidAttachment);

    const result = await submitEstimateRequest(formData);

    expect(result.ok).toBe(false);
    expect(result.fieldErrors?.attachment).toBe("validationAttachmentType");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("валидирует максимальные длины, размер вложения и обязательные поля", async () => {
    const formData = new FormData();
    formData.set("gender", "male");
    formData.set("firstName", "A".repeat(61));
    formData.set("lastName", "B".repeat(61));
    formData.set("phone", "1234567");
    formData.set("email", "");
    formData.set("message", "x".repeat(2001));

    const largePdf = new File([Buffer.from("content")], "brochure.pdf", {
      type: "application/pdf",
    });
    Object.defineProperty(largePdf, "size", {
      value: 11 * 1024 * 1024,
    });
    formData.set("attachment", largePdf);

    const result = await submitEstimateRequest(formData);

    expect(result.ok).toBe(false);
    expect(result.fieldErrors).toEqual(
      expect.objectContaining({
        firstName: "validationFirstNameMax",
        lastName: "validationLastNameMax",
        phone: "validationPhoneInvalid",
        email: "validationEmailRequired",
        message: "validationMessageMax",
        attachment: "validationAttachmentSize",
        consent: "validationConsentRequired",
      }),
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("возвращает ошибки, если имена содержат запрещённые символы", async () => {
    const formData = new FormData();
    formData.set("gender", "male");
    formData.set("firstName", "Jean123");
    formData.set("lastName", "Du-pont");
    formData.set("phone", "+33 6 12 34 56 78");
    formData.set("email", "jean@example.com");
    formData.set("message", "Bonjour");
    formData.set("consentToContact", "on");

    const result = await submitEstimateRequest(formData);

    expect(result.ok).toBe(false);
    expect(result.fieldErrors).toMatchObject({
      firstName: "validationFirstNameSymbols",
      lastName: "validationLastNameSymbols",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("возвращает formError если обработка FormData завершилась исключением", async () => {
    class BrokenFormData extends FormData {
      override getAll(_name: string): FormDataEntryValue[] {
        throw new Error("boom");
      }
    }

    const formData = new BrokenFormData();

    const result = await submitEstimateRequest(formData);

    expect(result).toEqual({ ok: false, formError: "formSubmitFailed" });
  });

  it("использует http по умолчанию, когда заголовок x-forwarded-proto отсутствует", async () => {
    headersMock.mockResolvedValueOnce({
      get: (key: string) => {
        if (key === "host") return "api.example.com";
        return null;
      },
    });
    fetchMock.mockResolvedValueOnce({ status: 201 } as Response);

    const formData = new FormData();
    formData.set("gender", "female");
    formData.set("firstName", "Marie");
    formData.set("lastName", "Curie");
    formData.set("phone", "+33 6 12 34 56 78");
    formData.set("email", "marie@example.com");
    formData.set("message", "Bonjour");
    formData.set("consentToContact", "on");

    const result = await submitEstimateRequest(formData);

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.example.com/api/requests",
      expect.any(Object),
    );
  });
});
