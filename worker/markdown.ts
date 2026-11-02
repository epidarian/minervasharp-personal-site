import { escapeHtml } from "./http";

export interface PostDocument {
  title: string;
  date: string;
  summary: string;
  body: string;
}

const MAX_TITLE = 200;
const MAX_SUMMARY = 500;
const MAX_MARKDOWN = 100_000;

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

// Strip the common inline markdown so an inferred title or summary reads as
// plain text rather than showing raw `*`, backticks, or link syntax.
function stripInline(text: string): string {
  return text
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .trim();
}

function inferTitle(body: string): string {
  for (const line of body.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const heading = trimmed.match(/^#{1,6}\s+(.+)$/);
    const text = stripInline(heading ? heading[1] : trimmed);
    if (text) return text.slice(0, MAX_TITLE);
    return "Untitled";
  }
  return "Untitled";
}

function inferSummary(body: string, fallback: string): string {
  for (const block of body.replace(/\r\n/g, "\n").split(/\n{2,}/)) {
    const trimmed = block.trim();
    if (!trimmed || /^#{1,6}\s/.test(trimmed)) continue;
    const text = stripInline(trimmed.replace(/\n/g, " "));
    if (text) return text.slice(0, MAX_SUMMARY);
  }
  return fallback.slice(0, MAX_SUMMARY);
}

// Accept YYYY-MM-DD, single-digit or slash variants, or any Date-parseable
// string; fall back to today so a post is never rejected over its date.
function normalizeDate(value: string): string {
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const parts = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (parts) {
    return `${parts[1]}-${parts[2].padStart(2, "0")}-${parts[3].padStart(2, "0")}`;
  }
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return todayIso();
}

// Parse a post file. Front matter is used when present, but any missing field
// is inferred from the body so a plain markdown paste still produces a post.
// Returns null only when there is nothing usable (empty or oversized input).
export function parseMarkdownFile(raw: string): PostDocument | null {
  if (raw.length === 0 || raw.length > MAX_MARKDOWN) return null;
  const source = raw.replace(/^\uFEFF/, "").trim();
  if (source.length === 0) return null;

  let body = source;
  const meta: Record<string, string> = {};
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (match) {
    for (const line of match[1].split(/\r?\n/)) {
      if (!line.trim()) continue;
      const kv = line.match(/^([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$/);
      if (!kv) continue; // ignore lines we do not understand instead of failing
      let value = kv[2].trim();
      if (
        (value.startsWith('"') && value.endsWith('"') && value.length >= 2) ||
        (value.startsWith("'") && value.endsWith("'") && value.length >= 2)
      ) {
        value = value.slice(1, -1);
      }
      meta[kv[1].toLowerCase()] = value;
    }
    body = match[2];
  }

  const title = (meta.title?.trim() || inferTitle(body)).slice(0, MAX_TITLE) || "Untitled";
  const date = normalizeDate(meta.date ?? "");
  const summary = (meta.summary?.trim() || inferSummary(body, title)).slice(0, MAX_SUMMARY) || title;
  return { title, date, summary, body };
}

// Build a post from the Ops form fields. Title and summary are inferred from
// the body when left blank, and the date falls back to today, so the only way
// to get nothing usable is to leave both the title and the body empty.
export function documentFromFields(fields: {
  title: string;
  date: string;
  summary: string;
  body: string;
}): PostDocument | null {
  const body = fields.body.replace(/^\uFEFF/, "");
  if (body.length > MAX_MARKDOWN) return null;
  if (!fields.title.trim() && body.trim().length === 0) return null;
  const title = (fields.title.trim() || inferTitle(body)).slice(0, MAX_TITLE) || "Untitled";
  const date = normalizeDate(fields.date);
  const summary = (fields.summary.trim() || inferSummary(body, title)).slice(0, MAX_SUMMARY) || title;
  return { title, date, summary, body };
}

export function normalizeSlug(input: string): string | null {
  const slug = input.trim().toLowerCase().replace(/\.md$/i, "");
  if (slug.length === 0 || slug.length > 80) return null;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null;
  return slug;
}

function safeUrl(href: string): string | null {
  const value = href.trim();
  if (!value || /[\u0000-\u001f\s]/.test(value)) return null;
  if (/^(https?:\/\/|mailto:)/i.test(value)) return value;
  if (value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\")) {
    return value;
  }
  return null;
}

function renderInline(escaped: string): string {
  const codes: string[] = [];
  let text = escaped.replace(/`([^`\n]+)`/g, (_match, code: string) => {
    codes.push(`<code>${code}</code>`);
    return `\u0000${codes.length - 1}\u0000`;
  });
  text = text.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_match, label: string, href: string) => {
    const safe = safeUrl(href);
    if (!safe) return label;
    return `<a href="${safe}">${label}</a>`;
  });
  text = text.replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
  return text.replace(/\u0000(\d+)\u0000/g, (_match, index: string) => codes[Number(index)] ?? "");
}

// Split a GFM table row into trimmed cells, dropping the optional leading and
// trailing pipes.
function splitTableRow(row: string): string[] {
  let text = row.trim();
  if (text.startsWith("|")) text = text.slice(1);
  if (text.endsWith("|")) text = text.slice(0, -1);
  return text.split("|").map((cell) => cell.trim());
}

// A delimiter row is the second line of a table: cells of dashes with optional
// leading/trailing colons for alignment, e.g. `|:--|:-:|--:|`.
function isTableDelimiter(row: string): boolean {
  if (!row.includes("-")) return false;
  const cells = splitTableRow(row);
  return cells.length > 0 && cells.every((cell) => /^:?-+:?$/.test(cell));
}

function cellAlign(delimiter: string): string | null {
  const left = delimiter.startsWith(":");
  const right = delimiter.endsWith(":");
  if (left && right) return "center";
  if (right) return "right";
  if (left) return "left";
  return null;
}

function renderCell(tag: "th" | "td", content: string, align: string | null): string {
  const style = align ? ` style="text-align:${align}"` : "";
  return `<${tag}${style}>${renderInline(content)}</${tag}>`;
}

function renderTable(lines: string[]): string {
  const headers = splitTableRow(lines[0]);
  const aligns = splitTableRow(lines[1]).map(cellAlign);
  const headRow = headers.map((cell, i) => renderCell("th", cell, aligns[i] ?? null)).join("");
  const bodyRows = lines
    .slice(2)
    .filter((line) => line.trim() !== "")
    .map((line) => {
      const cells = splitTableRow(line);
      const row = headers
        .map((_, i) => renderCell("td", cells[i] ?? "", aligns[i] ?? null))
        .join("");
      return `<tr>${row}</tr>`;
    })
    .join("");
  const body = bodyRows ? `<tbody>${bodyRows}</tbody>` : "";
  return `<table><thead><tr>${headRow}</tr></thead>${body}</table>`;
}

// HTML in the source is escaped before any tags are added, so the stored
// markdown cannot inject markup.
export function renderMarkdown(body: string): string {
  const escaped = escapeHtml(body.replace(/\r\n/g, "\n")).replace(/\r/g, "\n");
  const fences: string[] = [];
  const withoutFences = escaped.replace(
    /```[^\n`]*\n([\s\S]*?)```/g,
    (_match, code: string) => {
      const trimmed = code.endsWith("\n") ? code.slice(0, -1) : code;
      fences.push(`<pre><code>${trimmed}</code></pre>`);
      return `\u0001${fences.length - 1}\u0001`;
    },
  );

  return withoutFences
    .split(/\n{2,}/)
    .map((block) => {
      const fence = block.trim().match(/^\u0001(\d+)\u0001$/);
      if (fence) return fences[Number(fence[1])] ?? "";
      const lines = block.split("\n");
      const heading = lines.length === 1 ? lines[0].match(/^(#{1,3}) (.+)$/) : null;
      if (heading) {
        const level = heading[1].length;
        return `<h${level}>${renderInline(heading[2])}</h${level}>`;
      }
      if (lines.length >= 2 && lines[0].includes("|") && isTableDelimiter(lines[1])) {
        return renderTable(lines);
      }
      if (lines.every((line) => line.startsWith("&gt; "))) {
        const inner = lines.map((line) => renderInline(line.slice(5))).join("<br>");
        return `<blockquote><p>${inner}</p></blockquote>`;
      }
      if (lines.every((line) => /^[-*] /.test(line))) {
        const items = lines.map((line) => `<li>${renderInline(line.slice(2))}</li>`).join("");
        return `<ul>${items}</ul>`;
      }
      if (lines.every((line) => /^\d+\. /.test(line))) {
        const items = lines
          .map((line) => `<li>${renderInline(line.replace(/^\d+\. /, ""))}</li>`)
          .join("");
        return `<ol>${items}</ol>`;
      }
      return `<p>${lines.map((line) => renderInline(line)).join("<br>")}</p>`;
    })
    .filter(Boolean)
    .join("\n");
}
