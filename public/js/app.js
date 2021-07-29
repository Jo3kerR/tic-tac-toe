const socket = io();
const cells = document.querySelectorAll('.cell');
const reset = document.querySelector('#reset');
let clicked = [[-1, -1, -1], [-1, -1, -1], [-1, -1, -1]];
let id = -1, player = 0, rem = 9, gameOver = false;
let score = [0, 0], roundsLeft;

// ----------------- PLAYER DETAILS -----------------
const playerDetails = JSON.parse(document.querySelector('#username').innerText);
// -------------------------------------------------- 

//------------------ CONNECTION ---------------------
const removePlayer = disconnectedPlayerID => {
    const playerList = document.querySelectorAll('.playerList');
    const playerLink = document.querySelectorAll('.playerLink');

    for (let i = 0; i < playerLink.length; ++i) {
        const playerID = playerLink[i].textContent;
        if (playerID === disconnectedPlayerID) {
            playerLink[i].remove();
            playerList[i].remove();
            break;
        }
    }
}
socket.emit('newPlayer', playerDetails);
socket.on('disconnectedPlayer', (disconnectedPlayerID, disconnectedUsername) => {
    removePlayer(disconnectedPlayerID);
    if (disconnectedPlayerID === playerDetails.playerID) window.location.replace('/');
    const item = document.createElement('li');
    item.textContent = `${disconnectedUsername} left the lobby!`;
    item.classList.add('connection', 'leaving');
    document.querySelector("#messages").appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
    if (disconnectedPlayerID === playerID) {
        socket.emit('gameOver');
    }
})
socket.on('newPlayer', (playerDetails) => {
    const playerList = document.querySelector('#playersUL');
    const newPlayer = document.createElement('li');
    const newPlayerLink = document.createElement('span');
    const newBullet = document.createElement('span');

    newBullet.classList.add('bullet', 'active');
    newPlayer.classList.add('playerList');
    newPlayerLink.classList.add('playerLink');

    newPlayerLink.appendChild(document.createTextNode(playerDetails.playerID));
    newBullet.appendChild(document.createTextNode('•'));
    newPlayer.appendChild(newBullet);

    newPlayer.appendChild(document.createTextNode(playerDetails.username));
    newPlayer.appendChild(newPlayerLink);
    playerList.appendChild(newPlayer);

    const item = document.createElement('li');
    item.textContent = `${playerDetails.username} joined the lobby!`;
    item.classList.add('connection', 'joining');
    document.querySelector("#messages").appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
})
//--------------------------------------------------------

// --------------------GAME CHAT -------------------------

document.querySelector('#formSubmit').addEventListener('submit', function (e) {
    e.preventDefault();
    if (input.value) {
        socket.emit('chat message', playerDetails.username, input.value);
        const item = document.createElement('li');
        const chatUser = document.createElement('span');
        chatUser.textContent = playerDetails.username + ' : ';
        chatUser.classList.add('chatUser');
        item.appendChild(chatUser);
        item.appendChild(document.createTextNode(input.value));
        document.querySelector("#messages").appendChild(item);
        // window.scrollTo(0, document.body.scrollHeight);
        document.querySelector('#chat').scrollTop = document.querySelector('#chat').scrollHeight ; 
        input.value = '';
    }
});

socket.on('chat message', function (user, msg) {
    const item = document.createElement('li');
    const chatUser = document.createElement('span');
    if (msg != undefined) {
        chatUser.textContent = user + ' : ';
        chatUser.classList.add('chatUser');
        item.appendChild(chatUser);
        item.appendChild(document.createTextNode(msg));
    }
    else {
        item.textContent = `${user} joined the lobby!`;
        item.classList.add('connection', 'joining');
    }
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
});

// ---------------------------------------------------------

// ---------------- CHALLENGE TIMER ------------------------

let timerInterval = null;

