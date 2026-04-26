const gameButton = document.getElementById("gameButton") as HTMLButtonElement;

function goToGame() {
    window.location.href = "../app/";
}

gameButton.addEventListener("click", goToGame);