const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const req = require("express/lib/request");
const md5 = require("md5");
const credentials = require("./credentials.js");
const session = require("express-session");

// Express setup.
const app = express();
const http = require("http").Server(app);
const port = 3000;
http.listen(port);
console.log(`Express server is running on port ${port}.`);

// Use body-parser to convert our front-end data into JavaScript Objects.
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

// Session Setup
app.use(session({
    secret: "keyboard dog",
    resave: false,
    saveUninitialized: true,
    //cookie: { secure: true } CANNOT be shared between methods (very likely "private" variable)
}));

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
    owner: String,
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

let usersStructure = {
    username: String,
    password: String,
    email: String,
    salt: String,
};

let userSchema = new mongoose.Schema(usersStructure);
let usersModel = new mongoose.model("users", userSchema);


// Express Routes
app.use("/", express.static("public_html/"));

// POST Handlers
app.post("/userSession", function (request, response) {

    const userDetails = request.body;

    if (userDetails.type === "login") {

        const userQuery = {
            username: userDetails.username,
            password: md5(userDetails.password)
        }

        usersModel.find(userQuery, function (error, results) {

            console.log(results);
            if (results.length === 1) {
                request.session.username = userDetails.username;
                request.session.loggedIn = true;
                request.session.dbId = results[0]._id.toString()
            
                response.send({
                    username: userDetails.username,
                    message: ""
                });
            } else {
                response.send({
                    username: null,
                    message: "Sorry, but username or password is wrong. Try again."
                });
            }  
        })
    } else if (userDetails.type === "logout") {
        request.session.loggedIn = false;
        request.session.destroy();

        response.send({});
    } else if (userDetails.type === "continue") {

        if (request.session.loggedIn === true) {
            response.send({username: request.session.username, message: ""});
        } else {
            response.send({message: null});
        }
    }

});

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

        console.log(session);

        newTask.owner = request.session.dbId.toString();

        console.log(newTask);

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

    console.log(request.session.dbId);

    notesModel.find({owner: request.session.dbId}, function(error, results) {
        checkError(error, "Successfully recieved tasks from Database.");

        if (error) {
            let responseObject = {
                list: []
            }
        
            response.send(responseObject);
        } else {

            console.log(results);
            let responseObject = {
                list: results
            };

            response.send(responseObject);
        }

    });
    
});

app.post("/getTask", function (request, response) {

    notesModel.find({owner: request.session.dbId, _id: request.body.id}, function (error, results) {
        checkError(error, "Successfully searched documents.");

        response.send(results[0]);
    });

    // for (let i = 0; i < tasks.length; i++) {
    //     if (tasks[i].id === request.body.id) {

    //         response.send(tasks[i]);

    //     }
    // }

    // Return error message if we don't find the object.

});

app.post("/deleteTask", function (request, response) {
    notesModel.findByIdAndRemove({owner: request.session.dbId, _id: request.body._id}, function(error, results) {
        checkError(error, "Successfully searched documents.");

        const objectToSend = {
            success: true,
            oldCopy: results
        };

        response.send(objectToSend);
    });
});

app.post("/completeTask", function (request, response) {

    let taskId = request.body._id;

    notesModel.findByIdAndUpdate({owner: request.session.dbId, _id: taskId}, {completed: "true"}, function (error, results) {
        checkError(error, "Successfully updated a document");

        if (error) {
            response.send({success: false});
        } else {
            response.send({success: true});
        }
    });

});

app.post("/updateTask", function (request, response) {
    let taskId = request.body._id;

    // We could delete _id in request object, but may be more confusing.
    let updates = {
        notes: request.body.notes,
        description: request.body.description,
        priority: request.body.priority
    }

    notesModel.findByIdAndUpdate({owner: request.session.dbId, _id: taskId}, updates, function (error, results) {
        checkError(error, "Successfully updated a document");
        
        if (error) {
            response.send({success: false});
        } else {
            response.send({success: true});
        }
    });
});

function checkError(error, successMessage) {
    if (error) {
        console.log("An error occured: " + error);
    } else {
        console.log(successMessage);
    }
}