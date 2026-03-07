import DOMPurify from "isomorphic-dompurify";

const ALLOWED_TAGS = [
  "html", "head", "body", "p", "br", "strong", "em", "b", "i", "u", "a",
  "h1", "h2", "h3", "h4", "ul", "ol", "li", "table", "tr", "td", "th",
  "thead", "tbody", "img", "span", "div", "blockquote", "hr", "center",
];

const ALLOWED_ATTR = [
  "href", "src", "alt", "style", "class", "target", "width", "height",
  "cellpadding", "cellspacing", "border", "align", "valign", "bgcolor",
  "color", "rel", "title",
];

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR });
}
