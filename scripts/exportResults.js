// Turns a Promptfoo eval JSON output back into the original benchmark
// dataset shape (.csv or .xlsx, single or multi-sheet), with each row's
// staging-answer/score/pass-fail columns filled in from the run - so the
// output can be diffed/shared in exactly the format the dataset came in.
// Normally invoked automatically by scripts/runEval.js (npm run eval), which
// passes --eval/--out pointing into that run's reports/<runId>/ folder.
//
// Standalone usage (e.g. re-exporting an old run):
//   node scripts/exportResults.js --dataset datasets/Acme_Benchmark_Dataset.xlsx --eval reports/2026-.../eval.json --out reports/2026-.../results.xlsx
require("../config/env");
const fs = require("fs");
const path = require("path");
const { readDataset, writeDataset, extractRow } = require("./datasetIO");

function getArg(name, fallback) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1];
  return fallback;
}

// With no --eval given, default to the most recent run folder (reports/LATEST.txt,
// written by scripts/runEval.js) so a bare `npm run export` re-exports the last run.
function latestRunDir() {
  const pointerPath = path.join("reports", "LATEST.txt");
  if (!fs.existsSync(pointerPath)) return null;
  const runId = fs.readFileSync(pointerPath, "utf8").trim();
  return runId ? path.join("reports", runId) : null;
}

const datasetPath = path.resolve(
  process.cwd(),
  getArg("dataset", process.env.BENCHMARK_DATASET || "datasets/Acme_Benchmark_Dataset.xlsx")
);
const runDir = latestRunDir();
const defaultEval = runDir ? path.join(runDir, "eval.json") : path.join("reports", "eval.json");
const evalPath = path.resolve(process.cwd(), getArg("eval", defaultEval));

const datasetExt = path.extname(datasetPath);
const defaultOutDir = runDir || "reports";
const defaultOut = path.join(defaultOutDir, `${path.basename(datasetPath, datasetExt)}-results${datasetExt}`);
const outPath = path.resolve(process.cwd(), getArg("out", defaultOut));

if (!fs.existsSync(datasetPath)) {
  throw new Error(`Dataset not found: ${datasetPath}`);
}
if (!fs.existsSync(evalPath)) {
  throw new Error(`Eval output not found: ${evalPath} (run "npm run eval" first)`);
}

const dataset = readDataset(datasetPath);

const evalData = JSON.parse(fs.readFileSync(evalPath, "utf8"));
const results = evalData.results?.results || evalData.results || [];

// Match each eval result back to its source row by (sheet, question text) -
// vars.question is exactly the row's Question/User Query text, and
// testCase.metadata.sheet (set by loadTests.js) disambiguates the rare case
// of the same question text appearing in more than one sheet.
const byKey = new Map();
for (const r of results) {
  const question = r.testCase?.vars?.question;
  if (!question) continue;
  const sheet = r.testCase?.metadata?.sheet || "";
  byKey.set(`${sheet}::${question.trim()}`, r);
}

let matched = 0;
let totalRows = 0;

for (const sheet of dataset.sheets) {
  sheet.rows = sheet.rows.map((row) => {
    const extracted = extractRow(row);
    if (!extracted) return row; // not a question row (e.g. a notes/remarks sheet) - passed through untouched

    totalRows++;
    const result = byKey.get(`${sheet.name || ""}::${extracted.question}`);
    if (!result) return row;

    matched++;
    const updated = { ...row };
    const stagingCol = extracted.stagingCol || "Answer in Staging";
    const scoreCol = extracted.scoreCol || "Score";

    if (result.response?.error) {
      updated[stagingCol] = `ERROR: ${result.response.error}`;
      updated[scoreCol] = "";
      if (extracted.passFailCol) updated[extracted.passFailCol] = "";
    } else {
      updated[stagingCol] = result.response?.output || "";
      // Promptfoo's llm-rubric score is 0-1 (can be partial credit, not just
      // pass/fail) - scaled to 0-100 to match these datasets' Score columns.
      const score = typeof result.score === "number" ? Math.round(result.score * 100) : "";
      updated[scoreCol] = score;
      if (extracted.passFailCol) updated[extracted.passFailCol] = score !== "" ? (score >= 70 ? "Pass" : "Fail") : "";
    }

    return updated;
  });
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
writeDataset(outPath, dataset.format, dataset.sheets);
console.log(`Matched ${matched}/${totalRows} rows. Wrote results to ${outPath}`);
