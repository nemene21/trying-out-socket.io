const PORT = 3000
const io = require("socket.io")(PORT, {
    "origins": ["http://localhost:3000"]
})

let players = {}
let particles = []

io.on("connection", function(socket) {
    console.log("new user!")
    socket.emit("sync_other_players", JSON.stringify(players))
    socket.emit("create_local_player")

    socket.on("local_player_created", function(data) {
        data.id = socket.id

        socket.broadcast.emit("player_joined", data)
        
        players[data.id] = {x: data.x, y: data.y, id: socket.id}
    })

    socket.on("send_player_data", function(data) {
        socket.broadcast.emit("update_player", data)
    })

    socket.on("disconnect", function() {
        console.log("user left!")
        io.emit("player_left", socket.id)
        delete(players[socket.id])
    })
})