'use strict';

//Реализация векторов — class Vector.

class Vector {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
  
  plus(vector) {
    if (!(vector instanceof Vector)) {
      throw new Error('Можно прибавлять к вектору только вектор типа Vector');
    }
    return new Vector(this.x + vector.x, this.y + vector.y);
  }
  
  times(factor) {
    return new Vector(this.x * factor, this.y * factor);
  }
}

//Реализация движущегося объекта — class Actor.

class Actor {
  constructor(pos = new Vector(0, 0), size = new Vector(1, 1), speed = new Vector(0, 0)) {
    if (!(pos instanceof Vector)) {
      throw new Error('Переданные координаты не являются объектом типа Vector');
    } 
    
    if (!(size instanceof Vector)) {
      throw new Error('Переданный размер не является объектом типа Vector');
    } 
    
    if (!(speed instanceof Vector)) {
      throw new Error('Переданная скорость не является объектом типа Vector');
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
  
  get top() {
    return this.pos.y;
  }
  
  get right() {
    return this.pos.x + this.size.x;
  }
  
  get bottom() {
    return this.pos.y + this.size.y;
  }
  
  act() {}
  
  isIntersect(actor) {
    if (!(actor instanceof Actor)) {
      throw new Error('Переданный объект не является экземпляром Actor.');
    }
    
    if (actor === this) {
      return false;
    } 
    
    if (actor.left >= this.right) {
      return false;
    }
    
    if (actor.top >= this.bottom) {
      return false;
    }
    
    if (actor.right <= this.left) {
      return false;
    }
    
    if (actor.bottom <= this.top) {
      return false;
    }
    
    return true;
  }
}

// Формирование уровня — class Level.

class Level {
  constructor (grid = [], actors = []) {
    this.grid = grid.slice();
    this.actors = actors.slice();
    this.height = this.grid.length;
    this.player = this.actors.find(actor => actor.type === 'player');
    this.status = null;
    this.finishDelay = 1;
    this.width = this.grid.reduce((prev, cur) => {
      return cur.length > prev ? cur.length : prev;
    }, 0);
  }
  
  isFinished() {
    return this.status !== null && this.finishDelay < 0;
  }
  
  actorAt(actor) {
    if (!(actor instanceof Actor)) {
      throw new Error('Передан не движущийся объект типа Actor.');
    }
    return this.actors.find(elem => {
      if (actor.isIntersect(elem)) return elem;
    });
  }
  
  obstacleAt(nextPos, size) {
    if (!(nextPos instanceof Vector) || !(size instanceof Vector)) {
      throw new Error('Переданные данные не являются объектом типа Vector.');
    }
    
    if (nextPos.x < 0 || nextPos.y < 0 || nextPos.x + size.x > this.width) {
      return 'wall';
    }
    
    if ((nextPos.y + size.y) >= this.height) {
      return 'lava';
    }
    
    const xMin = Math.floor(nextPos.x);
    const xMax = Math.ceil(nextPos.x + size.x);
    const yMin = Math.floor(nextPos.y);
    const yMax = Math.ceil(nextPos.y + size.y);
    for (let y = yMin; y < yMax; y++) {
      for (let x = xMin; x < xMax; x++) {           
        const cell = this.grid[y][x]
        if (cell) return cell;
      }
    }
  }
  
  removeActor(actor) {
    const i = this.actors.findIndex(elem => actor === elem);
    if(i !== -1) {
      this.actors.splice(i, 1);
    }
  }
  
  noMoreActors(type) {
    return !this.actors.some(elem => elem.type === type);
  }
  
  playerTouched(obstacle, coin) {
    if (this.status !== null) {
      return;
    }
    
    if (obstacle === 'lava' || obstacle === 'fireball') {
      this.status = 'lost';
    }
    
    if (obstacle === 'coin') {
      this.removeActor(coin);
      if(this.noMoreActors('coin')) {
        this.status = 'won';
      }
    }
  }
}

// Создание парсера уровней — class LevelParser.

class LevelParser {
  constructor (dictionary = {}) {
    this.dictionary = dictionary;
    this.obstacle = {
      'x': 'wall',
      '!': 'lava'
    };
  }
  
  actorFromSymbol(symbol) {
    return this.dictionary[symbol];
  }
  
  obstacleFromSymbol(symbol) {
    return this.obstacle[symbol];
  }
  
  createGrid(arr) {
    return arr.map(elemY => elemY.split('').map(elemX => this.obstacle[elemX]));
  }

  createActors(arr = []) {
    const { dictionary } = this; 
    const actors = [];
    
    arr.forEach((elemY, y) => elemY.split('').forEach((elemX, x) => {
      const key = dictionary[elemX];
      if (typeof key !== 'function') {
        return;
      }

      const obj = new key(new Vector(x, y));
      if (obj instanceof Actor) {
        actors.push(obj);
      }
    }));
    
    return actors;
  }
  
  parse(arr) {
    const grid = this.createGrid(arr);
    const actors = this.createActors(arr);
    
    return new Level(grid, actors);
  }
}

// Создание шаровой молнии — class Fireball. 

class Fireball extends Actor {
  constructor(pos, speed) {
    super(pos, new Vector(1, 1), speed);
  }
  
  get type() {
    return "fireball";
  }
  
  getNextPosition(time = 1) {
    return this.pos.plus(this.speed.times(time));
  }
  
  handleObstacle() {
    this.speed = this.speed.times(-1);
  }
  
  act(time, level) {
    const nextPosition = this.getNextPosition(time);
    const obstacle = level.obstacleAt(nextPosition, this.size);

    if (obstacle) {
      this.handleObstacle();
    } else {
      this.pos = nextPosition;
    }
  }
}

// Создание горизонтальной и вертикальной шаровых молний. 

class HorizontalFireball extends Fireball {
  constructor (pos) {
    super(pos, new Vector(2, 0));
  }
}

class VerticalFireball extends Fireball {
  constructor (pos) {
    super(pos, new Vector(0, 2));
  }  
}

// Создание огненного дождя — class FireRain. 

class FireRain extends Fireball {
  constructor(pos) {
    super(pos, new Vector(0, 3));
    this.startPos = pos;
  }
  
  handleObstacle() {
    this.pos = this.startPos;
  }
}

// Добавление монеты — class Coin.

class Coin extends Actor {
  constructor(pos) {
    super(pos.plus(new Vector(0.2, 0.1)), new Vector (0.6, 0.6));
    this.basePosition = this.pos;
    this.springSpeed = 8;
    this.springDist = 0.07;
    this.spring = Math.random() * 2 * Math.PI; 
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
    let a = this.getSpringVector();
    return this.basePosition.plus(a);
  }
  
  act(time) {
    this.pos = this.getNextPosition(time);
  }
}

// Описание игрока — class Player. 

class Player extends Actor {
  constructor(pos) {
    const position = pos.plus(new Vector(0, -0.5));
    const size = new Vector(0.8, 1.5);
    super(position, size);
  }
  
  get type() {
    return 'player';
  }
} 

// Добавление уровней и запуск игры. 

const actorDict = {
  '@': Player,
  'o': Coin,
  '=': HorizontalFireball,
  '|': VerticalFireball,
  'v': FireRain
};
const parser = new LevelParser(actorDict);

loadLevels()
  .then(JSON.parse)
  .then(levels => runGame(levels, parser, DOMDisplay)
       .then(() => alert('Вы победили!')));