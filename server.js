var app = require('express')();
const cors = require('cors');
var http = require('http').createServer(app);
var io = require('socket.io')(http, { 'transports': ['websocket', 'polling'] });
const bodyParser = require('body-parser');
const db = require('./src/db');
const env = require('./src/constants');
db.connection();
app.use(cors());
console.log("entered")
app.use(bodyParser.json());
app.use('/', require('./src/routers/router'));


//socket.io connection
io.on('connection', socket => {
    console.log('connecting');
    socket.on("testing", (value) => {
        console.log("value", value);
    })
    // socket.emit('connect', { hi: "hello front-end" });
    module.exports.userTodos = (data) => {
        socket.emit('usersTodos', data);
    }
    module.exports.onUsrCreate = (data) => {
        socket.emit('onUsrCreate', data);
    }
    module.exports.onUsrUpdate = (data) => {
        socket.emit('onUsrUpdate', data);
    }
    module.exports.onUsrComplete = (data) => {
        socket.emit('onUsrComplete', data);
    }
});
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin: *");
    res.header("Access-Control-Allow-Headers: Content-Type, Authorization");
    res.header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    next();
});

//Server
http.listen(env.port || 3000, () => {
    console.log('listening on *:3000');
});
