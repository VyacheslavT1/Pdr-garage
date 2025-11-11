import RequestsPageExport from "./page";
import RequestsListPage from "@/modules/requests/feature/manage/ui/RequestsList/AdminRequestsPage";

jest.mock(
  "@/modules/requests/feature/manage/ui/RequestsList/AdminRequestsPage",
  () => ({
    __esModule: true,
    default: function MockAdminRequestsPage() {
      return null;
    },
  }),
);

describe("src/app/admin/requests/page", () => {
  it("re-exports the AdminRequestsPage feature", () => {
    expect(RequestsPageExport).toBe(RequestsListPage);
  });
});
