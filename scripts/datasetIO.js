// Shared dataset reader/writer for scripts/loadTests.js and
// scripts/exportResults.js. Supports .csv (simple, single-sheet) and
// .xlsx/.xls (multi-sheet workbooks, one sheet per agent), and tolerates
// realistic header inconsistencies: "Question" vs "User Query",
// leading/trailing spaces, "Expected Answer" vs "Expected Answer / Key
// Points", etc. - the kind of drift that accumulates across a benchmark
// dataset maintained by hand in Excel over time.
const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");
const { stringify } = require("csv-stringify/sync");
const XLSX = require("xlsx");

function normalizeHeader(h) {
  return String(h).trim().toLowerCase().replace(/\s+/g, " ");
}

const QUESTION_ALIASES = ["question", "user query"];
const EXPECTED_ALIASES = ["expected answer", "expected answer / key points"];
const STAGING_ALIASES = ["answer in staging", "answer in stagging"];
const SCORE_ALIASES = ["score"];
const PASS_FAIL_ALIASES = ["pass / fail", "pass/fail"];
const AGENT_COLUMN_ALIASES = ["agent"];

// Maps free-text values that might appear in a workbook's "Agent" column
// ("HR Agent", "Legal Agent", ...) to scripts/agentMap.js keys.
const AGENT_VALUE_ALIASES = {
  "hr agent": "HR",
  hr: "HR",
  "legal agent": "LEGAL",
  legal: "LEGAL",
  "finance agent": "FINANCE",
  finance: "FINANCE",
  "it agent": "IT",
  "it support agent": "IT",
  "it support": "IT",
  it: "IT",
  "sales agent": "SALES",
  sales: "SALES",
  "general agent": "GENERAL",
  general: "GENERAL",
};

function findColumnName(row, aliases) {
  for (const key of Object.keys(row)) {
    if (aliases.includes(normalizeHeader(key))) return key;
  }
  return null;
}

function resolveAgentKey(raw) {
  if (!raw) return null;
  const norm = normalizeHeader(raw);
  if (AGENT_VALUE_ALIASES[norm]) return AGENT_VALUE_ALIASES[norm];
  return String(raw).trim().toUpperCase();
}

// Reads a .csv or .xlsx/.xls dataset. Returns:
//   { format: "csv"|"xlsx", sheets: [{ name, rows: [rawRow, ...] }] }
// CSV always yields exactly one sheet with name=null.
function readDataset(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".csv") {
    const raw = fs.readFileSync(filePath, "utf8");
    const rows = parse(raw, { columns: true, skip_empty_lines: true, trim: true });
    return { format: "csv", sheets: [{ name: null, rows }] };
  }

  if (ext === ".xlsx" || ext === ".xls") {
    const wb = XLSX.readFile(filePath);
    const sheets = wb.SheetNames.map((name) => ({
      name,
      rows: XLSX.utils.sheet_to_json(wb.Sheets[name], { defval: "" }),
    }));
    return { format: "xlsx", sheets };
  }

  throw new Error(`Unsupported dataset file type "${ext}": ${filePath}`);
}

// Extracts the normalized fields for one raw row, or null if the row has no
// recognizable Question column (e.g. a summary/remarks sheet).
function extractRow(row) {
  const questionCol = findColumnName(row, QUESTION_ALIASES);
  if (!questionCol || !String(row[questionCol]).trim()) return null;

  const expectedCol = findColumnName(row, EXPECTED_ALIASES);
  const stagingCol = findColumnName(row, STAGING_ALIASES);
  const scoreCol = findColumnName(row, SCORE_ALIASES);
  const passFailCol = findColumnName(row, PASS_FAIL_ALIASES);
  const agentCol = findColumnName(row, AGENT_COLUMN_ALIASES);

  return {
    question: String(row[questionCol]).trim(),
    expectedAnswer: expectedCol ? String(row[expectedCol]).trim() : "",
    agentKey: agentCol ? resolveAgentKey(row[agentCol]) : null,
    questionCol,
    expectedCol,
    stagingCol,
    scoreCol,
    passFailCol,
    agentCol,
  };
}

// Writes sheets (same shape as readDataset's `sheets`, with rows already
// mutated in place - see exportResults.js) back out as .csv or .xlsx to
// match the original format. Column order/names are preserved as-is; any
// row missing a detected staging/score column falls back to adding
// "Answer in Staging" / "Score" so the value still ends up somewhere.
function writeDataset(outPath, format, sheets) {
  if (format === "csv") {
    const rows = sheets[0].rows;
    const columns = Object.keys(rows[0] || {});
    fs.writeFileSync(outPath, stringify(rows, { header: true, columns }));
    return;
  }

  const wb = XLSX.utils.book_new();
  for (const sheet of sheets) {
    const ws = XLSX.utils.json_to_sheet(sheet.rows);
    XLSX.utils.book_append_sheet(wb, ws, sheet.name || "Sheet1");
  }
  XLSX.writeFile(wb, outPath);
}

module.exports = {
  readDataset,
  writeDataset,
  extractRow,
  findColumnName,
  resolveAgentKey,
  normalizeHeader,
  QUESTION_ALIASES,
  EXPECTED_ALIASES,
  STAGING_ALIASES,
  SCORE_ALIASES,
  PASS_FAIL_ALIASES,
  AGENT_COLUMN_ALIASES,
};
