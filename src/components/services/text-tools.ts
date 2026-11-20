import Papa from "papaparse";

export type CleanOptions = {
  trimLines: boolean;
  collapseSpaces: boolean;
  removeEmptyLines: boolean;
  joinWrappedLines: boolean;
};

export const defaultCleanOptions: CleanOptions = {
  trimLines: true,
  collapseSpaces: true,
  removeEmptyLines: false,
  joinWrappedLines: false,
};

export function cleanText(
  text: string,
  options: CleanOptions = defaultCleanOptions,
) {
  let result = text.replace(/\r\n?/g, "\n");
  if (options.collapseSpaces) result = result.replace(/[^\S\n]+/g, " ");
  if (options.trimLines)
    result = result
      .split("\n")
      .map((line) => line.trim())
      .join("\n");
  if (options.joinWrappedLines)
    result = result.replace(/([^\n])\n(?=[^\n])/g, "$1 ");
  if (options.removeEmptyLines)
    result = result
      .split("\n")
      .filter((line) => line.trim() !== "")
      .join("\n");
  return result;
}

export type TextCase =
  "upper" | "lower" | "title" | "sentence" | "camel" | "snake" | "kebab";

export function convertCase(text: string, targetCase: TextCase): string {
  switch (targetCase) {
    case "upper":
      return text.toUpperCase();
    case "lower":
      return text.toLowerCase();
    case "title":
      return text.replace(
        /\b[\p{L}\p{N}]+/gu,
        (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
      );
    case "sentence":
      return text.replace(
        /(^\s*|[.!?]\s+)([\p{L}\p{N}])/gu,
        (_, prefix, char) => prefix + char.toUpperCase(),
      );
    case "camel": {
      const words = text.match(/[\p{L}\p{N}]+/gu) || [];
      const first = words[0];
      if (!first) return "";
      return (
        first.toLowerCase() +
        words
          .slice(1)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join("")
      );
    }
    case "snake": {
      const words = text.match(/[\p{L}\p{N}]+/gu) || [];
      return words.map((w) => w.toLowerCase()).join("_");
    }
    case "kebab": {
      const words = text.match(/[\p{L}\p{N}]+/gu) || [];
      return words.map((w) => w.toLowerCase()).join("-");
    }
  }
}

export type TextStats = {
  chars: number;
  charsNoSpaces: number;
  words: number;
  lines: number;
  paragraphs: number;
};

export function countTextStats(text: string): TextStats {
  const chars = text.length;
  const charsNoSpaces = text.replace(/\s/g, "").length;
  const words = (text.trim().match(/[\p{L}\p{N}]+/gu) || []).length;
  const lines = text === "" ? 0 : text.split(/\r\n?|\n/).length;
  const paragraphs = text
    .trim()
    .split(/\n\s*\n/)
    .filter(Boolean).length;
  return { chars, charsNoSpaces, words, lines, paragraphs };
}

export function formatJson(
  text: string,
  indent: "2" | "4" | "tab" | "minify" = "2",
) {
  if (text.length > 1000000)
    throw new Error("Use JSON smaller than 1,000,000 characters.");
  JSON.parse(text); // Validate only. Serialize source tokens to preserve number precision and duplicate keys.
  const tokens =
    text.match(
      /"(?:\\[\s\S]|[^"\\])*"|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?|true|false|null|[{}\[\],:]/g,
    ) || [];
  let depth = 0;
  for (const token of tokens) {
    if (token === "{" || token === "[") {
      depth++;
      if (depth > 100)
        throw new Error("Use JSON with no more than 100 nesting levels.");
    } else if (token === "}" || token === "]") depth--;
  }
  if (indent === "minify") return tokens.join("");
  const unit = indent === "tab" ? "\t" : " ".repeat(Number(indent));
  let output = "",
    size = 0;
  depth = 0;
  function append(s: string) {
    size += s.length;
    if (size > 5000000)
      throw new Error(
        "Formatted output is too large. Try Minify or a smaller file.",
      );
    output += s;
  }
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i],
      next = tokens[i + 1],
      previous = tokens[i - 1];
    if (token === "{" || token === "[") {
      append(token);
      depth++;
      if (next !== "}" && next !== "]") append("\n" + unit.repeat(depth));
    } else if (token === "}" || token === "]") {
      depth--;
      if (previous !== "{" && previous !== "[")
        append("\n" + unit.repeat(depth));
      append(token);
    } else if (token === ",") append(",\n" + unit.repeat(depth));
    else if (token === ":") append(": ");
    else append(token);
  }
  return output;
}

