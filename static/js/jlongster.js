var requestAnimFrame = (function(){
    return window.requestAnimationFrame    ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame    ||
        window.oRequestAnimationFrame      ||
        window.msRequestAnimationFrame     ||
        function(callback){
            window.setTimeout(callback, 1000/60);
        };
})();

// Canvas Variables
var canvas = document.createElements('canvas'),
    ctx = canvas.getContext('2d'),
    canvas.width = 512,
    canvas.height = 480;
document.body.appendChild(canvas);

// Main Game Loop
var lastTime;
function main(){
    var now = Date.now(),
        dt = (now - lastTime) / 1000.0;
    update(dt);
    render();
    lastTime = now;
    requestAnimFrame(main);
};
