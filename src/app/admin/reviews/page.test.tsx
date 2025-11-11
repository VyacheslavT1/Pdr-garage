import ReviewsPageExport from "./page";
import ReviewsListFeature from "@/modules/reviews/feature/manage/ui/ReviewsList/AdminReviewsPage";

jest.mock(
  "@/modules/reviews/feature/manage/ui/ReviewsList/AdminReviewsPage",
  () => ({
    __esModule: true,
    default: function MockAdminReviewsPage() {
      return null;
    },
  }),
);

describe("src/app/admin/reviews/page", () => {
  it("re-exports the AdminReviewsPage feature", () => {
    expect(ReviewsPageExport).toBe(ReviewsListFeature);
  });
});
