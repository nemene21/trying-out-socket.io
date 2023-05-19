const PORT = 3000
const io = require("socket.io")(PORT, {
    "origins": ["http://localhost:3000"]
})

io.on("connection", function(socket) {
    console.log("new user!");
    socket.emit("create_local_player")

    io.on("local_player_created", function(player) {
        socket.broadcast.emit("player_joined", {"id": socket.id, "player": player})
    })
})