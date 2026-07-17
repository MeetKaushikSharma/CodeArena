require("dotenv").config();
const mongoose = require("mongoose");
const Problem = require("../src/models/problem");
const User = require("../src/models/user");

const ADMIN_EMAIL = "Kaushik@gmail.com";

const problems = require('./problems_44_70.js');

// ─── SEEDER ────────────────────────────────────────────────────────
const seed = async () => {
  await mongoose.connect(process.env.DB_CONNECT_STRING);
  console.log("Connected to DB");

  const admin = await User.findOne({ emailId: ADMIN_EMAIL });
  if (!admin) {
    console.error("Admin not found");
    process.exit(1);
  }

  let added = 0,
    skipped = 0;
  for (const p of problems) {
    const exists = await Problem.findOne({ title: p.title });
    if (exists) {
      console.log(`⏭  Skipped: ${p.title}`);
      skipped++;
      continue;
    }
    await Problem.create({ ...p, problemCreator: admin._id });
    console.log(`✅ Added: ${p.title}`);
    added++;
  }
  console.log(`\nDone! Added: ${added} | Skipped: ${skipped}`);
  await mongoose.disconnect();
};

seed().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
