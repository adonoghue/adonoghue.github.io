"use strict";

var gl;
var vertices;

var lengthCircle;
var lengthLogo;
var lengthTick;
var triangles = [];
var triangle_vertices_index = [];
var radius = 3;
var u_colorLoc;
var u_ctMatrixLoc;
var outerMat;
var innerMat;
var centerMat;
var logoMat;
var hourTicksMat;
var minuteTicksMat;
var hourMarkersMats = [];
var minuteMarkersMats = [];


window.onload = function init() {
	var canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }


    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.8, 0.8, 0.8, 1.0 );
    

    // Initialize shaders
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    // generate vertices of circle of clockface and create ctm's
    circles();
    // generate vertices for logo
    logo();
    // generate vertices for tick marks
    ticks();

    // Put data in GPU via buffers
    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW );

    var a_vPositionLoc = gl.getAttribLocation( program, "a_vPosition");
    gl.vertexAttribPointer(a_vPositionLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray( a_vPositionLoc );

    u_colorLoc = gl.getUniformLocation( program, "u_color" );
    u_ctMatrixLoc = gl.getUniformLocation( program, "u_ctMatrix" );

    render();
};

function render() {


	gl.clear( gl.COLOR_BUFFER_BIT );

     // ctm for outer circle
    var scalingOuter = 0.27;

    var scalingOuterMat = scalem(scalingOuter, scalingOuter, scalingOuter);
    var pm = ortho(-1.0, 1.0, -1.0, 1.0, -1.0, 1.0);

    outerMat = mat4();
    outerMat = mult(scalingOuterMat, outerMat);
    outerMat = mult(pm, outerMat);

    // draw gold circle
    gl.uniform4fv(u_colorLoc, vec4(0.85, 0.65, 0.125, 1.0));
    gl.uniformMatrix4fv(u_ctMatrixLoc, false, flatten(outerMat));
	gl.drawArrays( gl.TRIANGLE_FAN, 0, lengthCircle);

    // ctm for inner circle
    var scalingInner = 0.25;

    var scalingInnerMat = scalem(scalingInner, scalingInner, scalingInner);
    innerMat = mat4();
    innerMat = mult(scalingInnerMat, innerMat);
    innerMat = mult(pm, innerMat);

    // draw white circle
    gl.uniform4fv(u_colorLoc, vec4(1.0, 1.0, 1.0, 1.0));
    gl.uniformMatrix4fv(u_ctMatrixLoc, false, flatten(innerMat));
    gl.drawArrays( gl.TRIANGLE_FAN, 0, lengthCircle);

    // ctm for logo 
    var scalingLogo = 0.3;

    var scalingLogoMat = scalem(scalingLogo, scalingLogo, scalingLogo);
    logoMat = mat4();
    logoMat = mult(scalingLogoMat, logoMat);
    logoMat = mult(pm, logoMat);

    // draw ND logo
    gl.uniform4fv(u_colorLoc, vec4(0.0, 0.0, 0.8, 1.0));
    gl.uniformMatrix4fv(u_ctMatrixLoc, false, flatten(logoMat));
    for (var i = 0; i<triangle_vertices_index.length; i++){
        gl.drawArrays( gl.TRIANGLES, lengthCircle + (i*3), 3);
        //console.log(vertices[lengthCircle]);
    }

    // ctm for center circle
    var scalingCenter = 0.01;

    var scalingCenterMat = scalem(scalingCenter, scalingCenter, scalingCenter);
    centerMat = mat4();
    centerMat = mult(scalingCenterMat, centerMat);
    centerMat = mult(pm, centerMat);

    //draw center circle
    gl.uniform4fv(u_colorLoc, vec4(0.85, 0.65, 0.125, 1.0));
    gl.uniformMatrix4fv(u_ctMatrixLoc, false, flatten(centerMat));
    gl.drawArrays( gl.TRIANGLE_FAN, 0, lengthCircle);

    // ctm for hour ticks
    var theta = 0.0;
    for (var i = 0; i < 12; i++) {
        var scalingHourTicks_width = 0.2;
        var scalingHourTicks = 0.1;
        // scale square to be rectangle
        var scalingHourTicksMat = scalem(scalingHourTicks_width, 1.0, 1.0);

        hourTicksMat = mat4();
        // scale rectangle to be small
        hourTicksMat = mult(scalingHourTicksMat, hourTicksMat);
        scalingHourTicksMat = scalem(scalingHourTicks, scalingHourTicks, scalingHourTicks);
        hourTicksMat = mult(scalingHourTicksMat, hourTicksMat);

        // translate rectangle
        var transHour = 0.7;

        var transHourMat = translate(0.0, transHour, 0.0);
        hourTicksMat = mult(transHourMat, hourTicksMat);

        // rotate tick
        theta += 30;

        var rotateHourMat = rotateZ(-theta);
        hourTicksMat = mult(rotateHourMat, hourTicksMat);

        hourTicksMat = mult(pm, hourTicksMat);

        hourMarkersMats.push(hourTicksMat);
    }

    // draw hour ticks
    for (var i = 0; i < hourMarkersMats.length; i++) {
        gl.uniform4fv(u_colorLoc, vec4(0.0, 0.0, 0.8, 1.0));
        gl.uniformMatrix4fv(u_ctMatrixLoc, false, flatten(hourMarkersMats[i]));
        gl.drawArrays( gl.TRIANGLE_FAN, lengthCircle+lengthLogo, lengthTick);
    }

    // ctm for minute ticks
    theta = 0.0;
    for (var i = 0; i < 60; i++) {
        var scalingMinuteTicks_width = 0.2;
        var scalingMinuteTicks_height = 0.4;
        var scalingMinuteTicks = 0.1;
        // scale square to be rectangle
        var scalingMinuteTicksMat = scalem(scalingMinuteTicks_width, scalingMinuteTicks_height, 1.0);

        minuteTicksMat = mat4();
        // scale rectangle to be small
        minuteTicksMat = mult(scalingMinuteTicksMat, minuteTicksMat);
        scalingMinuteTicksMat = scalem(scalingMinuteTicks, scalingMinuteTicks, scalingMinuteTicks);
        minuteTicksMat = mult(scalingMinuteTicksMat, minuteTicksMat);

        // translate rectangle
        var transMin = 0.73;

        var transMinMat = translate(0.0, transMin, 0.0);
        minuteTicksMat = mult(transMinMat, minuteTicksMat);

        // rotate tick
        theta += 6;

        var rotateMinuteMat = rotateZ(-theta);
        minuteTicksMat = mult(rotateMinuteMat, minuteTicksMat);

        minuteTicksMat = mult(pm, minuteTicksMat);

        minuteMarkersMats.push(minuteTicksMat);
    }

    // draw minute ticks
    for (var i = 0; i < minuteMarkersMats.length; i++) {
        gl.uniform4fv(u_colorLoc, vec4(0, 0, 0.8, 1.0));
        gl.uniformMatrix4fv(u_ctMatrixLoc, false, flatten(minuteMarkersMats[i]));
        gl.drawArrays( gl.TRIANGLE_FAN, lengthCircle+lengthLogo, lengthTick);
    }

    //________________________________________________________________
    // draw animated hands
    var date = new Date();

    // get date
    var hour = date.getHours();
    var minute = date.getMinutes();
    var second = date.getSeconds();

    if (hour > 12) {
        hour = hour - 12;
    }

    // draw second hand
    var scalingSecond_width = 0.008;
    var scalingSecond = 0.65;

    // scale square to be rectangle
    var scalingSecondMat = scalem(scalingSecond_width, scalingSecond, 1.0);
    var SecondMat = mat4();
    SecondMat = mult(scalingSecondMat, SecondMat);
   
    // translate second hand
    var transSecond = 0.3;
    var transSecondMat = translate(0.0, transSecond, 0.0);
    SecondMat = mult(transSecondMat, SecondMat);

    // rotate based on seconds
    var thetaSecond = (6 * second);
    var rotateSecondMat = rotateZ(-thetaSecond);
    SecondMat = mult(rotateSecondMat, SecondMat);

    SecondMat = mult(pm, SecondMat);

    gl.uniform4fv(u_colorLoc, vec4(0.85, 0.65, 0.125, 1.0));
    gl.uniformMatrix4fv(u_ctMatrixLoc, false, flatten(SecondMat));
    gl.drawArrays( gl.TRIANGLE_FAN, lengthCircle+lengthLogo, lengthTick);


    // draw minute hand
    var scalingMinute_width = 0.013;
    var scalingMinute = 0.50;

    // scale square to be rectangle
    var scalingMinuteMat = scalem(scalingMinute_width, scalingMinute, 1.0);
    var MinuteMat = mat4();
    MinuteMat = mult(scalingMinuteMat, MinuteMat);

    // translate Minute hand
    var transMinute = 0.25;
    var transMinuteMat = translate(0.0, transMinute, 0.0);
    MinuteMat = mult(transMinuteMat, MinuteMat);

    // rotate based on minutes and seconds
    var secondsBetween = second / 60;
    var thetaMin = (6 * minute) + secondsBetween * 6;
    var rotateMinuteMat = rotateZ(-thetaMin);
    MinuteMat = mult(rotateMinuteMat, MinuteMat);

    MinuteMat = mult(pm, MinuteMat);

    gl.uniform4fv(u_colorLoc, vec4(0.85, 0.65, 0.125, 1.0));
    gl.uniformMatrix4fv(u_ctMatrixLoc, false, flatten(MinuteMat));
    gl.drawArrays( gl.TRIANGLE_FAN, lengthCircle+lengthLogo, lengthTick);

    // draw hour hand
    var scalingHour_width = 0.02;
    var scalingHour = 0.30;
    // scale square to be rectangle
    var scalingHourMat = scalem(scalingHour_width, scalingHour, 1.0);
    var HourMat = mat4();
    HourMat = mult(scalingHourMat, HourMat);

    // translate Hour hand
    var transHour = 0.17;
    var transHourMat = translate(0.0, transHour, 0.0);
    HourMat = mult(transHourMat, HourMat);

    // rotate Hour hand based on minutes and seconds
    var minutesBetween = minute / 12;
    var thetaHour = (30 * hour) + (minutesBetween * 6);
    var rotateHourMat = rotateZ(-thetaHour);
    HourMat = mult(rotateHourMat, HourMat);

    HourMat = mult(pm, HourMat);

    gl.uniform4fv(u_colorLoc, vec4(0.85, 0.65, 0.125, 1.0));
    gl.uniformMatrix4fv(u_ctMatrixLoc, false, flatten(HourMat));
    gl.drawArrays( gl.TRIANGLE_FAN, lengthCircle+lengthLogo, lengthTick);

    window.requestAnimFrame(render);

}

