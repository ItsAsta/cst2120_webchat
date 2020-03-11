// Get required modules for our application
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
const mysql = require('mysql');

// Store users in an array
const users = [];

// Store amount of users connected in an array
const connections = [];

// Make server listen to a specific port for our connection
server.listen(process.env.PORT || 3000);
console.log("Server running on port 3000!");

// Display our html file using the server
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});


// Connect to a socket for socket operations
io.on('connection', socket => {
    // Add new connection to our socket array
    connections.push(socket);
    console.log('Connected: %s sockets connected!', connections.length);

    socket.on('newConnection', name => {
        users[socket.id] = name;
        socket.broadcast.emit('userConnected', name);
    });

    // Make socket listen to socket disconnections
    socket.on('disconnect', data => {
        // Remove the socket from our connections array
        connections.splice(connections.indexOf(socket), 1);
        console.log('Disconnected: %s sockets connected', connections.length)
    });

    // Make socket listen to a new chat message from our client
    socket.on('sendChatMessage', message => {
        // send the message back to the client to display it
        socket.broadcast.emit('chatMessage', { message: message, name: users[socket.id]});
    });

    // Make a socket listen to the client when they click the register button on the form
    socket.on('registerUser', data => {
        // Parse the json object to access the elements
        let parsedData = JSON.parse(data);

        // Execute the database function to add the user to the database
        registerUser(socket, parsedData.username, parsedData.password);
    });

    // Make a socket listen to the client when they click the login button on the form
    socket.on('loginUser', data => {
        // Parse the json object to access the elements
        let parsedData = JSON.parse(data);

        // Execute the database function to add the user to the database
        loginUser(socket, parsedData.username, parsedData.password);
    });

    socket.on('updateDbChat', data => {
        let parsedData = JSON.parse(data);
        updateChatDb(socket, parsedData.username, parsedData.message);
    });

    // Execute the database function responsible to fetch all the chat messages
    getChat(socket)
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

function getDateTime() {
    return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

function updateChatDb(socket, username, message) {
    let query = "INSERT INTO chats (username, message, date) " +
        " VALUES ('" + username + "', '" + message + "', '" + getDateTime() + "')";

    //Execute query and register user
    connectionPool.query(query, (err, result) => {
        if (err) {//Check for errors
            console.error("Error executing query: " + JSON.stringify(err));
        } else {
            console.log("Stored message")
        }
    });

}

/* Outputs all of the chat */
function getChat(socket) {
    //Build query to select the chats from the database
    let sql = "SELECT * FROM chats where date > date_sub(now(), interval 1 week)";

    //Execute query and output results
    connectionPool.query(sql, (err, result) => {
        if (err) {//Check for errors
            console.error("Error executing query: " + JSON.stringify(err));
        } else {//Output results in JSON format - a web service would return this string.
            socket.emit('allMessages', result)
        }
    });
}

function registerUser(socket, username, password) {
    let query = "INSERT INTO users (username, password) " +
        " VALUES ('" + username + "', '" + password + "')";

    let checkUserQuery = "SELECT * FROM users WHERE username = '" + username + "'";

    connectionPool.query(checkUserQuery, (err, result) => {
        if (err) {//Check for errors
            console.error("Error executing query: " + JSON.stringify(err));
        }

        // Checks the length of the result to see if our query has found a user with the same username registered
        console.log(result);
        if (result.length > 0) {
            //Handle that the username has already been registered.
            console.log("User already registered!")
        } else {
            //Execute query and register user
            connectionPool.query(query, (err, result) => {
                if (err) {//Check for errors
                    console.error("Error executing query: " + JSON.stringify(err));
                } else {
                    console.log("Registered User")
                }
            });
        }
    });
}

function loginUser(socket, username, password) {

    // Make a query to check if we got a username and password that match what the user has entered
    let checkUserQuery = "SELECT * FROM users WHERE username = '" + username + "' AND password = '" + password + "'";

    connectionPool.query(checkUserQuery, (err, result) => {
        //Check for errors
        if (err) {
            console.error("Error executing query: " + JSON.stringify(err));
        }

        // Checks the length of the result to see if our query has found a user with the same username registered
        console.log(result);
        if (result.length > 0) {
            //Handle login
            socket.emit('loggedIn', result[0].username);
            console.log("User logged in! " + result[0].username)
        } else {
            //Handle user not registered
            console.log("User not found!")
        }
    });
}

app.use('/assets', express.static('assets'));