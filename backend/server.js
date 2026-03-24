const { getWordsByLength } = require("./dictionary");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
  },
});

const rooms = {};

function evaluateGuess(guess, secret) {
  const result = Array(secret.length).fill("absent");

  const secretArray = secret.split("");
  const guessArray = guess.split("");

  // verdes
  for (let i = 0; i < secret.length; i++) {
    if (guessArray[i] === secretArray[i]) {
      result[i] = "correct";
      secretArray[i] = null;
      guessArray[i] = null;
    }
  }

  // amarillos
  for (let i = 0; i < secret.length; i++) {
    if (!guessArray[i]) continue;

    const index = secretArray.indexOf(guessArray[i]);

    if (index !== -1) {
      result[i] = "present";
      secretArray[index] = null;
    }
  }

  return result;
}

function getRoomOfSocket(socket) {
  const joinedRooms = Array.from(socket.rooms).filter(
    (room) => room !== socket.id,
  );
  return joinedRooms[0];
}

io.on("connection", (socket) => {
  console.log("Player connected:", socket.id);

  socket.on("create_room", (wordLength) => {
    if (wordLength === "random") {
      const options = [3, 5, 7, 9];
      wordLength = options[Math.floor(Math.random() * options.length)];
    }

    const roomCode = Math.random().toString(36).substring(2, 6).toUpperCase();

    const words = getWordsByLength(wordLength);

    const secretWord = words[Math.floor(Math.random() * words.length)];

    console.log(`ROOM ${roomCode} → WORD: ${secretWord}`);

    rooms[roomCode] = {
      players: [socket.id],
      secret: secretWord,
      length: wordLength,
      rematch: [],
    };

    socket.join(roomCode);

    socket.emit("room_created", {
      roomCode,
      wordLength,
    });
  });

  socket.on("join_room", (roomCodeRaw) => {
    const roomCode = roomCodeRaw?.toUpperCase().trim();

    if (!roomCode || !rooms[roomCode]) {
      socket.emit("error_room", "Room does not exist");
      return;
    }

    if (rooms[roomCode].players.includes(socket.id)) {
      socket.emit("players_update", rooms[roomCode].players.length);
      return;
    }

    if (rooms[roomCode].players.length >= 2) {
      socket.emit("error_room", "Room is full");
      return;
    }

    rooms[roomCode].players.push(socket.id);
    socket.join(roomCode);

    io.to(roomCode).emit("players_update", rooms[roomCode].players.length);
    io.to(roomCode).emit("game_start");
  });

  socket.on("player_won", () => {
    const joinedRooms = Array.from(socket.rooms).filter(
      (room) => room !== socket.id,
    );

    const room = joinedRooms[0];

    if (!room) return;

    socket.to(room).emit("player_won");
  });

  socket.on("disconnect", () => {
    console.log("Player disconnected:", socket.id);

    for (const roomCode of Object.keys(rooms)) {
      if (rooms[roomCode].players.includes(socket.id)) {
        rooms[roomCode].players = rooms[roomCode].players.filter(
          (id) => id !== socket.id,
        );
        rooms[roomCode].rematch = [];
        io.to(roomCode).emit("players_update", rooms[roomCode].players.length);
        io.to(roomCode).emit("opponent_left");

        if (rooms[roomCode].players.length === 0) {
          delete rooms[roomCode];
        }
      }
    }
  });

  socket.on("guess", ({ roomCode, guess }) => {
    const room = rooms[roomCode];

    if (!room) return;

    guess = guess.toUpperCase();

    const validWords = getWordsByLength(room.length);

    if (!validWords.includes(guess)) {
      socket.emit("invalid_word");
      return;
    }

    const result = evaluateGuess(guess, room.secret);

    socket.emit("guess_result", {
      guess,
      result,
    });

    if (guess === room.secret) {
      socket.emit("you_win");
      socket.to(roomCode).emit("you_lose");
    }
  });

  socket.on("request_rematch", ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room) return;

    if (!room.rematch.includes(socket.id)) {
      room.rematch.push(socket.id);
    }

    // si los 2 jugadores han aceptado
    if (room.rematch.length === room.players.length) {
      const words = getWordsByLength(room.length);
      room.secret = words[Math.floor(Math.random() * words.length)];

      console.log(`NEW WORD (${roomCode}): ${room.secret}`);
      
      room.rematch = [];

      io.to(roomCode).emit("rematch_start");
    }
  });
});

server.listen(3001, () => {
  console.log("Server running on port 3001");
});
