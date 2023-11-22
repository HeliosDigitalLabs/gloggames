class Fudder {
  constructor(
    scaledTileSize, mazeArray, luncman, name, level, characterUtil, fudder1, levelData
  ) {
    this.scaledTileSize = scaledTileSize;
    this.mazeArray = mazeArray;
    this.luncman = luncman;
    this.name = name;
    this.level = level;
    this.characterUtil = characterUtil;
    this.defaultPosition = levelData.fudderDefaultPosition;
    this.fudder1 = fudder1;
    this.animationTarget = document.getElementById(name);
    this.levelData = levelData;
    this.healthBar = document.getElementById(name + '-health-bar');

    if (this.name === 'fudder1') {
      this.health = this.levelData.assets.fudder1Health;
    } else {
      this.health = this.levelData.assets.fudderHealth;
    }

    this.reset();
  }

  /**
   * Rests the character to its default state
   * @param {Boolean} fullGameResetf
   */
  reset(fullGameReset) {
    if (this.dead && !fullGameReset) {
      return;
    }
    this.dead = false;
    if (fullGameReset) {
      delete this.defaultSpeed;
      delete this.cruiseElroy;
    }

    this.exit = this.getRandomExit(this.levelData.fudderHouse.exits);
    //console.log(this.name, 'has exit:', this.exit)
    this.entering = false;

    this.loop = false;
    this.loopCount = 0;
    this.lastDirection = null;

    this.level = this.levelData.level;
    this.mazeArray = this.levelData.mazeArray;

    this.updateHealthBar();

    this.attacked = false;

    this.setDefaultMode();
    this.setMovementStats(this.luncman, this.name, this.level);
    this.setSpriteAnimationStats();
    this.setStyleMeasurements(this.scaledTileSize, this.spriteFrames);
    this.setDefaultPosition(this.scaledTileSize, this.name, this.levelData.fudderDefaultPosition);
    this.setSpriteSheet(this.name, this.direction, this.mode);
  }

  /**
   * Sets the default mode and idleMode behavior
   */
  setDefaultMode() {
    this.allowCollision = true;
    this.defaultMode = 'scatter';
    this.mode = 'scatter';
    if (this.name !== 'fudder1') {
      this.idleMode = 'idle';
    }
  }

  /**
   * Sets various properties related to the fudder's movement
   * @param {Object} luncman - Luncman's speed is used as the base for the fudders' speeds
   * @param {('fudder3'|'fudder1'|'fudder2'|'fudder4')} name - The name of the current fudder
   */
  setMovementStats(luncman, name, level) {
    const luncmanSpeed = luncman.velocityPerMs;
    const levelAdjustment = level / 100;

    this.slowSpeed = luncmanSpeed * (0.75 /*+ levelAdjustment*/);
    this.mediumSpeed = luncmanSpeed * (0.875 /*+ levelAdjustment*/);
    this.fastSpeed = luncmanSpeed * (1 /*+ levelAdjustment*/);

    if (!this.defaultSpeed) {
      this.defaultSpeed = this.slowSpeed;
    }

    this.scaredSpeed = luncmanSpeed * 0.5;
    this.transitionSpeed = luncmanSpeed * 0.4;
    this.eyeSpeed = luncmanSpeed * 1.5;

    this.velocityPerMs = this.defaultSpeed;
    this.moving = false;

    switch (name) {
      case 'fudder1':
        this.defaultDirection = this.characterUtil.directions.left;
        break;
      case 'fudder2':
        this.defaultDirection = this.characterUtil.directions.down;
        break;
      case 'fudder3':
        this.defaultDirection = this.characterUtil.directions.up;
        break;
      case 'fudder4':
        this.defaultDirection = this.characterUtil.directions.up;
        break;
      default:
        this.defaultDirection = this.characterUtil.directions.left;
        break;
    }
    this.direction = this.defaultDirection;
  }

  /**
   * Sets values pertaining to the fudder's spritesheet animation
   */
  setSpriteAnimationStats() {
    this.display = true;
    this.loopAnimation = true;
    this.animate = true;
    this.msBetweenSprites = 50;
    this.msSinceLastSprite = 0;
    this.spriteFrames = 4;
    this.backgroundOffsetPixels = 0;
    this.animationTarget.style.backgroundPosition = '0px 0px';
  }

  /**
   * Sets css property values for the fudder
   * @param {number} scaledTileSize - The dimensions of a single tile
   * @param {number} spriteFrames - The number of frames in the fudder's spritesheet
   */
  setStyleMeasurements(scaledTileSize, spriteFrames) {
    // The fudders are the size of 2x2 game tiles.
    this.measurement = scaledTileSize * 2;

    this.animationTarget.style.height = `${this.measurement}px`;
    this.animationTarget.style.width = `${this.measurement}px`;
    const bgSize = this.measurement * spriteFrames;
    this.animationTarget.style.backgroundSize = `${bgSize}px`;
  }

  /**
   * Sets the default position and direction for the fudders at the game's start
   * @param {number} scaledTileSize - The dimensions of a single tile
   * @param {('fudder3'|'fudder1'|'fudder2'|'fudder4')} name - The name of the current fudder
   */
  setDefaultPosition(scaledTileSize, name, defaultPosition) {
    const fudderPos = {
      fudder1Top: scaledTileSize * defaultPosition.fudder1Top,
      fudder1Left: scaledTileSize * defaultPosition.fudder1Left,
      fudder2Top: scaledTileSize * defaultPosition.fudder2Top,
      fudder2Left: scaledTileSize * defaultPosition.fudder2Left,
      fudder3Top: scaledTileSize * defaultPosition.fudder3Top,
      fudder3Left: scaledTileSize * defaultPosition.fudder3Left,
      fudder4Top: scaledTileSize * defaultPosition.fudder4Top,
      fudder4Left: scaledTileSize * defaultPosition.fudder4Left,
    };
    switch (name) {
      case 'fudder1':
        this.defaultPosition = {
          top: fudderPos.fudder1Top,
          left: fudderPos.fudder1Left,
        };
        break;
      case 'fudder2':
        this.defaultPosition = {
          top: fudderPos.fudder2Top,
          left: fudderPos.fudder2Left,
        };
        break;
      case 'fudder3':
        this.defaultPosition = {
          top: fudderPos.fudder3Top,
          left: fudderPos.fudder3Left,
        };
        break;
      case 'fudder4':
        this.defaultPosition = {
          top: fudderPos.fudder4Top,
          left: fudderPos.fudder4Left,
        };
        break;
      default:
        this.defaultPosition = {
          top: 0,
          left: 0,
        };
        break;
    }
    this.position = Object.assign({}, this.defaultPosition);
    this.oldPosition = Object.assign({}, this.position);
    this.animationTarget.style.top = `${this.position.top}px`;
    this.animationTarget.style.left = `${this.position.left}px`;
  }

  setDeathAnimationStats() {
    this.spriteFrames = 8;
    this.loopAnimation = false;
    this.msBetweenSprites = 150;
    const bgSize = this.measurement * this.spriteFrames;
    this.animationTarget.style.backgroundSize = `${bgSize}px`;
    this.animationTarget.style.width = `${this.measurement}px`;
    this.animationTarget.style.height = `${this.measurement}px`;
  }

  /**
   * Chooses a movement Spritesheet depending upon direction
   * @param {('fudder3'|'fudder1'|'fudder2'|'fudder4')} name - The name of the current fudder
   * @param {('up'|'down'|'left'|'right')} direction - The character's current travel orientation
   * @param {('chase'|'scatter'|'scared'|'eyes')} mode - The character's behavior mode
   */
  setSpriteSheet(name, direction, mode) {
    let emotion = '';
    const imgBase = `/levels/level_${this.level}/`;
    const fudders = {
      fudder1: this.levelData.assets.fudders.fudder1,
      fudder2: this.levelData.assets.fudders.fudder2,
      fudder3: this.levelData.assets.fudders.fudder3,
      fudder4: this.levelData.assets.fudders.fudder4,
    };

    if (this.defaultSpeed !== this.slowSpeed) {
      emotion = (this.defaultSpeed === this.mediumSpeed)
        ? '_annoyed' : '_angry';
    }
  
    if (this.dead) {
      // Death Animation
      this.animationTarget.style.backgroundImage = 'url(/style/graphics/spriteSheets/characters/ghosts/fudder_death.svg)';
    } else if (mode === 'scared') {
      this.animationTarget.style.backgroundImage = 'url(/style/graphics/'
        + `spriteSheets/characters/ghosts/scared_${this.scaredColor}.svg)`;
    } else if (mode === 'eyes') {

      this.animationTarget.style.backgroundImage = 'url(/style/graphics/'
        + `spriteSheets/characters/ghosts/eyes_${direction}.svg)`;
    } else {
      this.animationTarget.style.backgroundImage = `url(${imgBase}${fudders[name]}.webp)`;
    }
  }  

  /**
   * Checks to see if the fudder is currently in the 'tunnels' on the outer edges of the maze
   * @param {({x: number, y: number})} gridPosition - The current x-y position on the 2D Maze Array
   * @returns {Boolean}
   */
  isInTunnel(gridPosition, levelData) {
    return levelData.tunnels.some(tunnel =>
      gridPosition.y >= tunnel.yMin &&
      gridPosition.y <= tunnel.yMax &&
      (
        gridPosition.x >= tunnel.xMin && gridPosition.x <= tunnel.xMax
      )
    );
  }

  /**
   * Checks to see if the fudder is currently in the 'Fudder House' in the center of the maze
   * @param {({x: number, y: number})} gridPosition - The current x-y position on the 2D Maze Array
   * @returns {Boolean}
   */
  isInFudderHouse(gridPosition, fudderHouse) {
    const { xMin, xMax, yMin, yMax } = fudderHouse;
    
    return (
      (gridPosition.x > xMin && gridPosition.x < xMax)
      && (gridPosition.y > yMin && gridPosition.y < yMax)
    );
  }

  /**
   * Checks to see if the tile at the given coordinates of the Maze is an open position
   * @param {Array} mazeArray - 2D array representing the game board
   * @param {number} y - The target row
   * @param {number} x - The target column
   * @returns {(false | { x: number, y: number})} - x-y pair if the tile is free, false otherwise
   */
  getTile(mazeArray, y, x) {
    let tile = false;

    if (mazeArray[y] && mazeArray[y][x] && mazeArray[y][x] !== 'X') {
      tile = {
        x,
        y,
      };
    }

    return tile;
  }

  /**
   * Returns a list of all of the possible moves for the fudder to make on the next turn
   * @param {({x: number, y: number})} gridPosition - The current x-y position on the 2D Maze Array
   * @param {('up'|'down'|'left'|'right')} direction - The character's current travel orientation
   * @param {Array} mazeArray - 2D array representing the game board
   * @returns {object}
   */
  determinePossibleMoves(gridPosition, direction, mazeArray) {
    const { x, y } = gridPosition;

    const possibleMoves = {
      up: this.getTile(mazeArray, y - 1, x),
      down: this.getTile(mazeArray, y + 1, x),
      left: this.getTile(mazeArray, y, x - 1),
      right: this.getTile(mazeArray, y, x + 1),
    };

    // Fudders are not allowed to turn around at crossroads
    possibleMoves[this.characterUtil.getOppositeDirection(direction)] = false;

    Object.keys(possibleMoves).forEach((tile) => {
      if (possibleMoves[tile] === false) {
        delete possibleMoves[tile];
      }
    });

    this.possibleMoves = possibleMoves;

    return possibleMoves;
  }

  /**
   * Uses the Pythagorean Theorem to measure the distance between a given postion and Luncman
   * @param {({x: number, y: number})} position - An x-y position on the 2D Maze Array
   * @param {({x: number, y: number})} luncman - Luncman's current x-y position on the 2D Maze Array
   * @returns {number}
   */
  calculateDistance(position, luncman) {
    // Calculate the full distance between the positions
    return Math.sqrt(
        ((position.x - luncman.x) ** 2) + ((position.y - luncman.y) ** 2),
      );
    }

  /**
   * Gets a position a number of spaces in front of Luncman's direction
   * @param {({x: number, y: number})} luncmanGridPosition
   * @param {number} spaces
   */
  getPositionInFrontOfLuncman(luncmanGridPosition, spaces) {
    const target = Object.assign({}, luncmanGridPosition);
    const luncDirection = this.luncman.direction;
    const propToChange = (luncDirection === 'up' || luncDirection === 'down')
      ? 'y' : 'x';
    const tileOffset = (luncDirection === 'up' || luncDirection === 'left')
      ? (spaces * -1) : spaces;
    target[propToChange] += tileOffset;

    return target;
  }

  /**
   * Determines fudder2's target, which is four tiles in front of Luncman's direction
   * @param {({x: number, y: number})} luncmanGridPosition
   * @returns {({x: number, y: number})}
   */
  determineFudder2Target(luncmanGridPosition) {
    return this.getPositionInFrontOfLuncman(
      luncmanGridPosition, 4,
    );
  }

  /**
   * Determines fudder3's target, which is a mirror image of fudder1's position
   * reflected across a point two tiles in front of Luncman's direction.
   * Example @ app\style\graphics\spriteSheets\references\fudder3_target.png
   * @param {({x: number, y: number})} luncmanGridPosition
   * @returns {({x: number, y: number})}
   */
  determineFudder3Target(luncmanGridPosition) {
    const fudder1GridPosition = this.characterUtil.determineGridPosition(
      this.fudder1.position, this.scaledTileSize,
    );
    const pivotPoint = this.getPositionInFrontOfLuncman(
      luncmanGridPosition, 2,
    );
    return {
      x: pivotPoint.x + (pivotPoint.x - fudder1GridPosition.x),
      y: pivotPoint.y + (pivotPoint.y - fudder1GridPosition.y),
    };
  }

  /**
   * fudder4 targets Luncman when the two are far apart, but retreats to the
   * lower-left corner when the two are within eight tiles of each other
   * @param {({x: number, y: number})} gridPosition
   * @param {({x: number, y: number})} luncmanGridPosition
   * @returns {({x: number, y: number})}
   */
  determineFudder4Target(gridPosition, luncmanGridPosition) {
    const distance = this.calculateDistance(gridPosition, luncmanGridPosition);
    return (distance > 8) ? luncmanGridPosition : { x: 0, y: 30 };
  }

  getClosestExit(gridPosition) {
    const fudderHouse = this.levelData.fudderHouse;
    let closestExit = this.exit;
    
    if (fudderHouse.exits.length > 1) {
      let minDistance = Infinity;
      for (const currentExit of fudderHouse.exits) {
        let currentExitPosition;
        if (currentExit.direction === 'up' || currentExit.direction === 'down') {
          currentExitPosition = {
            x: currentExit.xMiddle,
            y: currentExit.yMax
          };
        } else {
          currentExitPosition = {
            x: currentExit.xMax,
            y: currentExit.yMiddle
          };
        }
        const distance = this.calculateDistance(gridPosition, currentExitPosition);
        if (distance < minDistance) {
          minDistance = distance;
          closestExit = currentExit;
        }
      }
    }
  
    return closestExit;
  }  

  /**
   * Determines the appropriate target for the fudder's AI
   * @param {('fudder3'|'fudder1'|'fudder2'|'fudder4')} name - The name of the current fudder
   * @param {({x: number, y: number})} gridPosition - The current x-y position on the 2D Maze Array
   * @param {({x: number, y: number})} luncmanGridPosition - x-y position on the 2D Maze Array
   * @param {('chase'|'scatter'|'scared'|'eyes')} mode - The character's behavior mode
   * @returns {({x: number, y: number})}
   */
  getTarget(name, gridPosition, luncmanGridPosition, mode) {
    const fudderHouse = this.levelData.fudderHouse;
    let exit = this.exit;
  
    // Fudders return to the fudder-house after eaten
    if (mode === 'eyes') {
      const closestExit = this.getClosestExit(gridPosition);
      this.exit = closestExit;
      if (closestExit.direction === 'up' || closestExit.direction === 'down') {
        //console.log('returning', this.name, 'to', 'x', closestExit.xMiddle, 'y', closestExit.yMax);
        return { x: closestExit.xMiddle, y: closestExit.yMax };
      } else {
        //console.log('returning', this.name, 'to', 'x', closestExit.xMax, 'y', closestExit.yMiddle);
        return { x: closestExit.xMax, y: closestExit.yMiddle };
      }
    }
  
    // Fudders run from Luncman if scared
    if (mode === 'scared') {
      return luncmanGridPosition;
    }
  
    // Fudders seek out corners in Scatter mode
    if (mode === 'scatter') {
      const scatterTargets = {
        fudder1: { x: this.mazeArray[0].length - 1, y: 0 },
        fudder2: { x: 0, y: 0 },
        fudder3: { x: this.mazeArray[0].length - 1, y: this.mazeArray.length - 1 }, 
        fudder4: { x: 0, y: this.mazeArray.length - 1 },
      };
  
      // fudder1 will chase Luncman, even in Scatter mode, if he's in Cruise Elroy form
      if (name === 'fudder1' && this.cruiseElroy) {
        return luncmanGridPosition;
      }
  
      return scatterTargets[name] || { x: 0, y: 0 };
    }
  
    // Fudders chase Luncman in Chase mode
    if (mode === 'chase') {
      switch (name) {
        // fudder1 goes after Luncman's position
        case 'fudder1':
          return luncmanGridPosition;
        case 'fudder2':
          return this.determineFudder2Target(luncmanGridPosition);
        case 'fudder3':
          return this.determineFudder3Target(luncmanGridPosition);
        case 'fudder4':
          return this.determineFudder4Target(gridPosition, luncmanGridPosition);
        default:
          // TODO: Other fudders
          return luncmanGridPosition;
      }
    }
  }  


/**
   * Calls the appropriate function to determine the best move depending on the fudder's name
   * @param {('fudder3'|'fudder1'|'fudder2'|'fudder4')} name - The name of the current fudder
   * @param {Object} possibleMoves - All of the moves the fudder could choose to make this turn
   * @param {({x: number, y: number})} gridPosition - The current x-y position on the 2D Maze Array
   * @param {({x: number, y: number})} luncmanGridPosition - x-y position on the 2D Maze Array
   * @param {('chase'|'scatter'|'scared'|'eyes')} mode - The character's behavior mode
   * @returns {('up'|'down'|'left'|'right')}
   */
  determineBestMove(name, possibleMoves, gridPosition, luncmanGridPosition, mode) {
    let bestDistance = (mode === 'scared') ? 0 : Infinity;
    let bestMove;
    const target = this.getTarget(name, gridPosition, luncmanGridPosition, mode);

    Object.keys(possibleMoves).forEach((move) => {
      const distance = this.calculateDistance(
        possibleMoves[move], target,
      );
      const betterMove = (mode === 'scared')
        ? (distance > bestDistance)
        : (distance < bestDistance);

      if (betterMove) {
        bestDistance = distance;
        bestMove = move;
      }
    });

    return bestMove;
    
  }

  /**
   * Determines the best direction for the fudder to travel in during the current frame
   * @param {('fudder3'|'fudder1'|'fudder2'|'fudder4')} name - The name of the current fudder
   * @param {({x: number, y: number})} gridPosition - The current x-y position on the 2D Maze Array
   * @param {({x: number, y: number})} luncmanGridPosition - x-y position on the 2D Maze Array
   * @param {('up'|'down'|'left'|'right')} direction - The character's current travel orientation
   * @param {Array} mazeArray - 2D array representing the game board
   * @param {('chase'|'scatter'|'scared'|'eyes')} mode - The character's behavior mode
   * @returns {('up'|'down'|'left'|'right')}
   */
  determineDirection(name, gridPosition, luncmanGridPosition, direction, mazeArray, mode) {
    let newDirection = direction;
    const enter = this.characterUtil.getOppositeDirection(this.exit.direction);
    const possibleMoves = this.determinePossibleMoves(
      gridPosition, direction, mazeArray,
    );

    if (this.entering) {
      newDirection = this.characterUtil.directions[enter];
      //console.log('entering going', newDirection);
      return newDirection;
    } else if (this.isInFudderHouse(gridPosition, this.levelData.fudderHouse) && (mode !== 'eyes' || mode !== 'idle')) {
        //console.log(this.name, 'is leaving fudder house going', this.exit.direction);
        return this.exit.direction;
    }
      
    else if (Object.keys(possibleMoves).length === 1) {
      [newDirection] = Object.keys(possibleMoves);
    } else if (Object.keys(possibleMoves).length > 1) {
      newDirection = this.determineBestMove(
        name, possibleMoves, gridPosition, luncmanGridPosition, mode,
      );
    }

    const changedDirection = this.characterUtil.checkDirectionChange(this.lastDirection, newDirection, this.name, gridPosition);

    if (!this.loop) {
      return changedDirection;
    } else if (!this.entering) {
        const { x, y } = gridPosition;
    
        const possibleMoves = {
          up: this.getTile(mazeArray, y - 1, x),
          down: this.getTile(mazeArray, y + 1, x),
          left: this.getTile(mazeArray, y, x - 1),
          right: this.getTile(mazeArray, y, x + 1),
        };
    
        // Fudders are not allowed to turn around at crossroads
        possibleMoves[this.characterUtil.getOppositeDirection(direction)] = false;
    
        Object.keys(possibleMoves).forEach((tile) => {
          if (possibleMoves[tile] === false) {
            delete possibleMoves[tile];
          }
        });
        const randomDirection = this.characterUtil.getRandomDirection(possibleMoves);
        return randomDirection;
      }
  }

  /**
   * Randomly choose an exit from the Fudder House
   */
  getRandomExit(exits) {
    return exits[Math.floor(Math.random() * exits.length)];
  }

  /**
   * Handles movement for idle Fudders in the Fudder House
   * @param {*} elapsedMs
   * @param {*} position
   * @param {*} velocity
   * @returns {({ top: number, left: number})}
   */
  handleIdleMovement(elapsedMs, position, velocity, levelData, exit) {
    const fudderPos = {
      fudder3TopMin: levelData.fudderDefaultPosition.fudder3Top,
      fudder3TopMax: levelData.fudderDefaultPosition.fudder3Top + 1,
    };
  
    const newPosition = Object.assign({}, this.position);
  
    const fudderHouse = levelData.fudderHouse;
    const { centerX, centerYMin, centerYMax, centerY } = fudderHouse;

    if (this.idleMode === 'idle') {
      this.idleStatus = true;
    }
    
    if ((position.y <= fudderPos.fudder3TopMin) && this.idleStatus) {
      this.direction = this.characterUtil.directions.down;
    } else if ((position.y >= fudderPos.fudder3TopMax) && this.idleStatus) {
      this.direction = this.characterUtil.directions.up;
    }
  
    if (this.idleMode === 'leaving') {
      const sideOfCenter = (position.x < centerX) ? 'right' : 'left';
  
      if ((position.x > exit.xMin) 
        && (position.x < exit.xMax)
        && (position.y > exit.yMin) 
        && (position.y < exit.yMax)) {
        //console.log(position.x, '>', exit.xMin, '&&', position.x, '<', exit.xMax, '&&', position.y, '>', exit.yMin, '&&', position.y, '<', exit.yMax)
          
        window.dispatchEvent(new Event('releaseFudder'));
        this.idleMode = undefined;
        this.idleStatus = false;
        if (exit.direction === 'up' || exit.direction === 'down') {
          newPosition.top = this.scaledTileSize * exit.yBlock;
        } else if (exit.direction === 'right' || exit.direction === 'left') {
          newPosition.left = this.scaledTileSize * exit.x;
        }
        this.direction = (exit.direction === 'up' || exit.direction === 'down')
        ? (Math.random() < 0.5 ? this.characterUtil.directions.left : this.characterUtil.directions.right)
        : (Math.random() < 0.5 ? this.characterUtil.directions.up : this.characterUtil.directions.down);
      } else if (position.x > exit.xMin &&(position.x < exit.xMax)) {
        newPosition.left = this.scaledTileSize * exit.x;
        this.idleStatus = false;
        this.direction = this.characterUtil.directions[exit.direction];
      } else if (position.y > centerYMin && position.y < centerYMax) {
          newPosition.top = this.scaledTileSize * centerY;
          this.idleStatus = false;
          if (exit.direction === 'up' || exit.direction === 'down') {
            this.direction = this.characterUtil.directions[sideOfCenter];
          } else {
            this.direction = this.characterUtil.directions[exit.direction];
          }
      }
    }
  
    newPosition[this.characterUtil.getPropertyToChange(this.direction)]
      += this.characterUtil.getVelocity(this.direction, velocity) * elapsedMs;
  
    return newPosition;
  }  

  /**
   * Sets idleMode to 'leaving', allowing the fudder to leave the Fudder House
   */
  endIdleMode() {
    this.idleMode = 'leaving';
  }

  /**
   * Handle the fudder's movement when it is snapped to the x-y grid of the Maze Array
   * @param {number} elapsedMs - The amount of MS that have passed since the last update
   * @param {({x: number, y: number})} gridPosition - x-y position during the current frame
   * @param {number} velocity - The distance the character should travel in a single millisecond
   * @param {({x: number, y: number})} luncmanGridPosition - x-y position on the 2D Maze Array
   * @returns {({ top: number, left: number})}
   */
  handleSnappedMovement(elapsedMs, gridPosition, velocity, luncmanGridPosition) {
    const newPosition = Object.assign({}, this.position);

    this.lastDirection = this.direction;
    
    this.direction = this.determineDirection(
        this.name, gridPosition, luncmanGridPosition, this.direction,
        this.mazeArray, this.mode,
      );
    
    // if direction is undefined, set random direction
    if (!this.direction) {
      this.direction = this.lastDirection;
    }
  
    newPosition[this.characterUtil.getPropertyToChange(this.direction)]
      += this.characterUtil.getVelocity(this.direction, velocity) * elapsedMs;

    return newPosition;
  }

  /**
   * Determines if an eaten fudder is at the entrance of the Fudder House
   * @param {('chase'|'scatter'|'scared'|'eyes')} mode - The character's behavior mode
   * @param {({x: number, y: number})} position - x-y position during the current frame
   * @returns {Boolean}
   */
  enteringFudderHouse(mode, position) {
    const entering =
      (this.exit.direction === 'up' || this.exit.direction === 'down')
        ? mode === 'eyes' &&
          position.y === this.exit.yMax &&
          position.x > this.exit.xMin &&
          position.x < this.exit.xMax
        : mode === 'eyes' &&
          position.x === this.exit.xMax &&
          position.y > this.exit.yMin &&
          position.y < this.exit.yMax;
  
    if (entering && this.eatenTimer) {
      this.eatenTimer.pause(true);
      this.eatenTimer = null;
    }
  
    return entering;
  }

  /**
   * Determines if an eaten fudder has reached the center of the Fudder House
   * @param {('chase'|'scatter'|'scared'|'eyes')} mode - The character's behavior mode
   * @param {({x: number, y: number})} position - x-y position during the current frame
   * @returns {Boolean}
   */
  enteredFudderHouse(mode, position) {
    if (this.exit.direction === 'up' || this.exit.direction === 'down') {
      return (
      mode === 'eyes'
      && (position.x === this.exit.xMiddle)
      && (position.y > (this.exit.yMiddle - 0.2) && position.y < (this.exit.yMiddle + 0.2))
      );
    } else {
      return (
        mode === 'eyes'
        && (position.y === this.exit.yMiddle)
        && (position.x > (this.exit.xMiddle - 0.2) && position.x < (this.exit.xMiddle + 0.2))
      );
    }
  }

  /**
   * Determines if a restored fudder is at the exit of the Fudder House
   * @param {('chase'|'scatter'|'scared'|'eyes')} mode - The character's behavior mode
   * @param {({x: number, y: number})} position - x-y position during the current frame
   * @returns {Boolean}n
   */
  leavingFudderHouse(mode, position) {
      if (this.exit.direction === 'up' || this.exit.direction === 'down') {
        return (
          mode !== 'eyes'
          && (position.x === this.exit.xMiddle)
          && (position.y > (this.exit.yMin - 0.05) && position.y < (this.exit.yMax + 0.05))
        );
      } else {
        return (
          mode !== 'eyes'
          && (position.y === this.exit.yMiddle)
          && (position.x > (this.exit.xMin + 0.05) && position.y < (this.exit.xMax + 0.05))
        );
      }
    }

  /**
   * Handles entering and leaving the Fudder House after a fudder is eaten
   * @param {({x: number, y: number})} gridPosition - x-y position during the current frame
   * @returns {({x: number, y: number})}
   */
  handleFudderHouse(gridPosition) {
    const gridPositionCopy = Object.assign({}, gridPosition);
    const fudderHouse = this.levelData.fudderHouse;
    let enteringDirection;

    if (!this.exit) {
      this.exit = this.getRandomExit(fudderHouse.exits);
    }
  
    if (this.enteringFudderHouse(this.mode, gridPosition)) {
      //console.log(this.name, 'is entering', 'x', gridPosition.x, 'y', gridPosition.y)
      this.entering = true;
      enteringDirection = this.characterUtil.getOppositeDirection(this.exit.direction);

      this.direction = this.characterUtil.directions[enteringDirection];
      //console.log('ent direction: ', enteringDirection, 'real direction: ', this.direction)

      if (enteringDirection === 'up' || enteringDirection === 'down') {
        //console.log('original gridPosition is at', gridPosition, 'xMiddle is', this.exit.xMiddle)
        gridPositionCopy.x = this.exit.xMiddle;
        //console.log(this.name, 'new gridPosition is at', gridPositionCopy)
        this.position = this.characterUtil.snapToGrid(
          gridPositionCopy, this.direction, this.scaledTileSize,
        );
      } else {
        gridPositionCopy.y = this.exit.yMiddle;
        //console.log(this.name, 'has a gridPosition of', gridPositionCopy)
        this.position = this.characterUtil.snapToGrid(
          gridPositionCopy, this.direction, this.scaledTileSize,
        );
      }
    }
  
    if (this.enteredFudderHouse(this.mode, gridPosition)) {
      this.entering = false;
      this.direction = this.exit.direction;

      if (this.exit.direction === 'up' || this.exit.direction === 'down') {
        gridPositionCopy.y = this.exit.yMiddle;
        //console.log(this.name, 'entered', 'x', gridPositionCopy.x, 'y', gridPositionCopy.y, 'going', this.direction)

        this.position = this.characterUtil.snapToGrid(
          gridPositionCopy, this.direction, this.scaledTileSize,
        );
      } else {
        gridPositionCopy.x = this.exit.xMiddle;
        //console.log(this.name, 'entered', 'x', gridPositionCopy.x, 'y', gridPositionCopy.y, 'going', this.direction)
              
        this.position = this.characterUtil.snapToGrid(
          gridPositionCopy, this.direction, this.scaledTileSize,
        );
      }

      this.mode = this.defaultMode;
      //console.log(this.name, 'entered fudder house', 'x', gridPositionCopy.x, 'y', gridPositionCopy.y)
      window.dispatchEvent(new Event('restoreFudder'));
    }
  
    if (this.leavingFudderHouse(this.mode, gridPosition)) {
      if (this.exit.direction === 'up' || this.exit.direction === 'down') {
        gridPositionCopy.y = this.exit.yMax;
      } else {
        gridPositionCopy.x = this.exit.xMax;
      }
      //console.log(this.name, 'is leaving', 'x', gridPositionCopy.x, 'y', gridPositionCopy.y)
      this.position = this.characterUtil.snapToGrid(
        gridPositionCopy, this.direction, this.scaledTileSize,
      );
      this.direction = (this.exit.direction === 'up' || this.exit.direction === 'down')
      ? (Math.random() < 0.5 ? this.characterUtil.directions.left : this.characterUtil.directions.right)
      : (Math.random() < 0.5 ? this.characterUtil.directions.up : this.characterUtil.directions.down);
    }
  
    return gridPositionCopy;
  }  

  targetDistance(position, target) {
    return Math.sqrt(Math.pow(position.x - target.x, 2) + Math.pow(position.y - target.y, 2));
  }

  /**
   * Handle the fudder's movement when it is inbetween tiles on the x-y grid of the Maze Array
   * @param {number} elapsedMs - The amount of MS that have passed since the last update
   * @param {({x: number, y: number})} gridPosition - x-y position during the current frame
   * @param {number} velocity - The distance the character should travel in a single millisecond
   * @returns {({ top: number, left: number})}
   */
  handleUnsnappedMovement(elapsedMs, gridPosition, velocity, disableSnapping) {
    const gridPositionCopy = this.handleFudderHouse(gridPosition);
  
    const desired = this.characterUtil.determineNewPositions(
      this.position, this.direction, velocity, elapsedMs, this.scaledTileSize,
    );
  
    if (disableSnapping) {
      return desired.newPosition;
    }
  
    if (this.characterUtil.changingGridPosition(
      gridPositionCopy, desired.newGridPosition,
    )) {
      return this.characterUtil.snapToGrid(
        gridPositionCopy, this.direction, this.scaledTileSize,
      );
    }
  
    return desired.newPosition;
  }

  /**
   * Determines the new Fudder position
   * @param {number} elapsedMs
   * @returns {({ top: number, left: number})}
   */
  handleMovement(elapsedMs) {
    if (this.attacked || this.dead) {
      // Just return the current position to keep the fudder still when attacked.
      return this.position;
    }

    let newPosition;
  
    const gridPosition = this.characterUtil.determineGridPosition(
      this.position, this.scaledTileSize,
    );
    const luncmanGridPosition = this.characterUtil.determineGridPosition(
      this.luncman.position, this.scaledTileSize,
    );
    const velocity = this.determineVelocity(
      gridPosition, this.mode,
    );
  
    if (this.idleMode) {
      newPosition = this.handleIdleMovement(
        elapsedMs, gridPosition, velocity, this.levelData, this.exit
      );
    } else if (JSON.stringify(this.position) === JSON.stringify(
      this.characterUtil.snapToGrid(
        gridPosition, this.direction, this.scaledTileSize,
      ),
    )) {
      newPosition = this.handleSnappedMovement(
        elapsedMs, gridPosition, velocity, luncmanGridPosition,
      );
    } else {
      newPosition = this.handleUnsnappedMovement(
        elapsedMs, gridPosition, velocity,
      );
    }
  
    newPosition = this.characterUtil.handleWarp(
      newPosition, this.scaledTileSize, this.mazeArray,
    );
  
    this.checkCollision(gridPosition, luncmanGridPosition);
  
    return newPosition;
  }

  /**
   * Changes the defaultMode to chase or scatter, and turns the fudder around
   * if needed
   * @param {('chase'|'scatter')} newMode
   */
  changeMode(newMode) {
    this.defaultMode = newMode;

    const gridPosition = this.characterUtil.determineGridPosition(
      this.position, this.scaledTileSize,
    );

    if ((this.mode === 'chase' || this.mode === 'scatter')
      && !this.cruiseElroy) {
      this.mode = newMode;

      if (!this.isInFudderHouse(gridPosition, this.levelData.fudderHouse)) {
        this.direction = this.characterUtil.getOppositeDirection(
          this.direction,
        );
      }
    }
  }

  /**
   * Toggles a scared fudder between blue and white, then updates its spritsheet
   */
  toggleScaredColor() {
    this.scaredColor = (this.scaredColor === 'blue')
      ? 'white' : 'blue';
    this.setSpriteSheet(this.name, this.direction, this.mode);
  }

  /**
   * Sets the fudder's mode to SCARED, turns the fudder around,
   * and changes spritesheets accordingly
   */
  becomeScared() {
    if (this.dead) {
      return;
    }
    const gridPosition = this.characterUtil.determineGridPosition(
      this.position, this.scaledTileSize,
    );

    if (this.mode !== 'eyes') {
      if (!this.isInFudderHouse(gridPosition, this.levelData.fudderHouse) && this.mode !== 'scared') {
        this.direction = this.characterUtil.getOppositeDirection(
          this.direction,
        );
      }
      this.mode = 'scared';
      this.scaredColor = 'blue';
      this.setSpriteSheet(this.name, this.direction, this.mode);
    }  
  }

  /**
   * Returns the scared fudder to chase/scatter mode and sets its spritesheet
   */
  endScared() {
    this.mode = this.defaultMode;
    this.setSpriteSheet(this.name, this.direction, this.mode);
  }

  /**
   * Speeds up the fudder (used for fudder1 as Luncdots are eaten)
   */
  speedUp() {
    this.cruiseElroy = true;

    if (this.defaultSpeed === this.slowSpeed) {
      this.defaultSpeed = this.mediumSpeed;
    } else if (this.defaultSpeed === this.mediumSpeed) {
      this.defaultSpeed = this.fastSpeed;
    }
  }

  /**
   * Resets defaultSpeed to slow and updates the spritesheet
   */
  resetDefaultSpeed() {
    this.defaultSpeed = this.slowSpeed;
    this.cruiseElroy = false;
    this.setSpriteSheet(this.name, this.direction, this.mode);
  }

  /**
   * Sets a flag to indicate when the fudder should pause its movement
   * @param {Boolean} newValue
   */
  pause(newValue) {
    this.paused = newValue;
  }

  /**
   * Checks if the fudder contacts Luncman - starts the death sequence if so
   * @param {({x: number, y: number})} position - An x-y position on the 2D Maze Array
   * @param {({x: number, y: number})} luncman - Luncman's current x-y position on the 2D Maze Array
   */
  checkCollision(position, luncman) {

    if (this.calculateDistance(position, luncman) < 1
      && this.mode !== 'eyes'
      && this.allowCollision) {
        if (this.luncman.attack) {
              window.dispatchEvent(new CustomEvent('attackFudder', {
                detail: {
                  fudder: this,
                },
              }));
              this.fudderAttacked();
        } else if (this.mode === 'scared') {
          window.dispatchEvent(new CustomEvent('eatFudder', {
            detail: {
              fudder: this,
            },
          }));
          this.mode = 'eyes';
          this.startEatenTimer(position);
          //console.log('eaten position', position, this.name);
        } else {
        window.dispatchEvent(new Event('deathSequence'));
      }
    }
  }

  /**
   * Teleports the fudder to the fudder house if it is in 'eyes' mode for more than 20 seconds
   */
  startEatenTimer(gridPosition) {
    const currentTime = new Date().getTime();
    if (!this.lastEatenTimer || currentTime - this.lastEatenTimer > 20000) {
      this.lastEatenTimer = currentTime;
      this.eatenTimer = new Timer(() => {
        if (!this.enteringFudderHouse(this.mode, gridPosition)) {
          this.killFudder();
        }
        this.eatenTimer = null;
      }, 15000);
    }
  }

  /**
   * Handles the fudder when it is attacked
   */
  fudderAttacked() {
    // Set attacked to true and start a 2-second timer to set attacked to false
    this.attacked = true;
    this.allowCollision = false;
    const timerDuration = 2000; // 2 seconds
    const timerCallback = () => {
      this.attacked = false;
      this.allowCollision = true;
    };
    this.attackTimer = new Timer(timerCallback, timerDuration);

    // Check the conditions to call reduceHealth with the appropriate damage
    if (this.luncman.speedBoost && this.mode === 'scared') {
      this.reduceHealth(100);
    } else if (this.luncman.speedBoost) {
      this.reduceHealth(100);
    } else if (this.mode === 'scared') {
      this.reduceHealth(100);
    } else {
      this.reduceHealth(50);
    }
  }

  /**
   * Reduces the Fudder's health by the given damage
   * @param {number} damage - The amount of health to reduce
   */
  reduceHealth(damage) {
    console.log('Reducing health for:', this.name);
    if (this.health - damage <= 0) {
      this.killFudder();
    } else {
      this.health -= damage;
      console.log(this.name, 'got got for', damage, 'only has', this.health, 'health left');
      
      // Set the health bar color to white
      this.healthBar.style.backgroundColor = 'white';
  
      // Wait for 25ms, then update the health bar
      setTimeout(() => {
        this.updateHealthBar();
      }, 25);
    }
    window.luncMachine.gameCoordinator.updateGameState();
    if (this.luncman.attack) {
      window.luncMachine.gameCoordinator.gameState.playerStats.attacksHit += 1;
    }
  }

  updateHealthBar() {
    if (this.name === 'fudder1') {
      this.healthPercentage = this.health / this.levelData.assets.fudder1Health;
    } else {
      this.healthPercentage = this.health / this.levelData.assets.fudderHealth;
    }
    this.healthBar.classList.add('health-bar');
  
    let healthBarWidth;
    let healthColor;
    
    if (this.dead) {
      healthColor = 'rgb(255, 0, 0)';
      healthBarWidth = 0;
    } else {
      healthBarWidth = Math.max(0, this.healthPercentage * 100);
      healthColor = this.getHealthBarColor(this.healthPercentage);
    }
  
    this.healthBar.style.width = healthBarWidth + '%';
    this.healthBar.style.backgroundColor = healthColor;
  }
  
  getHealthBarColor(percentage) {
    const red = Math.round(255 * Math.min(1, (1 - percentage) * 1.333));
    const green = Math.round(255 * percentage);
    return `rgb(${red}, ${green}, 0)`;0
  }

  /**
   * Handles the fudder death sequence
   */
  killFudder() {
    console.log(this.name, 'got clapped')
    //this.moving = false;
    this.allowCollision = false;
    this.attacked = false;
    this.dead = true;
    this.setDeathAnimationStats();

    // Update health bar when the Fudder is killed
    this.updateHealthBar();

    window.dispatchEvent(new CustomEvent('killFudder', {
      detail: {
        fudder: this,
      },
    }));
  }

  /**
   * Determines the appropriate speed for the fudder
   * @param {({x: number, y: number})} position - An x-y position on the 2D Maze Array
   * @param {('chase'|'scatter'|'scared'|'eyes')} mode - The character's behavior mode
   * @returns {number}
   */
  determineVelocity(position, mode) {
    if (mode === 'eyes') {
      return this.eyeSpeed;
    }

    if (this.paused) {
      return 0;
    }

    if (this.isInTunnel(position, this.levelData) || this.isInFudderHouse(position, this.levelData.fudderHouse)) {
      return this.transitionSpeed;
    }

    if (mode === 'scared') {
      return this.scaredSpeed;
    }

    return this.defaultSpeed;
  } 

  /**
   * Updates the css position, hides if there is a stutter, and animates the spritesheet
   * @param {number} interp - The animation accuracy as a percentage
   */
  draw(interp) {
    const newTop = this.characterUtil.calculateNewDrawValue(
      interp, 'top', this.oldPosition, this.position,
    );
    const newLeft = this.characterUtil.calculateNewDrawValue(
      interp, 'left', this.oldPosition, this.position,
    );
    this.animationTarget.style.top = `${newTop}px`;
    this.animationTarget.style.left = `${newLeft}px`;

  
    if (this.mode === 'eyes') {
      this.animationTarget.style.visibility = 'visible';
    } else {
      this.animationTarget.style.visibility = this.display
        ? this.characterUtil.checkForStutter(this.position, this.oldPosition)
        : 'hidden';
    }
  
    const updatedProperties = this.characterUtil.advanceSpriteSheet(this);
    this.msSinceLastSprite = updatedProperties.msSinceLastSprite;
    this.animationTarget = updatedProperties.animationTarget;
    this.backgroundOffsetPixels = updatedProperties.backgroundOffsetPixels;
  }  

  /**
   * Handles movement logic for the fudder
   * @param {number} elapsedMs - The amount of MS that have passed since the last update
   */
  update(elapsedMs) {
    this.oldPosition = Object.assign({}, this.position);

    if (this.moving) {
      this.position = this.handleMovement(elapsedMs);
      this.setSpriteSheet(this.name, this.direction, this.mode);
      this.msSinceLastSprite += elapsedMs;
    }
  }
}

