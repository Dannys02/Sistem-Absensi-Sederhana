const mongoose = require("mongoose");
const User = require("./models/User");
require("dotenv").config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { dbName: 'absensiku'});

    const existingAdmin = await User.findOne({
      email: "admin@gmail.com",
    });

    if (existingAdmin) {
      console.log("Admin sudah ada");
      return;
    }

    await User.create({
      name: "Administrator",
      email: "admin@gmail.com",
      password: "password",
      role: "admin",
    });

    console.log("Admin berhasil dibuat");
  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.disconnect();
  }
};

seedAdmin();