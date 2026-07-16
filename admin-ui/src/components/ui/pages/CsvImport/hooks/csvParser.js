export function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  const pushCell = () => {
    row.push(cell);
    cell = "";
  };

  const pushRow = () => {
    if (row.length === 1 && row[0] === "" && rows.length > 0) {
      return;
    }
    rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      pushCell();
    } else if (ch === "\n" || (ch === "\r" && next === "\n")) {
      pushCell();
      pushRow();
      if (ch === "\r") i++;
    } else if (ch !== "\r") {
      cell += ch;
    }
  }

  if (cell.length > 0 || row.length > 0) {
    pushCell();
    pushRow();
  }

  if (rows.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = rows[0].map((h) => String(h || "").trim());
  const dataRows = rows.slice(1).filter((r) => r.some((c) => String(c || "").trim() !== ""));

  return { headers, rows: dataRows };
}

export function getSampleCell(rows, colIndex) {
  if (colIndex === null || colIndex === undefined || colIndex < 0) return "";
  for (const row of rows) {
    const val = row[colIndex];
    if (val !== undefined && String(val).trim() !== "") {
      return String(val).trim();
    }
  }
  return "";
}
