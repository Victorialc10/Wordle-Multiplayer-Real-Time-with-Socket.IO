# Wordle Multiplayer (Real-Time)

A real-time multiplayer version of the classic Wordle game where two players compete simultaneously in the same room.

Built with **React (frontend)** and **Node.js + Socket.IO (backend)** to handle real-time communication and game synchronization.

---

## 🚀 Features

-  Create or join private rooms
-  Real-time 1v1 gameplay
-  Keyboard input handling (like Wordle)
-  Server-side word validation (only real English words allowed)
-  Rematch system (both players must accept)
-  Dynamic word length (3, 5, 7, 9 or random)
-  Proper Wordle logic (handles duplicate letters correctly)
-  Instant feedback via WebSockets

---

## 🧱 Tech Stack

### Frontend
- React (Vite)
- JavaScript (ES6)
- CSS

### Backend
- Node.js
- Express
- Socket.IO

---

## 🔌 How It Works

### Real-Time Communication

The game uses **Socket.IO** to synchronize both players:

- `create_room` → creates a room with a random word
- `join_room` → second player joins
- `game_start` → both players begin simultaneously
- `guess` → player sends a word
- `guess_result` → server validates and returns result
- `you_win / you_lose` → end of game events
- `request_rematch` → player requests new round
- `rematch_start` → both players restart with a new word

---

### Game Logic

- The **server** generates the secret word and validates guesses
- The **client** handles UI and input
- Word validation uses a dictionary (`word-list` package)
- Duplicate letters are handled correctly (Wordle rules)

---

## 🖥️ Installation & Run

### 1. Clone the repository

```bash
git clone https://github.com/your-username/wordle-multiplayer.git
cd wordle-multiplayer

### 2. Install dependencies

npm install
cd backend
npm install

### 3. Run the project

node server.js (cd backend)

npm run dev

### 4. Open in browser

http://localhost:5173