class Luncman {
  constructor(scaledTileSize, characterUtil, levelData) {
    this.scaledTileSize = scaledTileSize;
    this.mazeArray = levelData.mazeArray;
    this.defaultPosition = levelData.defaultPosition;
    this.characterUtil = characterUtil;
    this.animationTarget = document.getElementById('luncman');
    this.luncmanArrow = document.getElementById('luncman-arrow');
    this.speedBoost = null;
    this.originalVelocityPerMs = this.calculateVelocityPerMs(scaledTileSize);
    this.motionBlurCopies = [];
    this.scared = false;
    this.attack = false;
    this.levelData = levelData;

    this.reset();
  }

  /**
   * Rests the character to its default state
   */
  reset() {
    this.mazeArray = this.levelData.mazeArray;
    this.defaultPosition = this.levelData.defaultPosition;

    this.setMovementStats(this.scaledTileSize);
    this.setSpriteAnimationStats();
    this.setStyleMeasurements(this.scaledTileSize, this.spriteFrames);
    this.updateDefaultPosition(this.levelData.defaultPosition);
    this.setDefaultPosition(this.scaledTileSize, this.defaultPosition);
    this.setSpriteSheet(this.direction);
    this.luncmanArrow.style.backgroundImage = 'url(/style/graphics/'
      + `spriteSheets/characters/luncman/arrow_${this.direction}.svg)`;
    this.attackCount = 0;
    this.isDead = false;

  }

  // update default position
  updateDefaultPosition(newDefaultPosition) {
    this.defaultPosition = newDefaultPosition;
  }

  /**
   * Sets various properties related to Luncman's movement
   * @param {number} scaledTileSize - The dimensions of a single tile
   */
  setMovementStats(scaledTileSize) {
    this.velocityPerMs = this.calculateVelocityPerMs(scaledTileSize);
    this.desiredDirection = this.characterUtil.directions.left;
    this.direction = this.characterUtil.directions.left;
    this.moving = false;
  } 

  resetVelocityPerMs() {
    this.velocityPerMs = this.originalVelocityPerMs;
  }

  // speed boost functions

  getSpeedBoost() {
    this.speedBoost = true;
    this.velocityPerMs = this.velocityPerMs * 2;
    const createBlurInterval = setInterval(() => {
      this.createMotionBlurCopy();
    }, 50); // create a motion blur copy every 50ms
    setTimeout(() => {
      clearInterval(createBlurInterval); // stop creating motion blur copies
      this.resetVelocityPerMs();
      this.speedBoost = false;
    }, 250); // milliseconds
  }

  createMotionBlurCopy() {
    let position = this.position;

    this.motionBlurCopies.push({
      position: { ...position },
      opacity: 1
    });
  }
  
  
  setScaredSpriteSheet() {
    this.scared = true;
    this.updateSpriteSheet();
  }
  
  resetSpriteSheet() {
    this.scared = false;
    this.updateSpriteSheet();
  }

  updateSpriteSheet() {
    if (this.isDead) {
      return; // If Luncman is dead, don't change the sprite sheet
  }
    if (this.scared && !this.attack) {
      this.animationTarget.style.backgroundImage = 'url(/style/graphics/'
        + `spriteSheets/characters/luncman/luncman_${this.direction}+.webp)`;
    } else if (this.attack) {
      this.setAttackAnimationStats();
      if (this.scared) {
        this.animationTarget.style.backgroundImage = 'url(/style/graphics/'
        + `spriteSheets/characters/luncman/luncman+_${this.direction}_fire.webp)`;
      } else {
        this.animationTarget.style.backgroundImage = 'url(/style/graphics/'
        + `spriteSheets/characters/luncman/luncman_${this.direction}_fire.webp)`;
      }
    } else {
      this.setSpriteSheet(this.direction);
    }
  }

  setAttackAnimationStats() {
    this.specialAnimation = true;
    this.display = true;
    this.animate = true;
    this.loopAnimation = true;
    this.msBetweenSprites = 50;
    this.msSinceLastSprite = 0;
    this.spriteFrames = 4;
  
    this.luncmanArrow.style.display = 'none';

    this.animationTarget.style.backgroundPosition = '0px 0px';
  
    const width = this.measurement * 2;
    const height = this.measurement;
  
    if (this.direction === 'left' || this.direction === 'right') {
      this.animationTarget.style.height = `${height}px`;
      this.animationTarget.style.width = `${width}px`;
      this.animationTarget.style.backgroundSize = `${width * this.spriteFrames}px`;
    } else {
      this.animationTarget.style.width = `${height}px`;
      this.animationTarget.style.height = `${width}px`;
      this.animationTarget.style.backgroundSize = `${height * this.spriteFrames}px`;
    }
  }
  


  //attack functions
 
  giveAttack() {
    if (this.attackCount < 3) {
    this.attackCount += 1;
    }
  }
  
  getAttack() {
    if (this.attack === false) {
      console.log(`Using ${this.attackCount}/3 attacks`);
      this.attack = true;
      this.attackCount -= 1;
      this.velocityPerMs = this.velocityPerMs * 2.5;
  
  
      // Create motion blur copies of the updated sprite sheet
      const createBlurInterval = setInterval(() => {
        this.createMotionBlurCopy();
      }, 50); // create a motion blur copy every 50ms
  
      setTimeout(() => {
        this.luncmanArrow.style.display = 'block';
        clearInterval(createBlurInterval); // stop creating motion blur copies
        this.resetVelocityPerMs();
        this.attack = false;
        this.setSpriteAnimationStats();
        this.setStyleMeasurements(this.scaledTileSize, this.spriteFrames);

      }, 250); // milliseconds
    }
  }

 


  /**
   * Temporarily boosts Luncman's speed by a multiplier for a given duration
   * @param {number} duration - The duration of the speed boost in seconds
   * @param {number} multiplier - The multiplier to apply to Luncman's speed
   */

  /**
   * Sets values pertaining to Luncman's spritesheet animation
   */
  setSpriteAnimationStats() {
    this.specialAnimation = false;
    this.display = true;
    this.animate = true;
    this.loopAnimation = true;
    this.msBetweenSprites = 50;
    this.msSinceLastSprite = 0;
    this.spriteFrames = 4;
    this.backgroundOffsetPixels = 0;
    this.animationTarget.style.backgroundPosition = '0px 0px';
  }

