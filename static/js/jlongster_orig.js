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
var canvas = document.createElement('canvas'),
    ctx = canvas.getContext('2d');
canvas.width = 512;
canvas.height = 480;
document.body.appendChild(canvas);
// Load Resources
resources.load([
        '/static/img/sprites.png',
        '/static/img/terrain.png'
        ]);
resources.onReady(init);
// Application Variables
var player = {
    pos: [0, 0],
    sprite: new Sprite('/static/img/sprites.png', [0,0], [39,39], 16, [0, 1])
    },
    bullets = [],
    enemies = [],
    explosions = [],
    lastFire = Date.now(),
    gameTime = 0,
    isGaveOver,
    terrainPattern,
    score = 0,
    scoreEl = document.getElementById('score'),
    playerSpeed = 200,
    bulletSpeed = 500,
    enemySpeed = 100;
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
// Init
function init(){
    terrainPattern = ctx.createPattern(resources.get('/static/img/terrain.png'), 'repeat');
    document.getElementById('play_again')
        .addEventListener('click', function(){ reset(); });
    reset();
    lastTime = Date.now();
    main();
};
// Update Game Objects
function update(dt){
    gameTime += dt;
    handleInput(dt);
    updateEntities(dt);
    // Increase difficulty over time - 1-.993^gameTime
    if(Math.random() < 1 - Math.pow(.993, gameTime)){
        enemies.push({
            pos: [canvas.width,
                  Math.random() * (canvas.height - 39)],
            sprite: new Sprite('/static/img/sprites.png',
                [0, 78],
                [80, 39],
                6,
                [0, 1, 2, 3, 2, 1])
        });
    }
    checkCollisions();
    scoreEl.innerHTML = score;
};
// Handle Input
function handleInput(dt){
    // Movement
    if(input.isDown('DOWN') || input.isDown('s')){
        player.pos[1] += playerSpeed * dt;
    }
    if(input.isDown('UP') || input.isDown('w')){
        player.pos[1] -= playerSpeed * dt;
    }
    if(input.isDown('LEFT') || input.isDown('a')){
        player.pos[0] -= playerSpeed * dt;
    }
    if(input.isDown('RIGHT') || input.isDown('d')){
        player.pos[0] += playerSpeed * dt;
    }
    // Fire
    if(input.isDown('SPACE') && !isGameOver && ((Date.now() - lastFire) > 100)){
        var x = player.pos[0] + player.sprite.size[0] / 2,
            y = player.pos[1] + player.sprite.size[1] / 2;
        bullets.push({ pos: [x, y],
                       dir:' forward',
                       sprite: new Sprite('/static/img/sprites.png', [0,39], [18,8]) });
        bullets.push({ pos: [x, y],
                       dir: 'up',
                       sprite: new Sprite('/static/img/sprites.png', [0,50], [9,5]) });
        bullets.push({ pos: [x, y],
                       dir: 'down',
                       sprite: new Sprite('/static/img/sprites.png', [0,60], [9,5]) });
        lastFire = Date.now();
    }
};
// Update Entities
function updateEntities(dt){
    // Player
    player.sprite.update(dt);
    // Bullets
    for(var i=0; i<bullets.length; i++){
        var bullet = bullets[i];
        switch(bullet.dir){
            case 'up': bullet.pos[1] -= bulletSpeed * dt; break;
            case 'down': bullet.pos[1] += bulletSpeed * dt; break;
            default:
                bullet.pos[0] += bulletSpeed * dt;
        }
        // Remove Offscreen bullets
        if(bullet.pos[1] < 0 || bullet.pos[1] > canvas.height ||
            bullet.pos[0] > canvas.width){
            bullets.splice(i, 1);
            i--;
        }
    }
    // Enemies
    for(var i=0; i<enemies.length; i++){
        enemies[i].pos[0] -= enemySpeed * dt;
        enemies[i].sprite.update(dt);
        // Remove Offscrean enemies
        if(enemies[i].pos[0] + enemies[i].sprite.size[0] < 0){
            enemies.splice(i, 1);
            i--;
        }
    }
    // Explosions
    for(var i=0; i<explosions.length; i++){
        explosions[i].sprite.update(dt);
        // Remove Finished explosions
        if(explosions[i].sprite.done){
            explosions.splice(i, 1);
            i--;
        }
    }
};
// Collisions
function collides(x, y, r, b, x2, y2, r2, b2){
    return !(r <= x2 || x > r2 ||
             b <= y2 || y > b2);
};
function boxCollides(pos, size, pos2, size2){
    return collides(pos[0], pos[1],
        pos[0] + size[0], pos[1] + size[1],
        pos2[0], pos2[1],
        pos2[0] + size[2], pos2[1] + size2[1]);
};
function checkCollisions(){
    checkPlayerBounds();
    // Collision Detection for enemies/bullets
    for(var i=0; i<enemies.length; i++){
        var pos = enemies[i],pos,
            size = enemies[i].sprite.size;
        for(var j=0; j<bullets.length; j++){
            var pos2 = bullets[j].pos,
                size2 = bullets[j].sprite.size;
            if(boxCollides(pos, size, pos2, size2)){
                // Enemy Hit
                enemies.splice(i, 1);
                i--;
                // Score
                score += 100;
                // Explosion Init
                explosions.push({
                    pos: pos,
                    sprite: new Sprite('/static/img/sprites.png',
                        [0, 177],
                        [39, 39],
                        16,
                        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
                        null,
                        true)
                });
                // Remove Bullet + Break Iteration
                bullets.splice(j, 1);
                break;
            }
        }
        // Check if Player Hit
        if(boxCollides(pos, size, player.pos, player.sprite.size)){
            gameOver();
        }
    }
};
function checkPlayerBounds(){
    // Check Bounds
    if(player.pos[0] < 0){ player.pos[0] = 0;
    }else if(player.pos[0] > canvas.width - player.sprite.size[0]){
        player.pos[0] = canvas.width - player.sprite.size[0];
    }
    if(player.pos[1] < 0){ player.pos[1] = 0;
    }else if(player.pos[1] > canvas.height - player.sprite.size[1]){
        player.pos[1] = canvas.height - player.sprite.size[1];
    }
};
// Render
function render(){
    ctx.fillStyle = terrainPattern;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Render player if game isn't over
    if(!gameOver){ renderEntity(player); }
    renderEntities(bullets);
    renderEntities(enemies);
    renderEntities(explosions);
};
function renderEntities(list){
    for(var i=0; i<list.length; i++){
        renderEntity(list[i]);
    }
};
function renderEntity(entity){
    ctx.save();
    ctx.translate(entity.pos[0], entity.pos[1]);
    entity.sprite.render(ctx);
    ctx.restore();
};
// Game Over and Reset
function gameOver(){
    document.getElementById('game_over').style.display = 'block';
    document.getElementById('game_over_overlay').style.display = 'block';
    isGameOver = true;
};
function reset(){
    document.getElementById('game_over').style.display = 'none';
    document.getElementById('game_over_overlay').style.display = 'none';
    isGameOver = false;

    gameTime = 0;
    score = 0;
    enemies = [];
    bullets = [];
    player.pos = [50, canvas.height / 2];
};
