document.addEventListener("DOMContentLoaded", () => {
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const loginButton = document.getElementById("login");
  const logoutButton = document.createElement("button");
  logoutButton.textContent = "Logout";
  logoutButton.classList.add("px-4", "py-2", "bg-red-500", "rounded", "hover:bg-red-400");
  logoutButton.style.display = "none"; 
  document.body.appendChild(logoutButton);

  const resultText = document.getElementById("result");

  const sanitizeInput = (input) => {
    return input.replace(/[<>]/g, "").trim();
  };

  const getToken = () => localStorage.getItem("jwt");

  // Login-Funktion
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
        fetchPosts();
      } else {
        resultText.innerHTML = `Fehler: ${result.error}`;
      }
    } catch (error) {
      console.error("Fehler beim Login:", error);
      resultText.innerHTML = "Serverfehler. Bitte später erneut versuchen.";
    }
  };

  // Posts abrufen
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

  // Nutzer-Info anzeigen
  const displayUserInfo = () => {
    const token = getToken();
    if (!token) return;

    try {
      const decoded = JSON.parse(atob(token.split(".")[1])); 
      resultText.innerHTML = `🔑 Eingeloggt als: <strong>${decoded.username}</strong> (Rolle: ${decoded.role})`;
      logoutButton.style.display = "block";
      loginButton.style.display = "none";
      fetchPosts();
    } catch (error) {
      console.error("Fehler beim Decodieren des Tokens:", error);
    }
  };

  loginButton.addEventListener("click", async () => {
    const username = sanitizeInput(usernameInput.value);
    const password = sanitizeInput(passwordInput.value);
    await login(username, password);
  });

  logoutButton.addEventListener("click", logout);

  displayUserInfo();

  // Neuen Post erstellen
  const createPostButton = document.createElement("button");
  createPostButton.textContent = "Neuen Post erstellen";
  createPostButton.classList.add("px-4", "py-2", "bg-blue-500", "rounded", "hover:bg-blue-400");
  document.body.appendChild(createPostButton);

  const postTitleInput = document.createElement("input");
  postTitleInput.placeholder = "Titel";
  postTitleInput.classList.add("w-full", "p-2", "px-4", "rounded", "bg-slate-400");
  document.body.appendChild(postTitleInput);

  const postContentInput = document.createElement("textarea");
  postContentInput.placeholder = "Inhalt";
  postContentInput.classList.add("w-full", "p-2", "px-4", "rounded", "bg-slate-400");
  document.body.appendChild(postContentInput);

  createPostButton.addEventListener("click", async () => {
    const title = postTitleInput.value.trim();
    const content = postContentInput.value.trim();
    const token = getToken();

    if (!title || !content) {
      alert("Bitte Titel und Inhalt eingeben!");
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
        alert("Post erfolgreich erstellt!");
        postTitleInput.value = "";
        postContentInput.value = "";
        fetchPosts();
      } else {
        alert(`Fehler: ${result.error}`);
      }
    } catch (error) {
      console.error("Fehler beim Erstellen des Posts:", error);
      alert("Fehler beim Erstellen des Posts");
    }
  });
});
