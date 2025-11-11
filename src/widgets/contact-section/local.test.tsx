import { getInitialsFromName, normalizeName } from "./helpers";

describe("contact-section helpers", () => {
  describe("getInitialsFromName", () => {
    it.each([
      ["Jean Dupont", "JD"],
      ["   anna  ", "A"],
      ["", "•"],
      ["Élodie De La Croix", "ÉC"],
    ])("returns initials for '%s'", (input, expected) => {
      expect(getInitialsFromName(input)).toBe(expected);
    });
  });

  describe("normalizeName", () => {
    it("capitalizes and preserves accents/apostrophes", () => {
      expect(normalizeName("  jean-luc   o'neill ")).toBe("Jean-Luc O'Neill");
      expect(normalizeName("ÉLODIE")).toBe("Élodie");
    });

    it("returns empty string for falsy values", () => {
      expect(normalizeName("   ")).toBe("");
    });
  });
});
