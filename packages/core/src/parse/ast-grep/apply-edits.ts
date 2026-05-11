export interface TextEdit {
  startIndex: number;
  endIndex: number;
  newText: string;
}

function deduplicateEdits(edits: TextEdit[]): TextEdit[] {
  const sorted = [...edits].sort((a, b) => a.startIndex - b.startIndex);
  const result: TextEdit[] = [];
  let lastEnd = -1;

  for (const edit of sorted) {
    if (edit.startIndex >= lastEnd) {
      result.push(edit);
      lastEnd = edit.endIndex;
    }
    // overlapping edit is dropped (outer/earlier wins)
  }
  return result;
}

export function applyEdits(code: string, edits: TextEdit[]): string {
  if (edits.length === 0) return code;
  const deduped = deduplicateEdits(edits);
  const sorted = deduped.sort((a, b) => b.startIndex - a.startIndex);
  let result = code;
  for (const edit of sorted) {
    result = result.slice(0, edit.startIndex) + edit.newText + result.slice(edit.endIndex);
  }
  return result;
}
