const express = require("express");
const app = express();
const UserRoute = require("./routes/user.router");
const questionRouter = require('./routes/question.router');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/user", UserRoute);
app.use("/api", questionRouter); // ✅ Clean base path

module.exports = app;
