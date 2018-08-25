var gl;
var canvas;
var shaderProgram;
var vertexPositionBuffer;
var vertexColorBuffer;

var wireframePositionBuffer;
var wireframeColorBuffer;

var mvMatrix = mat4.create();
var pMatrix = mat4.create();
var tMatrix = mat4.create();
mat4.translate(tMatrix, tMatrix, vec3.fromValues(0, 0, -1.5)); //move camera to (0,0,1.5)
mat4.perspective(pMatrix, degToRad(90), 1, 0.5, 100.0); //create perspective
mat4.mul(pMatrix, pMatrix, tMatrix); //multiply together
//I do all the perspective stuff out here since it doesn't change in the life of the program

//Create variables for controlling animation
var rotX = 0; 
var rotY = 0;
var rotZ = 0;
var transX = 0; 
var transY = 0; 
var transZ = 0; 
var scale = 1.0;
var duration = 5000;
var wireframe = false;
var animation = true;

/*
 * Changes how long the animation lasts. A smaller duration means a faster animation
 */
function changeDuration(x) {
    var elem = document.getElementById("duration-slider");
    var max = parseInt(elem.max);
    var min = parseInt(elem.min);
    duration = max + min - x;
}

/*
 * Toggles whether to draw the wireframe or the full triangles
 */
function toggleWireframe() {
    wireframe = !wireframe;
}

/*
 * Togglers whether to play the animation or a still image
 */
function toggleAnimation() {
    animation = !animation;
}

/*
 * Sets the matrix uniforms which will be passed to the vertex shader
 */
function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
	gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
}

/*
 * Converts degrees into radians
 */
function degToRad(degrees) {
        return degrees * Math.PI / 180;
}

/*
 * Sets up webgl and sets its width and height to the w and h of the canvas element
 * containing the webgl context
 */
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

/*
 * Loads shaders from the DOM. The name of the function is pretty self explanatory
 */
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

/**
 * Sets up shaders by loading them from the DOM and then attaching them
 * to a shader program it creates
 */
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
  shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
  
}

/**
 * Pseudo-constuctor for points on the I
 * Has two parameters, an array for the position and
 * an array for the color. I created points this way 
 * so that I could think about both parts at once,
 * and also so that I wouldn't get color glitches by defining the same
 * point multiple colors on different triangles.
 */
function createPoint(positionArray, colorArray) {
    return {
        pos: positionArray,
        color: colorArray
    };
}

/**
 * Sets up the list of points that will be used to construct the I
 */
