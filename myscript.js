const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;

//map size
canvas.width = COLS * BLOCK_SIZE;
canvas.height = ROWS * BLOCK_SIZE;

//'score' val
let score = 0;

//'game status'
let isGameRunning = false;
let gameInterval;

const startButton = document.getElementById("startButton");
startButton.addEventListener("click", startGame);



// ["I", "O", "T", "L", "J", "S", "Z"]
const T_COLORS = ["skyblue", "yellow", "purple", "orange", "blue", "green", "red"];

//퍼즐 종류 : 7가지
const TETROMINOS = [
  [[1, 1, 1, 1]], //I
  [[1, 1], [1, 1]], //O
  [[0, 1, 0], [1, 1, 1]], //T
  [[0, 0, 1], [1, 1, 1]], //L
  [[1, 0, 0], [1, 1, 1]], //J
  [[0, 1, 1], [1, 1, 0]], //S
  [[1, 1, 0], [0, 1, 1]] //Z
];


let currentTetromino = createTetromino();
//현재 블록의 위치 표시
let board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));

function createTetromino() {
  const randomNum = Math.floor(Math.random() * TETROMINOS.length);
  const currentPiece = {
    shape: TETROMINOS[randomNum], //랜덤 퍼즐 선택
    color: T_COLORS[randomNum], //퍼즐 색
    row: 0,
    col: 3
  }
  return currentPiece
}


//보드 그리기
function drawBoard() {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (board[row][col]) {
        ctx.fillStyle = board[row][col];
        ctx.fillRect(col * BLOCK_SIZE, row * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        ctx.strokeRect(col * BLOCK_SIZE, row * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE); // 경계선 그리기
      }
    }
  }
}

//현재 테트리미노 그리기
function drawTetromino() {
  const shape = currentTetromino.shape;
  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col]) {
        ctx.fillStyle = currentTetromino.color;
        ctx.fillRect((currentTetromino.col + col) * BLOCK_SIZE, (currentTetromino.row + row) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        ctx.strokeRect((currentTetromino.col + col) * BLOCK_SIZE, (currentTetromino.row + row) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE); // 경계선 그리기
      }
    }
  }
}


//점수 표시 함수
function drawScore() {
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText("Score: " + score, 10, 20);
}


//자동 테트리미노 하강
function moveTetromino() {
  currentTetromino.row++;
  if (isCollision()) {
    currentTetromino.row--; // 충돌하면 원위치
    placeTetromino();
    currentTetromino = createTetromino();
    if (isCollision()) {
      // 게임 오버
      gameOver();
    }
  }
}


function hardDrop() {
  //충돌이 발생하지 않을때 까지 계속 하강
  while(!isCollision()) {
    currentTetromino.row++;
  }

  currentTetromino.row--;
  placeTetromino();
  score += 30; //하드 드롭시 30점 추가
  currentTetromino = createTetromino();

  //블록이 생성되자 마자 충돌하면 게임 오버
  if (isCollision()) {
    gameOver();
  }
}


//충돌 여부 확인
function isCollision() {
  const shape = currentTetromino.shape;
  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col]) {
        const boardX = currentTetromino.col + col;
        const boardY = currentTetromino.row + row;
        if (boardY >= ROWS || boardX < 0 || boardX >= COLS || board[boardY][boardX]) {
          return true;
        }
      }
    }
  }
  return false;
}

//테트리미노 고정
function placeTetromino() {
  const shape = currentTetromino.shape;
  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col]) {
        board[currentTetromino.row + row][currentTetromino.col + col] = currentTetromino.color;
      }
    }
  }

  clearLines(); //한 줄이 채워졌다면 삭제
}

//테트리미노 회전
function rotateTetromino() {
  const newShape = currentTetromino.shape[0].map((_, index) => currentTetromino.shape.map(row => row[index])).reverse();
  const originalShape = currentTetromino.shape;
  currentTetromino.shape = newShape;
  if (isCollision()) {
    currentTetromino.shape = originalShape;
  }
}

//다 채워진 줄 삭제 검사
function clearLines() {
  for (let row = ROWS - 1; row >= 0; row--) {
    //한 행에 모든칸이 채워져 있으면
    if (board[row].every(cell => cell)) { //cell이 0인지 검사
      board.splice(row, 1); //해당 줄 삭제
      board.unshift(Array(COLS).fill(0)); //맨 위에 새로운 빈 줄 추가 

      score += 100; //점수 추가
    }
  }
}


function startGame() {
  if (!isGameRunning) {
    isGameRunning = true;
    startButton.style.display = "none"; //게임 시작하면 버튼 숨기기
    resetGame(); //게임 초기화
    gameInterval = setInterval(update, 500);
  }
}


function resetGame() {
  board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  currentTetromino = createTetromino(); //새로운 블록 생성
  score = 0; //점수 초기화
  
  isGameRunning = false; //게임 상태 : 정지!
  clearInterval(gameInterval); //기존 게임 루프 제거
}

function gameOver() {
  alert("Game Over!");
  resetGame();
  startButton.style.display = "inline"; //게임 오버 후 다시 버튼 보이기
}


function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBoard();
  drawTetromino();
  drawScore();
  moveTetromino();
}

// 키 이벤트 처리
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") {
    currentTetromino.col--; //좌측 이동 - ←
    if (isCollision()) currentTetromino.col++;
  } else if (e.key === "ArrowRight") {
    currentTetromino.col++; //우측 이동 - →
    if (isCollision()) currentTetromino.col--;
  } else if (e.key === "ArrowDown") {
    moveTetromino(); //하강 - ↓
    score += 1; // 아래 방향키 누를때 마다 점수 증가가
  } else if (e.key === "ArrowUp" || e.key === "z") {
    rotateTetromino(); //회전 - ↑ , 'z'
  } else if (e.key === " ") {
    hardDrop(); //즉시 하강 (Hard Drop) - space bar
  }
});