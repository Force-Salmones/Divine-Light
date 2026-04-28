# Divine Light

##Description

Divine Light is an html canvas + websocket based in-browser mmo.

##Motivation

I've always wanted to make a multiplayer game. After finishing my courses at freecodecamp and boot.dev, I was now able to do it. It's heavily inspired by 'Fantasy Online', a similar game that went down permanently in 2013.

##Quick Start
Create a .env file with these values:
SERVER_PORT: the port to run the server on
DB_URL: a connection string for the postgres database in this format:
```
postgresql://USERNAME:PASSWORD@localhost:5432/DBNAME?sslmode=disable
```
JWT_SECRET: Authentication string. Easily generated if you have node installed:
```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
```
bun compile
bun run dev
```
The site is now live on port SERVER_PORT.
You can register/login/logout at /home, or access the game at /app .

##Usage
Several in-game commands are available.

###Admin only

Admin commands are prefixed with '$'.

addmob: Add a persistent enemy spawn to the world.
```
addmob mobId xCoord yCoord
```

delmob: Remove a persistent enemy spawn from the world. Also instantly despawns the instance of that enemy, and removes it from the respawn queue if it is queued to respawn.
```
delmob mobId
```

shutdown: Gracefully shut the server down and write to the database one last time.
```
shutdown
```

##Contributing
If you'd like to contribute, please fork the repository and open a pull request to the `main` branch.