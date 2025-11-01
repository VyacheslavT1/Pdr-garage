export function enforceSubmitEnabled(
  form: HTMLFormElement | null,
  submitSelector = 'button[type="submit"]',
  extraDisabled?: () => boolean
): () => void {
  if (!form) return () => {};

  const submitButton = form.querySelector<HTMLButtonElement>(submitSelector);
  if (!submitButton) return () => {};

  const update = () => {
    const pending = extraDisabled?.() ?? false;
    const isValid = form.checkValidity();
    const shouldDisable = pending || !isValid;

    submitButton.disabled = shouldDisable;
    submitButton.setAttribute("aria-disabled", String(shouldDisable));
  };

  form.addEventListener("input", update);
  form.addEventListener("change", update);
  update();

  return () => {
    form.removeEventListener("input", update);
    form.removeEventListener("change", update);
  };
}

