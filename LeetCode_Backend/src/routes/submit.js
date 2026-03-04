const express = require("express");
const submitRouter = express.Router();
const userMiddleware = require("../middleware/userMiddleware");
const submitCodeRateLimiter = require("../middleware/submitCooldown");
const { submitCode, runCode } = require("../controllers/userSubmission");

submitRouter.post(
  "/submit/:id",
  userMiddleware,
  submitCodeRateLimiter,
  submitCode,
);
submitRouter.post("/run/:id", userMiddleware, runCode);

module.exports = submitRouter;
