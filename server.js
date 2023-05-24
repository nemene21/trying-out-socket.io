const PORT = 3000
const io = require("socket.io")(PORT)

let players = {}
let particles = []
const PLAYER_COLORS = [
    "#0eaf9b", "#e83b3b", "#1ebc73", "#fb6b1d", "#905ea9", "#f9c22b"
]

const MAX_PLAYERS = PLAYER_COLORS.length

io.on("connection", function(socket) {
    console.log("new user!")
    let chosen_color
    let good = false
    while (!good) {
        chosen_color = PLAYER_COLORS[Math.floor(Math.random() * PLAYER_COLORS.length)]
        good = true
        for (let player in players) {
            if (players[player].color == chosen_color) good = false
        }
    }

    socket.emit("create_local_player", chosen_color)
    socket.emit("sync_other_players", JSON.stringify(players))

    socket.on("local_player_created", function(data) {
        data.id = socket.id

        socket.broadcast.emit("player_joined", data)
        
        players[data.id] = {x: data.x, y: data.y, id: socket.id, name: data.name, last_hit_by: "", score: 0}
    })

    socket.on("hit_player", function(player_key) {
        players[player_key].last_hit_by = socket.id
    })

    socket.on("send_player_data", function(data) {
        socket.broadcast.emit("update_player", data)
    })

    socket.on("die", function(data) {
        let killer = players[socket.id].last_hit_by
        if (killer != "") {
            players[killer].score += 1
            socket.broadcast.to(killer).emit("got_point")
        }
    })

    socket.on("spawn_particle", function(particle) {
        socket.broadcast.emit("spawn_external_particle", particle)
    })

    socket.on("play_sound", function(sound) {
        socket.broadcast.emit("play_external_sound", sound)
    })

    socket.on("disconnect", function() {
        console.log("user left!")
        io.emit("player_left", socket.id)
        delete(players[socket.id])
    })
})
