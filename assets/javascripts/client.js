const socket = io('http://localhost:3000');

const messageForm = document.getElementById('sendContainer');
const messageContainer = document.getElementById('messageContainer');
const messageInput = document.getElementById('messageInput');

socket.on('chat-message', data => {
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
    appendMessage(`You: ${message}`);
    socket.emit('send-chat-message', message);
    messageInput.value = '';
});

$("body").on('DOMSubtreeModified', messageContainer, function() {
    updateScroll();
});

function updateScroll(){
    let element = document.getElementById('messageContainer');
    element.scrollTop = element.scrollHeight;
}

function appendMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.innerText = message;
    messageContainer.append(messageElement);
}