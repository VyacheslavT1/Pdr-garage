import { fireEvent, render, screen } from "@testing-library/react";
import InputField, { InputType } from "./InputField";
import {
  extractFilesFromChangeEvent,
  removeFileByIndex,
  applyFilesToNativeInput,
  mergeUniqueFiles,
} from "./helpers/fileInputHelpers";

jest.mock("next-intl", () => ({
  useTranslations: () => ((key: string) => `t:${key}`) as (key: string) => string,
}));

jest.mock("@/shared/ui/button/Button", () => ({
  __esModule: true,
  default: ({
    children,
    onClick,
    ...rest
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => (
    <button type="button" onClick={onClick} {...rest}>
      {children}
    </button>
  ),
}));

jest.mock("@/shared/Icons/close.svg", () => ({
  __esModule: true,
  default: () => <span data-testid="close-icon" />,
}));

jest.mock("./helpers/fileInputHelpers", () => {
  const actual = jest.requireActual("./helpers/fileInputHelpers");
  return {
    __esModule: true,
    ...actual,
    extractFilesFromChangeEvent: jest.fn(),
    removeFileByIndex: jest.fn(),
    applyFilesToNativeInput: jest.fn(),
    mergeUniqueFiles: jest.fn(),
  };
});

const mockExtract = extractFilesFromChangeEvent as jest.Mock;
const mockRemove = removeFileByIndex as jest.Mock;
const mockApply = applyFilesToNativeInput as jest.Mock;
const mockMerge = mergeUniqueFiles as jest.Mock;

describe("InputField", () => {
  beforeEach(() => {
    mockExtract.mockReset();
    mockRemove.mockReset();
    mockApply.mockReset();
    mockMerge.mockReset();
  });

  it("рендерит текстовое поле с label, значением и ошибкой", () => {
    render(
      <InputField
        id="first-name"
        name="firstName"
        label="First name"
        defaultValue="John"
        hasError
        errorMessage="Required"
        required
        maxLength={50}
      />,
    );

    const input = screen.getByLabelText("First name");

    expect(input).toHaveAttribute("type", "text");
    expect(input).toHaveAttribute("name", "firstName");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby", "first-name-error");
    expect((input as HTMLInputElement).defaultValue).toBe("John");
    expect(screen.getByText("Required")).toBeInTheDocument();
  });

  it("управляет выбором файлов и удалением через вспомогательные функции", () => {
    const mockFile = new File(["data"], "photo.png", { type: "image/png" });
    mockExtract.mockReturnValue([mockFile]);
    mockMerge.mockImplementation((_prev: File[], incoming: File[]) => incoming);
    mockRemove.mockImplementation((files: File[], index: number) =>
      files.filter((_, i) => i !== index),
    );

    render(
      <InputField
        id="attachment"
        name="attachment"
        type={InputType.File}
        label="Upload"
        multiple
      />,
    );

    const input = screen.getByLabelText("Upload");

    expect(screen.getByText("t:placeholderText")).toBeInTheDocument();
    expect(input).toHaveAttribute("aria-describedby", "attachment-hint");

    fireEvent.change(input);

    expect(mockExtract).toHaveBeenCalled();
    expect(mockMerge).toHaveBeenCalledWith([], [mockFile]);
    expect(mockApply).toHaveBeenCalledWith(input, [mockFile]);
    expect(screen.getByText("photo.png")).toBeInTheDocument();
    expect(screen.queryByText("t:placeholderText")).not.toBeInTheDocument();

    const removeButton = screen.getByRole("button", {
      name: "t:removeFileAriaLabel",
    });
    fireEvent.click(removeButton);

    expect(mockRemove).toHaveBeenCalledWith([mockFile], 0);
    expect(mockApply).toHaveBeenLastCalledWith(input, []);
    expect(screen.queryByText("photo.png")).not.toBeInTheDocument();
    expect(screen.getByText("t:placeholderText")).toBeInTheDocument();
  });
});
