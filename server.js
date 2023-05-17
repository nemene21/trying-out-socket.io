const PORT = 3000
const io = require("socket.io")(PORT, {
    "origins": ["http://localhost:3000"]
})

io.on("connection", function(socket) {
    console.log("new user!");
    socket.emit("msg", "wow message!")
})
