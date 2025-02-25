document.addEventListener("DOMContentLoaded", () => {
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const loginButton = document.getElementById("login");
  const logoutButton = document.createElement("button"); // Logout-Button hinzufügen
  logoutButton.textContent = "Logout";
  logoutButton.classList.add("px-4", "py-2", "bg-red-500", "rounded", "hover:bg-red-400");
  logoutButton.style.display = "none"; // Standardmässig ausblenden
  document.body.appendChild(logoutButton);

  const resultText = document.getElementById("result");

  // Eingaben gegen XSS schützen
  const sanitizeInput = (input) => {
    return input.replace(/[<>]/g, "").trim();
  };

  // JWT aus dem LocalStorage holen
  const getToken = () => localStorage.getItem("jwt");

  // Login-Funktion mit JWT-Speicherung
  const login = async (username, password) => {
    resultText.innerHTML = "";

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const result = await response.json();

      if (response.ok) {
        localStorage.setItem("jwt", result.token);
        resultText.innerHTML = "Login erfolgreich!";
        displayUserInfo();
      } else {
        resultText.innerHTML = `Fehler: ${result.error}`;
      }
    } catch (error) {
      console.error("Fehler beim Login:", error);
      resultText.innerHTML = "Serverfehler. Bitte später erneut versuchen.";
    }
  };

  // Funktion zum Abrufen und Anzeigen von Posts
  const fetchPosts = async () => {
    const token = getToken();
    if (!token) {
      alert("Bitte zuerst einloggen.");
      return;
    }

    try {
      const response = await fetch("/api/posts", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Nicht autorisiert oder Fehler beim Abruf.");
      }

      const posts = await response.json();
      resultText.innerHTML = `<h3>📜 Beiträge:</h3>`;
      posts.forEach(post => {
        resultText.innerHTML += `<p><strong>${post.title}</strong>: ${post.content}</p>`;
      });

    } catch (error) {
      console.error("Fehler beim Abrufen der Posts:", error);
      resultText.innerHTML = "Fehler beim Laden der Beiträge.";
    }
  };

  // Logout-Funktion
  const logout = () => {
    localStorage.removeItem("jwt");
    resultText.innerHTML = "Erfolgreich ausgeloggt.";
    logoutButton.style.display = "none";
    loginButton.style.display = "block";
    usernameInput.value = "";
    passwordInput.value = "";
  };

  // Nutzer-Info anzeigen, falls eingeloggt
  const displayUserInfo = () => {
    const token = getToken();
    if (!token) return;

    try {
      const decoded = JSON.parse(atob(token.split(".")[1])); // JWT Payload dekodieren
      resultText.innerHTML = `🔑 Eingeloggt als: <strong>${decoded.username}</strong> (Rolle: ${decoded.role})`;
      logoutButton.style.display = "block";
      loginButton.style.display = "none";
    } catch (error) {
      console.error("Fehler beim Decodieren des Tokens:", error);
    }
  };

  // Event Listener
  loginButton.addEventListener("click", async () => {
    const username = sanitizeInput(usernameInput.value);
    const password = sanitizeInput(passwordInput.value);
    await login(username, password);
  });

  logoutButton.addEventListener("click", logout);

  // Falls bereits ein Token existiert, Nutzer-Info anzeigen
  displayUserInfo();
});
