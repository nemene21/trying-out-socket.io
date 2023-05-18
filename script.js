const socket = io("http://localhost:3000", { transports : ['websocket'] });

const FPS = 60

socket.on("msg", function(message) {
    document.getElementById("test_paragraph").textContent = message
})

let canvas = document.getElementById("canvas")
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
    console.log(delta)
}

setInterval(step, 1000 / FPS)