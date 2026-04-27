export type ChatCommandContext = {
    playerId: string;
    args: string[];
    reply: (message: string) => void | Promise<void>;
    broadcast: (message: string) => void | Promise<void>;
};

export type ChatCommandHandler = (ctx: ChatCommandContext) => void | Promise<void>;

/**
 * Map of admin chat commands.
 * Keys are command names (without the leading "$"),
 * values are handlers that receive the playerId and arguments.
 *
 * Example: "$echo hello world" -> command "echo" with args ["hello", "world"].
 */
export const adminChatCommands: Record<string, ChatCommandHandler> = {
    // Simple example command: echoes the arguments back only to the sender
    echo: ({ args, reply }) => {
        if (!args.length) {
            void reply("Usage: $echo <message>");
        } else {
            void reply(args.join(" "));
        }
    },

    // Display supplied text only to the current player
    say: ({ args, reply }) => {
        if (!args.length) {
            void reply("Usage: $say <message>");
        } else {
            void reply(args.join(" "));
        }
    },

    // Example broadcast command: sends a system message to everyone
    announce: ({ args, broadcast }) => {
        if (!args.length) return;
        const text = args.join(" ");
        void broadcast(`[Announcement] ${text}`);
    },
};
