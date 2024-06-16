const canvas = document.getElementById('simulationCanvas');
const context = canvas.getContext('2d');

let draggingBall = null;
let offsetX, offsetY;

// Function to handle mousedown event
function onMouseDown(event) {
    const mouseX = event.clientX - canvas.getBoundingClientRect().left;
    const mouseY = event.clientY - canvas.getBoundingClientRect().top;

    // Check if the mouse is over any ball
    for (let ball of balls) {
        const dx = mouseX - ball.x;
        const dy = mouseY - ball.y;
        if (Math.sqrt(dx * dx + dy * dy) < ball.radius) {
            draggingBall = ball;
            offsetX = dx;
            offsetY = dy;
            break;
        }
    }
}

function onMouseMove(event) {
    if (draggingBall) {}
}

function onMouseUp() {
    if (draggingBall) {
        draggingBall = null;
    }
}

let balls = [];
var size = document.getElementById("size");
let amount = document.getElementById("amount");


// Update the current size value (each time you drag the slider handle)
let Dradius = parseFloat(size.value); 
let Amount = parseFloat(amount.value);

size.oninput = function() {
    Dradius = parseFloat(this.value);
    balls.forEach((ball) => ball.radius = Dradius);

    if (window.animationFrameId) {
        cancelAnimationFrame(window.animationFrameId);
    }

    animate();
}

amount.oninput = function() {
    Amount = parseFloat(this.value);
    updateBalls();
}

function updateBalls() {
    while (balls.length < Amount) {
        balls.push(createBall());
    }
    while (balls.length > Amount) {
        balls.pop();
    }

    if (window.animationFrameId) {
        cancelAnimationFrame(window.animationFrameId);
    }

    animate();
}

function createBall() {
    return {
        x: canvas.width / 2,
        y: Math.random() * (canvas.height / 2) + 100,
        radius: Dradius,
        color: balls.length % 2 === 0 ? 'blue' : 'red',
        dx: Math.floor(Math.random() * 6) + 5,
        dy: 1,
        gravity: 1.81,
        bounce: 0.99,
        groundFriction: 0.05,
    };
}

// Initialize balls based on the initial value of Amount
for (let i = 0; i < Amount; i++) {
    balls.push(createBall());
}

canvas.addEventListener('mousedown', onMouseDown);
canvas.addEventListener('mousemove', onMouseMove);
canvas.addEventListener('mouseup', onMouseUp);

function drawBall(ball) {
    context.beginPath();
    context.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    context.fillStyle = ball.color;
    context.fill();
    context.closePath();
}

function restartBall() {
    balls.forEach(ball => {
        ball.radius = Dradius;
        ball.x = canvas.width / 2;
        ball.y = Math.random() * (canvas.height / 2) + 100;
        ball.dx = Math.floor(Math.random() * 6) + 5;
        ball.dy = 1; // You can adjust this if you want the ball to start moving upwards or in any specific direction
    });

    // Clear any previous animation frame to prevent multiple loops
    if (window.animationFrameId) {
        cancelAnimationFrame(window.animationFrameId);
    }

    // Start or restart animation loop
    animate();
}

function updateBall(ball) {
    if (ball === draggingBall) {
        return;
    }

    const damping = 0.98;

    // Apply gravity
    ball.dy += ball.gravity;

    // Update ball position
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Check collision with walls
    if (ball.x + ball.radius > canvas.width) {
        ball.x = canvas.width - ball.radius;
        ball.dx *= -ball.bounce;
        ball.dx *= (1 - ball.groundFriction);
    } else if (ball.x - ball.radius < 0) {
        ball.x = ball.radius;
        ball.dx *= -ball.bounce;
        ball.dx *= (1 - ball.groundFriction);
    }

    // Check collision with floor and ceiling
    if (ball.y + ball.radius > canvas.height) {
        ball.y = canvas.height - ball.radius;
        ball.dy *= -ball.bounce;
        ball.dy *= (1 - ball.groundFriction);
    } else if (ball.y - ball.radius < 0) {
        ball.y = ball.radius;
        ball.dy *= -ball.bounce;
    }

    // Stop horizontal movement when very small
    if (ball.y + ball.radius >= canvas.height && Math.abs(ball.dx) < 0.01) {
        ball.dx = 0;
    }

    ball.dx *= damping;
    ball.dy *= damping;

    // Check if the ball's speed is below a minimum threshold to consider it stopped
    const minSpeed = 0.1; // Adjust as needed
    if (Math.abs(ball.dx) < minSpeed) {
        ball.dx = 0;
    }
    if (Math.abs(ball.dy) < minSpeed) {
        ball.dy = 0;
    }

    return ball;
}

function checkCollision(ball1, ball2) {
    const dx = ball2.x - ball1.x;
    const dy = ball2.y - ball1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < ball1.radius + ball2.radius) {
        const angle = Math.atan2(dy, dx);
        const sin = Math.sin(angle);
        const cos = Math.cos(angle);

        const pos0 = { x: 0, y: 0 };
        const pos1 = rotate(dx, dy, sin, cos, true);

        const vel0 = rotate(ball1.dx, ball1.dy, sin, cos, true);
        const vel1 = rotate(ball2.dx, ball2.dy, sin, cos, true);

        const vxTotal = vel0.x - vel1.x;
        vel0.x = ((ball1.radius - ball2.radius) * vel0.x + 2 * ball2.radius * vel1.x) / (ball1.radius + ball2.radius);
        vel1.x = vxTotal + vel0.x;

        const absV = Math.abs(vel0.x) + Math.abs(vel1.x);
        const overlap = (ball1.radius + ball2.radius) - Math.abs(pos0.x - pos1.x);
        pos0.x += vel0.x / absV * overlap;
        pos1.x += vel1.x / absV * overlap;

        const pos0F = rotate(pos0.x, pos0.y, sin, cos, false);
        const pos1F = rotate(pos1.x, pos1.y, sin, cos, false);

        ball2.x = ball1.x + pos1F.x;
        ball2.y = ball1.y + pos1F.y;
        ball1.x = ball1.x + pos0F.x;
        ball1.y = ball1.y + pos0F.y;

        const vel0F = rotate(vel0.x, vel0.y, sin, cos, false);
        const vel1F = rotate(vel1.x, vel1.y, sin, cos, false);

        ball1.dx = vel0F.x;
        ball1.dy = vel0F.y;
        ball2.dx = vel1F.x;
        ball2.dy = vel1F.y;
    }
}

function rotate(x, y, sin, cos, reverse) {
    return {
        x: (reverse) ? (x * cos + y * sin) : (x * cos - y * sin),
        y: (reverse) ? (y * cos - x * sin) : (y * cos + x * sin)
    };
}

function animate() {
    context.clearRect(0, 0, canvas.width, canvas.height);

    balls.forEach(ball => drawBall(ball));

    for (let i = 0; i < balls.length; i++) {
        for (let j = i + 1; j < balls.length; j++) {
            checkCollision(balls[i], balls[j]);
        }
    }

    balls.forEach(ball => updateBall(ball));

    window.animationFrameId = requestAnimationFrame(animate);
}

document.getElementById('start').addEventListener('click', restartBall);

animate();
