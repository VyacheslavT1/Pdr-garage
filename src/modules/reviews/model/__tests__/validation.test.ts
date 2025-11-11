import {
  normalizeAndValidatePublicCreate,
  normalizeAndValidateAdminCreate,
  normalizeAndValidateAdminUpdate,
} from "../validation";

describe("reviews validation", () => {
  describe("normalizeAndValidatePublicCreate", () => {
    it("нормализует поля и допускает отсутствие рейтинга", () => {
      const { payload, errors } = normalizeAndValidatePublicCreate({
        clientName: "  Marie ",
        rating: "",
        comment: "  Great service! ",
      });

      expect(errors).toEqual({});
      expect(payload).toEqual({
        clientName: "Marie",
        rating: null,
        comment: "Great service!",
      });
    });

    it("возвращает ошибки при некорректных значениях", () => {
      const { errors } = normalizeAndValidatePublicCreate({
        clientName: "",
        rating: 10,
        comment: "x".repeat(2001),
      });

      expect(errors).toMatchObject({
        clientName: "Имя обязательно",
        rating: "Оценка должна быть числом 1–5 или null",
        comment: "Текст отзыва слишком длинный",
      });
    });
  });

  describe("normalizeAndValidateAdminCreate", () => {
    it("валидирует статус и дату", () => {
      const { payload, errors } = normalizeAndValidateAdminCreate({
        clientName: "  Paul ",
        rating: 5,
        status: "Publié",
        date: "2024-01-01",
      });

      expect(errors).toEqual({});
      expect(payload).toEqual({
        clientName: "Paul",
        rating: 5,
        status: "Publié",
        date: "2024-01-01",
      });
    });

    it("отклоняет неизвестный статус и неверную дату", () => {
      const { errors } = normalizeAndValidateAdminCreate({
        clientName: "Test",
        status: "INVALID",
        date: "not-a-date",
      });

      expect(errors).toMatchObject({
        status: "Statut non autorisé",
        date: "Format de date invalide (ISO requis ou null)",
      });
    });
  });

  describe("normalizeAndValidateAdminUpdate", () => {
    it("валидирует предоставленные поля", () => {
      const { update, errors } = normalizeAndValidateAdminUpdate({
        clientName: "  Anna  ",
        rating: 4,
        status: "Publié",
        adminReply: " Merci ",
        adminReplyAuthor: " Admin ",
      });

      expect(errors).toEqual({});
      expect(update).toEqual({
        clientName: "Anna",
        rating: 4,
        status: "Publié",
        adminReply: "Merci",
        adminReplyAuthor: "Admin",
      });
    });

    it("возвращает ошибки для недопустимых значений", () => {
      const { errors } = normalizeAndValidateAdminUpdate({
        clientName: "",
        rating: 10,
        status: "HIDDEN",
        date: "bad-date",
        adminReply: "x".repeat(4001),
        adminReplyAuthor: "x".repeat(121),
      });

      expect(errors).toMatchObject({
        clientName: "Le nom est obligatoire",
        rating: "La note doit être comprise entre 1 et 5 ou null",
        status: "Statut non autorisé",
        date: "Format de date invalide (ISO requis ou null)",
        adminReply: "La réponse de l’administrateur est trop longue",
        adminReplyAuthor: "Le nom de l’auteur est trop long",
      });
    });
  });
});
