let username = prompt("Ime (do 12 znakova)")
if (username == undefined || username == "") {
    username = "User"
    let number = String(Math.floor(Math.random() * 1000))
    username += "0" * (4 - number.length)
    username += String(Math.floor(Math.random() * 1000))
}

if (username.length > 12) {
    username = username.slice(0, 12)
}

const socket = io("https://school-project-lh8g.onrender.com", { transports : ['websocket'] });
const FPS = 60

let fps_counter = document.getElementById("fps_counter")

// Window setup
let canvas = document.getElementById("display")
let ctx = canvas.getContext("2d")

canvas.style.width = "60%"
alert("Okreni mobitel")

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

ctx.font = "bolder 18px Arial"
function text(x, y, str, color, size=18) {
    ctx.textAlign = "center"
    ctx.font = "bolder " + size + "px Arial"
    ctx.fillStyle = color
    ctx.fillText(str, x, y)
}
function text_uncentered(x, y, str, color, size=18) {
    ctx.textAlign = "left"
    ctx.font = "bolder " + size + "px Arial"
    ctx.fillStyle = color
    ctx.fillText(str, x, y)
}

function clear(color="black") {
    ctx.beginPath()
    ctx.rect(0, 0, 1024, 600)
    ctx.fillStyle = color
    ctx.fill()
}

function rectange(x, y, w, h, color="black") {
    ctx.beginPath()
    ctx.rect(x - w * 0.5, y - h * 0.5, w, h)
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
})

// Sounds
function play_sound_locally(path, pitch_random = 0.1, pitch = 1) {
    var audio = new Audio(path);
    audio.mozPreservesPitch = false;
    audio.playbackspeed = pitch + (Math.random() * 2 - 1) * pitch_random
    audio.play();
}

function play_sound(path, pitch_random = 0.1, pitch = 1) {
    var audio = new Audio(path);
    audio.mozPreservesPitch = false;
    audio.playbackRate = pitch + (Math.random() * 2 - 1) * pitch_random
    audio.play();
    socket.emit("play_sound", {path: path, pitch: pitch, pitch_random: pitch_random})
}

socket.on("play_external_sound", function(data) {
    var audio = new Audio(data.path);
    audio.mozPreservesPitch = false;
    audio.playbackRate = data.pitch + (Math.random() * 2 - 1) * data.pitch_random
    audio.play();
})

// Game logic
setInterval(step, 1000 / FPS)

let x, y
x = window_w / 2
y = window_h / 2

const GRAVITY = 1200
const JUMPHEIGHT = 600
let leaderboard = []

