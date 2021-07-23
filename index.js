const { v4: uuidv4 } = require('uuid');
const express = require('express');
const app = express();
const path = require('path');
const server = require('http').createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);
const session = require('cookie-session');
app.use(session({ secret: 'mySecret', resave: false, saveUninitialized: false }));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));
app.use(express.static('public'))
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ------- HOME PAGE FORM ---------
app.post('/details', (req, res) => {
    req.session.username = req.body.username;
    res.redirect('/game');
})

// -------- HOME PAGE -------------
app.get('/', (req, res) => {
    res.render('home');
})

// ----- PLAYER DATA ---------
let players = [];
let playerSockets = [];

// ---------- GAME PAGE -------------
app.get('/game', (req, res) => {
    const playerDetails = {
        username: req.session.username,
        playerID: uuidv4(),
        status: 'active'
    };
    players.push(playerDetails);
    res.render('game', { players });
})

io.on('connection', (socket) => {

    // -------- ADD PLAYER TO THE LOBBY ------
    socket.on('newPlayer', (playerDetails) => {
        socket.username = playerDetails.username;
        socket.playerID = playerDetails.playerID;
        socket.status = 'active';
        playerSockets.push(socket);
        socket.broadcast.emit('newPlayer', playerDetails);
    })

    // --------- REMOVE PLAYER FROM LOBBY ------------------
    const removePlayer = () => {
        for (let i = 0; i < players.length; ++i) {
            if (players[i].playerID === socket.playerID) {
                players.splice(i, 1);
                playerSockets.splice(i, 1);
                break;
            }
        }
        io.emit('disconnectedPlayer', socket.playerID, socket.username);
    }
    socket.on('disconnect', () => removePlayer())

    // ----------- CHALLENGE PLAYER -------------------
    socket.on('challenge', (playerID1, challengerUsername, playerID2, rounds) => {
        for (const curSocket of playerSockets) {
            if (curSocket.playerID === playerID2) {
                curSocket.emit('challenge', playerID1, challengerUsername, rounds);
            }
        }
    })
    socket.on('declined', (playerID) => {
        for (const curSocket of playerSockets) {
            if (curSocket.playerID === playerID) {
                curSocket.emit('declined');
            }
        }
    })
    socket.on('pending', (playerID) => {
        for(const curSocket of playerSockets) {
            if(curSocket.playerID === playerID) {
                curSocket.emit('pending') ; 
            }
        }
    })

    // ----------- PLAYER JOINS ROOM -------------------
    socket.on('newRoom', (playerID1, playerID2, rounds) => {
        const roomID = uuidv4();
        for (const curSocket of playerSockets) {
            if (curSocket.playerID === playerID1) {
                curSocket.roomID = roomID;
                curSocket.join(roomID);
                curSocket.status = 'inAMatch';
            }
            if (curSocket.playerID === playerID2) {
                curSocket.roomID = roomID;
                curSocket.join(roomID);
                curSocket.status = 'inAMatch';
            }
        }
        for (const player of players) {
            if (player.playerID === playerID1) {
                player.status = 'inAMatch';
            }
            if (player.playerID === playerID2) {
                player.status = 'inAMatch';
            }
        }
        io.to(roomID).emit('firstPlayer', playerID1, rounds);
    })

    // ------------- IN A MATCH -------------------
    socket.on('inAMatch', (playerID1, playerID2) => {
        io.emit('inAMatch', playerID1, playerID2);
    })

    // -------------- GAME OVER -------------------
    socket.on('roomLeft', () => {
        const roomID = socket.roomID;
        const leftPlayerIDs = [] ; 
        for (let i = 0; i < players.length; ++i) {
            if (playerSockets[i].roomID === roomID) {
                playerSockets[i].status = 'active';
                players[i].status = 'active';
                playerSockets[i].roomID = '';
                leftPlayerIDs.push(players[i].playerID) ; 
            }
        }
        io.socketsLeave(socket.roomID);
        io.emit('activeStatus', leftPlayerIDs) ;
    })

    // ------------ GAME DATA TRANSMIT ------------
    socket.on('click', (cellID) => {
        socket.broadcast.to(socket.roomID).emit('click', cellID);
    })

    // ------------ GAME CHAT --------------------
    socket.on('chat message', (user, msg) => {
        socket.broadcast.emit('chat message', user, msg);
    });
})

server.listen(process.env.PORT || 3000, () => {
    console.log("LISTENING ON PORT 3000...");
})
