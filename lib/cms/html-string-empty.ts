/**
 * True when HTML has no visible text (e.g. empty TipTap output `<p></p>`, `<p><br></p>`).
 */
export function isHtmlStringVisuallyEmpty(html: string): boolean {
  const text = html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .trim();
  return text === "";
}
