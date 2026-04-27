const signupForm = document.querySelector("form") as HTMLFormElement;

signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(signupForm);
    const name = formData.get("username") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
        const response = await fetch("/api/create-user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password })
        });
        const result = await response.json();

        if (result.success) {
            alert("Account created successfully! You can now log in.");
            signupForm.reset();
        } else {
            alert(`Error: ${result.message}`);
        }
    } catch (error) {
        console.error("Error creating user:", error);
        alert("An error occurred while creating your account. Please try again.");
    }
});