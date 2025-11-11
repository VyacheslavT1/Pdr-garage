import { mapRowToReviewItem } from "../mappers";

describe("mapRowToReviewItem", () => {
  it("преобразует строку базы данных в ReviewItem", () => {
    const row = {
      id: "rev-1",
      client_name: "Jean",
      rating: 4,
      status: "Publié",
      comment: "Très bien",
      date: "2024-01-01",
      updated_at: "2024-01-02T12:00:00Z",
      admin_reply: "Merci",
      admin_reply_date: "2024-01-03T15:00:00Z",
      admin_reply_author: "Admin",
    };

    expect(mapRowToReviewItem(row as any)).toEqual({
      id: "rev-1",
      clientName: "Jean",
      rating: 4,
      status: "Publié",
      comment: "Très bien",
      date: "2024-01-01",
      updatedAt: "2024-01-02T12:00:00Z",
      adminReply: "Merci",
      adminReplyDate: "2024-01-03T15:00:00Z",
      adminReplyAuthor: "Admin",
    });
  });

  it("подставляет null для необязательных полей", () => {
    const row = {
      id: "rev-2",
      client_name: "Luc",
      status: "Brouillon",
      updated_at: "2024-01-02T12:00:00Z",
    };

    expect(mapRowToReviewItem(row as any)).toEqual({
      id: "rev-2",
      clientName: "Luc",
      rating: null,
      status: "Brouillon",
      comment: null,
      date: null,
      updatedAt: "2024-01-02T12:00:00Z",
      adminReply: null,
      adminReplyDate: null,
      adminReplyAuthor: null,
    });
  });
});
