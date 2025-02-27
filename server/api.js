const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const db = require("./database");
const fs = require("fs");
const NodeRSA = require("node-rsa");

const router = express.Router();

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

// 📌 RSA-Schlüssel aus Dateien laden
const publicKey = new NodeRSA(fs.readFileSync("public.pem", "utf8"));
const privateKey = new NodeRSA(fs.readFileSync("private.pem", "utf8"));

// 📌 Middleware zur Token-Authentifizierung
const authenticateToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "❌ Kein Token vorhanden" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "❌ Du musst eingeloggt sein" });

    req.user = user;
    next();
  });
};

// 📌 Login-Endpoint
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, user) => {
    if (err) return res.status(500).json({ error: "❌ Datenbankfehler" });
    if (!user) return res.status(401).json({ error: "❌ Benutzer nicht gefunden" });

    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err || !isMatch) return res.status(401).json({ error: "❌ Falsches Passwort" });

      const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: "1h" });

      res.json({ message: "✅ Login erfolgreich", token });
    });
  });
});

// 📌 Endpoint: Alle Posts abrufen (Entschlüsseln)
router.get("/posts", authenticateToken, (req, res) => {
  db.all("SELECT id, title, content FROM posts", [], (err, rows) => {
    if (err) return res.status(500).json({ error: "❌ Fehler beim Abrufen der Posts" });

    try {
      const decryptedPosts = rows.map(post => {
        try {
          return {
            id: post.id,
            title: privateKey.decrypt(post.title, "utf8"),
            content: privateKey.decrypt(post.content, "utf8"),
          };
        } catch (decryptError) {
          console.error("🔴 Fehler beim Entschlüsseln eines Posts:", decryptError.message);
          return { id: post.id, title: "🔒 Fehler beim Entschlüsseln", content: "🔒 Fehler beim Entschlüsseln" };
        }
      });

      res.json(decryptedPosts);
    } catch (error) {
      console.error("🔴 Fehler beim Entschlüsseln der Posts:", error.message);
      res.status(500).json({ error: "❌ Fehler beim Entschlüsseln der Daten", details: error.message });
    }
  });
});

// 📌 Endpoint: Neuen Post erstellen (Verschlüsseln)
router.post("/posts", authenticateToken, (req, res) => {
  const { title, content } = req.body;
  const userId = req.user.id;

  try {
    const encryptedTitle = publicKey.encrypt(title, "base64");
    const encryptedContent = publicKey.encrypt(content, "base64");

    db.run(
      "INSERT INTO posts (title, content, user_id) VALUES (?, ?, ?)",
      [encryptedTitle, encryptedContent, userId],
      function (err) {
        if (err) return res.status(500).json({ error: "❌ Fehler beim Speichern des Posts" });
        res.json({ message: "✅ Post erfolgreich erstellt", postId: this.lastID });
      }
    );
  } catch (error) {
    console.error("🔴 Fehler beim Verschlüsseln mit RSA:", error.message);
    res.status(500).json({ error: "❌ Fehler beim Verschlüsseln der Daten", details: error.message });
  }
});

// 📌 Endpoint: Client kann sich ein eigenes Public/Private Key-Paar generieren
router.get("/generate-keys", (req, res) => {
  try {
    const key = new NodeRSA({ b: 2048 });

    res.json({
      message: "✅ Schlüsselpaar erfolgreich generiert!",
      publicKey: key.exportKey("public"),
      privateKey: key.exportKey("private"),
    });
  } catch (error) {
    console.error("🔴 Fehler beim Generieren des Schlüsselpaares:", error.message);
    res.status(500).json({ error: "❌ Fehler beim Erzeugen der Schlüssel", details: error.message });
  }
});

module.exports = router;
