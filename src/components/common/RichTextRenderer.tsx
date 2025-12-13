// --- Helper to render rich text from CMS ---
// Note: supports HTML strings, objects with { html }, and markdown objects { type: "markdown", content }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function RichTextRenderer({ content, className = "" }: { content: any; className?: string }) {
  if (!content) return null;

  const base = "prose prose-lg prose-slate mx-auto text-justify leading-8 text-gray-600";
  const classes = className ? `${base} ${className}` : base;

  // Minimal HTML escape to keep markdown conversion safe
  const escapeHtml = (str: string) =>
    str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  // Very small markdown -> HTML converter (headings, lists, bold/italic, links, paragraphs, line breaks)
  const markdownToHtml = (md: string) => {
    // Normalize newlines
    const lines = md.replace(/\r\n?/g, "\n").split("\n");
    const out: string[] = [];
    let inUl = false;

    const flushUl = () => {
      if (inUl) {
        out.push("</ul>");
        inUl = false;
      }
    };

    for (const raw of lines) {
      const line = raw.trimEnd();
      // Horizontal rule
      if (/^\s*-{3,}\s*$/.test(line)) {
        flushUl();
        out.push("<hr/>");
        continue;
      }

      // Headings ###, ##, #
      const hMatch = /^(#{1,6})\s+(.*)$/.exec(line);
      if (hMatch) {
        flushUl();
        const level = Math.min(6, hMatch[1].length);
        const text = hMatch[2];
        out.push(`<h${level}>${inlineMd(text)}</h${level}>`);
        continue;
      }

      // Unordered list items - or *
      const liMatch = /^[-*]\s+(.*)$/.exec(line);
      if (liMatch) {
        if (!inUl) {
          out.push('<ul dir="rtl">');
          inUl = true;
        }
        out.push(`<li>${inlineMd(liMatch[1])}</li>`);
        continue;
      } else {
        flushUl();
      }

      // Empty line => paragraph break
      if (line.trim() === "") {
        out.push("");
        continue;
      }

      // Paragraph
      out.push(`<p>${inlineMd(line)}</p>`);
    }

    flushUl();
    return out.join("\n");
  };

  const inlineMd = (text: string) => {
    // Escape first
    let s = escapeHtml(text);
    // Links [text](url)
    s = s.replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener" class="text-indigo-600 hover:text-indigo-700">$1</a>');
    // Bold **text**
    s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    // Italic _text_ or *text*
    s = s.replace(/(^|\W)_(.*?)_(?=\W|$)/g, "$1<em>$2</em>");
    s = s.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    // Inline code `code`
    s = s.replace(/`([^`]+)`/g, '<code class="font-mono text-sm bg-gray-100 px-1 py-0.5 rounded">$1</code>');
    return s;
  };

  // Case 1: Content is a direct HTML string
  if (typeof content === "string") {
    // If it looks like plain HTML, render as HTML; otherwise treat as markdown
    const looksLikeHtml = /<\w+[^>]*>/.test(content);
    const html = looksLikeHtml ? content : markdownToHtml(content);
    return <div className={classes} dangerouslySetInnerHTML={{ __html: html }} />;
  }

  // Case 2: Object with { html }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeof content === "object" && (content as any)?.html) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return <div className={classes} dangerouslySetInnerHTML={{ __html: (content as any).html }} />;
  }

  // Case 3: Markdown object shape: { type: "markdown", content: string }
  if (
    typeof content === "object" &&
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (content as any)?.type === "markdown" &&
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    typeof (content as any)?.content === "string"
  ) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const html = markdownToHtml((content as any).content);
    return <div className={classes} dangerouslySetInnerHTML={{ __html: html }} />;
  }

  // Fallback: show JSON (debug)
  return <div className="text-gray-600 text-center">{JSON.stringify(content)}</div>;
}

export default RichTextRenderer;
