import ReviewDetailsPageExport from "./page";
import ReviewDetailsFeature from "@/modules/reviews/feature/manage/ui/ReviewDetails/AdminReviewDetailsPage";

jest.mock(
  "@/modules/reviews/feature/manage/ui/ReviewDetails/AdminReviewDetailsPage",
  () => ({
    __esModule: true,
    default: function MockReviewDetailsPage() {
      return null;
    },
  }),
);

describe("src/app/admin/reviews/[id]/page", () => {
  it("re-exports the AdminReviewDetailsPage feature", () => {
    expect(ReviewDetailsPageExport).toBe(ReviewDetailsFeature);
  });
});
