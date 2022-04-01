const express = require("express");
const bodyParser = require("body-parser");
const req = require("express/lib/request");

const app = express();

const http = require("http").Server(app);

const port = 3000;

http.listen(port);

console.log(`Express server is running on port ${port}.`);

// Use body-parser to convert our front-end data into JavaScript Objects.
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

// Custom Variables
const tasks = [];

// Express Routes
app.use("/", express.static("public_html/"));

// POST Handlers
app.post("/createTask", function (request, response) {

    let newTask = request.body;

    if (newTask.description === "") {
        let message = {
            message: "You need to have a value for the Task Description.",
            error: true
        };

        response.send(message);
    } else {

        console.log(newTask);

        tasks.push(newTask);

        let message = {
            message: "Task added successfully!",
            error: false
        };
        
        // .send() ends the function, make sure its the last line in our function.
        response.send(message);
    }
});

app.post("/list", function (request, response) {
    
    let responseObject = {
        list: tasks
    }

    response.send(responseObject);
});