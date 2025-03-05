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

const scoreDisplay = document.getElementById("scoreDisplay");
const optionContainer = document.getElementById("optionContainer");


/**
 * TETROMINO setting
 */

// TETROMINO 7가지 : ["I", "O", "T", "L", "J", "S", "Z"]
const T_COLORS = ["skyblue", "yellow", "purple", "orange", "blue", "green", "red"];
const TETROMINOS = [
  [[1, 1, 1, 1]], //I
  [[1, 1], [1, 1]], //O
  [[0, 1, 0], [1, 1, 1]], //T
  [[0, 0, 1], [1, 1, 1]], //L
  [[1, 0, 0], [1, 1, 1]], //J
  [[0, 1, 1], [1, 1, 0]], //S
  [[1, 1, 0], [0, 1, 1]] //Z
];



//시작시 7종류의 블럭을 모두 한번씩 사용하는 함수
function initializeQueue() {
  let numbers = [0, 1, 2, 3, 4, 5, 6];
  numbers.sort(() => Math.random() - 0.5); // 배열을 랜덤하게 섞기
  return [...numbers]; // 새로운 큐 반환
}

// 큐 초기화
let queue = initializeQueue();


let lastTetromino = null;

/**
 * 테트로미노 생성
 */
function createTetromino() {

  let randomNum;

  // 처음 7개의 블록을 큐에서 하나씩 빼고
  if (queue.length > 0) {
    randomNum = queue.shift(); // 첫 7개 블록을 차례대로 뽑음
  } else {
    do {
      // 8번째부터는 7개 종류 중 무작위로 선택
      randomNum = Math.floor(Math.random() * TETROMINOS.length);
    } while (randomNum === lastTetromino);
  }

  lastTetromino = randomNum; //현재 블럭을 기억해서 연속된 블럭 방지


  const currentPiece = {
    shape: TETROMINOS[randomNum], //랜덤 퍼즐 선택
    color: T_COLORS[randomNum], //퍼즐 색
    row: 0,
    col: 3
  };
  return currentPiece
}

//현재 블록의 위치 표시
let board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));

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
  while (!isCollision()) {
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
  // 행렬을 시계방향 90도 회전
  const newShape = currentTetromino.shape[0].map((_, index) => currentTetromino.shape.map(row => row[index])).reverse();

  //회전 전 모양 저장 (백업) - 충돌시 원복
  const originalShape = currentTetromino.shape;
  currentTetromino.shape = newShape;

  //충돌 발생시 - 원복
  if (isCollision()) {
    currentTetromino.shape = originalShape;
  }
}


function clearLines() {
  let newBoard = board.filter(row => row.some(cell => !cell)); //0이 포함된 줄 남김
  let clearedLines = ROWS - newBoard.length; //삭제된 줄 개수 확인

  //삭제된 줄 개수만큼 상단에 새로운 빈 줄 추가
  while (newBoard.length < ROWS) {
    newBoard.unshift(Array(COLS).fill(0));
  }

  board = newBoard;

  //한번에 여러줄 삭제 - 줄 개수만큼 점수
  if (clearedLines > 0) {
    score += clearedLines * 100;
  }
}


function startGame() {
  if (!isGameRunning) {
    isGameRunning = true;
    startButton.style.display = "none"; //게임 시작하면 버튼 숨기기
    optionContainer.style.display = "none";
    scoreDisplay.style.display = "none";
    resetGame(); //게임 초기화
    gameInterval = setInterval(update, 350);
  }
}


function resetGame() {
  board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  queue = initializeQueue(); //시작 7블럭 큐 초기화
  currentTetromino = createTetromino(); //새로운 블록 생성
  score = 0; //점수 초기화
  isGameRunning = false; //게임 상태 : 정지!
  clearInterval(gameInterval); //기존 게임 루프 제거
}

function gameOver() {
  alert("Game Over!");
  document.getElementById("scoreDisplay").textContent = "Score: " + score; // 점수 표시 업데이트
  resetGame();
  startButton.style.display = "inline"; //게임 오버 후 다시 버튼 보이기
  optionContainer.style.display = "inline";
  scoreDisplay.style.display = "inline";
}


function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBoard();
    drawTetromino();
    drawScore();
    moveTetromino();
}


// 키 이벤트 처리
let lastKeyTime = 0;
const KEY_DELAY = 10; //10ms 정도의 딜레이로 입력 속도 조정

document.addEventListener("keydown", (e) => {
  const currentTime = Date.now();
  if (currentTime - lastKeyTime < KEY_DELAY) return;
  lastKeyTime = currentTime;

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
