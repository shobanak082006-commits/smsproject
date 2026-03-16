const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const session = require("express-session");
const cors = require("cors");

const app = express();

/* ===========================
   MIDDLEWARE
=========================== */

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

app.use(session({
  secret: "sms-secret-key",
  resave: false,
  saveUninitialized: true
}));

app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

/* ===========================
   ROOT PAGE
=========================== */

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/login.html");
});

/* ===========================
   MONGODB CONNECTION
   (Cloud-ready)
=========================== */

mongoose.connect("mongodb://mongo:rWoPInOWQBqGDMPIeJWmAnwbUjGrHDXz@caboose.proxy.rlwy.net:25417/studentDB")
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log("DB Error:", err));

/* ===========================
   STUDENT SCHEMA
=========================== */

const studentSchema = new mongoose.Schema({
  name: String,
  registerNo: { type: String, unique: true, trim: true },
  phone: String,
  address: String,
  dob: String,
  bloodGroup: String,
  fatherName: String,
  motherName: String,
  parentPhone: String,
  caste: String,
  religion: String,
  attendancePercentage: String,
  semesterPercentage: String,
  photo: String
});

const Student = mongoose.model("Student", studentSchema);

/* ===========================
   MULTER SETUP
=========================== */

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

/* ===========================
   LOGIN
=========================== */

app.post("/login", (req, res) => {

  const phone = req.body.phone?.trim();
  const password = req.body.password?.trim();

  if (phone === "9876543210" && password === "admin@123") {

    req.session.admin = true;
    res.redirect("/dashboard");

  } else {
    res.send("Invalid Login");
  }

});

/* ===========================
   DASHBOARD
=========================== */

app.get("/dashboard", (req, res) => {

  if (req.session.admin) {
    res.sendFile(__dirname + "/public/dashboard.html");
  } else {
    res.redirect("/login.html");
  }

});

/* ===========================
   LOGOUT
=========================== */

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login.html");
  });
});

/* ===========================
   ADD STUDENT
=========================== */

app.post("/add-student", upload.single("photo"), async (req, res) => {

  try {
    const photoName = req.file ? req.file.filename : "";

    const newStudent = new Student({
      name: req.body.name,
      registerNo: req.body.registerNo?.trim(),
      phone: req.body.phone,
      address: req.body.address,
      dob: req.body.dob,
      bloodGroup: req.body.bloodGroup,
      fatherName: req.body.fatherName,
      motherName: req.body.motherName,
      parentPhone: req.body.parentPhone,
      caste: req.body.caste,
      religion: req.body.religion,
      attendancePercentage: req.body.attendancePercentage,
      semesterPercentage: req.body.semesterPercentage,
      photo: photoName
    });

    await newStudent.save();
    res.redirect("/dashboard");

  } catch (error) {
    console.log("Add Error:", error);
    res.send("Register Number Already Exists");
  }

});

/* ===========================
   SEARCH STUDENT
=========================== */

app.get("/student/:regNo", async (req, res) => {

  try {
    const regNo = req.params.regNo.trim();
    const student = await Student.findOne({ registerNo: regNo });

    if (!student) return res.json({ message: "Not Found" });

    res.json(student);

  } catch (error) {
    console.log("Search Error:", error);
    res.json({ message: "Error Occurred" });
  }

});

/* ===========================
   DELETE STUDENT
=========================== */

app.delete("/delete-student/:regNo", async (req, res) => {

  try {
    const regNo = req.params.regNo.trim();
    const deleted = await Student.findOneAndDelete({ registerNo: regNo });

    if (!deleted) return res.json({ message: "Student Not Found" });

    res.json({ message: "Deleted Successfully" });

  } catch (error) {
    console.log("Delete Error:", error);
    res.json({ message: "Error Occurred" });
  }

});

/* ===========================
   SERVER START (Cloud-ready)
=========================== */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
