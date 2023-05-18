const username = "test" // prompt("Ime (kajgod):")

const socket = io("http://localhost:3000", { transports : ['websocket'] });
const FPS = 60

socket.on("player_joined", function(message) {
    console.log("woo new player wow wow woooow!")
})

let canvas = document.getElementById("display")
let ctx = canvas.getContext("2d")

let delta = 0
let last_time = Date.now()

function calculate_delta() {
    let now   = Date.now()
    let diff  = now - last_time
    last_time = now

    delta =  diff * 0.001
}

function step() {
    calculate_delta()

    clear()
    circle(0, 0, 50, "blue")
}

// Drawing
function circle(x, y, radius, color) {
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, 2 * Math.PI)
    ctx.fillStyle = color
    ctx.fill()
}

function clear(color="white") {
    ctx.beginPath()
    ctx.rect(0, 0, 1024, 600)
    ctx.fillStyle = color
    ctx.fill()
}

setInterval(step, 1000 / FPS)