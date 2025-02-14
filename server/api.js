const express = require("express");
const bcrypt =require("bcrypt");
const { body, validationResult } = require("express-validator");

const router = express.Router();
const SALT_ROUNDS = 10;

// Login validation
router.post(
  "/login",
  [
    body("username")
      .trim()
      .isEmail().withMessage("Username muss eine gültige E-Mail sein")
      .escape(),

    body("password")
      .trim()
      .isLength({ min: 10 }).withMessage("Passwort muss mindestens 10 Zeichen lang sein")
      .escape()
      .matches(/^[a-zA-Z0-9!@#$%^&*()_+-=]+$/).withMessage("Passwort enthält ungültige Zeichen"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).send(errors.array()[0].msg); // show only first error
    }

    const { username, password } = req.body;
    try {
      // password hashing
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      res.send(`Erfolgreiche Anmeldung für ${username} mit sicherem Passwort-Hash.`);
      console.log(`Passwort-Hash für ${username}: ${hashedPassword}`);
    } catch (error) {
      console.error("Fehler beim Hashen des Passworts:", error);
      res.status(500).send("Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.");
    }
  }
);

// API-routes
const initializeAPI = (app) => {
  app.use("/api", router);
};

module.exports = { initializeAPI };
