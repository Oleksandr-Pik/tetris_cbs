import { Image } from './components/image.js';

import {
  PLAYFIELD_COLUMNS,
  PLAYFIELD_ROWS,
  NEXT_TETRO_COLUMNS,
  NEXT_TETRO_ROWS,
  TETROMINO_NAMES,
  TETROMINOES,
  gameOverBlock,
  pauseBlock,
  btnResatrt,
  btnReset,
  btnPause,
  btnContinue,
  btnRotate,
  btnLeft,
  btnDown,
  btnRight,
  btnDropDown,
} from './utils.js';

const startAudio = new Audio('./sounds/startGame.mp3');
const gameOverAudio = new Audio('./sounds/gameOver.mp3');
const rotateAudio = new Audio('./sounds/rotate.mp3');
const moveAudio = new Audio('./sounds/move.mp3');
const moveDownAudio = new Audio('./sounds/moveDown.mp3');
const putAudio = new Audio('./sounds/put.mp3');
const magicAudio = new Audio('./sounds/magic.mp3');
const pauseAudio = new Audio('./sounds/pause.mp3');
const deleteAudio = new Audio('./sounds/delete.mp3');

// Змінна кнопок та панелі гучності.
const decreBtn = document.querySelector('.decre');
const increBtn = document.querySelector('.incre');
const volumePanel = document.querySelector('.volume');

// Слухач події клік кнопки зменшити рівень гучності.
decreBtn.addEventListener('click', e => {
  if (!e.target.disabled) {
    volumeDecrease();
    renderVolume();
    rotateAudio.volume = audioVolume / 10;
    rotateAudio.play();
  } else e.preventDefault();
});

// Слухач події клік кнопки збільшити рівень гучності.
increBtn.addEventListener('click', e => {
  if (!e.target.disabled) {
    volumeIncrease();
    renderVolume();
    rotateAudio.volume = audioVolume / 10;
    rotateAudio.play();
  } else e.preventDefault();
});

let playfield,
  nexTetroField,
  tetromino,
  nextTetromino,
  intervalId,
  requestId,
  cells,
  cellsNext,
  score,
  highScore,
  speed = 1,
  speedInterval = 900,
  audioVolume = 1,
  isPaused = false,
  isGameOver = false;

document.addEventListener('contextmenu', e => {
  e.preventDefault();
});

document.addEventListener('keydown', e => {
  if (e.key === ' ') {
    e.preventDefault();
  }
});

// startAudio.play();

renderVolume();

initGame();

function initGame() {
  startAudio.volume = audioVolume / 10;
  startAudio.play(false);
  gameOverBlock.style.display = 'none';
  isGameOver = false;
  isPaused = false;
  speed = 1;
  stopLoop();
  generatePlayfield();
  generateTetromino(true);
  generateNextField();

  cells = document.querySelectorAll('.tetris div');
  cellsNext = document.querySelectorAll('.nextTetro div');
  score = 0;
  highScore = localStorage.getItem('highScore') || 0;
  updateScore();
  drawTetrominoNext();
  startLoop();
}

// Keydown events

document.addEventListener('keydown', onKeyDown);
btnResatrt.addEventListener('click', () => initGame());
btnReset.addEventListener('click', () => initGame());
btnPause.addEventListener('click', () => togglePauseGame());
btnContinue.addEventListener('click', () => togglePauseGame());

btnRotate.addEventListener('click', () => rotateTetromino());
btnLeft.addEventListener('click', () => moveTetrominoLeft());
btnDown.addEventListener('click', () => moveTetrominoDown());
btnRight.addEventListener('click', () => moveTetrominoRight());
btnDropDown.addEventListener('click', () => dropTetrominoDown());

function togglePauseGame() {
  isPaused = !isPaused;
  pauseAudio.volume = audioVolume / 10;
  pauseAudio.play();

  if (isPaused) {
    stopLoop();
    pauseBlock.style.display = 'flex';
  } else {
    startLoop();
    pauseBlock.style.display = 'none';
  }
}

function onKeyDown(evepnt) {
  if (event.code == 'KeyP') {
    togglePauseGame();
  }
  if (isPaused) {
    return;
  }
  switch (event.code) {
    case 'Space':
      // putAudio.volume = audioVolume / 10;
      // putAudio.play();
      dropTetrominoDown();
      break;
    case 'ArrowUp':
      rotateAudio.volume = audioVolume / 10;
      rotateAudio.play();
      rotateTetromino();
      break;
    case 'ArrowDown':
      moveAudio.volume = audioVolume / 10;
      moveAudio.play();
      moveTetrominoDown();
      break;
    case 'ArrowLeft':
      moveAudio.volume = audioVolume / 10;
      moveAudio.play();
      moveTetrominoLeft();
      break;
    case 'ArrowRight':
      moveAudio.volume = audioVolume / 10;
      moveAudio.play();
      moveTetrominoRight();
      break;
  }
  draw();
}

