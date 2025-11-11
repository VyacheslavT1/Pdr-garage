const capturedKeys: string[] = [];

jest.mock("next-intl", () => ({
  useTranslations: () =>
    ((key: string) => {
      capturedKeys.push(key);
      return `t(${key})`;
    }) as (key: string) => string,
}));

import { renderHook } from "@testing-library/react";
import { useServiceOptions } from "./serviceOptions";

describe("useServiceOptions", () => {
  beforeEach(() => {
    capturedKeys.length = 0;
  });

  it("возвращает набор локализованных опций", () => {
    const { result } = renderHook(() => useServiceOptions());

    expect(result.current).toEqual([
      { value: "bodyRepair", label: "t(bodyRepair)" },
      { value: "spotTouchUp", label: "t(spotTouchUp)" },
      { value: "paintlessDentRemoval", label: "t(paintlessDentRemoval)" },
      { value: "scratchBuffing", label: "t(scratchBuffing)" },
      { value: "glassCrackRepair", label: "t(glassCrackRepair)" },
      { value: "restorativePolish", label: "t(restorativePolish)" },
    ]);

    expect(capturedKeys).toEqual([
      "bodyRepair",
      "spotTouchUp",
      "paintlessDentRemoval",
      "scratchBuffing",
      "glassCrackRepair",
      "restorativePolish",
    ]);
  });
});
