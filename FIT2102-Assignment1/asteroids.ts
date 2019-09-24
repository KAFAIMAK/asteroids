// FIT2102 2019 Assignment 1
// https://docs.google.com/document/d/1Gr-M6LTU-tfm4yabqZWJYg-zTjEVqHKKTCvePGCYsUA/edit?usp=sharing

/**@author: Megan Ooi*/
function asteroids() {
  // Inside this function you will use the classes and functions 
  // defined in svgelement.ts and observable.ts
  // to add visuals to the svg element in asteroids.html, animate them, and make them interactive.
  // Study and complete the Observable tasks in the week 4 tutorial worksheet first to get ideas.

  // You will be marked on your functional programming style
  // as well as the functionality that you implement.
  // Document your code!  
  // Explain which ideas you have used ideas from the lectures to 
  // create reusable, generic functions.

  /**
   * Design rationale
   * 
   * In this assignment, I used the Observable stream to observe keyboard events with causes the player's ship to move and shoot bullets. 
   * In order to take in more than one keypress, I filtered the repeat property when it is false (which indicates that it is no longer held down
   * repeatedly) and flatMap is used where the output is flattened into the existing Observable stream. 
   * 
   * A main timer called timerInterval which uses the interval function of Observable is used to serve as a clock that ticks. It also maps the 
   * asteroid game's stats which include the lives and scores to the timerInterval. 
   * 
   * The main timer checks repeatedly every 5 ms if there are collisions between elements such as the asteroids, bullets and spaceship. 
   * To detect for collisions between the player's bullets and asteroids, it uses forEach to loop through both lists and then uses an if statement 
   * to check if a collision has occured. The if statement is pure as it is restricted to the Observable's subscribe function. 
   * 
   * The main timer also checks if there are collisions between the player's spaceship and the enemy spaceship's bullets or with an asteroid. 
   * It uses the Observable's scan function to update the player's lives and it is displayed on the HTML page. If a collision has occurred, 
   * the game resets. The splice function is used to clear the lists which mutates the variable and is impure. However, it is contained in the
   * Observable's subscribe function. 
   * 
   * The challenge was to ensure that all functions are pure which means that there are no side effects. The code that I have written however, 
   * is not completely pure as there are mutable variables required for elements in the game to move such as the x, y, speed and angle attributes. 
   * Furthermore, lists are used to store references of the asteroids and bullets in the game. This is required to detect collisions between bullets
   * and asteroids. I minimised the usage of mutable variables whereby it is only present in the code because it is required to model more complex 
   * features in the cleanest way possible.
   * 
   * Side-effects in the code have been minimised. For example, impure functions that return void are only used to display the game over message, 
   * score and lives on the HTML page. Furthermore, side effects are also restricted to the Observable's subscribe function. The code is reusable 
   * whereby it can be seen that the timerInterval Observable, setters, getters and functions ie. isCollision, moveAsteroids have been reused by 
   * several other functions. To adhere to the FRP style, I applied functional programming principles learnt in lectures such as filter and map
   * in my code. Lastly, the parameter and function return types have been specified to ensure that the code is Typesafe.
   * 
   * Additional file to find out about the extra features implemented: asteroids-ext.html
   */

  const svg = document.getElementById("canvas")!, 
  //get the bounds of the canvas
  bbox = svg.getBoundingClientRect(),

  //keyboard Observable events. keydown - key press, keyup - key release
  keydown = Observable.fromEvent<KeyboardEvent>(document, "keydown"),
  keyup = Observable.fromEvent<KeyboardEvent>(document, "keyup"),

  //getters namely: x,y,speed,angle attributes
  getx = (obj:Elem):number => Number(obj.attr("x")),
  gety = (obj:Elem):number => Number(obj.attr("y")),
  getSpeed = (obj:Elem):number => Number(obj.attr("speed")),
  getAngle = (obj:Elem):number => Number(obj.attr("angle")),
  
  //array to store large and small asteroids
  largeAsteroids: Elem[] = [], smallAsteroids: Elem[] = [], 
  //array to store spaceship bullets and enemy's bullets
  spaceshipBullets: Elem[] = [], enemyBullets: Elem[] = [];

  //set angle of the svg Elem
  const setAngle = (obj:Elem, shift:number):Elem => {obj.attr("angle", Number(obj.attr("angle")) + shift); return obj;}

  //the stats of the asteroid game
  const asteroidStats = {lives: 3, score: 0};

  // make a group for the spaceship and a transform to move it and rotate it
  // to animate the spaceship you will update the transform property
  let g = new Elem(svg,'g')
    .attr("transform","translate(300 300) rotate(0)");
  
  // create a polygon shape for the space ship as a child of the transform group
  let spaceship = new Elem(svg, 'polygon', g.elem) 
    .attr("points","-9,12 9,12 0,-12")
    .attr("style","fill:grey;stroke:white;stroke-width:1")
    .attr("x", 0).attr("y", 0).attr("angle", 0).attr("speed", 5);

  //create a triangle for the enemy spaceship to attack the player's spaceship
  let enemyShip = new Elem(svg, 'polygon', g.elem) 
    .attr("points","-9,12 9,12 0,-12")
    .attr("style","fill:orange;stroke:white;stroke-width:1")
    .attr("transform","translate(" + 150 + " " + -250 + ")" + "rotate(" + String(180) + ")")  
    .attr("x", 150).attr("y", -250).attr("angle", 180).attr("speed", 20);

  //create bullets for the spaceship
  function createBullet(x:number, y:number ,angle:number):Elem {
    return new Elem(svg, 'circle', g.elem)
    // Set bullet properties
    .attr("r", 3).attr("cx", 3).attr("cy", 3)
    .attr("style","fill:white;stroke:white;stroke-width:1")
    .attr("speed", 5)
    .attr("x", x).attr("y", y).attr("angle", angle)
    .attr("transform", "translate(" + x + " " + y + ") rotate(" + angle + ")");
  }

  //create asteroids in the game
  //create large asteroid
  function createLargeAsteroid():Elem {
    const randAngle = Math.floor(Math.random() * 360), randx = (Math.random()*2-1)*300, randy = (Math.random()*2-1)*300;
    return new Elem(svg, 'polygon', g.elem)
    //set atttributes for the large asteroid
    .attr("points", "36,0 72,20.83 72,62.5 36,83.3 0,62.53 0,20.83")
    .attr("style","fill-opacity:0;stroke:white;stroke-width:2")
    .attr("speed", 4)
    .attr("x", randx).attr("y", randy)
    .attr("transform","translate(" + String(randx) + " " + String(randy) + ")" + "rotate(" + String(randAngle) + ")")  
    .attr("angle", randAngle);
  }

  //create small asteroid
  function createSmallAsteroid(x:number, y:number):Elem {
    const randAngle = Math.floor(Math.random() * 360)
    return new Elem(svg, 'polygon', g.elem)
    //set atttributes for the small asteroid
    .attr("points", "25,12.5 43,22.91 43,43.75 25,54.15 7,43.765 7,22.91")
    .attr("style","fill-opacity:0;stroke:red;stroke-width:2")
    .attr("speed", 3)
    .attr("x", x).attr("y", y)
    .attr("transform","translate(" + String(x) + " " + String(y) + ")" + "rotate(" + String(randAngle) + ")")  
    .attr("angle", randAngle);
  }

  //create particles to mimic an explosion
  function createParticle(x:number, y:number ,angle:number):Elem {
    return new Elem(svg, 'circle', g.elem)
    //set bullet properties
    .attr("r", 3).attr("cx", 3).attr("cy", 3)
    .attr("style","stroke:white;stroke-width:1")
    .attr("speed", 5).attr("speed", 5)
    .attr("x", x).attr("y", y).attr("angle", angle);
  }

  //set x and y positions of the object with wrapping around the edges of the canvas  
  //if the element reaches the border of the canvas, it will appear on the other side
  function setxyWrap(obj:Elem):Elem {
    const x = getx(obj) + getSpeed(obj) * Math.cos((getAngle(obj)-90)*Math.PI/180);
    const y = gety(obj) + getSpeed(obj) * Math.sin((getAngle(obj)-90)*Math.PI/180);
    x > 0? x > bbox.width/2? obj.attr("x", x-bbox.width): obj.attr("x", x): x < -bbox.width/2? obj.attr("x", x+bbox.width): obj.attr("x", x);
    y > 0? y > bbox.width/2? obj.attr("y", y-bbox.width): obj.attr("y", y): y < -bbox.width/2? obj.attr("y", y+bbox.width): obj.attr("y", y);
    return obj;
  }

  //set the x and y positions with no wrapping around the svg canvas
  function setxyNoWrap(obj:Elem):Elem {
    obj.attr("x", getx(obj) + getSpeed(obj) * Math.cos((getAngle(obj)-90)*Math.PI/180))
    .attr("y",gety(obj) + getSpeed(obj) * Math.sin((getAngle(obj)-90)*Math.PI/180))
    return obj;
  }
  
  //calculate distance to determine if a collision has occurred
  function isCollision(a:Elem, b:Elem):boolean {
    const a1 = a.elem.getBoundingClientRect(), b1 = b.elem.getBoundingClientRect()
    return !(b1.left > a1.right || 
      b1.right < a1.left || 
      b1.top > a1.bottom ||
      b1.bottom < a1.top);
  } 

  //timer where the Observable stream fires in the interval of every 5 ms and functions as a clock
  const timerInterval = Observable.interval(5).map(_ => asteroidStats);

  //keyboard events
  //rotate left
  keydown.map(e => ({keyCode: e.keyCode, repeat: e.repeat}))
    .filter(({keyCode, repeat}) => keyCode === 37 && repeat == false)
    .flatMap(() => Observable.interval(40).takeUntil(keyup.filter(e => e.keyCode === 37)))
    .subscribe(() => {
      spaceship.attr("transform", "translate(" + getx(spaceship) + " " + gety(spaceship) + ") rotate(" + setAngle(spaceship,-20).attr("angle") + ")")
    });

  //rotate right  
  keydown.map(e => ({keyCode: e.keyCode, repeat: e.repeat}))
  .filter(({keyCode, repeat}) => keyCode === 39 && repeat == false)
  .flatMap(() => Observable.interval(40).takeUntil(keyup.filter(e => e.keyCode === 39)))
  .subscribe(() => {
    spaceship.attr("transform", "translate(" + getx(spaceship) + " " + gety(spaceship) + ") rotate(" + setAngle(spaceship,20).attr("angle") + ")")
  });

  //move straight
  keydown.map(e => ({keyCode: e.keyCode, repeat: e.repeat}))
  .filter(({keyCode, repeat}) => keyCode === 38 && repeat == false)
  .flatMap(() => Observable.interval(50).takeUntil(keyup.filter(e => e.keyCode === 38)))
  .subscribe(() => {
    spaceship.attr("transform", "translate(" + setxyWrap(spaceship).attr("x") + " " + setxyWrap(spaceship).attr("y") + ") rotate(" + getAngle(spaceship) + ")")
  });

  //press spacebar to shoot
  keydown.map(e => ({keyCode: e.keyCode, repeat: e.repeat}))
  .filter(({keyCode, repeat}) => keyCode === 32 && repeat == false)
  .flatMap(() => Observable.interval(100).takeUntil(keyup.filter(e => e.keyCode === 32)))
  .subscribe(() => { const bullet = createBullet(getx(spaceship), gety(spaceship), getAngle(spaceship));
    spaceshipBullets.push(bullet)
    timerInterval.subscribe(() => 
    bullet.attr("transform","translate(" + setxyNoWrap(bullet).attr("x") + " " 
    + setxyNoWrap(bullet).attr("y") + ") rotate(" + getAngle(bullet) + ")"))});
  
  //generate large asteroids
  Observable.interval(2000)
  //limit the number of large asteroids in the game to only 3 to prevent cluttering
    .filter(_ => largeAsteroids.length < 3)
    .map(_ => moveAsteroids(createLargeAsteroid()))
    //store the reference of the large asteroid generated in an array 
    .subscribe(x => largeAsteroids.push(x))

  //move the enemy ship
  Observable.interval(40)
  .map(_ => {const x = getx(enemyShip) + getSpeed(enemyShip);
    //detects if the enemy ship hits the side of the canvas. when it does, its speed changes. this allows the enemy ship to move at a "random" speed
  x > 0? x > bbox.width/2? enemyShip.attr("speed", -getSpeed(enemyShip)*Math.random()-5): enemyShip.attr("x", x): x < -bbox.width/2? 
  enemyShip.attr("speed", -getSpeed(enemyShip)*Math.random()+5) : enemyShip.attr("x", x+bbox.width)
  enemyShip.attr("x",x)
  .attr("transform","translate(" + x + " " 
  + gety(enemyShip) + ") rotate(" + getAngle(enemyShip) + ")")})
  .subscribe(_ => {})

  //enemy ship shooting player's spaceship
  Observable.interval(500).map(_ => createBullet(getx(enemyShip), gety(enemyShip), getAngle(enemyShip)))
  .subscribe(bullet => {enemyBullets.push(bullet); bullet.attr("style","fill:yellow;stroke:red;stroke-width:1")
    Observable.interval(10).subscribe(_ => bullet.attr("transform","translate(" + setxyNoWrap(bullet).attr("x") + " " 
  + setxyNoWrap(bullet).attr("y") + ") rotate(" + getAngle(bullet) + ")"))})

  //check large asteroid and spaceship bullet collide  
  //breaks down large asteroid into smaller asteroids
  timerInterval.map(_ => largeAsteroids.forEach(asteroid => spaceshipBullets.forEach(bullet => 
  {if (isCollision(asteroid,bullet)) {
    //impure code used to remove references of the bullet and large asteroid that have collided
    spaceshipBullets.splice(spaceshipBullets.indexOf(bullet),1)
    largeAsteroids.splice(largeAsteroids.indexOf(asteroid),1)
    //remove the large asteroid from the canvas
    asteroid.elem.remove()
    //create a few small asteroids
    Observable.interval(1)
    .map(x => x+1)
    .takeUntil(Observable.interval(3).filter(x => x < 5))
    .map(_ => moveAsteroids(createSmallAsteroid(getx(asteroid), gety(asteroid))))
    .subscribe(smallAsteroid => smallAsteroids.push(smallAsteroid))
    //mimic particle explosion after the bullet collides with the asteroid
    Observable.interval(1)
    .map(x => x+1)
    .takeUntil(Observable.interval(4).filter(x => x < 5))
    .subscribe(_ => particlesMove(createParticle(getx(asteroid), gety(asteroid), Math.random()*360)))
    //increment the player's score by 1
    score(asteroidStats.score += 1)
    }
  }))).subscribe(_ => {})

  //check small asteroid and spaceship bullet collide  
  //destroys small asteroids
  timerInterval.map(_ => smallAsteroids.forEach(asteroid => spaceshipBullets.forEach(bullet => 
    {if (isCollision(asteroid,bullet)) {
      //impure code used to remove references of the bullet and small asteroid that have collided
      spaceshipBullets.splice(spaceshipBullets.indexOf(bullet),1)
      smallAsteroids.splice(smallAsteroids.indexOf(asteroid),1)
      //remove the small asteroid from the canvas
      asteroid.elem.remove()
      //mimic particle explosion after the bullet collides with the asteroid
      Observable.interval(1)
      .map(x => x+1)
      .takeUntil(Observable.interval(4).filter(x => x < 5))
      .subscribe(_ => particlesMove(createParticle(getx(asteroid), gety(asteroid), Math.random()*360)))
      //increment the player's score by 2
      score(asteroidStats.score += 2)
    }
  }))).subscribe(_ => {})

  //check asteroids/enemy bullets/enemy spaceship collide with player's spaceship
  //updates the player's lives and resets the game when there is a collision
  Observable.interval(1).takeUntil(Observable.interval(10000).filter(_ => asteroidStats.lives == 0))
  //check if the spaceship has collided with asteroids or the enemy's bullet(s) by using filter. if yes, update lives
  //scan is used as it stores the previous result of the number of lives in the game
  .scan(asteroidStats.lives, lives => largeAsteroids.filter(x => isCollision(x,spaceship)).length > 0|| 
    smallAsteroids.filter(y => isCollision(y,spaceship)).length > 0 || enemyBullets.filter(z => isCollision(z, spaceship)).length > 0? 
  asteroidStats.lives-1: lives)
  //if there is a collision, the number of lives will be less than the number of lives in asteroidStats
  .map((lives) => { if (lives < asteroidStats.lives) {
    //reset the game
    //remove all the asteroids present in the canvas
    //impure code as it mutates the array of asteroids by using splice to remove all the references to the asteroids in the previous round
    enemyBullets.splice(0, enemyBullets.length)
    largeAsteroids.forEach(x => x.elem.remove())
    smallAsteroids.forEach(x => x.elem.remove())
    largeAsteroids.splice(0, largeAsteroids.length)
    smallAsteroids.splice(0, smallAsteroids.length)
    //update the number of lives in asteroidStats
    asteroidStats.lives -= 1
    //update lives on the HTML page
    lives_HTML(lives)
    //check if there are lives left. if there are no lives, display game over
    lives? spaceship.attr("transform","translate(" + 0 + " " + 0 + ") rotate(" + getAngle(spaceship) + ")")
    .attr("x", 0).attr("y", 0).attr("angle", getAngle(spaceship)).attr("speed", 5): gameOver(spaceship)
  }}).subscribe(_ => {})
    
  //function for the asteroids to move in the game
  function moveAsteroids(asteroid:Elem):Elem {
    Observable.interval(80).subscribe(() => 
    asteroid.attr("transform","translate(" + setxyWrap(asteroid).attr("x") + " " 
    + setxyWrap(asteroid).attr("y") + ") rotate(" + getAngle(asteroid) + ")"));
    return asteroid;
  }

  //function for the particles to move in the game
  function particlesMove(particle:Elem):Elem {
    Observable.interval(80).subscribe(() => 
    particle.attr("transform","translate(" + setxyNoWrap(particle).attr("x") + " " 
    + setxyNoWrap(particle).attr("y") + ") rotate(" + getAngle(particle) + ")"));
    return particle;
  }

  //impure function that is used to display the player's score on the HTML page
  function score(playerScore:number):void {
    const score:HTMLElement = document.getElementById("score")!;
    score.innerHTML = `score: ${playerScore}`;
  }

  //impure function that is used to display the number of lives on the HTML page
  function lives_HTML(playerLives:number):void {
    const score:HTMLElement = document.getElementById("lives")!;
    score.innerHTML = `lives: △x${playerLives}`;
  }

  //impure function that is used to display game over on the HTML page and removes the spaceship
  //it refreshes the page automatically after 1s
  function gameOver(spaceship:Elem):void {
    const gameOver:HTMLElement = document.getElementById("gameOver")!;
    gameOver.innerHTML = `GAME OVER<br>score: ${asteroidStats.score}`;
    lives_HTML(0);
    Observable.interval(1000)
    //refresh the page
    .subscribe(_ => document.location.reload())
    spaceship.elem.remove();
  }
}

// the following simply runs your asteroids function on window load.  Make sure to leave it in place.
if (typeof window != 'undefined')
  window.onload = ()=>{
    asteroids();
  }