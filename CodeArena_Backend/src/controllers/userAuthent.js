const redisClient = require("../config/redis");
const User = require("../models/user");
const validate = require("../utils/validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "none",
  maxAge: 60 * 60 * 1000,
};

// ── Register (local) ───────────────────────────────────────────────
const register = async (req, res) => {
  try {
    validate(req.body);
    const { emailId, password } = req.body;
    req.body.password = await bcrypt.hash(password, 10);
    req.body.role = "user";
    req.body.authProvider = "local";

    const user = await User.create(req.body);
    const token = jwt.sign(
      { _id: user._id, emailId, role: "user" },
      process.env.JWT_KEY,
      { expiresIn: 60 * 60 },
    );
    res.cookie("token", token, cookieOptions);
    const { password: _password, ...safeUser } = user.toObject();
    res.status(201).json({ user: safeUser, message: "Registered Successfully" });
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
      throw new Error(
        `This account uses ${user.authProvider} sign-in. Please use that instead.`,
      );
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new Error("Invalid Credentials");

    const token = jwt.sign(
      { _id: user._id, emailId, role: user.role },
      process.env.JWT_KEY,
      { expiresIn: 60 * 60 },
    );
    res.cookie("token", token, cookieOptions);
    const { password: _password, ...safeUser } = user.toObject();
    res.status(200).json({ user: safeUser, message: "Login Successfully" });
  } catch (err) {
    res.status(401).json({ error: "Error: " + err.message });
  }
};

// ── Logout ─────────────────────────────────────────────────────────
const logout = async (req, res) => {
  try {
    const { token } = req.cookies;
    if (token) {
      const payload = jwt.decode(token);
      if (payload && payload.exp) {
        await redisClient.set(`token:${token}`, "Blocked");
        await redisClient.expireAt(`token:${token}`, payload.exp);
      }
      res.clearCookie("token", cookieOptions);
    }
    res.status(200).json({ message: "Logged Out Successfully" });
  } catch (err) {
    res.status(503).json({ error: "Error: " + err.message });
  }
};

// ── OAuth Callback (shared by Google + GitHub) ─────────────────────
const oauthCallback = async (req, res) => {
  try {
    const user = req.user;
    const token = jwt.sign(
      { _id: user._id, emailId: user.emailId, role: user.role },
      process.env.JWT_KEY,
      { expiresIn: 60 * 60 },
    );

    // Store token in Redis with 2 min TTL — single use
    const code = Math.random().toString(36).slice(2) + Date.now().toString(36);
    await redisClient.set(`oauth:${code}`, token, { EX: 120 });

    // Pass code in URL — safe (not the JWT itself)
    res.redirect(`${process.env.FRONTEND_URL}/oauth/success?code=${code}`);
  } catch (err) {
    res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
  }
};

// ── Exchange code for real session cookie ──────────────────────────
const exchangeOAuthCode = async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) return res.status(400).json({ error: "Missing code" });

    const token = await redisClient.get(`oauth:${code}`);
    if (!token)
      return res.status(400).json({ error: "Invalid or expired code" });

    // Delete immediately — single use only
    await redisClient.del(`oauth:${code}`);

    // Set proper httpOnly cookie now (same-origin request, no cross-domain issues)
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 60 * 60 * 1000,
    });

    // Verify token and return user
    const payload = jwt.verify(token, process.env.JWT_KEY);
    const user = await User.findById(payload._id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });

    res.status(200).json({ user });
  } catch (err) {
    res.status(400).json({ error: "Exchange failed: " + err.message });
  }
};

// ── Check Auth (used after OAuth redirect) ─────────────────────────
const checkAuth = async (req, res) => {
  try {
    const user = await User.findById(req.result._id).select("-password");
    if (!user) return res.status(401).json({ error: "User not found" });
    res.status(200).json({ user });
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
    req.body.role = "admin";
    const user = await User.create(req.body);
    const token = jwt.sign(
      { _id: user._id, emailId, role: user.role },
      process.env.JWT_KEY,
      { expiresIn: 60 * 60 },
    );
    res.cookie("token", token, cookieOptions);
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
    if (!req.result || !req.result._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

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
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true },
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = {
  register,
  login,
  logout,
  oauthCallback,
  checkAuth,
  adminRegister,
  deleteProfile,
  updateProfile,
  exchangeOAuthCode,
};
