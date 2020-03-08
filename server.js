var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
const mysql = require('mysql');

const users = [];
const connections = [];

server.listen(process.env.PORT || 3000);
console.log("Server running on port 3000!");
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});


io.on('connection', socket => {
   connections.push(socket);
   console.log('Connected: %s sockets connected!', connections.length);

    // Disconnect
    socket.on('disconnect', function (data) {
        connections.splice(connections.indexOf(socket), 1);
        console.log('Disconnected: %s sockets connected', connections.length)
    });

    socket.on('send-chat-message', message => {
        socket.broadcast.emit('chat-message', message);
    });

    getEmployees(socket)
});

//Create a connection pool with the user details
const connectionPool = mysql.createPool({
    connectionLimit: 1,
    host: "localhost",
    user: "root",
    password: "",
    database: "web_chat",
    debug: false,
    dateStrings: true
});


/* Outputs all of the employees */
function getEmployees(socket){
    //Build query
    let sql = "SELECT * FROM chats";

    //Execute query and output results
    connectionPool.query(sql, (err, result) => {
        if (err){//Check for errors
            console.error("Error executing query: " + JSON.stringify(err));
        }
        else{//Output results in JSON format - a web service would return this string.

            socket.emit('allMessages', result)
        }
    });
}


app.use('/assets', express.static('assets'));