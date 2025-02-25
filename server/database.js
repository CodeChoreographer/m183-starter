const sqlite3 = require("sqlite3").verbose();

// Verbindung zur SQLite-Datenbank herstellen (Datei-basierte Datenbank)
const db = new sqlite3.Database("./database.sqlite", (err) => {
  if (err) {
    console.error("Fehler beim Verbinden zur SQLite-Datenbank:", err.message);
  } else {
    console.log("Erfolgreich mit der SQLite-Datenbank verbunden.");
  }
});

// Tabelle erstellen, falls sie nicht existiert
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'viewer'
    )
  `);
});

module.exports = db;