const challengeTimerStart = (x) => {
    clearInterval(timerInterval);
    timerInterval = null;
    for (let i = 0; i < 2; ++i) {
        document.querySelectorAll('.challengeTimer')[i].innerHTML = ``;
    }

    const FULL_DASH_ARRAY = 283;
    const WARNING_THRESHOLD = 6;
    const ALERT_THRESHOLD = 3;

    const COLOR_CODES = {
        info: {
            color: "green"
        },
        warning: {
            color: "orange",
            threshold: WARNING_THRESHOLD
        },
        alert: {
            color: "red",
            threshold: ALERT_THRESHOLD
        }
    };

    const TIME_LIMIT = 10;
    let timePassed = 0;
    let timeLeft = TIME_LIMIT;
    let remainingPathColor = COLOR_CODES.info.color;

    document.querySelectorAll('.challengeTimer')[x].innerHTML = `
<div class="base-timer">
  <svg class="base-timer__svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <g class="base-timer__circle">
      <circle class="base-timer__path-elapsed" cx="50" cy="50" r="45"></circle>
      <path
        id="base-timer-path-remaining"
        stroke-dasharray="283"
        class="base-timer__path-remaining ${remainingPathColor}"
        d="
          M 50, 50
          m -45, 0
          a 45,45 0 1,0 90,0
          a 45,45 0 1,0 -90,0
        "
      ></path>
    </g>
  </svg>
  <span id="base-timer-label" class="base-timer__label" hidden>${formatTime(timeLeft)}</span>
</div>
`;

    startTimer2();

    function onTimesUp() {
        clearInterval(timerInterval);
    }

    function startTimer2() {
        timerInterval = setInterval(() => {
            timePassed++;
            timeLeft = TIME_LIMIT - timePassed;
            document.getElementById("base-timer-label").innerHTML = formatTime(
                timeLeft
            );
            setCircleDasharray();
            setRemainingPathColor(timeLeft);

            if (timeLeft === 0) {
                onTimesUp();
            }
        }, 1000);
    }

    function formatTime(time) {
        const minutes = Math.floor(time / 60);
        let seconds = time % 60;

        if (seconds < 10) {
            seconds = `0${seconds}`;
        }

        return `${minutes}:${seconds}`;
    }

    function setRemainingPathColor(timeLeft) {
        const { alert, warning, info } = COLOR_CODES;
        if (timeLeft <= alert.threshold) {
            document
                .getElementById("base-timer-path-remaining")
                .classList.remove(warning.color);
            document
                .getElementById("base-timer-path-remaining")
                .classList.add(alert.color);
        } else if (timeLeft <= warning.threshold) {
            document
                .getElementById("base-timer-path-remaining")
                .classList.remove(info.color);
            document
                .getElementById("base-timer-path-remaining")
                .classList.add(warning.color);
        }
    }

    function calculateTimeFraction() {
        const rawTimeFraction = timeLeft / TIME_LIMIT;
        return rawTimeFraction - (1 / TIME_LIMIT) * (1 - rawTimeFraction);
    }

    function setCircleDasharray() {
        const circleDasharray = `${(
            calculateTimeFraction() * FULL_DASH_ARRAY
        ).toFixed(0)} 283`;
        document
            .getElementById("base-timer-path-remaining")
            .setAttribute("stroke-dasharray", circleDasharray);
    }
}

// ---------------------------------------------------------

// --------------- CHALLENGE PLAYER ------------------------
let playerID, username, rnds;
let challengeOpen = 0, challengePopUp = 0;
let challengeTimer, declineTimer;

document.querySelector('#playersUL').addEventListener('click', (e) => {
    if (id === -1 && e.target && e.target.nodeName === 'LI') {
        const len = `${e.target.innerHTML}`.length;
        playerID = `${e.target.innerHTML}`.slice(len - 43, len - 7);
        username = e.target.innerText.substring(1);
        const status = `${e.target.innerHTML}`.slice(20, 26) ; 
        console.log(status)
        if(status != 'active') return ; 
        const challenge = `vs ${username}`;
        if (playerID != playerDetails.playerID) {
            challengeTimerStart(0);
            document.querySelector('#challengePlayer').appendChild(document.createTextNode(challenge));
            document.querySelector('#challengeModal').click();
            clearTimeout(challengeTimer);
            challengeTimer = setTimeout(() => {
                if (challengeOpen === 0)
                    document.querySelectorAll('.modalClose')[0].click();
            }, 9000);
        }
    }
})
socket.on('pending', () => {
    challengeOpen = 0;
    document.querySelectorAll('.modalClose')[0].click();
})
socket.on('declined', () => {
    const res = document.querySelector('.badge');
    res.textContent = 'Declined';
    res.classList.remove('bg-secondary');
    res.classList.add('bg-danger');
    setTimeout(() => document.querySelectorAll('.modalClose')[0].click(), 350)
})
const declineHelper = () => {
    document.querySelectorAll('.modalClose')[1].click();
    socket.emit('declined', playerID);
}
socket.on('challenge', (challengerID, challengerUsername, Rnds) => {
    if (challengePopUp || id != -1 || challengeOpen) {
        socket.emit('pending', challengerID);
        return;
    }
    challengeTimerStart(1);
    challengePopUp = 1;
    const challengerPlayer = document.querySelector('#challengerPlayer');
    const challengerRounds = document.querySelector('#challengerRounds');
    challengerPlayer.appendChild(document.createTextNode(`${challengerUsername} challenged you`));
    challengerRounds.appendChild(document.createTextNode(`Rounds : ${Rnds}`));
    document.querySelector('#challengerModal').click();
    playerID = challengerID;
    rnds = Rnds;
    roundsLeft = rnds;
    username = challengerUsername;
    clearTimeout(declineTimer);
    declineTimer = setTimeout(() => {
        if (challengePopUp === 1) {
            declineHelper();
        }
    }, 9000);
})

