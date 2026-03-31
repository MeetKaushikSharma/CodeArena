const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const GitHubStrategy = require("passport-github2").Strategy;
const User = require("../models/user");

// ── Google ────────────────────────────────────────────────────────
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL}/user/auth/google/callback`,
    },
    async (_, __, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) return done(new Error("No email from Google"), null);

        let user = await User.findOne({ emailId: email });

        if (!user) {
          user = await User.create({
            firstName:
              (profile.name?.givenName || profile.displayName || "User").slice(
                0,
                20,
              ) || "User",
            lastName: profile.name?.familyName || "",
            emailId: email,
            profileImage: profile.photos?.[0]?.value || "",
            authProvider: "google",
            googleId: profile.id,
            password: "",
          });
        } else if (!user.googleId) {
          // Link Google to existing local account
          user.googleId = profile.id;
          if (!user.profileImage)
            user.profileImage = profile.photos?.[0]?.value || "";
          await user.save();
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    },
  ),
);

// ── GitHub ────────────────────────────────────────────────────────
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL}/user/auth/github/callback`,
      scope: ["user:email"],
    },
    async (_, __, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email)
          return done(
            new Error("GitHub account must have a public email"),
            null,
          );

        let user = await User.findOne({ emailId: email });

        if (!user) {
          const parts = (
            profile.displayName ||
            profile.username ||
            "User"
          ).split(" ");
          user = await User.create({
            firstName: (parts[0] || "User").slice(0, 20),
            lastName: parts.slice(1).join(" ") || "",
            emailId: email,
            profileImage: profile.photos?.[0]?.value || "",
            authProvider: "github",
            githubId: profile.id.toString(),
            password: "",
          });
        } else if (!user.githubId) {
          user.githubId = profile.id.toString();
          if (!user.profileImage)
            user.profileImage = profile.photos?.[0]?.value || "";
          await user.save();
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    },
  ),
);

module.exports = passport;
