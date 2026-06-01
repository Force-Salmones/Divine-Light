import { runtimeState } from "..";
import { persistAllPlayers } from "./persistPlayer";
import { wss, httpServer } from "../init/startServer";

export async function shutdown(reason: string) {
	if (runtimeState.shuttingDown) return;
	runtimeState.shuttingDown = true;
	console.log("Shutdown initiated:", reason);
	try {
		await persistAllPlayers();
	} catch (err) {
		console.error("Error persisting players during shutdown", err);
	}

	try {
		if (wss) {
			wss.clients.forEach((client: any) => {
				try {
					client.close();
				} catch {}
			});
			try {
				wss.close();
			} catch {}
		}
	} catch (err) {
		console.error("Error closing WebSocket server", err);
	}

	if (httpServer) {
		try {
			httpServer.close(() => {
				process.exit(0);
			});
			setTimeout(() => process.exit(0), 1000).unref();
		} catch (err) {
			console.error("Error closing HTTP server", err);
			process.exit(1);
		}
	} else {
		process.exit(0);
	}
}
