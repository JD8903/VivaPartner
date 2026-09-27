const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

// Function to auto-seed essential admin and teacher if DB is missing them
async function autoSeedDefaults() {
  try {
    const User = require("../models/User");
    const Department = require("../models/Department");
    const Subject = require("../models/Subject");
    const Class = require("../models/Class");
    const Assignment = require("../models/Assignment");

    let adminUser = await User.findOne({ email: "admin@vivapartner.com" });
    if (!adminUser) {
      const salt = await bcrypt.genSalt(10);
      const adminPassword = await bcrypt.hash("admin123", salt);
      adminUser = await User.create({
        name: "System Admin",
        email: "admin@vivapartner.com",
        password: adminPassword,
        role: "admin",
        status: "Active",
      });
      console.log("👤 Default Admin initialized: admin@vivapartner.com / admin123");
    }

    let teacherUser = await User.findOne({ email: "teacher@vivapartner.com" });
    if (!teacherUser) {
      const salt = await bcrypt.genSalt(10);
      const teacherPassword = await bcrypt.hash("teacher123", salt);
      teacherUser = await User.create({
        name: "Prof. Janki Gauswami",
        email: "teacher@vivapartner.com",
        password: teacherPassword,
        role: "teacher",
        status: "Active",
      });
      console.log("👨‍🏫 Default Teacher initialized: teacher@vivapartner.com / teacher123");
    }

    // Ensure default department & class exist for seamless usage
    let dept = await Department.findOne({ code: "CE" });
    if (!dept) {
      dept = await Department.create({
        name: "Computer Engineering",
        code: "CE",
      });
    }

    let subj = await Subject.findOne({ code: "CS301" });
    if (!subj) {
      subj = await Subject.create({
        name: "Software Engineering",
        code: "CS301",
        department: dept ? dept._id : undefined,
        semester: 5,
        credits: 4,
      });
    }

    let classCE5A = await Class.findOne({ code: "CE5A" });
    if (!classCE5A && dept) {
      classCE5A = await Class.create({
        name: "CE-5A",
        code: "CE5A",
        department: dept._id,
        semester: 5,
        academicYear: "2026",
        capacity: 60,
        status: "Active",
      });
    }

    if (teacherUser && dept && subj && classCE5A) {
      let assign = await Assignment.findOne({ teacher: teacherUser._id });
      if (!assign) {
        await Assignment.create({
          teacher: teacherUser._id,
          department: dept._id,
          subject: subj._id,
          class: classCE5A._id,
          status: "Active",
        });
      }
    }
  } catch (err) {
    console.warn("⚠️ Auto-seeding notice:", err.message);
  }
}

const connectDB = async () => {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  const primaryUri = process.env.MONGO_URI;
  const localUri = "mongodb://127.0.0.1:27017/vivapartner";

  const opts = {
    serverSelectionTimeoutMS: 5000,
  };

  if (!cached.promise) {
    cached.promise = (async () => {
      // 1. Try Primary URI (Atlas or custom)
      if (primaryUri) {
        try {
          const conn = await mongoose.connect(primaryUri, opts);
          const host = primaryUri.includes("@") ? primaryUri.split("@")[1].split("/")[0] : primaryUri;
          console.log(`✅ MongoDB Connected to: ${host}`);
          await autoSeedDefaults();
          return conn;
        } catch (err) {
          console.warn(`⚠️ Failed to connect to Primary MongoDB (${err.message}).`);
          if (primaryUri.includes("127.0.0.1") || primaryUri.includes("localhost")) {
            throw err;
          }
          console.log(`🔄 Attempting fallback to Local MongoDB (${localUri})...`);
        }
      }

      // 2. Fallback to Local MongoDB
      try {
        const conn = await mongoose.connect(localUri, opts);
        console.log(`✅ MongoDB Connected to Local Database (${localUri})`);
        await autoSeedDefaults();
        return conn;
      } catch (err) {
        console.error(`❌ MongoDB Local Connection Error:`, err.message);
        throw err;
      }
    })();
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (e) {
    cached.promise = null;
    cached.conn = null;
    throw e;
  }
};

module.exports = connectDB;