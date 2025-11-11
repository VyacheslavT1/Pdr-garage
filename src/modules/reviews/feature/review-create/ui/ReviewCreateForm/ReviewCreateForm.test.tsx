import React from "react";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ReviewCreateForm from "./ReviewCreateForm";

jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

jest.mock("@/shared/ui/select/Select", () => ({
  __esModule: true,
  default: ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value?: string;
    onChange: (value: string) => void;
  }) => (
    <label>
      {label}
      <input
        data-testid="rating-select"
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  ),
}));

describe("ReviewCreateForm", () => {
  it("normalizes input and calls onSubmitReview with the payload", async () => {
    const onSubmitReview = jest.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    const { container } = render(
      <ReviewCreateForm onSubmitReview={onSubmitReview} />,
    );

    const nameInput = screen.getByLabelText("fields.clientName");
    await user.type(nameInput, "  jean-luc   o'NEILL  ");

    const commentTextarea = container.querySelector(
      "#review-comment",
    ) as HTMLTextAreaElement;
    await user.type(commentTextarea, "  Super expérience  ");

    const submitButton = screen.getByRole("button", {
      name: "buttons.submit",
    });
    await waitFor(() => expect(submitButton).toBeEnabled());

    await user.click(submitButton);

    await waitFor(() =>
      expect(onSubmitReview).toHaveBeenCalledWith({
        clientName: "Jean-Luc O'Neill",
        rating: null,
        comment: "Super expérience",
      }),
    );

    expect(
      screen.getByText("messages.success"),
    ).toBeInTheDocument();
  });

  it("shows an error message when the submit handler rejects", async () => {
    const onSubmitReview = jest
      .fn()
      .mockRejectedValue(new Error("Network down"));
    const user = userEvent.setup();
    const { container } = render(
      <ReviewCreateForm onSubmitReview={onSubmitReview} />,
    );

    const nameInput = screen.getByLabelText("fields.clientName");
    await user.type(nameInput, "Alice");

    const commentTextarea = container.querySelector(
      "#review-comment",
    ) as HTMLTextAreaElement;
    await user.type(commentTextarea, "Message");

    const submitButton = screen.getByRole("button", {
      name: "buttons.submit",
    });
    await waitFor(() => expect(submitButton).toBeEnabled());

    await user.click(submitButton);

    await waitFor(() =>
      expect(onSubmitReview).toHaveBeenCalledTimes(1),
    );

    expect(
      await screen.findByRole("alert"),
    ).toHaveTextContent("Network down");
  });

  it("submits via API when no handler is provided and hides success message after timeout", async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({
      advanceTimers: jest.advanceTimersByTime,
    });
    const fetchMock = jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({}),
    } as Response);

    const { container } = render(<ReviewCreateForm />);
    const nameInput = screen.getByLabelText("fields.clientName");
    fireEvent.change(nameInput, { target: { value: "Marie Curie" } });
    const commentTextarea = container.querySelector(
      "#review-comment",
    ) as HTMLTextAreaElement;
    fireEvent.change(commentTextarea, { target: { value: "Merci !" } });

    const form = container.querySelector("form") as HTMLFormElement;
    act(() => {
      fireEvent.submit(form);
    });

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    await screen.findByText("messages.success");

    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(screen.queryByText("messages.success")).not.toBeInTheDocument();

    fetchMock.mockRestore();
    jest.useRealTimers();
  });

  it("shows API error details when backend responds with validation error", async () => {
    const user = userEvent.setup();
    const fetchMock = jest.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        error: "ValidationError",
        details: { rating: "required" },
      }),
    } as Response);

    const { container } = render(<ReviewCreateForm />);
    const nameInput = screen.getByLabelText("fields.clientName");
    fireEvent.change(nameInput, { target: { value: "Alice" } });
    const commentTextarea = container.querySelector(
      "#review-comment",
    ) as HTMLTextAreaElement;
    fireEvent.change(commentTextarea, { target: { value: "Message" } });

    const form = container.querySelector("form") as HTMLFormElement;
    fireEvent.submit(form);

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(
      await screen.findByRole("alert"),
    ).toHaveTextContent('ValidationError: {"rating":"required"}');

    fetchMock.mockRestore();
  });

  it("validates client name and comment lengths plus rating range", async () => {
    const user = userEvent.setup();
    const { container } = render(<ReviewCreateForm />);
    const nameInput = screen.getByLabelText("fields.clientName");
    fireEvent.change(nameInput, { target: { value: "A".repeat(121) } });

    const form = container.querySelector("form") as HTMLFormElement;
    fireEvent.submit(form);
    expect(
      await screen.findByRole("alert"),
    ).toHaveTextContent("errors.clientNameTooLong");

    fireEvent.change(nameInput, { target: { value: "Alice" } });

    const ratingInput = screen.getByTestId("rating-select");
    fireEvent.change(ratingInput, { target: { value: "6" } });
    fireEvent.submit(form);
    expect(
      await screen.findByRole("alert"),
    ).toHaveTextContent("errors.ratingInvalid");

    fireEvent.change(ratingInput, { target: { value: "5" } });
    const commentTextarea = container.querySelector(
      "#review-comment",
    ) as HTMLTextAreaElement;
    fireEvent.change(commentTextarea, { target: { value: "x".repeat(2001) } });
    fireEvent.submit(form);
    expect(
      await screen.findByRole("alert"),
    ).toHaveTextContent("errors.commentTooLong");
  });
});
