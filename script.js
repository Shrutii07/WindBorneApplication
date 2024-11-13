const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl');
canvas.width = 800;
canvas.height = 400;

if (!gl) {
    alert("WebGL not supported");
    throw new Error("WebGL not supported");
}

// Vertex and Fragment Shaders
const vertexShaderSrc = `
    attribute vec2 aPosition;
    void main() {
        gl_Position = vec4(aPosition, 0.0, 1.0);
    }
`;

const fragmentShaderSrc = `
    precision mediump float;
    uniform vec4 uColor;
    void main() {
        gl_FragColor = uColor;
    }
`;

function compileShader(source, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

const vertexShader = compileShader(vertexShaderSrc, gl.VERTEX_SHADER);
const fragmentShader = compileShader(fragmentShaderSrc, gl.FRAGMENT_SHADER);
const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);

if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(program));
    throw new Error('Shader program initialization failed');
}

gl.useProgram(program);

const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

const aPosition = gl.getAttribLocation(program, 'aPosition');
gl.enableVertexAttribArray(aPosition);
gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

const uColor = gl.getUniformLocation(program, 'uColor');

let points = [];
let lineWidth = 2;
let lineColor = [0, 0, 0, 1]; // Default black color

function pixelToNDC(x, y) {
    return [
        (x / canvas.width) * 2 - 1,
        -((y / canvas.height) * 2 - 1)
    ];
}

function drawThickLines() {
    const vertices = [];
    for (let i = 0; i < points.length - 1; i++) {
        const [x1, y1] = points[i];
        const [x2, y2] = points[i + 1];
        const dx = y2 - y1;
        const dy = x1 - x2;
        const length = Math.sqrt(dx * dx + dy * dy);
        const offsetX = (dx / length) * (lineWidth / canvas.width);
        const offsetY = (dy / length) * (lineWidth / canvas.height);

        vertices.push(
            x1 - offsetX, y1 - offsetY,
            x1 + offsetX, y1 + offsetY,
            x2 - offsetX, y2 - offsetY,
            x2 + offsetX, y2 + offsetY
        );
    }

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform4fv(uColor, lineColor);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertices.length / 2);
}

function addUserPoint() {
    const xInput = document.getElementById('xCoord');
    const yInput = document.getElementById('yCoord');
    const x = parseFloat(xInput.value);
    const y = parseFloat(yInput.value);
    if (isNaN(x) || isNaN(y) || x < 0 || x > 800 || y < 0 || y > 400) {
        alert('Please enter valid coordinates. X should be between 0 and 800, Y should be between 0 and 400.');
        return;
    }
    points.push(pixelToNDC(x, y));
    drawThickLines();
    xInput.value = '';
    yInput.value = '';
}

function addRandomSegment() {
    const newX = Math.random() * canvas.width;
    const newY = Math.random() * canvas.height;
    points.push(pixelToNDC(newX, newY));
    drawThickLines();
}

function clearCanvas() {
    points = [];
    gl.clear(gl.COLOR_BUFFER_BIT);
}

document.getElementById('lineWidth').addEventListener('input', (event) => {
    lineWidth = parseInt(event.target.value);
    document.getElementById('lineWidthValue').textContent = lineWidth;
    drawThickLines();
});

document.getElementById('lineColor').addEventListener('input', (event) => {
    const hexColor = event.target.value;
    lineColor = [
        parseInt(hexColor.slice(1, 3), 16) / 255,
        parseInt(hexColor.slice(3, 5), 16) / 255,
        parseInt(hexColor.slice(5, 7), 16) / 255,
        1
    ];
    drawThickLines();
});

canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    points.push(pixelToNDC(x, y));
    drawThickLines();
});

let isPressed = false;
let mouseDownPos;

document.addEventListener('mousedown', function(e) {
    isPressed = true;
    mouseDownPos = {
        x: e.clientX - canvas.offsetLeft,
        y: e.clientY - canvas.offsetTop
    };
});

document.addEventListener('mouseup', function() {
    isPressed = false;
});

document.addEventListener('mousemove', function(e) {
    if (isPressed) {
        let currentPos = {
            x: e.clientX - canvas.offsetLeft,
            y: e.clientY - canvas.offsetTop
        };
        points.push(pixelToNDC(currentPos.x, currentPos.y));
        drawThickLines();
    }
});

gl.viewport(0, 0, canvas.width, canvas.height);

document.getElementById('addPoint').addEventListener('click', addUserPoint);
document.getElementById('generateSegment').addEventListener('click', addRandomSegment);
document.getElementById('clearCanvas').addEventListener('click', clearCanvas);

gl.clearColor(1.0, 1.0, 1.0, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT);