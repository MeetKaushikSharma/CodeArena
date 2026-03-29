const Problem    = require("../models/problem");
const Submission = require("../models/submission");
const User       = require("../models/user");
const { submitAll } = require("../utils/problemUtility"); // ← removed getLanguageById

const submitCode = async (req, res) => {
  try {
    const userId    = req.result._id;
    const problemId = req.params.id;
    const { code, language } = req.body;

    if (!userId || !code || !problemId || !language)
      return res.status(400).send("Some field missing");

    const problem = await Problem.findById(problemId);
    if (!problem) return res.status(404).send("Problem not found");

    const submission = await Submission.create({
      userId,
      problemId,
      code,
      language,
      status:         "pending",
      testCasesTotal: problem.HiddenTestCases.length,
    });

    // ← No language_id needed anymore
    const submissions = problem.HiddenTestCases.map((tc) => ({
      source_code:     code,
      stdin:           tc.input,
      expected_output: tc.output,
    }));

    const testResult = await submitAll(language, submissions);

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
        if (test.status_id === 6) {
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

    submission.status          = status;
    submission.testCasesPassed = testCasesPassed;
    submission.errorMessage    = errorMessage;
    submission.runtime         = runtime;
    submission.memory          = memory;
    await submission.save();

    if (status === "accepted") {
      await User.findByIdAndUpdate(userId, {
        $addToSet: { problemSolved: problemId },
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

const runCode = async (req, res) => {
  try {
    const userId    = req.result._id;
    const problemId = req.params.id;
    const { code, language } = req.body;

    if (!userId || !code || !problemId || !language)
      return res.status(400).send("Some field missing");

    const problem = await Problem.findById(problemId);
    if (!problem) return res.status(404).send("Problem not found");

    // ← No language_id needed anymore
    const submissions = problem.visibleTestCases.map((tc) => ({
      source_code:     code,
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

    res.status(200).json({ success, testCases: testResult, runtime, memory });
  } catch (err) {
    console.error("runCode error:", err);
    res.status(500).send("Internal Server Error: " + err.message);
  }
};

module.exports = { submitCode, runCode };