"use strict";
function asteroids() {
    const svg = document.getElementById("canvas"), bbox = svg.getBoundingClientRect(), keydown = Observable.fromEvent(document, "keydown"), keyup = Observable.fromEvent(document, "keyup"), getx = (obj) => Number(obj.attr("x")), gety = (obj) => Number(obj.attr("y")), getSpeed = (obj) => Number(obj.attr("speed")), getAngle = (obj) => Number(obj.attr("angle")), largeAsteroids = [], smallAsteroids = [], spaceshipBullets = [], enemyBullets = [];
    const setAngle = (obj, shift) => { obj.attr("angle", Number(obj.attr("angle")) + shift); return obj; };
    const asteroidStats = { lives: 3, score: 0 };
    let g = new Elem(svg, 'g')
        .attr("transform", "translate(300 300) rotate(0)");
    let spaceship = new Elem(svg, 'polygon', g.elem)
        .attr("points", "-9,12 9,12 0,-12")
        .attr("style", "fill:grey;stroke:white;stroke-width:1")
        .attr("x", 0).attr("y", 0).attr("angle", 0).attr("speed", 5);
    let enemyShip = new Elem(svg, 'polygon', g.elem)
        .attr("points", "-9,12 9,12 0,-12")
        .attr("style", "fill:orange;stroke:white;stroke-width:1")
        .attr("transform", "translate(" + 150 + " " + -250 + ")" + "rotate(" + String(180) + ")")
        .attr("x", 150).attr("y", -250).attr("angle", 180).attr("speed", 20);
    function createBullet(x, y, angle) {
        return new Elem(svg, 'circle', g.elem)
            .attr("r", 3).attr("cx", 3).attr("cy", 3)
            .attr("style", "fill:white;stroke:white;stroke-width:1")
            .attr("speed", 5)
            .attr("x", x).attr("y", y).attr("angle", angle)
            .attr("transform", "translate(" + x + " " + y + ") rotate(" + angle + ")");
    }
    function createLargeAsteroid() {
        const randAngle = Math.floor(Math.random() * 360), randx = (Math.random() * 2 - 1) * 300, randy = (Math.random() * 2 - 1) * 300;
        return new Elem(svg, 'polygon', g.elem)
            .attr("points", "36,0 72,20.83 72,62.5 36,83.3 0,62.53 0,20.83")
            .attr("style", "fill-opacity:0;stroke:white;stroke-width:2")
            .attr("speed", 4)
            .attr("x", randx).attr("y", randy)
            .attr("transform", "translate(" + String(randx) + " " + String(randy) + ")" + "rotate(" + String(randAngle) + ")")
            .attr("angle", randAngle);
    }
    function createSmallAsteroid(x, y) {
        const randAngle = Math.floor(Math.random() * 360);
        return new Elem(svg, 'polygon', g.elem)
            .attr("points", "25,12.5 43,22.91 43,43.75 25,54.15 7,43.765 7,22.91")
            .attr("style", "fill-opacity:0;stroke:red;stroke-width:2")
            .attr("speed", 3)
            .attr("x", x).attr("y", y)
            .attr("transform", "translate(" + String(x) + " " + String(y) + ")" + "rotate(" + String(randAngle) + ")")
            .attr("angle", randAngle);
    }
    function createParticle(x, y, angle) {
        return new Elem(svg, 'circle', g.elem)
            .attr("r", 3).attr("cx", 3).attr("cy", 3)
            .attr("style", "stroke:white;stroke-width:1")
            .attr("speed", 5).attr("speed", 5)
            .attr("x", x).attr("y", y).attr("angle", angle);
    }
    function setxyWrap(obj) {
        const x = getx(obj) + getSpeed(obj) * Math.cos((getAngle(obj) - 90) * Math.PI / 180);
        const y = gety(obj) + getSpeed(obj) * Math.sin((getAngle(obj) - 90) * Math.PI / 180);
        x > 0 ? x > bbox.width / 2 ? obj.attr("x", x - bbox.width) : obj.attr("x", x) : x < -bbox.width / 2 ? obj.attr("x", x + bbox.width) : obj.attr("x", x);
        y > 0 ? y > bbox.width / 2 ? obj.attr("y", y - bbox.width) : obj.attr("y", y) : y < -bbox.width / 2 ? obj.attr("y", y + bbox.width) : obj.attr("y", y);
        return obj;
    }
    function setxyNoWrap(obj) {
        obj.attr("x", getx(obj) + getSpeed(obj) * Math.cos((getAngle(obj) - 90) * Math.PI / 180))
            .attr("y", gety(obj) + getSpeed(obj) * Math.sin((getAngle(obj) - 90) * Math.PI / 180));
        return obj;
    }
    function isCollision(a, b) {
        const a1 = a.elem.getBoundingClientRect(), b1 = b.elem.getBoundingClientRect();
        return !(b1.left > a1.right ||
            b1.right < a1.left ||
            b1.top > a1.bottom ||
            b1.bottom < a1.top);
    }
    const timerInterval = Observable.interval(5).map(_ => asteroidStats);
    keydown.map(e => ({ keyCode: e.keyCode, repeat: e.repeat }))
        .filter(({ keyCode, repeat }) => keyCode === 37 && repeat == false)
        .flatMap(() => Observable.interval(40).takeUntil(keyup.filter(e => e.keyCode === 37)))
        .subscribe(() => {
        spaceship.attr("transform", "translate(" + getx(spaceship) + " " + gety(spaceship) + ") rotate(" + setAngle(spaceship, -20).attr("angle") + ")");
    });
    keydown.map(e => ({ keyCode: e.keyCode, repeat: e.repeat }))
        .filter(({ keyCode, repeat }) => keyCode === 39 && repeat == false)
        .flatMap(() => Observable.interval(40).takeUntil(keyup.filter(e => e.keyCode === 39)))
        .subscribe(() => {
        spaceship.attr("transform", "translate(" + getx(spaceship) + " " + gety(spaceship) + ") rotate(" + setAngle(spaceship, 20).attr("angle") + ")");
    });
    keydown.map(e => ({ keyCode: e.keyCode, repeat: e.repeat }))
        .filter(({ keyCode, repeat }) => keyCode === 38 && repeat == false)
        .flatMap(() => Observable.interval(50).takeUntil(keyup.filter(e => e.keyCode === 38)))
        .subscribe(() => {
        spaceship.attr("transform", "translate(" + setxyWrap(spaceship).attr("x") + " " + setxyWrap(spaceship).attr("y") + ") rotate(" + getAngle(spaceship) + ")");
    });
    keydown.map(e => ({ keyCode: e.keyCode, repeat: e.repeat }))
        .filter(({ keyCode, repeat }) => keyCode === 32 && repeat == false)
        .flatMap(() => Observable.interval(100).takeUntil(keyup.filter(e => e.keyCode === 32)))
        .subscribe(() => {
        const bullet = createBullet(getx(spaceship), gety(spaceship), getAngle(spaceship));
        spaceshipBullets.push(bullet);
        timerInterval.subscribe(() => bullet.attr("transform", "translate(" + setxyNoWrap(bullet).attr("x") + " "
            + setxyNoWrap(bullet).attr("y") + ") rotate(" + getAngle(bullet) + ")"));
    });
    Observable.interval(2000)
        .filter(_ => largeAsteroids.length < 3)
        .map(_ => moveAsteroids(createLargeAsteroid()))
        .subscribe(x => largeAsteroids.push(x));
    Observable.interval(40)
        .map(_ => {
        const x = getx(enemyShip) + getSpeed(enemyShip);
        x > 0 ? x > bbox.width / 2 ? enemyShip.attr("speed", -getSpeed(enemyShip) * Math.random() - 5) : enemyShip.attr("x", x) : x < -bbox.width / 2 ?
            enemyShip.attr("speed", -getSpeed(enemyShip) * Math.random() + 5) : enemyShip.attr("x", x + bbox.width);
        enemyShip.attr("x", x)
            .attr("transform", "translate(" + x + " "
            + gety(enemyShip) + ") rotate(" + getAngle(enemyShip) + ")");
    })
        .subscribe(_ => { });
    Observable.interval(500).map(_ => createBullet(getx(enemyShip), gety(enemyShip), getAngle(enemyShip)))
        .subscribe(bullet => {
        enemyBullets.push(bullet);
        bullet.attr("style", "fill:yellow;stroke:red;stroke-width:1");
        Observable.interval(10).subscribe(_ => bullet.attr("transform", "translate(" + setxyNoWrap(bullet).attr("x") + " "
            + setxyNoWrap(bullet).attr("y") + ") rotate(" + getAngle(bullet) + ")"));
    });
    timerInterval.map(_ => largeAsteroids.forEach(asteroid => spaceshipBullets.forEach(bullet => {
        if (isCollision(asteroid, bullet)) {
            spaceshipBullets.splice(spaceshipBullets.indexOf(bullet), 1);
            largeAsteroids.splice(largeAsteroids.indexOf(asteroid), 1);
            asteroid.elem.remove();
            Observable.interval(1)
                .map(x => x + 1)
                .takeUntil(Observable.interval(3).filter(x => x < 5))
                .map(_ => moveAsteroids(createSmallAsteroid(getx(asteroid), gety(asteroid))))
                .subscribe(smallAsteroid => smallAsteroids.push(smallAsteroid));
            Observable.interval(1)
                .map(x => x + 1)
                .takeUntil(Observable.interval(4).filter(x => x < 5))
                .subscribe(_ => particlesMove(createParticle(getx(asteroid), gety(asteroid), Math.random() * 360)));
            score(asteroidStats.score += 1);
        }
    }))).subscribe(_ => { });
    timerInterval.map(_ => smallAsteroids.forEach(asteroid => spaceshipBullets.forEach(bullet => {
        if (isCollision(asteroid, bullet)) {
            spaceshipBullets.splice(spaceshipBullets.indexOf(bullet), 1);
            smallAsteroids.splice(smallAsteroids.indexOf(asteroid), 1);
            asteroid.elem.remove();
            Observable.interval(1)
                .map(x => x + 1)
                .takeUntil(Observable.interval(4).filter(x => x < 5))
                .subscribe(_ => particlesMove(createParticle(getx(asteroid), gety(asteroid), Math.random() * 360)));
            score(asteroidStats.score += 2);
        }
    }))).subscribe(_ => { });
    Observable.interval(1).takeUntil(Observable.interval(10000).filter(_ => asteroidStats.lives == 0))
        .scan(asteroidStats.lives, lives => largeAsteroids.filter(x => isCollision(x, spaceship)).length > 0 ||
        smallAsteroids.filter(y => isCollision(y, spaceship)).length > 0 || enemyBullets.filter(z => isCollision(z, spaceship)).length > 0 ?
        asteroidStats.lives - 1 : lives)
        .map((lives) => {
        if (lives < asteroidStats.lives) {
            enemyBullets.splice(0, enemyBullets.length);
            largeAsteroids.forEach(x => x.elem.remove());
            smallAsteroids.forEach(x => x.elem.remove());
            largeAsteroids.splice(0, largeAsteroids.length);
            smallAsteroids.splice(0, smallAsteroids.length);
            asteroidStats.lives -= 1;
            lives_HTML(lives);
            lives ? spaceship.attr("transform", "translate(" + 0 + " " + 0 + ") rotate(" + getAngle(spaceship) + ")")
                .attr("x", 0).attr("y", 0).attr("angle", getAngle(spaceship)).attr("speed", 5) : gameOver(spaceship);
        }
    }).subscribe(_ => { });
    function moveAsteroids(asteroid) {
        Observable.interval(80).subscribe(() => asteroid.attr("transform", "translate(" + setxyWrap(asteroid).attr("x") + " "
            + setxyWrap(asteroid).attr("y") + ") rotate(" + getAngle(asteroid) + ")"));
        return asteroid;
    }
    function particlesMove(particle) {
        Observable.interval(80).subscribe(() => particle.attr("transform", "translate(" + setxyNoWrap(particle).attr("x") + " "
            + setxyNoWrap(particle).attr("y") + ") rotate(" + getAngle(particle) + ")"));
        return particle;
    }
    function score(playerScore) {
        const score = document.getElementById("score");
        score.innerHTML = `score: ${playerScore}`;
    }
    function lives_HTML(playerLives) {
        const score = document.getElementById("lives");
        score.innerHTML = `lives: △x${playerLives}`;
    }
    function gameOver(spaceship) {
        const gameOver = document.getElementById("gameOver");
        gameOver.innerHTML = `GAME OVER<br>score: ${asteroidStats.score}`;
        lives_HTML(0);
        Observable.interval(1000)
            .subscribe(_ => document.location.reload());
        spaceship.elem.remove();
    }
}
if (typeof window != 'undefined')
    window.onload = () => {
        asteroids();
    };
//# sourceMappingURL=asteroids.js.map