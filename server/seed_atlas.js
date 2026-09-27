const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");

dotenv.config();

const User = require("./models/User");
const Department = require("./models/Department");
const Subject = require("./models/Subject");
const Class = require("./models/Class");
const Assignment = require("./models/Assignment");
const Student = require("./models/Student");

const ATLAS_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://gjanki410_db_user:IfUoPltTfHTB8DZp@cluster0.iosswqx.mongodb.net/vivapartner?retryWrites=true&w=majority&appName=Cluster0";

async function seedData() {
  try {
    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(ATLAS_URI);
    console.log("Connected to MongoDB Atlas successfully! ✅");

    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash("admin123", salt);
    const teacherPassword = await bcrypt.hash("teacher123", salt);

    // ====================================================
    // 1. Seed Departments
    // ====================================================
    console.log("Seeding Departments...");
    let deptCE = await Department.findOne({ code: "CE" });
    if (!deptCE) {
      deptCE = await Department.create({
        name: "Computer Engineering",
        code: "CE",
      });
    }

    let deptIT = await Department.findOne({ code: "IT" });
    if (!deptIT) {
      deptIT = await Department.create({
        name: "Information Technology",
        code: "IT",
      });
    }

    // ====================================================
    // 2. Seed Subjects
    // ====================================================
    console.log("Seeding Subjects...");
    let subjSE = await Subject.findOne({ code: "CS301" });
    if (!subjSE) {
      subjSE = await Subject.create({
        name: "Software Engineering",
        code: "CS301",
        department: deptCE._id,
        semester: 5,
        credits: 4,
      });
    }

    let subjDBMS = await Subject.findOne({ code: "CS302" });
    if (!subjDBMS) {
      subjDBMS = await Subject.create({
        name: "Database Management Systems",
        code: "CS302",
        department: deptCE._id,
        semester: 5,
        credits: 4,
      });
    }

    let subjAI = await Subject.findOne({ code: "CS303" });
    if (!subjAI) {
      subjAI = await Subject.create({
        name: "Artificial Intelligence",
        code: "CS303",
        department: deptCE._id,
        semester: 6,
        credits: 4,
      });
    }

    let subjWeb = await Subject.findOne({ code: "IT301" });
    if (!subjWeb) {
      subjWeb = await Subject.create({
        name: "Web Technologies",
        code: "IT301",
        department: deptIT._id,
        semester: 5,
        credits: 4,
      });
    }

    // ====================================================
    // 3. Seed Classes
    // ====================================================
    console.log("Seeding Classes...");
    let classCE5A = await Class.findOne({ code: "CE5A" });
    if (!classCE5A) {
      classCE5A = await Class.create({
        name: "CE-5A",
        code: "CE5A",
        department: deptCE._id,
        semester: 5,
        academicYear: "2026",
        capacity: 60,
        status: "Active",
      });
    }

    let classCE5B = await Class.findOne({ code: "CE5B" });
    if (!classCE5B) {
      classCE5B = await Class.create({
        name: "CE-5B",
        code: "CE5B",
        department: deptCE._id,
        semester: 5,
        academicYear: "2026",
        capacity: 60,
        status: "Active",
      });
    }

    let classIT5A = await Class.findOne({ code: "IT5A" });
    if (!classIT5A) {
      classIT5A = await Class.create({
        name: "IT-5A",
        code: "IT5A",
        department: deptIT._id,
        semester: 5,
        academicYear: "2026",
        capacity: 60,
        status: "Active",
      });
    }

    // ====================================================
    // 4. Seed Users (Admin & Teacher)
    // ====================================================
    console.log("Seeding Admin & Teacher...");
    let adminUser = await User.findOne({ email: "admin@vivapartner.com" });
    if (!adminUser) {
      adminUser = await User.create({
        name: "System Admin",
        email: "admin@vivapartner.com",
        password: adminPassword,
        role: "admin",
        status: "Active",
      });
    }

    let teacherUser = await User.findOne({ email: "teacher@vivapartner.com" });
    if (!teacherUser) {
      teacherUser = await User.create({
        name: "Prof. Janki Gauswami",
        email: "teacher@vivapartner.com",
        password: teacherPassword,
        role: "teacher",
        status: "Active",
        department: deptCE._id,
      });
    }

    // ====================================================
    // 5. Seed Assignments
    // ====================================================
    console.log("Seeding Teacher Assignments...");
    let assign1 = await Assignment.findOne({
      teacher: teacherUser._id,
      class: classCE5A._id,
      subject: subjSE._id,
    });
    if (!assign1) {
      await Assignment.create({
        teacher: teacherUser._id,
        department: deptCE._id,
        subject: subjSE._id,
        class: classCE5A._id,
        status: "Active",
      });
    }

    let assign2 = await Assignment.findOne({
      teacher: teacherUser._id,
      class: classCE5B._id,
      subject: subjSE._id,
    });
    if (!assign2) {
      await Assignment.create({
        teacher: teacherUser._id,
        department: deptCE._id,
        subject: subjSE._id,
        class: classCE5B._id,
        status: "Active",
      });
    }

    // ====================================================
    // 6. Seed Students
    // ====================================================
    console.log("Seeding Students...");
    const sampleStudents = [
      { enrollment: "CS2026001", name: "Aarav Patel", department: "Computer Engineering", semester: 5, classId: "CE5A", class: classCE5A._id, teacher: teacherUser._id },
      { enrollment: "CS2026002", name: "Diya Sharma", department: "Computer Engineering", semester: 5, classId: "CE5A", class: classCE5A._id, teacher: teacherUser._id },
      { enrollment: "CS2026003", name: "Rohan Mehta", department: "Computer Engineering", semester: 5, classId: "CE5A", class: classCE5A._id, teacher: teacherUser._id },
      { enrollment: "CS2026004", name: "Ananya Joshi", department: "Computer Engineering", semester: 5, classId: "CE5A", class: classCE5A._id, teacher: teacherUser._id },
      { enrollment: "CS2026005", name: "Harsh Shah", department: "Computer Engineering", semester: 5, classId: "CE5A", class: classCE5A._id, teacher: teacherUser._id },
      { enrollment: "CS2026006", name: "Pooja Varma", department: "Computer Engineering", semester: 5, classId: "CE5B", class: classCE5B._id, teacher: teacherUser._id },
      { enrollment: "CS2026007", name: "Karan Dave", department: "Computer Engineering", semester: 5, classId: "CE5B", class: classCE5B._id, teacher: teacherUser._id },
      { enrollment: "IT2026001", name: "Sneha Desai", department: "Information Technology", semester: 5, classId: "IT5A", class: classIT5A._id, teacher: teacherUser._id },
      { enrollment: "IT2026002", name: "Vikas Trivedi", department: "Information Technology", semester: 5, classId: "IT5A", class: classIT5A._id, teacher: teacherUser._id },
      { enrollment: "IT2026003", name: "Riya Parikh", department: "Information Technology", semester: 5, classId: "IT5A", class: classIT5A._id, teacher: teacherUser._id },
    ];

    for (const s of sampleStudents) {
      const exists = await Student.findOne({ enrollment: s.enrollment });
      if (!exists) {
        await Student.create(s);
      }
    }

    console.log("==========================================");
    console.log("🎉 ALL SEED DATA SUCCESSFULLY INSERTED INTO MONGO ATLAS! 🎉");
    console.log("==========================================");
    console.log("👤 Admin Login:  admin@vivapartner.com / admin123");
    console.log("👨‍🏫 Teacher Login: teacher@vivapartner.com / teacher123");
    console.log("==========================================");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding Error:", error);
    process.exit(1);
  }
}

seedData();