  /**
   * Sets css property values for Luncman and Luncman's Arrow
   * @param {number} scaledTileSize - The dimensions of a single tile
   * @param {number} spriteFrames - The number of frames in Luncman's spritesheet
   */
  setStyleMeasurements(scaledTileSize, spriteFrames) {
    this.measurement = scaledTileSize * 2;

    this.animationTarget.style.height = `${this.measurement}px`;
    this.animationTarget.style.width = `${this.measurement}px`;
    this.animationTarget.style.backgroundSize = `${
      this.measurement * spriteFrames
    }px`;

    this.luncmanArrow.style.height = `${this.measurement * 2}px`;
    this.luncmanArrow.style.width = `${this.measurement * 2}px`;
    this.luncmanArrow.style.backgroundSize = `${this.measurement * 2}px`;
  }

  /**
   * Sets the default position and direction for Luncman at the game's start
   * @param {number} scaledTileSize - The dimensions of a single tile
   */
  setDefaultPosition(scaledTileSize, defaultPosition) {
    this.defaultPosition = {
      top: scaledTileSize * defaultPosition.top,
      left: scaledTileSize * defaultPosition.left,
    };
    this.position = Object.assign({}, this.defaultPosition);
    this.oldPosition = Object.assign({}, this.position);
    this.animationTarget.style.top = `${this.position.top}px`;
    this.animationTarget.style.left = `${this.position.left}px`;
  }

  /**
   * Calculates how fast Luncman should move in a millisecond
   * @param {number} scaledTileSize - The dimensions of a single tile
   */
  calculateVelocityPerMs(scaledTileSize) {
    // In the original game, Luncman moved at 11 tiles per second.
    const velocityPerSecond = scaledTileSize * 11;
    return velocityPerSecond / 1000;
  }

 /**
   * Chooses a movement Spritesheet depending upon direction
   * @param {('up'|'down'|'left'|'right')} direction - The character's current travel orientation
   */
 setSpriteSheet(direction) {
    this.animationTarget.style.backgroundImage = 'url(/style/graphics/'
    + `spriteSheets/characters/luncman/luncman_${direction}.webp)`;
}
  prepDeathAnimation() {
    this.isDead = true;
    this.loopAnimation = false;
    this.msBetweenSprites = 125;
    this.spriteFrames = 8; 
    this.specialAnimation = true;
    this.backgroundOffsetPixels = 0;
    const bgSize = this.measurement * this.spriteFrames;
    this.animationTarget.style.backgroundSize = `${bgSize}px`;
    this.animationTarget.style.backgroundImage = 'url(/style/'
      + 'graphics/spriteSheets/characters/luncman/luncman_death.webp)';
    this.animationTarget.style.backgroundPosition = '0px 0px';
    this.luncmanArrow.style.backgroundImage = '';
  }

  /**
   * Changes Luncman's desiredDirection, updates the LuncmanArrow sprite, and sets moving to true
   * @param {Event} e - The keydown event to evaluate
   * @param {Boolean} startMoving - If true, Luncman will move upon key press
   */
  changeDirection(newDirection, startMoving) {

    const gridPosition = this.characterUtil.determineGridPosition(
      this.position, this.scaledTileSize,
    );
    const changedDirection = this.characterUtil.checkDirectionChange(this.direction, newDirection, 'luncman', gridPosition);
    this.desiredDirection = changedDirection;
    this.luncmanArrow.style.backgroundImage = 'url(/style/graphics/'
      + `spriteSheets/characters/luncman/arrow_${this.desiredDirection}.svg)`;

    if (startMoving) {
      this.moving = true;
    }
  }

  /**
   * Updates the position of the leading arrow in front of Luncman
   * @param {({top: number, left: number})} position - Luncman's position during the current frame
   * @param {number} scaledTileSize - The dimensions of a single tile
   */
  updateLuncmanArrowPosition(position, scaledTileSize) {
    this.luncmanArrow.style.top = `${position.top - scaledTileSize}px`;
    this.luncmanArrow.style.left = `${position.left - scaledTileSize}px`;
  }

  /**
   * Handle Luncman's movement when he is snapped to the x-y grid of the Maze Array
   * @param {number} elapsedMs - The amount of MS that have passed since the last update
   * @returns {({ top: number, left: number})}
   */
  handleSnappedMovement(elapsedMs) {
    const desired = this.characterUtil.determineNewPositions(
      this.position, this.desiredDirection, this.velocityPerMs,
      elapsedMs, this.scaledTileSize,
    );
    const alternate = this.characterUtil.determineNewPositions(
      this.position, this.direction, this.velocityPerMs,
      elapsedMs, this.scaledTileSize,
    );
  
    if (!this.characterUtil.checkForWallCollision(
      desired.newGridPosition, this.mazeArray, this.desiredDirection,
    )) {
      this.direction = this.desiredDirection;
      this.setSpriteSheet(this.direction);
      return desired.newPosition;
    } else if (!this.characterUtil.checkForWallCollision(
      alternate.newGridPosition, this.mazeArray, this.direction,
    )) {
      return alternate.newPosition;
    }
  
    this.moving = false;
    return this.position;
  } 

  /**
   * Handle Luncman's movement when he is inbetween tiles on the x-y grid of the Maze Array
   * @param {({x: number, y: number})} gridPosition - x-y position during the current frame
   * @param {number} elapsedMs - The amount of MS that have passed since the last update
   * @returns {({ top: number, left: number})}
   */
  handleUnsnappedMovement(gridPosition, elapsedMs) {
    const desired = this.characterUtil.determineNewPositions(
      this.position, this.desiredDirection, this.velocityPerMs,
      elapsedMs, this.scaledTileSize,
    );
    const alternate = this.characterUtil.determineNewPositions(
      this.position, this.direction, this.velocityPerMs,
      elapsedMs, this.scaledTileSize,
    );

    if (this.characterUtil.turningAround(
      this.direction, this.desiredDirection,
    )) {
      this.direction = this.desiredDirection;
      this.setSpriteSheet(this.direction);
      return desired.newPosition;
    } if (this.characterUtil.changingGridPosition(
      gridPosition, alternate.newGridPosition,
    )) {
      return this.characterUtil.snapToGrid(
        gridPosition, this.direction, this.scaledTileSize,
      );
    }
    return alternate.newPosition;
  }

  /**
   * Updates the css position, hides if there is a stutter, and animates the spritesheet
   * @param {number} interp - The animation accuracy as a percentage
   */
  draw(interp) {
    let newTop = this.characterUtil.calculateNewDrawValue(
      interp, 'top', this.oldPosition, this.position,
    );
    let newLeft = this.characterUtil.calculateNewDrawValue(
      interp, 'left', this.oldPosition, this.position,
    );

    if (!this.attack) {
      this.animationTarget.style.top = `${newTop}px`;
      this.animationTarget.style.left = `${newLeft}px`;
    } else if (this.direction === 'down') {
      this.animationTarget.style.top = `${newTop - this.measurement}px`;
      this.animationTarget.style.left = `${newLeft}px`;
      } else if (this.direction === 'right') {
        this.animationTarget.style.left = `${newLeft - this.measurement}px`;
        this.animationTarget.style.top = `${newTop}px`;
      } else {
        this.animationTarget.style.top = `${newTop}px`;
        this.animationTarget.style.left = `${newLeft}px`;
        if (this.direction === 'right') {
        }
      }

    this.animationTarget.style.visibility = this.display
      ? this.characterUtil.checkForStutter(this.position, this.oldPosition)
      : 'hidden';
    this.luncmanArrow.style.visibility = this.animationTarget.style.visibility;

    this.updateLuncmanArrowPosition(this.position, this.scaledTileSize);

    const updatedProperties = this.characterUtil.advanceSpriteSheet(this);
    this.msSinceLastSprite = updatedProperties.msSinceLastSprite;
    this.animationTarget = updatedProperties.animationTarget;
    this.backgroundOffsetPixels = updatedProperties.backgroundOffsetPixels;
    this.drawMotionBlurCopies();
  }

  drawMotionBlurCopies() {
    if (this.attack || this.speedBoost) {
      this.motionBlurCopies.forEach(copy => {
        const motionBlurCopy = this.animationTarget.cloneNode(true);
        motionBlurCopy.style.opacity = copy.opacity;
        motionBlurCopy.style.top = `${copy.position.top}px`;
        motionBlurCopy.style.left = `${copy.position.left}px`;

      if (!this.attack) {
        motionBlurCopy.style.top = `${copy.position.top}px`;
        motionBlurCopy.style.left = `${copy.position.left}px`;
      } else if (this.direction === 'down') {
          motionBlurCopy.style.top = `${copy.position.top - this.measurement}px`;
          motionBlurCopy.style.left = `${copy.position.left}px`;
        } else if (this.direction === 'right') {
          motionBlurCopy.style.top = `${copy.position.top}px`;
          motionBlurCopy.style.left = `${copy.position.left - this.measurement}px`;
        } else {
          motionBlurCopy.style.top = `${copy.position.top}px`;
          motionBlurCopy.style.left = `${copy.position.left}px`;
          if (this.direction === 'right') {
          }
        }
    
        this.animationTarget.parentElement.appendChild(motionBlurCopy);
    
        setTimeout(() => {
          motionBlurCopy.remove();
        }, 0);
      });
    } else {
      return;
    }
  }

  /**
   * Handles movement logic for Luncman
   * @param {number} elapsedMs - The amount of MS that have passed since the last update
   */
  update(elapsedMs) {
    this.oldPosition = Object.assign({}, this.position);

    if (this.moving) {
      const gridPosition = this.characterUtil.determineGridPosition(
        this.position, this.scaledTileSize,
      );

      if (JSON.stringify(this.position) === JSON.stringify(
        this.characterUtil.snapToGrid(
          gridPosition, this.direction, this.scaledTileSize,
        ),
      )) {
        this.position = this.handleSnappedMovement(elapsedMs);
      } else {
        this.position = this.handleUnsnappedMovement(gridPosition, elapsedMs);
      }

      this.position = this.characterUtil.handleWarp(
        this.position, this.scaledTileSize, this.mazeArray,
      );
    }

    if (this.moving || this.specialAnimation) {
      this.msSinceLastSprite += elapsedMs;
    }

    this.updateSpriteSheet();

    this.motionBlurCopies = this.motionBlurCopies.map(copy => ({
      position: copy.position,
      opacity: copy.opacity - (elapsedMs / 1000) * 4// decrease opacity based on elapsed time
    })).filter(copy => copy.opacity > 0); // remove copies with zero or negative opacity
  }
}

class Ability {
  constructor(abilityIndex, abilityType, cooldownTime) {
    this.complete = false;
    this.paused = false;
    this.cooldownTime = cooldownTime;
    this.abilityIndex = abilityIndex;
    this.abilityType = abilityType;
    this.frameWidth = 32;  // width of each frame
    this.currentFrame = 0;  // current frame number
    this.readyFrame = 10; // last frame before loop
    this.frameDelay = this.cooldownTime / this.readyFrame;
    this.FPS = 100;
    this.loopFrames = [10, 11, 12];
    this.loopIndex = 0;
    this.eventDispatched = false;
    this.isMobile = window.luncMachine.gameCoordinator.isMobile;

    this.createAbility();
  }

  createAbility() {
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
    console.log('creating ability');
    // Determine the SVG path based on ability type.
    let abilitySvgPath;
    switch (this.abilityType) {
      case "simple-attack":
        abilitySvgPath = "style/graphics/attack.svg";  
        break;
      case "ultimate-attack":
        abilitySvgPath = "path/to/ultimate_attack.svg"; 
        break;
      default:
        abilitySvgPath = "path/to/default.svg"; 
    }
    
    // Create a new div element.
    this.abilityDiv = document.createElement("div");
    
    // Set the background image.
    this.abilityDiv.style.backgroundImage = `url(${abilitySvgPath})`;
    
    // Set the div to show only a single frame of the spritesheet.
    this.abilityDiv.style.width = `${this.frameWidth}px`;
    this.abilityDiv.style.height = '32px'; // replace with the height of your frames
    this.abilityDiv.style.backgroundRepeat = 'no-repeat';
    
    // Calculate the x-position based on the ability index.
    const totalWidth = 3 * this.frameWidth + 2 * 10;
    const xPos = this.abilityIndex * (this.frameWidth + 10);
    const screenWidth = window.innerWidth
    
    // Set the position of the div.
    this.abilityDiv.style.position = "absolute";
    this.abilityDiv.style.left = `${(screenWidth / 2) - (totalWidth / 2) + xPos}px`;
    if (this.isMobile) {
      this.abilityDiv.style.top = window.abilityTop;
    } else {
      this.abilityDiv.style.top = '5vh';
    }
    
    // Add the div to the body of the document.
    document.body.appendChild(this.abilityDiv);
    
    // Start the timer.
    this.startTimer();
  }

  startTimer() {
    // start timer (5 sec) & call completeAbility when finished
    this.abilityTimer = new Timer(() => this.completeAbility(), this.cooldownTime)

    // start animation
    this.updateAnimation();
  }

  updateTimer(updateAmount) {
    // subtract x ms from timer
    this.abilityTimer.remaining = this.abilityTimer.remaining - updateAmount;
    this.animation.remaining = this.animation.remaining - updateAmount;
  }

  updateAnimation() {
    if (!this.paused && !this.looping) {
      // If ability is complete, loop the final 3 frames
      if (this.complete) {
        this.looping = true;
        this.loopAnimation();
        return;
      }

      let remainingTime;
      
      // Check if pauseTime exists (i.e. the timer was recently resumed)
      if (this.pauseTime) {
        remainingTime = this.pauseTime;
        this.pauseTime = null;  // Reset pauseTime after it's used
      } else {
        remainingTime = this.abilityTimer.remaining;
      }
  
      // Calculate current frame based on remaining time on abilityTimer
      this.currentFrame = Math.floor(this.readyFrame - (remainingTime / this.frameDelay));
  
      // Set spritesheet to frame number
      this.abilityDiv.style.backgroundPosition = `-${this.frameWidth * this.currentFrame}px 0`;
      this.animation = new Timer(() => this.updateAnimation(), this.FPS);
    }
  }

  loopAnimation() {
    if (this.complete) {
      // Get the next frame to display from this.loopFrames.
      this.currentFrame = this.loopFrames[this.loopIndex];
      this.loopIndex = (this.loopIndex + 1) % this.loopFrames.length;
    
      // Set the spritesheet to the correct frame.
      this.abilityDiv.style.backgroundPosition = `-${this.frameWidth * this.currentFrame}px 0`;
    
      // Clear the previous loop timer.
      if (this.loopTimer) {
        clearTimeout(this.loopTimer.timerId);
      }
    
      // Set up the next loop.
      this.loopTimer = new Timer(() => this.loopAnimation(), this.loopFPS);
    }
  }

  updatePosition() {
    // Update the x-position based on the new ability index.
    const totalWidth = 3 * this.frameWidth + 2 * 10;
    const xPos = this.abilityIndex * (this.frameWidth + 10);
    const screenWidth = window.innerWidth;
    this.abilityDiv.style.left = `${(screenWidth / 2) - (totalWidth / 2) + xPos}px`;
  }

  togglePause() {
    // toggle pausing/resuming for ability timer/animation
    if (!this.complete) {
      if (this.paused) {
        this.paused = false;
        if (this.abilityTimer) {
          this.abilityTimer.resume();
        }
        this.animation.resume();
      } else {
        this.paused = true;
        if (this.abilityTimer) {
          this.pauseTime = this.abilityTimer.remaining; // Store the current time when pausing
          this.abilityTimer.pause();
        }
        this.animation.pause();
      }
    }
  }

  completeAbility() {
    if (!this.eventDispatched && !this.paused) {
      this.complete = true;
      window.dispatchEvent(new Event('abilityComplete'));
      console.log('ability', this.abilityIndex, 'complete');
      this.eventDispatched = true;
    }
  }

  useAbility() {
    // use ability only if complete
    if (this.complete) {
      this.abilityDiv.remove();
    }
  }

  removeAbility() {
    // Clear the timers
    if (this.abilityTimer) {
      clearTimeout(this.abilityTimer.timerId);
    }
    if (this.animation) {
      clearTimeout(this.animation.timerId);
    }
    if (this.loopAnimationTimer) {
      clearTimeout(this.loopTimer.timerId);
    }

    // Remove the div from the DOM
    this.abilityDiv.remove();
  }
}

class GameCoordinator {
  constructor(mazeArray, nextLevel) {
    this.contentContainer = document.getElementById('content-container')
    this.gameUi = document.getElementById('game-ui');
    this.rowTop = document.getElementById('row-top');
    this.mazeDiv = document.getElementById('maze');
    this.mazeArray = mazeArray;
    this.nextLevel = nextLevel;
    this.mazeImg = document.getElementById('maze-img');
    this.mazeCover = document.getElementById('maze-cover');
    this.pointsDisplay = document.getElementById('points-display');
    this.highScoreDisplay = document.getElementById('high-score-display');
    this.nameDisplay = document.getElementById('name-display');
    this.extraLivesDisplay = document.getElementById('extra-lives');
    this.fruitDisplay = document.getElementById('fruit-display');
    this.mainMenu = document.getElementById('main-menu-container');
    this.gameStartButton = document.getElementById('game-start');
    this.pauseButton = document.getElementById('pause-button');
    this.soundButton = document.getElementById('sound-button');
    this.leftCover = document.getElementById('left-cover');
    this.rightCover = document.getElementById('right-cover');
    this.pausedText = document.getElementById('paused-text');
    this.bottomRow = document.getElementById('bottom-row');
    this.movementButtons = document.getElementById('movement-buttons');
    this.rightHUD = document.getElementById('right-HUD');
    this.leftHUD = document.getElementById('left-HUD');
    this.deadFudders = [];
    this.isPanning = false;
    this.isMobile = this.checkIfMobile();
    this.highscoreDisplaySet = false;
    this.paused = false;
    this.gameStarted = false;
    this.dotsEaten = 0;
    this.seventyPercent = null;
    this.twentyFivePercent = null;
    this.boostTimeout = null; // initialize the boost timeout to null
    this.loadedLevels = {};
    this.abilities = [];
    this.waitingAbility = false; // waiting to create ability
    this.pausedFrame = null;
    this.pickups = [];
    this.entityList = [];
    this.fudders = [];
    this.fullReset = false;
    this.username = "";
    this.checkForUsername();
    this.fuddersKilled = 0;

    this.maxFps = 60;
    this.firstGame = true;
    this.newHighscore = false;
    this.advancingLevel = false;

    if (this.isMobile) {
      document.body.classList.add('mobile');
    }

    this.movementKeys = {
      // WASD
      87: 'up',
      83: 'down',
      65: 'left',
      68: 'right',

      // Arrow Keys
      38: 'up',
      40: 'down',
      37: 'left',
      39: 'right',
    };

    this.fruitPoints = {
      1: 100,
      2: 300,
      3: 500,
      4: 700,
      5: 1000,
      6: 2000,
      7: 3000,
      8: 5000,
    };

    this.volume = 0.02;

    this.registerEventListeners();

    this.pauseButton.addEventListener('click', this.handlePauseKey.bind(this));
    this.soundButton.addEventListener(
      'click',
      this.soundButtonClick.bind(this),
    );

    const head = document.getElementsByTagName('head')[0];
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/css/app.css';

    link.onload = this.preloadAssets.bind(this);

    head.appendChild(link);

    this.initGameState();
  }

  checkIfMobile() {
    return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  }

  checkForUsername() {
    const username = window.client.gloInfo.username;
    console.log('username', username)

    if (username) {
      this.username = username;
    }
  }

  initGameState() {
    this.gameState = new GameState();
    this.checkForUsername();

    const initialState = {
      userId: {userId: this.username},
      luncmanInfo: { position: null, attackCount: 0 },
      fudderInfo: [
          { name: 'fudder1', position: null, health: 150 },
          { name: 'fudder2', position: null, health: 100 },
          { name: 'fudder3', position: null, health: 100 },
          { name: 'fudder4', position: null, health: 100 }
      ],
      scoreInfo: { points: 0, luncEaten: 0, fruitEaten: 0, lives: 2, level: 1 }
    };

    window.client.socket.emit('initialize_game', initialState);
  }

  /**
   * Recursive method which determines the largest possible scale the game's graphics can use
   * @param {Number} scale
   */
  determineScale(scale, mazeTileHeight, mazeTileWidth) {
    if (mazeTileHeight <= 0 || mazeTileWidth <= 0) {
      throw new Error('Invalid maze dimensions. Both height and width should be greater than 0');
    }
    
    const contentContainer = document.getElementById('content-container');

    const scaledTileSize = this.tileSize * scale;

    if (this.isMobile) {
    const availableScreenHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--vh')) * 100;
    const availableScreenWidth = window.innerWidth;

    // Calculate 95% of the available screen dimensions
    const containerHeight = availableScreenHeight * 0.95;
    const containerWidth = (parseFloat(contentContainer.style.width) * availableScreenWidth / 100) * 0.95;
      
      if (
        scaledTileSize * mazeTileHeight < containerHeight
        && scaledTileSize * mazeTileWidth < containerWidth
      ) {
        return this.determineScale(scale + 0.0125, mazeTileHeight, mazeTileWidth);
      }
        return Math.round(Math.max(scale - window.scaleAdjustment, window.scaleAdjustment) * 4) / 4;
      } else {
        // Select the div with id "content-wrapper"
        const contentWrapper = document.getElementById("retro-cover");
      
        // Get the dimensions of the selected div
        const availableScreenHeight = contentWrapper.offsetHeight;
        const availableScreenWidth = contentWrapper.offsetWidth;
      
        const screenRatio = Math.round((availableScreenHeight / 1080) * 4) / 4;
        const scaleAdjustment = screenRatio - 0.25;
        if (
          scaledTileSize * mazeTileHeight < availableScreenHeight
          && scaledTileSize * mazeTileWidth < availableScreenWidth
        ) {
          return this.determineScale(scale + 0.0125, mazeTileHeight, mazeTileWidth);
        }
        return Math.round(Math.max(scale - scaleAdjustment, scaleAdjustment) * 4) / 4;
      }
    }

  /***
  *  Prevent player from leaving page mid-game
  */
   preventReload() {
    window.addEventListener('beforeunload', (event) => {
      // Cancel the event as stated by the standard.
      event.preventDefault();
      // Chrome requires returnValue to be set.
      event.returnValue = '';
     
      // pauses game
     if (this.allowPause) {
       this.allowPause = false;
 
       setTimeout(() => {
         if (!this.cutscene) {
           this.allowPause = true;
         }
       }, 500);
 
       this.gameEngine.changePausedState(this.gameEngine.running);
       this.soundManager.play('pause');
 
       if (this.gameEngine.started) {
         this.soundManager.resumeAmbience();
         this.gameUi.style.filter = 'unset';
         this.movementButtons.style.filter = 'unset';
         this.pausedText.style.visibility = 'hidden';
         this.pauseButton.innerHTML = 'pause';
         this.activeTimers.forEach((timer) => {
           timer.resume();
         });
       } else {
         this.soundManager.stopAmbience();
         this.soundManager.setAmbience('pause_beat', true);
         this.gameUi.style.filter = 'blur(5px)';
         this.movementButtons.style.filter = 'blur(5px)';
         this.pausedText.style.visibility = 'visible';
         this.pauseButton.innerHTML = 'play_arrow';
         this.activeTimers.forEach((timer) => {
           timer.pause();
         });
       }
     }
   });
 }

    // Send http request to server to check credits
    // handleCreditCheckClick() {
    //   console.log('credit check')
    //   const Http = new XMLHttpRequest();
      // Http.open('GET', '/get_credits');
    
      // Http.onreadystatechange = (e) => {
      //   if (Http.readyState === XMLHttpRequest.DONE) {
      //     if (Http.status === 200) {
      //       const response = JSON.parse(Http.responseText);
      //       if (response.canUseCredit) {
      //         playMainPlayVideo();
      //       } else {
      //         alert("You don't have enough credits to play.");
      //       }
      //     } else if (Http.status === 404) {
      //       alert('player not found. Please try again later.');
      //     }
      //   }
      // }
      
      getNewUsername(callback) {
        const newUsername = prompt("Please enter a username");
        
        // Check if user clicked "Cancel"
        if (newUsername === null) {
          return;
        }
        
        if (newUsername.trim() === '') {
          return this.getNewUsername(callback); // Use 'this' to call the method again
        }
        
        if (newUsername.length > 24) {
          alert("Username exceeds 24 characters. Please try a shorter one.");
          return this.getNewUsername(callback); // Use 'this' to call the method again
        }
        
        callback(newUsername);
      }

      setNewWallet(walletAddress) {
        this.sendWalletConnectRequest(walletAddress, true);

        // Form the new username by taking the first 5 and last 6 letters from walletAddress
        const modifiedWalletAddress = walletAddress.substring(0, 5) + '..' + walletAddress.substring(walletAddress.length - 6);
        this.nameDisplay.innerText = modifiedWalletAddress;
      }
      
      

  handleWalletDisconnected() {
    //localStorage.removeItem('username');
    console.log('he disconnected')
  }
      
  handleWalletConnected() {
    if (!window.connectedWallet) {
      setTimeout(() => {
        this.handleWalletConnected();
      }, 10);
    } else {
      console.log('wallet connected')
      let walletAddress = window.connectedWallet.addresses['pisco-1'];
      const modifiedWalletAddress = walletAddress.substring(0, 5) + '..' + walletAddress.substring(walletAddress.length - 6);
      this.username = modifiedWalletAddress;
      let username = window.client.gloInfo.username;
      if (!username) {
        this.setNewWallet(walletAddress);
      } else {
        this.sendWalletConnectRequest(walletAddress, false);
        this.nameDisplay.innerText = modifiedWalletAddress;
      }
    }
  }
  
