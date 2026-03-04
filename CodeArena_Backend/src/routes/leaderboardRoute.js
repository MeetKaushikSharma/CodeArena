const express = require("express");
const leaderboardRouter = express.Router();
const { getLeaderboard } = require("../controllers/leaderboardController");
const userMiddleware = require("../middleware/userMiddleware");

leaderboardRouter.get("/", userMiddleware, getLeaderboard);

module.exports = leaderboardRouter;

/*


// ─── app.js addition ───────────────────────────────────────────────────────
// Add these two lines to your main app.js:

/*
const leaderboardRouter = require("./routes/leaderboardRoute");
app.use("/leaderboard", leaderboardRouter);
*/


// ─── User model addition ───────────────────────────────────────────────────
// Make sure your User model has a problemSolved field like this:
// (If it already has this, skip)

/*
problemSolved: [
  {
    type: Schema.Types.ObjectId,
    ref: "problem",
  },
],
*/

// And in your submissionController, when a user gets "accepted" for the first time
// on a problem, add this logic (if not already present):

/*
// After saving submission with status "accepted":
if (status === "accepted") {
  await User.findByIdAndUpdate(userId, {
    $addToSet: { problemSolved: problemId }, // $addToSet prevents duplicates
  });
}
  */