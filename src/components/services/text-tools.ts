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
export function formatJson(
  text: string,
  indent: "2" | "4" | "tab" | "minify" = "2",
) {
  if (text.length > 1000000)
    throw new Error("Use JSON smaller than 1,000,000 characters.");
  JSON.parse(text); // Validate only. Serialize the source tokens to preserve number precision and duplicate keys.
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
