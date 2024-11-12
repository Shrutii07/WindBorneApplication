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

// Helper function to convert pixel coordinates to normalized device coordinates (NDC)
function pixelToNDC(x, y) {
    console.log(x,y)
    return [
        (x / canvas.width) * 2 - 1,
        -((y / canvas.height) * 2 - 1) // Flip the y-coordinate
    ];
}

// Function to draw thick lines with adjustable width
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
    gl.uniform4fv(uColor, [0, 0, 0, 1]); // Black color
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertices.length / 2);
}

// Function to add a point via user input coordinates
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

// Function to generate a random point on the canvas
function addRandomSegment() {
    const newX = Math.random() * canvas.width;
    const newY = Math.random() * canvas.height;
    
    points.push(pixelToNDC(newX, newY));
    
    drawThickLines();
}

// Function to clear the canvas and reset points
function clearCanvas() {
    points = [];
    
    gl.clear(gl.COLOR_BUFFER_BIT);
}

// Event listener for adjusting line width via input slider
document.getElementById('lineWidth').addEventListener('input', (event) => {
    lineWidth = parseInt(event.target.value);
    
    document.getElementById('lineWidthValue').textContent = lineWidth;
    
    drawThickLines();
});

// Event listener for adding a point by clicking on the canvas
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
// Button event listeners for adding points and clearing the canvas
document.getElementById('addPoint').addEventListener('click', addUserPoint);
document.getElementById('generateSegment').addEventListener('click', addRandomSegment);
document.getElementById('clearCanvas').addEventListener('click', clearCanvas);

// Initialize WebGL background color and clear the buffer
gl.clearColor(1.0, 1.0, 1.0, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT);