export type LoadingScreenUI = {
	container: HTMLDivElement;
	setText: (text: string) => void;
	show: () => void;
	hide: () => void;
};

export function createLoadingScreenUI(
	initialText = "Loading...",
): LoadingScreenUI {
	const container = document.createElement("div");
	container.style.position = "fixed";
	container.style.left = "0";
	container.style.top = "0";
	container.style.width = "100%";
	container.style.height = "100%";
	container.style.display = "flex";
	container.style.alignItems = "center";
	container.style.justifyContent = "center";
	container.style.background = "rgba(0, 0, 0, 0.95)";
	container.style.color = "white";
	container.style.fontFamily = "sans-serif";
	container.style.fontSize = "16px";
	container.style.zIndex = "9999";

	const textEl = document.createElement("div");
	textEl.textContent = initialText;

	container.appendChild(textEl);
	document.body.appendChild(container);

	function setText(text: string) {
		textEl.textContent = text;
	}

	function show() {
		container.style.display = "flex";
	}

	function hide() {
		container.style.display = "none";
	}

	return { container, setText, show, hide };
}
