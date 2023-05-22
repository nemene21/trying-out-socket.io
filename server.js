const PORT = 3000
const io = require("socket.io")(PORT)

let players = {}
let num_players = 0
let particles = []
const PLAYER_COLORS = [
    "#e83b3b", "#0eaf9b", "#1ebc73", "#fb6b1d", "#905ea9", "#f9c22b"
]

io.on("connection", function(socket) {
    console.log("new user!")
    socket.emit("create_local_player", PLAYER_COLORS[num_players])
    socket.emit("sync_other_players", JSON.stringify(players))

    num_players += 1

    socket.on("local_player_created", function(data) {
        data.id = socket.id

        socket.broadcast.emit("player_joined", data)
        
        players[data.id] = {x: data.x, y: data.y, id: socket.id}
    })

    socket.on("send_player_data", function(data) {
        socket.broadcast.emit("update_player", data)
    })

    socket.on("spawn_particle", function(particle) {
        socket.broadcast.emit("spawn_external_particle", particle)
    })

    socket.on("play_sound", function(sound) {
        socket.broadcast.emit("play_external_sound", sound)
    })

    socket.on("disconnect", function() {
        num_players -= 1
        console.log("user left!")
        io.emit("player_left", socket.id)
        delete(players[socket.id])
    })
})
