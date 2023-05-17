const socket = io("http://localhost:3000", { transports : ['websocket'] });

socket.on("msg", function(message) {
    document.getElementById("test_paragraph").textContent = message
})