export function formatCsv(
  text: string,
  targetFormat: "csv" | "tsv" | "json" = "csv",
): string {
  if (text.length > 2000000) {
    throw new Error("Use CSV smaller than 2,000,000 characters.");
  }
  const parsed = Papa.parse<string[]>(text, {
    skipEmptyLines: false,
  });

  if (parsed.errors && parsed.errors.length > 0) {
    const err = parsed.errors[0];
    throw new Error(`CSV error on row ${err.row ?? 1}: ${err.message}`);
  }

  if (targetFormat === "json") {
    // If header row exists, create JSON objects, otherwise array of arrays
    const data = parsed.data;
    if (data.length <= 1) return JSON.stringify(data, null, 2);
    const headers = data[0];
    const rows = data.slice(1).map((row) => {
      const obj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        obj[h || `col_${idx + 1}`] = row[idx] ?? "";
      });
      return obj;
    });
    return JSON.stringify(rows, null, 2);
  }

  const delimiter = targetFormat === "tsv" ? "\t" : ",";
  return Papa.unparse(parsed.data, {
    delimiter,
    quotes: true,
  });
}

/**
 * Format and validate XML safely without resolving external entities.
 */
export function formatXml(
  text: string,
  indent: "2" | "4" | "tab" | "minify" = "2",
): string {
  if (text.length > 1000000) {
    throw new Error("Use XML smaller than 1,000,000 characters.");
  }

  // Check for external entities attempt
  if (/<!ENTITY[^>]+SYSTEM/i.test(text) || /<!DOCTYPE[^>]+SYSTEM/i.test(text)) {
    throw new Error("External entity resolution is forbidden for security.");
  }

  // Validate syntax
  if (typeof DOMParser !== "undefined") {
    const doc = new DOMParser().parseFromString(text, "application/xml");
    const parserError = doc.querySelector("parsererror");
    if (parserError) {
      throw new Error(`Invalid XML: ${parserError.textContent?.slice(0, 150)}`);
    }
  } else {
    // Minimal tag matching validation for non-DOM test runners
    const openTags: string[] = [];
    const tagRegex = /<\/?([a-zA-Z0-9_:-]+)(?:\s+[^>]*)?(\/?)>/g;
    let match;
    while ((match = tagRegex.exec(text)) !== null) {
      const isClosing = match[0].startsWith("</");
      const isSelfClosing = match[2] === "/" || match[0].endsWith("/>");
      const tagName = match[1];
      if (match[0].startsWith("<?") || match[0].startsWith("<!")) continue;
      if (isSelfClosing) continue;
      if (isClosing) {
        const last = openTags.pop();
        if (last !== tagName)
          throw new Error(`Mismatched closing tag </${tagName}>`);
      } else {
        openTags.push(tagName);
      }
    }
    if (openTags.length > 0)
      throw new Error(`Unclosed tag <${openTags.pop()}>`);
  }

  if (indent === "minify") {
    return text.replace(/>\s+</g, "><").trim();
  }

  const pad = indent === "tab" ? "\t" : " ".repeat(Number(indent));
  let formatted = "";
  let depth = 0;
  const tokens =
    text
      .replace(/>\s*</g, "><")
      .match(/(?:<!\[CDATA\[[\s\S]*?\]\]>)|(?:<[^>]+>)|(?:[^<]+)/g) || [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i].trim();
    if (!token) continue;

    if (token.startsWith("<?") || token.startsWith("<!DOCTYPE")) {
      formatted += token + "\n";
    } else if (token.startsWith("</")) {
      depth = Math.max(0, depth - 1);
      formatted += pad.repeat(depth) + token + "\n";
    } else if (token.startsWith("<") && token.endsWith("/>")) {
      formatted += pad.repeat(depth) + token + "\n";
    } else if (token.startsWith("<") && !token.startsWith("<![CDATA[")) {
      formatted += pad.repeat(depth) + token;
      // Check if next token is text content followed by closing tag
      const next1 = tokens[i + 1]?.trim();
      const next2 = tokens[i + 2]?.trim();
      if (next1 && !next1.startsWith("<") && next2 && next2.startsWith("</")) {
        formatted += next1 + next2 + "\n";
        i += 2;
      } else {
        formatted += "\n";
        depth++;
      }
    } else {
      formatted += pad.repeat(depth) + token + "\n";
    }
  }

  return formatted.trim();
}
