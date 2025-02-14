document.addEventListener("DOMContentLoaded", () => {
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const loginButton = document.getElementById("login");
  const bruteForceButton = document.getElementById("bruteForce");
  const resultText = document.getElementById("result");

  // function for escaping and sanitizing
  const sanitizeInput = (input) => {
    return input.replace(/[<>]/g, "").trim(); // remove <, > and space (XSS protection)
  };

  const login = async (username, password) => {
    // resultText.innerHTML = "";  always delete the last error message

    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    const result = await response.text();
    resultText.insertAdjacentHTML("afterbegin", result);
  };

  loginButton.addEventListener("click", async () => {
    const username = sanitizeInput(usernameInput.value);
    const password = sanitizeInput(passwordInput.value);
    await login(username, password);
  });

  bruteForceButton.addEventListener("click", async () => {
    const username = sanitizeInput(usernameInput.value);
    const password = sanitizeInput(passwordInput.value);

    while (true) {
      await login(username, password);
    }
  });
});
