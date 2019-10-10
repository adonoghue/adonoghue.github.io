"use strict";

var gl;
var ver = [];
var paddle = [];
var xVelocity, yVelocity;
var xCenter, yCenter;
var radius = 0.05;
var u_vcenterLoc;
var u_ColorLoc;
var WIDTH;
var HEIGHT;
var pCenterx;
var pCentery;
var theta = 5;
var bounceCount = 0;
var anim = true;
var bounce = false;
//var animate = true;

window.onload = function init()
{
    var canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
    
    var buttonLeft = document.getElementById("LeftButton");
    buttonLeft.addEventListener("click", function() {
        if ((pCenterx > - 1.0) && (anim)){
            pCenterx = pCenterx - 0.1;
        }
    });

    var buttonRight = document.getElementById("RightButton");
    buttonRight.addEventListener("click", function() {
        if ((pCenterx < 1.0) && (anim)){
            pCenterx = pCenterx + 0.1;
        }
    });


    var buttonIncrease = document.getElementById("IncreaseButton");
    buttonIncrease.addEventListener("click", function() {
        xVelocity = xVelocity * 1.3;
        yVelocity = yVelocity * 1.3;
    });

    document.getElementById("DecreaseButton").onclick = function() {
        xVelocity = xVelocity * 0.8;
        yVelocity = yVelocity * 0.8;
    };

    document.getElementById("ct").innerHTML = bounceCount;

    setup();

    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.8, 0.8, 0.8, 1.0 );
    //pCenter = WIDTH/2;
    
    //  Load shaders and initialize attribute buffers
    
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    // Load the data into the GPU
    
    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(ver), gl.STATIC_DRAW );
    //gl.bufferData( gl.ARRAY_BUFFER, flatten(paddle), gl.STATIC_DRAW );
    // Associate out shader variables with our data buffer
    
    var a_vPositionLoc = gl.getAttribLocation( program, "a_vPosition" );
    gl.vertexAttribPointer( a_vPositionLoc, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( a_vPositionLoc );
    
    // associate the center with uniform shader variable
    // write your code here
    u_vcenterLoc = gl.getUniformLocation(program, "u_vcenter");

    // set up colors
    u_ColorLoc = gl.getUniformLocation(program, "u_Color");
    
    render();
    
};

function setup() {

    xCenter = 0;
    yCenter = 1-2*radius;
    //yCenter = 0;
    pCenterx = 0.0;
    pCentery = -1.0;

    xVelocity = 0.005;
    yVelocity = -0.005;

    // ver for the ball
    ver.push(vec2(0,0));
    for (var i = 0; i < 72; i++){
        ver.push(vec2(radius*Math.cos(i*theta),radius*Math.sin(i*theta)))
    }
    // add ver for the paddle
    /*ver.push(vec2(pCenterx + 0.25, pCentery));
    ver.push(vec2(pCenterx + 0.25,pCentery+0.05));
    ver.push(vec2(pCenterx - 0.25,pCentery + 0.05));
    ver.push(vec2(pCenterx - 0.25,pCentery));*/

    // add ver for the paddle
    ver.push(vec2(-0.25, -0.25));
    ver.push(vec2(-0.25, 0.025));
    ver.push(vec2(0.25, 0.025));
    ver.push(vec2(0.25, -0.25));

    // check if xCenter/yCenter is out of bound (use extend),
    // if yes, keep it in bound
    // write your code here
   	checkInvaderBound();
    
}

function randomPosNegOne()
{
    return Math.random() > 0.5 ? Math.random() : -Math.random();
}

function animate () {
    
    // increment xCenter and yCenter
    // write your code here
    xCenter += xVelocity;
    yCenter += yVelocity;
    // check if xCenter/yCenter is out of bound (use extend), 
    checkInvaderBound();

    // detect if ball hits the paddle
    for (var j = 0; j < ver.length; j++){
        var point = ver[j];
        var xpt = point[0];
        console.log(xpt);
        var ypt = point[1];
        console.log(ypt);
        
        if ((yCenter - radius) < pCentery + 0.05){
            if (((xCenter - radius) > pCenterx - 0.25) && (xCenter + radius < pCenterx + 0.25)){
                if (yVelocity < 0){
                    yVelocity = -1 * yVelocity;
                    bounce = true;
                    bounceCount++;
                    document.getElementById("ct").innerHTML = bounceCount;
                }
            }
        }
    }

    if (((yCenter - radius) < -1) && (!bounce)){
        alert("Game Over!");
        anim = false;
        render();
    }

    bounce = false;
    
}

function render() {
    gl.clear( gl.COLOR_BUFFER_BIT );

    if (anim) { animate(); }
    
    // ball
    gl.uniform4fv(u_ColorLoc, vec4(0.4, 0.4, 1.0, 1.0));
    gl.uniform2fv(u_vcenterLoc, vec2(xCenter, yCenter));
    gl.drawArrays( gl.TRIANGLE_FAN, 0, ver.length-4);
    // paddle
    gl.uniform4fv(u_ColorLoc, vec4(1.0, 0.4, 0.4, 1.0));
    gl.uniform2fv(u_vcenterLoc, vec2(pCenterx, pCentery));
    gl.drawArrays( gl.TRIANGLE_FAN, ver.length-4, 4);

    requestAnimFrame(render);
}

function checkInvaderBound() {
	if (xCenter+radius > 1 || xCenter-radius < -1){
        xVelocity = -1 * xVelocity;
        xCenter += xVelocity;
    }
    if (yCenter+radius > 1 || yCenter-radius < -1){
        yVelocity = -1 * yVelocity;
        yCenter += yVelocity;
    }
}