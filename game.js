'use strict';

//Реализация класса Vector.

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

//Реализация класса движущегося объекта.

class Actor {
  constructor(pos = new Vector(0, 0), size = new Vector(1, 1), speed = new Vector(0, 0)) {
    if (!(pos instanceof Vector)) {
      throw new Error('Переданные координаты не являются объектом типа Vector');
    } else if (!(size instanceof Vector)) {
      throw new Error('Переданный размер не является объектом типа Vector');
    } else if (!(speed instanceof Vector)) {
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
    } else if (actor.left >= this.right) {
      return false;
    } else if (actor.top >= this.bottom) {
      return false;
    } else if (actor.right <= this.left) {
      return false;
    } else if (actor.bottom <= this.top) {
      return false;
    }
    return true;
  }
}

// Реализация класса Level.

class Level {
  constructor (grid = [], actors = []) {
    // тут нужно упростить всё :)
    // Соня: ну, как смогла. 
    this.grid = grid;
    this.actors = actors;
    this.height = this.grid.length;
    this.actors = actors;
    this.player = this.actors.find(actor => actor.type == "player");
    this.status = null;
    this.finishDelay = 1;
  }
  
  get width() {
    let max = 0;
    this.grid.forEach(elem => {
      if (elem instanceof Array && max < elem.length) {
        max = elem.length;
      }
    });
    return max;
  }
  
  isFinished() {
    return (this.status !== null && this.finishDelay < 0);
  }
  
  actorAt(actor) {
    if (!(actor instanceof Actor)) {
      throw new Error('Передан не движущийся объект типа Actor.');
    }
    return this.actors.find(elem => {
      if (actor.isIntersect(elem)) {
        return elem;
      }
    });
  }
  
  obstacleAt(nextPos, size) {
    if (nextPos instanceof Vector && size instanceof Vector) {
      if (nextPos.x < 0) {
        return 'wall';
      } else if (nextPos.y < 0) {
        return 'wall';
      } else if (nextPos.x + size.x > this.width) {
        return 'wall';
      } else if ((nextPos.y + size.y) >= this.height) {
        return 'lava';
      }
      let x, y, cell;
      const xMin = Math.floor(nextPos.x);
      const xMax = Math.ceil(nextPos.x + size.x);
      const yMin = Math.floor(nextPos.y);
      const yMax = Math.ceil(nextPos.y + size.y);
      // Соня: если опять посоветуете уменьшить вложенность, то придется пояснить, как это сделать. Смогла только else убрать. Кажется, тут не нужно. 
      for (let y = yMin; y < yMax; y++) {
        for (let x = xMin; x < xMax; x++) {           
          cell = this.grid[y][x]
          if (cell) {
            return cell;
          }
        }
      }
    }
  }
  
  removeActor(actor) {
    let i = this.actors.findIndex(elem => actor === elem);
    if(i !== -1) {
      this.actors.splice(i, 1);
    }
  }
  
  noMoreActors(type) {
    // лучше проверить длину массива и использовать метод some
    // Соня: не поняла, зачем проверять длину массива. В массиве this.actors всегда что-то будет, хотя бы сам игрок. 
    return !this.actors.some(elem => elem.type === type);
  }
  
  playerTouched(obstacle, coin) {
    // обратить условие и уменьшить вложенность
    // Соня: не поняла, как и зачем тут обращать условие, когда при (this.status !== 'null') вообще ничего делать не надо. Убрала проверку. 
    if (obstacle === 'lava') {
      this.status = 'lost';
    } else if (obstacle === 'fireball') {
      this.status = 'lost';
    } else if (obstacle === 'coin') {
      this.removeActor(coin);
      if(this.noMoreActors('coin')) {
        this.status = 'won';
      }
    }
  }
}

// Парсер уровня.

class LevelParser {
  constructor (dictionary) {
    this.dictionary = dictionary;
    this.obstacle = {
      'x': 'wall',
      '!': 'lava'
    };
  }
  
