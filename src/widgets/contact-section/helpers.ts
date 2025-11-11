export type PublishedReview = {
  id: string;
  clientName: string;
  rating?: number | null;
  comment?: string | null;
  date?: string | null;
  adminReply?: string | null;
  adminReplyAuthor?: string | null;
  adminReplyDate?: string | null;
};

export function getInitialsFromName(fullName: string): string {
  const safe = (fullName || "").trim().replace(/\s+/g, " ");
  if (!safe) return "•";
  const parts = safe.split(" ");
  if (parts.length >= 2) {
    const first = parts[0][0] || "";
    const last = parts[parts.length - 1][0] || "";
    return (first + last).toUpperCase();
  }
  return (safe[0] || "•").toUpperCase();
}

export function normalizeName(raw: string): string {
  const trimmed = (raw || "").trim().replace(/\s+/g, " ");
  if (!trimmed) return "";
  const normalizeToken = (token: string) => {
    const splitBy = (s: string, sep: RegExp) =>
      s.split(sep).map((part) =>
        part
          ? part.charAt(0).toLocaleUpperCase() + part.slice(1).toLocaleLowerCase()
          : part,
      );
    if (token.includes("-")) return splitBy(token, /-/g).join("-");
    if (token.includes("'")) return splitBy(token, /'/g).join("'");
    if (token.includes("’")) return splitBy(token, /’/g).join("’");
    return (
      token.charAt(0).toLocaleUpperCase() + token.slice(1).toLocaleLowerCase()
    );
  };
  return trimmed
    .split(" ")
    .filter(Boolean)
    .map(normalizeToken)
    .join(" ");
}
