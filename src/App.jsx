import { useEffect, useState } from "react";
import socket from "./socket";
import Board from "./components/Board";
import "./App.css";

function App() {
  const [inputRoom, setInputRoom] = useState("");
  const [currentRoom, setCurrentRoom] = useState("");
  const [players, setPlayers] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [error, setError] = useState("");
  const [wordLength, setWordLength] = useState(3);

  useEffect(() => {
    const handleRoomCreated = ({ roomCode, wordLength }) => {
      setCurrentRoom(roomCode);
      setInputRoom(roomCode);
      setWordLength(wordLength);
      setPlayers(1);
      setGameStarted(false);
      setError("");
    };

    const handlePlayersUpdate = (count) => {
      setPlayers(count);
    };

    const handleGameStart = () => {
      setGameStarted(true);
      setError("");
    };

    const handleErrorRoom = (message) => {
      setError(message || "Could not join room");
    };

    const handleOpponentLeft = () => {
      setGameStarted(false);
      setError("The other player left the room");
    };

    socket.on("room_created", handleRoomCreated);
    socket.on("players_update", handlePlayersUpdate);
    socket.on("game_start", handleGameStart);
    socket.on("error_room", handleErrorRoom);
    socket.on("opponent_left", handleOpponentLeft);

    return () => {
      socket.off("room_created", handleRoomCreated);
      socket.off("players_update", handlePlayersUpdate);
      socket.off("game_start", handleGameStart);
      socket.off("error_room", handleErrorRoom);
      socket.off("opponent_left", handleOpponentLeft);
    };
  }, []);

  useEffect(() => {

  const handleRematchStart = () => {
    setGameStarted(false)
    setCurrentRoom("")
  }

  socket.on("rematch_start", handleRematchStart)

  return () => {
    socket.off("rematch_start", handleRematchStart)
  }

}, [])

  const createRoom = () => {
    socket.emit("create_room", wordLength);
  };

  const joinRoom = () => {
    if (!inputRoom.trim()) return;

    const code = inputRoom.toUpperCase().trim();
    setCurrentRoom(code);
    socket.emit("join_room", code);
  };

  return (
    <div className="app">
      <h1>Wordle Multiplayer</h1>

      <div className="controls">
        <button onClick={createRoom}>Create Room</button>
      </div>

      <div className="controls">
        <input
          placeholder="Room code"
          value={inputRoom}
          onChange={(e) => setInputRoom(e.target.value.toUpperCase())}
        />
        <button onClick={joinRoom}>Join Room</button>
      </div>

      <h3>Room: {currentRoom || "-"}</h3>
      <h3>Players in room: {players}</h3>

      {error && <p>{error}</p>}

      {gameStarted && wordLength && (
        <Board
          key={wordLength}
          room={currentRoom}
          players={players}
          wordLength={wordLength}
        />
      )}

      {!currentRoom && (
        <select
          onChange={(e) =>
            setWordLength(
              e.target.value === "random" ? "random" : Number(e.target.value),
            )
          }
        >
          <option value={3}>3 letters</option>
          <option value={5}>5 letters</option>
          <option value={7}>7 letters</option>
          <option value={9}>9 letters</option>
          <option value="random">Random</option>
        </select>
      )}
    </div>
  );
}

export default App;
