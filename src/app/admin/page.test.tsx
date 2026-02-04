import React from "react";
import { render, screen } from "@testing-library/react";
import AdminHomeClient from "./AdminHomeClient";

jest.mock("@/shared/ui/admin-nav/AdminNav", () => ({
  __esModule: true,
  default: () => <nav data-testid="admin-nav" />,
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...rest }: React.ComponentProps<"a">) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

jest.mock("antd", () => {
  const React = require("react");
  const Empty = ({ description }: { description?: React.ReactNode }) => (
    <div data-testid="empty">{description}</div>
  );
  const Spin = ({
    children,
    tip,
  }: {
    children: React.ReactNode;
    tip?: React.ReactNode;
  }) => (
    <div data-testid="spin">
      {tip}
      {children}
    </div>
  );
  const Alert = ({
    message,
    description,
  }: {
    message?: React.ReactNode;
    description?: React.ReactNode;
  }) => (
    <div role="alert">
      <strong>{message}</strong>
      <span>{description}</span>
    </div>
  );

  return { Empty, Spin, Alert };
});

describe("AdminHomePage", () => {
  it("shows notifications with links when new requests and reviews exist", () => {
    render(
      <AdminHomeClient
        newRequestsCount={2}
        newReviewsCount={1}
        errorMessage={null}
      />,
    );

    const requestsNotice = screen.getByText("Vous avez 2 nouvelles demandes");
    const reviewsNotice = screen.getByText("Vous avez 1 nouvel avis");

    expect(requestsNotice.closest("a")).toHaveAttribute(
      "href",
      "/admin/requests",
    );
    expect(reviewsNotice.closest("a")).toHaveAttribute(
      "href",
      "/admin/reviews",
    );
  });

  it("shows a placeholder when there are no updates", () => {
    render(
      <AdminHomeClient
        newRequestsCount={0}
        newReviewsCount={0}
        errorMessage={null}
      />,
    );

    expect(screen.getByTestId("empty")).toBeInTheDocument();
    expect(screen.getByText("Pas de nouvelle")).toBeInTheDocument();
  });

  it("renders an alert when fetching counts fails", () => {
    render(
      <AdminHomeClient
        newRequestsCount={0}
        newReviewsCount={0}
        errorMessage="Requests count HTTP 500"
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Impossible de charger les données",
    );
    expect(screen.getByText(/Requests count HTTP 500/)).toBeInTheDocument();
  });
});
