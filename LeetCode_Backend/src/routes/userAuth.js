const express = require("express");
const authRouter = express.Router();
const {
  register,
  login,
  logout,
  adminRegister,
  updateProfile,
} = require("../controllers/userAuthent");
const userMiddleware = require("../middleware/userMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const User = require("../models/user");

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/logout", userMiddleware, logout);
authRouter.post("/admin/register", adminMiddleware, adminRegister);

// ── /check: NOW returns all profile fields including profileImage ──────
// Previously only returned { firstName, emailId, _id, role } which is
// why profileImage was always empty in Redux on fresh page load.
authRouter.get("/check", userMiddleware, async (req, res) => {
  try {
    // req.result is set by userMiddleware (JWT decoded), but it may not
    // have all fields. Re-fetch from DB to get the complete document.
    const user = await User.findById(req.result._id).select("-password");

    if (!user) return res.status(401).json({ message: "User not found" });

    res.status(200).json({
      user: {
        _id:          user._id,
        firstName:    user.firstName,
        lastName:     user.lastName     || "",
        emailId:      user.emailId,
        role:         user.role,
        age:          user.age          || "",
        // ↓ these were missing before — causing missing profileImage on load
        profileImage: user.profileImage || "",
        gender:       user.gender       || "",
        location:     user.location     || "",
        birthday:     user.birthday     || "",
        website:      user.website      || "",
        github:       user.github       || "",
        linkedin:     user.linkedin     || "",
        twitter:      user.twitter      || "",
        readme:       user.readme       || "",
        work:         user.work         || "",
        education:    user.education    || "",
        skills:       user.skills       || "",
        showRecentAC: user.showRecentAC !== false,
        showHeatmap:  user.showHeatmap  !== false,
        createdAt:    user.createdAt,
      },
      message: "Valid User",
    });
  } catch (err) {
    console.error("checkAuth error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

authRouter.put("/update", userMiddleware, updateProfile);

module.exports = authRouter;