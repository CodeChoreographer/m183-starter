const NodeRSA = require("node-rsa");
const fs = require("fs");

// RSA-Schlüssel generieren (2048 Bit)
const key = new NodeRSA({ b: 2048 });

const publicKey = key.exportKey("public");
const privateKey = key.exportKey("private");

// Schlüssel in Dateien speichern
fs.writeFileSync("public.pem", publicKey);
fs.writeFileSync("private.pem", privateKey);

console.log("✅ RSA-Schlüssel erfolgreich generiert!");
console.log("🔑 Public Key gespeichert in public.pem");
console.log("🔐 Private Key gespeichert in private.pem (geheim halten!)");
