const mongoose = require("mongoose");
const User = require("./models/User");
const Student = require("./models/Student");
const Class = require("./models/Class");
require("dotenv").config();

const classes = [
  {
    className: "XII RPL",
    students: [
      {
        name: "Dannys Martha Favrillia",
        email: "dannys@gmail.com",
        nis: "1001",
      },
      { name: "Arya Prana Jaya", email: "arya@gmail.com", nis: "1002" },
      { name: "Revan", email: "repan@gmail.com", nis: "1003" },
      { name: "Akbar Syabekti", email: "syabekti@gmail.com", nis: "1004" },
      { name: "Mas Hadi", email: "hadi@gmail.com", nis: "1005" },
      { name: "Reyes", email: "reyes@gmail.com", nis: "1006" },
      { name: "Farhan", email: "farhan@gmail.com", nis: "1007" },
    ],
  },
  {
    className: "XII TKJ",
    students: [
      { name: "Budi Santoso", email: "budi@gmail.com", nis: "2001" },
      { name: "Andi Pratama", email: "andi@gmail.com", nis: "2002" },
      { name: "Rizky Ramadhan", email: "rizky@gmail.com", nis: "2003" },
    ],
  },
  {
    className: "XII DKV",
    students: [
      { name: "Sinta Lestari", email: "sinta@gmail.com", nis: "3001" },
      { name: "Dewi Anggraini", email: "dewi@gmail.com", nis: "3002" },
      { name: "Tono Wijaya", email: "tono@gmail.com", nis: "3003" },
    ],
  },
];

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { dbName: "absensiku" });

    for (const { className, students } of classes) {
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
    }
  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.disconnect();
  }
};

seedData();