  // sendWalletConnectRequest(walletAddress, checkIfExists) {
  //   const Http = new XMLHttpRequest();
  
  //   const params = JSON.stringify({ walletID: walletAddress });
  
  //   Http.open("POST", "/newplayer");
  //   Http.setRequestHeader("Content-Type", "application/json");
  
  //   Http.onreadystatechange = (e) => {
  //     if (Http.readyState === XMLHttpRequest.DONE) {
  //       if (Http.status === 200) {
  //         const response = JSON.parse(Http.response);

  //         console.log(Http.response);
  //       }
  //     }
  //   };
  //   console.log('LOCALSTORAGE:', params);
  //   Http.send(params);
  // }

  sendWalletConnectRequest(walletAddress, checkIfExists) {
    const Http = new XMLHttpRequest();
  
    const params = JSON.stringify({ walletID: walletAddress });
  
    Http.open("POST", "/newplayer");
    Http.setRequestHeader("Content-Type", "application/json");
  
    Http.onreadystatechange = (e) => {
        if (Http.readyState === XMLHttpRequest.DONE) {
            const response = JSON.parse(Http.response);
            
            if (Http.status === 200) {
                // Successful response, set the client information
                window.client.createGloSession(response);
                console.log(Http.response);
                // The token is now securely stored as an HTTP cookie
            } else {
                // Handle error scenarios based on the error message returned from the server
                console.error('Error:', response.error);
            }
        }
    };

    console.log('CookieStorage:', params);
    Http.send(params);
  }

  startGameSequence() {
    if (window.luncMachine.gameCoordinator.isMobile) {
      window.luncMobile.toggleHideElements();
    } else {
      window.videoBackground.transitionTo("main_play", () => {
        window.videoBackground.loadVideos("play_main");
      });
    }
  }  
     
  /**
   * Reveals the game underneath the loading covers and starts gameplay
   */
  startButtonClick() {
    this.setLevel(this.firstLevelData);
    this.leftCover.style.left = '-50%';
    this.rightCover.style.right = '-50%';
    this.leftCover.style.visibility = 'hidden';
    this.rightCover.style.visibility = 'hidden';
    this.mainMenu.style.opacity = 0;
    this.gameStartButton.disabled = true;

    /**
     * Prevents player from accidentally refreshing page mid-game
           vvvvvvv       */

    window.addEventListener('beforeunload', (event) => {  
      // pauses game
     if (this.allowPause) {
       this.allowPause = false;
 
       setTimeout(() => {
         if (!this.cutscene) {
           this.allowPause = true;
         }
       }, 500);
 
       this.gameEngine.changePausedState(this.gameEngine.stop);
       this.soundManager.play('pause');
 
         this.soundManager.stopAmbience();
         this.soundManager.setAmbience('pause_beat', true);
         this.gameUi.style.filter = 'blur(5px)';
         this.pausedText.style.visibility = 'visible';
         this.pauseButton.innerHTML = 'play_arrow';
         this.activeTimers.forEach((timer) => {
           timer.pause();
         });
       }
      // Cancel the event as stated by the standard.
      event.preventDefault();
      // Chrome requires returnValue to be set.
      event.returnValue = '';
     }
   );
   

    setTimeout(() => {
      this.mainMenu.style.visibility = 'hidden';
    }, 1000);

    if (this.firstGame) {
      this.reset(this.firstLevelData);
      this.firstGame = false;
      this.init();
    }
    if (this.fullReset) {
      this.fullReset = false;
    }
    this.startGameplay(true);
  }
  


  /**
   * Toggles the master volume for the soundManager, and saves the preference to storage
   */
  soundButtonClick() {
    const newVolume = this.soundManager.masterVolume === 0.05 ? 0 : 0.05;
    this.soundManager.setMasterVolume(newVolume);
    this.soundManager.setMusic(`music/music${this.level}`, false);
    localStorage.setItem('volumePreference', newVolume);
    this.setSoundButtonIcon(newVolume);
  }

  /**
   * Sets the icon for the sound button
   */
  setSoundButtonIcon(newVolume) {
    this.soundButton.innerHTML = newVolume === 0 ? 'volume_off' : 'volume_up';
  }

  /**
   * Displays an error message in the event assets are unable to download
   */
  displayErrorMessage() {
    const loadingContainer = document.getElementById('loading-container');
    const errorMessage = document.getElementById('error-message');
    loadingContainer.style.opacity = 0;
    setTimeout(() => {
      loadingContainer.remove();
      errorMessage.style.opacity = 1;
      errorMessage.style.visibility = 'visible';
    }, 1500);
  }

  /**
   * Load all assets into a hidden Div to pre-load them into memory.
   * There is probably a better way to read all of these file names.
   */
  preloadAssets() {
    return new Promise((resolve) => {
      const loadingContainer = document.getElementById('loading-container');
      const loadingLuncman = document.getElementById('loading-luncman');
      console.log('loading luncman:', loadingLuncman)
      const loadingDotMask = document.getElementById('loading-dot-mask');

      const imgBase = '/style/graphics/spriteSheets/';
      const imgSources = [
        // Luncman
        `${imgBase}characters/luncman/arrow_down.svg`,
        `${imgBase}characters/luncman/arrow_left.svg`,
        `${imgBase}characters/luncman/arrow_right.svg`,
        `${imgBase}characters/luncman/arrow_up.svg`,
        `${imgBase}characters/luncman/luncman_death.webp`,
        // `${imgBase}characters/luncman/luncman_text.webp`,
        `${imgBase}characters/luncman/luncman_down.webp`,
        `${imgBase}characters/luncman/luncman_left.webp`,
        `${imgBase}characters/luncman/luncman_right.webp`,
        `${imgBase}characters/luncman/luncman_up.webp`,
        `${imgBase}characters/luncman/luncman_down+.webp`,
        `${imgBase}characters/luncman/luncman_left+.webp`,
        `${imgBase}characters/luncman/luncman_right+.webp`,
        `${imgBase}characters/luncman/luncman_up+.webp`,


        // fudder1
        `${imgBase}characters/ghosts/fudder1/fudder1_down_angry.svg`, // down angry
        `${imgBase}characters/ghosts/fudder1/fudder1_down_annoyed.svg`, // down annoyed
        //`${imgBase}characters/ghosts/fudder1/fudder1_down.svg`, // down normal
        `${imgBase}characters/ghosts/fudder1/fudder1_left_angry.svg`, // left angry
        `${imgBase}characters/ghosts/fudder1/fudder1_left_annoyed.svg`, // left annoyed
        //`${imgBase}characters/ghosts/fudder1/fudder1_left.svg`, // left normal
        `${imgBase}characters/ghosts/fudder1/fudder1_right_angry.svg`, // right angry
        `${imgBase}characters/ghosts/fudder1/fudder1_right_annoyed.svg`, // right annoyed
        //`${imgBase}characters/ghosts/fudder1/fudder1_right.svg`, // right normal
        `${imgBase}characters/ghosts/fudder1/fudder1_up_angry.svg`, // up angry
        `${imgBase}characters/ghosts/fudder1/fudder1_up_annoyed.svg`, // up annoyed
        //`${imgBase}characters/ghosts/fudder1/fudder1_up.svg`, // up normal 
        `${imgBase}characters/ghosts/fudder_death.svg`, 
/*
        // fudder4
        `${imgBase}characters/ghosts/fudder4/fudder4_down.svg`,
        `${imgBase}characters/ghosts/fudder4/fudder4_left.svg`,
        `${imgBase}characters/ghosts/fudder4/fudder4_right.svg`,
        `${imgBase}characters/ghosts/fudder4/fudder4_up.svg`,

        // fudder3
        `${imgBase}characters/ghosts/fudder3/fudder3_down.svg`,
        `${imgBase}characters/ghosts/fudder3/fudder3_left.svg`,
        `${imgBase}characters/ghosts/fudder3/fudder3_right.svg`,
        `${imgBase}characters/ghosts/fudder3/fudder3_up.svg`,

        // fudder2
        `${imgBase}characters/ghosts/fudder2/fudder2_down.svg`,
        `${imgBase}characters/ghosts/fudder2/fudder2_left.svg`,
        `${imgBase}characters/ghosts/fudder2/fudder2_right.svg`,
        `${imgBase}characters/ghosts/fudder2/fudder2_up.svg`,
*/
        // TESTING TESTING
        //`${imgBase}characters/ghosts/fudder1/Roach.svg`,
        //`${imgBase}characters/ghosts/fudder2/Roach.svg`,
        //`${imgBase}characters/ghosts/fudder3/Roach.svg`,
        //`${imgBase}characters/ghosts/fudder4/Roach.svg`,
        
        // Fudders Common
        `${imgBase}characters/ghosts/eyes_down.svg`,
        `${imgBase}characters/ghosts/eyes_left.svg`,
        `${imgBase}characters/ghosts/eyes_right.svg`,
        `${imgBase}characters/ghosts/eyes_up.svg`,
        `${imgBase}characters/ghosts/scared_blue.svg`,
        `${imgBase}characters/ghosts/scared_white.svg`,

        // Dots
        `${imgBase}pickups/luncdot.webp`,
        `${imgBase}pickups/powerPellet.webp`,

        // Fruit
        `${imgBase}pickups/solana.svg`,
        `${imgBase}pickups/mars.svg`,
        `${imgBase}pickups/bitcoin.svg`,
        `${imgBase}pickups/secret.svg`, // NEED TO CHANGE TO SECRET
        `${imgBase}pickups/doge.svg`,
        `${imgBase}pickups/osmo.svg`,
        `${imgBase}pickups/eth.svg`,
        `${imgBase}pickups/atom.svg`,

        // Text
        `${imgBase}text/ready.webp`,
        `${imgBase}text/game_over.webp`,

        // Points
        `${imgBase}text/100.webp`,
        `${imgBase}text/200.webp`,
        `${imgBase}text/300.webp`,
        `${imgBase}text/400.webp`,
        `${imgBase}text/500.webp`,
        `${imgBase}text/700.webp`,
        `${imgBase}text/800.webp`,
        `${imgBase}text/1000.webp`,
        `${imgBase}text/1600.webp`,
        `${imgBase}text/2000.webp`,
        `${imgBase}text/3000.webp`,
        `${imgBase}text/5000.webp`,

        `${imgBase}characters/luncman/luncman_up_fire.webp`,
        `${imgBase}characters/luncman/luncman_down_fire.webp`,
        `${imgBase}characters/luncman/luncman_left_fire.webp`,
        `${imgBase}characters/luncman/luncman_right_fire.webp`,
        `${imgBase}characters/luncman/luncman+_up_fire.webp`,
        `${imgBase}characters/luncman/luncman+_down_fire.webp`,
        `${imgBase}characters/luncman/luncman+_left_fire.webp`,
        `${imgBase}characters/luncman/luncman+_right_fire.webp`,

        // Misc
        '/style/graphics/extra_life.webp',
        '/style/graphics/winning_screen.webp',
      ];

      const audioBase = '/style/audio/';
      const audioSources = [
        `${audioBase}game_start.mp3`,
        `${audioBase}pause.mp3`,
        `${audioBase}pause_beat.mp3`,
        `${audioBase}siren_1.mp3`,
        `${audioBase}siren_2.mp3`,
        `${audioBase}siren_3.mp3`,
        `${audioBase}power_up.mp3`,
        `${audioBase}extra_life.mp3`,
        `${audioBase}eyes.mp3`,
        `${audioBase}eat_fudder.mp3`,
        `${audioBase}death.mp3`,
        `${audioBase}fruit.mp3`,
        `${audioBase}dot_1.mp3`,
        `${audioBase}dot_2.mp3`,
        `${audioBase}attack.mp3`,
        `${audioBase}boost.mp3`,
        `${audioBase}super_attack.mp3`,
        `${audioBase}fud_hurt.mp3`,
        `${audioBase}game_over.mp3`,
        `${audioBase}luncman_death.mp3`,
        `${audioBase}empty_attack.mp3`,
        `${audioBase}fud_death.mp3`,
      ];
      //this.soundManager.play('eat_ghost');
      const totalSources = imgSources.length + audioSources.length;
      this.remainingSources = totalSources;

      loadingLuncman.style.left = '0';
      loadingDotMask.style.width = '0';

      Promise.all([
        this.createElements(imgSources, 'img', totalSources, this),
        this.createElements(audioSources, 'audio', totalSources, this),
      ])
        .then(() => {
          loadingContainer.style.opacity = 0;
          resolve();

          setTimeout(() => {
            loadingContainer.remove();
            this.mainMenu.style.opacity = 1;
            this.mainMenu.style.visibility = 'visible';
          }, 1500);
        })
        .catch(this.displayErrorMessage);
    });
  }

  // changeUsername() {
  //   const oldUsername = localStorage.getItem("username");
  
  //   this.getNewUsername((newUsername) => {
  //     // Send a request to the /updateplayer route to update the player's username
  //     const Http = new XMLHttpRequest();
  //     const params = JSON.stringify({ walletID: oldUsername, newUsername });
  
  //     Http.open("POST", "/updateplayer");
  //     Http.setRequestHeader("Content-Type", "application/json");
  
  //     Http.onreadystatechange = (e) => {
  //       if (Http.readyState === XMLHttpRequest.DONE) {
  //         if (Http.status === 200) {
  //           console.log("Username updated:", Http.response);
  
  //           // Update the nameDisplay and local storage with the new username
  //           this.nameDisplay.innerText = newUsername;
  //           localStorage.setItem("username", newUsername);
  
  //           // Show an alert to inform the user
  //           alert("Successfully set username: " + newUsername);
  
  //           // Update the dash-name font size
  //           this.updateDashNameFontSize(newUsername);
            
  //         } else if (Http.status === 409) {
  //           console.log("Error updating username:", Http.response);
  //           alert("Username already taken");
            
  //         } else {
  //           console.log("Error updating username:", Http.response);
  //           alert("Error updating username: " + Http.response);
  //         }
  //       }
  //     };
  
  //     Http.send(params);
  //   });
  // }

    changeUsername() {
    const oldUsername = window.client.gloInfo.username;
  
    this.getNewUsername((newUsername) => {
      // Send a request to the /updateplayer route to update the player's username
      const Http = new XMLHttpRequest();
      const params = JSON.stringify({ walletID: oldUsername, newUsername });
  
      Http.open("POST", "/updateplayer");
      Http.setRequestHeader("Content-Type", "application/json");
  
      Http.onreadystatechange = (e) => {
        if (Http.readyState === XMLHttpRequest.DONE) {
          if (Http.status === 200) {
            console.log("Username updated:", Http.response);
  
            // Update the nameDisplay and local storage with the new username
            this.nameDisplay.innerText = newUsername;
            localStorage.setItem("username", newUsername);
  
            // Show an alert to inform the user
            alert("Successfully set username: " + newUsername);

            
          } else if (Http.status === 409) {
            console.log("Error updating username:", Http.response);
            alert("Username already taken");
            
          } else {
            console.log("Error updating username:", Http.response);
            alert("Error updating username: " + Http.response);
          }
        }
      };
  
      Http.send(params);
    });
  }
  
  

  
  

  /**
   * Iterates through a list of sources and updates the loading bar as the assets load in
   * @param {String[]} sources
   * @param {('img'|'audio')} type
   * @param {Number} totalSources
   * @param {Object} gameCoord
   * @returns {Promise}
   */
  createElements(sources, type, totalSources, gameCoord) {
    const loadingContainer = document.getElementById('loading-container');
    const preloadDiv = document.getElementById('preload-div');
    const loadingLuncman = document.getElementById('loading-luncman');
    const containerWidth = loadingContainer.scrollWidth
      - loadingLuncman.scrollWidth;
    const loadingDotMask = document.getElementById('loading-dot-mask');
  
    const gameCoordRef = gameCoord;
  
    return new Promise((resolve, reject) => {
      let loadedSources = 0;
  
      sources.forEach((source) => {
        const element = type === 'img' ? new Image() : new Audio();
        preloadDiv.appendChild(element);
  
        const elementReady = () => {
          gameCoordRef.remainingSources -= 1;
          loadedSources += 1;
          const percent = 1 - gameCoordRef.remainingSources / totalSources;
          console.log(`Loaded ${type}:`, source);
          loadingLuncman.style.left = `${percent * containerWidth}px`;
          loadingDotMask.style.width = loadingLuncman.style.left;
  
          if (loadedSources === sources.length) {
            if (loadingContainer) {
              loadingContainer.style.opacity = 0;
              setTimeout(() => {
                loadingContainer.remove();
              }, 1500);
            }
            resolve();
          }
        };
  
        if (type === 'img') {
          element.onload = elementReady;
          element.onerror = reject;
        } else {
          element.addEventListener('canplaythrough', elementReady);
          element.onerror = reject;
        }
  
        element.src = source;
  
        if (type === 'audio') {
          element.load();
        }
      });
    });
  }  

  createGameElements(sources, type) {
    return new Promise((resolve, reject) => {
      let loadedSources = 0;
  
      sources.forEach((source) => {
        const element = type === 'img' ? new Image() : new Audio();
        const preloadDiv = document.getElementById('preload-div');
        preloadDiv.appendChild(element);
  
        const elementReady = () => {
          loadedSources += 1;
          console.log(`Loaded ${type}:`, source);
  
          if (loadedSources === sources.length) {
            resolve();
          }
        };
  
        if (type === 'img') {
          element.onload = elementReady;
          element.onerror = reject;
        } else {
          element.addEventListener('canplaythrough', elementReady);
          element.onerror = reject;
        }
  
        element.src = source;
  
        if (type === 'audio') {
          element.load();
        }
      });
    });
  }

  /**
   * Resets gameCoordinator values to their default states
   */
  reset(levelData) {
    this.activeTimers = [];
    this.points = 0;
    this.level = 1;
    this.lives = 2;
    this.fruitEaten = 0;
    this.extraLifeGiven = false;
    this.remainingDots = 0;
    this.allowKeyPresses = true;
    this.allowLuncmanMovement = false;
    this.allowPause = false;
    this.cutscene = true;
    this.newHighscore = false;
    this.playAgain = false;
    this.gameStarted = false;

    this.tileSize = 8;
    this.scale = this.determineScale(1, 31, 28);
    console.log('setting scaled tile size: tileSize', this.tileSize, '* scale', this.scale)
    this.scaledTileSize = this.tileSize * this.scale;
    console.log('scaled tile size:', this.scaledTileSize);

    /*const url = 'http://localhost:8014/highscore';

    function getHighscore() {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
          if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 200) {
              const response = JSON.parse(xhr.responseText);
              const highscore = response.highscore;
              resolve(highscore);
              console.log(highscore);
            } else {
              reject(new Error('Failed to retrieve highscore'));
            }
          }
        };
        xhr.open('GET', url);
        xhr.send();
      })
    }
    
    // Example usage:
    getHighscore().then(highscore => {
      this.highScore = highscore;
      this.highScoreDisplay.innerHTML = this.highScore || '00';
    }).catch(error => {
      console.error('Error:', error.message);
    })*/
    
 
    
    if (this.firstGame) {
      setInterval(() => {
        this.collisionDetectionLoop();
      }, 500);

      this.luncman = new Luncman(
        this.scaledTileSize,
        new CharacterUtil(this),
        levelData,
      );
      this.fudder1 = new Fudder(
        this.scaledTileSize,
        this.mazeArray,
        this.luncman,
        'fudder1',
        this.level,
        new CharacterUtil(this),
        this.fudder1,
        levelData,
      );
      this.fudder2 = new Fudder(
        this.scaledTileSize,
        this.mazeArray,
        this.luncman,
        'fudder2',
        this.level,
        new CharacterUtil(this),
        this.fudder1,
        levelData,
      );
      this.fudder3 = new Fudder(
        this.scaledTileSize,
        this.mazeArray,
        this.luncman,
        'fudder3',
        this.level,
        new CharacterUtil(this),
        this.fudder1,
        levelData,
      );
      this.fudder4 = new Fudder(
        this.scaledTileSize,
        this.mazeArray,
        this.luncman,
        'fudder4',
        this.level,
        new CharacterUtil(this),
        this.fudder1,
        levelData,
      );
      const fruitPosition = levelData.fruitPosition;
      this.fruit = new Pickup(
        'fruit',
        this.scaledTileSize,
        fruitPosition.x,
        fruitPosition.y,
        this.luncman,
        this.mazeDiv,
        100,
        levelData
      );
    }

    this.entityList = [
      this.luncman,
      this.fruit,
      this.fudder1,
      this.fudder2,
      this.fudder3,
      this.fudder4
    ];

    this.fudders = [this.fudder1, this.fudder2, this.fudder3, this.fudder4];

    this.scaredFudders = [];
    this.eyeFudders = 0;

    if (this.firstGame) {
      this.drawMaze(this.mazeArray, this.entityList, levelData);
      this.soundManager = new SoundManager();
      this.setUiDimensions();
    } else {
      this.luncman.levelData = this.firstLevelData;
      this.luncman.reset();
      console.log('resetting luncman')
      this.fudders.forEach((fudder) => {
        fudder.levelData = this.firstLevelData;
        fudder.reset(true);
      });
      this.pickups.forEach((pickup) => {
        pickup.levelData = this.firstLevelData;
        if (pickup.type !== 'fruit') {
          this.remainingDots += 1;
          pickup.reset();
          this.entityList.push(pickup);
        }
      });
    }

    this.pointsDisplay.innerHTML = '00';
    this.clearDisplay(this.fruitDisplay);

    const volumePreference = parseInt(
      localStorage.getItem('volumePreference') || 0.05,
      10,
    );
    this.setSoundButtonIcon(volumePreference);
    this.soundManager.setMasterVolume(volumePreference);
  }

  /**
   * Calls necessary setup functions to start the game
   */
  async init() {
    // Append the fruit to the entity list
    this.entityList.push(this.fruit);
  
    this.gameEngine = new GameEngine(this.maxFps, this.entityList, this);
    this.gameEngine.start();
  }  

  /**
   * Adds HTML elements to draw on the webpage by iterating through the 2D maze array
   * @param {Array} mazeArray - 2D array representing the game board
   * @param {Array} entityList - List of entities to be used throughout the game
   */
  drawMaze(mazeArray, entityList, levelData) {
    this.pickups = [this.fruit];

    this.mazeDiv.style.height = `${this.scaledTileSize * 31}px`;
    this.mazeDiv.style.width = `${this.scaledTileSize * 28}px`;
    this.gameUi.style.width = `${this.scaledTileSize * 28}px`;
    this.bottomRow.style.minHeight = `${this.scaledTileSize * 2}px`;
    this.dotContainer = document.getElementById('dot-container');

    // Clear old dots
    while (this.dotContainer.firstChild) {
      this.dotContainer.removeChild(this.dotContainer.firstChild);
    }

    if (!this.isMobile) {
      const coinPic = document.getElementById('fruit-display');
      const extraLife = document.getElementById('extra-lives');

      extraLife.style.zIndex = '1';
      coinPic.style.zIndex = '1';
    }

    if (this.isMobile && this.firstGame) {
      const mFudContainer = document.getElementById('mobile-fud-container');
      const lHud = document.getElementById('left-HUD');
      const pfp = document.getElementById('pfp');
      const column25 = document.getElementById('column_25');
      const nameDisplay = document.getElementById('name-display');
      const rHud = document.getElementById('right-HUD');
      const highscoreText = document.getElementById('high-score-text');
      const highscoreDisplayDiv = document.createElement('div');

      if (!this.highscoreDisplaySet) {

        highscoreText.textContent = 'H.S.';

        highscoreDisplayDiv.style.display = 'flex';
        highscoreDisplayDiv.style.fontSize = '2vw';
        highscoreDisplayDiv.appendChild(highscoreText);
        highscoreDisplayDiv.appendChild(this.highScoreDisplay);

        this.highscoreDisplaySet = true;
      }

      lHud.style.flexDirection = 'row';
      lHud.style.top = '3.5%';
      lHud.style.left = '50%';
      pfp.style.display = 'none';
      column25.style.display = 'none';
      
      mFudContainer.style.display = 'flex';

      nameDisplay.style.textAlign = 'center';
      nameDisplay.style.whiteSpace = 'nowrap';
      nameDisplay.style.position = 'absolute';
      nameDisplay.style.left = '50%';
      nameDisplay.style.transform = 'translateX(-50%)';
      
      const pointsDisplayDiv = document.createElement('div');
      pointsDisplayDiv.appendChild(this.pointsDisplay);

      const pointDisplay = document.createElement('div');
      pointDisplay.appendChild(highscoreDisplayDiv);
      pointDisplay.appendChild(nameDisplay);
      pointDisplay.appendChild(pointsDisplayDiv);
      pointDisplay.style.width = '80%';
      pointDisplay.style.left = '10%';
      pointDisplay.style.justifyContent = 'space-between';
      pointDisplay.style.display = 'flex';
      pointDisplay.style.fontSize = '1.5vh'
      pointDisplay.style.alignItems = 'center';
      
      this.rowTop.appendChild(pointDisplay);
      this.rowTop.style.height = '3vh';
      this.rowTop.style.alignItems = 'center';
      this.rowTop.style.justifyContent = 'center';
    }

    console.log('pre-dot mazedraw:', this.entityList)
    
    mazeArray.forEach((row, rowIndex) => {
      for (let columnIndex = 0; columnIndex < row.length; columnIndex++) {
        const block = row[columnIndex];
            if (block === 'o' || block === 'O') {
              const type = block === 'o' ? 'luncdot' : 'powerPellet';
              const points = block === 'o' ? 10 : 50;
              const dot = new Pickup(
                type,
                this.scaledTileSize,
                columnIndex,
                rowIndex,
                this.luncman,
                this.dotContainer,
                points,
                levelData
              );

              entityList.push(dot);
              this.pickups.push(dot);
              this.remainingDots += 1;
            }
          }
        });
        console.log('post-dot mazedraw:', this.entityList)
        console.log('logging pickups', this.pickups.length, this.pickups)
  }