function setupPoints() {
    var blue = [0.0, 0.0, 0.7, 1.0];
    var orange = [1.0, 0.7, 0.0, 1.0];
	//function to create random colors
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

/**
 * Uses the set of points to define the triangles, one on each line
 */
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

/**
 * Sets up the different buffers for drawing both the I and the wireframe I
 */
function setupBuffers() {
    var triangles = setupTriangles();

	var triangleVertices = [];
	var colors = [];
    var wireframeVertices = [];
    var wireframeColors = [];
    var white = [1.0, 1.0, 1.0, 1.0];
    for(var i = 0; i < triangles.length; i++) {
        var point = triangles[i];
		//Have to concat the arrays on to the triangleVertices array because webgl
		//expects an array of values, not an array of arrays
		triangleVertices = triangleVertices.concat(point.pos);
		colors = colors.concat(point.color);
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

    
	//These are the code blocks that actually bind the arrays to a webgl buffer
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

/**
 * Draws the image to the screen 
 */
function draw() { 
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);  
    mat4.identity(mvMatrix);
    mat4.translate(mvMatrix, mvMatrix, vec3.fromValues(transX, transY, transZ));
    mat4.rotateX(mvMatrix, mvMatrix, degToRad(rotX));
    mat4.rotateY(mvMatrix, mvMatrix, degToRad(rotY));
    mat4.rotateZ(mvMatrix, mvMatrix, degToRad(rotZ));
    mat4.scale(mvMatrix, mvMatrix, vec3.fromValues(scale, scale, scale));
    if(wireframe) {
        drawWireframe();
    } else {
        drawFilledIn();
    }
}

/**
 * Draws the image with everything filled in
 */
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

/**
 * Draws the wireframe
 */
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

/**
 * Sets the variables need to move the image around
 */
function animate(currTime) {
    if(animation) {
        setTransformationVariables(currTime);
    } else {
        rotX = 0; 
        rotY = 0;
        rotZ = 0;
        transX = 0; 
        transY = 0; 
        transZ = 0; 
        scale = 1.0;
    }
}

/**
 * Called when the page loads
 */
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

/**
 * Called every frame of the animation
 */
function tick(currTime) {
    requestAnimFrame(tick);
    draw();
    animate(currTime);
}

/**
 * Sets the variables for the animation
 */
function setTransformationVariables(currTime) {
    var timePercent = (currTime % duration) / duration;
    var pos = 0;
	//Search through list of keyFrames for the last keyFrame that has been passed
    for(var i = 0; i < keyFrames.length; i++) {
        if(keyFrames[i].time < timePercent) {
            pos = i;
        }
    }
    var fromVals = keyFrames[pos];
    var toVals;
    var x;
    if(pos==keyFrames.length-1) {
		//if the keyframe we found is the last one in the list,
		//loop back to the beginning
        toVals = keyFrames[0];
        var time = fromVals.time;
        x = (timePercent-time)/(1.0-time); //x needs to be a value between 0.0 and 1.0
    } else {
		//else just pick the next one
        toVals = keyFrames[pos+1];
        var time = fromVals.time;
        x = (timePercent-time)/(toVals.time-time);
    }
    
    var y = calculateBezier(x);
    
	//Calculates a value based on the name.
	//Basically just a way to not write the same thing multiple times
    var calculateValue = function(elemName) {
        var from = fromVals[elemName];
        var to = toVals[elemName];
    
        return ((to - from) * y) + from;
    };
    
    rotX = calculateValue("rotX");
    rotY = calculateValue("rotY");
    rotZ = calculateValue("rotZ");
    transX = calculateValue("transX");
    transY = calculateValue("transY");
    transZ = calculateValue("transZ");
    scale = calculateValue("scale");
    /*
    console.log(rotX);
    console.log(rotY);
    console.log(rotZ);
    console.log(transX);
    console.log(transY);
    console.log(transZ);
    console.log(scale);
    */
}



/*
 * Constructor for keyframe object. Not a real JS constructor because I just need
 *  an object with parameters, not methods.
 * time is the only param with constraints. It should be in the range [0.0, 1.0)
 */
function createKeyFrame(time, rotX, rotY, rotZ, transX, transY, transZ, scale) {
    return {
        time: time,
        rotX: rotX,
        rotY: rotY,
        rotZ: rotZ,
        transX: transX,
        transY: transY,
        transZ: transZ,
        scale: scale
    };
}

/*
 * Make sure list is sorted by time (first param). If not, all my methods break
 * Doing things this way makes it easy to change the animation! Try adding a frame
 * or removing one yourself!
 */
var keyFrames = [
    createKeyFrame(0.0, 0, 0, 0, 0, -1, 0, 0.6),
    createKeyFrame(0.15, 0, 100, 90, -0.75, 0, -2, 0.6),
    createKeyFrame(0.25, 180, 270, 90, -0.5, 0.5, 0, 0.6),
    createKeyFrame(0.5, 360, 180, 270, 0.75, 0.75, 0.5, 0.6),
    createKeyFrame(0.6, 320, 170, 250, 0.75, 0, 0, 0.6),
    createKeyFrame(0.7, 360, 160, 15, 0, 0, 0.75, 0.6),
    createKeyFrame(0.75, 360, 130, 15, 0, 0, -5, 0.6),
    createKeyFrame(0.9, 90, 90, 165, 0, 0, 0, 0.6)
];

var bezierCoords = {
    p1x: 0.5,
    p1y: 0.5,
    p2x: 0.5,
    p2y: 0.5
};

/**
 * These next 4 functions should be self explanatory
 */
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

/**
 * Changes all the bezier coordinates at once.
 * The onclick function for the buttons
 */
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
    
/**
 * Calculates the point on the bezier curve for the given x coordinate
 */
function calculateBezier(x) {
    var p1x = bezierCoords.p1x;
    var p1y = bezierCoords.p1y;
    var p2x = bezierCoords.p2x;
    var p2y = bezierCoords.p2y;
    
    var a1x = 3 * p1x;
    var a2x = 3 * p2x;
    var a1y = 3 * p1y;
    var a2y = 3 * p2y;
    
	/**
     * Calculates the x component of the bezier curve for the given value of t
     * The bezier function returns an (x,y) point given a t value	
     */
    var calculateX = function(t) {
        var u = 1 - t;
        var uu = u * u;
        var tt = t * t;
        var ttt = tt * t;
        return uu * t * a1x + u * tt * a2x + ttt;
    };
    
	/**
     * Calculates the y component of the bezier curve for the given value of t
	 */
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
    
	/**
	 * Calculates the x component of the derivative of the bezier function
	 */
    var calculateDX = function(t) {
        var u = 1 - t;
        var uu = u * u;
        var tt = t * t;
        return uu * a0dx + u * t * a1dx + tt * a2dx;
    };
    
    /**
	 * Finds the value of t for a given x using Newton's method
	 */
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
    
	//find t for x, and then use that to calculate y
    return calculateY(findT(x));
}

