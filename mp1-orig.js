
var gl;
var canvas;
var shaderProgram;
var vertexPositionBuffer;


// Create a place to store vertex colors
var vertexColorBuffer;

var wireframePositionBuffer;
var wireframeColorBuffer;

var mvMatrix = mat4.create();
var rotAngle = 0;
var duration = 2000;
var wireframe = false;
var animation = true;

function changeDuration(x) {
    var elem = document.getElementById("duration-slider");
    var max = parseInt(elem.max);
    var min = parseInt(elem.min);
    duration = max + min - x;
}

function toggleWireframe() {
    wireframe = !wireframe;
}

function toggleAnimation() {
    animation = !animation;
}

function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}


function degToRad(degrees) {
        return degrees * Math.PI / 180;
}


function createGLContext(canvas) {
  var names = ["webgl", "experimental-webgl"];
  var context = null;
  for (var i=0; i < names.length; i++) {
    try {
      context = canvas.getContext(names[i]);
    } catch(e) {}
    if (context) {
      break;
    }
  }
  if (context) {
    context.viewportWidth = canvas.width;
    context.viewportHeight = canvas.height;
  } else {
    alert("Failed to create WebGL context!");
  }
  return context;
}

function loadShaderFromDOM(id) {
  var shaderScript = document.getElementById(id);
  
  // If we don't find an element with the specified id
  // we do an early exit 
  if (!shaderScript) {
    return null;
  }
  
  // Loop through the children for the found DOM element and
  // build up the shader source code as a string
  var shaderSource = "";
  var currentChild = shaderScript.firstChild;
  while (currentChild) {
    if (currentChild.nodeType == 3) { // 3 corresponds to TEXT_NODE
      shaderSource += currentChild.textContent;
    }
    currentChild = currentChild.nextSibling;
  }
 
  var shader;
  if (shaderScript.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;
  }
 
  gl.shaderSource(shader, shaderSource);
  gl.compileShader(shader);
 
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  } 
  return shader;
}

function setupShaders() {
  vertexShader = loadShaderFromDOM("shader-vs");
  fragmentShader = loadShaderFromDOM("shader-fs");
  
  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Failed to setup shaders");
  }

  gl.useProgram(shaderProgram);
  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
  gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);
  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  
}

function createPoint(positionArray, colorArray) {
    return {
        pos: positionArray,
        color: colorArray
    };
}

function setupPoints() {
    var blue = [0.0, 0.0, 0.7, 1.0];
    var orange = [1.0, 0.7, 0.0, 1.0];
    var randomColor = function() {
        return [
            Math.random(),
            Math.random(),
            Math.random(),
            1.0
        ];
    };
    return [
        createPoint([-0.8, 0.8, 0.0], randomColor()),
        createPoint([-0.2, 0.8, 0.0], randomColor()),
        createPoint([0.2, 0.8, 0.0], randomColor()),
        createPoint([0.8, 0.8, 0.0], randomColor()),
        createPoint([-0.8, 0.6, 0.0], randomColor()),
        createPoint([-0.2, 0.6, 0.0], randomColor()),
        createPoint([0.2, 0.6, 0.0], randomColor()),
        createPoint([0.8, 0.6, 0.0], randomColor()),

        createPoint([-0.8, -0.6, 0.0], randomColor()),
        createPoint([-0.2, -0.6, 0.0], randomColor()),
        createPoint([0.2, -0.6, 0.0], randomColor()),
        createPoint([0.8, -0.6, 0.0], randomColor()),
        createPoint([-0.8, -0.8, 0.0], randomColor()),
        createPoint([-0.2, -0.8, 0.0], randomColor()),
        createPoint([0.2, -0.8, 0.0], randomColor()),
        createPoint([0.8, -0.8, 0.0], randomColor())
    ];
    /**
    return [
        createPoint([-0.8, 0.8, 0.0], blue),
        createPoint([-0.2, 0.8, 0.0], blue),
        createPoint([0.2, 0.8, 0.0], blue),
        createPoint([0.8, 0.8, 0.0], blue),
        createPoint([-0.8, 0.6, 0.0], blue),
        createPoint([-0.2, 0.6, 0.0], blue),
        createPoint([0.2, 0.6, 0.0], blue),
        createPoint([0.8, 0.6, 0.0], blue),

        createPoint([-0.8, -0.6, 0.0], blue),
        createPoint([-0.2, -0.6, 0.0], blue),
        createPoint([0.2, -0.6, 0.0], orange),
        createPoint([0.8, -0.6, 0.0], orange),
        createPoint([-0.8, -0.8, 0.0], blue),
        createPoint([-0.2, -0.8, 0.0], orange),
        createPoint([0.2, -0.8, 0.0], orange),
        createPoint([0.8, -0.8, 0.0], orange)
    ];
    **/
}

function setupTriangles() {
    var p = setupPoints();
    return [
        //top
        p[0], p[4], p[1],
        p[1], p[4], p[5],
        p[1], p[5], p[2],
        p[2], p[5], p[6],
        p[2], p[6], p[3],
        p[3], p[6], p[7],
        
        //middle
        p[5], p[9], p[6],
        p[6], p[9], p[10],
        
        //bottom
        p[8], p[12], p[9],
        p[9], p[12], p[13],
        p[9], p[13], p[10],
        p[10], p[13], p[14],
        p[10], p[14], p[11],
        p[11], p[14], p[15]
    ];
}

