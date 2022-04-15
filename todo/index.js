const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const req = require("express/lib/request");
const md5 = require("md5");
const credentials = require("./credentials.js");

// Express setup.
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
const dbUrl = credentials.dbUrl;

// Mongoose settings
const mongooseSettings = {
    useNewUrlParser: true,
    useUnifiedTopology: true
};

// Mongoose Setup
mongoose.connect(dbUrl, mongooseSettings, function (error) {
    checkError(error, "Successfully connected to MongoDB.");
});
let db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB Error: "));
mongoose.Promise = global.Promise;

// MongoDB Schema
let notesStructure = {
    description: String,
    notes: String,
    dueDate: String,
    created: String,
    priority: String,
    deleted: String,
    completed: String
};
let notesSchema = new mongoose.Schema(notesStructure);
let notesModel = new mongoose.model("notes", notesSchema);


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

        // Create ID for newTask. This is based on description and when this POST handler runs.
        // let hashData = newTask.description + Date.now();
        // let hash = md5(hashData);
        // newTask.id = hash;

        // Save task to database.
        // tasks.push(newTask);

        let taskObject = new notesModel(newTask);

        taskObject.save(function (error) {
            checkError(error, "Successfully saved Task to database.");

            if (error) {
                let message = {
                    message: "Something bad happened saving this task! Contact support.",
                    error: true
                };
                
                // .send() ends the function, make sure its the last line in our function.
                response.send(message);
            } else {
                let message = {
                    message: "Task successfully saved!",
                    error: false
                };
                
                // .send() ends the function, make sure its the last line in our function.
                response.send(message);
            }
        });
        
        console.log(newTask);
    }
});

app.post("/list", function (request, response) {

    notesModel.find({}, function(error, results) {
        checkError(error, "Successfully recieved tasks from Database.");

        if (error) {
            let responseObject = {
                list: []
            }
        
            response.send(responseObject);
        } else {
            let responseObject = {
                list: results
            };

            response.send(responseObject);
        }

    });
    
});

app.post("/getTask", function (request, response) {

    for (let i = 0; i < tasks.length; i++) {
        if (tasks[i].id === request.body.id) {

            response.send(tasks[i]);

        }
    }

    // Return error message if we don't find the object.

});

function checkError(error, successMessage) {
    if (error) {
        console.log("An error occured: " + error);
    } else {
        console.log(successMessage);
    }
}