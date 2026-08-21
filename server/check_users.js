const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const User = require("./models/User");
const Class = require("./models/Class");
const Department = require("./models/Department");
const Subject = require("./models/Subject");
const Assignment = require("./models/Assignment");

async function check() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        let teachers = await User.find({ role: "teacher" });
        console.log("Teachers in DB:", teachers.map(u => ({ email: u.email, name: u.name })));

        if (teachers.length === 0) {
            console.log("No teachers found. Seeding department, subject, class, teacher and assignment...");
            
            // Find or create department
            let dept = await Department.findOne({});
            if (!dept) {
                dept = await Department.create({
                    name: "Computer Science",
                    code: "CS"
                });
            }

            // Find or create subject
            let subject = await Subject.findOne({});
            if (!subject) {
                subject = await Subject.create({
                    name: "Software Engineering",
                    code: "CS301",
                    department: dept._id,
                    semester: 5,
                    credits: 4
                });
            }

            // Find or create class
            let classObj = await Class.findOne({});
            if (!classObj) {
                classObj = await Class.create({
                    name: "CS-A",
                    code: "CSA",
                    department: dept._id,
                    semester: 5,
                    academicYear: "2026",
                    capacity: 60,
                    status: "Active"
                });
            }

            // Create teacher
            const salt = await bcrypt.genSalt(10);
            const hashedTeacherPassword = await bcrypt.hash("teacher123", salt);

            const teacher = await User.create({
                name: "Teacher User",
                email: "teacher@vivapartner.com",
                password: hashedTeacherPassword,
                role: "teacher",
                status: "Active",
                department: dept._id
            });

            // Create assignment
            await Assignment.create({
                teacher: teacher._id,
                department: dept._id,
                subject: subject._id,
                class: classObj._id,
                status: "Active"
            });

            console.log("Teacher seeding completed!");
        } else {
            // Check assignments
            const teacher = teachers[0];
            let dept = await Department.findOne({});
            let subject = await Subject.findOne({});
            let classObj = await Class.findOne({});

            if (!dept) {
                dept = await Department.create({ name: "Computer Science", code: "CS" });
            }
            if (!subject) {
                subject = await Subject.create({ name: "Software Engineering", code: "CS301", department: dept._id, semester: 5, credits: 4 });
            }
            if (!classObj) {
                classObj = await Class.create({ name: "CS-A", code: "CSA", department: dept._id, semester: 5, academicYear: "2026", capacity: 60, status: "Active" });
            }

            const assignmentExists = await Assignment.findOne({ teacher: teacher._id });
            if (!assignmentExists) {
                await Assignment.create({
                    teacher: teacher._id,
                    department: dept._id,
                    subject: subject._id,
                    class: classObj._id,
                    status: "Active"
                });
                console.log("Created assignment for existing teacher");
            }
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
