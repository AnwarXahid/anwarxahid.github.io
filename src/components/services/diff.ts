export type DiffWord = {
  kind: "same" | "added" | "removed";
  text: string;
};

export type DiffLine = {
  kind: "same" | "added" | "removed";
  text: string;
  oldLine?: number;
  newLine?: number;
  words?: DiffWord[];
};

export function compareTexts(
  before: string,
  after: string,
  options: {
    ignoreCase?: boolean;
    ignoreWhitespace?: boolean;
    diffWords?: boolean;
  } = {},
): DiffLine[] {
  const split = (s: string) =>
    s === "" ? [] : s.replace(/\r\n?/g, "\n").split("\n");
  const a = split(before),
    b = split(after);
  const normalize = (s: string) => {
    if (options.ignoreWhitespace) s = s.replace(/\s+/g, " ").trim();
    return options.ignoreCase ? s.toLowerCase() : s;
  };
  const x = a.map(normalize),
    y = b.map(normalize);
  // Bound the quadratic work to keep the browser responsive on large pastes.
  if (a.length > 1400 || b.length > 1400)
    throw new Error(
      "Please compare fewer lines (up to 1,400 lines on each side).",
    );
  const table = Array.from(
    { length: a.length + 1 },
    () => new Uint16Array(b.length + 1),
  );
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--)
      table[i][j] =
        x[i] === y[j]
          ? 1 + table[i + 1][j + 1]
          : Math.max(table[i + 1][j], table[i][j + 1]);
  const result: DiffLine[] = [];
  let i = 0,
    j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && x[i] === y[j]) {
      result.push({ kind: "same", text: a[i], oldLine: ++i, newLine: ++j });
    } else if (
      i < a.length &&
      (j === b.length || table[i + 1][j] >= table[i][j + 1])
    ) {
      result.push({ kind: "removed", text: a[i], oldLine: ++i });
    } else {
      result.push({ kind: "added", text: b[j], newLine: ++j });
    }
  }

  if (options.diffWords) {
    // Perform intra-line word diffs on adjacent removed & added lines
    for (let k = 0; k < result.length - 1; k++) {
      if (result[k].kind === "removed" && result[k + 1].kind === "added") {
        const { oldWords, newWords } = compareWords(
          result[k].text,
          result[k + 1].text,
          { ignoreCase: options.ignoreCase },
        );
        result[k].words = oldWords;
        result[k + 1].words = newWords;
      }
    }
  }

  return result;
}

/**
 * Tokenize a line into words, punctuation, and whitespace chunks.
 */
export function tokenizeWords(s: string): string[] {
  return s.match(/[\p{L}\p{N}]+|[^\p{L}\p{N}\s]+|\s+/gu) || [];
}

/**
 * Compute word-level difference between two lines.
 */
export function compareWords(
  before: string,
  after: string,
  options: { ignoreCase?: boolean } = {},
): { oldWords: DiffWord[]; newWords: DiffWord[] } {
  const a = tokenizeWords(before);
  const b = tokenizeWords(after);
  const norm = (s: string) => (options.ignoreCase ? s.toLowerCase() : s);

  const table = Array.from(
    { length: a.length + 1 },
    () => new Uint16Array(b.length + 1),
  );

  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      table[i][j] =
        norm(a[i]) === norm(b[j])
          ? 1 + table[i + 1][j + 1]
          : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }

  const oldWords: DiffWord[] = [];
  const newWords: DiffWord[] = [];
  let i = 0,
    j = 0;

  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && norm(a[i]) === norm(b[j])) {
      oldWords.push({ kind: "same", text: a[i] });
      newWords.push({ kind: "same", text: b[j] });
      i++;
      j++;
    } else if (
      i < a.length &&
      (j === b.length || table[i + 1][j] >= table[i][j + 1])
    ) {
      oldWords.push({ kind: "removed", text: a[i++] });
    } else {
      newWords.push({ kind: "added", text: b[j++] });
    }
  }

  return { oldWords, newWords };
}

/**
 * Helper to visualize spaces and tabs when whitespace visibility is enabled.
 */
export function visualizeWhitespace(text: string): string {
  return text.replace(/ /g, "·").replace(/\t/g, "⇥\t");
}
