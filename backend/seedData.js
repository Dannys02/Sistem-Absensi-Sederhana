const mongoose = require("mongoose");
const User = require("./models/User");
const Student = require("./models/Student");
const Class = require("./models/Class");
require("dotenv").config();

const className = "XII RPL";

const students = [
  { name: "Dannys Martha Favrillia", email: "dannys@gmail.com", nis: "1001" },
  { name: "Arya Prana Jaya", email: "arya@gmail.com", nis: "1002" },
  { name: "Rehan", email: "rehan@gmail.com", nis: "1003" },
  { name: "Akbar Syabekti", email: "syabekti@gmail.com", nis: "1004" },
];

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { dbName: "absensiku" });

    // Class
    let kelas = await Class.findOne({ name: className });
    if (!kelas) {
      kelas = await Class.create({ name: className });
      console.log(`Class ${className} berhasil dibuat`);
    } else {
      console.log(`Class ${className} sudah ada`);
    }

    // User + Student
    for (const data of students) {
      const existingUser = await User.findOne({ email: data.email });
      if (existingUser) {
        console.log(`User ${data.email} sudah ada`);
        continue;
      }

      // pakai create (bukan insertMany) agar hook hash password jalan
      const user = await User.create({
        name: data.name,
        email: data.email,
        password: "password",
        role: "siswa",
      });

      await Student.create({
        userId: user._id,
        classId: kelas._id,
        nis: data.nis,
      });

      console.log(`Siswa ${data.name} berhasil dibuat`);
    }
  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.disconnect();
  }
};

seedData();
