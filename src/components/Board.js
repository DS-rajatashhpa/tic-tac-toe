import React, { useState, useEffect } from "react";
import "./Board.css";

const Board = () => {
  const [board, setBoard] = useState([["", "", ""], ["", "", ""], ["", "", ""]]);
  const [player, setPlayer] = useState("");
  const [gameStatus, setGameStatus] = useState("waiting"); // "waiting", "started", "win", "draw"
  const [currentTurn, setCurrentTurn] = useState("");
  const [ws, setWs] = useState(null);
  const [mySymbol, setMySymbol] = useState("");

  useEffect(() => {
    // Unique game ID and player ID should be determined or generated
    const gameId = "unique-game-id"; // This should be dynamically determined or generated
    const newWs = new WebSocket(`ws://127.0.0.1:8000/ws/${gameId}`);
    newWs.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log(message.status)
      switch (message.status) { // Ensure you use the correct key to distinguish message types
        case "assignSymbol":
          setMySymbol(message.symbol); // Assuming backend sends which symbol the player is
          break;
        case "start":
          setGameStatus("started");
          setCurrentTurn(message.currentTurn);
          break;
        case "continue":
          setBoard(message.board);
          setCurrentTurn(message.next_player);
          if (message.gameStatus) {
            setGameStatus(message.gameStatus); // Assuming server sends 'win' or 'draw' as gameStatus
            if (message.gameStatus === "win") {
              alert(`${message.winner} wins!`); // Assuming server sends 'winner'
            } else if (message.gameStatus === "draw") {
              alert("It's a draw!");
            }
          }
          break;
        case "win":
          setBoard(message.board);
          setGameStatus("win");
          alert(`${message.player} wins!`);
          break;
        case "draw":
          setGameStatus("draw");
          alert("It's a draw!");
          break;
        default:
          console.error("Unknown status:", message.status);
      }
    };

    newWs.onopen = () => {
      console.log("WebSocket Connected");
      setWs(newWs);
    };

    newWs.onclose = () => console.log("WebSocket Disconnected");

    return () => {
      newWs.close();
    };
  }, []);
  const handleClick = (i, j) => {
    if (gameStatus === "started" && board[i][j] === "" && currentTurn === mySymbol) {
      const updatedBoard = [...board];
      updatedBoard[i][j] = mySymbol; // Optimistically mark the square with the player's symbol
      setBoard(updatedBoard);
  
      // Now, send the move to the server
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "move", symbol: mySymbol, row: i, column: j }));
      }
    }
  };  

  const renderSquare = (i, j) => {
  return (
    <button className="square filled" onClick={() => handleClick(i, j)}> {/* Added `filled` class */}
      {board[i][j]}
    </button>
  );
};


  return (
    <div>
      <div className="status">
        {gameStatus === "waiting" && "Waiting for another player..."}
        {gameStatus === "started" && `Player ${currentTurn}'s turn`}
        {gameStatus === "win" && `${player} wins!`}
        {gameStatus === "draw" && "The game is a draw!"}
        {gameStatus === 'continue' && `${player}'s Turn`}
      </div>
      <div className="board">
        {board.map((row, i) => (
          <div key={i} className="board-row">
            {row.map((cell, j) => renderSquare(i, j))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Board;
