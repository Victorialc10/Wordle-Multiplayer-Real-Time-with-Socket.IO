import { useEffect, useState } from "react";
import socket from "../socket";

const MAX_ROWS = 6;

function Board({ players, room, wordLength = 5 }) {
  const WORD_LENGTH = Number(wordLength);

  const createEmptyBoard = () =>
    Array.from({ length: MAX_ROWS }, () =>
      Array.from({ length: WORD_LENGTH }, () => ({
        letter: "",
        status: "",
      })),
    );

  const [board, setBoard] = useState(createEmptyBoard());
  const [row, setRow] = useState(0);
  const [col, setCol] = useState(0);
  const [gameStatus, setGameStatus] = useState("waiting"); // waiting | playing | won | lost
  const [locked, setLocked] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [waitingRematch, setWaitingRematch] = useState(false)

  // 🟢 activar juego cuando hay 2 players
  useEffect(() => {
    if (players === 2) {
      setGameStatus("playing");
      setLocked(false);
    } else {
      setGameStatus("waiting");
      setLocked(true);
    }
  }, [players]);

  // 🟢 escuchar eventos del servidor
  useEffect(() => {
    socket.on("guess_result", ({ guess, result }) => {
      setBoard((prev) => {
        const newBoard = prev.map((r) => r.map((c) => ({ ...c })));

        const currentRow = row; // 🔥 importante

        for (let i = 0; i < WORD_LENGTH; i++) {
          newBoard[currentRow][i] = {
            letter: guess[i],
            status: result[i],
          };
        }

        return newBoard;
      });

      setRow((prev) => prev + 1);
      setCol(0);
    });

    return () => socket.off("guess_result");
  }, [row, WORD_LENGTH]);

  useEffect(() => {
    const handleWin = () => {
      setGameStatus("won");
      setLocked(true);
      setShowModal(true);
    };

    const handleLose = () => {
      setGameStatus("lost");
      setLocked(true);
      setShowModal(true);
    };

    socket.on("you_win", handleWin);
    socket.on("you_lose", handleLose);

    return () => {
      socket.off("you_win", handleWin);
      socket.off("you_lose", handleLose);
    };
  }, []);

  useEffect(() => {
    const handleInvalid = () => {
      alert("Invalid word");
    };

    socket.on("invalid_word", handleInvalid);

    return () => {
      socket.off("invalid_word", handleInvalid);
    };
  }, []);
  useEffect(() => {
    setBoard(createEmptyBoard());
    setRow(0);
    setCol(0);
  }, [WORD_LENGTH]);
  // 🟢 teclado
  useEffect(() => {
    const handleKey = (e) => {
      if (e.target.tagName === "INPUT") return;
      if (locked) return;
      if (gameStatus !== "playing") return;

      // letras
      if (/^[a-zA-Z]$/.test(e.key)) {
        if (col >= WORD_LENGTH) return;

        setBoard((prev) => {
          const newBoard = prev.map((r) => r.map((c) => ({ ...c })));

          newBoard[row][col] = {
            letter: e.key.toUpperCase(),
            status: "",
          };

          return newBoard;
        });

        setCol((prev) => prev + 1);
      }

      // borrar
      if (e.key === "Backspace") {
        if (col <= 0) return;

        setBoard((prev) => {
          const newBoard = prev.map((r) => r.map((c) => ({ ...c })));

          newBoard[row][col - 1] = {
            letter: "",
            status: "",
          };

          return newBoard;
        });

        setCol((prev) => prev - 1);
      }

      // enter
      if (e.key === "Enter") {
        if (col !== WORD_LENGTH) return;

        const guess = board[row].map((c) => c.letter).join("");

        socket.emit("guess", {
          roomCode: room,
          guess,
        });
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [board, row, col, locked, gameStatus, WORD_LENGTH, room]);

  const handleRematch = () => {
    setWaitingRematch(true);
    socket.emit("request_rematch", { roomCode: room });
  };
  useEffect(() => {
    socket.on("rematch_start", () => {
      setShowModal(false);
      setWaitingRematch(false);

      setBoard(createEmptyBoard());
      setRow(0);
      setCol(0);
      setGameStatus("playing");
      setLocked(false);
    });

    return () => socket.off("rematch_start");
  }, []);

  return (
    <div className="board-wrapper">
      <h2 className="game-message">
        {gameStatus === "waiting" && "Waiting for another player..."}
        {gameStatus === "playing" && "Guess the word"}
        {gameStatus === "won" && "You won!"}
        {gameStatus === "lost" && "You lose!"}
      </h2>

      <div className="board">
        {board.map((r, rIndex) => (
          <div key={rIndex} className="row">
            {r.map((cell, cIndex) => (
              <div key={cIndex} className={`tile ${cell.status}`}>
                {cell.letter}
              </div>
            ))}
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>{gameStatus === "won" ? "You won 🎉" : "You lost 😢"}</h2>
            <button onClick={handleRematch} disabled={waitingRematch}>
              {waitingRematch ? "Waiting for other player..." : "Play again"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Board;