document.querySelector('#declineChallenge').addEventListener('click', (e) => {
    e.preventDefault();
    declineHelper();
})

document.querySelector('#acceptChallenge').addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelectorAll('.modalClose')[1].click();
    socket.emit('newRoom', playerDetails.playerID, playerID, rnds);
})

document.querySelector('#modalBtn').addEventListener('click', (e) => {
    e.preventDefault();
    if (challengeOpen) return;
    document.querySelector('#cancelBtn').classList.add('disabled');
    challengeTimerStart(0);
    challengeOpen = 1;
    rnds = document.querySelector('#rounds').value;
    roundsLeft = rnds;
    const pending = document.createElement('span');
    document.querySelector('#challengePlayer').appendChild(document.createTextNode(' '));
    pending.appendChild(document.createTextNode('Pending...'));
    pending.classList.add('badge', 'bg-secondary', 'rounded-pill');
    document.querySelector('#challengePlayer').appendChild(pending);
    document.querySelector('#challengePlayer').appendChild(document.createTextNode(' '));
    socket.emit('challenge', playerDetails.playerID, playerDetails.username, playerID, rnds);
})

document.querySelectorAll('.modalClose')[0].addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelector('#challengePlayer').innerText = '';
    challengeOpen = 0;
    document.querySelector('#cancelBtn').classList.remove('disabled');
})

document.querySelectorAll('.modalClose')[1].addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelector('#challengerPlayer').innerText = '';
    document.querySelector('#challengerRounds').innerText = '';
    challengePopUp = 0;
})

document.querySelector('#cancelBtn').addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelectorAll('.modalClose')[0].click();
})

socket.on('firstPlayer', (playerID, rnds) => {
    if (playerID === playerDetails.playerID) id = 0;
    else id = 1;
    document.querySelector('#opponent').textContent = username;
    document.querySelector('#myUsername').textContent = `${playerDetails.username} (You)`;
    document.querySelector('#vs').textContent = `vs`;
    document.querySelectorAll('.score')[0].textContent = `0`;
    document.querySelectorAll('.score')[1].textContent = `0`;
    document.querySelector('#yourTurn').classList.add('blinkText');
    startTimer();
    if (id === 1) {
        const res = document.querySelector('.badge');
        res.textContent = 'Accepted';
        res.classList.remove('bg-secondary');
        res.classList.add('bg-success');
        setTimeout(() => document.querySelectorAll('.modalClose')[0].click(), 350)
        socket.emit('inAMatch', playerDetails.playerID, playerID);
    }
})
// ---------------------------------------------------------

// -------------------- IN A MATCH ------------------------
socket.on('inAMatch', (playerID1, playerID2) => {
    const bullet = document.querySelectorAll('.bullet');
    const playerLink = document.querySelectorAll('.playerLink');
    for (let i = 0; i < playerLink.length; ++i) {
        const playerID = playerLink[i].textContent;
        if (playerID === playerID1 || playerID === playerID2) {
            bullet[i].classList.remove('active') ; 
            bullet[i].classList.add('inAMatch');
        }
    }
})
// --------------------------------------------------------

// ---------------------PAGE RELOAD ------------------------
window.onbeforeunload = function () {
    window.setTimeout(function () {
        window.location = '/';
    }, 0);
    window.onbeforeunload = null; // necessary to prevent infinite loop, that kills your browser 
}
// ----------------------------------------------------------

