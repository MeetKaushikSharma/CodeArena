const axios = require("axios");

const JUDGE1_BASE = `http://${process.env.JUDGE1_HOST}`;

const getLanguageById = () => null;

const waiting = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const TERMINAL_STATUSES = new Set([
  "completed",
  "error",
  "timeout",
  "killed",
  "compilation_error",
]);

const judge1Submit = async (language, source_code, stdin) => {
  try {
    const response = await axios.post(
      `${JUDGE1_BASE}/submissions`,
      { language, source_code, stdin: stdin ?? "" },
      { headers: { "Content-Type": "application/json" } },
    );
    return response.data.id;
  } catch (error) {
    console.error(
      "[judge1Submit] Error:",
      error.response?.data || error.message,
    );
    throw error;
  }
};
const judge1Poll = async (id, maxAttempts = 25) => {  // ← increase from 15 to 25
  await waiting(2000);  // ← increase initial wait from 1000 to 2000ms

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const { data } = await axios.get(`${JUDGE1_BASE}/submissions/${id}`);

      if (TERMINAL_STATUSES.has(data.status)) return data;

    } catch (error) {
      console.error("[judge1Poll] Error:", error.response?.data || error.message);
      throw error;
    }

    await waiting(1000);  // ← increase poll interval from 800ms to 1000ms
  }

  return {
    status:            "timeout",
    stdout:            null,
    stderr:            "Execution timed out — no response from judge",
    compile_output:    null,
    error_message:     null,
    execution_time_ms: 0,
    memory_kb:         0,
  };
};

const toStatusId = (status, stdout, expectedOutput) => {
  switch (status) {
    case "completed": {
      const actual = (stdout || "").trim();
      const expected = (expectedOutput || "").trim();
      return actual === expected ? 3 : 4;
    }
    case "compilation_error":
      return 6;
    case "timeout":
      return 5;
    case "killed":
      return 11;
    case "error":
      return 11;
    default:
      return 13;
  }
};

const normaliseJudge1Result = (result, expectedOutput) => {
  const status_id = toStatusId(result.status, result.stdout, expectedOutput);

  // execution_time_ms (number) → seconds string e.g. "0.023"
  const time = ((result.execution_time_ms || 0) / 1000).toFixed(3);

  // memory_kb is already in KB
  const memory = result.memory_kb || 0;

  // Best available error detail
  const stderr =
    result.compile_output || result.stderr || result.error_message || null;

  return {
    status_id,
    status: { id: status_id },
    stdout: result.stdout || null,
    stderr,
    time,
    memory,
  };
};

const submitAll = async (language, submissions) => {
  const ids = await Promise.all(
    submissions.map((s) => judge1Submit(language, s.source_code, s.stdin)),
  );
  const rawResults = await Promise.all(ids.map((id) => judge1Poll(id)));
  return rawResults.map((result, i) =>
    normaliseJudge1Result(result, submissions[i].expected_output),
  );
};

module.exports = { getLanguageById, submitAll };
