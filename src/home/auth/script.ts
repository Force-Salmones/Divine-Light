const loginForm = document.getElementById("loginForm") as HTMLFormElement | null;
const emailInput = document.getElementById("email") as HTMLInputElement | null;
const passwordInput = document.getElementById("password") as HTMLInputElement | null;
const logoutButton = document.getElementById("logout");

loginForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = emailInput?.value ?? "";
    const password = passwordInput?.value ?? "";

    try {
        const response = await fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });
        const result = await response.json();

        if (result.success) {
            window.location.href = "/app/";
        } else {
            alert(`Error: ${result.message}`);
        }
    } catch (error) {
        console.error("Error logging in:", error);
        alert("An error occurred while logging in. Please try again.");
    }
});

logoutButton?.addEventListener("click", async () => {
    try {
        const response = await fetch("/api/logout", { method: "POST" });
        const result = await response.json();

        if (result.success) {
            window.location.href = "/home/";
        } else {
            alert(`Error: ${result.message}`);
        }
    } catch (error) {
        console.error("Error logging out:", error);
        alert("An error occurred while logging out. Please try again.");
    }
});