// ----------------- ROOM LEFT -----------------------
const gameOverHelper = (st = 0) => {
    const pID = id;
    id = -1;
    resetHelper();
    score = [0, 0];
    document.querySelector('#opponent').textContent = '';
    document.querySelector('#myUsername').textContent = `\xa0`;
    document.querySelector('#vs').textContent = ``;
    document.querySelectorAll('.score')[0].textContent = `\xa0`;
    document.querySelectorAll('.score')[1].textContent = ``;
    document.querySelector('#winner').textContent = `\xa0`;
    document.querySelector('#winner').classList.remove('blinkingBorder');
    if (pID === 0 || st === 1) socket.emit('roomLeft');
}
const clearTimerHelper = () => {
    clearInterval(clickTimer);
    for (let j = 0; j < 2; ++j) {
        while (document.querySelectorAll('.timer')[j].lastChild != null)
            document.querySelectorAll('.timer')[j].lastChild.remove();
    }
}
const msgHelper = () => {
    document.querySelector('#winner').classList.add('blinkingBorder');
    document.querySelector('#yourTurn').classList.remove('blinkText');
    document.querySelector('#yourTurn').textContent = '\xa0';
}
const resetHelper = () => {
    --roundsLeft;
    clicked = [[-1, -1, -1], [-1, -1, -1], [-1, -1, -1]];
    player = 0;
    rem = 9;
    for (const cell of cells) {
        cell.style.backgroundImage = 'none';
    }
    gameOver = false;
    clearTimerHelper();
    if (roundsLeft === 0 && id != -1) {
        msgHelper() ; 
        if (score[0] === score[1]) document.querySelector('#winner').innerText = `Game Drawn!`;
        else if(score[0] < score[1]) document.querySelector('#winner').innerText = `${username} is the winner!`;
        else document.querySelector('#winner').innerText = `${playerDetails.username} is the winner!`;
        setTimeout(() => {
            gameOverHelper();
        }, 2000);
    }
    if (roundsLeft > 0 && id != -1) startTimer();
}
socket.on('activeStatus', (leftPlayerIDs) => {
    const playerLink = document.querySelectorAll('.playerLink');
    const bullet = document.querySelectorAll('.bullet');
    for (let i = 0; i < bullet.length; ++i) {
        if (playerLink[i].textContent === leftPlayerIDs[0]) {
            bullet[i].classList.remove('inAMatch');
            bullet[i].classList.add('active');
        }
        if (playerLink[i].textContent === leftPlayerIDs[1]) {
            bullet[i].classList.remove('inAMatch');
            bullet[i].classList.add('active');
        }
    }
})
// --------------------------------------------------

// -------------------- GAME LOGIC --------------------------------
const opacityDec = () => { for (const c of cells) c.style.opacity = 0.5; }
const winnerRow = (x) => {
    opacityDec();
    for (let i = 3 * x; i < 3 * (x + 1); ++i) cells[i].style.opacity = 1;
}
const winnerCol = (x) => {
    opacityDec();
    for (let i = x; i < 9; i += 3) cells[i].style.opacity = 1;
}
const winnerMainDiag = () => {
    opacityDec();
    cells[0].style.opacity = cells[4].style.opacity = cells[8].style.opacity = 1;
}
const winnerSecDiag = () => {
    opacityDec();
    cells[2].style.opacity = cells[4].style.opacity = cells[6].style.opacity = 1;
}

const rowCheck = r => clicked[r][0] != -1 && clicked[r][0] == clicked[r][1] && clicked[r][1] == clicked[r][2];
const colCheck = c => clicked[0][c] != -1 && clicked[0][c] == clicked[1][c] && clicked[1][c] == clicked[2][c];
const mainDiagCheck = () => clicked[0][0] != -1 && clicked[0][0] == clicked[1][1] && clicked[1][1] == clicked[2][2];
const secDiagCheck = () => clicked[0][2] != -1 && clicked[0][2] == clicked[1][1] && clicked[1][1] == clicked[2][0];
const winnerMessage = (i, j) => {
    clearTimerHelper();
    let x;
    console.log(clicked, i, j, id)
    if (clicked[i][j] === id) x = 0;
    else x = 1;
    score[x]++;
    document.querySelectorAll('.score')[x].textContent = score[x];
    id ^= 1;
    if (score[x] === Math.ceil(rnds / 2)) {
        id = -1;
        let winnerUsername;
        if (x === 0) winnerUsername = playerDetails.username;
        else winnerUsername = username;
        msgHelper() ; 
        document.querySelector('#winner').innerText = `${winnerUsername} is the winner!`;
        setTimeout(() => {
            gameOverHelper(1);
        }, 2000);
    }
    else {
        document.querySelector('#yourTurn').textContent = '\xa0';
        setTimeout(() => resetHelper(), 2000);
    }
}

