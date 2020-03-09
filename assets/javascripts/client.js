let loggedInUser;

$(document).ready(function () {
    console.log("ready!");

    $("#loginContainer").hide();
    $("#registerContainer").hide();

    if (sessionStorage.length > 0) {
        loggedInUser = sessionStorage.getItem('username');
        $("#status").text("Logout");
    } else {
        $("#status").text("Login");
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

socket.on('chatMessage', data => {
    appendMessage(`User: ${data}`);
});

socket.on('allMessages', data => {
    console.log(data);

    data.forEach(message => {
        appendMessage(`${message.date} | ${message.username}: ${message.message}`);
    });
});

messageForm.addEventListener('submit', e => {
    e.preventDefault();
    const message = messageInput.value;
    messageJson.username = loggedInUser;
    messageJson.message = message;

    passChatDb();
    appendMessage(`${getDateTime()} | ${loggedInUser}: ${message}`);
    socket.emit('sendChatMessage', message);
    messageInput.value = '';
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


$("body").on('DOMSubtreeModified', messageContainer, function () {
    updateScroll();
});

function updateScroll() {
    let element = document.getElementById('messageContainer');
    element.scrollTop = element.scrollHeight;
}

function appendMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.innerText = message;
    messageContainer.append(messageElement);
}