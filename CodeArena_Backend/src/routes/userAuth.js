const express = require("express");
const router = express.Router();
const passport = require("../config/passport");
const userMiddleware = require("../middleware/userMiddleware");
const {
  register,
  login,
  logout,
  oauthCallback,
  checkAuth,
  adminRegister,
  deleteProfile,
  updateProfile,
} = require("../controllers/userAuthent");

// ── Local auth ─────────────────────────────────────────────────────
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.post("/adminRegister", adminRegister);
router.delete("/delete", userMiddleware, deleteProfile);
router.patch("/update", userMiddleware, updateProfile);
router.get("/check", userMiddleware, checkAuth);

// ── Google OAuth ───────────────────────────────────────────────────
router.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  }),
);
router.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth_failed`,
  }),
  oauthCallback,
);

// ── GitHub OAuth ───────────────────────────────────────────────────
router.get(
  "/auth/github",
  passport.authenticate("github", { scope: ["user:email"], session: false }),
);
router.get(
  "/auth/github/callback",
  passport.authenticate("github", {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth_failed`,
  }),
  oauthCallback,
);

module.exports = router;