const gameEnd = (cellID) => {
    if (gameOver) return;
    for (let i = 0; i < 3; ++i) {
        if (rowCheck(i)) {
            gameOver = true;
            winnerRow(i);
            winnerMessage(i, 0);
            return;
        }
        if (colCheck(i)) {
            gameOver = true;
            winnerCol(i);
            winnerMessage(0, i);
            return;
        }
    }
    if (mainDiagCheck()) {
        gameOver = true;
        winnerMainDiag();
        winnerMessage(0, 0);
        return;
    }
    if (secDiagCheck()) {
        gameOver = true;
        winnerSecDiag();
        winnerMessage(2, 0);
        return;
    }
    if (rem == 0 && gameOver === false) {
        gameOver = true;
        id ^= 1;
        document.querySelector('#yourTurn').textContent = `\xa0`;
        setTimeout(() => resetHelper(), 2000);
    }
}

const addImage = (cellID, imgOpacity) => {
    if (player & 1) setImage = 'var(--X)';
    else setImage = 'var(--O)';
    cells[cellID].style.opacity = imgOpacity;
    cells[cellID].style.backgroundImage = setImage;
    cells[cellID].style.backgroundRepeat = 'no-repeat';
    cells[cellID].style.backgroundSize = '50%';
    cells[cellID].style.backgroundPosition = 'center';
}

let secondsRem, clickTimer;
const startTimer = () => {
    secondsRem = 10;
    clearInterval(clickTimer);
    if (rem === 0) return;
    clickTimer = setInterval(() => {
        if (secondsRem > 0) countTimer();
    }, 1000);
    let whoseTurn;
    if (id === player) {
        whoseTurn = 'YOUR TURN!';
    }
    else {
        whoseTurn = `\xa0`;
    }
    document.querySelector('#yourTurn').textContent = whoseTurn;
    for (let i = 0; i < 10; ++i) {
        const timerBg = document.createElement('span');
        timerBg.appendChild(document.createTextNode(`\xa0\xa0`));
        timerBg.classList.add('timerCSS');
        const timerPos = (id === player ? 0 : 1);
        document.querySelectorAll('.timer')[timerPos].appendChild(timerBg);
        document.querySelectorAll('.timer')[timerPos].appendChild(document.createTextNode(`\xa0`));
    }
}
const countTimer = () => {
    --secondsRem;
    const timerPos = (id === player ? 0 : 1);
    for (let i = 0; i < 2; ++i)
        if (document.querySelectorAll('.timer')[timerPos].lastChild != null)
            document.querySelectorAll('.timer')[timerPos].lastChild.remove();
    if (secondsRem === 0 && id === player) {
        clearInterval(clickTimer);
        const remBlocks = [];
        for (let i = 0; i < 3; ++i) {
            for (let j = 0; j < 3; ++j) {
                if (clicked[i][j] === -1)
                    remBlocks.push(3 * i + j);
            }
        }
        let i = remBlocks[Math.floor(Math.random() * remBlocks.length)];
        cells[i].click();
    }
}

const clickHelper = (i) => {
    clicked[Math.floor(i / 3)][i % 3] = player;
    addImage(i, 1);
    player ^= 1;
    --rem;
    gameEnd(i);
    clearTimerHelper();
    if (gameOver === false && id != -1) startTimer();
}

for (let i = 0; i < 9; ++i) {

    cells[i].addEventListener('click', () => {
        if (gameOver) return;
        if (clicked[Math.floor(i / 3)][i % 3] === -1 && player == id) {
            socket.emit('click', i);
            clickHelper(i);
        }
    })

    cells[i].addEventListener('mouseenter', () => {
        if (gameOver) return;
        if (clicked[Math.floor(i / 3)][i % 3] === -1 && player == id) {
            addImage(i, 0.5);
        }
    });

    cells[i].addEventListener('mouseleave', () => {
        if (clicked[Math.floor(i / 3)][i % 3] === -1) {
            cells[i].style.background = 'none';
        }
    });

    socket.on('click', (cellID) => {
        if (gameOver) return;
        if (i == cellID) {
            clickHelper(i);
        }
    })
}

// ----------------------------------------------------