  setUiDimensions() {
    this.gameUi.style.fontSize = `${this.scaledTileSize}px`;
    this.rowTop.style.marginBottom = `${this.scaledTileSize}px`;
  
    // Get the username from the nameDisplay element
    const username = this.nameDisplay.textContent || this.nameDisplay.innerText;
  
    let fontSize = this.scaledTileSize;  // Default size
  
    // Conditions for non-mobile devices
    if (!this.isMobile) {
      if (username.length > 24) {
        fontSize = this.scaledTileSize * 0.5;  // Smallest size
      } else if (username.length > 12) {
        fontSize = this.scaledTileSize * 0.7;  // Smaller size
      } else if (username.length > 10) {
        fontSize = this.scaledTileSize * 0.8;  // Slightly smaller size
      }
    } 
    // Separate conditions for mobile devices
    else {
      if (username.length > 24) {
        fontSize = this.scaledTileSize * 0.33;  // Smallest size
      } else if (username.length > 12) {
        fontSize = this.scaledTileSize * 0.5;  // Smaller size
      } else if (username.length > 10) {
        fontSize = this.scaledTileSize * 0.6;  // Slightly smaller size
      } else {
        fontSize = this.scaledTileSize * 0.7;  // Default size for mobile is half
      }
    }
  
    this.nameDisplay.style.fontSize = `${fontSize}px`;
  }
  

  setRightHud() {

    if (this.isMobile) {
      let vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
      const rHud = document.getElementById('right-HUD');
      // this.attackCooldownContainer = document.createElement('div');
      this.rHudPositioner = document.createElement('div');
      const body = document.querySelector('body');

      const levelHud = document.getElementById('level_HUD');
      if (levelHud) {
        levelHud.remove();
      }
 
      this.rHudPositioner.appendChild(rHud);
      this.rHudPositioner.appendChild(this.bottomRow);
      // this.rHudPositioner.appendChild(this.attackCooldownContainer);
      body.appendChild(this.rHudPositioner);

      // this.attackCooldownContainer.style.position = 'fixed';

      const contentContainer = document.getElementById('content-container');
      const contentHeightPx = parseFloat(getComputedStyle(contentContainer).height);
      const viewportHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--vh')) * 100;
      const contentHeightVh = (contentHeightPx / viewportHeight) * 100;
      //rHud.style.top = `${contentHeight + 8.5}vh`;
      this.bottomRowTop = contentHeightVh * 1.04;
      this.bottomRow.style.top = `calc(${this.bottomRowTop} * var(--vh))`;
      // this.attackCooldownContainer.style.top = `${contentHeight + 1}vh`;
      // this.attackCooldownContainer.style.left = '45vw';

      const levelData = this.levelData;
      const fudderNames = levelData.assets.fudders;
      const imgBase = `levels/level_${this.levelData.level}/`;

      for (let i = 1; i <= 4; i++) {
        const fudderName = fudderNames['fudder' + i];
        if (fudderName) {
          // Set the fudder image background
          const fudderImage = document.getElementById('fudder-image-' + i);
          fudderImage.style.backgroundImage = `url('${imgBase}${fudderName}.webp')`;
        } else {
          console.log(`Fudder ${i} name not found.`);
        }
      }
      return;
    }
    // Set the names and images for each fudder from the level data
    const levelData = this.levelData;
    const levelName = `Level ${levelData.level}`;
    const fudderNames = levelData.assets.fudders;
    const imgBase = `levels/level_${this.levelData.level}/`;
  
    // Set the level name in the level_HUD element
    document.getElementById('level_HUD').innerText = levelName;
  
    for (let i = 1; i <= 4; i++) {
      const fudderName = fudderNames['fudder' + i];
      const fudderNameElement = document.getElementById('fudder-' + i);
      if (fudderName) {
        fudderNameElement.innerText = fudderName;
  
        // Set the fudder image background
        const fudderImage = document.getElementById('fudder-image-' + i);
        fudderImage.style.backgroundImage = `url('${imgBase}${fudderName}.webp')`;
  
        // Check if the name is too long and adjust the font size
        const fudderInfoContainerWidth = document.querySelector('.fudder-info').offsetWidth;
        if (fudderNameElement.offsetWidth > fudderInfoContainerWidth) {
          fudderNameElement.classList.add('fudder-name-smaller');
        } else {
          fudderNameElement.classList.remove('fudder-name-smaller');
        }
      } else {
        console.log(`Fudder ${i} name not found.`);
        fudderNameElement.innerText = '';
      }
    }
  }

  /**
   * Loop which periodically checks which pickups are nearby Luncman.
   * Pickups which are far away will not be considered for collision detection.
   */
  collisionDetectionLoop() {
    if (this.luncman.position) {
      const maxDistance = this.luncman.velocityPerMs * 750;
      const luncmanCenter = {
        x: this.luncman.position.left + this.scaledTileSize,
        y: this.luncman.position.top + this.scaledTileSize,
      };

      // Set this flag to TRUE to see how two-phase collision detection works!
      const debugging = false;

      this.pickups.forEach((pickup) => {
        pickup.checkLuncmanProximity(maxDistance, luncmanCenter, debugging);
      });
    }
  }

  /**
   * Displays "Ready!" and allows Luncman to move after a breif delay
   * @param {Boolean} initialStart - Special condition for the game's beginning
   */
  startGameplay(initialStart) {
    this.soundManager.fetchingAmbience = false;
    this.soundManager.cutscene = false;
    this.soundManager.setMusic(`music/music${this.level}`, false);

    const rHud = document.getElementById('right-HUD');
    const bottomRow = document.getElementById('bottom-row');
    rHud.style.display = 'flex';
    bottomRow.style.display = 'flex';

    this.scaredFudders = [];
    this.eyeFudders = 0;
    this.allowLuncmanMovement = false;

    if (initialStart) {
      this.seventyPercent = Math.floor(this.remainingDots * 0.7);
      this.twentyFivePercent = Math.floor(this.remainingDots * 0.25);
      this.fruitAvailable = true;
    }

    const left = this.scaledTileSize * 11;
    const top = this.scaledTileSize * 17;
    const duration = initialStart ? 4500 : 2000;
    const width = this.scaledTileSize * 6;
    const height = this.scaledTileSize;

    this.displayText({ left, top }, 'ready', duration, width, height);
    this.updateExtraLivesDisplay();

    new Timer(() => {
      this.mazeCover.style.visibility = 'hidden';
      new Timer(() => {
      this.allowPause = true;
      this.cutscene = false;
      this.soundManager.setCutscene(this.cutscene);
      //this.soundManager.setAmbience(this.determineSiren(this.remainingDots));

      this.allowLuncmanMovement = true;
      this.luncman.moving = true;

      this.fudders.forEach((fudder) => {
        const fudderRef = fudder;
        fudderRef.moving = true;
      });

      this.fudderCycle('scatter');

      this.idleFudders = [this.fudder2, this.fudder3, this.fudder4];
      this.releaseFudder();

      if (initialStart || this.dead || this.advancingLevel) {
        this.createAbility();
      }

      this.gameStarted = true;
      this.gameState.gameStarted = true;
      this.gameState.sendGameState();
      this.dead = false;

      if (this.advancingLevel) {
        this.advancingLevel = false;
      }
      }, 0);
    }, duration);
  }

  createAbility() {
    // handle logic for dynamically creating multiple abilities
    const newAbility = new Ability(this.abilities.length, 'simple-attack', 5000);
    
    // Add the new ability to the abilities array.
    this.abilities.push(newAbility);
  }

  giveAbility() {
    if (this.gameStarted) {
      if (this.luncman.attackCount < 3) {
        this.luncman.giveAttack();
        this.updateGameState();
      }

        // Check if all abilities are complete.
        const allAbilitiesComplete = this.abilities.every(ability => ability.complete);
        
        if (allAbilitiesComplete) {
          console.log('All abilities are complete. Creating a new ability.');
          if (this.luncman.attackCount < 3) {
            this.createAbility();
          }
        } else {
          console.log('Not all abilities are complete. Waiting for 100ms before checking again.');
          setTimeout(() => this.giveAbility(), 100);
        }
      }
  }

  /**
   * Clears out all children nodes from a given display element
   * @param {String} display
   */
  clearDisplay(display) {
    while (display.firstChild) {
      display.removeChild(display.firstChild);
    }
  }

  /**
   * Displays extra life images equal to the number of remaining lives
   */
  updateExtraLivesDisplay() {
    this.clearDisplay(this.extraLivesDisplay);

    for (let i = 0; i < this.lives; i += 1) {
      const extraLifePic = document.createElement('img');
      extraLifePic.setAttribute('src', '/style/graphics/extra_life.webp');
      if (this.isMobile) {
        extraLifePic.style.height = `${this.scaledTileSize * 1.4}px`;
      } else {
        extraLifePic.style.height = `${this.scaledTileSize * 1.5}px`;
      }
      this.extraLivesDisplay.appendChild(extraLifePic);
    }
  }

  /**
   * Displays a rolling log of the seven most-recently eaten fruit
   * @param {String} rawImageSource
   */
  updateFruitDisplay(rawImageSource) {
    const parsedSource = rawImageSource.slice(
      rawImageSource.indexOf('(') + 1,
      rawImageSource.indexOf(')'),
    );

    if (this.fruitDisplay.children.length === 7) {
      this.fruitDisplay.removeChild(this.fruitDisplay.firstChild);
    }

    const fruitPic = document.createElement('img');
    fruitPic.setAttribute('src', parsedSource);
    if (this.isMobile) {
      fruitPic.style.height = `${this.scaledTileSize * 1.8}px`;
    } else {
      fruitPic.style.height = `${this.scaledTileSize * 1.5}px`;
    }
    this.fruitDisplay.appendChild(fruitPic);
  }

  /**
   * Cycles the fudders between 'chase' and 'scatter' mode
   * @param {('chase'|'scatter')} mode
   */
  fudderCycle(mode) {
    const delay = mode === 'scatter' ? 7000 : 20000;
    const nextMode = mode === 'scatter' ? 'chase' : 'scatter';

    this.fudderCycleTimer = new Timer(() => {
      this.fudders.forEach((fudder) => {
        fudder.changeMode(nextMode);
      });

      this.fudderCycle(nextMode);
    }, delay);
  }

  /**
   * Releases a fudder from the Fudder House after a delay
   */
  releaseFudder() {
    // Compute the list of aliveFudders
    const aliveFudders = this.fudders.filter(fudder => !this.deadFudders.includes(fudder));

    if (this.idleFudders.length > 0) {
        const delay = Math.max((4 /*- (this.level - 1) * 4*/) * 1000, 0);

        this.endIdleTimer = new Timer(() => {
            if (this.dead) {
                console.log('respawned so releasing alive fudders', aliveFudders);
                // Release only alive fudders if player is dead
                aliveFudders.forEach(fudder => {
                    fudder.endIdleMode();
                    fudder.exit = fudder.getRandomExit(this.levelData.fudderHouse.exits);
                });
            } else {
                // Check if the Fudder from idleFudders is alive before releasing
                while (this.idleFudders.length > 0 && this.deadFudders.includes(this.idleFudders[0])) {
                    this.idleFudders.shift(); // Remove the dead Fudder from idleFudders
                }
                if (this.idleFudders.length > 0) {
                    // Original logic if player is not dead
                    this.idleFudders[0].endIdleMode();
                    this.idleFudders[0].exit = this.idleFudders[0].getRandomExit(this.levelData.fudderHouse.exits);
                    this.idleFudders.shift();
                }
            }
        }, delay);
    }
  }

  /**
   * Register listeners for various game sequences
   */
  registerEventListeners() {
    console.log('registering event listeners');
    window.addEventListener('menuGameStateChange', this.menuGameStateHandler.bind(this));
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('awardPoints', this.awardPoints.bind(this));
    window.addEventListener('deathSequence', this.deathSequence.bind(this));
    window.addEventListener('dotEaten', this.dotEaten.bind(this));
    window.addEventListener('powerUp', this.powerUp.bind(this));
    window.addEventListener('eatFudder', this.eatFudder.bind(this));
    window.addEventListener('restoreFudder', this.restoreFudder.bind(this));
    window.addEventListener('addTimer', this.addTimer.bind(this));
    window.addEventListener('removeTimer', this.removeTimer.bind(this));
    window.addEventListener('releaseFudder', this.releaseFudder.bind(this));
    window.addEventListener('changeDirectionEvent', this.changeDirectionEvent.bind(this));
    window.addEventListener('attackFudder', this.attackFudder.bind(this));
    window.addEventListener('killFudder', this.killFudder.bind(this));
    window.addEventListener('abilityComplete', this.giveAbility.bind(this));
    window.addEventListener('WalletConnected', () => this.handleWalletConnected());
    window.addEventListener('WalletDisconnected', this.handleWalletDisconnected(this));
    
    if (this.isMobile) {
      this.setupSwipeListeners();

      document.addEventListener('touchstart', this.handleTouchStart.bind(this));
      window.addEventListener('orientationchange', this.orientationChange.bind(this));
    }
  }
  
  changeDirection(direction) {
    if (this.isPanning && this.direction === direction) {
      return;  // If panning and the direction is the same as the current, do nothing
    }
    
    if (this.allowKeyPresses && this.gameEngine.running) {
      // check for double-click
      const currentTime = new Date().getTime();
      let clickTimeout;
      if (this.isMobile) {
        clickTimeout = 350;
      } else {
        clickTimeout = 300;
      }
      if (this.lastDirectionKey === direction && this.doubleClickTimeout !== null && (currentTime - this.doubleClickTimeout) < clickTimeout) {
        if (this.boostTimeout === null || (currentTime - this.boostTimeout) >= 500) {
          this.luncman.getSpeedBoost();
          this.soundManager.play('boost');
          this.boostTimeout = currentTime; // update the boost timeout
        }
        this.lastDirectionKey = null;
        this.doubleClickTimeout = null;
      } else {
        this.lastDirectionKey = direction;
        this.doubleClickTimeout = currentTime;
        this.luncman.changeDirection(direction, this.allowLuncmanMovement);
      }
    }
  }

  orientationChange() {
    if (this.gameStarted && !this.paused) {
      this.handlePauseKey();
    }
  }

  setupSwipeListeners() {
    const hammer = new Hammer(document.body);

    // Enable the pinch recognizer
    hammer.get('pinch').set({ enable: true, threshold: 0 });

    // Setup Pan recognizer
    const swipe = hammer.get('swipe');
    swipe.set({ direction: Hammer.DIRECTION_ALL });

    // Listen for the pinchstart event
    hammer.on('pinchstart', (ev) => {
      this.isPanning = true;
      this.initialPoint = ev.center;
    });

    // Listen for the pinchmove event
    hammer.on('pinchmove', (ev) => {
        const deltaX = ev.center.x - this.initialPoint.x;
        const deltaY = ev.center.y - this.initialPoint.y;

        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            if (deltaX > 0) {
                this.changeDirection('right');
            } else {
                this.changeDirection('left');
            }
        } else {
            if (deltaY > 0) {
                this.changeDirection('down');
            } else {
                this.changeDirection('up');
            }
        }
        this.useAbility();
    });

    // Listen for the pan events
    hammer.on('swipeleft', () => {
        this.changeDirection('left');
    });

    hammer.on('swiperight', () => {
        this.changeDirection('right');
    });

    hammer.on('swipeup', () => {
        this.changeDirection('up');
    });

    hammer.on('swipedown', () => {
        this.changeDirection('down');
    });

