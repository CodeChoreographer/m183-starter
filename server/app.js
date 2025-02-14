const express = require("express");
const http = require("http");
const rateLimit = require("express-rate-limit");
const { initializeAPI } = require("./api");

// Create the express server
const app = express();
app.use(express.json());
const server = http.createServer(app);

const limiter = rateLimit({
  windowMs: 60 * 1000, 
  max: 50, 
  message: "Zu viele Anfragen. Bitte warte eine Minute, bevor du es erneut versuchst.",
  standardHeaders: true, // sends rate limit header
  legacyHeaders: false, // no older headers
});

// use an all api routes
app.use("/api", limiter);

// deliver static files from the client folder like css, js, images
app.use(express.static("client"));
// route for the homepage
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/client/index.html");
});

// Initialize the REST api
initializeAPI(app);

//start the web server
const serverPort = 3000;
server.listen(serverPort, () => {
  console.log(`Express Server started on port ${serverPort}`);
});
