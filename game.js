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
      // else не нужен - если выполнение зайдёт в if и будет выброшено исключение - выполнение функции прекратится
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
      // тут тоже не нужен else
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
    // Всё правильно

    // тут лучше создать копии массивов, чтобы их нельзя было модифицировать из вне
    this.grid = grid;
    this.actors = actors;
    this.height = this.grid.length;
      // actors 2 раза
    this.actors = actors;
    // лучше использовать 3 равно (===)
    this.player = this.actors.find(actor => actor.type == "player");
    this.status = null;
    this.finishDelay = 1;
  }
  
  get width() {
    let max = 0;
    // попробуйте написать через reduce
    // и лучше это просто в конструкторе заполнить, чтобы каждый раз не считать
    this.grid.forEach(elem => {
      if (elem instanceof Array && max < elem.length) {
        max = elem.length;
      }
    });
    return max;
  }
  
  isFinished() {
    // тут без скобок можно обойтись
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
      // всё что касается wall лучше в один if записать
      if (nextPos.x < 0) {
        return 'wall';
      } else if (nextPos.y < 0) {
        return 'wall';
      } else if (nextPos.x + size.x > this.width) {
        return 'wall';
        // else не нужен, если if заканчивается на return
      } else if ((nextPos.y + size.y) >= this.height) {
        return 'lava';
      }
      let x, y, cell;
      const xMin = Math.floor(nextPos.x);
      const xMax = Math.ceil(nextPos.x + size.x);
      const yMin = Math.floor(nextPos.y);
      const yMax = Math.ceil(nextPos.y + size.y);
      // Соня: если опять посоветуете уменьшить вложенность, то придется пояснить, как это сделать. Смогла только else убрать. Кажется, тут не нужно.
      // Игорь: верхний if ещё обратить и кидать исключение как в остальных методах
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
    // const же
    let i = this.actors.findIndex(elem => actor === elem);
    if(i !== -1) {
      this.actors.splice(i, 1);
    }
  }
  
  noMoreActors(type) {
    // лучше проверить длину массива и использовать метод some
    // Соня: не поняла, зачем проверять длину массива. В массиве this.actors всегда что-то будет, хотя бы сам игрок.
    // Игорь: да, тут всё правильно
    return !this.actors.some(elem => elem.type === type);
  }
  
  playerTouched(obstacle, coin) {
    // обратить условие и уменьшить вложенность
    // Соня: не поняла, как и зачем тут обращать условие, когда при (this.status !== 'null') вообще ничего делать не надо. Убрала проверку.

    // Игорь: я имел в виду вот так:
    // if (obstacle === 'lava' || obstacle === 'fireball') {
    //   this.status = 'lost';
    //   return;
    // }
    //
    // if (obstacle === 'coin') {
    //   this.removeActor(coin);
    //   if (this.noMoreActors('coin')) {
    //       this.status = 'won';
    //   }
    // }

    // тут ещё нужно проверить текущий статус игры

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
    // можно убрать проверку this.dictionary[symbol] и так вернёт undefined для undefined
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
      // это можно перенести в map выше
      grid[i] = grid[i].map(elem => obstacle[elem]);
    }
    return grid;
  }

  // лучше добавить значение по-умолчанию - пустой массив
  createActors(arr) {
    // в конструкторе тоже лучше добавить значение по-умолчанию для dictionary
    // тогда можно будет убрать проверку ниже

    // просто для справки можно вот так ещё писать:
    // const { dictionary } = this;
    const dictionary = this.dictionary;
    if (dictionary === undefined || arr.length === 0) {
      return [];
    } 
    let actors = [];
    let array = arr.map(elem => elem.split(''));
    // можно обявить внутри forEach
    let key, obj;

    // лучше использовать стрелочные функции, чтобы не терять this
    array.forEach(function (elem, y) {
      // Соня: наверняка вы скажете уменьшить вложенность, но я не представляю, как именно это сделать. Много условий, которые нужно проверить. 
      // Игорь: если вместо for сделать forEach, то можно делать return если объект не удовлетворяет требованиям
      // высший пилотаж это написать вместо двух циклов reduce
      for (let x = 0; x < elem.length; x++) {
        key = dictionary[elem[x]];
        // здесь достаточно проверить typeof key === 'function'
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
  // должен принимать 2 параметра
  constructor(pos, speed, size = new Vector(1, 1)) {
    super(pos, size, speed);
  }
  
  get type() {
    return "fireball";
  }
  
  getNextPosition(time = 1) {
    // тут нужно использовать методы plus и times
    return new Vector(this.pos.x + this.speed.x * time, this.pos.y + this.speed.y * time);
  }
  
  handleObstacle() {
    this.speed = this.speed.times(-1);
  }
  
  act(time, level) {
    const nextPosition = this.getNextPosition(time);
    const obstacle = level.obstacleAt(nextPosition, this.size);
    // лучше обратить условие, чтобы в if небыло отрицания
    if (!obstacle) {
      this.pos = nextPosition;
    } else {
      this.handleObstacle();
    }
  }
}

// Описание горизонтальной и вертикальной шаровых молний. 

class HorizontalFireball extends Fireball {
  // должен принимать 2 аргумент
  constructor (pos, speed = new Vector(2, 0)) {
    super(pos, speed);
  }
}

class VerticalFireball extends Fireball {
  // должен принимать 2 аргумент
  constructor (pos, speed = new Vector(0, 2)) {
    super(pos, speed);
  }  
}

// Описание Огненного дождя. 

class FireRain extends Fireball {
  // должен принимать 2 аргумент
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
    // getNextPosition уже возвращает вектор, второй создавать не нужно
    let newPosition = this.getNextPosition(time);
    this.pos = new Vector(newPosition.x, newPosition.y);
  }
}

// Описание игрока. 

class Player extends Actor {
  // конструктор должен принимать 1 аргумент
  constructor(pos = new Vector(0, 0), size = new Vector(0.8, 1.5), speed = new Vector(0, 0)) {
    super(pos, size, speed);
    // pos должно задаваться через конструктор базового класса
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
// точка с запятой
}

const parser = new LevelParser(actorDict);
loadLevels()
  .then(JSON.parse)
  .then(levels => runGame(levels, parser, DOMDisplay)
       .then(() => alert('Вы победили!')));