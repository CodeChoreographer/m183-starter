const express = require("express");
const { body, validationResult } = require("express-validator");

const router = express.Router();

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
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).send(errors.array()[0].msg); // show only first error
    }

    const { username } = req.body;
    res.send(`Erfolgreiche Anmeldung für ${username}`); 
  }
);

// API-routes
const initializeAPI = (app) => {
  app.use("/api", router);
};

module.exports = { initializeAPI };