function moveTetrominoDown() {
  tetromino.row += 1;
  moveDownAudio.volume = audioVolume / 10;
  moveDownAudio.play();
  if (isValid()) {
    tetromino.row -= 1;
    placeTetromino();
  }
}

function moveTetrominoLeft() {
  tetromino.column -= 1;
  if (isValid()) {
    tetromino.column += 1;
  } else {
    calculateGhostPosition();
  }
}

function moveTetrominoRight() {
  tetromino.column += 1;
  if (isValid()) {
    tetromino.column -= 1;
  } else {
    calculateGhostPosition();
  }
}

function dropTetrominoDown() {
  putAudio.volume = audioVolume / 10;
  putAudio.play();
  while (!isValid()) {
    tetromino.row++;
  }
  tetromino.row--;
}

// Functions generate playfilds and tetromino

function generatePlayfield() {
  document.querySelector('.tetris').innerHTML = '';
  for (let i = 0; i < PLAYFIELD_ROWS * PLAYFIELD_COLUMNS; i++) {
    const div = document.createElement('div');
    document.querySelector('.tetris').append(div);
  }

  playfield = new Array(PLAYFIELD_ROWS)
    .fill()
    .map(() => new Array(PLAYFIELD_COLUMNS).fill(0));
}

function generateNextField() {
  document.querySelector('.nextTetro').innerHTML = '';
  for (let i = 0; i < NEXT_TETRO_COLUMNS * NEXT_TETRO_ROWS; i++) {
    const div = document.createElement('div');
    document.querySelector('.nextTetro').append(div);
  }

  nexTetroField = new Array(NEXT_TETRO_ROWS)
    .fill()
    .map(() => new Array(NEXT_TETRO_COLUMNS).fill(0));
}

function generateTetromino(isFirst) {
  const nameTetro = getRandomElement(TETROMINO_NAMES);
  const matrixTetro = TETROMINOES[nameTetro];

  const nameNextTetro = getRandomElement(TETROMINO_NAMES);
  const matrixNextTetro = TETROMINOES[nameNextTetro];

  const rowTetro = -2;
  const columnTetro = Math.floor(
    PLAYFIELD_COLUMNS / 2 - matrixTetro.length / 2
  );
  const columnNextTetro = Math.floor(
    PLAYFIELD_COLUMNS / 2 - matrixNextTetro.length / 2
  );

  tetromino = {
    name: nameTetro,
    matrix: matrixTetro,
    row: rowTetro,
    column: columnTetro,
    // index: randomIndex,
    ghostRow: rowTetro,
    ghostColumn: columnTetro,
  };

  tetromino = isFirst ? tetromino : nextTetromino;

  nextTetromino = {
    name: nameNextTetro,
    matrix: matrixNextTetro,
    row: rowTetro,
    column: columnNextTetro,
    ghostRow: rowTetro,
    ghostColumn: columnTetro,
  };
}

function getRandomElement(array) {
  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
}

// function convertPositionIndex(row, column) {
//   return row * PLAYFIELD_COLUMNS + column;
// }

function convertPositionIndex(row, column, columnValue) {
  return row * columnValue + column;
}

// Рендер панелі гучності.
function renderVolume() {
  let volume = `${Image('volume.png', 'volume-img', 'volume')}<span>${
    audioVolume * 10
  }%</span>`;

  if (audioVolume === 0) {
    // decreBtn.disabled = true;
    volume = `${Image('volume-off.png', 'volume-img', 'volume off')}`;
  } else decreBtn.disabled = false;
  if (audioVolume === 10) {
    // increBtn.disabled = true;
  } else increBtn.disabled = false;
  volumePanel.innerHTML = volume;
}

// Метод регулювання гучності.
function volumeDecrease() {
  if (audioVolume > 0) {
    audioVolume -= 1;
  }
}

function volumeIncrease() {
  if (audioVolume < 10) {
    audioVolume += 1;
  }
}

// Draw

function drawPlayField(field, cells, numRows, numColumns) {
  for (let row = 0; row < numRows; row++) {
    for (let column = 0; column < numColumns; column++) {
      const name = field[row][column];
      const cellIndex = convertPositionIndex(row, column, numColumns);
      cells[cellIndex].classList.add(name);
    }
  }
}

