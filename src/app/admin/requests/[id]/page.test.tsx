import RequestDetailsPageExport from "./page";
import RequestDetailsFeature from "@/modules/requests/feature/manage/ui/RequestDetails/AdminRequestDetailsPage";

jest.mock(
  "@/modules/requests/feature/manage/ui/RequestDetails/AdminRequestDetailsPage",
  () => ({
    __esModule: true,
    default: function MockRequestDetailsPage() {
      return null;
    },
  }),
);

describe("src/app/admin/requests/[id]/page", () => {
  it("re-exports the AdminRequestDetailsPage feature", () => {
    expect(RequestDetailsPageExport).toBe(RequestDetailsFeature);
  });
});
