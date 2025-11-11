import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EstimateRequestForm from "./EstimateRequestForm";
import { validateForm } from "./utils/formValidation";
import { submitEstimateRequest } from "@/modules/requests/feature/estimate-request/model/submit";
import { formDataToValues } from "./utils/formValues";

jest.mock("react", () => {
  const actual = jest.requireActual("react");

  function useActionStateMock(reducer: any, initialState: any) {
    const reducerRef = actual.useRef(reducer);
    reducerRef.current = reducer;
    const stateRef = actual.useRef(initialState);
    const [, forceRerender] = actual.useState({});
    const [isPending, setIsPending] = actual.useState(false);

    const execute = actual.useCallback(async (formData: FormData) => {
      setIsPending(true);
      try {
        const result = await reducerRef.current(stateRef.current, formData);
        stateRef.current = result;
        forceRerender({});
        return result;
      } finally {
        setIsPending(false);
      }
    }, []);

    return [stateRef.current, execute, isPending] as const;
  }

  return {
    ...actual,
    useActionState: useActionStateMock,
  };
});

jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

jest.mock("./utils/enforceSubmitEnabled", () => ({
  enforceSubmitEnabled: () => () => {},
}));

jest.mock("./parts/RadioButton/RadioButton", () => {
  const RadioButton = ({
    id,
    name,
    value,
    label,
    checked,
  }: {
    id: string;
    name: string;
    value: string;
    label: string;
    checked?: boolean;
  }) => (
    <label htmlFor={id}>
      {label}
      <input
        id={id}
        name={name}
        type="radio"
        value={value}
        checked={checked}
        readOnly
      />
    </label>
  );
  return { __esModule: true, default: RadioButton };
});

jest.mock("./parts/InputField/InputField", () => {
  const React = require("react");
  const InputType = { Text: "text", File: "file" };
  const MockInputField = ({
    id,
    name,
    label,
    type = InputType.Text,
    hasError,
    errorMessage,
    ...rest
  }: {
    id: string;
    name: string;
    label: string;
    type?: string;
    hasError?: boolean;
    errorMessage?: string;
  }) => (
    <label htmlFor={id}>
      {label}
      <input id={id} name={name} type={type} data-testid={id} {...rest} />
      {hasError && errorMessage && (
        <span role="alert">{errorMessage}</span>
      )}
    </label>
  );
  return { __esModule: true, default: MockInputField, InputType };
});

jest.mock("./parts/Textarea/Textarea", () => ({
  __esModule: true,
  default: ({
    id,
    title,
    hasError: _hasError,
    errorMessage: _errorMessage,
    ...rest
  }: {
    id: string;
    title: string;
  }) => (
    <label htmlFor={id}>
      {title}
      <textarea id={id} {...rest} />
    </label>
  ),
}));

jest.mock("./parts/Checkbox/Checkbox", () => ({
  __esModule: true,
  default: ({
    id,
    label,
    hasError: _hasError,
    errorMessage: _errorMessage,
    ...rest
  }: {
    id: string;
    label: string;
  }) => (
    <label htmlFor={id}>
      <input id={id} type="checkbox" {...rest} /> {label}
    </label>
  ),
}));

jest.mock("@/shared/ui/button/Button", () => ({
  __esModule: true,
  default: ({
    children,
    formAction,
    onClick,
    type = "button",
    ...rest
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    formAction?: (formData: FormData) => unknown;
  }) => (
    <button
      type={type}
      {...rest}
      onClick={(event) => {
        onClick?.(event);
        event.preventDefault();
        if (typeof formAction === "function") {
          const form = (event.currentTarget as HTMLButtonElement).form;
          const formData = form ? new FormData(form) : new FormData();
          formAction(formData);
        }
      }}
    >
      {children}
    </button>
  ),
}));

jest.mock("./utils/formValidation", () => ({
  validateForm: jest.fn(),
}));

jest.mock("./utils/formValues", () => ({
  formDataToValues: jest.fn(),
}));

jest.mock("@/modules/requests/feature/estimate-request/model/submit", () => ({
  submitEstimateRequest: jest.fn(),
}));

const mockedValidateForm = validateForm as jest.MockedFunction<
  typeof validateForm
>;
const mockedSubmitEstimateRequest =
  submitEstimateRequest as jest.MockedFunction<typeof submitEstimateRequest>;
const mockedFormDataToValues = formDataToValues as jest.MockedFunction<
  typeof formDataToValues
>;

describe("EstimateRequestForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows inline validation errors when validateForm returns issues", async () => {
    mockedValidateForm.mockReturnValue({
      firstName: "validationFirstNameRequired",
    });
    mockedFormDataToValues.mockReturnValue({
      firstName: "",
    });

    render(<EstimateRequestForm />);

    const submitButton = screen.getByRole("button", {
      name: "submitLabel",
    });

    await userEvent.click(submitButton);

    expect(mockedValidateForm).toHaveBeenCalledTimes(1);
    expect(mockedFormDataToValues).toHaveBeenCalledTimes(1);

    expect(
      await screen.findByText("validationFirstNameRequired"),
    ).toBeInTheDocument();
    expect(mockedSubmitEstimateRequest).not.toHaveBeenCalled();
  });

  it("submits the form successfully and shows a success message", async () => {
    mockedValidateForm.mockReturnValue({});
    mockedSubmitEstimateRequest.mockResolvedValue({ ok: true });

    render(<EstimateRequestForm />);

    await userEvent.click(screen.getByLabelText("genderMale"));
    await userEvent.type(
      screen.getByLabelText("firstNameLabel"),
      "John",
    );
    await userEvent.type(
      screen.getByLabelText("lastNameLabel"),
      "Doe",
    );
    await userEvent.type(screen.getByLabelText("phoneLabel"), "0123456789");
    await userEvent.type(screen.getByLabelText("Email *"), "john@example.com");
    await userEvent.type(
      screen.getByLabelText("messageLabel"),
      "Long enough message",
    );
    await userEvent.click(screen.getByLabelText("consentPrivacyText"));

    const submitButton = screen.getByRole("button", {
      name: "submitLabel",
    });
    await userEvent.click(submitButton);

    await waitFor(() =>
      expect(mockedSubmitEstimateRequest).toHaveBeenCalledTimes(1),
    );

    expect(
      screen.getByText("submitSuccess"),
    ).toBeInTheDocument();

    await waitFor(() =>
      expect(screen.getByLabelText("genderMale")).not.toBeChecked(),
    );
  });
});
