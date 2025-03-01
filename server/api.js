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
