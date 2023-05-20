const username = "test" // prompt("Ime (kajgod):")

const socket = io("http://localhost:3000", { transports : ['websocket'] });
const FPS = 90

let fps_counter = document.getElementById("fps_counter")

let canvas = document.getElementById("display")
let ctx = canvas.getContext("2d")

let delta = 0
let time  = 0
let last_time = Date.now()

const res = [1024, 600]
const window_w = res[0]
const window_h = res[1]

function calculate_delta() {
    let now   = Date.now()
    let diff  = now - last_time
    last_time = now

    delta =  diff * 0.001
}

function step() {
    calculate_delta()
    time += delta

    fps_counter.textContent = "FPS: " + Math.round(1 / delta)

    clear(color(0, 0, 0, delta * 10))
    process()
    draw()
}

// Input
let inputs = {}
function when_pressed(buttons, func) {
    for (let i = 0; i < buttons.length; i++) {
        inputs[buttons[i]] = func
    }
}

document.addEventListener("keydown", function(event) {
    if (event.key in inputs) {
        inputs[event.key]()
    }
})

// Drawing
function circle(x, y, radius, color) {
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, 2 * Math.PI)
    ctx.fillStyle = color
    ctx.fill()
}

function clear(color="black") {
    ctx.beginPath()
    ctx.rect(0, 0, 1024, 600)
    ctx.fillStyle = color
    ctx.fill()
}

function color(r, g, b, a = 1) {
    return "rgba(" + r + "," + g + "," + b + "," + a + ")"
} 

setInterval(step, 1000 / FPS)

// Game logic
let x, y
x = window_w / 2
y = window_h / 2

const GRAVITY = 1600
const JUMPHEIGHT = 800

function process() {

    players[socket.id].process()
}

function draw() {
    
    for (let player in players) {
        players[player].draw()
    }
}

clear()

// Player logic
class Player {
    constructor(x, y, color) {
        this.x = x; this.y = y
        this.color = color
        this.scale = 1
        this.vel = {x: 200, y: 0}
    }

    process() {
        this.x += this.vel.x * delta
        this.y += this.vel.y * delta

        if (this.x < 0) {
            this.x = 0
            this.vel.x *= -1
        } else if (this.x > window_w) {
            this.x = 1024
            this.vel.x *= -1
        }

        socket.emit("send_player_data", {
            x: this.x, y: this.y,

            id: socket.id
        })
    }

    draw() {
        circle(this.x, this.y, 25 * this.scale, this.color)
    }
}

let local_player

socket.on("update_player", function(data) {
    players[data.id].x = data.x
    players[data.id].y = data.y
})

socket.on("create_local_player", function(data) {
    local_player = new Player(Math.random() * window_w, Math.random() * window_h, "rgb(0, 255, 0)")
    players[socket.id] = local_player
    socket.emit("local_player_created", {x: local_player.x, y: local_player.y})
})

socket.on("sync_other_players", function(data) {
    data = JSON.parse(data)
    for (let i in data) {
        let new_player = data[i]
        players[new_player.id] = new Player(new_player.x, new_player.y, "rgb(255, 0, 0)")
    }
})

socket.on("player_joined", function(data) {
    players[data.id] = new Player(data.x, data.y, "rgb(255, 0, 0)")
    console.log("new guy joined!")
})

socket.on("player_left", function(id) {
    delete(players[id])
    console.log("guy left :(")
})

let players = {}
