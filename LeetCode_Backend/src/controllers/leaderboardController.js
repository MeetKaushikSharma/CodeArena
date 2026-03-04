const User = require("../models/user");

/**
 * GET /leaderboard
 * Returns top 100 users ranked by number of problems solved.
 * Each entry: { _id, firstName, emailId, solved, easy, medium, hard, score }
 */
const getLeaderboard = async (req, res) => {
  try {
    // Populate problemSolved to get difficulty info
    const users = await User.find({})
      .populate("problemSolved", "difficulty")
      .select("firstName emailId problemSolved createdAt")
      .lean();

    const ranked = users
      .map((u) => {
        const solved = u.problemSolved || [];
        const easy = solved.filter((p) => p.difficulty === "easy").length;
        const medium = solved.filter((p) => p.difficulty === "medium").length;
        const hard = solved.filter((p) => p.difficulty === "hard").length;
        // Weighted score: hard=30pts, medium=10pts, easy=5pts + base solved*5
        const score = hard * 30 + medium * 10 + easy * 5 + solved.length * 5;
        return {
          _id: u._id,
          firstName: u.firstName,
          emailId: u.emailId,
          solved: solved.length,
          easy,
          medium,
          hard,
          score,
          joinedAt: u.createdAt,
        };
      })
      .filter((u) => u.solved > 0)              // only show users who solved something
      .sort((a, b) => b.score - a.score || b.solved - a.solved) // sort by score, then solved
      .slice(0, 100);                            // top 100

    res.status(200).json(ranked);
  } catch (err) {
    console.error("getLeaderboard error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { getLeaderboard };