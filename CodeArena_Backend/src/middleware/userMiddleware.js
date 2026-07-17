const jwt = require("jsonwebtoken");
const User = require("../models/user");
const redisClient = require("../config/redis");

const userMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ message: "Token does not exist" });
    }

    const payload = jwt.verify(token, process.env.JWT_KEY);

    if (!payload?._id) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const result = await User.findById(payload._id);

    if (!result) {
      return res.status(401).json({ message: "User does not exist" });
    }

    const isBlocked = await redisClient.exists(`token:${token}`);
    if (isBlocked) {
      return res.status(401).json({ message: "Invalid token" });
    }

    req.result = result;
    next();
  } catch (err) {
    return res.status(401).json({ message: err.message });
  }
};

module.exports = userMiddleware;