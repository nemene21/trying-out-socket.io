const username = "test" // prompt("Ime (kajgod):")

const socket = io("http://localhost:3000", { transports : ['websocket'] });
const FPS = 90

socket.on("player_joined", function(message) {
    console.log("woo new player wow wow woooow!")
})

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

when_pressed(["ArrowUp", "w"], function() {
    vel[1] = -JUMPHEIGHT
})

function process() {

    for (let i = 0; i < players.length; i++) {
        players[i].process()
    }
}

function draw() {
    
    for (let i = 0; i < players.length; i++) {
        players[i].draw()
    }
}

clear()

// Player logic
class Player {
    constructor(x, y, color) {
        this.x = x; this.y = y
        this.color = color
        this.scale = 1
    }

    process() {

    }

    draw() {
        circle(this.x, this.y, 25 * this.scale, this.color)
    }
}

let local_player = Player(Math.random() * window_w, Math.random() * window_h, "rgb(255, 255, 255)")

let players = [local_player]
