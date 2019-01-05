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

  act() {}

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
    if ( !(move instanceof Vector) || !(size instanceof Vector)) {
      throw new Error('Один из переданных объектов не является объектом класса Vector');
    }
    if ((move.y + size.y) > this.height) {
      return 'lava';
    }
    if ((move.x + size.x) > this.width || move.x < 0 || move.y < 0) {
      return 'wall';
    }
    for (let i = Math.ceil(move.y); i < Math.ceil(move.y + size.y); i++) {
      for (let j = Math.ceil(move.x); j < Math.ceil(move.x + size.x); j++) {
        return this.grid[i][j];
      }
    }
  }
}