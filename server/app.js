const express = require("express");
const http = require("http");
const rateLimit = require("express-rate-limit");
const dotenv = require("dotenv");

dotenv.config(); // .env einlesen


const app = express(); // App wird  initialisiert
const app = express(); // App wird  initialisiert
const server = http.createServer(app);

const apiRouter = require("./api"); // API-Router importieren

app.use(express.json());

// Rate Limiting
const apiRouter = require("./api"); // API-Router importieren

app.use(express.json());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 60 * 1000, 
  max: 50, 
  message: "Zu viele Anfragen. Bitte warte eine Minute, bevor du es erneut versuchst.",
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api", limiter);
app.use("/api", apiRouter); // API-Router registrieren
app.use("/api", apiRouter); // API-Router registrieren

app.use(express.static("client"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/client/index.html");
});

const serverPort = process.env.PORT || 3000;
const serverPort = process.env.PORT || 3000;

server.listen(serverPort, () => {
  console.log(`🚀 Express Server gestartet auf Port ${serverPort}`);
  console.log(`🚀 Express Server gestartet auf Port ${serverPort}`);
});
