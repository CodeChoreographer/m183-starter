const bcrypt = require("bcrypt");
const db = require("./server/database");

const SALT_ROUNDS = 10;

// Beispielbenutzer hinzufügen
const username = "test@example.com";
const password = "SecurePass123"; // Mindestens 10 Zeichen!

bcrypt.hash(password, SALT_ROUNDS, (err, hash) => {
  if (err) {
    console.error("Fehler beim Hashen des Passworts:", err);
    return;
  }

  db.run(
    `INSERT INTO users (username, password, role) VALUES (?, ?, ?)`,
    [username, hash, "viewer"],
    (err) => {
      if (err) {
        console.error("Fehler beim Einfügen des Benutzers:", err.message);
      } else {
        console.log(`Benutzer ${username} erfolgreich eingefügt!`);
      }
      db.close();
    }
  );
});
