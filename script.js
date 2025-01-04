const star = document.getElementById('star');
const startButton = document.getElementById('start-button');
const scoreDisplay = document.getElementById('score');
const timerDisplay = document.getElementById('timer');
const modeSelect = document.getElementById('mode-select');
const difficultySelect = document.getElementById('difficulty-select');
const timeSelect = document.getElementById('time-select');
const timedSettings = document.getElementById('timed-settings');
const applySettingsButton = document.getElementById('apply-settings');
const savePopup = document.getElementById('save-popup');
const saveYesButton = document.getElementById('save-yes');
const saveNoButton = document.getElementById('save-no');
const lightModeButton = document.getElementById('light-mode-btn');
const darkModeButton = document.getElementById('dark-mode-btn');
const nightModeButton = document.getElementById('night-mode-btn');
const gameStatus = document.getElementById('game-status');
const currentMode = document.getElementById('current-mode');
const currentDifficulty = document.getElementById('current-difficulty');
const scoreboard = document.getElementById('scoreboard');
const finalScore = document.getElementById('final-score');
const bestScoreDisplay = document.getElementById('best-score');
const playAgainButton = document.getElementById('play-again');
const pauseButton = document.getElementById('pause-button');
const soundToggle = document.getElementById('sound-toggle');

let score = 0;
let bestScore = 0;
let gameInterval;
let gameTime = 30;
let difficultySpeed = 1000;
let mousePosition = { x: 0, y: 0 };
let timerInterval;
let isGameOver = false;
let isPaused = false;
let soundEnabled = true;

// UI 설정 변경
modeSelect.addEventListener('change', () => {
    if (modeSelect.value === 'timed') {
        timedSettings.classList.remove('hidden');
    } else {
        timedSettings.classList.add('hidden');
    }
});

// 설정 적용
applySettingsButton.addEventListener('click', () => {
    const selectedMode = modeSelect.value;
    const selectedDifficulty = difficultySelect.value;

    switch (selectedDifficulty) {
        case 'easy':
            difficultySpeed = 1500;
            break;
        case 'medium':
            difficultySpeed = 1000;
            break;
        case 'hard':
            difficultySpeed = 500;
            break;
        case 'extreme':
            difficultySpeed = 300;
            break;
    }

    if (selectedMode === 'timed') {
        gameTime = parseInt(timeSelect.value, 10);
    }

    currentMode.textContent = selectedMode;
    currentDifficulty.textContent = selectedDifficulty;
    gameStatus.classList.remove('hidden');

    alert(`Mode: ${selectedMode}, Difficulty: ${selectedDifficulty}, Time: ${gameTime}s`);
});

// 게임 시작
startButton.addEventListener('click', () => {
    resetGame();
    startGame();
});

function resetGame() {
    startButton.style.display = 'none';
    scoreboard.classList.add('hidden');
    score = 0;
    isGameOver = false;
    isPaused = false;
    scoreDisplay.textContent = 'Score: 0';
    timerDisplay.textContent = `Time Left: ${gameTime}s`;
    star.style.display = 'none';
}

function startGame() {
    const selectedMode = modeSelect.value;

    star.style.display = 'block';
    moveStar();
    gameInterval = setInterval(moveStar, difficultySpeed);

    if (selectedMode === 'timed') {
        startTimer();
    } else if (selectedMode === 'survival') {
        speedIncreaseMechanic();
    } else if (selectedMode === 'endless') {
        endlessModeMechanic();
    }
}

function moveStar() {
    if (isGameOver || isPaused) return;

    const gameContainer = document.getElementById('game-container');
    const maxX = gameContainer.offsetWidth - star.offsetWidth;
    const maxY = gameContainer.offsetHeight - star.offsetHeight;

    const randomX = Math.floor(Math.random() * maxX);
    const randomY = Math.floor(Math.random() * maxY);

    star.style.left = `${randomX}px`;
    star.style.top = `${randomY}px`;
}

star.addEventListener('click', () => {
    if (isGameOver || isPaused) return;

    score += 1;
    scoreDisplay.textContent = `Score: ${score}`;
    if (soundEnabled) playSound('click');
    logMouseAndScore();
});

document.addEventListener('mousemove', (event) => {
    mousePosition = { x: event.pageX, y: event.pageY };
});

document.addEventListener('keydown', (event) => {
    if (event.key === ' ') {
        star.click();
    }
});

function startTimer() {
    timerDisplay.style.display = 'block';
    let timeLeft = gameTime;

    timerInterval = setInterval(() => {
        if (!isPaused) {
            timeLeft -= 1;
            timerDisplay.textContent = `Time Left: ${timeLeft}s`;

            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                endGame();
            }
        }
    }, 1000);
}

function speedIncreaseMechanic() {
    setInterval(() => {
        if (!isPaused && difficultySpeed > 200) {
            difficultySpeed -= 50;
            clearInterval(gameInterval);
            gameInterval = setInterval(moveStar, difficultySpeed);
        }
    }, 5000);
}

function endlessModeMechanic() {
    setInterval(() => {
        if (!isPaused) {
            score += 2;
            scoreDisplay.textContent = `Score: ${score}`;
        }
    }, 3000);
}

function endGame() {
    isGameOver = true;
    clearInterval(gameInterval);
    clearInterval(timerInterval);
    star.style.display = 'none';

    if (score > bestScore) {
        bestScore = score;
        bestScoreDisplay.textContent = bestScore;
    }

    finalScore.textContent = score;
    scoreboard.classList.remove('hidden');
    gameStatus.classList.add('hidden');
}

playAgainButton.addEventListener('click', () => {
    startButton.style.display = 'block';
    scoreboard.classList.add('hidden');
    resetGame();
});

// 게임 일시 정지/재개
pauseButton.addEventListener('click', () => {
    isPaused = !isPaused;
    pauseButton.textContent = isPaused ? 'Resume' : 'Pause';
});

// 사운드 토글
soundToggle.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundToggle.textContent = soundEnabled ? 'Sound: On' : 'Sound: Off';
});

function playSound(type) {
    let audioSrc;
    switch (type) {
        case 'click':
            audioSrc = 'assets/sounds/click.mp3';
            break;
        case 'endless':
            audioSrc = 'assets/sounds/endless.mp3';
            break;
        case 'timerEnd':
            audioSrc = 'assets/sounds/timerEnd.mp3';
            break;
    }

    const audio = new Audio(audioSrc);
    audio.play();
}

function logMouseAndScore() {
    fetch('backend.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            score,
            mousePosition,
            action: 'logInteraction',
        }),
    });
}

// 테마 변경
lightModeButton.addEventListener('click', () => {
    document.body.className = 'light-mode';
});

darkModeButton.addEventListener('click', () => {
    document.body.className = 'dark-mode';
});

nightModeButton.addEventListener('click', () => {
    document.body.className = 'night-mode';
});