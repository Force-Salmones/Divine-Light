/**
 * Chat UI (DOM overlay).
 */

export type ChatMessage = {
	from?: string;
	text: string;
	system?: boolean;
	timestamp: number;
};

export type ChatUI = {
	container: HTMLDivElement;
	messagesDiv: HTMLDivElement;
	input: HTMLInputElement;
	append: (msg: ChatMessage) => void;
};

export type CreateChatUIOptions = {
	/** Called when the user submits a message (already trimmed, non-empty). */
	onSend: (text: string) => void;
};

/**
 * Create the chat overlay and append it to the DOM.
 */
export function createChatUI(options: CreateChatUIOptions): ChatUI {
	const messages: ChatMessage[] = [];

	const container = document.createElement("div");
	container.style.position = "fixed";
	container.style.left = "10px";
	container.style.bottom = "10px";
	container.style.width = "600px";
	container.style.maxHeight = "220px";
	container.style.display = "flex";
	container.style.flexDirection = "column";
	container.style.background = "rgba(0, 0, 0, 0.6)";
	container.style.border = "1px solid rgba(255, 255, 255, 0.25)";
	container.style.borderRadius = "4px";
	container.style.padding = "4px";
	container.style.boxSizing = "border-box";

	const messagesDiv = document.createElement("div");
	messagesDiv.style.flex = "1";
	messagesDiv.style.overflowY = "auto";
	messagesDiv.style.marginBottom = "4px";
	messagesDiv.style.fontFamily = "sans-serif";
	messagesDiv.style.fontSize = "12px";
	messagesDiv.style.color = "#ffffff";

	const input = document.createElement("input");
	input.type = "text";
	input.placeholder = "Type message...";
	input.style.width = "100%";
	input.style.boxSizing = "border-box";
	input.style.border = "1px solid rgba(255, 255, 255, 0.3)";
	input.style.borderRadius = "3px";
	input.style.padding = "2px 4px";
	input.style.background = "rgba(0, 0, 0, 0.8)";
	input.style.color = "#ffffff";
	input.style.fontFamily = "sans-serif";
	input.style.fontSize = "12px";

	input.addEventListener("keydown", (ev) => {
		if (ev.key !== "Enter") return;
		const value = input.value.trim();
		if (value) {
			options.onSend(value);
			input.value = "";
		}
		ev.preventDefault();
		ev.stopPropagation();
	});

	container.appendChild(messagesDiv);
	container.appendChild(input);
	document.body.appendChild(container);

	/**
	 * Append a message and re-render the recent window.
	 */
	function append(msg: ChatMessage) {
		messages.push(msg);
		if (messages.length > 100) messages.shift();

		messagesDiv.innerHTML = "";
		const recent = messages.slice(-30);
		for (const m of recent) {
			const line = document.createElement("div");
			line.style.fontSize = "12px";
			line.style.color = m.system ? "#ffeb3b" : "#ffffff";
			const time = new Date(m.timestamp).toLocaleTimeString([], {
				hour: "2-digit",
				minute: "2-digit",
			});
			const prefix = m.system ? "[System]" : m.from ? `[${m.from}]` : "";
			line.textContent = `${time} ${prefix} ${m.text}`.trim();
			messagesDiv.appendChild(line);
		}
		messagesDiv.scrollTop = messagesDiv.scrollHeight;
	}

	return { container, messagesDiv, input, append };
}
