const express = require("express");
const UserRoute = require("./routes/user.router");
const app = express();

// ✅ Built-in middleware for parsing JSON and form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Routes
app.use("/api/user", UserRoute);

module.exports = app;
