import { submitEstimateRequest } from "./submit";
import { supabaseServer } from "@/shared/api/supabase/server";
import { uploadAttachmentsForRequest } from "@/modules/requests/lib/storage";

jest.mock("@/shared/api/supabase/server", () => ({
  supabaseServer: { from: jest.fn() },
}));

jest.mock("@/modules/requests/lib/storage", () => ({
  uploadAttachmentsForRequest: jest.fn(),
}));

describe("submitEstimateRequest", () => {
  const fromMock = supabaseServer.from as jest.MockedFunction<
    typeof supabaseServer.from
  >;
  const uploadAttachmentsMock =
    uploadAttachmentsForRequest as jest.MockedFunction<
      typeof uploadAttachmentsForRequest
    >;
  const uuidSpy = jest.spyOn(global.crypto, "randomUUID");
  const insertMock = jest.fn();

  afterAll(() => {
    uuidSpy.mockRestore();
  });

  beforeEach(() => {
    insertMock.mockReset();
    fromMock.mockReset();
    uploadAttachmentsMock.mockReset();
    uuidSpy.mockReturnValue("uuid-123");
    fromMock.mockReturnValue({
      insert: insertMock,
    } as unknown as ReturnType<typeof supabaseServer.from>);
    insertMock.mockResolvedValue({ error: null });
    uploadAttachmentsMock.mockImplementation(
      async (_requestId, attachments) => attachments
    );
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
    expect(insertMock).not.toHaveBeenCalled();
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

    const result = await submitEstimateRequest(formData);

    expect(result).toEqual({ ok: true });
    expect(uploadAttachmentsMock).toHaveBeenCalledTimes(1);
    expect(insertMock).toHaveBeenCalledTimes(1);

    const [insertPayload] = insertMock.mock.calls[0];
    const inserted = Array.isArray(insertPayload) ? insertPayload[0] : null;

    expect(inserted).toMatchObject({
      client_name: "Jean Dupont",
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

    insertMock.mockResolvedValueOnce({ error: { message: "fail" } });

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

    insertMock.mockRejectedValueOnce(new Error("db down"));

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
    expect(insertMock).not.toHaveBeenCalled();
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
    expect(insertMock).not.toHaveBeenCalled();
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
    expect(insertMock).not.toHaveBeenCalled();
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

  it("создаёт запись без обращения к внешнему API", async () => {
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
    expect(insertMock).toHaveBeenCalledTimes(1);
  });
});
