const redisClient = require("../config/redis");
const User        = require("../models/user");
const validate    = require("../utils/validator");
const bcrypt      = require("bcrypt");
const jwt         = require("jsonwebtoken");

const buildUserReply = (user) => ({
  _id:          user._id,
  firstName:    user.firstName,
  lastName:     user.lastName     || "",
  emailId:      user.emailId,
  role:         user.role,
  age:          user.age          || "",
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
  authProvider: user.authProvider || "local",
  createdAt:    user.createdAt,
});

const cookieOptions = {
  httpOnly: true,
  secure:   true,
  sameSite: "none",
  maxAge:   60 * 60 * 1000,
};

// ── Register (local) ───────────────────────────────────────────────
const register = async (req, res) => {
  try {
    validate(req.body);
    const { emailId, password } = req.body;
    req.body.password    = await bcrypt.hash(password, 10);
    req.body.role        = "user";
    req.body.authProvider = "local";

    const user  = await User.create(req.body);
    const token = jwt.sign(
      { _id: user._id, emailId, role: "user" },
      process.env.JWT_KEY,
      { expiresIn: 60 * 60 },
    );
    res.cookie("token", token, cookieOptions);
    res.status(201).json({ user: buildUserReply(user), message: "Registered Successfully" });
  } catch (err) {
    res.status(400).json({ error: "Error: " + err.message });
  }
};

// ── Login (local) ──────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { emailId, password } = req.body;
    if (!emailId || !password) throw new Error("Invalid Credentials");

    const user = await User.findOne({ emailId });
    if (!user) throw new Error("Invalid Credentials");

    // Block OAuth users from password login
    if (user.authProvider !== "local") {
      throw new Error(`This account uses ${user.authProvider} sign-in. Please use that instead.`);
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new Error("Invalid Credentials");

    const token = jwt.sign(
      { _id: user._id, emailId, role: user.role },
      process.env.JWT_KEY,
      { expiresIn: 60 * 60 },
    );
    res.cookie("token", token, cookieOptions);
    res.status(200).json({ user: buildUserReply(user), message: "Login Successfully" });
  } catch (err) {
    res.status(401).json({ error: "Error: " + err.message });
  }
};

// ── Logout ─────────────────────────────────────────────────────────
const logout = async (req, res) => {
  try {
    const { token } = req.cookies;
    const payload   = jwt.decode(token);
    await redisClient.set(`token:${token}`, "Blocked");
    await redisClient.expireAt(`token:${token}`, payload.exp);
    res.cookie("token", null, { expires: new Date(Date.now()) });
    res.status(200).json({ message: "Logged Out Successfully" });
  } catch (err) {
    res.status(503).json({ error: "Error: " + err.message });
  }
};

// ── OAuth Callback (shared by Google + GitHub) ─────────────────────
const oauthCallback = async (req, res) => {
  try {
    const user  = req.user; // set by passport
    const token = jwt.sign(
      { _id: user._id, emailId: user.emailId, role: user.role },
      process.env.JWT_KEY,
      { expiresIn: 60 * 60 },
    );
    res.cookie("token", token, cookieOptions);
    res.redirect(`${process.env.FRONTEND_URL}/oauth/success`);
  } catch (err) {
    res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
  }
};

// ── Check Auth (used after OAuth redirect) ─────────────────────────
const checkAuth = async (req, res) => {
  try {
    const user = await User.findById(req.result._id).select("-password");
    if (!user) return res.status(401).json({ error: "User not found" });
    res.status(200).json({ user: buildUserReply(user) });
  } catch (err) {
    res.status(401).json({ error: "Unauthorized" });
  }
};

// ── Admin Register ─────────────────────────────────────────────────
const adminRegister = async (req, res) => {
  try {
    validate(req.body);
    const { emailId, password } = req.body;
    req.body.password = await bcrypt.hash(password, 10);
    const user  = await User.create(req.body);
    const token = jwt.sign(
      { _id: user._id, emailId, role: user.role },
      process.env.JWT_KEY,
      { expiresIn: 60 * 60 },
    );
    res.cookie("token", token, { maxAge: 60 * 60 * 1000, httpOnly: true });
    res.status(201).json({ message: "Admin Registered Successfully" });
  } catch (err) {
    res.status(400).json({ error: "Error: " + err.message });
  }
};

// ── Delete Profile ─────────────────────────────────────────────────
const deleteProfile = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.result._id);
    res.status(200).json({ message: "Deleted Successfully" });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ── Update Profile ─────────────────────────────────────────────────
const updateProfile = async (req, res) => {
  try {
    const userId = req.result._id;
    const allowedFields = [
      "firstName","lastName","age","profileImage","gender","location",
      "birthday","website","github","linkedin","twitter","readme",
      "work","education","skills","showRecentAC","showHeatmap",
    ];
    const updateData = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updateData[field] = req.body[field];
    });
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true },
    ).select("-password");

    if (!updatedUser) return res.status(404).json({ message: "User not found" });
    return res.status(200).json({ message: "Profile updated successfully", user: buildUserReply(updatedUser) });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  register, login, logout,
  oauthCallback, checkAuth,
  adminRegister, deleteProfile, updateProfile,
};