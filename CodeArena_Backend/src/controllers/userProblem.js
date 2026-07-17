const { submitAll } = require("../utils/problemUtility"); // ← removed getLanguageById
const Problem       = require("../models/problem");
const User          = require("../models/user");
const Submission    = require("../models/submission");
const SolutionVideo = require("../models/solutionVideo");

// ← buildSubmissions simplified — no language_id logic at all
const buildSubmissions = (completeCode, testCases) =>
  testCases.map((tc) => ({
    source_code:     completeCode,
    stdin:           tc.input,
    expected_output: tc.output,
  }));

const createProblem = async (req, res) => {
  const { visibleTestCases, referenceSolution } = req.body;
  try {
    for (const { language, completeCode } of referenceSolution) {
      const submissions = buildSubmissions(completeCode, visibleTestCases);
      const testResult  = await submitAll(language, submissions);

      for (const test of testResult) {
        if (test.status_id !== 3) {
          return res.status(400).json({
            error:   `Reference solution for ${language} failed`,
            details: test.stderr || test.stdout || "Wrong answer",
          });
        }
      }
    }

    await Problem.create({ ...req.body, problemCreator: req.result._id });
    res.status(201).send("Problem Saved Successfully");
  } catch (err) {
    console.error("createProblem error:", err);
    res.status(400).send("Error: " + err);
  }
};

const updateProblem = async (req, res) => {
  const { id } = req.params;
  const { visibleTestCases, referenceSolution } = req.body;
  try {
    if (!id) return res.status(400).send("Missing ID Field");

    const existing = await Problem.findById(id);
    if (!existing) return res.status(404).send("Problem not found");

    for (const { language, completeCode } of referenceSolution) {
      const submissions = buildSubmissions(completeCode, visibleTestCases);
      const testResult  = await submitAll(language, submissions);

      for (const test of testResult) {
        if (test.status_id !== 3) {
          return res.status(400).json({
            error:   `Reference solution for ${language} failed`,
            details: test.stderr || test.stdout || "Wrong answer",
          });
        }
      }
    }

    const updated = await Problem.findByIdAndUpdate(id, { ...req.body }, { new: true, runValidators: true });
    res.status(200).send(updated);
  } catch (err) {
    res.status(500).send("Error: " + err);
  }
};

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

const getProblemById = async (req, res) => {
  const { id } = req.params;
  try {
    if (!id) return res.status(400).send("ID is Missing");
    const problem = await Problem.findById(id).select(
      "_id title description difficulty tags visibleTestCases startCode referenceSolution",
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

const getAllProblem = async (req, res) => {
  try {
    const problems = await Problem.find({}).select("_id title difficulty tags");
    if (problems.length === 0) return res.status(404).send("No problems found");
    res.status(200).send(problems);
  } catch (err) {
    res.status(500).send("Error: " + err);
  }
};

const solvedAllProblembyUser = async (req, res) => {
  try {
    const user = await User.findById(req.result._id).populate({
      path:   "problemSolved",
      select: "_id title difficulty tags",
    });
    res.status(200).send(user.problemSolved);
  } catch (err) {
    res.status(500).send("Server Error");
  }
};

const submittedProblem = async (req, res) => {
  try {
    const submissions = await Submission.find({
      userId:    req.result._id,
      problemId: req.params.pid,
    });
    if (submissions.length === 0) return res.status(200).send("No submissions found");
    res.status(200).send(submissions);
  } catch (err) {
    res.status(500).send("Internal Server Error");
  }
};

module.exports = {
  createProblem, updateProblem, deleteProblem,
  getProblemById, getAllProblem, solvedAllProblembyUser, submittedProblem,
};