function setupBuffers() {
    var triangles = setupTriangles();

    var triangleVertices = Array.prototype.concat.apply([], triangles.map(function(x) {return x.pos;}));
    var colors = Array.prototype.concat.apply([], triangles.map(function(x) {return x.color;}));
    
    var wireframeVertices = [];
    var wireframeColors = [];
    var white = [1.0, 1.0, 1.0, 1.0];
    for(var i = 0; i < triangles.length; i++) {
        var point = triangles[i];
        /**
         * For every triangle we have points 0, 1, and 2 on that triangle.
         * We now need to make lines for 0 -> 1, 1 -> 2, and 2 -> 0
         */
        if(i % 3 == 0) { // 0->
            wireframeVertices = wireframeVertices.concat(point.pos);
            wireframeColors = wireframeColors.concat(white);
        } else if (i % 3 == 1) { // -> 1, 1 ->
            wireframeVertices = wireframeVertices.concat(point.pos, point.pos);
            wireframeColors = wireframeColors.concat(white, white);
        } else { // -> 2, 2 -> 0
            var p0 = triangles[i-2];
            wireframeVertices = wireframeVertices.concat(point.pos, point.pos, p0.pos);
            wireframeColors = wireframeColors.concat(white, white, white);
        }
    }

    
    vertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices), gl.STATIC_DRAW);
    vertexPositionBuffer.itemSize = 3;
    vertexPositionBuffer.numberOfItems = triangles.length;
    
    vertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    vertexColorBuffer.itemSize = 4;
    vertexColorBuffer.numItems = triangles.length;
    
    wireframePositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, wireframePositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(wireframeVertices), gl.STATIC_DRAW);
    wireframePositionBuffer.itemSize = 3;
    wireframePositionBuffer.numberOfItems = wireframeVertices.length / 3;
    
    wireframeColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, wireframeColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(wireframeColors), gl.STATIC_DRAW);
    wireframeColorBuffer.itemSize = 4;
    wireframeColorBuffer.numItems = wireframeColors.length / 4;
}

function draw() { 
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);  
    mat4.identity(mvMatrix);
    mat4.rotateY(mvMatrix, mvMatrix, degToRad(rotAngle));
    if(wireframe) {
        drawWireframe();
    } else {
        drawFilledIn();
    }
}

function drawFilledIn() {
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 
                        vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, 
                        vertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
 
    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLES, 0, vertexPositionBuffer.numberOfItems);
}

function drawWireframe() {
    gl.bindBuffer(gl.ARRAY_BUFFER, wireframePositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 
                        wireframePositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, wireframeColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, 
                        wireframeColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
 
    setMatrixUniforms();
    gl.drawArrays(gl.LINES, 0, wireframePositionBuffer.numberOfItems);
}

function animate(currTime) {
    if(animation) {
        rotAngle = findRotAngle(currTime);
    } else {
        rotAngle = 0;
    }
}

function startup() {
  canvas = document.getElementById("myGLCanvas");
  gl = createGLContext(canvas);
  setupShaders(); 
  setupBuffers();
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);
  //gl.enable(gl.CULL_FACE);
  //gl.cullFace(gl.BACK);
  tick();
}

function tick(currTime) {
    requestAnimFrame(tick);
    draw();
    animate(currTime);
}

function findRotAngle(currTime) {
    var x = (currTime % duration) / duration;
    var y = calculateBezier(x);
    return y * 360;
}

var bezierCoords = {
    p1x: 0.5,
    p1y: 0.5,
    p2x: 0.5,
    p2y: 0.5
};

function changep1x(newVal) {
    bezierCoords.p1x = newVal;
}

function changep1y(newVal) {
    bezierCoords.p1y = newVal;
}

function changep2x(newVal) {
    bezierCoords.p2x = newVal;
}

function changep2y(newVal) {
    bezierCoords.p2y = newVal;
}

function changebezier(p1x, p1y, p2x, p2y) {
    document.getElementById("bezierp1x").value = p1x;
    document.getElementById("bezierp1y").value = p1y;
    document.getElementById("bezierp2x").value = p2x;
    document.getElementById("bezierp2y").value = p2y;
    
    bezierCoords.p1x = p1x;
    bezierCoords.p1y = p1y;
    bezierCoords.p2x = p2x;
    bezierCoords.p2y = p2y;
}
    
function calculateBezier(x) {
    var p1x = bezierCoords.p1x;
    var p1y = bezierCoords.p1y;
    var p2x = bezierCoords.p2x;
    var p2y = bezierCoords.p2y;
    
    var a1x = 3 * p1x;
    var a2x = 3 * p2x;
    var a1y = 3 * p1y;
    var a2y = 3 * p2y;
    
    var calculateX = function(t) {
        var u = 1 - t;
        var uu = u * u;
        var tt = t * t;
        var ttt = tt * t;
        return uu * t * a1x + u * tt * a2x + ttt;
    };
    
    var calculateY = function(t) {
        var u = 1 - t;
        var uu = u * u;
        var tt = t * t;
        var ttt = tt * t;
        return uu * t * a1y + u * tt * a2y + ttt;
    };
    
    var a0dx = 3 * p1x;
    var a1dx = 6 * (p2x - p1x);
    var a2dx = 3 * (1.0 - p2x);
    
    var calculateDX = function(t) {
        var u = 1 - t;
        var uu = u * u;
        var tt = t * t;
        return uu * a0dx + u * t * a1dx + tt * a2dx;
    };
    
    //Newton's method
    var findT = function(x) {
        var epsilon = 1e-8;
        var t = x;
        var x2, d2;
        for(var i = 0; i < 8; i++) {
            x2 = calculateX(t) - x;
            if(Math.abs(x2) < epsilon) {
                return t;
            }
            d2 = calculateDX(t);

            t = t - x2 / d2;
        }
        
        return t;   
    };
    
    return calculateY(findT(x));
}

