const app = require("./app");
const db = require('./config/db')
const UserModel = require('./models/user.model');

const port = 3000;

app.get("/",(req,res)=>{
    res.send("Welcome to Exam Buddy API");
});

app.listen(port,()=>{
    console.log(`Server Listening on Port http://localhost:${port}`);
});