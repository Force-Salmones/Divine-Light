const server_port = envOrThrow(process.env.SERVER_PORT);

type config = {
	server_port: string;
	db_url: string;
	jwt_secret: string;
};

export const config = {
	server_port: server_port,
	db_url: envOrThrow(process.env.DB_URL),
	jwt_secret: envOrThrow(process.env.JWT_SECRET),
};

function envOrThrow(key: string | undefined): string {
	if (!key) {
		throw new Error("Invalid config file");
	}
	return key;
}
