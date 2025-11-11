import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Textarea from "./Textarea";

describe("Textarea", () => {
  it("добавляет класс заполненного состояния при наличии значения", async () => {
    render(
      <Textarea
        id="message"
        name="message"
        title="Message"
        defaultValue="Bonjour"
      />,
    );

    const textarea = screen.getByRole("textbox");
    const container = textarea.parentElement as HTMLElement;

    await waitFor(() =>
      expect(container.className).toContain("isFilled"),
    );

    fireEvent.input(textarea, { target: { value: "" } });

    await waitFor(() =>
      expect(container.className).not.toContain("isFilled"),
    );
  });

  it("устанавливает aria-атрибуты и показывает сообщение об ошибке", () => {
    render(
      <Textarea
        id="message"
        name="message"
        title="Message"
        hasError
        errorMessage="Required"
      />,
    );

    const textarea = screen.getByRole("textbox");
    const error = screen.getByText("Required");

    expect(textarea).toHaveAttribute("aria-invalid", "true");
    expect(textarea).toHaveAttribute("aria-describedby", "message-error");
    expect(error).toHaveAttribute("role", "alert");
  });
});
