// Включает/отключает submit-кнопку на основе HTML5-валидности формы.
// extraDisabled можно передать, чтобы дополнительно учитывать, например, флаг isPending.

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
    const isValid = form.checkValidity(); // HTML5
    const shouldDisable = pending || !isValid;

    submitButton.disabled = shouldDisable;
    submitButton.setAttribute("aria-disabled", String(shouldDisable));
  };

  // Слушаем ввод/изменения и проверяем валидность
  form.addEventListener("input", update);
  form.addEventListener("change", update);

  // Первичная инициализация
  update();

  // Очистка слушателей
  return () => {
    form.removeEventListener("input", update);
    form.removeEventListener("change", update);
  };
}
