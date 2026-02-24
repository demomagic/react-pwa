import { useEffect, useRef, useState } from 'react';

import { Box, Button, Typography } from '@mui/material';

interface Ball {
  id: number;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  radius: number;
}

function FootballGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const ballsRef = useRef<Ball[]>([]);
  const [goalieX, setGoalieX] = useState(250);
  const requestRef = useRef<number | undefined>(undefined);
  const ballIdRef = useRef(0);

  const CANVAS_WIDTH = 500;
  const CANVAS_HEIGHT = 400;
  const GOALIE_WIDTH = 60;
  const GOALIE_HEIGHT = 80;
  const GOAL_HEIGHT = 150;

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw field
      ctx.fillStyle = '#2d5016';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw goal
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      const goalY = CANVAS_HEIGHT - GOAL_HEIGHT;
      ctx.strokeRect(150, goalY, 200, GOAL_HEIGHT);

      // Draw goalie
      ctx.fillStyle = '#ffeb3b';
      ctx.fillRect(
        goalieX - GOALIE_WIDTH / 2,
        CANVAS_HEIGHT - GOALIE_HEIGHT,
        GOALIE_WIDTH,
        GOALIE_HEIGHT,
      );

      // Draw goalie head
      ctx.fillStyle = '#ff9800';
      ctx.beginPath();
      ctx.arc(goalieX, CANVAS_HEIGHT - GOALIE_HEIGHT - 10, 15, 0, Math.PI * 2);
      ctx.fill();

      // Update and draw balls
      const updatedBalls: Ball[] = [];

      ballsRef.current.forEach((ball) => {
        // Update position
        const newX = ball.x + ball.velocityX;
        const newY = ball.y + ball.velocityY;
        const newVelocityY = ball.velocityY + 0.3; // gravity

        // Check if ball reached goal line
        if (newY + ball.radius >= CANVAS_HEIGHT) {
          // Check if goalie saved it
          const goalieLeft = goalieX - GOALIE_WIDTH / 2;
          const goalieRight = goalieX + GOALIE_WIDTH / 2;

          if (newX >= goalieLeft && newX <= goalieRight) {
            // Saved!
            setScore((s) => s + 1);
          } else if (newX >= 150 && newX <= 350) {
            // Goal scored against goalie
            setGameOver(true);
          }
          // Ball is out of bounds, don't add it back
        } else {
          // Ball still in play
          updatedBalls.push({
            ...ball,
            x: newX,
            y: newY,
            velocityY: newVelocityY,
          });

          // Draw ball
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(newX, newY, ball.radius, 0, Math.PI * 2);
          ctx.fill();

          // Draw ball pattern
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(newX, newY, ball.radius, 0, Math.PI * 2);
          ctx.stroke();

          // Pentagon pattern
          ctx.beginPath();
          for (let i = 0; i < 5; i++) {
            const angle = (i * 2 * Math.PI) / 5;
            const x = newX + ball.radius * 0.5 * Math.cos(angle);
            const y = newY + ball.radius * 0.5 * Math.sin(angle);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.stroke();
        }
      });

      ballsRef.current = updatedBalls;

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [
    gameStarted,
    gameOver,
    goalieX,
    CANVAS_WIDTH,
    CANVAS_HEIGHT,
    GOALIE_WIDTH,
    GOALIE_HEIGHT,
    GOAL_HEIGHT,
  ]);

  // Spawn balls periodically
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const spawnInterval = setInterval(() => {
      const newBall: Ball = {
        id: ballIdRef.current++,
        x: Math.random() * (CANVAS_WIDTH - 100) + 50,
        y: 20,
        velocityX: (Math.random() - 0.5) * 2,
        velocityY: Math.random() * 2 + 3,
        radius: 15,
      };
      ballsRef.current = [...ballsRef.current, newBall];
    }, 1500);

    return () => clearInterval(spawnInterval);
  }, [gameStarted, gameOver, CANVAS_WIDTH]);

  // Handle mouse movement
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!gameStarted || gameOver) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    setGoalieX(Math.max(GOALIE_WIDTH / 2, Math.min(CANVAS_WIDTH - GOALIE_WIDTH / 2, mouseX)));
  };

  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    ballsRef.current = [];
    setGoalieX(250);
    ballIdRef.current = 0;
  };

  const resetGame = () => {
    setGameStarted(false);
    setGameOver(false);
    setScore(0);
    ballsRef.current = [];
    setGoalieX(250);
    ballIdRef.current = 0;
  };

  return (
    <>
      <meta name="title" content="Football Game" />
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100%',
          padding: 2,
          gap: 2,
        }}
      >
        <Typography variant="h4" gutterBottom>
          ⚽ Goalkeeper Challenge
        </Typography>

        {!gameStarted && !gameOver && (
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Typography variant="body1" gutterBottom>
              Move your mouse to control the goalkeeper
            </Typography>
            <Typography variant="body2" gutterBottom>
              Save the balls and don't let them score!
            </Typography>
            <Button variant="contained" onClick={startGame} sx={{ mt: 2 }}>
              Start Game
            </Button>
          </Box>
        )}

        {gameStarted && !gameOver && (
          <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
            <Typography variant="h6">Score: {score}</Typography>
            <Button variant="outlined" size="small" onClick={resetGame}>
              Restart
            </Button>
          </Box>
        )}

        {gameOver && (
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Typography variant="h5" color="error" gutterBottom>
              Game Over!
            </Typography>
            <Typography variant="h6" gutterBottom>
              Final Score: {score}
            </Typography>
            <Button variant="contained" onClick={startGame} sx={{ mt: 2 }}>
              Play Again
            </Button>
          </Box>
        )}

        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onMouseMove={handleMouseMove}
          style={{
            border: '3px solid #333',
            borderRadius: '8px',
            cursor: gameStarted && !gameOver ? 'none' : 'default',
            backgroundColor: '#2d5016',
          }}
        />
      </Box>
    </>
  );
}

export default FootballGame;
