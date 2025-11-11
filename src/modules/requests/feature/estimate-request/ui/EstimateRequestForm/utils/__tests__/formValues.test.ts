import { formDataToValues } from "../formValues";

describe("formDataToValues", () => {
  it("преобразует FormData только со строковыми значениями", () => {
    const fd = new FormData();
    fd.set("firstName", "Jean");
    fd.set("age", "30");
    fd.append("file", new Blob(["test"]), "file.txt");

    const result = formDataToValues(fd);

    expect(result).toEqual({
      firstName: "Jean",
      age: "30",
    });
  });

  it("возвращает пустой объект для пустой формы", () => {
    expect(formDataToValues(new FormData())).toEqual({});
  });
});
