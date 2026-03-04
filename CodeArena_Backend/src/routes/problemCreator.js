const express = require("express");
const problemRouter = express.Router();
const adminMiddleware = require("../middleware/adminMiddleware");
const userMiddleware = require("../middleware/userMiddleware");
const {
  createProblem,
  updateProblem,
  deleteProblem,
  getProblemById,
  getAllProblem,
  solvedAllProblembyUser,
  submittedProblem,
} = require("../controllers/userProblem");

//Create
problemRouter.post("/create", adminMiddleware, createProblem);
// Fetch
problemRouter.get("/problemById/:id", userMiddleware, getProblemById);
problemRouter.get("/getAllProblem", userMiddleware, getAllProblem);
// //ProblemSolved
problemRouter.get(
  "/problemSolvedByUser",
  userMiddleware,
  solvedAllProblembyUser,
);
// //Update
problemRouter.put("/update/:id", adminMiddleware, updateProblem);
// // Delete
problemRouter.delete("/delete/:id", adminMiddleware, deleteProblem);
problemRouter.get("/submittedProblem/:pid", userMiddleware, submittedProblem);

module.exports = problemRouter;
