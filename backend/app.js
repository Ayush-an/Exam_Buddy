const mongoose = require('mongoose');
const express = require("express");
const app = express();
const UserRoute = require("./routes/user.router");
const questionRouter = require('./routes/question.router');
const AdminRoute = require('./routes/admin.router');
const cors = require('cors');

const { QuestionPaper } = require('./models/question.model');
(async () => {
  await mongoose.connect('mongodb://127.0.0.1:27017/Exam_buddy');
  await QuestionPaper.seedInitialData();  // <== CALL THIS ONCE
})();
// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
// Routes
app.use("/api/admin", AdminRoute); // ✅ Clean base path
app.use("/api/user", UserRoute);
app.use("/api", questionRouter); // ✅ Clean base path
app.get("/", (req, res) => {
  res.send("API is running");
});
module.exports = app;