function drawTetromino() {
  const name = tetromino.name;
  const tetrominoMatrixSize = tetromino.matrix.length;

  for (let row = 0; row < tetrominoMatrixSize; row++) {
    for (let column = 0; column < tetrominoMatrixSize; column++) {
      if (isOutsideTopBoard(row)) {
        continue;
      }
      if (tetromino.matrix[row][column] == 0) {
        continue;
      }
      const cellIndex = convertPositionIndex(
        tetromino.row + row,
        tetromino.column + column,
        PLAYFIELD_COLUMNS
      );
      cells[cellIndex].classList.add(name);
    }
  }
}

function drawTetrominoNext() {
  let extraRow = 0;
  let extraColumn = 1;
  const name = nextTetromino.name;
  const tetrominoMatrixSize = nextTetromino.matrix.length;
  for (let row = 0; row < tetrominoMatrixSize; row++) {
    for (let column = 0; column < tetrominoMatrixSize; column++) {
      if (nextTetromino.matrix[row][column] == 0) {
        continue;
      }
      const cellIndex = convertPositionIndex(
        row + extraRow,
        column + extraColumn,
        NEXT_TETRO_COLUMNS
      );
      cellsNext[cellIndex].classList.add(name);
    }
  }
}

function drawGhostTetromino() {
  const tetrominoMatrixSize = tetromino.matrix.length;
  for (let row = 0; row < tetrominoMatrixSize; row++) {
    for (let column = 0; column < tetrominoMatrixSize; column++) {
      if (!tetromino.matrix[row][column]) continue;
      if (tetromino.ghostRow + row < 0) continue;
      const cellIndex = convertPositionIndex(
        tetromino.ghostRow + row,
        tetromino.ghostColumn + column,
        PLAYFIELD_COLUMNS
      );
      cells[cellIndex].classList.add('ghost');
    }
  }
}

function draw() {
  cells.forEach(function (cell) {
    cell.removeAttribute('class');
  });
  drawPlayField(playfield, cells, PLAYFIELD_ROWS, PLAYFIELD_COLUMNS);
  drawTetromino();
  drawTetrominoNext();
  drawGhostTetromino();
}

function calculateScore(filledRows) {
  switch (filledRows.length) {
    case 1:
      return 20;
    case 2:
      return 50;
    case 3:
      return 80;
    case 4:
      return 200;
    default:
      return 0;
  }
}

function updateSpeed() {
  if(score < 1000) {
    speedInterval = 900;
    speed = 1;
  }
  if(score >= 1000 & score < 2000) {
    speedInterval = 800;
    speed = 2;
  }
  if(score >= 2000 & score < 3000) {
    speedInterval = 700;
    speed = 3;
  }
  if(score >= 3000 & score < 5000) {
    speedInterval = 600;
    speed = 4;
  }
  if(score >= 5000 & score < 7000) {
    speedInterval = 500;
    speed = 5;
  }
  if(score >= 7000 & score < 9000) {
    speedInterval = 400;
    speed = 6;
  }
  if(score >= 9000 & score < 10000) {
    speedInterval = 300;
    speed = 7;
  }

  if(score >= 10000 & score < 10500) {
    speedInterval = 800;
    speed = 1;
  }
  if(score >= 10500 & score < 11000) {
    speedInterval = 700;
    speed = 2;
  }
  if(score >= 11000 & score < 11500) {
    speedInterval = 600;
    speed = 3;
  }
  if(score >= 11500 & score < 12500) {
    speedInterval = 500;
    speed = 4;
  }
  if(score >= 12500 & score < 13500) {
    speedInterval = 400;
    speed = 5;
  }
  if(score >= 13500 & score < 14500) {
    speedInterval = 350;
    speed = 6;
  }
  if(score >= 14500 & score < 17000) {
    speedInterval = 300;
    speed = 7;
  }
  if(score >= 17000 & score < 20000) {
    speedInterval = 900;
    speed = 1;
  }
   
  
}

function updateScore() {
  document.querySelector('.js-score').textContent = score;
  document.querySelector('.js-high-score').textContent = highScore;
  document.querySelector('.js-speed').textContent = speed;

}

function gameOver() {
  gameOverAudio.volume = audioVolume / 10;
  gameOverAudio.play();
  stopLoop();
  if (score > highScore) {
    highScore = score;
    localStorage.setItem('highScore', highScore);
  }
  gameOverBlock.style.display = 'flex';
}

