const {
  getLanguageById,
  submitAll,
} = require("../utils/problemUtility");
const Problem = require("../models/problem");
const User = require("../models/user");
const Submission = require("../models/submission");
const SolutionVideo = require("../models/solutionVideo");

// ─────────────────────────────────────────────────────────────────
//  Helper — build the submissions array for any language
//  Judge0 (cpp) needs language_id; Judge1 does NOT — so only add it for cpp
// ─────────────────────────────────────────────────────────────────
const buildSubmissions = (language, completeCode, testCases) => {
  const languageId = getLanguageById(language); // 54 for cpp, null for everything else
  return testCases.map((tc) => ({
    source_code:     completeCode,
    ...(languageId && { language_id: languageId }),
    stdin:           tc.input,
    expected_output: tc.output,
  }));
};

// ─────────────────────────────────────────────────────────────────
//  createProblem
// ─────────────────────────────────────────────────────────────────
const createProblem = async (req, res) => {
  const {
    title,
    description,
    difficulty,
    tags,
    visibleTestCases,
    HiddenTestCases,
    startCode,
    referenceSolution,
  } = req.body;

  try {
    // Validate each reference solution against visible test cases
    for (const { language, completeCode } of referenceSolution) {
      const submissions = buildSubmissions(language, completeCode, visibleTestCases);
      const testResult  = await submitAll(language, submissions);

      for (const test of testResult) {
        if (test.status_id !== 3) {
          return res.status(400).json({
            error: `Reference solution for ${language} failed validation`,
            details: test.stderr || test.stdout || "Wrong answer",
          });
        }
      }
    }

    await Problem.create({
      ...req.body,
      problemCreator: req.result._id,
    });

    res.status(201).send("Problem Saved Successfully");
  } catch (err) {
    console.error("createProblem error:", err);
    res.status(400).send("Error: " + err);
  }
};

// ─────────────────────────────────────────────────────────────────
//  updateProblem
// ─────────────────────────────────────────────────────────────────
const updateProblem = async (req, res) => {
  const { id } = req.params;
  const { visibleTestCases, referenceSolution } = req.body;

  try {
    if (!id) return res.status(400).send("Missing ID Field");

    const existing = await Problem.findById(id);
    if (!existing) return res.status(404).send("Problem not found");

    for (const { language, completeCode } of referenceSolution) {
      const submissions = buildSubmissions(language, completeCode, visibleTestCases);
      const testResult  = await submitAll(language, submissions);

      for (const test of testResult) {
        if (test.status_id !== 3) {
          return res.status(400).json({
            error: `Reference solution for ${language} failed validation`,
            details: test.stderr || test.stdout || "Wrong answer",
          });
        }
      }
    }

    const updated = await Problem.findByIdAndUpdate(
      id,
      { ...req.body },
      { runValidators: true, new: true },
    );

    res.status(200).send(updated);
  } catch (err) {
    console.error("updateProblem error:", err);
    res.status(500).send("Error: " + err);
  }
};

// ─────────────────────────────────────────────────────────────────
//  deleteProblem
// ─────────────────────────────────────────────────────────────────
const deleteProblem = async (req, res) => {
  const { id } = req.params;
  try {
    if (!id) return res.status(400).send("ID is Missing");

    const deleted = await Problem.findByIdAndDelete(id);
    if (!deleted) return res.status(404).send("Problem not found");

    res.status(200).send("Successfully Deleted");
  } catch (err) {
    res.status(500).send("Error: " + err);
  }
};

// ─────────────────────────────────────────────────────────────────
//  getProblemById
// ─────────────────────────────────────────────────────────────────
const getProblemById = async (req, res) => {
  const { id } = req.params;
  try {
    if (!id) return res.status(400).send("ID is Missing");

    const problem = await Problem.findById(id).select(
      "_id title description difficulty tags visibleTestCases HiddenTestCases startCode referenceSolution",
    );
    if (!problem) return res.status(404).send("Problem not found");

    const videos = await SolutionVideo.findOne({ problemId: id });

    if (videos) {
      return res.status(200).send({
        ...problem.toObject(),
        secureUrl:    videos.secureUrl,
        thumbnailUrl: videos.thumbnailUrl,
        duration:     videos.duration,
      });
    }

    res.status(200).send(problem);
  } catch (err) {
    res.status(500).send("Error: " + err);
  }
};

// ─────────────────────────────────────────────────────────────────
//  getAllProblem
// ─────────────────────────────────────────────────────────────────
const getAllProblem = async (req, res) => {
  try {
    const problems = await Problem.find({}).select("_id title difficulty tags");

    if (problems.length === 0)
      return res.status(404).send("No problems found");

    res.status(200).send(problems);
  } catch (err) {
    res.status(500).send("Error: " + err);
  }
};

// ─────────────────────────────────────────────────────────────────
//  solvedAllProblembyUser
// ─────────────────────────────────────────────────────────────────
const solvedAllProblembyUser = async (req, res) => {
  try {
    const user = await User.findById(req.result._id).populate({
      path: "problemSolved",
      select: "_id title difficulty tags",
    });
    res.status(200).send(user.problemSolved);
  } catch (err) {
    res.status(500).send("Server Error");
  }
};

// ─────────────────────────────────────────────────────────────────
//  submittedProblem
// ─────────────────────────────────────────────────────────────────
const submittedProblem = async (req, res) => {
  try {
    const userId    = req.result._id;
    const problemId = req.params.pid;

    const submissions = await Submission.find({ userId, problemId });

    if (submissions.length === 0)
      return res.status(200).send("No submissions found");

    res.status(200).send(submissions);
  } catch (err) {
    res.status(500).send("Internal Server Error");
  }
};

module.exports = {
  createProblem,
  updateProblem,
  deleteProblem,
  getProblemById,
  getAllProblem,
  solvedAllProblembyUser,
  submittedProblem,
};