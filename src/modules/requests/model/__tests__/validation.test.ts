import {
  normalizePhone,
  normalizeAndValidateCreate,
} from "../validation";

describe("requests validation helpers", () => {
  describe("normalizePhone", () => {
    it("очищает все символы кроме цифр и начального плюса", () => {
      expect(normalizePhone("+7 (999) 123-45-67")).toBe("+79991234567");
      expect(normalizePhone("  8-800-555-35-35 ")).toBe("88005553535");
    });
  });

  describe("normalizeAndValidateCreate", () => {
    it("валидирует обязательные поля и нормализует телефон", () => {
      const { payload, errors } = normalizeAndValidateCreate({
        clientName: "  Jean  ",
        phone: "+33 6 12 34 56 78",
        email: "user@example.com",
        comment: "Bonjour",
        gender: "male",
      });

      expect(errors).toEqual({});
      expect(payload).toMatchObject({
        clientName: "Jean",
        phone: "+33612345678",
        email: "user@example.com",
        comment: "Bonjour",
        gender: "male",
      });
    });

    it("возвращает ошибки для некорректных значений", () => {
      const { payload, errors } = normalizeAndValidateCreate({
        clientName: "",
        phone: "abc",
        comment: "x".repeat(1001),
        gender: "other",
      });

      expect(errors).toMatchObject({
        clientName: "Le nom est obligatoire",
        phone: "Format du numéro de téléphone invalide",
        comment: "Le commentaire est trop long",
        gender: "Valeur de genre non autorisée",
      });
      expect(payload.gender).toBeUndefined();
    });
  });
});
