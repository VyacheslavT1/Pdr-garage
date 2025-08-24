// Преобразует FormData в простой объект вида { [name]: value }
export function formDataToValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  formData.forEach((val, key) => {
    if (typeof val === "string") {
      values[key] = val;
    }
  });
  return values;
}