  actorFromSymbol(symbol) {
    if (!symbol) {
      return undefined;
    } else {
      return this.dictionary[symbol];
    }
  }
  
  obstacleFromSymbol(symbol) {
    return this.obstacle[symbol];
  }
  
  createGrid(arr) {
    let obstacle = this.obstacle;
    let grid = arr.map(elem => elem.split(''));
    for (let i = 0; i < grid.length; i++) {
      grid[i] = grid[i].map(elem => obstacle[elem]);
    }
    return grid;
  }
  
  createActors(arr) {
    const dictionary = this.dictionary;
    if (dictionary === undefined || arr.length === 0) {
      return [];
    } 
    let actors = [];
    let array = arr.map(elem => elem.split(''));
    let key, obj;
    
    array.forEach(function (elem, y) {
      // Соня: наверняка вы скажете уменьшить вложенность, но я не представляю, как именно это сделать. Много условий, которые нужно проверить. 
      for (let x = 0; x < elem.length; x++) {
        key = dictionary[elem[x]];
        
        if (key !== undefined && key instanceof Function) {
          obj = new key(new Vector(x, y));
          
          if (obj instanceof Actor) {
            actors.push(obj);
          }
        }
      }
    });
    return actors;
  }
  
  parse(arr) {
    const grid = this.createGrid(arr);
    const actors = this.createActors(arr);
    return new Level(grid, actors);
  }
}

// Описание класса "Шаровая молния". 

class Fireball extends Actor {
  constructor(pos, speed, size = new Vector(1, 1)) {
    super(pos, size, speed);
  }
  
  get type() {
    return "fireball";
  }
  
  getNextPosition(time = 1) {
    return new Vector(this.pos.x + this.speed.x * time, this.pos.y + this.speed.y * time);
  }
  
  handleObstacle() {
    this.speed = this.speed.times(-1);
  }
  
  act(time, level) {
    const nextPosition = this.getNextPosition(time);
    const obstacle = level.obstacleAt(nextPosition, this.size);
    if (!obstacle) {
      this.pos = nextPosition;
    } else {
      this.handleObstacle();
    }
  }
}

// Описание горизонтальной и вертикальной шаровых молний. 

class HorizontalFireball extends Fireball {
  constructor (pos, speed = new Vector(2, 0)) {
    super(pos, speed);
  }
}

class VerticalFireball extends Fireball {
  constructor (pos, speed = new Vector(0, 2)) {
    super(pos, speed);
  }  
}

// Описание Огненного дождя. 

class FireRain extends Fireball {
  constructor(pos, speed = new Vector(0, 3)) {
    super(pos, speed);
    this.startPos = pos;
  }
  
  handleObstacle() {
    this.pos = this.startPos;
  }
}

// Описание монеты.

class Coin extends Actor {
  constructor(pos = new Vector(0, 0)) {
    super(pos);
    this.basePosition = pos.plus(new Vector(0.2, 0.1));
    this.pos = pos.plus(new Vector(0.2, 0.1));
    this.size = new Vector(0.6, 0.6);
    this.springSpeed = 8;
    this.springDist = 0.07;
    this.spring = Math.random() * 2 * Math.PI;
    // Соня: в тесте проверяется не случайное число умноженное на 2пи, а число от 5 до 6. Текущее решение дает ошибку с некоторой долей вероятности. Со 100% вероятностью тест можно пройти только при таком решении this.spring = Math.random() + 5; - и оно неправильное.  
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
    let newPosition = this.getNextPosition(time);
    this.pos = new Vector(newPosition.x, newPosition.y);
  }
}

// Описание игрока. 

class Player extends Actor {
  constructor(pos = new Vector(0, 0), size = new Vector(0.8, 1.5), speed = new Vector(0, 0)) {
    super(pos, size, speed);
    this.pos = pos.plus(new Vector(0, -0.5));
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
}

const parser = new LevelParser(actorDict);
loadLevels()
  .then(JSON.parse)
  .then(levels => runGame(levels, parser, DOMDisplay)
       .then(() => alert('Вы победили!')));