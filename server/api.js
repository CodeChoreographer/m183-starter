const express = require('express')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { body, validationResult } = require('express-validator')
const db = require('./database') // SQLite-Datenbank importieren

const router = express.Router()
const SALT_ROUNDS = 10
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret' // Umgebungsvariable für Sicherheit

const jwtVerify = (token) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, JWT_SECRET, (err, payload) => {
      resolve([payload, err])
    })
  })
}

// Middleware zur Token-Überprüfung (wird später für geschützte Endpunkte genutzt)
const authenticateToken = async (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'Kein Token vorhanden' })

  const [user, err] = await jwtVerify(token)
  if (err) return res.status(403).json({ error: 'Ungültiges Token' })
  req.user = user // Benutzer in die Anfrage speichern
  next()
}

const inputFormat = [
  body('username').trim().isEmail().withMessage('Ungültige E-Mail-Adresse').escape(),
  body('password').trim().isLength({ min: 10 }).withMessage('Passwort zu kurz').escape(),
]

const dbQuery = (query, params) => {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, result) => {
      resolve([result, err])
    })
  })
}

const loginRequestHandler = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg })
  }

  const { username, password } = req.body

  const query = 'SELECT * FROM users WHERE username = ?'
  const params = [username]

  const [user, err] = await dbQuery(query, params)

  if (err) {
    return res.status(500).json({ error: 'Datenbankfehler' })
  }
  if (!user) {
    return res.status(401).json({ error: 'Benutzer nicht gefunden' })
  }

  const isMatch = await bcrypt.compare(password, user.password)
  if (err || !isMatch) {
    return res.status(401).json({ error: 'Falsches Passwort' })
  }

  // JWT erzeugen mit Benutzername & Rolle
  const token = jwt.sign({ username: user.username, role: user.role }, JWT_SECRET, {
    expiresIn: '1h',
  })

  res.json({ message: 'Login erfolgreich', token })
}
// Login-Endpunkt
router.post('/login', inputFormat, loginRequestHandler)

// Geschützter Endpunkt für Beispiel-Posts
router.get('/posts', authenticateToken, (req, res) => {
  const posts = [
    { id: 1, title: 'Introduction to JavaScript', content: 'JavaScript ist eine vielseitige Sprache...' },
    { id: 2, title: 'Functional Programming', content: 'Funktionen stehen im Mittelpunkt...' },
    { id: 3, title: 'Async Programming', content: 'Asynchrone Programmierung ermöglicht...' },
  ]
  res.json(posts)
})

// API initialisieren
const initializeAPI = (app) => {
  app.use('/api', router)
}

module.exports = { initializeAPI }
=======
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

// RSA-Schlüssel aus Dateien laden
const publicKey = new NodeRSA(fs.readFileSync("public.pem", "utf8"));
const privateKey = new NodeRSA(fs.readFileSync("private.pem", "utf8"));

// Middleware zur Token-Authentifizierung
const authenticateToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "❌ Kein Token vorhanden" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err)
      return res.status(403).json({ error: "❌ Du musst eingeloggt sein" });

    req.user = user;
    next();
  });
};

// Login-Endpoint
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, user) => {
    if (err) return res.status(500).json({ error: "❌ Datenbankfehler" });
    if (!user)
      return res.status(401).json({ error: "❌ Benutzer nicht gefunden" });

    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err || !isMatch)
        return res.status(401).json({ error: "❌ Falsches Passwort" });

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: "1h" }
      );

      res.json({ message: "✅ Login erfolgreich", token });
    });
  });
});

// Endpoint: Alle Posts abrufen (Entschlüsseln)
router.get("/posts", authenticateToken, (req, res) => {
  db.all("SELECT id, title, content FROM posts", [], (err, rows) => {
    if (err)
      return res
        .status(500)
        .json({ error: "❌ Fehler beim Abrufen der Posts" });

    try {
      const decryptedPosts = rows.map((post) => {
        try {
          return {
            id: post.id,
            title: privateKey.decrypt(post.title, "utf8"),
            content: privateKey.decrypt(post.content, "utf8"),
          };
        } catch (decryptError) {
          console.error(
            "🔴 Fehler beim Entschlüsseln eines Posts:",
            decryptError.message
          );
          return {
            id: post.id,
            title: "🔒 Fehler beim Entschlüsseln",
            content: "🔒 Fehler beim Entschlüsseln",
          };
        }
      });

      res.json(decryptedPosts);
    } catch (error) {
      console.error("🔴 Fehler beim Entschlüsseln der Posts:", error.message);
      res.status(500).json({
        error: "❌ Fehler beim Entschlüsseln der Daten",
        details: error.message,
      });
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
        if (err)
          return res
            .status(500)
            .json({ error: "❌ Fehler beim Speichern des Posts" });
        res.json({
          message: "✅ Post erfolgreich erstellt",
          postId: this.lastID,
        });
      }
    );
  } catch (error) {
    console.error("🔴 Fehler beim Verschlüsseln mit RSA:", error.message);
    res.status(500).json({
      error: "❌ Fehler beim Verschlüsseln der Daten",
      details: error.message,
    });
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
    console.error(
      "🔴 Fehler beim Generieren des Schlüsselpaares:",
      error.message
    );
    res.status(500).json({
      error: "❌ Fehler beim Erzeugen der Schlüssel",
      details: error.message,
    });
  }
});

module.exports = router;
