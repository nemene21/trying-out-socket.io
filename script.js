let username = prompt("Name?!'!?'1")
if (username == undefined || username == "") {
    username = "user"
    let number = String(Math.floor(Math.random() * 1000))
    username += "0" * (4 - number.length)
    username += String(Math.floor(Math.random() * 1000))
}

const socket = io("https://school-project-lh8g.onrender.com", { transports : ['websocket'] });
const FPS = 60

let fps_counter = document.getElementById("fps_counter")

// Window setup
let canvas = document.getElementById("display")
let ctx = canvas.getContext("2d")

canvas.style.width = "60%"
alert("Turn phone!?'1?'?")

let delta = 0
let time  = 0
let last_time = Date.now()

const res = [1024, 600]
const window_w = res[0]
const window_h = res[1]

function arrayRemove(arr, value) { 
    
    return arr.filter(function(ele){ 
        return ele != value; 
    });
}

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

function triangle(x, y, width, height, color) {
    ctx.beginPath()
    ctx.moveTo(x, y - height * 0.5)
    ctx.lineTo(x + width * 0.5, y + height * 0.5)
    ctx.lineTo(x - width * 0.5, y + height * 0.5)
    ctx.fillStyle = color
    ctx.fill()
}

ctx.textAlign = "center"
ctx.font = "12px Arial bolder"
function text(x, y, str, color) {
    ctx.fillStyle = color
    ctx.fillText(str, x, y)
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

    particles.push(particle)

    socket.emit("spawn_particle", JSON.stringify(particle))
}

socket.on("spawn_external_particle", function(particle) {
    particles.push(JSON.parse(particle))
    console.log("particles_sent")
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

            for (let other_player in players) {
                if (other_player != player) {
                    players[player].try_collision(players[other_player])
                }
            }

        } else {
            players[player].sync()
        }
    }

    // Processing particles
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].lf -= delta

        particles[i].x += particles[i].vel.x * delta
        particles[i].y += particles[i].vel.y* delta

        if (particles[i].lf < 0) {
            particles = arrayRemove(particles, particles[i])
        }
    }
}

function draw() {

    draw_particles()
    
    for (let player in players) {
        players[player].draw()
        if (player == socket.id) {
            triangle(players[player].x, players[player].y - 48 + Math.sin(time * 10) * 10, 16, -16, players[player].color)
        }
        
        text(players[player].x, players[player].y + 36, players[player].name)
    }

    // Draw spikes
    let num_iter = 24
    let snippet = window_w / num_iter
    let height_offset

    for (let i = 0; i <= num_iter; i++) {
        height_offset = Math.sin(-time * 10 + i) * 12
        triangle(snippet * (i + 0.5), window_h - 16 - height_offset * 0.5, snippet, 32 + height_offset, "#FFFFFF")
    }
    for (let i = 0; i <= num_iter; i++) {
        height_offset = Math.sin(time * 10 + i) * 12
        triangle(snippet * (i + 0.5), 16 + height_offset * 0.5, snippet, -32 - height_offset, "#FFFFFF")
    }
}

clear()

// Player logic
class Player {
    constructor(x, y, color, name) {
        this.x = x; this.y = y
        this.color = color
        this.scale = 1
        this.vel = {x: 250, y: 0}
        this.particle_timer = 0.02
        this.flash = 0
        this.dead = false
        this.name = name

        this.first_moved = false

        this.lerp_x = x; this.lerp_y = y
        this.lerp_scale = 1
    }

    process() {
        this.send_data_to_other_clinets()

        if (this.dead) {return}

        this.vel.y += GRAVITY * delta

        this.scale = lerp(this.scale, 1, delta * 12)

        this.x += this.vel.x * delta * Number(this.first_moved)
        this.y += this.vel.y * delta * Number(this.first_moved)

        this.flash -= delta

        this.particle_timer -= delta
        if (this.particle_timer < 0 && this.first_moved) {
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

        if (this.y > window_h) {
            this.y = window_h
        } else if (this.y < 36) {
            this.die(1)
        } else if (this.y > window_h - 36) {
            this.die(-1)
        }
    }

    die(direction) {
        this.dead = true
        play_sound("sounds/player_loose.wav")
        for (let i = 0; i < 16; i++) {
            spawn_particle(this.x, this.y, Math.random() * 20 + 15, Math.random() * 0.3 + 0.5, this.color, {
                x: (Math.random() * 2 - 1) * 35,
                y: 500 * direction * Math.random()
            })
        }
    }

    send_data_to_other_clinets() {
        socket.emit("send_player_data", JSON.stringify({
            x: this.x, y: this.y,
            scale: this.scale,
            color: this.color,
            flash: this.flash,
            dead: this.dead,
            id: socket.id
        }))
    }

    try_collision(other) {
        let dif = {x: other.x - this.x, y: other.y - this.y}
        let len = Math.sqrt(dif.x * dif.x + dif.y * dif.y)

        if (len < 30) {
            this.x -= dif.x
            this.y -= dif.y

            this.bounce()
            this.vel.y = other.vel.y
        }
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
        if (this.dead) {return}

        console.log("THING")

        if (this.flash < 0) {
            circle(this.x, this.y, 25 * this.scale, this.color)
        } else {
            circle(this.x, this.y, 25 * this.scale, "#FFFFFF")
        }
    }
}

function jump() {
    if (local_player.vel.y < -JUMPHEIGHT * 0.8 || local_player.dead) return

    local_player.vel.y = -JUMPHEIGHT
    local_player.first_moved = true

    play_sound("sounds/jump.wav", 0.2)

    for (let i = 0; i < 5; i++) {
        spawn_particle(local_player.x, local_player.y, Math.random() * 15 + 10, Math.random() * 0.2 + 0.2, local_player.color, {
            x: (Math.random() * 2 - 1) * 160,
            y: (Math.random() * 2 - 1) * 160
        })
    }
}

when_pressed(["w", "ArrowUp"], jump)
document.getElementsByTagName("html")[0].addEventListener("touchstart", jump)

let local_player

socket.on("update_player", function(data) {
    data = JSON.parse(data)
    players[data.id].lerp_x = data.x
    players[data.id].lerp_y = data.y
    players[data.id].lerp_scale = data.scale
    players[data.id].color = data.color
    players[data.id].flash = data.flash
    players[data.id].dead  = data.dead
})

socket.on("create_local_player", function(color) {
    players = {}
    local_player = new Player(Math.random() * window_w, window_h * 0.5, color, username)
    players[socket.id] = local_player
    socket.emit("local_player_created", {x: local_player.x, y: local_player.y, color: local_player.color, name: local_player.name})
})

socket.on("sync_other_players", function(data) {
    data = JSON.parse(data)
    for (let i in data) {
        let new_player = data[i]
        players[new_player.id] = new Player(new_player.x, new_player.y, new_player.color, data.name)
    }
})

socket.on("player_joined", function(data) {
    players[data.id] = new Player(data.x, data.y, data.color, data.name)
    console.log("new guy joined!")
})

socket.on("player_left", function(id) {
    delete(players[id])
    console.log("guy left :(")
})

let players = {}
