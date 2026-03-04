const Problem    = require("../models/problem");
const Submission = require("../models/submission");
const User       = require("../models/user");
const {
  getLanguageById,
  submitAll,
} = require("../utils/problemUtility");

// ─────────────────────────────────────────────────────────────────
//  submitCode  — runs against ALL hidden test cases
// ─────────────────────────────────────────────────────────────────
const submitCode = async (req, res) => {
  try {
    const userId    = req.result._id;
    const problemId = req.params.id;
    const { code, language } = req.body;

    if (!userId || !code || !problemId || !language)
      return res.status(400).send("Some field missing");

    const problem = await Problem.findById(problemId);
    if (!problem) return res.status(404).send("Problem not found");

    // Create a pending submission record first
    const submission = await Submission.create({
      userId,
      problemId,
      code,
      language,
      status:         "pending",
      testCasesTotal: problem.HiddenTestCases.length,
    });

    // Build submissions array
    // language_id is only needed for cpp (Judge0), not for Judge1 languages
    const languageId  = getLanguageById(language);
    const submissions = problem.HiddenTestCases.map((tc) => ({
      source_code:     code,
      ...(languageId && { language_id: languageId }),
      stdin:           tc.input,
      expected_output: tc.output,
    }));

    // Run against judge (Judge0 for cpp, Judge1 for everything else)
    const testResult = await submitAll(language, submissions);

    // Aggregate results
    let testCasesPassed = 0;
    let runtime         = 0;
    let memory          = 0;
    let status          = "accepted";
    let errorMessage    = null;

    for (const test of testResult) {
      if (test.status_id === 3) {
        testCasesPassed++;
        runtime += parseFloat(test.time || 0);
        memory   = Math.max(memory, test.memory || 0);
      } else {
        if (test.status_id === 4) {
          status       = "wrong";
          errorMessage = test.stderr || null;
        } else if (test.status_id === 6) {
          status       = "error";
          errorMessage = test.stderr || "Compilation error";
          break;
        } else if (test.status_id === 11) {
          status       = "error";
          errorMessage = test.stderr || "Runtime error";
          break;
        } else {
          status       = "wrong";
          errorMessage = test.stderr || null;
        }
      }
    }

    // Update submission record
    submission.status          = status;
    submission.testCasesPassed = testCasesPassed;
    submission.errorMessage    = errorMessage;
    submission.runtime         = runtime;
    submission.memory          = memory;
    await submission.save();

    // Mark problem as solved if accepted
    if (status === "accepted" && !req.result.problemSolved.includes(problemId)) {
      req.result.problemSolved.push(problemId);
      await req.result.save();
      await User.findByIdAndUpdate(userId, {
      $addToSet: { problemSolved: problemId }, // $addToSet prevents duplicates
  });
    }

    res.status(201).json({
      accepted:        status === "accepted",
      totalTestCases:  submission.testCasesTotal,
      passedTestCases: testCasesPassed,
      runtime,
      memory,
    });
  } catch (err) {
    console.error("submitCode error:", err);
    res.status(500).send("Internal Server Error: " + err.message);
  }
};

// ─────────────────────────────────────────────────────────────────
//  runCode  — runs against visible test cases only (no DB write)
// ─────────────────────────────────────────────────────────────────
const runCode = async (req, res) => {
  try {
    const userId    = req.result._id;
    const problemId = req.params.id;
    const { code, language } = req.body;

    if (!userId || !code || !problemId || !language)
      return res.status(400).send("Some field missing");

    const problem = await Problem.findById(problemId);
    if (!problem) return res.status(404).send("Problem not found");

    // language_id only for cpp (Judge0), not needed for Judge1
    const languageId  = getLanguageById(language);
    const submissions = problem.visibleTestCases.map((tc) => ({
      source_code:     code,
      ...(languageId && { language_id: languageId }),
      stdin:           tc.input,
      expected_output: tc.output,
    }));

    const testResult = await submitAll(language, submissions);

    let runtime = 0;
    let memory  = 0;
    let success = true;

    for (const test of testResult) {
      if (test.status_id === 3) {
        runtime += parseFloat(test.time || 0);
        memory   = Math.max(memory, test.memory || 0);
      } else {
        success = false;
      }
    }

    res.status(200).json({
      success,
      testCases: testResult,
      runtime,
      memory,
    });
  } catch (err) {
    console.error("runCode error:", err);
    res.status(500).send("Internal Server Error: " + err.message);
  }
};

module.exports = { submitCode, runCode };