function circles() {
    // Draw outer circle
    var theta = 0;
    lengthCircle = 1;
    
    vertices = [vec3(0.0,0.0,0.0)];
    
    for (var i = 0; i < 37; i++){
        vertices.push(vec3(Math.cos((theta*Math.PI) / 180) * radius, 
            (Math.sin((theta*Math.PI)/180) * radius),0.0));
            theta = theta + 10;
            lengthCircle++;
    }
}

function logo() {
    lengthLogo = 0;
    triangles = [[-0.622973333333,0.828643333333,0.0], // 0
                [-0.266306666667,0.828643333333,0.0],
                [-0.06964,0.51531,0.0],
                [0.407026666667,0.51531,0.0],
                [0.407026666667,0.591976666667,0.0],
                [0.277026666667,0.59531,0.0],
                [0.277026666667,0.828643333333,0.0],
                [0.777026666667,0.828643333333,0.0],
                [0.777026666667,0.59531,0.0],
                [0.64036,0.594133333333,0.0],
                [0.64036,0.517466666667,0.0],
                [0.767026666667,0.508643333333,0.0],
                [0.943693333333,0.32531,0.0],
                [0.95036,-0.28469,0.0],
                [0.76036,-0.478023333333,0.0],
                [0.637026666667,-0.481356666667,0.0],
                [0.637026666667,-0.81469,0.0],
                [0.40036,-0.818023333333,0.0],
                [0.20036,-0.481356666667,0.0],
                [-0.262973333333,-0.478023333333,0.0],
                [-0.262973333333,-0.601356666667,0.0],
                [-0.142973333333,-0.608023333333,0.0],
                [-0.142973333333,-0.81469,0.0],
                [-0.622973333333,-0.818023333333,0.0],
                [-0.622973333333,-0.608023333333,0.0],
                [-0.472973333333,-0.60018,0.0],
                [-0.472973333333,-0.48018,0.0],
                [-0.926306666667,-0.478023333333,0.0],
                [-0.926306666667,-0.281356666667,0.0],
                [-0.80964,-0.27469,0.0],
                [-0.80964,0.301976666667,0.0],
                [-0.926306666667,0.308643333333,0.0],
                [-0.926306666667,0.50531,0.0],
                [-0.46964,0.51531,0.0],
                [-0.46964,0.591976666667,0.0],
                [-0.622973333333,0.591976666667,0.0],
                [-0.58964,0.30531,0.0],
                [-0.47616,0.30531,0.0],
                [-0.47616,-0.278023333333,0.0],
                [-0.58964,-0.271356666667,0.0],
                [-0.259493333333,0.301976666667,0.0],
                [0.0805066666667,-0.278023333333,0.0],
                [-0.259493333333,-0.27469,0.0],
                [0.0570266666667,0.301976666667,0.0],
                [0.407173333333,0.301976666667,0.0],
                [0.407173333333,-0.27469,0.0],
                [0.637173333333,0.30531,0.0],
                [0.70036,0.30531,0.0],
                [0.76036,0.23531,0.0],
                [0.757026666667,-0.218023333333,0.0],
                [0.70036,-0.281356666667,0.0],
                [0.63384,-0.27469,0.0] // 51
                ];

    triangle_vertices_index = [
                 [0, 35, 34],
                 [0,  1, 34],
                 [1,  34,  2],
                 [34, 33,  2],
                 [3,  4,  10],
                 [9,  4,  10],
                 [6,  5,   8],
                 [6,  7,   8],
                 [32, 31, 47],
                 [32, 11, 47],
                 [47, 11, 48],
                 [11, 48, 12],
                 [12, 48, 13],
                 [48, 49, 13],
                 [49, 13, 14],
                 [49, 50, 14],
                 [50, 14, 27],
                 [28, 27, 50],
                 [29, 30, 39],
                 [30, 36, 39],
                 [38, 37, 42],
                 [37, 40, 42],
                 [40, 41, 43],
                 [43, 41, 45],
                 [45, 44, 51],
                 [44, 46, 51],
                 [26, 25, 20],
                 [26, 19, 20],
                 [24, 21, 22],
                 [24, 23, 22],
                 [18, 15, 17],
                 [15, 17, 16]
                 ];

    // create triangle vertices
    for (var i = 0; i < triangle_vertices_index.length; i++) {
        for (var j = 0; j < 3; j++) {
            vertices.push(triangles[triangle_vertices_index[i][j]]);
            lengthLogo++;
        }
    }
}

function ticks() {
    lengthTick = 4;
    /*vertices.push(vec3(-0.15, 0.5));
    vertices.push(vec3(0.15, 0.5));
    vertices.push(vec3(0.15, -0.5));
    vertices.push(vec3(-0.15, -0.5));
    */
    vertices.push(vec3(-0.5, 0.5));
    vertices.push(vec3(0.5, 0.5));
    vertices.push(vec3(0.5, -0.5));
    vertices.push(vec3(-0.5, -0.5));
}

