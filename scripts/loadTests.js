const fs = require("fs");
const path = require("path");
const agents = require("./agentMap");
const { readDataset, extractRow } = require("./datasetIO");

// Which dataset to load:
//   BENCHMARK_DATASET=datasets/my_other_questions.csv npm run eval
// falls back to the bundled sample workbook if not set.
const datasetPath = process.env.BENCHMARK_DATASET
  ? path.resolve(process.cwd(), process.env.BENCHMARK_DATASET)
  : path.join(__dirname, "..", "datasets", "Acme_Benchmark_Dataset.xlsx");

if (!fs.existsSync(datasetPath)) {
  throw new Error(`Benchmark dataset not found: ${datasetPath}`);
}

const dataset = readDataset(datasetPath);

// Optional cap on how many question-rows to take from each sheet - useful
// for a quick sample pass across every agent before committing to a full
// run, e.g.:
//   SAMPLE_PER_SHEET=5 npm run eval
const samplePerSheet = process.env.SAMPLE_PER_SHEET ? parseInt(process.env.SAMPLE_PER_SHEET, 10) : null;

// Required column (any alias): "Question" / "User Query". Recommended:
// "Expected Answer" / "Expected Answer / Key Points" (used for grading).
// Optional "Agent" column (any sheet/row): routes that row to a specific
// agent - accepts either an agentMap.js key directly (HR, LEGAL, ...) or a
// free-text label ("HR Agent", "IT Support", ...), normalized via
// datasetIO's AGENT_VALUE_ALIASES. For .xlsx files, every sheet is read and
// concatenated - the bundled sample workbook uses one sheet per agent, each
// row's Agent column doing the actual routing, so no separate
// sheet-selection mechanism is needed.
const tests = [];
let rowCounter = 0;

// exportResults.js matches each eval result back to its source row by
// (sheet, question text) - two rows in the same sheet with identical
// question text collide on that key, and BOTH rows silently get the same
// eval result written back on export (not just one going unmatched). Warn
// up front, before any (costly) eval calls happen, so it's caught before
// the run instead of discovered as corrupted results afterward.
const seenKeys = new Set();
const duplicateKeys = new Set();

for (const sheet of dataset.sheets) {
  let sheetRowCount = 0;
  for (const row of sheet.rows) {
    const extracted = extractRow(row);
    if (!extracted) continue;
    if (samplePerSheet && sheetRowCount >= samplePerSheet) continue;
    sheetRowCount++;
    rowCounter++;

    const dedupeKey = `${sheet.name || ""}::${extracted.question}`;
    if (seenKeys.has(dedupeKey)) duplicateKeys.add(dedupeKey);
    seenKeys.add(dedupeKey);

    const vars = { question: extracted.question };

    if (extracted.agentKey) {
      if (!agents[extracted.agentKey]) {
        throw new Error(
          `Dataset ${path.basename(datasetPath)}${sheet.name ? `, sheet "${sheet.name}"` : ""}, ` +
            `row #${row["S.No"] || "?"}: unknown Agent "${row[extracted.agentCol]}" (resolved to "${extracted.agentKey}"). ` +
            `Valid agents: ${Object.keys(agents).join(", ")}`
        );
      }
      vars.agent = extracted.agentKey;
    }

    const category = row["Query Category"] || sheet.name || "Uncategorized";
    const test = {
      description: `#${row["S.No"] || rowCounter} [${category}] ${extracted.question.slice(0, 80)}`,
      vars,
      metadata: {
        sNo: row["S.No"],
        sheet: sheet.name,
        category: row["Query Category"],
        scenarioType: row["Scenario Type"],
        sourceDocument: row["Source Document"],
        expectedAnswer: extracted.expectedAnswer,
      },
    };

    // The grading instructions (semantic/intent-based comparison, not strict
    // text matching) live once, centrally, in scripts/gradingRubricPrompt.json
    // (wired in via promptfooconfig.yaml's defaultTest.options.rubricPrompt).
    // Here we only need to supply the reference answer itself.
    if (extracted.expectedAnswer) {
      test.assert = [{ type: "llm-rubric", value: extracted.expectedAnswer }];
    }

    tests.push(test);
  }
}

if (duplicateKeys.size > 0) {
  console.warn(
    `WARNING: ${duplicateKeys.size} duplicate question(s) found within the same sheet in ` +
      `${path.basename(datasetPath)}. Each will still run, but "npm run export" matches results ` +
      `back to rows by (sheet, question text), so duplicates will collide and be written with the ` +
      `same result. Make questions unique within a sheet to get correct per-row export:\n` +
      [...duplicateKeys].map((k) => `  - ${k.split("::")[1]}`).join("\n")
  );
}

module.exports = tests;
