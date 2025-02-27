document.addEventListener("DOMContentLoaded", () => {
  localStorage.removeItem("jwt"); // Token löschen, damit immer ein neuer Login nötig ist

  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const loginButton = document.getElementById("login");
  const resultText = document.getElementById("result");

  // Logout-Button (anfangs versteckt)
  const logoutButton = document.createElement("button");
  logoutButton.textContent = "Logout";
  logoutButton.classList.add("px-4", "py-2", "bg-red-500", "rounded", "hover:bg-red-400");
  logoutButton.style.display = "none";
  document.body.appendChild(logoutButton);

  // Post erstellen - Button (anfangs versteckt)
  const createPostButton = document.createElement("button");
  createPostButton.textContent = "Neuen Post erstellen";
  createPostButton.classList.add("px-4", "py-2", "bg-blue-500", "rounded", "hover:bg-blue-400");
  createPostButton.style.display = "none"; 
  document.body.appendChild(createPostButton);

  // Eingabefelder für den Post (anfangs versteckt)
  const postTitleInput = document.createElement("input");
  postTitleInput.placeholder = "Titel";
  postTitleInput.classList.add("w-full", "p-2", "px-4", "rounded", "bg-slate-400");
  postTitleInput.style.display = "none"; 
  document.body.appendChild(postTitleInput);

  const postContentInput = document.createElement("textarea");
  postContentInput.placeholder = "Inhalt";
  postContentInput.classList.add("w-full", "p-2", "px-4", "rounded", "bg-slate-400");
  postContentInput.style.display = "none";
  document.body.appendChild(postContentInput);

  // Container für die Beiträge (anfangs leer)
  const postsContainer = document.createElement("div");
  postsContainer.id = "postsContainer";
  document.body.appendChild(postsContainer);

  // Funktion: Posts abrufen & anzeigen
  const fetchPosts = async () => {
    const token = localStorage.getItem("jwt");
    if (!token) {
      postsContainer.innerHTML = ""; // Falls kein Token vorhanden, leeren
      return;
    }

    try {
      const response = await fetch("/api/posts", {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Nicht autorisiert oder Fehler beim Abruf.");
      }

      const posts = await response.json();
      postsContainer.innerHTML = `<h3>📜 Beiträge:</h3>`;

      posts.forEach(post => {
        postsContainer.innerHTML += `<p><strong>${post.title}</strong>: ${post.content}</p>`;
      });

    } catch (error) {
      console.error("Fehler beim Abrufen der Posts:", error);
      postsContainer.innerHTML = "❌ Fehler beim Laden der Beiträge.";
    }
  };

  // Funktion: Zeigt Buttons & lädt Posts nur bei gültigem Token
  const displayUserInfo = () => {
    const token = localStorage.getItem("jwt");
    if (!token) {
      createPostButton.style.display = "none";
      postTitleInput.style.display = "none";
      postContentInput.style.display = "none";
      postsContainer.innerHTML = ""; 
      return;
    }

    try {
      const decoded = JSON.parse(atob(token.split(".")[1]));
      resultText.innerHTML = `🔑 Eingeloggt als: <strong>${decoded.username}</strong> (Rolle: ${decoded.role})`;
      
      logoutButton.style.display = "block";
      loginButton.style.display = "none";

      createPostButton.style.display = "block";
      postTitleInput.style.display = "block";
      postContentInput.style.display = "block";

      fetchPosts(); // Nach erfolgreichem Login Beiträge abrufen

    } catch (error) {
      console.error("Fehler beim Decodieren des Tokens:", error);
    }
  };

  // Login-Funktion
  const login = async (username, password) => {
    resultText.innerHTML = "";

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const result = await response.json();

      if (response.ok) {
        localStorage.setItem("jwt", result.token);
        resultText.innerHTML = "✅ Login erfolgreich!";
        displayUserInfo();
      } else {
        resultText.innerHTML = `❌ Fehler: ${result.error}`;
      }
    } catch (error) {
      console.error("Fehler beim Login:", error);
      resultText.innerHTML = "❌ Serverfehler. Bitte später erneut versuchen.";
    }
  };

  // Logout-Funktion
  const logout = () => {
    localStorage.removeItem("jwt");
    resultText.innerHTML = "✅ Erfolgreich ausgeloggt.";
    
    logoutButton.style.display = "none";
    loginButton.style.display = "block";

    createPostButton.style.display = "none";
    postTitleInput.style.display = "none";
    postContentInput.style.display = "none";

    postsContainer.innerHTML = ""; // Beiträge verbergen nach Logout
  };

  // Neuen Post erstellen
  createPostButton.addEventListener("click", async () => {
    const title = postTitleInput.value.trim();
    const content = postContentInput.value.trim();
    const token = localStorage.getItem("jwt");

    if (!title || !content) {
      alert("❌ Bitte Titel und Inhalt eingeben!");
      return;
    }

    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ title, content }),
      });

      const result = await response.json();

      if (response.ok) {
        alert("✅ Post erfolgreich erstellt!");
        postTitleInput.value = "";
        postContentInput.value = "";
        fetchPosts(); // ✅ Nach dem Erstellen sofort aktualisieren
      } else {
        alert(`❌ Fehler: ${result.error}`);
      }
    } catch (error) {
      console.error("Fehler beim Erstellen des Posts:", error);
      alert("❌ Fehler beim Erstellen des Posts");
    }
  });

  // Benutzerinfo beim Laden der Seite überprüfen
  displayUserInfo();

  loginButton.addEventListener("click", async () => {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    await login(username, password);
  });

  logoutButton.addEventListener("click", logout);
});