function isOutsideTopBoard(row) {
  return tetromino.row + row < 0;
}

function placeTetromino() {
  const matrixSize = tetromino.matrix.length;
  for (let row = 0; row < matrixSize; row++) {
    for (let column = 0; column < matrixSize; column++) {
      if (!tetromino.matrix[row][column]) continue;
      if (isOutsideTopBoard(row)) {
        isGameOver = true;
        return;
      }
      playfield[tetromino.row + row][tetromino.column + column] =
        tetromino.name;
    }
  }
  const filledRows = findFilledRows();
  removeFilledRows(filledRows);
  // generateTetromino();
  generateTetromino(false);
  cellsNext.forEach(function (cell) {
    cell.removeAttribute('class');
  });
  drawPlayField(nexTetroField, cellsNext, NEXT_TETRO_ROWS, NEXT_TETRO_COLUMNS);
  drawTetrominoNext();
}

function removeFilledRows(filledRows) {
  if (filledRows.length > 0) {
    score += calculateScore(filledRows);

    updateSpeed();
    updateScore();
    if (filledRows.length === 4) {
      magicAudio.volume = audioVolume / 10;
      magicAudio.play();
    } else {
      deleteAudio.volume = audioVolume / 10;
      deleteAudio.play();
    }
  }

  filledRows.forEach(row => {
    dropRowsAbove(row);
    // cells[row].classList.add("deleted");
  });
}

function dropRowsAbove(rowDelete) {
  for (let row = rowDelete; row > 0; row--) {
    playfield[row] = playfield[row - 1];
  }
  playfield[0] = new Array(PLAYFIELD_COLUMNS).fill(0);
}

function calculateGhostPosition() {
  const tetrominoRow = tetromino.row;
  tetromino.row++;
  while (!isValid()) {
    tetromino.row++;
    console.log('tetromino.ghostRow', tetromino.row);
    console.log('isValid', isValid());
  }
  tetromino.ghostRow = tetromino.row - 1;
  tetromino.ghostColumn = tetromino.column;
  tetromino.row = tetrominoRow;
  console.log('tetromino.ghostColumn', tetromino.ghostColumn);
  console.log('tetromino.ghostRow', tetromino.ghostRow);
}

function findFilledRows() {
  const filledRows = [];
  for (let row = 0; row < PLAYFIELD_ROWS; row++) {
    let filledColumns = 0;
    for (let column = 0; column < PLAYFIELD_COLUMNS; column++) {
      if (playfield[row][column] != 0) {
        filledColumns++;
      }
    }
    if (PLAYFIELD_COLUMNS === filledColumns) {
      filledRows.push(row);
    }
  }
  return filledRows;
}

function rotateTetromino() {
  const oldMatrix = tetromino.matrix;
  const rotatedMatrix = rotateMatrix(tetromino.matrix);
  tetromino.matrix = rotatedMatrix;
  if (isValid()) {
    tetromino.matrix = oldMatrix;
  } else {
    calculateGhostPosition();
  }
}

function rotateMatrix(matrixTetromino) {
  const N = matrixTetromino.length;
  const rotateMatrix = [];
  for (let i = 0; i < N; i++) {
    rotateMatrix[i] = [];
    for (let j = 0; j < N; j++) {
      rotateMatrix[i][j] = matrixTetromino[N - j - 1][i];
    }
  }
  return rotateMatrix;
}

function isValid() {
  const matrixSize = tetromino.matrix.length;
  for (let row = 0; row < matrixSize; row++) {
    for (let column = 0; column < matrixSize; column++) {
      if (!tetromino.matrix[row][column]) {
        continue;
      }
      if (isOutsideOfGameBoard(row, column)) {
        return true;
      }
      if (hasCollisions(row, column)) {
        return true;
      }
    }
  }
  return false;
}

function isOutsideOfGameBoard(row, column) {
  return (
    tetromino.column + column < 0 ||
    tetromino.column + column >= PLAYFIELD_COLUMNS ||
    tetromino.row + row >= PLAYFIELD_ROWS
  );
}

function hasCollisions(row, column) {
  return playfield[tetromino.row + row]?.[tetromino.column + column];
}

function   startLoop() {
  intervalId = setInterval(() => {
    requestId = requestAnimationFrame(moveDown);
  }, speedInterval);
}

function moveDown() {
  moveTetrominoDown();
  draw();
  stopLoop();
  startLoop();
  if (isGameOver) {
    gameOver();
  }
}

function stopLoop() {
  cancelAnimationFrame(requestId);
  clearInterval(intervalId);
}
