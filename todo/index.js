const express = require("express");

const app = express();

const http = require("http").Server(app);

const port = 3000;

http.listen(port);

console.log(`Express server is running on port ${port}.`);

// Express Routes
app.use("/", express.static("public_html/"));