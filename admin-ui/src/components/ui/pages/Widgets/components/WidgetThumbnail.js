import { WIDGET_SVG_MAP } from "../../../../../assets/widgets";

const prefixSvgIds = (svg, prefix) =>
  svg
    .replace(/\bid="([^"]+)"/g, `id="${prefix}-$1"`)
    .replace(/url\(#([^)]+)\)/g, `url(#${prefix}-$1)`);

const classifyPath = (attrs) => {
  const hasStroke = /stroke=/.test(attrs);
  const hasFill = /\bfill=/.test(attrs) && !/fill="none"/.test(attrs);
  if (hasStroke && !hasFill) {
    return "widget-thumb-art widget-thumb-icon";
  }
  return "widget-thumb-art";
};

const classifyRect = (attrs) => {
  if (/fill="white"/.test(attrs) && /fill-opacity="0\.0/.test(attrs)) {
    return "widget-thumb-skip";
  }
  if (/fill="#FAFAF9"/.test(attrs)) {
    return "widget-thumb-art widget-thumb-shell";
  }
  if (/fill="#131720"/.test(attrs)) {
    const heightMatch = attrs.match(/height="([0-9.]+)"/);
    const height = heightMatch ? parseFloat(heightMatch[1]) : 0;
    if (height > 0 && height <= 8) {
      return "widget-thumb-art widget-thumb-line";
    }
    return "widget-thumb-art widget-thumb-inner";
  }
  if (/fill="#F7A224"/.test(attrs)) {
    return "widget-thumb-art widget-thumb-inner";
  }
  return "widget-thumb-art";
};

const tagArtElements = (html) =>
  html
    .replace(/<path\b([^>]*)\/>/g, (match, attrs) => {
      if (/class=/.test(attrs)) return match;
      return `<path class="${classifyPath(attrs)}"${attrs}/>`;
    })
    .replace(/<path\b([^>]*)>/g, (match, attrs) => {
      if (/class=/.test(attrs)) return match;
      return `<path class="${classifyPath(attrs)}"${attrs}>`;
    })
    .replace(/<rect\b([^>]*)\/>/g, (match, attrs) => {
      if (/class=/.test(attrs)) return match;
      return `<rect class="${classifyRect(attrs)}"${attrs}/>`;
    })
    .replace(/<rect\b([^>]*)>/g, (match, attrs) => {
      if (/class=/.test(attrs)) return match;
      return `<rect class="${classifyRect(attrs)}"${attrs}>`;
    });

const prepareSvg = (svg, prefix) => {
  let s = prefixSvgIds(svg, prefix);
  s = s.replace(/<svg([^>]*)>/, '<svg$1 preserveAspectRatio="xMidYMid slice">');

  const openTagEnd = s.indexOf(">") + 1;
  const closeTagStart = s.lastIndexOf("</svg>");
  const inner = s.slice(openTagEnd, closeTagStart);

  const firstRectMatch = inner.match(/^(\s*<rect[\s\S]*?\/>|\s*<rect[\s\S]*?<\/rect>)/);
  if (!firstRectMatch) return s;

  const bgRect = firstRectMatch[0].replace("<rect", '<rect class="widget-thumb-bg"');
  const artLayer = tagArtElements(inner.slice(firstRectMatch[0].length));

  return (
    s.slice(0, openTagEnd) +
    bgRect +
    `<g class="widget-thumb-art-layer">${artLayer}</g>` +
    s.slice(closeTagStart)
  );
};

const WidgetThumbnail = ({ widgetId, className = "" }) => {
  const raw = WIDGET_SVG_MAP[widgetId];
  if (!raw) return null;

  const safeSvg = prepareSvg(raw, widgetId.replace(/[^a-z0-9]/gi, ""));

  return (
    <div
      className={`widget-thumb w-full h-full flex items-center justify-center overflow-hidden ${className}`}
      dangerouslySetInnerHTML={{ __html: safeSvg }}
      aria-hidden="true"
    />
  );
};

export default WidgetThumbnail;
