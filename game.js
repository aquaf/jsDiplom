'use strict';


class Vector {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  plus(vector) {
    if (vector instanceof Vector) {
      let x = vector.x + this.x;
      let y = vector.y + this.y;
      return new Vector(x, y);
    } else {
      throw new Error('Можно прибавлять к вектору только вектор типа Vector');
    }
  }

  times(value) {
    let x = this.x * value;
    let y = this.y * value;
    return new Vector(x, y);
  }
}

class Actor {
  constructor(pos = new Vector(0, 0), size = new Vector(1, 1), speed = new Vector(0, 0)) {
    if (!(pos instanceof Vector) || !(size instanceof Vector) || !(speed instanceof Vector)) {
      throw new Error('Один из переданных объектов не является объектом класса Vector');
    }
    this.pos = pos;
    this.size = size;
    this.speed = speed;
  }

  act() {}

  get type() {
    return 'actor';
  }
  get left() {
    return this.pos.x;
  }
  get right() {
    return this.pos.x + this.size.x;
  }
  get top() {
    return this.pos.y;
  }
  get bottom() {
   return this.pos.y + this.size.y; 
  }

  isIntersect(actor) {
    if (!(actor instanceof Actor)) {
      throw new Error('Нужно передать объект типа Actor');
    }
    if ( this.left >= actor.right || this.right <= actor.left || this.top >= actor.bottom || this.bottom <= actor.top ) {
      return false;
    } else if ( this == actor) {
      return false;
    } else {
      return true;
    }
  }
}

class Level {
  constructor(grid = [], actors = []) {
    let player = actors.find((value) => value.type == 'player')
    this.grid = grid;
    this.actors = actors;
    this.player = player;
    this.height = this.grid ? this.grid.length : 0;
    this.width = this.grid ? this.grid.reduce((res, curret) => Math.max(res, curret.length), 0) : 0;
    this.status = null;
    this.finishDelay = 1;
  }

  isFinished() {
    if (this.status != null && this.finishDelay < 0) {
      return true;
    } else {
      return false;
    }
  }

  actorAt(actor) {
    if (!(actor instanceof Actor)) {
      throw new Error('Нужно передать объект типа Actor');
    }
    return this.actors.find((value) => value.isIntersect(actor));
  }

  obstacleAt(move, size) {
    if (!(move instanceof Vector) || !(size instanceof Vector)) {
      throw new Error('Один из переданных объектов не является объектом класса Vector');
    }
    if ((move.y + size.y) > this.height) {
      return 'lava';
    }
    if ((move.x + size.x) > this.width || move.x < 0 || move.y < 0) {
      return 'wall';
    }
    for (let i = Math.floor(move.y); i < Math.ceil(move.y + size.y); i++) {
      for (let j = Math.floor(move.x); j < Math.ceil(move.x + size.x); j++) {
        if (this.grid[i][j] !== undefined) {
          return this.grid[i][j];
        }
      }
    }
  }

  removeActor(actor) {
    let value = this.actors.indexOf(actor);
    if (value !== -1) {
      return this.actors.splice(value, 1);
    }
  }

  noMoreActors(objType) {
    if (this.actors.find((value) => value.type === objType)) {
      return false;
    } else {
      return true;
    }
  }

  playerTouched(objType, actor) {
    if (this.status == null) {
      if (objType === 'lava' || objType === 'fireball') {
        this.status = 'lost';
      }
      if (objType === 'coin') {
        this.removeActor(actor);
      }
      if (this.noMoreActors('coin') && this.status !== 'lost') {
        this.status = 'won';
      }
    }
  }
}

class LevelParser {
  constructor(dict) {
    this.dict = dict;
  }

  actorFromSymbol(symb = undefined) {
    if (symb !== undefined && this.dict !== undefined) {
      return this.dict[symb];
    }
  }

  obstacleFromSymbol(symb) {
    switch(symb) {
      case 'x': return 'wall';
      case '!': return 'lava';
    }
  }

  createGrid(arr = []) {
    return arr.map(row => row.split('').map(symb => this.obstacleFromSymbol(symb)));
  }

  createActors(arr) {
    let actors = [];
    arr.forEach((arrY, y) => {
      arrY.split('').forEach((arrX, x) => {
        let createActor = this.actorFromSymbol(arrX);
        if (typeof createActor === 'function') {
          let actorInstance = new createActor(new Vector(x, y));
            if (actorInstance instanceof Actor) {
              actors.push(actorInstance);
            }
        }
      })
    })
    return actors;
  }

  parse(arr) {
    return new Level(this.createGrid(arr), this.createActors(arr));
  }
}

class Fireball extends Actor {
  constructor (pos = new Vector(), speed = new Vector()) {
    super(pos, speed);
    this.pos = pos;
    this.speed = speed;
    this.size = new Vector(1, 1);
  }

  get type() {
    return 'fireball';
  }

  getNextPosition(time = 1) {
    return this.pos.plus(this.speed.times(time));
  }

  handleObstacle() {
    this.speed = this.speed.times(-1);
  }

  act(time, level) {
    let newPosition = this.getNextPosition(time);
    if (level.obstacleAt(newPosition, this.size)) {
      this.handleObstacle();
    } else {
      this.pos = newPosition;
    }
  }
}

class HorizontalFireball extends Fireball {
  constructor(pos, speed = new Vector(2, 0), size) {
    super(pos, speed, size);
  }
}

class VerticalFireball extends Fireball {
  constructor(pos, speed = new Vector(0, 2), size) {
    super(pos, speed, size);
  }
}

class FireRain extends Fireball {
  constructor(pos, speed = new Vector(0, 3), size) {
    super(pos, speed, size);
    this.startPos = pos;
  }

  handleObstacle() {
    this.pos = this.startPos;
  }
}

class Coin extends Actor {
  constructor(pos = new Vector()) {
    super(pos.plus(new Vector(0.2, 0.1)), new Vector(0.6, 0.6));
    this.springSpeed = 8;
    this.springDist = 0.07;
    this.spring = Math.random() * Math.PI * 2;
    this.startPos = this.pos;
  }

  get type() {
    return 'coin';
  }

  updateSpring(time = 1) {
    this.spring += this.springSpeed * time;
  }

  getSpringVector() {
    return new Vector(0, Math.sin(this.spring) * this.springDist);
  }

  getNextPosition(time = 1) {
    this.updateSpring(time);
    let springVector = this.getSpringVector(); 
    return this.startPos.plus(springVector);
  }

  act(time) {
    this.pos = this.getNextPosition(time);
  }
}

class Player extends Actor {
  constructor(pos = new Vector()) {
    super(pos.plus(new Vector(0, -0.5)), new Vector(0.8, 1.5));
  }

  get type() {
    return 'player';
  }
}

const schemas = loadLevels();

const dict = {
  '@': Player,
  'v': FireRain,
  'o': Coin,
  '=': HorizontalFireball,
  '|': VerticalFireball
}

const parser = new LevelParser(dict);

schemas.then(result => {
  runGame(JSON.parse(result), parser, DOMDisplay).then(() => alert('Вы выиграли!'));
})