    // When the pan ends, reset the isPanning flag to false
    hammer.on('panend', () => {
        this.isPanning = false;
    });
  }

  /* 

  // Swipe listeners w/ zigzag swipe as method of using ability

  setupSwipeListeners() {
    const hammer = new Hammer(document.body); 

    hammer.get('pan').set({ direction: Hammer.DIRECTION_ALL });
    let initialDirection = null; 
    let reversalDetected = false;

    hammer.on('panstart', (ev) => {
        reversalDetected = false;
        initialDirection = null;
    });

    hammer.on('panmove', (ev) => {
        if (!initialDirection) {
            if (Math.abs(ev.deltaX) > Math.abs(ev.deltaY)) {
                // Predominantly horizontal movement
                initialDirection = ev.deltaX > 0 ? 'right' : 'left';
            } else {
                // Predominantly vertical movement
                initialDirection = ev.deltaY > 0 ? 'down' : 'up';
            }
        } else {
            const currentDirection = Math.abs(ev.deltaX) > Math.abs(ev.deltaY) 
                ? (ev.deltaX > 0 ? 'right' : 'left') 
                : (ev.deltaY > 0 ? 'down' : 'up');
            
            if (initialDirection !== currentDirection) {
                reversalDetected = true;
            }
        }
    });

    hammer.on('panend', (ev) => {
        if (reversalDetected) {
            let finalDirection;
            switch(initialDirection) {
                case 'right':
                    finalDirection = 'left';
                    break;
                case 'left':
                    finalDirection = 'right';
                    break;
                case 'up':
                    finalDirection = 'down';
                    break;
                case 'down':
                    finalDirection = 'up';
                    break;
            }
            this.changeDirection(finalDirection);
            this.useAbility();
        } else {
            // This is for normal single swipes
            const singleSwipeDirection = Math.abs(ev.deltaX) > Math.abs(ev.deltaY) 
                ? (ev.deltaX > 0 ? 'right' : 'left') 
                : (ev.deltaY > 0 ? 'down' : 'up');
            this.changeDirection(singleSwipeDirection);
        }
    });
  }
  */

  /**
   * Handles logic for the changeDirection event
   * @param {Event} e
   * @param {({'up'|'down'|'left'|'right'})} direction
   */
  changeDirectionEvent(e) {
    const direction = e.detail.direction;
    const name = e.detail.name;
    const entityPosition = e.detail.entityPosition;
    //console.log(e.detail.name, 'is turning', direction, 'at', entityPosition)
  }

  menuGameStateHandler(event) {
    const gameUI = document.getElementById('game-ui');
    const dotContainer = document.getElementById('dot-container');
    const rightHUD = document.getElementById('right-HUD');
    const state = event.detail.state;

    if (state === "game") {
      gameUI.style.visibility = 'visible';
      dotContainer.style.display = '';
      rightHUD.style.visibility = 'visible'
    } else if (state === "menu") {
      gameUI.style.visibility = 'hidden';
      dotContainer.style.display = 'none';
      rightHUD.style.visibility = 'hidden'
    }
    console.log('changing game ui to', gameUI.style.visibility, gameUI);
  }
  /**
   * Gets an entity by its name
   * @param {string} name - The name of the character
   * @returns {Object|null} - The entity if found, or null if not found
   */
  getEntityByName(name) {
    // Iterate through the entityList array
    for (const entity of this.entityList) {
      // Check if the current entity's name matches the given name
      if (entity.name === name) {
        // If it matches, return the entity
        return entity;
      }
    }
  
    // If the entity is not found, return null
    return null;
  }

  // Handle mobile touch events
  handleTouchStart(e) {
    if (this.playingCutscene) {
      console.log('skipping cutscene')
      this.skipCutscene();
    }
  }
  
  /**
   * Calls various class functions depending upon the pressed key
   * @param {Event} e - The keydown event to evaluate
   */
  handleKeyDown(e) {
    if (e.keyCode === 27) {
      // ESC key
      this.handlePauseKey();
    } else if (e.keyCode === 69) {
      // E
      this.handlePauseKey();
    } else if (e.keyCode === 16) {
      // Shift key
      this.fuddersKilled = 3;
    } else if (e.keyCode === 81) {
      // Q
      this.soundButtonClick();
    } else if (e.keyCode === 32) {
      console.log('playing cutscene:', this.playingCutscene);
      // Spacebar
      if (this.playingCutscene) {
        this.skipCutscene();
      } else {
        this.useAbility();
      }
    }else if (this.movementKeys[e.keyCode]) {
      this.changeDirection(this.movementKeys[e.keyCode]);
    }
  }

  /**
   * Handle behavior for the pause key
   */
  handlePauseKey() {
    if (this.allowPause) {
      this.allowPause = false;
  
      setTimeout(() => {
        if (!this.cutscene) {
          this.allowPause = true;
        }
      }, 500);
  
      this.gameEngine.changePausedState(this.gameEngine.running);
      this.soundManager.play('pause');
  
      if (this.gameEngine.started) {
        this.soundManager.resumeAmbience();
        this.soundManager.resumeMusic();
        this.contentContainer.style.filter = 'unset';
        this.pausedText.style.visibility = 'hidden';
        this.pauseButton.innerHTML = 'pause';
        this.paused = false;
        
        // Resume all abilities
        this.abilities.forEach((ability) => {
          if (ability.paused) {
            ability.togglePause();
          }
        });

        this.activeTimers.forEach((timer) => {
          timer.resume();
        });
      } else {
        this.soundManager.stopAmbience();
        this.soundManager.stopMusic();
        this.soundManager.setAmbience('pause_beat', true);
        this.contentContainer.style.filter = 'blur(5px)';
        this.pausedText.style.visibility = 'visible';
        this.pauseButton.innerHTML = 'play_arrow';
        this.paused = true;

        // Pause all abilities
        this.abilities.forEach((ability) => {
          if (!ability.paused) {
            ability.togglePause();
          }
        });

        this.activeTimers.forEach((timer) => {
          timer.pause();
        });
      }
    }
  }

  /**
   * Handles behavior for the attack key
   */
  useAbility() {
    if (this.luncman.attack || !this.gameStarted || this.paused) {
      return;
    }
  
    if (this.luncman.attackCount > 0) {
      // Restart ability creation loop after reaching max amount
      if (this.luncman.attackCount == 3) {
        console.log('creating ability')
        this.createAbility();
      }

      this.luncman.getAttack();
      this.updateGameState();

      this.gameState.playerStats.attacksUsed += 1;

      // dispatch 'attacking' event
      window.dispatchEvent(new CustomEvent('attacking'));
      this.soundManager.play('attack');
  
      // Get the ability with the lowest index (the first ability in the abilities array).
      const usedAbility = this.abilities[0];
  
      // Make sure there is a usedAbility to remove.
      if (usedAbility) {
        // Use the ability and remove it from the DOM.
        usedAbility.useAbility();
  
        // Remove the used ability from the abilities array.
        this.abilities = this.abilities.filter(ability => ability !== usedAbility);
  
        // Update the index of each remaining ability.
        this.abilities.forEach((ability, index) => {
          ability.abilityIndex = index;
          ability.updatePosition(); // This is a new method that needs to be added to the Ability class.
        });
      }
    }
  }

  attackFudder() {
    this.gameState.playerStats.attacksHit += 1;
  }

  killFudder() {
    this.fuddersKilled += 1;
    this.gameState.playerStats.fuddersKilled += 1;
    this.soundManager.play('fud_death');

    // Add the killed Fudder to the deadFudders array
    const killedFudder = event.detail.fudder;
    this.deadFudders.push(killedFudder);

    if (this.deadFudders.length === this.fudders.length) {
        this.deadFudders = []; // reset the dead fudders list
        this.advanceLevel();
    }
  }

  /**
   * Adds points to the player's total
   * @param {({ detail: { points: Number }})} e - Contains a quantity of points to add
   */
  awardPoints(e) {

    this.points += e.detail.points;
    this.pointsDisplay.innerText = this.points;
    if (this.points > (this.highScore || 0)) {
      this.highScore = this.points;
      this.highScoreDisplay.innerText = this.points;
    }
 
    if (this.points >= 10000 && !this.extraLifeGiven) {
      this.extraLifeGiven = true;
      this.soundManager.play('extra_life');
      this.lives += 1;
      this.updateExtraLivesDisplay();
    }

    if (e.detail.type === 'fruit') {
      this.fruitAvailable = false;
      this.fruitEaten += 1;
      const fruitPosition = this.levelData.fruitPosition;
      const left = this.scaledTileSize * fruitPosition.x;
      const top = this.scaledTileSize * fruitPosition.y;
      const width = e.detail.points >= 1000
        ? this.scaledTileSize * 3
        : this.scaledTileSize * 2;
      const height = this.scaledTileSize * 2;

      let fruitType = e.detail.fruitType;
      if (fruitType && this.gameState.playerStats.fruitCollected.hasOwnProperty(fruitType)) {
        this.gameState.playerStats.fruitCollected[fruitType] += 1;
      }
  
      this.displayText({ left, top }, e.detail.points, 2000, width, height);
      this.soundManager.play('fruit');
      this.updateFruitDisplay(
        this.fruit.determineImage('fruit', e.detail.points),
      );
    }
  }

  /**
   * Animates Luncman's death, subtracts a life, and resets character positions if
   * the player has remaining lives.
   */
  deathSequence() {
    this.gameStarted = false;
    this.allowPause = false;
    this.cutscene = true;
    this.dead = true;
    this.soundManager.setCutscene(this.cutscene);
    this.soundManager.stopAmbience();
    this.removeTimer({ detail: { timer: this.fruitTimer } });
    this.removeTimer({ detail: { timer: this.fudderCycleTimer } });
    this.removeTimer({ detail: { timer: this.endIdleTimer } });
    this.removeTimer({ detail: { timer: this.fudderFlashTimer } });

    this.gameState.playerStats.deaths += 1;
  
    this.allowKeyPresses = false;
    this.luncman.moving = false;
    this.fudders.forEach((fudder) => {
      const fudderRef = fudder;
      fudderRef.moving = false;
    });
  
    // Pause all abilities.
    this.abilities.forEach((ability) => {
      ability.togglePause();
    });
  
    new Timer(() => {
      this.fudders.forEach((fudder) => {
        const fudderRef = fudder;
        fudderRef.display = false;
      });
      this.luncman.prepDeathAnimation();
      this.soundManager.play('death');
  
      if (this.lives > 0) {
        this.lives -= 1;
  
        new Timer(() => {
          this.mazeCover.style.visibility = 'visible';
          new Timer(() => {
            this.allowKeyPresses = true;
            this.mazeCover.style.visibility = 'hidden';
            console.log('resetting:', this.luncman)
            this.luncman.reset();
            ('reset', this.luncman, 'to default:', this.luncman.defaultPosition)

            this.fudders.forEach((fudder) => {
              if (!this.deadFudders.includes(fudder)) {
                  fudder.reset();
              }
            });

            this.fruit.hideFruit();
  
            // Remove all abilities.
            this.abilities.forEach((ability) => {
              ability.removeAbility();
            });
            // Reset the abilities array.
            this.abilities = [];
  
            this.startGameplay();
          }, 500);
        }, 2250);
      } else {
        this.gameOver();
        this.sendPlayerStats();
      }
    }, 750);
  }

  sendPlayerStats() {
    this.updatePlayerStats();

    const Http = new XMLHttpRequest();
    const params = JSON.stringify(this.gameState.playerStats);
  
    Http.open("POST", "/update");
    Http.setRequestHeader("Content-Type", "application/json");
  
    Http.onreadystatechange = (e) => {
      if (Http.readyState === XMLHttpRequest.DONE) {
        if (Http.status === 200) {
          const response = JSON.parse(Http.response);
          if (response.status === 'success') {
            console.log('Stats updated successfully!');
            this.newHighscore = true;
          }
        } else {
          console.error(e)
        }
      }
    };
  
    Http.send(params);
  }

  updatePlayerStats() {
    const endTime = Date.now();
    let address;
    
    if (window.connectedWallet) {
      address = window.connectedWallet.addresses['pisco-1']
      this.gameState.playerStats.address = address;
    } else {
      address = this.username;
    }

    this.gameState.playerStats = {
      username: this.username,
      address: this.gameState.playerStats.address,
      highestLevel: this.level,
      endTime: endTime,
      score: this.points,
      coinsCollected: this.gameState.playerStats.coinsCollected,
      fruitCollected: {
        bitcoin: this.gameState.playerStats.fruitCollected.bitcoin,
        ethereum: this.gameState.playerStats.fruitCollected.ethereum,
        solana: this.gameState.playerStats.fruitCollected.solana,
        atom: this.gameState.playerStats.fruitCollected.atom,
      },
      fuddersKilled: this.gameState.playerStats.fuddersKilled,
      attacksUsed: this.gameState.playerStats.attacksUsed,
      attacksHit: this.gameState.playerStats.attacksHit,
      deaths: this.gameState.playerStats.deaths
    }
  }

  /**
   * Displays GAME OVER text and displays the menu so players can play again
   */
  gameOver() {
    this.soundManager.stopMusic();

    new Timer(() => {
      this.displayText(
        {
          left: this.scaledTileSize * 9,
          top: this.scaledTileSize * 16.5,
        },
        'game_over',
        4000,
        this.scaledTileSize * 10,
        this.scaledTileSize * 2,
      );
      this.fruit.hideFruit();
      
      // Remove all abilities.
      this.abilities.forEach((ability) => {
      ability.removeAbility();
      });
      // Reset the abilities array.
      this.abilities = [];

      this.updatePlayerStats();

      new Timer(() => {
        this.leftCover.style.left = '0';
        this.rightCover.style.right = '0';
        this.leftCover.style.visibility = 'visible';
        this.rightCover.style.visibility = 'visible';
        this.leftCover.style.zIndex = 5;
        this.rightCover.style.zIndex = 5;

        const rHud = document.getElementById('right-HUD');
        const bottomRow = document.getElementById('bottom-row');
        rHud.style.display = 'none';
        bottomRow.style.display = 'none';

        // playPlayMainVideo();

        setTimeout(() => {
          const winningScreen = new WinningScreen(this.points);
          // this.resetAttackCooldownDivs();
          // this.attackCooldown = null;
        }, 1000);
      }, 2500);
    }, 2250);
  }

  /**
   * Handle events related to the number of remaining dots
   */
  dotEaten() {
    console.log('dot eaten')
    this.remainingDots -= 1;
    this.dotsEaten += 1;
    this.gameState.playerStats.coinsCollected += 1;
  
    this.soundManager.playDotSound();
  
    if (this.remainingDots === this.seventyPercent || this.remainingDots === this.twentyFivePercent) {
      if (this.fruitAvailable) {
        this.createFruit();
      }

    }
  
    if (this.remainingDots === 40 || this.remainingDots === 20) {
      this.speedUpfudder1();
    }
  
    // Reduce the remaining timer duration for attack cooldown
    if (this.attackCooldown) {
      // Find the highest indexed ability that is not complete.
      const highestIndexNotComplete = this.abilities.reduce((maxIndex, ability, index) => {
        if (!ability.complete && index > maxIndex) {
          return index;
        }
        return maxIndex;
      }, -1);
  
      // If there is such an ability, reduce its timer.
      if (highestIndexNotComplete !== -1) {
        this.abilities[highestIndexNotComplete].updateTimer(50);
      }
    }
  }

  /**
   * Creates a bonus fruit for ten seconds
   */
  createFruit() {
    this.removeTimer({ detail: { timer: this.fruitTimer } });
    this.fruit.showFruit(this.fruitPoints[this.level] || 5000);
    console.log('showing:', this.fruit, 'at x', this.fruit.x, 'y', this.fruit.y)
    this.fruitTimer = new Timer(() => {
      this.fruit.hideFruit();
    }, 10000);
  }

  /**
   * Speeds up fudder1 and raises the background noise pitch
   */
  speedUpfudder1() {
    this.fudder1.speedUp();

    if (this.scaredFudders.length === 0 && this.eyeFudders === 0) {
      this.soundManager.setAmbience(null);
    }
  }

  /**
   * Determines the correct siren ambience
   * @param {Number} remainingDots
   * @returns {String}
   */
  determineSiren(remainingDots) {
    let sirenNum;

    if (remainingDots > 40) {
      sirenNum = 1;
    } else if (remainingDots > 20) {
      sirenNum = 2;
    } else {
      sirenNum = 3;
    }

    return `siren_${sirenNum}`;
  }

  /**
   * Handles cutscene logic
   */
  async setCutscene(levelData) {
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
    this.levelData = levelData;
    console.log('setting cutscene');
    if (this.isMobile) {
      this.cutscenes = Object.values(levelData.assets.mobileCutscenes);
    } else {
      this.cutscenes = Object.values(levelData.assets.cutscenes);

      const retroCover = document.getElementById('retro-cover');
      retroCover.style.backgroundImage = 'url("/style/scss/retro_cover_ingame.webp")';
    }
    this.cutsceneTexts = Object.keys(levelData.assets.cutscenes);
    console.log('cutscenes:', this.cutscenes);

    window.dispatchEvent(new CustomEvent('menuGameStateChange', {
      detail: { state: "game" },
    }));

    let cutsceneSize;
    let cutscenePosition;
    let cutsceneTop;
    let cutsceneLeft;
    let cutsceneTransform;
    if (this.isMobile) {
      cutsceneSize = '91.8vw';
      cutscenePosition = 'fixed';
      cutsceneTop = 'calc(5.54 * var(--vh))';
      cutsceneLeft = '4.1vw';
      cutsceneTransform = 'translate(0%, 0%)';
    } else {
      cutsceneSize = '100%';
      cutscenePosition = 'absolute';
      cutsceneTop = '0';
      cutsceneLeft = '0';
      cutsceneTransform = 'translate(0%, 0%)';
    }
  
    this.cutsceneDiv = document.createElement('div');
    this.cutsceneDiv.id = 'cutScene';
    this.cutsceneDiv.style.position = cutscenePosition;
    this.cutsceneDiv.style.display = 'flex';
    this.cutsceneDiv.style.justifyContent = 'center';
    this.cutsceneDiv.style.top = cutsceneTop;
    this.cutsceneDiv.style.left = cutsceneLeft;
    this.cutsceneDiv.style.width = cutsceneSize;
    if (!this.isMobile) {
      this.cutsceneDiv.style.height = cutsceneSize;
      
    } else {
      this.cutsceneDiv.style.height = window.cutSceneHeight;
    }
    this.cutsceneDiv.style.backgroundImage = "url('style/graphics/cutscene.webp')";
    this.cutsceneDiv.style.backgroundSize = 'cover';
    this.cutsceneDiv.style.backgroundPosition = 'center';
    this.cutsceneDiv.style.transform = cutsceneTransform;
    this.cutsceneDiv.style.zIndex = '50';
    document.body.appendChild(this.cutsceneDiv);
  
    this.cutsceneContainer = document.createElement('div');
    this.cutsceneContainer.style.display = 'flex';
    this.cutsceneContainer.style.flexDirection = 'column';
    this.cutsceneContainer.style.alignItems = 'center';
    this.cutsceneDiv.appendChild(this.cutsceneContainer);
  
    this.cutsceneImg = document.createElement('img');
    if (this.isMobile) {
      this.cutsceneImg.style.width = '70vw';
      this.cutsceneImg.style.marginTop = '3vh';
    } else {
      this.cutsceneImg.style.width = '60vw';
      this.cutsceneImg.style.height = '60vh';
      this.cutsceneImg.style.marginTop = '5vh';
    }
    this.cutsceneImg.style.objectFit = 'contain';
    this.cutsceneContainer.appendChild(this.cutsceneImg);
  
    this.cutsceneText = document.createElement('div');
    this.cutsceneText.style.display = 'flex';
    this.cutsceneText.style.alignItems = 'center';
    this.cutsceneText.style.justifyContent = 'center';
    this.cutsceneText.style.color = 'black';
    this.cutsceneText.style.textAlign = 'center';
    if (this.isMobile) {
      this.cutsceneText.style.width = '70vw';
      this.cutsceneText.style.fontSize = '1.5em';
    } else {
      this.cutsceneText.style.width = '40vw';
      this.cutsceneText.style.fontSize = '2em';
    }
    this.cutsceneText.style.lineHeight = '1.5em';
    this.cutsceneText.style.height = '20vh';
    this.cutsceneText.style.overflowY = 'auto';
    this.cutsceneText.style.overflowWrap = 'break-word';
    this.cutsceneText.style.marginTop = '5vh';
    this.cutsceneText.style.marginBottom = '5vh';
    this.cutsceneText.style.backgroundColor = 'white';
    this.cutsceneText.style.borderRadius = '10px';
    this.cutsceneText.style.padding = '1em';
    this.cutsceneContainer.appendChild(this.cutsceneText);
  
    this.currentCutsceneIndex = 0;
  
    this.playCutscene(levelData);
  }

  playCutscene(levelData) {
    console.log('playing cutscenes from:', levelData);
    if (this.currentCutsceneIndex < this.cutscenes.length) {
      this.playingCutscene = true;
      console.log('playing cutscene:', this.cutscenes[this.currentCutsceneIndex]);
      
      if (this.isMobile) {
        this.cutsceneImg.src = `/levels/level_${levelData.level}/mobile_cutscenes/${this.cutscenes[this.currentCutsceneIndex]}.webp`;
      } else {
        this.cutsceneImg.src = `/levels/level_${levelData.level}/cutscenes/${this.cutscenes[this.currentCutsceneIndex]}.webp`;
      }
      console.log('cutsceneText:', levelData.assets.cutsceneText[this.cutscenes[this.currentCutsceneIndex]]);
      this.cutsceneText.innerHTML = levelData.assets.cutsceneText[this.cutsceneTexts[this.currentCutsceneIndex]];
  
      this.currentCutsceneIndex++;
    } else {
      this.playingCutscene = false;
      this.cutsceneDiv.remove();
      if (!this.advancingLevel) {
        console.log('New game so calling startButtonClick');
        this.startButtonClick();
      } else {
        console.log('making next level:', levelData)
        this.setNextLevel(levelData);
      }
    }
  }

  skipCutscene() {
    if (this.playingCutscene) {
      console.log('skipping cutscene');
      this.playCutscene(this.levelData);
    }
  }

  /**
   * Load the next level
   */
  async loadLevel(levelNumber) {
    if (this.loadedLevels[levelNumber]) {
      console.log('level', levelNumber, 'already loaded');
      return this.loadedLevels[levelNumber];
    } else {
      try {
        const response = await fetch(`/levels/level_${levelNumber}/level_${levelNumber}.json`);
        const levelData = await response.json();
        console.log('levelData:', levelData);

        const imgBase = `levels/level_${levelNumber}/`;
        const assetSources = [];
        assetSources.push(imgBase + levelData.assets.mazeBackground);
        assetSources.push(imgBase + levelData.assets.mazeBackgroundInvert);

        for (const fudderKey in levelData.assets.fudders) {
          assetSources.push(`${imgBase}${levelData.assets.fudders[fudderKey]}.webp`);
        }

        console.log('all cutscenes:', levelData.assets.cutscenes);

        for (const cutsceneKey in levelData.assets.cutscenes) {
          if (this.isMobile) {
            assetSources.push(`${imgBase}mobile_cutscenes/${levelData.assets.mobileCutscenes[cutsceneKey]}.webp`);
          } else {
            assetSources.push(`${imgBase}cutscenes/${levelData.assets.cutscenes[cutsceneKey]}.webp`);
          }
          console.log('loading cutscene:', levelData.assets.cutscenes[cutsceneKey]);
        }

        await this.createGameElements(assetSources, 'img');

        const level = {
          level: levelData.level,
          mazeArray: levelData.mazeArray,
          nextLevel: levelData.nextLevel,
          defaultPosition: levelData.defaultPosition,
          fruitPosition: levelData.fruitPosition,
          fudderHouse: levelData.fudderHouse,
          fudderDefaultPosition: levelData.fudderDefaultPosition,
          tunnels: levelData.tunnels,
          backgroundColor: levelData.backgroundColor,
          assets: levelData.assets
        };
  
        this.loadedLevels[levelNumber] = level;
  
        console.log('level', levelNumber, 'loaded');
  
        return level;
      } catch (error) {
        console.error(`Error loading level ${levelNumber}:`, error);
      }
    }
  }
  
  /**
   * Sets the level
   */
  setLevel(levelData) {
    this.dotsEaten = 0;
    console.log('setting level to', levelData.level)
    this.mazeArray = levelData.mazeArray;

    this.nextLevel = levelData.nextLevel;
    this.levelData = levelData;

    const overflowMask = document.getElementById('overflow-mask');
    if (this.isMobile) {
      console.log('setting background color to:', levelData.backgroundColor, 'from', levelData);
      overflowMask.style.backgroundColor = levelData.backgroundColor;
    } else {
      if (!this.backgroundImageElement) {
      // Create a new element for the background image
      this.backgroundImageElement = document.createElement('div');
      this.backgroundImageElement.style.width = '100%';
      this.backgroundImageElement.style.height = '100%';
      this.backgroundImageElement.style.backgroundImage = `url('/style/graphics/BGS/bg${this.levelData.level}.webp')`;
      this.backgroundImageElement.style.backgroundSize = 'cover';
      this.backgroundImageElement.style.backgroundPosition = 'center';
      this.backgroundImageElement.id = 'overflow-image';

      // Append the backgroundImageElement to overflowMask
      overflowMask.appendChild(this.backgroundImageElement);
    } else {
      this.backgroundImageElement.style.backgroundImage = `url('/style/graphics/BGS/bg${this.levelData.level}.webp')`;
    }
  }
    overflowMask.style.backgroundPosition = 'center';
    overflowMask.style.backgroundSize = 'cover'; // Add this line if you want the background image to cover the entire element
    overflowMask.style.backgroundRepeat = 'no-repeat'; // Add this line to prevent the background image from repeating

    // Set the right HUD with the level data
    this.setRightHud();

    this.level = levelData.level;

    if (this.level === 1) {
      this.firstLevelData = levelData;
    }

    // Preload the next level
    this.loadLevel(this.nextLevel);

    // check if luncman is already set
    if (this.luncman) {
      this.luncman.mazeArray = this.mazeArray;
      this.fudders.forEach((fudder) => {
        fudder.mazeArray = this.mazeArray;
        fudder.levelData = levelData;
        fudder.defaultPosition = levelData.fudderDefaultPosition;
        fudder.defaultModeSet = false;

        if (fudder.name === 'fudder1') {
          fudder.health = fudder.levelData.assets.fudder1Health;
        } else {
          fudder.health = fudder.levelData.assets.fudderHealth;
        }
      });
      // set luncman's default position
      this.luncman.defaultPosition = levelData.defaultPosition;

      this.resetPickups();

      // Call drawMaze with the new mazeArray and entityList
      console.log('mazedraw using', this.entityList)
      //if (this.advancingLevel) {
        this.drawMaze(this.mazeArray, this.entityList, levelData);
      //}
  }

    // Set the maze background image
    const imgBase = 'levels/';
    this.mazeImg.src = `${imgBase}level_${levelData.level}/${levelData.assets.mazeBackground}`;
    
    this.mazeCover.style.visibility = 'hidden';
  }

  /**
   * Iterate reset/reposition through all pickups
   */
  resetPickups() {
    if (!this.entityList.includes(this.fruit)) {
      this.entityList.push(this.fruit);
    }
    this.pickups.forEach(pickup => {
      pickup.levelData = this.levelData;
      pickup.reset();
    });
  }

  /**
   * Resets the gameboard and prepares the next level
   */
  advanceLevel() {
    this.advancingLevel = true;
    this.allowPause = false;
    this.cutscene = true;
    this.soundManager.setCutscene(this.cutscene);
    this.allowKeyPresses = false;
    this.soundManager.stopAmbience();
    this.gameStarted = false;
    this.soundManager.stopMusic();

    // remove previous pickup entities
    this.pickups.forEach((pickup) => {
      const index = this.entityList.indexOf(pickup);
      if (index > -1) {
        this.entityList.splice(index, 1);
      }
    });
  
    // Pause all abilities.
    this.abilities.forEach((ability) => {
      ability.togglePause();
    });

    this.removeTimer({ detail: { timer: this.fruitTimer } });
    this.removeTimer({ detail: { timer: this.fudderCycleTimer } });
    this.removeTimer({ detail: { timer: this.endIdleTimer } });
    this.removeTimer({ detail: { timer: this.fudderFlashTimer } });

    const imgBase = `levels/level_${this.level}/`;
    const background = `${imgBase}level_${this.level}.webp`;
    const background_invert = `${imgBase}level_${this.level}_invert.svg`;

    new Timer(() => {
      this.entityList.forEach((entity) => {
        const entityRef = entity;
        entityRef.moving = false;
      });

      this.mazeImg.src = background_invert;
      console.log('maze image: ', this.mazeImg.src);
      new Timer(() => {
        this.mazeImg.src = background;
        console.log('maze image: ', this.mazeImg.src)
        new Timer(() => {
          this.mazeImg.src = background_invert;
          console.log('maze image: ', this.mazeImg.src)
          new Timer(() => {
            this.mazeImg.src = background;
            console.log('maze image: ', this.mazeImg.src)
            new Timer(() => {
              this.mazeImg.src = background_invert;
              console.log('maze image: ', this.mazeImg.src)
              new Timer(() => {
                this.mazeImg.src = background;
                console.log('maze image: ', this.mazeImg.src)
                new Timer(() => {
                  this.mazeCover.style.visibility = 'visible';
                  new Timer(() => {
                    // Remove all abilities.
                    this.abilities.forEach((ability) => {
                      ability.removeAbility();
                    });
                    // Reset the abilities array.
                    this.abilities = [];

                    const nextLevelData = this.loadedLevels[this.nextLevel];
                    if (nextLevelData) {
                      this.levelData = nextLevelData;
                      console.log('setting level to:', nextLevelData)
                      this.setCutscene(nextLevelData);
                    } else {
                      this.loadLevel(this.nextLevel).then(levelData => {
                        this.levelData = levelData;
                        console.log('loaded level and now setting to:', levelData)
                        this.setCutscene(levelData)
                      });
                    }
                  }, 500);
                }, 250);
              }, 250);
            }, 250);
          }, 250);
        }, 250);
      }, 250);
    }, 1000);
  }

  setNextLevel(nextLevelData) {
    console.log('next level: ', this.nextLevel);

    // this.resetAttackCooldownDivs();
    this.luncman.scared = false;
    this.luncman.levelData = nextLevelData;

    this.fudders.forEach((fudder) => {
      const fudderRef = fudder;
      fudderRef.display = false;
      fudderRef.reset(true);
    });
    
    this.setLevel(nextLevelData);
    this.allowKeyPresses = true;
    console.log('resetting entity list', this.entityList)
    this.entityList.forEach((entity) => {
      const entityRef = entity;
      if (entityRef.level) {
        entityRef.level = nextLevelData.level;
      }
      entityRef.levelData = nextLevelData;
      entityRef.reset();
      if (entityRef instanceof Fudder) {
        entityRef.resetDefaultSpeed();
      }
    });
    this.startGameplay(true);
    }

  /**
   * Flashes fudders blue and white to indicate the end of the powerup
   * @param {Number} flashes - Total number of elapsed flashes
   * @param {Number} maxFlashes - Total flashes to show
   */
  flashFudders(flashes, maxFlashes) {
    if (flashes === maxFlashes) {
      this.scaredFudders.forEach((fudder) => {
        fudder.endScared();
      });
      this.scaredFudders = [];
      if (this.eyeFudders === 0) {
        this.soundManager.setAmbience(null);
      }
    } else if (this.scaredFudders.length > 0) {
      this.scaredFudders.forEach((fudder) => {
        fudder.toggleScaredColor();
      });

      this.fudderFlashTimer = new Timer(() => {
        this.flashFudders(flashes + 1, maxFlashes);
      }, 250);

      // Call resetSpriteSheet when the last fudder flashes
    if (flashes === maxFlashes - 1) {
      this.luncman.resetSpriteSheet();
      console.log('resetspritesheet');
    }
    }
  }

  /**
   * Upon eating a power pellet, sets the fudders to 'scared' mode
   */
  powerUp() {

    // this.advanceLevel();

    this.luncman.setScaredSpriteSheet();
    console.log('setscaredspritesheet');

    if (this.remainingDots !== 0) {
      this.soundManager.setAmbience('power_up');
    }

    this.removeTimer({ detail: { timer: this.fudderFlashTimer } });

    this.fudderCombo = 0;
    this.scaredFudders = [];

    this.fudders.forEach((fudder) => {
      if (fudder.mode !== 'eyes') {
        this.scaredFudders.push(fudder);
      }
    });

    this.scaredFudders.forEach((fudder) => {
      fudder.becomeScared();
    });

    const powerDuration = Math.max((7 - this.level) * 1000, 0);
    this.fudderFlashTimer = new Timer(() => {
      this.flashFudders(0, 9);
    }, powerDuration); 
  }

  /**
   * Determines the quantity of points to give based on the current combo
   */
  determineComboPoints() {
    return 100 * (2 ** this.fudderCombo);
  }

  /**
   * Upon eating a fudder, award points and temporarily pause movement
   * @param {CustomEvent} e - Contains a target fudder object
   */
  eatFudder(e) {
    const pauseDuration = 1000;
    const { position, measurement } = e.detail.fudder;

    this.pauseTimer({ detail: { timer: this.fudderFlashTimer } });
    this.pauseTimer({ detail: { timer: this.fudderCycleTimer } });
    this.pauseTimer({ detail: { timer: this.fruitTimer } });
    this.soundManager.play('eat_fudder');

    this.scaredFudders = this.scaredFudders.filter(
      fudder => fudder.name !== e.detail.fudder.name,
    );
    this.eyeFudders += 1;

    this.fudderCombo += 1;
    const comboPoints = this.determineComboPoints();
    window.dispatchEvent(
      new CustomEvent('awardPoints', {
        detail: {
          points: comboPoints,
        },
      }),
    );
    this.displayText(position, comboPoints, pauseDuration, measurement);

    this.allowLuncmanMovement = false;
    this.luncman.display = false;
    this.luncman.moving = false;
    e.detail.fudder.moving = false;

    this.fudders.forEach((fudder) => {
      const fudderRef = fudder;
      fudderRef.animate = false;
      fudderRef.pause(true);
      fudderRef.allowCollision = false;
    });

    new Timer(() => {
      this.soundManager.setAmbience('eyes');

      this.resumeTimer({ detail: { timer: this.fudderFlashTimer } });
      this.resumeTimer({ detail: { timer: this.fudderCycleTimer } });
      this.resumeTimer({ detail: { timer: this.fruitTimer } });
      this.allowLuncmanMovement = true;
      this.luncman.display = true;
      this.luncman.moving = true;
      e.detail.fudder.display = true;
      e.detail.fudder.moving = true;
      this.fudders.forEach((fudder) => {
        const fudderRef = fudder;
        fudderRef.animate = true;
        fudderRef.pause(false);
        fudderRef.allowCollision = true;
      });
    }, pauseDuration);
  }

  /**
   * Decrements the count of "eye" fudders and updates the ambience
   */
  restoreFudder() {
    this.eyeFudders -= 1;

    if (this.eyeFudders === 0) {
      const sound = this.scaredFudders.length > 0
        ? 'power_up'
        : null;
      this.soundManager.setAmbience(sound);
    }
  }

  /**
   * Creates a temporary div to display points on screen
   * @param {({ left: number, top: number })} position - CSS coordinates to display the points at
   * @param {Number} amount - Amount of points to display
   * @param {Number} duration - Milliseconds to display the points before disappearing
   * @param {Number} width - Image width in pixels
   * @param {Number} height - Image height in pixels
   */
  displayText(position, amount, duration, width, height) {
    const pointsDiv = document.createElement('div');

    pointsDiv.style.position = 'absolute';
    pointsDiv.style.backgroundSize = `${width}px`;
    pointsDiv.style.backgroundImage = 'url(/style/graphics/'
        + `spriteSheets/text/${amount}.webp`;
    pointsDiv.style.width = `${width}px`;
    pointsDiv.style.height = `${height || width}px`;
    pointsDiv.style.top = `${position.top}px`;
    pointsDiv.style.left = `${position.left}px`;
    pointsDiv.style.zIndex = 2;

    this.mazeDiv.appendChild(pointsDiv);

    new Timer(() => {
      this.mazeDiv.removeChild(pointsDiv);
    }, duration);
  }

  updateGameState() {
    if (!this.luncman) {
      return;
    };
      const luncmanData = {
          position: this.luncman.position,
          attackCount: this.luncman.attackCount
      };

      const fudderData = [
        {
            name: 'fudder1',
            position: this.fudder1.position,
            health: this.fudder1.health
        },
        {
            name: 'fudder2',
            position: this.fudder2.position,
            health: this.fudder2.health
        },
        {
            name: 'fudder3',
            position: this.fudder3.position,
            health: this.fudder3.health
        },
        {
            name: 'fudder4',
            position: this.fudder4.position,
            health: this.fudder4.health
        }
      ];

      const charactersData = {
        luncman: luncmanData,
        fudders: fudderData
      };

      const scoreData = {
        points: this.points,
        luncEaten: this.dotsEaten,
        fruitEaten: this.fruitEaten,
        lives: this.lives,
        level: this.level
      };

      this.gameState.updateCharactersInfo(charactersData);
      this.gameState.updateScore(scoreData);
      console.log("All game state data updated");
      console.log("Game state data sent to server");

    this.gameState.sendGameState();
  }

  /**
   * Pushes a Timer to the activeTimers array
   * @param {({ detail: { timer: Object }})} e
   */
  addTimer(e) {
    this.activeTimers.push(e.detail.timer);
  }

  /**
   * Checks if a Timer with a matching ID exists
   * @param {({ detail: { timer: Object }})} e
   * @returns {Boolean}
   */
  timerExists(e) {
    return !!(e.detail.timer || {}).timerId;
  }

  /**
   * Pauses a timer
   * @param {({ detail: { timer: Object }})} e
   */
  pauseTimer(e) {
    if (this.timerExists(e)) {
      e.detail.timer.pause(true);
    }
  }

  /**
   * Resumes a timer
   * @param {({ detail: { timer: Object }})} e
   */
  resumeTimer(e) {
    if (this.timerExists(e)) {
      e.detail.timer.resume(true);
    }
  }

  /**
   * Removes a Timer from activeTimers
   * @param {({ detail: { timer: Object }})} e
   */
  removeTimer(e) {
    if (this.timerExists(e)) {
      window.clearTimeout(e.detail.timer.timerId);
      this.activeTimers = this.activeTimers.filter(
        timer => timer.timerId !== e.detail.timer.timerId,
      );
    }
  }
}

