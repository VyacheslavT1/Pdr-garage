import {
  validatePhone,
  validateEmail,
  validateName,
  validateMessage,
  validateGender,
  validateConsent,
  validateForm,
} from "../formValidation";

describe("formValidation helpers", () => {
  describe("validatePhone", () => {
    it.each([
      ["", "validationPhoneRequired"],
      ["123", "validationPhoneInvalid"],
      ["+33 6 12 34 56 78", undefined],
      ["06 12 34 56 78", undefined],
      ["123-456-7890", undefined],
    ])("'%s' -> %s", (input, expected) => {
      expect(validatePhone(input)).toBe(expected);
    });

    it("возвращает ошибку, если после очистки остаются недопустимые символы", () => {
      expect(validatePhone("123-456-ABCD")).toBe("validationPhoneInvalid");
    });
  });

  describe("validateEmail", () => {
    it.each([
      ["", "validationEmailRequired"],
      ["wrong@", "validationEmailInvalid"],
      ["user@example.com", undefined],
    ])("'%s' -> %s", (input, expected) => {
      expect(validateEmail(input)).toBe(expected);
    });
  });

  describe("validateName", () => {
    it("валидирует обязательность, длину и символы", () => {
      expect(validateName("", "firstName")).toBe("validationFirstNameRequired");
      expect(validateName("a".repeat(61), "lastName")).toBe("validationLastNameMax");
      expect(validateName("John_", "firstName")).toBe("validationFirstNameSymbols");
      expect(validateName("Marie", "lastName")).toBeUndefined();
    });
  });

  describe("validateMessage", () => {
    it("проверяет длину сообщения", () => {
      expect(validateMessage("")).toBe("validationMessageRequired");
      expect(validateMessage("short")).toBe("validationMessageMin");
      expect(validateMessage("x".repeat(2001))).toBe("validationMessageMax");
      expect(validateMessage("valid message")).toBeUndefined();
    });
  });

  describe("validateGender", () => {
    it.each([
      ["", "validationGenderInvalid"],
      ["other", "validationGenderInvalid"],
      ["male", undefined],
    ])("'%s' -> %s", (input, expected) => {
      expect(validateGender(input)).toBe(expected);
    });
  });

  describe("validateConsent", () => {
    it("требует согласие", () => {
      expect(validateConsent(false)).toBe("validationConsentRequired");
      expect(validateConsent(true)).toBeUndefined();
    });
  });

  describe("validateForm", () => {
    it("возвращает набор ошибок при некорректных данных", () => {
      const formData = new FormData();
      formData.set("gender", "other");
      formData.set("firstName", "");
      formData.set("lastName", "");
      formData.set("phone", "123");
      formData.set("email", "wrong");
      formData.set("message", "short");

      const errors = validateForm(formData);

      expect(errors).toMatchObject({
        gender: "validationGenderInvalid",
        firstName: "validationFirstNameRequired",
        lastName: "validationLastNameRequired",
        phone: "validationPhoneInvalid",
        email: "validationEmailInvalid",
        message: "validationMessageMin",
        consent: "validationConsentRequired",
      });
    });

    it("возвращает пустой объект ошибок для валидных данных", () => {
      const formData = new FormData();
      formData.set("gender", "female");
      formData.set("firstName", "Marie");
      formData.set("lastName", "Curie");
      formData.set("phone", "+33 6 12 34 56 78");
      formData.set("email", "marie@example.com");
      formData.set("message", "Очень длинное сообщение, превышающее 10 символов");
      formData.set("consentToContact", "on");

      expect(validateForm(formData)).toEqual({});
    });

    it("валидирует отсутствие телефона", () => {
      const formData = new FormData();
      formData.set("clientName", "Jean");
      formData.set("phone", "");

      const errors = validateForm(formData);
      expect(errors.phone).toBe("validationPhoneRequired");
    });
  });
});
