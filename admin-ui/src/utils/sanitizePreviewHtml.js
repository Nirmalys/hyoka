/**
 * Lightweight HTML sanitizer for admin-only email preview markup.
 * Strips scriptable nodes and inline event handlers without adding DOMPurify.
 *
 * @param {string} html
 * @returns {string}
 */
export function sanitizePreviewHtml(html) {
  if (typeof html !== "string" || html === "") {
    return "";
  }

  if (typeof window === "undefined" || typeof window.DOMParser === "undefined") {
    return html
      .replace(/<\/(script|iframe|object|embed|link|meta)[^>]*>/gi, "")
      .replace(/<(script|iframe|object|embed|link|meta)[^>]*>/gi, "");
  }

  const doc = new window.DOMParser().parseFromString(html, "text/html");
  doc
    .querySelectorAll("script, iframe, object, embed, link, meta, base")
    .forEach((el) => el.remove());

  doc.querySelectorAll("*").forEach((el) => {
    [...el.attributes].forEach((attr) => {
      const name = attr.name.toLowerCase();
      const value = attr.value || "";
      if (name.startsWith("on")) {
        el.removeAttribute(attr.name);
        return;
      }
      if (
        (name === "href" || name === "src" || name === "xlink:href") &&
        /^\s*javascript:/i.test(value)
      ) {
        el.removeAttribute(attr.name);
      }
    });
  });

  return doc.body.innerHTML;
}
