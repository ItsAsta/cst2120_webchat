let loggedInUser;

$(document).ready(function () {
    console.log("ready!");

    /*Hide login and register section on page load*/
    $("#loginContainer").hide();
    $("#registerContainer").hide();

    /*Check if we got a session storage placed to determine whether a user is logged in or not*/
    if (sessionStorage.length > 0) {
        /*Store the username in our session storage*/
        loggedInUser = sessionStorage.getItem('username');
        /*Let the server know that a new user has connect, then passing their name as a parameter*/
        socket.emit('newConnection', loggedInUser);
        /*Change the navigation bar text to display logout*/
        $("#status").text("Logout");
    } else {
        /*Else display login in the navigation bar*/
        $("#status").text("Login");
        /*Show the login section*/
        $("#loginContainer").show();
        /*Hide the chat due to the user not being logged in*/
        $(".chatContainer").hide();
    }

    /*A simple function that creates a scroll animation when an element is clicked*/
    var $section = $('#loginContainer'),
        $navElement = $('#loginNav'),
        $hb = $('html, body');

    $navElement.click(function () {

        /*Show the login container when the user clicks on the login on the navigation bar*/
        $("#loginContainer").show();

        /*Check if we got a session storage stored from our website*/
        if (sessionStorage.length > 0) {
            /*Remove the session storage since the user has logged out*/
            sessionStorage.removeItem("username");
            /*Reload the page*/
            location.reload();
            return;
        }

        let index = $navElement.index(this);
        $hb.animate({scrollTop: $section.eq(index).offset().top + 'px'}, 1000);
    });

    /*When the user clicks on either register or login, the appropriate section would be displayed*/
    $("#loginText").click(function () {
        $("#loginContainer").show();
        $("#registerContainer").hide();
    });

    $("#registerText").click(function () {
        $("#loginContainer").hide();
        $("#registerContainer").show();
    });
});

/*Connect to the socket that our server has hosted*/
const socket = io('http://localhost:3000');

/*Get the html element by their ids from our html file*/
const messageForm = document.getElementById('sendContainer');
const messageContainer = document.getElementById('messageContainer');
const messageInput = document.getElementById('messageInput');
const registerBtn = document.getElementById('registerBtn');
const loginBtn = document.getElementById('loginBtn');

/*Initialising a json object which will store the username and the message from the user to send to the server*/
let messageJson = {};

/*Listen to the socket for when a user logs in*/
socket.on('loggedIn', data => {
    /*Check if we already got a session storage*/
    if (sessionStorage.length > 0) {
        console.log("User already logged in!")
    } else {
        /*Otherwise set a session storage for the user to appear logged in*/
        sessionStorage.setItem('username', data);
        /*Reload the page*/
        location.reload();
    }
});

/*Listen to the server when a user connects to the server*/
socket.on('userConnected', name => {
    /*Display the connected user to the client*/
    appendMessage(`${name} has connected!`, "green")
});

/*Listen to the server for new messages*/
socket.on('chatMessage', data => {
    /*Display the new message to the client with the date, name and the message*/
    appendMessage(`${getDateTime()} | ${data.name}: ${data.message}`, "white");
});

/*Listen to the server to get all the messages from our database so they can be displayed*/
socket.on('allMessages', data => {
    /*If the data we have received is more than 50 elements, we would like to display the last 50 of them*/
    if (data.length >= 50) {
        /*We iterate over the elements and display the last 50 elements of the array*/
        for (let i = data.length - 51; i < data.length; i++) {
            appendMessage(`${data[i].date} | ${data[i].username}: ${data[i].message}`, "white");
        }
    } else {
        /*Otherwise we'll just for each loop over the array and display all messages from our database*/
        data.forEach(message => {
            appendMessage(`${message.date} | ${message.username}: ${message.message}`, "white");
        });
    }

    /*Finally let the client know that they have successfully connected to the chat*/
    appendMessage("You have connected!", "green");
});

/*Listen to any events made within the message input form*/
messageForm.addEventListener('submit', e => {
    /*This will prevent the page from refreshing when the client submits the form*/
    e.preventDefault();

    /*Get the message that the user has input inside the field*/
    const message = messageInput.value;

    /*Validate whether the user has entered any message in the input field.
    * I'm also validating whether the input is just white spice without any characters by trimming the input first*/
    if (message.trim().length > 0) {
        /*Add the logged in username to our json object*/
        messageJson.username = loggedInUser;
        /*Add them essage to our json object*/
        messageJson.message = message;

        /*A simple function that stores the message to our database*/
        passChatDb();
        /*Display the message to the client*/
        appendMessage(`${getDateTime()} | ${loggedInUser}: ${message}`, "white");
        /*Send the request to the server*/
        socket.emit('sendChatMessage', message);
        /*Clear the input value field*/
        messageInput.value = '';
    }
});

/*Listen to any events made to the register button*/
registerBtn.addEventListener('click', e => {
    /*Prevents the page from being reloaded when clicked*/
    e.preventDefault();

    /*Get all the values from the inputs*/
    let username = $("#registerUsername").val();
    let confirmUsername = $("#confirmUsername").val();
    let password = $("#registerPassword").val();
    let confirmPassword = $("#confirmPassword").val();

    /*Initialise a json object which we will pass to the server for further validation*/
    let data = {
        "username": "",
        "password": ""
    };

    /*Check if any of the input fields are empty*/
    if (!username || !confirmUsername || !password || !confirmPassword) {
        $("#registerError").text("One or more fields are empty!");
        $("#registerError").css('color', 'red');
    }

    /*Confirm that the username and password both match the same*/
    if (username === confirmUsername && password === confirmPassword) {
        /*Add the username to the json object*/
        data.username = username;
        /*Add the password to the json object*/
        data.password = password;
        /*Send the newly created json object to our server*/
        socket.emit('registerUser', JSON.stringify(data));
    } else {
        $("#registerError").text("One or more fields are incorrect! Please try again.");
        $("#registerError").css('color', 'red');
    }
});

/*Listen to any events made to the login button*/
loginBtn.addEventListener('click', e => {
    /*Prevents the page from being reloaded when the button is clicked*/
    e.preventDefault();

    /*Get the username and password values from the input*/
    let username = $("#loginUsername").val();
    let password = $("#loginPassword").val();

    /*Initialise a json object with the fields username and password*/
    let data = {
        "username": "",
        "password": ""
    };

    /*Store the username and password to the json object*/
    data.username = username;
    data.password = password;
    /*Send the request with the data to the server*/
    socket.emit('loginUser', JSON.stringify(data));

});

/*A simple function that returns formatted javascript date and time that is compatible for MySQL*/
function getDateTime() {
    return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

/*A simple function that sends a request to the server to store the message in the database*/
function passChatDb() {
    if (Object.keys(messageJson).length > 0) {
        socket.emit('updateDbChat', JSON.stringify(messageJson));
    }
}

/*A function that calls a function when an event happens to an element*/
$("body").on('DOMSubtreeModified', messageContainer, function () {
    updateScroll();
});

/*A simple function that scrolls the message container to the bottom when a new message is sent*/
function updateScroll() {
    let element = document.getElementById('messageContainer');
    element.scrollTop = element.scrollHeight;
}

/*A simple function that is used to add new chat to our message container, having 2 arguments, the message and the color*/
function appendMessage(message, color) {
    const messageElement = document.createElement('div');
    messageElement.setAttribute('style', 'color:' + color);
    messageElement.innerText = message;
    messageContainer.append(messageElement);
}