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
    // тут лучше создать копии массивов, чтобы их нельзя было модифицировать из вне
    // Соня: В каких случаях нужно копировать массив, а когда можно работать с оригинальным?
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
      // else не нужен, если if заканчивается на return
      // Соня: оставила внизу if, я правильно вас поняла?
    } 
    if ((nextPos.y + size.y) >= this.height) {
      return 'lava';
    }
    let x, y, cell;
    const xMin = Math.floor(nextPos.x);
    const xMax = Math.ceil(nextPos.x + size.x);
    const yMin = Math.floor(nextPos.y);
    const yMax = Math.ceil(nextPos.y + size.y);
    for (let y = yMin; y < yMax; y++) {
      for (let x = xMin; x < xMax; x++) {           
        cell = this.grid[y][x]
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
    if ((obstacle === 'lava' && this.status === null) || (obstacle === 'fireball' && this.status === null)) {
      this.status = 'lost';
    }
    
    if (obstacle === 'coin' && this.status === null) {
      this.removeActor(coin);
      if(this.noMoreActors('coin')) {
        this.status = 'won';
      }
    }
    // Соня: скажите, а чем плохо такое решение с дополнительной вложенностью? По условию задачи как раз подходит: что-то делаем, если this.status === null, во всех остальных случаях не делаем ничего. 
//    if (this.status === null) {
//      if (obstacle === 'lava' || obstacle === 'fireball') {
//        this.status = 'lost';
//      } 
//    
//      if (obstacle === 'coin') {
//        this.removeActor(coin);
//        if(this.noMoreActors('coin')) {
//          this.status = 'won';
//        }
//      }
//    }
  }
}

// Парсер уровня.

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
    let obstacle = this.obstacle;
    let grid = arr.map(elemY => elemY.split('').map(elemX => obstacle[elemX]));
    return grid;
  }

  createActors(arr = []) {
    // просто для справки можно вот так ещё писать:
     const { dictionary } = this;
    // Соня: спасибо! Оставлю ваш вариант, чтобы запомнить. 
    let actors = [];
    let key, obj;
    arr.map((elemY, y) => elemY.split('').forEach((elemX, x) => {
      key = dictionary[elemX];
      if (key === undefined || typeof key !== 'function') {
        return;
      }

      obj = new key(new Vector(x, y));
      if (obj instanceof Actor) {
        actors.push(obj);
      }
    }));
    return actors;

//    array.forEach(function (elem, y) {
//      // Игорь: если вместо for сделать forEach, то можно делать return если объект не удовлетворяет требованиям
//      // высший пилотаж это написать вместо двух циклов reduce
        // Соня: это слишком высший пилотаж. Если останется время - подумаю, пока комментарии не убираю. 
//      for (let x = 0; x < elem.length; x++) {
//        key = dictionary[elem[x]];
//        if (key !== undefined && typeof key === 'function') {
//          obj = new key(new Vector(x, y));
//          
//          if (obj instanceof Actor) {
//            actors.push(obj);
//          }
//        }
//      }
//    });
//    return actors;
  }
  
  parse(arr) {
    const grid = this.createGrid(arr);
    const actors = this.createActors(arr);
    return new Level(grid, actors);
  }
}

// Описание класса "Шаровая молния". 

class Fireball extends Actor {
  // должен принимать 2 параметра
  // Соня: так? Теперь верно?
  constructor(pos, speed) {
    super(pos);
    this.speed = speed;
    this.size = new Vector(1, 1);
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

// Описание горизонтальной и вертикальной шаровых молний. 

class HorizontalFireball extends Fireball {
  // должен принимать 2 аргумент
  // Соня: сейчас верно?
  constructor (pos, speed = new Vector(2, 0)) {
    super(pos, speed);
  }
}

class VerticalFireball extends Fireball {
  // должен принимать 2 аргумент
  // Соня: должно быть так?
  constructor (pos, speed = new Vector(0, 2)) {
    super(pos, speed);
  }  
}

// Описание Огненного дождя. 

class FireRain extends Fireball {
  // должен принимать 2 аргумент
  // Соня: должно быть так?
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
    super(pos.plus(new Vector(0.2, 0.1)));
    this.basePosition = pos.plus(new Vector(0.2, 0.1));
    this.size = new Vector(0.6, 0.6);
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

// Описание игрока. 

class Player extends Actor {
  // конструктор должен принимать 1 аргумент
  // Соня: так?
  constructor(pos = new Vector(0, 0)) {
    super(pos.plus(new Vector(0, -0.5)));
    // pos должно задаваться через конструктор базового класса.
    this.size = new Vector(0.8, 1.5);
    this.speed = new Vector(0, 0);
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
//const schemas = [
//  [
//    '        v',
//    ' x       ',
//    '         ',
//    '      o @',
//    '     !xxx',
//    '         ',
//    'xxx!     ',
//    '    |    '
//  ],
//  [
//    '      v  ',
//    '    v    ',
//    '  v      ',
//    '        o',
//    '        x',
//    '@   x    ',
//    'x        ',
//    '         '
//  ]
//];
//const parser = new LevelParser(actorDict);
//runGame(schemas, parser, DOMDisplay)
//  .then(() => console.log('Вы выиграли приз!'));

const parser = new LevelParser(actorDict);
loadLevels()
  .then(JSON.parse)
  .then(levels => runGame(levels, parser, DOMDisplay)
       .then(() => alert('Вы победили!')));