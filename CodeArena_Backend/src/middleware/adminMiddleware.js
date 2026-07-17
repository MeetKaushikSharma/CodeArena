const jwt = require("jsonwebtoken");
const User = require("../models/user");
const redisClient = require("../config/redis");

const adminMiddleware = async (req, res, next) => {
  try {
    const { token } = req.cookies;
    if (!token) {
      throw new Error("Token Doesn't exist");
    }
    const payload = jwt.verify(token, process.env.JWT_KEY);

    const { _id } = payload;
    if (!_id) {
      throw new Error("Invalid Token");
    }
    const result = await User.findById(_id);

    if (!result) {
      throw new Error("Admin doesn't exists");
    }

    if (result.role !== "admin") {
      throw new Error("You are not a admin");
    }

    // Redis ke Blocklist mai present toh nahi hai?

    const IsBlocked = await redisClient.exists(`token:${token}`);

    if (IsBlocked) {
      throw new Error("Invalid Token");
    }
    req.result = result;

    next();
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
};

module.exports = adminMiddleware;
