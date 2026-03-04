const axios = require("axios");

// ─────────────────────────────────────────────────────────────────
//  Language routing
//  cpp  → Judge0  (batch, token-based polling)
//  rest → Judge1  (individual submit + id-based polling)
// ─────────────────────────────────────────────────────────────────

const JUDGE0_LANGS = {
  cpp: 54,
};

// Languages supported by Judge1
const JUDGE1_LANGS = new Set([
  "java",
  "javascript",
  "typescript",
  "python",
  "python2",
  "c",
  "rust",
  "ruby",
  "php",
  "perl",
  "bash",
  "r",
  "swift",
  "kotlin",
  "csharp",
]);

/**
 * Returns Judge0 language_id for cpp, or null for Judge1 languages.
 */
const getLanguageById = (lang) => {
  return JUDGE0_LANGS[lang.toLowerCase()] ?? null;
};

/**
 * Returns true if this language should go to Judge1.
 */
const isJudge1Language = (lang) => JUDGE1_LANGS.has(lang.toLowerCase());

// ─────────────────────────────────────────────────────────────────
//  Judge0 helpers  (cpp only)
// ─────────────────────────────────────────────────────────────────

const submitBatch = async (submissions) => {
  const options = {
    method: "POST",
    url: `http://${process.env.JUDGE0_HOST}/submissions/batch`,
    params: { base64_encoded: false },
    headers: { "Content-Type": "application/json" },
    data: { submissions },
  };

  try {
    const response = await axios.request(options);
    return response.data;
  } catch (error) {
    console.error("submitBatch Error:", error.response?.data || error.message);
    throw error;
  }
};

const waiting = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const submitToken = async (resultToken) => {
  const options = {
    method: "GET",
    url: `http://${process.env.JUDGE0_HOST}/submissions/batch`,
    params: {
      tokens: resultToken.join(","),
      base64_encoded: false,
      fields: "*",
    },
  };

  while (true) {
    try {
      const response = await axios.request(options);
      const result = response.data.submissions;
      const done = result.every((r) => r.status.id > 2);
      if (done) return result;
    } catch (error) {
      console.error(
        "submitToken Error:",
        error.response?.data || error.message,
      );
      throw error;
    }
    await waiting(1000);
  }
};

// ─────────────────────────────────────────────────────────────────
//  Judge1 helpers  (all other languages)
// ─────────────────────────────────────────────────────────────────

const JUDGE1_BASE = process.env.JUDGE1_HOST
  ? `http://${process.env.JUDGE1_HOST}`
  : "http://wo08o4ww4wkg440o4cs0o808.176.100.36.172.sslip.io:3000";

/**
 * Submit a single test case to Judge1.
 * Returns the submission id.
 */
const judge1Submit = async (language, source_code, stdin) => {
  try {
    const response = await axios.post(
      `${JUDGE1_BASE}/submissions`,
      { language, source_code, stdin: stdin || "" },
      { headers: { "Content-Type": "application/json" } },
    );
    return response.data.id;
  } catch (error) {
    console.error("judge1Submit Error:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * Poll Judge1 until a submission completes.
 * Returns the result object.
 */
const judge1Poll = async (id) => {
  // Judge1 typically takes 1-3s — wait 1s before first poll to avoid wasted requests
  await waiting(1000);

  while (true) {
    try {
      const response = await axios.get(`${JUDGE1_BASE}/submissions/${id}`);
      const data = response.data;

      if (data.status === "completed" || data.status === "error") {
        return data;
      }
    } catch (error) {
      console.error("judge1Poll Error:", error.response?.data || error.message);
      throw error;
    }
    await waiting(800); // retry every 800ms after initial wait
  }
};

/**
 * Normalise a Judge1 result into the same shape our controllers
 * already expect from Judge0:
 *   { status_id, stdout, stderr, time, memory }
 *
 * Judge0 status_id reference:
 *   3 = Accepted  |  4 = Wrong Answer  |  5 = TLE  |  6 = CE  |  11 = RE
 */
const normaliseJudge1Result = (result, expectedOutput) => {
  console.log("JUDGE1 RAW RESULT:", JSON.stringify(result));
  console.log("EXPECTED OUTPUT:", JSON.stringify(expectedOutput));
  let status_id;

  if (result.status === "error") {
    // Compilation / runtime error
    status_id = result.stderr?.toLowerCase().includes("compile")
      ? 6 // Compilation Error
      : 11; // Runtime Error
  } else {
    // Compare stdout with expected output (trim whitespace)
    const actual = (result.stdout || "").trim();
    const expected = (expectedOutput || "").trim();
    status_id = actual === expected ? 3 : 4; // 3 = Accepted, 4 = Wrong Answer
  }

  // Normalise time: Judge1 returns "0.02s", Judge0 returns "0.002" (seconds string)
  const rawTime = result.time || "0s";
  const timeVal = parseFloat(rawTime.replace("s", "")) || 0;

  // Normalise memory: Judge1 returns "12MB", Judge0 returns number (KB)
  const rawMem = result.memory || "0MB";
  const memVal = parseFloat(rawMem.replace("MB", "")) * 1024 || 0; // convert to KB

  return {
    status_id,
    status: { id: status_id },
    stdout: result.stdout || null,
    stderr: result.stderr || null,
    time: timeVal.toFixed(3),
    memory: Math.round(memVal),
  };
};

/**
 * Submit all test cases for a Judge1 language in parallel,
 * poll until all complete, and return normalised results array
 * (same shape as Judge0's submitToken return value).
 */
const submitBatchJudge1 = async (language, submissions) => {
  // 1. Fire all submissions in parallel
  const ids = await Promise.all(
    submissions.map((s) => judge1Submit(language, s.source_code, s.stdin)),
  );

  // 2. Poll all in parallel
  const rawResults = await Promise.all(ids.map((id) => judge1Poll(id)));

  // 3. Normalise each result
  return rawResults.map((result, i) =>
    normaliseJudge1Result(result, submissions[i].expected_output),
  );
};

// ─────────────────────────────────────────────────────────────────
//  Unified interface used by controllers
// ─────────────────────────────────────────────────────────────────

/**
 * submitAll — works for ANY language.
 *
 * submissions: Array<{ source_code, language_id?, stdin, expected_output }>
 * language: string  e.g. "cpp" | "java" | "javascript"
 *
 * Returns normalised array matching Judge0 shape.
 */
const submitAll = async (language, submissions) => {
  const lang = language.toLowerCase();

  if (lang === "cpp") {
    // ── Judge0 path ──────────────────────────────────────────────
    const submitResult = await submitBatch(submissions);
    const resultTokens = submitResult.map((v) => v.token);
    return await submitToken(resultTokens);
  } else if (isJudge1Language(lang)) {
    // ── Judge1 path ──────────────────────────────────────────────
    return await submitBatchJudge1(lang, submissions);
  } else {
    throw new Error(`Unsupported language: ${language}`);
  }
};

module.exports = {
  // Legacy exports (controllers still call these for cpp)
  getLanguageById,
  submitBatch,
  submitToken,
  // New unified export (controllers should migrate to this)
  submitAll,
  isJudge1Language,
  JUDGE1_LANGS,
};
