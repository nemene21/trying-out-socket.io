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

    socket.on("hit_player", function(data) {
        players[data.key].last_hit_by = socket.id
        socket.broadcast.to(data.key).emit("got_hit", data)
    })

    socket.on("send_player_data", function(data) {
        socket.broadcast.emit("update_player", data)
    })

    socket.on("die", function() {
        let killer = players[socket.id].last_hit_by
        // if (players[killer] != undefined) {
        //     players[killer].score += 1
        //     socket.broadcast.to(killer).emit("got_point")
        //     players[socket.id].last_hit_by = ""
        // }
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

let lasers = {}
function spawn_laser() {
    io.emit("spawn_laser")

    lasers.push({
        y: Math.random() * 500 + 50
    })

    setTimeout(spawn_laser, (Math.random() * 10 + 4) * 1000)
}

setTimeout(spawn_laser, (Math.random() * 10 + 4) * 1000)
setTimeout(function() {io.emit("update_lasers", JSON.stringify(lasers))}, 0)