function process() {
    leaderboard = []

    for (let player in players) {
        leaderboard.push([players[player].name, players[player].score])

        if (player == socket.id) {
            players[player].process()

            for (let other_player in players) {
                if (other_player != player) {
                    players[player].try_collision(other_player, players[other_player])
                }
            }

        } else {
            players[player].sync()
        }
    }

    leaderboard.sort(function(a, b) {return b[1] - a[1]})

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

    if (players[socket.id].dead) {
        let number = Math.floor(Math.max(0, players[socket.id].respawn_timer))
        text(window_w * 0.5, window_h * 0.5 + 24, "BACK IN: " + number + "s", "#505050", 96)
    }

    for (let i = 0; i < leaderboard.length; i++) {
        text_uncentered(36, 100 + i * 40, String(i + 1) + ". " + leaderboard[i][0] + " - " + leaderboard[i][1], "#333333", 36)
    }

    for (let player in players) {
        if (players[player].dead)
            text(players[player].x, players[player].y + 4, "💀", "#FFFFFF", 48)
    }

    draw_particles()
    
    for (let player in players) {
        players[player].draw()
        if (player == socket.id) {
            triangle(players[player].x, players[player].y - 48 + Math.sin(time * 10) * 10, 16, -16, players[player].color)
        }
        
        text(players[player].x, players[player].y + 44, players[player].name, "#FFFFFF")
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

    // Draw lasers
    for (let i = 0; i < lasers.length; i++) {
        if (laser[i].lf < 7) 
            rectange(window_w * 0.5, lasers[i].y, window_w, Math.sin(lasers[i].lf / 7 * 3.14) * 32, "#FFFFFF")
        else
            rectange(window_w * 0.5, lasers[i].y, window_w, 6, "#FFFFFF")
    }
}

clear()

const RESPAWN_TIME = 5

socket.on("got_point", function() { players[socket.id].score += 1 })

// Player logic
class Player {
    constructor(x, y, color, name) {
        this.x = x; this.y = y
        this.color = color
        this.scale = 0
        this.vel = {x: 250, y: 0}
        this.particle_timer = 0.02
        this.flash = 0
        this.dead = false
        this.name = name
        this.score = 0
        this.last_wall = -1
        this.i_frame = 0.05

        this.respawn_timer = RESPAWN_TIME

        this.first_moved = false

        this.lerp_x = x; this.lerp_y = y
        this.lerp_scale = 1
    }

    process() {
        this.send_data_to_other_clinets()

        if (this.respawn_timer < 0) {
            this.dead = false
            this.x = Math.random() * window_w; this.y = window_h * 0.5
            this.vel.x = 250; this.vel.y = 0
            this.first_moved = false
            this.scale = 0
            this.respawn_timer = RESPAWN_TIME
            play_sound("sounds/respawn.wav")
        }

        if (this.dead) {this.respawn_timer -= delta; return}

        this.i_frame -= delta

        this.vel.y += GRAVITY * delta

        this.scale = lerp(this.scale, 1, delta * 12)

        this.x += this.vel.x * delta * Number(this.first_moved)
        this.y += this.vel.y * delta * Number(this.first_moved)

        this.flash -= delta

        this.particle_timer -= delta
        if (this.particle_timer < 0 && this.first_moved) {
            spawn_particle(
                this.x + (Math.random() * 2 - 1) * 8,
                this.y + (Math.random() * 2 - 1) * 8,
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
            if (this.last_wall != 0) {
                this.score += 1
                play_sound_locally("sounds/get_point.wav")
                this.last_wall = 0
            }
        } else if (this.x > window_w) {
            this.x = window_w
            this.bounce()
            if (this.last_wall != window_w) {
                this.score += 1
                play_sound_locally("sounds/get_point.wav")
                this.last_wall = window_w
            }
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
        if (this.dead) return

        this.score = 0
        this.last_wall = 999

        socket.emit("die")
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
            first_moved: this.first_moved,
            score: this.score,
            id: socket.id
        }))
    }

    try_collision(key, other) {
        if (this.i_frame > 0) return

        let dif = {x: other.x - this.x, y: other.y - this.y}
        let len = Math.sqrt(dif.x * dif.x + dif.y * dif.y)

        if (len < 40 && !other.dead && other.first_moved && this.first_moved) {
            socket.emit("hit_player", {key: key, other: this, dif: dif})

            this.collide(dif, other)
        }
    }

    collide(dif, other) {
        if (this.i_frame > 0) return

        this.i_frame = 0.05
        this.x -= dif.x
        this.y -= dif.y

        this.bounce()
        this.vel.x = (Number(dif.x < 0) * 2 - 1) * 250
        this.vel.y += abs(other.vel.y) * 3 * dif.y / 40

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
        play_sound("sounds/bounce.wav")
    }

    sync() {
        this.x = lerp(this.x, this.lerp_x, delta * 30)
        this.y = lerp(this.y, this.lerp_y, delta * 30)
        this.scale = lerp(this.scale, this.lerp_scale, delta * 50)
    }

    draw() {
        if (this.dead) {return}

        if (this.flash < 0) {
            if (this.first_moved) {
                circle(this.x, this.y, 20 * this.scale, this.color)
            } else {
                circle(this.x, this.y, 20 * (this.scale + Math.sin(time * 10) * 0.2), this.color)
            }
        } else {
            circle(this.x, this.y, 20 * this.scale, "#FFFFFF")
        }
    }
}

function jump() {
    if (local_player.vel.y < -JUMPHEIGHT * 0.8 || local_player.dead) return

    local_player.vel.y = -JUMPHEIGHT
    local_player.first_moved = true

    play_sound("sounds/jump.wav")

    for (let i = 0; i < 5; i++) {
        spawn_particle(local_player.x, local_player.y, Math.random() * 15 + 10, Math.random() * 0.2 + 0.2, local_player.color, {
            x: (Math.random() * 2 - 1) * 160,
            y: (Math.random() * 2 - 1) * 160
        })
    }
}

socket.on("got_hit", function(data) {
    data.dif.x *= -1
    data.dif.y *= -1
    local_player.collide(data.dif, data.other)
})

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
    players[data.id].first_moved = data.first_moved
    players[data.id].score = data.score
})

socket.on("create_local_player", function(color) {
    players = {}
    local_player = new Player(Math.random() * window_w, window_h * 0.5, color, username)
    players[socket.id] = local_player
    socket.emit("local_player_created", {x: local_player.x, y: local_player.y, color: local_player.color, name: username})
})

socket.on("sync_other_players", function(data) {
    data = JSON.parse(data)
    for (let i in data) {
        let new_player = data[i]
        players[new_player.id] = new Player(new_player.x, new_player.y, new_player.color, new_player.name)
    }
})

socket.on("player_joined", function(data) {
    players[data.id] = new Player(data.x, data.y, data.color, data.name)
    console.log("new guy joined!")
}) 

socket.on("spawn_laser", function(y) {
    play_sound_locally("sounds/laser_spawn.wav")
})

let lasers = []
socket.on("update_lasers", function(new_lasers) {
    lasers = JSON.parse(new_lasers)
})

socket.on("player_left", function(id) {
    delete(players[id])
    console.log("guy left :(")
})

let players = {}
