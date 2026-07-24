// Runs the eval and always exports the results afterwards, even when some
// benchmark questions failed grading. Promptfoo intentionally exits
// non-zero whenever any assertion fails (like a test runner) - that must
// NOT stop the export step, since failing rows are exactly what a
// benchmark report needs to show. Using this wrapper (instead of `a && b`
// in a package.json script) also keeps behavior identical on both
// Windows (cmd.exe) and POSIX shells.
//
// All three outputs for a run (report.html, eval.json, <dataset>-results.<ext>)
// are written together into one timestamped folder under reports/, instead
// of loose files at reports/ root - so separate runs (different agents,
// datasets, environments) never overwrite each other and the whole run can
// be zipped/shared as a single self-contained folder.
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { ENV } = require("../config/env");

function timestamp() {
  return new Date()
    .toISOString()
    .replace(/:/g, "-")
    .replace(/\..+/, "")
    .replace("T", "_");
}

const agentLabel = (process.env.AGENT || "default").toLowerCase();
const runId = `${timestamp()}_${ENV}_${agentLabel}`;
const runDir = path.join("reports", runId);
fs.mkdirSync(runDir, { recursive: true });

const reportPath = path.join(runDir, "report.html");
const evalJsonPath = path.join(runDir, "eval.json");

const datasetPath = process.env.BENCHMARK_DATASET || "datasets/Acme_Benchmark_Dataset.xlsx";
const datasetExt = path.extname(datasetPath);
const datasetBase = path.basename(datasetPath, datasetExt);
const resultsOutPath = path.join(runDir, `${datasetBase}-results${datasetExt}`);

console.log(`Run folder: ${runDir}\n`);

const evalResult = spawnSync(
  "npx",
  ["promptfoo", "eval", "-c", "promptfooconfig.yaml", "-o", reportPath, "-o", evalJsonPath],
  { stdio: "inherit", shell: true }
);

const exportResult = spawnSync(
  "node",
  ["scripts/exportResults.js", "--dataset", datasetPath, "--eval", evalJsonPath, "--out", resultsOutPath],
  { stdio: "inherit", shell: true }
);

// Convenience pointer to the most recent run, so anyone can find it without
// hunting for the newest timestamped folder.
fs.writeFileSync(path.join("reports", "LATEST.txt"), runId + "\n");

console.log(`\nAll outputs for this run are in: ${runDir}`);

process.exit(exportResult.status !== 0 ? exportResult.status : evalResult.status);
