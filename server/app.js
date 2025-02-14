const express = require("express");
const http = require("http");
const rateLimit = require("express-rate-limit");
const dotenv = require("dotenv");
const { initializeAPI } = require("./api");

dotenv.config();

// port from env or standard port
const serverPort = process.env.PORT || 3000;

const app = express();
app.use(express.json());
const server = http.createServer(app);

const limiter = rateLimit({
  windowMs: 60 * 1000, 
  max: 50, 
  message: "Zu viele Anfragen. Bitte warte eine Minute, bevor du es erneut versuchst.",
  standardHeaders: true,
  legacyHeaders: false,
});

// rate limit on all api
app.use("/api", limiter);

app.use(express.static("client"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/client/index.html");
});

initializeAPI(app);

server.listen(serverPort, () => {
  console.log(`Express Server gestartet auf Port ${serverPort}`);
});