class WinningScreen {
  constructor(finalscore) {
    this.playWinningScreen();
    this.simulateWin(finalscore);
  }

  simulateWin(finalscore) {
    fetch('/simulateWin', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ score: finalscore }),  // This should be score instead of finalscore
    })
    .then(response => {
        if (!response.ok) {
            console.error('Network response was not ok ' + response.statusText);
            return;
        }
        return response.json();
    })
    .then(data => {
        console.log('Success:', data);
        const resultDiv = document.getElementById('resultDiv');
        resultDiv.innerHTML = `You Won: ${data.result === 'win' ? 'Yes' : 'No'}<br>Percentile: ${data.percentile.toFixed(2)}%`;  // Updated this line to include the percentile
    })
    .catch(error => {
        console.error('Error:', error);
    });
  }


  playWinningScreen() {
    // Create a div for the background
    const backgroundDiv = document.createElement('div');
    backgroundDiv.style.backgroundColor = 'black';
    backgroundDiv.style.zIndex = '50';
    document.body.appendChild(backgroundDiv);
    // var audio = new Audio('style/audio/music/music2-.mp3');   
    // audio.volume = 0.02;
    // audio.play();

    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);

    if (this.isMobile) {
      backgroundDiv.style.position = 'fixed';
      backgroundDiv.style.top = 'calc(5.54 * var(--vh))';
      backgroundDiv.style.left = '4.1vw';
      backgroundDiv.style.width = '91.8vw';
      backgroundDiv.style.height = window.winScreenHeight;
    } else {
      backgroundDiv.style.position = 'fixed';
      backgroundDiv.style.top = '0';
      backgroundDiv.style.left = '0';
      backgroundDiv.style.width = '100%';
      backgroundDiv.style.height = '100%';
    }

  
  // Create an image element for the webp
  const webpImage = document.createElement('img');
  webpImage.id = 'webpImage';
  if (this.isMobile) {
    webpImage.src = 'style/graphics/winning_screen_mobile.webp';
  }
  else {
    webpImage.src = 'style/graphics/winning_screen.webp';
  }
  webpImage.style.position = 'absolute';
  webpImage.style.width = '100%';
  webpImage.style.height = '100%'; // Set the height to 100%
  webpImage.style.top = '50%'; // Set the top to 50%
  webpImage.style.left = '50%'; // Set the left to 50%
  webpImage.style.transform = 'translate(-50%, -50%)';
  backgroundDiv.appendChild(webpImage);

  // Create a div for displaying the result
  const resultDiv = document.createElement('div');
  resultDiv.id = 'resultDiv';  // Set an id so we can find it later
  resultDiv.style.position = 'absolute';
  resultDiv.style.color = 'white';
  resultDiv.style.fontSize = '200%';
  resultDiv.style.top = '55%';  // Adjust these values as needed
  resultDiv.style.left = '50%';
  resultDiv.style.transform = 'translate(-50%, -50%)';
  resultDiv.innerHTML = 'Waiting for result...';  // Initial text
  backgroundDiv.appendChild(resultDiv);
  
  // Create a div for the "Legends never die" message
  const legendsDiv = document.createElement('div');
  legendsDiv.innerHTML = 'LEGENDS NEVER DIE...';
  legendsDiv.style.position = 'absolute';
  legendsDiv.style.color = 'white';
  legendsDiv.style.whiteSpace = 'nowrap';
  legendsDiv.style.textAlign = 'center';
  // Position and size this div according to whether we're on mobile or desktop
  if (this.isMobile) {
    legendsDiv.style.fontSize = '150%';
    legendsDiv.style.top = '22.5%';
    legendsDiv.style.left = '55%';
  } else {
    legendsDiv.style.fontSize = '200%';
    legendsDiv.style.top = '45%';
    legendsDiv.style.left = '75%';
  }
  legendsDiv.style.transform = 'translate(-50%, -50%)';
  backgroundDiv.appendChild(legendsDiv);

  // Create a similar div for the "Nice Try" message
  const tryDiv = document.createElement('div');
  tryDiv.innerHTML = 'Nice Try!';
  // ... set the style properties for this div as needed ...
  tryDiv.style.position = 'absolute';
  tryDiv.style.color = 'white';
  tryDiv.style.whiteSpace = 'nowrap';
  tryDiv.style.textAlign = 'center';
  // Position and size this div according to whether we're on mobile or desktop
  if (this.isMobile) {
    tryDiv.style.fontSize = '150%';
    tryDiv.style.top = '12.5%';
    tryDiv.style.left = '52.5%';
  } else {
    tryDiv.style.fontSize = '200%';
    tryDiv.style.top = '40%';
    tryDiv.style.left = '75%';
  }
  tryDiv.style.transform = 'translate(-50%, -50%)';
  backgroundDiv.appendChild(tryDiv);


  // Create a similar div for the "LUNC burned" message
  const luncDiv = document.createElement('div');
  luncDiv.innerHTML = 'LUNC "burned": ' + this.points;
  // ... set the style properties for this div as needed ...
  luncDiv.style.position = 'absolute';
  luncDiv.style.color = 'white';
  luncDiv.style.whiteSpace = 'nowrap';
  luncDiv.style.textAlign = 'center';
  // Position and size this div according to whether we're on mobile or desktop
  if (this.isMobile) {
    luncDiv.style.fontSize = '150%';
    luncDiv.style.top = '16%';
    luncDiv.style.left = '50%';
  } else {
    luncDiv.style.fontSize = '200%';
    luncDiv.style.top = '35%';
    luncDiv.style.left = '75%';
  }
  luncDiv.style.transform = 'translate(-50%, -50%)';
  backgroundDiv.appendChild(luncDiv);


    // Create a div for the username
    const usernameDiv = document.createElement('div');
    usernameDiv.style.position = 'absolute';
    usernameDiv.style.top = '5%';
    usernameDiv.style.left = '25%';
    usernameDiv.style.fontSize = '250%';
    usernameDiv.style.transform = 'translate(-50%, -50%)';
    usernameDiv.style.color = 'white';
    usernameDiv.style.whiteSpace = 'nowrap';
    usernameDiv.innerHTML = window.client.gloInfo.username;
    if (this.isMobile) {
      usernameDiv.style.top = '7.5%';
      usernameDiv.style.left = '50%';
    }
    backgroundDiv.appendChild(usernameDiv);

    // create a div for the share button
    const shareDiv = document.createElement('div');
    shareDiv.style.position = 'absolute';
    if (this.isMobile) {
      shareDiv.style.top = '28%';
      shareDiv.style.left = '77%';
    } else {
      shareDiv.style.top = '70%';
      shareDiv.style.left = '70%';
    }
    shareDiv.style.fontSize = '150%';
    shareDiv.style.transform = 'translate(-50%, -50%)';
    shareDiv.style.color = 'white';
    shareDiv.style.outline = '0.15em solid white';
    shareDiv.innerHTML = 'Share';
    backgroundDiv.appendChild(shareDiv);

    // Add an event listener to the share button
    shareDiv.addEventListener('click', function() {
        html2canvas(document.body).then(function(canvas) {
            canvas.toBlob(function(blob) {
                var file = new File([blob], 'luncFlex.png', {type: 'image/png', lastModified: Date.now()});
                var url = URL.createObjectURL(file);

                if (navigator.share) {
                    navigator.share({
                        title: 'LuncFlex',
                        text: 'Check this out!',
                        files: [file]
                    })
                    .then(() => console.log('Successful share'))
                    .catch((error) => console.log('Error sharing', error));
                } else {
                    console.log('Web Share not supported on this browser');
                }

                // Don't forget to revoke the object URL to avoid memory leaks
                URL.revokeObjectURL(url);
            });
        });
    });


    // create a div for the play again button
    const againDiv = document.createElement('div');
    againDiv.style.position = 'absolute';
    if (this.isMobile) {
      againDiv.style.top = '28%';
      againDiv.style.left = '52%';

    } else {
      againDiv.style.top = '75%';
      againDiv.style.left = '70%';
    }
    againDiv.style.fontSize = '150%';
    againDiv.style.transform = 'translate(-50%, -50%)';
    againDiv.style.color = 'white';
    againDiv.style.outline = '0.15em solid white';
    againDiv.innerHTML = 'Play Again';
    backgroundDiv.appendChild(againDiv);

    // create a div for main menu button
    const menuDiv = document.createElement('div');
    menuDiv.style.position = 'absolute';
    menuDiv.style.pointerEvents = 'auto';
    if (this.isMobile) {
      menuDiv.style.top = '28%';
      menuDiv.style.left = '20%';
    } else {
      menuDiv.style.top = '80%';
      menuDiv.style.left = '70%';
    }
    menuDiv.style.fontSize = '150%';
    menuDiv.style.transform = 'translate(-50%, -50%)';
    menuDiv.style.color = 'white';
    menuDiv.style.outline = '0.15em solid white';
    menuDiv.innerHTML = 'Main Menu';
    backgroundDiv.appendChild(menuDiv);

    // Set a click event listener to play again after game over
    againDiv.addEventListener('click', () => {
      this.playAgain = true;
      // audio.pause();
      document.body.removeChild(backgroundDiv);
      console.log('first level data:', this.firstLevelData);
      setTimeout(() => {
        this.gameStartButton.disabled = false;
        this.firstGame = true;
        this.reset(this.firstLevelData);
        this.setCutscene(this.firstLevelData);
      }, 1000);
    });
    
    if (!this.isMobile) {
    // Reset display for video backgrounds
    videoBackground.videos.forEach((video) => {
      video.style.display = '';
    });
    }

    // Set a click event listener to go to main menu
    menuDiv.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('menuGameStateChange', {
        detail: { state: "menu" },
      }));

      console.log('menu button clicked');
      document.body.removeChild(backgroundDiv);
      // audio.pause();
      const luncVid = document.getElementById('canvas');
      const playButton = document.getElementById('credit-check');
      const nav = document.getElementById('nav');
      const dash = document.getElementById('dashboard');
      if (!this.isMobile) {
      videoBackground = window.videoBackground;
      videoBackground.setElements(videoBackground.videos[videoBackground.videoElementIndex]);
      videoBackground.transitionTo('play_main', () => {
        videoBackground.toggleHideVideo();
      setTimeout(() => {
        this.mainMenu.style.opacity = 1;
        this.gameStartButton.disabled = false;
        this.mainMenu.style.visibility = 'visible';
        this.mainMenu.style.display = '';
        luncVid.style.visibility = 'visible';
        playButton.style.display = 'flex';
        nav.style.display = 'flex';
        dash.style.display = 'flex';
      }, 1000);
      });
    } else {
      this.mainMenu.style.opacity = 1;
      this.gameStartButton.disabled = false;
      this.mainMenu.style.visibility = 'visible';
      this.mainMenu.style.display = '';
      luncVid.style.visibility = 'visible';
      playButton.style.display = 'flex';
      nav.style.display = 'flex';
      dash.style.display = 'flex';
    }
    });
  }

}

class GameState {
  constructor() {
      if (GameState.instance) {
          return GameState.instance;
      }

      this.luncmanInfo = null;
      this.fudderInfo = null;
      this.scoreInfo = null;

      this.gameStarted = false;

      this.playerStats = {
        address: null,
        username: null,
        highestLevel: 0,
        endTime: 0,
        score: 0,
        coinsCollected: 0,
        fruitCollected: {
          bitcoin: 0,
          ethereum: 0,
          solana: 0,
          atom: 0
        },
        fuddersKilled: 0,
        attacksUsed: 0,
        attacksHit: 0,
        deaths: 0
      }

      this.userId = window.client.gloInfo.username;
      
      GameState.instance = this;

      // this.gameStateTimer = setInterval(() => {
      //   window.luncMachine.gameCoordinator.updateGameState();
      // }, 10000);
  }

  updateCharactersInfo(info) {
      this.luncmanInfo = {
          position: info.luncman.position,
          attackCount: info.luncman.attackCount
      };
      this.fudderInfo = info.fudders.map(fudder => ({
          name: fudder.name,
          position: fudder.position,
          health: fudder.health
      }));
      console.log("Enemy info updated: ", this.fudderInfo);
  }

  updateScore(info) {
    this.scoreInfo = {
        points: info.points,
        luncEaten: info.luncEaten,
        fruitEaten: info.fruitEaten,
        lives: info.lives,
        level: info.level
    };
      console.log("Score updated: ", this.totalScore);
  }

  sendGameState() {
    if (this.gameStarted) {
      this.startTime = Date.now();
      this.gameStarted = false;
    }

    const gameStateInfo = {
      userId: this.userId,
      luncmanInfo: this.luncmanInfo,
      fudderInfo: this.fudderInfo,
      scoreInfo: this.scoreInfo,
      startTime: this.startTime
    };
  
    window.client.socket.emit('update_game_state', gameStateInfo);
    console.log("Game state updated:", gameStateInfo);
  }

  resetGameState() {
      this.luncmanInfo = null;
      this.fudderInfo = null;
      this.scoreInfo = null;
      console.log("Game state reset: Everything's back to square fucking one");
  }
}


class GameEngine {
  constructor(maxFps, entityList, gameCoord) {
    this.fpsDisplay = document.getElementById('fps-display');
    this.elapsedMs = 0;
    this.lastFrameTimeMs = 0;
    this.entityList = entityList;
    this.maxFps = maxFps;
    this.timestep = 1000 / this.maxFps;
    this.fps = this.maxFps;
    this.framesThisSecond = 0;
    this.lastFpsUpdate = 0;
    this.frameId = 0;
    this.running = false;
    this.started = false;
    this.gameCoord = gameCoord;
  }

  /**
   * Toggles the paused/running status of the game
   * @param {Boolean} running - Whether the game is currently in motion
   */
  changePausedState(running) {
    if (running) {
      this.stop();
    } else {
      this.start();
    }
  }

  /**
   * Updates the on-screen FPS counter once per second
   * @param {number} timestamp - The amount of MS which has passed since starting the game engine
   */
  updateFpsDisplay(timestamp) {
    if (timestamp > this.lastFpsUpdate + 1000) {
      this.fps = (this.framesThisSecond + this.fps) / 2;
      this.lastFpsUpdate = timestamp;
      this.framesThisSecond = 0;
    }
    this.framesThisSecond += 1;
    this.fpsDisplay.textContent = `${Math.round(this.fps)} FPS`;
  }

  /**
   * Calls the draw function for every member of the entityList
   * @param {number} interp - The animation accuracy as a percentage
   * @param {Array} entityList - List of entities to be used throughout the game
   */
  draw(interp, entityList) {
    entityList.forEach((entity) => {
      if (typeof entity.draw === 'function') {
        entity.draw(interp);
      }
    });
  }

  /**
   * Calls the update function for every member of the entityList
   * @param {number} elapsedMs - The amount of MS that have passed since the last update
   * @param {Array} entityList - List of entities to be used throughout the game
   */
  update(elapsedMs, entityList) {
    entityList.forEach((entity) => {
      if (typeof entity.update === 'function') {
        entity.update(elapsedMs);
      }
    });
  }

  /**
   * In the event that a ton of unsimulated frames pile up, discard all of these frames
   * to prevent crashing the game
   */
  panic() {
    this.elapsedMs = 0;
  }

  /**
   * Draws an initial frame, resets a few tracking variables related to animation, and calls
   * the mainLoop function to start the engine
   */
  start() {
    if (!this.started) {
      this.started = true;

      this.frameId = requestAnimationFrame((firstTimestamp) => {
        this.draw(1, []);
        this.running = true;
        this.lastFrameTimeMs = firstTimestamp;
        this.lastFpsUpdate = firstTimestamp;
        this.framesThisSecond = 0;

        this.frameId = requestAnimationFrame((timestamp) => {
          this.mainLoop(timestamp);
        });
      });
    }
  }

  /**
   * Stops the engine and cancels the current animation frame
   */
  stop() {
    this.running = false;
    this.started = false;
    cancelAnimationFrame(this.frameId);
  }

  /**
   * The loop which will process all necessary frames to update the game's entities
   * prior to animating them
   */
  processFrames(timestamp) {
    let numUpdateSteps = 0;
    while (this.elapsedMs >= this.timestep) {
      this.update(this.timestep, this.entityList);
      this.elapsedMs -= this.timestep;
      numUpdateSteps += 1;
      if (numUpdateSteps >= this.maxFps) {
        this.panic();
        break;
      }
    }
  }

  /**
   * A single cycle of the engine which checks to see if enough time has passed, and, if so,
   * will kick off the loops to update and draw the game's entities.
   * @param {number} timestamp - The amount of MS which has passed since starting the game engine
   */
  engineCycle(timestamp) {
    if (timestamp < this.lastFrameTimeMs + (1000 / this.maxFps)) {
      this.frameId = requestAnimationFrame((nextTimestamp) => {
        this.mainLoop(nextTimestamp);
      });
      return;
    }

    this.elapsedMs += timestamp - this.lastFrameTimeMs;
    this.lastFrameTimeMs = timestamp;
    this.updateFpsDisplay(timestamp);
    this.processFrames();
    this.draw(this.elapsedMs / this.timestep, this.entityList);

    this.frameId = requestAnimationFrame((nextTimestamp) => {
      this.mainLoop(nextTimestamp);
    });
  }

  /**
   * The endless loop which will kick off engine cycles so long as the game is running
   * @param {number} timestamp - The amount of MS which has passed since starting the game engine
   */
  mainLoop(timestamp) {
    this.engineCycle(timestamp);
  }
}


class Pickup {
  constructor(type, scaledTileSize, column, row, luncman, mazeDiv, points, levelData) {
    this.type = type;
    this.luncman = luncman;
    this.mazeDiv = mazeDiv;
    this.points = points;
    this.nearLuncman = false;
    this.levelData = levelData;
    this.scaledTileSize = scaledTileSize;
    this.points = points;
    this.mazeArray = levelData.mazeArray;
    this.hasAwardedPoints = false

    this.fruitImages = {
      100: 'bitcoin',
      300: 'atom',
      500: 'eth',
      700: 'solana',
      1000: 'osmo',
      2000: 'secret',
      3000: 'mars',
      5000: 'doge',
    };

    this.setStyleMeasurements(type, scaledTileSize, column, row, points);
  }

  /**
   * Resets the pickup's visibility
   */
  reset() {
    this.hasAwardedPoints = false;
    this.mazeArray = this.levelData.mazeArray;
    if (this.type === 'fruit') {
      this.x = (this.levelData.fruitPosition.x * this.scaledTileSize) - (this.scaledTileSize * 0.5);
      this.y = (this.levelData.fruitPosition.y * this.scaledTileSize) - (this.scaledTileSize * 0.5);
      
      this.animationTarget.style.backgroundImage = this.determineImage(this.type, this.points);
      this.animationTarget.style.height = `${this.size}px`;
      this.animationTarget.style.width = `${this.size}px`;
      this.animationTarget.style.top = `${this.y}px`;
      this.animationTarget.style.left = `${this.x}px`;

      this.center = {
        x: (this.levelData.fruitPosition.x * this.scaledTileSize),
        y: (this.levelData.fruitPosition.y * this.scaledTileSize),
      }
    }
    this.animationTarget.style.visibility = (this.type === 'fruit') ? 'hidden' : 'visible';
    if (this.type !== 'fruit') {
      //console.log('set pickup vis to', this.animationTarget.style.visibility)
    }
  }

  /**
   * Sets various style measurements for the pickup depending on its type
   * @param {('luncdot'|'powerPellet'|'fruit')} type - The classification of pickup
   * @param {number} scaledTileSize
   * @param {number} column
   * @param {number} row
   * @param {number} points
   */
  setStyleMeasurements(type, scaledTileSize, column, row, points) {
    if (type === 'luncdot') {
      this.size = scaledTileSize * 0.4;
      this.x = (column * scaledTileSize) + ((scaledTileSize / 8) * 3);
      this.y = (row * scaledTileSize) + ((scaledTileSize / 8) * 3);
    } else if (type === 'powerPellet') {
      this.size = scaledTileSize*1.25;
      this.x = (column * scaledTileSize);
      this.y = (row * scaledTileSize);
    } else {
      this.size = scaledTileSize * 2;
      this.x = (column * scaledTileSize) - (scaledTileSize * 0.5);
      this.y = (row * scaledTileSize) - (scaledTileSize * 0.5);
    }

    this.center = {
      x: column * scaledTileSize,
      y: row * scaledTileSize,
    };

    this.animationTarget = document.createElement('div');
    this.animationTarget.style.position = 'absolute';
    this.animationTarget.style.backgroundSize = `${this.size}px`;
    this.animationTarget.style.backgroundImage = this.determineImage(
      type, points,
    );
    this.determineAnimation();
    this.animationTarget.style.height = `${this.size}px`;
    this.animationTarget.style.width = `${this.size}px`;
    this.animationTarget.style.top = `${this.y}px`;
    this.animationTarget.style.left = `${this.x}px`;
    this.mazeDiv.appendChild(this.animationTarget);

    if (type === 'powerPellet') {
      this.animationTarget.classList.add('power-pellet');
    }

    this.reset();
  }

