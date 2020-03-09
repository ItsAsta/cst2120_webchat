const socket = io('http://localhost:3000');

const messageForm = document.getElementById('sendContainer');
const messageContainer = document.getElementById('messageContainer');
const messageInput = document.getElementById('messageInput');

const registerBtn = document.getElementById('registerBtn');
const loginBtn = document.getElementById('loginBtn');

socket.on('chatMessage', data => {
    appendMessage(`User: ${data}`);
});

socket.on('allMessages', data => {
    console.log(data);

    data.forEach(message => {
        appendMessage(`${message.date} | ${message.username}: ${message.message}`);
    });
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


    if (username === confirmUsername && password === confirmPassword) {
        data.username = username;
        data.password = password;
        socket.emit('registerUser', JSON.stringify(data));
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


messageForm.addEventListener('submit', e => {
    e.preventDefault();
    const message = messageInput.value;
    appendMessage(`You: ${message}`);
    socket.emit('sendChatMessage', message);
    messageInput.value = '';
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