export type UiButtonsContainer = {
	container: HTMLDivElement;
};

export function createUiButtonsContainer(
	statsButton: HTMLButtonElement,
	optionsButton: HTMLButtonElement,
	inventoryButton: HTMLButtonElement,
	equipmentButton: HTMLButtonElement,
): UiButtonsContainer {
	const container = document.createElement("div");
	container.style.position = "fixed";
	container.style.display = "flex";
	container.style.flexDirection = "column";

	container.appendChild(inventoryButton);
	container.appendChild(equipmentButton);
	container.appendChild(statsButton);
	container.appendChild(optionsButton);

	document.body.appendChild(container);

	return { container };
}