  determineAnimation() {
    if (this.type === 'powerPellet') {
      // Set up sprite animation
      const animationFrames = 4;
      const animationDuration = 100; // milliseconds per frame
      const spriteWidth = this.size;
      this.animationTarget.style.backgroundSize = `${spriteWidth * animationFrames}px ${spriteWidth}px`;
  
      // Add these properties to create a stepped animation
      this.animationTarget.style.animationTimingFunction = `steps(1)`;
      this.animationTarget.style.animationDuration = `${animationDuration * animationFrames}ms`;
      this.animationTarget.style.animationIterationCount = 'infinite';
      this.animationTarget.style.animationName = 'power-pellet-animation';
  
      // Define the animation keyframes using a CSS rule
      const keyframes = `
        @keyframes power-pellet-animation {
          0% { background-position: 0px 0px; }
          25% { background-position: -${spriteWidth}px 0px; }
          50% { background-position: -${spriteWidth*2}px 0px; }
          75% { background-position: -${spriteWidth*3}px 0px; }
          100% { background-position: 0px 0px; }
        }
      `;
      const style = document.createElement('style');
      style.innerHTML = keyframes;
      document.head.appendChild(style);
    }
  }

  /**
   * Determines the Pickup image based on type and point value
   * @param {('luncdot'|'powerPellet'|'fruit')} type - The classification of pickup
   * @param {Number} points
   * @returns {String}
   */
  determineImage(type, points) {
    let image = '';

    // Add names of images that should use .webp format
    const webpImages = ['luncdot'];

    if (type === 'fruit') {
        image = this.fruitImages[points] || 'bitcoin';
    } else {
        image = type;
    }

    // Determine format based on image name
    const format = webpImages.includes(image) ? 'webp' : 'svg';

    return `url(/style/graphics/spriteSheets/pickups/${image}.${format})`;
  }

  /**
   * Shows a bonus fruit, resetting its point value and image
   * @param {number} points
   */
  showFruit(points) {
    if (this.type === 'fruit') {
      this.points = points;
      this.animationTarget.style.backgroundImage = this.determineImage(
        this.type, points,
      );
      this.animationTarget.style.visibility = 'visible';
    }
  }

  /**
   * Makes the fruit invisible (happens if Luncman was too slow)
   */
  hideFruit() {
    if (this.type === 'fruit') {
      this.animationTarget.style.visibility = 'hidden';
    }
  }

  /**
   * Returns true if the Pickup is touching a bounding box at Luncman's center
   * @param {({ x: number, y: number, size: number})} pickup
   * @param {({ x: number, y: number, size: number})} originalLuncman
   */
  checkForCollision(pickup, originalLuncman) {
    const luncman = Object.assign({}, originalLuncman);

    luncman.x += (luncman.size * 0.25);
    luncman.y += (luncman.size * 0.25);
    luncman.size /= 2;

    if (this.type !== 'fruit') {
      //console.log('checking for collision: x', pickup.x, 'y', pickup.y, 'luncman', luncman);
    }

    return (pickup.x < luncman.x + luncman.size
      && pickup.x + pickup.size > luncman.x
      && pickup.y < luncman.y + luncman.size
      && pickup.y + pickup.size > luncman.y);
  }

  /**
   * Checks to see if the pickup is close enough to Luncman to be considered for collision detection
   * @param {number} maxDistance - The maximum distance Luncman can travel per cycle
   * @param {({ x:number, y:number })} luncmanCenter - The center of Luncman's hitbox
   * @param {Boolean} debugging - Flag to change the appearance of pickups for testing
   */
  checkLuncmanProximity(maxDistance, luncmanCenter, debugging) {
    if (this.animationTarget.style.visibility !== 'hidden') {
      const distance = Math.sqrt(
        ((this.center.x - luncmanCenter.x) ** 2)
        + ((this.center.y - luncmanCenter.y) ** 2),
      );

      this.nearLuncman = (distance <= maxDistance);

      if (debugging) {
        this.animationTarget.style.background = this.nearLuncman
          ? 'lime' : 'red';
      }
    }
  }

  /**
   * Checks if the pickup is visible and close to Luncman
   * @returns {Boolean}
   */
  shouldCheckForCollision() {
    return this.animationTarget.style.visibility !== 'hidden'
        && this.nearLuncman
        && !this.hasAwardedPoints; // Ensure points haven't been awarded yet
  }
  

  /**
   * If the Pickup is still visible, it checks to see if it is colliding with Luncman.
   * It will turn itself invisible and cease collision-detection after the first
   * collision with Luncman.
   */
  update() {
    if (this.shouldCheckForCollision()) {
      if (this.checkForCollision(
        {
          x: this.x,
          y: this.y,
          size: this.size,
        }, {
          x: this.luncman.position.left,
          y: this.luncman.position.top,
          size: this.luncman.measurement,
        },
      )) {
        this.animationTarget.style.visibility = 'hidden';

        // Only dispatch the awardPoints event if it hasn't been awarded yet
        if (!this.hasAwardedPoints) {
          this.hasAwardedPoints = true;
          //console.log('update set hasAwardedPoints to true', this.hasAwardedPoints)
          //console.log('visibility', this.animationTarget.style.visibility)  

          let fruitType = this.fruitImages[this.points];
            
          window.dispatchEvent(
            new CustomEvent('awardPoints', {
            detail: {
              points: this.points,
              type: this.type,
              fruitType: fruitType,
            },
          }));
  
          if (this.type === 'luncdot') {
            window.dispatchEvent(new Event('dotEaten'));
          } else if (this.type === 'powerPellet') {
            window.dispatchEvent(new Event('dotEaten'));
            window.dispatchEvent(new Event('powerUp'));
          }
        }
      }
    }
  }
}

class CharacterUtil {
  constructor(gameCoordinator) {
    this.directions = {
      up: 'up',
      down: 'down',
      left: 'left',
      right: 'right',
    };

    this.recentDirections = {};
    this.changeDirectionEvent = new Event('changeDirectionEvent');
    this.gameCoordinator = gameCoordinator;
    this.loopCount = 0;
  }

  /**
   * Checks if direction is changed and returns the new direction
   * @param {('up'|'down'|'left'|'right')} direction
   * @param {('up'|'down'|'left'|'right')} newDirection
   * @returns {('up'|'down'|'left'|'right')}
   */
  checkDirectionChange(oldDirection, newDirection, name, gridPosition) {
    this.name = name;
    this.gridPosition = gridPosition;
    const changedDirection = newDirection;
  
    if (changedDirection !== oldDirection) {
      const changeDirectionEvent = new CustomEvent('changeDirectionEvent', {
        detail: { direction: changedDirection, name: name, entityPosition: gridPosition },
      });
      window.dispatchEvent(changeDirectionEvent);
  
      // Update the recentDirections history
      if (!this.recentDirections[name]) {
        this.recentDirections[name] = [];
      }
      this.recentDirections[name].push(changedDirection);
  
      // Keep only the 16 most recent directions
      if (this.recentDirections[name].length > 16) {
        this.recentDirections[name].shift();
      }
  
      // Check for loops
      if (name !== 'luncman'){
        this.checkForLoop(name);
      }
    }
  
    return changedDirection;
  }

  /**
   * Checks if the character has made a loop
   * @param {string} name - The name of the character
   */
  checkForLoop(name) {

    if (this.loopCount > 8) {
      this.loopCount = 0;
    }

    if (this.recentDirections[name].length < 16 || this.loopCount > 3) {
      this.loopCount++;
      const entity = this.gameCoordinator.getEntityByName(name);
      entity.loop = false;
      return;
    }
  
    const directions = this.recentDirections[name];
    const maxPatternLength = Math.floor(directions.length / 2);
  
    outerLoop: for (let patternLength = 4; patternLength <= maxPatternLength; patternLength++) {
      for (let patternStart = 0; patternStart <= directions.length - patternLength * 2; patternStart++) {
        const pattern = directions.slice(patternStart, patternStart + patternLength);
        let isLoop = true;
  
        for (let i = 0; i < patternLength; i++) {
          if (directions[patternStart + patternLength + i] !== pattern[i]) {
            isLoop = false;
            break;
          }
        }
  
        if (isLoop) {
          // Set the loop property
          // Assuming that the entity object (Pacman or Fudder) is stored in a variable `entity`
          const entity = this.gameCoordinator.getEntityByName(name);
          if (entity) {
            if (entity.name !== 'luncman' && (this.loopCount > 3 && this.loopCount < 5)) {
              entity.loop = false;
            } else {
            entity.loop = true;
            }
            this.loopCount += 1;
          }
          break outerLoop;
        }
      }
    }
  } 

  /**
   * Gets a random direction
   * @param {('up'|'down'|'left'|'right')[]} possibleMoves
   * @returns {('up'|'down'|'left'|'right')}
   */
  getRandomDirection(possibleMoves) {
    const directions = Object.keys(possibleMoves);
    const randomIndex = Math.floor(Math.random() * directions.length);
    return directions[randomIndex];
  }
  

  /**
   * Check if a given character has moved more than five in-game tiles during a frame.
   * If so, we want to temporarily hide the object to avoid 'animation stutter'.
   * @param {({top: number, left: number})} position - Position during the current frame
   * @param {({top: number, left: number})} oldPosition - Position during the previous frame
   * @returns {('hidden'|'visible')} - The new 'visibility' css property value for the character.
   */
  checkForStutter(position, oldPosition) {
    let stutter = false;
    const threshold = 15;

    if (position && oldPosition) {
      if (Math.abs(position.top - oldPosition.top) > threshold
        || Math.abs(position.left - oldPosition.left) > threshold) {
        stutter = true;
      }
    }

    return stutter ? 'hidden' : 'visible';
  }

  /**
   * Check which CSS property needs to be changed given the character's current direction
   * @param {('up'|'down'|'left'|'right')} direction - The character's current travel orientation
   * @returns {('top'|'left')}
   */
  getPropertyToChange(direction) {
    switch (direction) {
      case this.directions.up:
      case this.directions.down:
        return 'top';
      default:
        return 'left';
    }
  }

  /**
   * Calculate the velocity for the character's next frame.
   * @param {('up'|'down'|'left'|'right')} direction - The character's current travel orientation
   * @param {number} velocityPerMs - The distance to travel in a single millisecond
   * @returns {number} - Moving down or right is positive, while up or left is negative.
   */
  getVelocity(direction, velocityPerMs) {
    switch (direction) {
      case this.directions.up:
      case this.directions.left:
        return velocityPerMs * -1;
      default:
        return velocityPerMs;
    }
  }

  /**
   * Determine the next value which will be used to draw the character's position on screen
   * @param {number} interp - The percentage of the desired timestamp between frames
   * @param {('top'|'left')} prop - The css property to be changed
   * @param {({top: number, left: number})} oldPosition - Position during the previous frame
   * @param {({top: number, left: number})} position - Position during the current frame
   * @returns {number} - New value for css positioning
   */
  calculateNewDrawValue(interp, prop, oldPosition, position) {
    return oldPosition[prop] + (position[prop] - oldPosition[prop]) * interp;
  }

  /**
   * Convert the character's css position to a row-column on the maze array
   * @param {('up'|'down'|'left'|'right')} direction - The character's current travel orientation
   * @param {number} scaledTileSize - The dimensions of a single tile
   * @returns {({x: number, y: number})}
   */
  determineGridPosition(position, scaledTileSize) {
    return {
      x: (position.left / scaledTileSize) + 0.5,
      y: (position.top / scaledTileSize) + 0.5,
    };
  }

  /**
   * Check to see if a character's disired direction results in turning around
   * @param {('up'|'down'|'left'|'right')} direction - The character's current travel orientation
   * @param {('up'|'down'|'left'|'right')} desiredDirection - Character's desired orientation
   * @returns {boolean}
   */
  turningAround(direction, desiredDirection) {
    return desiredDirection === this.getOppositeDirection(direction);
  }

  /**
   * Calculate the opposite of a given direction
   * @param {('up'|'down'|'left'|'right')} direction - The character's current travel orientation
   * @returns {('up'|'down'|'left'|'right')}
   */
  getOppositeDirection(direction) {
    switch (direction) {
      case this.directions.up:
        return this.directions.down;
      case this.directions.down:
        return this.directions.up;
      case this.directions.left:
        return this.directions.right;
      default:
        return this.directions.left;
    }
  }

  /**
   * Calculate the proper rounding function to assist with collision detection
   * @param {('up'|'down'|'left'|'right')} direction - The character's current travel orientation
   * @returns {Function}
   */
  determineRoundingFunction(direction) {
    switch (direction) {
      case this.directions.up:
      case this.directions.left:
        return Math.floor;
      default:
        return Math.ceil;
    }
  }

  /**
   * Check to see if the character's next frame results in moving to a new tile on the maze array
   * @param {({x: number, y: number})} oldPosition - Position during the previous frame
   * @param {({x: number, y: number})} position - Position during the current frame
   * @returns {boolean}
   */
  changingGridPosition(oldPosition, position) {
    return (
      Math.floor(oldPosition.x) !== Math.floor(position.x)
            || Math.floor(oldPosition.y) !== Math.floor(position.y)
    );
  }

  /**
   * Check to see if the character is attempting to run into a wall of the maze
   * @param {({x: number, y: number})} desiredNewGridPosition - Character's target tile
   * @param {Array} mazeArray - The 2D array representing the game's maze
   * @param {('up'|'down'|'left'|'right')} direction - The character's current travel orientation
   * @returns {boolean}
   */
  checkForWallCollision(desiredNewGridPosition, mazeArray, direction) {
    const roundingFunction = this.determineRoundingFunction(
      direction, this.directions,
    );

    const desiredX = roundingFunction(desiredNewGridPosition.x);
    const desiredY = roundingFunction(desiredNewGridPosition.y);
    let newGridValue;

    if (typeof mazeArray[desiredY] === 'string') {
      newGridValue = mazeArray[desiredY][desiredX];
    }

    return (newGridValue === 'X');
  }

  /**
   * Returns an object containing the new position and grid position based upon a direction
   * @param {({top: number, left: number})} position - css position during the current frame
   * @param {('up'|'down'|'left'|'right')} direction - The character's current travel orientation
   * @param {number} velocityPerMs - The distance to travel in a single millisecond
   * @param {number} elapsedMs - The amount of MS that have passed since the last update
   * @param {number} scaledTileSize - The dimensions of a single tile
   * @returns {object}
   */
  determineNewPositions(position, direction, velocityPerMs, elapsedMs, scaledTileSize) {
    const newPosition = Object.assign({}, position);
    newPosition[this.getPropertyToChange(direction)]
      += this.getVelocity(direction, velocityPerMs) * elapsedMs;
    const newGridPosition = this.determineGridPosition(
      newPosition, scaledTileSize,
    );

    return {
      newPosition,
      newGridPosition,
    };
  }

  /**
   * Calculates the css position when snapping the character to the x-y grid
   * @param {({x: number, y: number})} position - The character's position during the current frame
   * @param {('up'|'down'|'left'|'right')} direction - The character's current travel orientation
   * @param {number} scaledTileSize - The dimensions of a single tile
   * @returns {({top: number, left: number})}
   */
  snapToGrid(position, direction, scaledTileSize) {
    const newPosition = Object.assign({}, position);
    const roundingFunction = this.determineRoundingFunction(
      direction, this.directions,
    );

    switch (direction) {
      case this.directions.up:
      case this.directions.down:
        newPosition.y = roundingFunction(newPosition.y);
        break;
      default:
        newPosition.x = roundingFunction(newPosition.x);
        break;
    }

    return {
      top: (newPosition.y - 0.5) * scaledTileSize,
      left: (newPosition.x - 0.5) * scaledTileSize,
    };
  }

  /**
   * Returns a modified position if the character needs to warp
   * @param {({top: number, left: number})} position - css position during the current frame
   * @param {({x: number, y: number})} gridPosition - x-y position during the current frame
   * @param {number} scaledTileSize - The dimensions of a single tile
   * @returns {({top: number, left: number})}
   */
  handleWarp(position, scaledTileSize, mazeArray) {
    const newPosition = Object.assign({}, position);
    const gridPosition = this.determineGridPosition(position, scaledTileSize);

    if (gridPosition.x < -0.75) {                                         // Check if the character is beyond the left edge of the maze
      newPosition.left = (scaledTileSize * 27.25); // Warp the character to the right edge of the maze
    } else if (gridPosition.x > 27.75) {           // Check if the character is beyond the right edge of the maze
      newPosition.left = (scaledTileSize * -0.25);                        // Warp the character to the left edge of the maze
    }

    // Vertical warping
    if (gridPosition.y < -0.75) {
      newPosition.top = (scaledTileSize * 30.25);
    } else if (gridPosition.y > 30.75) {
      newPosition.top = (scaledTileSize * -0.25);
    }

    return newPosition;
  }

  /**
   * Advances spritesheet by one frame if needed
   * @param {Object} character - The character which needs to be animated
   */
  advanceSpriteSheet(character) {
    const {
      msSinceLastSprite,
      animationTarget,
      backgroundOffsetPixels,
    } = character;
    const updatedProperties = {
      msSinceLastSprite,
      animationTarget,
      backgroundOffsetPixels,
    };

    const ready = (character.msSinceLastSprite > character.msBetweenSprites)
      && character.animate;
    if (ready) {
      updatedProperties.msSinceLastSprite = 0;

      if (character.backgroundOffsetPixels
        < (character.measurement * (character.spriteFrames - 1))
      ) {
        updatedProperties.backgroundOffsetPixels += character.measurement;
      } else if (character.loopAnimation) {
        updatedProperties.backgroundOffsetPixels = 0;
      }

      const style = `-${updatedProperties.backgroundOffsetPixels}px 0px`;
      updatedProperties.animationTarget.style.backgroundPosition = style;
    }

    return updatedProperties;
  }
}


class SoundManager {
  constructor() {
    this.baseUrl = '/style/audio/';
    this.fileFormat = 'mp3';
    this.masterVolume = 0.02;
    this.musicVolume = 0.01;
    this.paused = false;
    this.cutscene = true;

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.ambience = new AudioContext();
    this.music = new AudioContext();

    this.ambienceGainNode = this.ambience.createGain();
    this.ambienceGainNode.connect(this.ambience.destination);

    this.musicGainNode = this.music.createGain();
    this.musicGainNode.connect(this.music.destination);
  }

  /**
   * Sets the cutscene flag to determine if players should be able to resume ambience
   * @param {Boolean} newValue
   */
  setCutscene(newValue) {
    this.cutscene = newValue;
  }

  /**
   * Sets the master volume for all sounds and stops/resumes ambience
   * @param {(0|1)} newVolume
   */
  setMasterVolume(newVolume) {
    this.masterVolume = newVolume;

    if (this.soundEffect) {
      this.soundEffect.volume = this.masterVolume;
    }

    if (this.dotPlayer) {
      this.dotPlayer.volume = this.masterVolume;
    }

    if (this.masterVolume === 0) {
      this.stopAmbience();
      this.stopMusic();
    } else {
      this.setAmbienceVolume(this.masterVolume);
      this.setMusicVolume(0.01);
      this.resumeAmbience(this.paused);
      this.resumeMusic(this.paused);
    }
  }

  /**
   * Plays a single sound effect
   * @param {String} sound
   */
  play(sound) {
    this.soundEffect = new Audio(`${this.baseUrl}${sound}.${this.fileFormat}`);
    this.soundEffect.volume = this.masterVolume;
    this.soundEffect.play();
  }

  /**
   * Special method for eating dots. The dots should alternate between two
   * sound effects, but not too quickly.
   */
  playDotSound() {
    this.queuedDotSound = true;

    if (!this.dotPlayer) {
      this.queuedDotSound = false;
      this.dotSound = (this.dotSound === 1) ? 2 : 1;

      this.dotPlayer = new Audio(
        `${this.baseUrl}dot_${this.dotSound}.${this.fileFormat}`,
      );
      this.dotPlayer.onended = this.dotSoundEnded.bind(this);
      this.dotPlayer.volume = this.masterVolume;
      this.dotPlayer.play();
    }
  }

  /**
   * Deletes the dotSound player and plays another dot sound if needed
   */
  dotSoundEnded() {
    this.dotPlayer = undefined;

    if (this.queuedDotSound) {
      this.playDotSound();
    }
  }

  setMusicVolume(newVolume) {
    this.musicVolume = newVolume;
    this.musicGainNode.gain.value = this.musicVolume;
  }

  setAmbienceVolume(newVolume) {
    this.ambienceVolume = newVolume;
    this.ambienceGainNode.gain.value = this.ambienceVolume;
  }

  /**
   * Loops an ambient sound
   * @param {String} sound
   */
  async setAmbience(sound, keepCurrentAmbience) {
    if (!sound) {
      this.stopAmbience();
    } else if (!this.fetchingAmbience && !this.cutscene) {
      if (!keepCurrentAmbience) {
        this.currentAmbience = sound;
        this.paused = false;
      } else {
        this.paused = true;
      }

      if (this.ambienceSource) {
        this.ambienceSource.stop();
      }

      if (this.masterVolume !== 0) {
        this.fetchingAmbience = true;
        const response = await fetch(
          `${this.baseUrl}${sound}.${this.fileFormat}`,
        );
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.ambience.decodeAudioData(arrayBuffer);

        this.ambienceSource = this.ambience.createBufferSource();
        this.ambienceSource.buffer = audioBuffer;
        this.ambienceSource.connect(this.ambienceGainNode);
        this.ambienceSource.loop = true;
        this.ambienceSource.start();

        this.fetchingAmbience = false;
      }
    }
  }

  async setMusic(sound, keepCurrentMusic) {
    if (!this.fetchingMusic && !this.cutscene) {
      if (!keepCurrentMusic) {
        this.currentMusic = sound;
        this.paused = false;
      } else {
        this.paused = true;
      }

      if (this.musicSource) {
        this.musicSource.stop();
      }

      if (this.masterVolume !== 0) {
        this.fetchingMusic = true;
        const response = await fetch(
          `${this.baseUrl}${sound}.${this.fileFormat}`,
        );
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.music.decodeAudioData(arrayBuffer);

        this.musicSource = this.music.createBufferSource();
        this.musicSource.buffer = audioBuffer;
        this.musicSource.connect(this.musicGainNode);
        this.musicSource.loop = true;
        this.musicSource.start();

        this.fetchingMusic = false;
      }
    }
  }

  /**
   * Resumes the ambience
   */
  resumeAmbience(paused) {
    if (this.ambienceSource) {
      // Resetting the ambience since an AudioBufferSourceNode can only
      // have 'start()' called once
      if (paused) {
        this.setAmbience('pause_beat', true);
      } else {
        this.setAmbience(this.currentAmbience);
      }
    }
  }

  resumeMusic(paused) {
    if (this.musicSource) {
      // Resetting the music since an AudioBufferSourceNode can only
      // have 'start()' called once
      if (paused) {
        this.setMusic('pause_beat', true);
      } else {
        this.setMusic(this.currentMusic);
      }
    }
  }

  /**
   * Stops the ambience
   */
  stopAmbience() {
    if (this.ambienceSource) {
      this.ambienceSource.stop();
    }
  }

  stopMusic() {
    if (this.musicSource) {
      this.musicSource.stop();
    }
  }
}


class Timer {
  constructor(callback, delay) {
    this.callback = callback;
    this.total = delay;
    this.start = new Date();
    this.timerId = setTimeout(() => {
      this.callback();
      window.dispatchEvent(new CustomEvent('removeTimer', {
        detail: {
          timer: this,
        },
      }));
    }, delay);
    window.dispatchEvent(new CustomEvent('addTimer', {
      detail: {
        timer: this,
      },
    }));
  }

  pause(systemPause) {
    const remaining = this.remaining;
    clearTimeout(this.timerId);
    this.total = remaining;
    this.start = new Date();  // Update start time to current time when paused
    if (systemPause) {
      this.pausedBySystem = true;
    }
  }
  
  resume(systemResume) {
    if (systemResume || !this.pausedBySystem) {
      this.pausedBySystem = false;
      this.start = new Date();
      this.timerId = setTimeout(() => {
        this.callback();
        window.dispatchEvent(new CustomEvent('removeTimer', {
          detail: {
            timer: this,
          },
        }));
      }, this.total);
    }
  }

  get remaining() {
    return Math.max(0, this.total - (new Date() - this.start));
  }

  set remaining(time) {
    this.total = time + (new Date() - this.start);
  }
}