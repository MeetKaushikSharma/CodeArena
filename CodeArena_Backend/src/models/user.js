const mongoose = require("mongoose");
const { Schema } = mongoose;

const userSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
      minLength: 3,
      maxLength: 20,
    },
    lastName: {
      type: String,
      minLength: 3,
      maxLength: 20,
    },
    emailId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      immutable: true,
    },
    age: {
      type: Number,
      min: 6,
      max: 80,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    problemSolved: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: "problem",
        },
      ],
      default: [],
    },
    password: {
      type: String,
      required: true,
    },
    profileImage: { type: String, default: "" },
    lastName: { type: String, default: "" },
    gender: { type: String, default: "" },
    location: { type: String, default: "" },
    birthday: { type: String, default: "" },
    website: { type: String, default: "" },
    github: { type: String, default: "" },
    linkedin: { type: String, default: "" },
    twitter: { type: String, default: "" },
    readme: { type: String, default: "" },
    work: { type: String, default: "" },
    education: { type: String, default: "" },
    skills: { type: String, default: "" },
    showRecentAC: { type: Boolean, default: true },
    showHeatmap: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  },
);

const User = mongoose.model("user", userSchema);

module.exports = User;
