const username = "test" // prompt("Ime (kajgod):")

const socket = io("https://school-project-lh8g.onrender.com", { transports : ['websocket'] });
const FPS = 60

let fps_counter = document.getElementById("fps_counter")

let phone_regex = /android|iphone|kindle|ipad/i;
function is_on_mobile() {
    return phone_regex.test(details)
}

// Window setup
let canvas = document.getElementById("display")
let ctx = canvas.getContext("2d")

if (is_on_mobile()) {
    canvas.style.transform = "scale(0.9)"
}

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
    if (delta > 0.1) {
        delta = 0.1
    }
}

function lerp(a, b, c) {return a + (b - a) * c}

function step() {
    calculate_delta()
    time += delta

    fps_counter.textContent = "FPS: " + Math.round(1 / delta)

    clear(color(0, 0, 0, delta * 20))
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

// Particles
let particles = []
function draw_particles() {
    for (let i = 0; i < particles.length; i++) {
        let particle = particles[i]
        let scale = particle.lf / particle.start_lf
        circle(particle.x, particle.y, particle.r * scale, particle.color)
    }
}

function spawn_particle(x, y, r, lf, color, vel={x: 0, y: 0}) {
    let particle = {
        x: x, y: y, r: r,
        lf: lf,
        start_lf: lf,
        color: color,
        vel: vel
    }

    socket.emit("spawn_particle", JSON.stringify(particle))
}

socket.on("update_particles", function(particle_data) {
    particles = JSON.parse(particle_data)
})

// Sounds
function play_sound(path, pitch, pitch_random) {
    var audio = new Audio(path);
    audio.mozPreservesPitch = false;
    audio.playbackspeed = pitch + (Math.random() * 2 - 1) * pitch_random
    audio.play();
    socket.emit("play_sound", {path: path, pitch: pitch, pitch_random: pitch_random})
}

socket.on("play_external_sound", function(data) {
    var audio = new Audio(data.path);
    audio.mozPreservesPitch = false;
    audio.playbackspeed = data.pitch + (Math.random() * 2 - 1) * data.pitch_random
    audio.play();
})

// Game logic
setInterval(step, 1000 / FPS)

let x, y
x = window_w / 2
y = window_h / 2

const GRAVITY = 1600
const JUMPHEIGHT = 800

function process() {

    for (let player in players) {
        if (player == socket.id) {
            players[player].process()
        } else {
            players[player].sync()
        }
    }
}

function draw() {

    draw_particles()
    
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
        this.vel = {x: 250, y: 0}
        this.particle_timer = 0.02
        this.flash = 0

        this.lerp_x = x; this.lerp_y = y
        this.lerp_scale = 1
    }

    process() {
        this.vel.y += GRAVITY * delta

        this.scale = lerp(this.scale, 1, delta * 12)

        this.x += this.vel.x * delta
        this.y += this.vel.y * delta

        this.flash -= delta

        this.particle_timer -= delta
        if (this.particle_timer < 0) {
            spawn_particle(
                this.x + (Math.random() * 2 - 1) * 12,
                this.y + (Math.random() * 2 - 1) * 12,
                4 + Math.random() * 4,
                0.5 * Math.random() + 0.1,
                this.color,
                {x: this.vel.x * 0.1, y: this.vel.y * 0.1}
            )
            this.particle_timer = 0.05
        }

        if (this.x < 0) {
            this.x = 0
            this.bounce()
        } else if (this.x > window_w) {
            this.x = 1024
            this.bounce()
        }

        if (this.y > window_h) {this.y = window_h}

        socket.emit("send_player_data", JSON.stringify({
            x: this.x, y: this.y,
            scale: this.scale,
            color: this.color,
            flash: this.flash,
            id: socket.id
        }))
    }

    bounce() {
        this.vel.x *= -1
        this.scale = 1.5
        for (let i = 0; i < 7; i++) {
            spawn_particle(local_player.x, local_player.y, Math.random() * 20 + 15, Math.random() * 0.2 + 0.2, local_player.color, {
                x: (Math.random() * 2 - 1) * 200,
                y: (Math.random() * 2 - 1) * 200
            })
        }
        this.flash = 0.05
        play_sound("sounds/bounce.wav", 0.1, 0.4)
    }

    sync() {
        this.x = lerp(this.x, this.lerp_x, delta * 30)
        this.y = lerp(this.y, this.lerp_y, delta * 30)
        this.scale = lerp(this.scale, this.lerp_scale, delta * 50)
    }

    draw() {
        if (this.flash < 0) {
            circle(this.x, this.y, 25 * this.scale, this.color)
        } else {
            circle(this.x, this.y, 25 * this.scale, "#FFFFFF")
        }
    }
}

function jump() {
    if (local_player.vel.y < -JUMPHEIGHT * 0.8) return

    local_player.vel.y = -JUMPHEIGHT

    play_sound("sounds/jump.wav", 0.2)

    for (let i = 0; i < 5; i++) {
        spawn_particle(local_player.x, local_player.y, Math.random() * 15 + 10, Math.random() * 0.2 + 0.2, local_player.color, {
            x: (Math.random() * 2 - 1) * 160,
            y: (Math.random() * 2 - 1) * 160
        })
    }
}

when_pressed(["w", "ArrowUp"], jump)
canvas.onclick = jump

let local_player

socket.on("update_player", function(data) {
    data = JSON.parse(data)
    players[data.id].lerp_x = data.x
    players[data.id].lerp_y = data.y
    players[data.id].lerp_scale = data.scale
    players[data.id].color = data.color
    players[data.id].flash = data.flash
})

socket.on("create_local_player", function(color) {
    players = {}
    local_player = new Player(Math.random() * window_w, Math.random() * window_h, color)
    players[socket.id] = local_player
    socket.emit("local_player_created", {x: local_player.x, y: local_player.y, color: local_player.color})
})

socket.on("sync_other_players", function(data) {
    data = JSON.parse(data)
    for (let i in data) {
        let new_player = data[i]
        players[new_player.id] = new Player(new_player.x, new_player.y, new_player.color)
    }
})

socket.on("player_joined", function(data) {
    players[data.id] = new Player(data.x, data.y, data.color)
    console.log("new guy joined!")
})

socket.on("player_left", function(id) {
    delete(players[id])
    console.log("guy left :(")
})

let players = {}
