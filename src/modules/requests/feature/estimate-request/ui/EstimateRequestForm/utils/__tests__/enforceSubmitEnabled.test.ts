import { enforceSubmitEnabled } from "../enforceSubmitEnabled";

function createFormWithSubmit() {
  const form = document.createElement("form");
  const input = document.createElement("input");
  input.name = "phone";
  input.required = true;
  form.appendChild(input);

  const submit = document.createElement("button");
  submit.type = "submit";
  form.appendChild(submit);

  document.body.appendChild(form);

  return { form, input, submit };
}

describe("enforceSubmitEnabled", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("отключает сабмит до тех пор, пока форма невалидна", () => {
    const { form, input, submit } = createFormWithSubmit();

    const dispose = enforceSubmitEnabled(form);
    expect(submit.disabled).toBe(true);
    expect(submit.getAttribute("aria-disabled")).toBe("true");

    input.value = "+33612345678";
    input.dispatchEvent(new Event("input", { bubbles: true }));

    expect(form.checkValidity()).toBe(true);
    expect(submit.disabled).toBe(false);
    expect(submit.getAttribute("aria-disabled")).toBe("false");

    dispose();

    input.value = "";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    expect(submit.disabled).toBe(false);
  });

  it("учитывает дополнительную функцию блокировки", () => {
    const { form, submit } = createFormWithSubmit();

    enforceSubmitEnabled(form, 'button[type="submit"]', () => true);

    expect(submit.disabled).toBe(true);
    expect(submit.getAttribute("aria-disabled")).toBe("true");
  });

  it("возвращает noop, если форма отсутствует", () => {
    const dispose = enforceSubmitEnabled(null);
    expect(() => dispose()).not.toThrow();
  });

  it("возвращает noop, если кнопка сабмита не найдена", () => {
    const form = document.createElement("form");
    const dispose = enforceSubmitEnabled(form);
    expect(() => dispose()).not.toThrow();
  });
});
