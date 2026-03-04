const redisClient = require("../config/redis");
const User = require("../models/user");
const validate = require("../utils/validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// ── Single source of truth for what user data we send to frontend ──────
// This is the SAME shape returned by /check, /login, /register, /update.
// That's why the image now works on first login — no more mismatched shapes.
const buildUserReply = (user) => ({
  _id: user._id,
  firstName: user.firstName,
  lastName: user.lastName || "",
  emailId: user.emailId,
  role: user.role,
  age: user.age || "",
  profileImage: user.profileImage || "", // ← was missing from login/register
  gender: user.gender || "",
  location: user.location || "",
  birthday: user.birthday || "",
  website: user.website || "",
  github: user.github || "",
  linkedin: user.linkedin || "",
  twitter: user.twitter || "",
  readme: user.readme || "",
  work: user.work || "",
  education: user.education || "",
  skills: user.skills || "",
  showRecentAC: user.showRecentAC !== false,
  showHeatmap: user.showHeatmap !== false,
  createdAt: user.createdAt,
});

// ── Register ───────────────────────────────────────────────────────────
const register = async (req, res) => {
  try {
    validate(req.body);
    const { emailId, password } = req.body;

    req.body.password = await bcrypt.hash(password, 10);
    req.body.role = "user";

    const user = await User.create(req.body);
    const token = jwt.sign(
      { _id: user._id, emailId, role: "user" },
      process.env.JWT_KEY,
      { expiresIn: 60 * 60 },
    );

    res.cookie("token", token, {
      maxAge: 60 * 60 * 1000,
      httpOnly: true,
    });
    res.status(201).json({
      user: buildUserReply(user), // ← full shape
      message: "Registered Successfully",
    });
  } catch (err) {
    res.status(400).json({ error: "Error: " + err.message });
  }
};

// ── Login ──────────────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { emailId, password } = req.body;
    if (!emailId || !password) throw new Error("Invalid Credentials");

    const user = await User.findOne({ emailId });
    if (!user) throw new Error("Invalid Credentials");

    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new Error("Invalid Credentials");

    const token = jwt.sign(
      { _id: user._id, emailId, role: user.role },
      process.env.JWT_KEY,
      { expiresIn: 60 * 60 },
    );

    res.cookie("token", token, { maxAge: 60 * 60 * 1000, httpOnly: true });
    res.status(200).json({
      user: buildUserReply(user), // ← full shape, not just 4 fields
      message: "Login Successfully",
    });
  } catch (err) {
    res.status(401).json({ error: "Error: " + err.message });
  }
};

// ── Logout ─────────────────────────────────────────────────────────────
const logout = async (req, res) => {
  try {
    const { token } = req.cookies;
    const payload = jwt.decode(token);
    await redisClient.set(`token:${token}`, "Blocked");
    await redisClient.expireAt(`token:${token}`, payload.exp);
    res.cookie("token", null, { expires: new Date(Date.now()) });
    res.status(200).json({ message: "Logged Out Successfully" });
  } catch (err) {
    res.status(503).json({ error: "Error: " + err.message });
  }
};

// ── Admin Register ─────────────────────────────────────────────────────
const adminRegister = async (req, res) => {
  try {
    validate(req.body);
    const { emailId, password } = req.body;
    req.body.password = await bcrypt.hash(password, 10);
    const user = await User.create(req.body);
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

// ── Delete Profile ─────────────────────────────────────────────────────
const deleteProfile = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.result._id);
    res.status(200).json({ message: "Deleted Successfully" });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ── Update Profile ─────────────────────────────────────────────────────
const updateProfile = async (req, res) => {
  try {
    const userId = req.result._id;

    const allowedFields = [
      "firstName",
      "lastName",
      "age",
      "profileImage",
      "gender",
      "location",
      "birthday",
      "website",
      "github",
      "linkedin",
      "twitter",
      "readme",
      "work",
      "education",
      "skills",
      "showRecentAC",
      "showHeatmap",
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

    if (!updatedUser)
      return res.status(404).json({ message: "User not found" });

    return res.status(200).json({
      message: "Profile updated successfully",
      user: buildUserReply(updatedUser), // ← full shape
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  register,
  login,
  logout,
  adminRegister,
  deleteProfile,
  updateProfile,
};
