let loggedInUser;

$(document).ready(function () {
    console.log("ready!");

    $("#loginContainer").hide();
    $("#registerContainer").hide();

    if (sessionStorage.length > 0) {
        loggedInUser = sessionStorage.getItem('username');
        socket.emit('newConnection', loggedInUser);
        $("#status").text("Logout");
    } else {
        $("#status").text("Login");
        $("#loginContainer").show();
        $(".chatContainer").hide();
    }

    var $section = $('#loginContainer'),
        $navElement = $('#loginNav'),
        $hb = $('html, body');

    $navElement.click(function () {

        $("#loginContainer").show();

        if (sessionStorage.length > 0) {
            sessionStorage.removeItem("username");
            location.reload();
            return;
        }

        let index = $navElement.index(this);
        $hb.animate({scrollTop: $section.eq(index).offset().top + 'px'}, 1000);
    });

    $("#loginText").click(function () {
        $("#loginContainer").show();
        $("#registerContainer").hide();
    });

    $("#registerText").click(function () {
        $("#loginContainer").hide();
        $("#registerContainer").show();
    });
});

const socket = io('http://localhost:3000');

const messageForm = document.getElementById('sendContainer');
const messageContainer = document.getElementById('messageContainer');
const messageInput = document.getElementById('messageInput');

const registerBtn = document.getElementById('registerBtn');
const loginBtn = document.getElementById('loginBtn');

let messageJson = {};

socket.on('loggedIn', data => {
    if (sessionStorage.length > 0) {
        console.log("User already logged in!")
    } else {
        sessionStorage.setItem('username', data);
        location.reload();
    }
});

socket.on('userConnected', name => {
    appendMessage(`${name} has connected!`, "green")
});

socket.on('chatMessage', data => {
    appendMessage(`${getDateTime()} | ${data.name}: ${data.message}`, "white");
});

socket.on('allMessages', data => {
    if (data.length >= 50) {
        for (let i = data.length - 51; i < data.length; i++) {
            appendMessage(`${data[i].date} | ${data[i].username}: ${data[i].message}`, "white");
        }
    } else {
        data.forEach(message => {
            appendMessage(`${message.date} | ${message.username}: ${message.message}`, "white");
        });
    }

    appendMessage("You have connected!", "green");
});

messageForm.addEventListener('submit', e => {
    e.preventDefault();
    const message = messageInput.value;

    if (message.trim().length > 0) {
        messageJson.username = loggedInUser;
        messageJson.message = message;

        passChatDb();
        appendMessage(`${getDateTime()} | ${loggedInUser}: ${message}`, "white");
        socket.emit('sendChatMessage', message);
        messageInput.value = '';
    }
});

registerBtn.addEventListener('click', e => {
    e.preventDefault();

    let username = $("#registerUsername").val();
    let confirmUsername = $("#confirmUsername").val();
    let password = $("#registerPassword").val();
    let confirmPassword = $("#confirmPassword").val();

    let data = {
        "username": "",
        "password": ""
    };

    if (!username || !confirmUsername || !password || !confirmPassword) {
        $("#registerError").text("One or more fields are empty!");
        $("#registerError").css('color', 'red');
    }

    if (username === confirmUsername && password === confirmPassword) {
        data.username = username;
        data.password = password;
        socket.emit('registerUser', JSON.stringify(data));
    } else {
        $("#registerError").text("One or more fields are incorrect! Please try again.");
        $("#registerError").css('color', 'red');
    }
});

loginBtn.addEventListener('click', e => {
    e.preventDefault();

    let username = $("#loginUsername").val();
    let password = $("#loginPassword").val();

    let data = {
        "username": "",
        "password": ""
    };

    data.username = username;
    data.password = password;
    socket.emit('loginUser', JSON.stringify(data));

});

function getDateTime() {
    return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

function passChatDb() {
    if (Object.keys(messageJson).length > 0) {
        console.log(messageJson);
        socket.emit('updateDbChat', JSON.stringify(messageJson));
    }
}

$("body").on('DOMSubtreeModified', messageContainer, function () {
    updateScroll();
});

function updateScroll() {
    let element = document.getElementById('messageContainer');
    element.scrollTop = element.scrollHeight;
}

function appendMessage(message, color) {
    const messageElement = document.createElement('div');
    messageElement.setAttribute('style', 'color:' + color);
    messageElement.innerText = message;
    messageContainer.append(messageElement);
}