const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    nis: { type: String, required: true, unique: true },
    phone: { type: String, default: "" },
    parentPhone: { type: String, default: "" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Student", studentSchema);
