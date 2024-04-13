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
    this.totalHealth = this.health;

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

  setSpeedFactor(duration, speedFactor) {
    console.log('setting speed for', this.name)
    this.settingSpeedFactor = true;
    // Store the original speed
    const originalVelocityPerMs = this.velocityPerMs;
  
    // Ensure the current velocity is also adjusted
    this.velocityPerMs = this.velocityPerMs * speedFactor;

    const originalStutterThreshold = this.characterUtil.threshold;
    this.characterUtil.threshold = originalStutterThreshold * 10;

    // Set a timeout to reset the speeds after the specified duration
    setTimeout(() => {
      this.settingSpeedFactor = false;
      this.velocityPerMs = originalVelocityPerMs;
      this.characterUtil.threshold = originalStutterThreshold;
    }, duration);
  }

  resetSpeedFactor() {
    if (this.settingSpeedFactor) {
      this.velocityPerMs = this.originalVelocityPerMs;
      this.characterUtil.threshold = this.originalStutterThreshold;
      this.settingSpeedFactor = false;
    }
    console.log('set', this.name, 'velocity to', this.velocityPerMs);
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
      this.animationTarget.classList.add('hue-rotate');
    } else if (mode === 'eyes') {
      this.animationTarget.style.backgroundImage = 'url(/style/graphics/'
        + `spriteSheets/characters/ghosts/eyes_${direction}.svg)`;
    } else {
      this.animationTarget.style.backgroundImage = `url(${imgBase}${fudders[name]}.webp)`;
      this.animationTarget.classList.remove('hue-rotate');
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
    if (!this.lastEatenTimer || currentTime - this.lastEatenTimer > 5000) {
      this.lastEatenTimer = currentTime;
      this.eatenTimer = new Timer(() => {
        if (!this.enteringFudderHouse(this.mode, gridPosition)) {
          this.endScared();
        }
        this.eatenTimer = null;
      }, 5000);
    }
  }

  /**
   * Handles the fudder when it is attacked
   */
  fudderAttacked() {
    // Set attacked to true and start a 2-second timer to set attacked to false
    this.attacked = true;
    this.allowCollision = false;
    this.startHealth = this.health;
    const timerDuration = 2000; // 2 seconds
    const timerCallback = () => {
      this.attacked = false;
      this.allowCollision = true;
    };
    this.attackTimer = new Timer(timerCallback, timerDuration);

    // Check the conditions to call reduceHealth with the appropriate damage
    if (this.luncman.speedBoost && this.mode === 'scared') {
      this.reduceHealth(250);
      new Onomat('scaredCrit');
    } else if (this.luncman.speedBoost) {
      this.reduceHealth(150);
      new Onomat('crit');
    } else if (this.mode === 'scared') {
      this.reduceHealth(100);
      new Onomat('scared')
    } else {
      this.reduceHealth(50);
      new Onomat('hit')
    }
  }

  /**
   * Reduces the Fudder's health by the given damage
   * @param {number} damage - The amount of health to reduce
   */
  reduceHealth(damage) {
    console.log('Reducing health for:', this.name);
    if (this.health - damage <= 0) {
      if (this.mode === 'scared') {
        new Onomat('scaredKill');
      }
      this.killFudder();
    } else {
      window.luncMachine.gameCoordinator.soundManager.play('hitmarker');
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
    let totalHealth;
    if (this.name === 'fudder1') {
      totalHealth = this.levelData.assets.fudder1Health;
    } else {
      totalHealth = this.levelData.assets.fudderHealth;
    }
    this.healthPercentage = this.health / totalHealth;
    this.healthBar.classList.add('health-bar');
  
    let healthBarWidth;
    let healthColor;
    
    if (this.dead) {
      healthColor = 'rgb(255, 0, 0)';
      healthBarWidth = 0;
      this.healthDisplay.innerText = 'R.I.P.';
  
      this.healthBar.style.width = healthBarWidth + '%';
      this.healthBar.style.backgroundColor = healthColor;
      return;
    }

    healthBarWidth = Math.max(0, this.healthPercentage * 100);
    healthColor = this.getHealthBarColor(this.healthPercentage);
  
    this.healthBar.style.width = healthBarWidth + '%';
    this.healthBar.style.backgroundColor = healthColor;

    if (this.healthDisplay) {
      this.healthDisplay.innerText = this.health + '/' + totalHealth;
    } else {
      const healthDisplay = document.getElementById(this.name + 'HealthDisplay');
      if (healthDisplay) {
        this.healthDisplay = healthDisplay
        this.healthDisplay.innerText = this.health + '/' + totalHealth;
      } else {
        this.healthDisplay = document.createElement('div');
        this.healthDisplay.id = this.name + 'HealthDisplay';
        this.healthDisplay.innerText = this.health + '/' + totalHealth;

        const healthbar = 'healthbar' + this.name.slice(-1);
        document.getElementById(healthbar).appendChild(this.healthDisplay);
  
        this.healthDisplay.style.display = 'flex';
        this.healthDisplay.style.left = '2.5%';
        this.healthDisplay.style.color = 'white';
        this.healthDisplay.style.fontSize = '.5em';
        this.healthDisplay.style.zIndex = '5';
      }
    }
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
    if (this.settingSpeedFactor) return this.velocityPerMs;
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
    
    this.speedBoostTimeout = null;
    this.attackTimeout = null;

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
    this.setSpriteSheetSources();
    this.setSpriteSheet();
    this.luncmanArrow.style.backgroundImage = 'url(/style/graphics/'
      + `spriteSheets/characters/luncman/arrow_${this.direction}.svg)`;
    this.attackCount = 0;
    this.isDead = false;
    this.originalVelocityPerMs = this.calculateVelocityPerMs(this.scaledTileSize);
    this.velocityPerMs = this.originalVelocityPerMs;
    this.speedFactor = 1;
    if (this.speedBoostTimeout) clearTimeout(this.speedBoostTimeout);
    if (this.attackTimeout) clearTimeout(this.attackTimeout);
    this.speedBoost = false;
    this.attack = false;
    this.backgroundOffsetPixels = 0;
    this.msSinceLastSprite = 0;
    this.resetSpeedFactor(true);
    this.updateSpeed(true);
  }

  // update default position
  updateDefaultPosition(newDefaultPosition) {
    this.defaultPosition = newDefaultPosition;
  }

  updateSpeed(reset) {
    if (reset) {
      this.originalVelocityPerMs = this.calculateVelocityPerMs(this.scaledTileSize);
      this.velocityPerMs = this.originalVelocityPerMs;
      console.log('set luncman velocity to', this.velocityPerMs);
      return;
    }
    let baseSpeedMultiplier = this.speedFactor; // Start with the current speed factor
    if (this.speedBoost) baseSpeedMultiplier *= 2;
    if (this.attack) baseSpeedMultiplier *= 2.5;
    if (this.speedBoost && this.attack) baseSpeedMultiplier = this.speedFactor * 3.5; // Apply both modifiers on top of speed factor

    this.velocityPerMs = this.originalVelocityPerMs * baseSpeedMultiplier;
  }

  /**
   * Sets various properties related to Luncman's movement
   * @param {number} scaledTileSize - The dimensions of a single tile
   */
  setMovementStats(scaledTileSize) {
    this.velocityPerMs = this.calculateVelocityPerMs(scaledTileSize);
    this.desiredDirection = this.characterUtil.directions.left;
    this.direction = this.characterUtil.directions.left;
    if (!this.attack || !this.speedBoost) this.moving = false;
  } 

  resetVelocityPerMs() {
    this.velocityPerMs = this.originalVelocityPerMs;
  }

  setSpeedFactor(duration, speedFactor) {
    // Apply the speed factor
    this.speedFactor = speedFactor;
    this.updateSpeed();

    // Extend or set the speed boost duration with tracking start time
    if (this.speedBoost) {
      const now = Date.now();
      // If speedBoostStartTime is not set, this is the initial setting
      if (!this.speedBoostStartTime) this.speedBoostStartTime = now;
      // Calculate elapsed time
      const elapsedTime = now - this.speedBoostStartTime;
      // Adjust remaining time based on elapsed time
      const adjustedDuration = Math.max(0, duration + (this.originalBoostDuration - elapsedTime));
      clearTimeout(this.speedBoostTimeout);
      this.speedBoostTimeout = setTimeout(this.endSpeedBoost.bind(this), adjustedDuration);
    }

    // Similar logic for attack
    if (this.attack) {
      const now = Date.now();
      if (!this.attackStartTime) this.attackStartTime = now;
      const elapsedTime = now - this.attackStartTime;
      const adjustedDuration = Math.max(0, duration + (this.originalAttackDuration - elapsedTime));
      clearTimeout(this.attackTimeout);
      this.attackTimeout = setTimeout(this.endAttack.bind(this), adjustedDuration);
    }

    this.settingSpeedFactor = true;
    const originalVelocityPerMs = this.velocityPerMs;
    this.velocityPerMs = originalVelocityPerMs * speedFactor;
    
    this.speedBoostDuration = duration;
    this.attackDuration = duration;

    const originalStutterThreshold = this.characterUtil.threshold;
    this.characterUtil.threshold = originalStutterThreshold * 10;


    setTimeout(() => {
      this.settingSpeedFactor = false;
      this.speedFactor = 1;
      this.updateSpeed();
      this.characterUtil.threshold = originalStutterThreshold;
    }, duration);
  }

  endSpeedBoost() {
    // Logic to properly end speed boost
    this.speedBoost = false;
    // Reset timer related variables
    this.originalSpeedBoostDuration = 0;
    this.extendedSpeedBoostDuration = 0;
  }

  endAttack() {
    // Logic to properly end attack
    this.attack = false;
    // Reset timer related variables
    this.originalAttackDuration = 0;
    this.extendedAttackDuration = 0;
    this.setStyleMeasurements(this.scaledTileSize, this.spriteFrames);
  }

  extendEffectDuration(effectType, duration) {
    clearTimeout(this[`${effectType}Timeout`]);
    if (effectType === 'speedBoost') {
      this.speedBoostTimeout = setTimeout(() => {
        this.speedBoost = false;
        this.updateSpeed();
      }, duration);
    } else if (effectType === 'attack') {
      this.attackTimeout = setTimeout(() => {
        this.luncmanArrow.style.display = 'block';
        this.attack = false;
        this.updateSpeed(); // Ensure speed recalculates when attack ends
        this.setStyleMeasurements(this.scaledTileSize, this.spriteFrames);
      }, duration);
    }
  }

  resetSpeedFactor(fullReset) {
    // Reset to original speed factor
    this.speedFactor = 1;
    this.updateSpeed();

    if (fullReset) return;

    let speedBoostDuration;
    let attackDuration;
    if (this.speedBoost) {
      // Compare and use the lesser of the original or extended duration
      speedBoostDuration = Math.min(this.originalSpeedBoostDuration, this.extendedSpeedBoostDuration);
      clearTimeout(this.speedBoostTimeout);
      this.speedBoostTimeout = setTimeout(() => this.endSpeedBoost(), speedBoostDuration);
    }
    if (this.attack) {
      attackDuration = Math.min(this.originalAttackDuration, this.extendedAttackDuration);
      clearTimeout(this.attackTimeout);
      this.attackTimeout = setTimeout(() => this.endAttack(), attackDuration);
    }

    this.extendEffectDuration('speedBoost', speedBoostDuration);
    this.extendEffectDuration('attack', attackDuration);
  }

  // speed boost functions

  getSpeedBoost() {
    this.speedBoost = true;
    this.updateSpeed();

    const originalStutterThreshold = this.characterUtil.threshold;
    this.characterUtil.threshold = originalStutterThreshold * 10;

    const createBlurInterval = setInterval(() => {
      this.createMotionBlurCopy();
    }, 50); // create a motion blur copy every 50ms
    // Clear existing timeout to prevent premature reset
    if (this.speedBoostTimeout) clearTimeout(this.speedBoostTimeout);
    
    const duration = 250;
    const startTime = Date.now();
    this.speedBoostTimeout = setTimeout(() => {
      clearInterval(createBlurInterval);
      this.speedBoost = false;
      this.updateSpeed(); // Recalculate speed after boost ends
    }, duration);

    this.getRemainingSpeedBoostTime = function() {
      const currentTime = Date.now();
      const elapsedTime = currentTime - startTime;
      return duration - elapsedTime;
    }
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
        + `${this.imageSources.plus[this.direction]})`;
    } else if (this.attack) {
      this.setAttackAnimationStats();
      if (this.scared) {
        this.animationTarget.style.backgroundImage = 'url(/style/graphics/'
        + `${this.imageSources.plusFire[this.direction]})`;
      } else {
        this.animationTarget.style.backgroundImage = 'url(/style/graphics/'
        + `${this.imageSources.fire[this.direction]})`;
      }
    } else {
      this.setSpriteSheet();
    }
  }

  setSpriteSheetSources() {
    // Check if the NFT exists
    if (window.client.gloInfo.activeLuncman) {
      // If NFT exists, set the image source to the NFT source
      this.imageSources = window.client.gloInfo.activeLuncman.metadata.gameImages;
    } else {
      // If NFT does not exist, set the image source to the default source
      this.imageSources = {
        default: {
          left: 'spriteSheets/characters/luncman/luncman_left.webp',
          right: 'spriteSheets/characters/luncman/luncman_right.webp',
          up: 'spriteSheets/characters/luncman/luncman_up.webp',
          down: 'spriteSheets/characters/luncman/luncman_down.webp'
        },
        plus: {
          left: 'spriteSheets/characters/luncman/luncman_left+.webp',
          right: 'spriteSheets/characters/luncman/luncman_right+.webp',
          up: 'spriteSheets/characters/luncman/luncman_up+.webp',
          down: 'spriteSheets/characters/luncman/luncman_down+.webp'
        },
        fire: {
          left: 'spriteSheets/characters/luncman/luncman_left_fire.webp',
          right: 'spriteSheets/characters/luncman/luncman_right_fire.webp',
          up: 'spriteSheets/characters/luncman/luncman_up_fire.webp',
          down: 'spriteSheets/characters/luncman/luncman_down_fire.webp'
        },
        plusFire: {
          left: 'spriteSheets/characters/luncman/luncman+_left_fire.webp',
          right: 'spriteSheets/characters/luncman/luncman+_right_fire.webp',
          up: 'spriteSheets/characters/luncman/luncman+_up_fire.webp',
          down: 'spriteSheets/characters/luncman/luncman+_down_fire.webp'
        }
      };
    }
    console.log('set luncman sources', this.imageSources)

    // Update the sprite and arrow images using the new sources
    this.setSpriteSheet();
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
      this.updateSpeed();
      this.attackCount -= 1;
      window.attackCount = this.attackCount;

      const originalStutterThreshold = this.characterUtil.threshold;
      this.characterUtil.threshold = originalStutterThreshold * 10;
  
  
      // Create motion blur copies of the updated sprite sheet
      const createBlurInterval = setInterval(() => {
        this.createMotionBlurCopy();
      }, 50); // create a motion blur copy every 50ms
      
      // Clear existing timeout to prevent premature reset
      if (this.attackTimeout) clearTimeout(this.attackTimeout);
      
      const duration = 250;
      const startTime = Date.now();
      this.attackTimeout = setTimeout(() => {
        this.luncmanArrow.style.display = 'block';
        clearInterval(createBlurInterval); // stop creating motion blur copies
        // this.setSpriteAnimationStats();
        this.setStyleMeasurements(this.scaledTileSize, this.spriteFrames);
        this.characterUtil.threshold = originalStutterThreshold;
        this.attack = false;
        this.updateSpeed(); // Recalculate speed after attack ends
      }, duration); 

      this.getRemainingAttackTime = function() {
        const currentTime = Date.now();
        const elapsedTime = currentTime - startTime;
        return duration - elapsedTime;
      }
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
 setSpriteSheet() {
  this.animationTarget.style.backgroundImage = 'url(/style/graphics/'
  + `${this.imageSources.default[this.direction]})`;
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
    if (!window.client.gloInfo.activeLuncman) {
      this.animationTarget.style.backgroundImage = 'url(/style/'
        + 'graphics/spriteSheets/characters/luncman/luncman_death.webp)';
    } else {
      this.animationTarget.style.backgroundImage = 'url(/style/graphics/'
        + window.client.gloInfo.activeLuncman.metadata.gameImages.death['death'];
    }
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
      this.setSpriteSheet();
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
      this.setSpriteSheet();
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

/***
 * Creates an Onomatatopoeia effect
 ***/
class Onomat {
  constructor (type, determinedImageIndex = 0) {
    this.type = type;
    this.luncman = window.luncMachine.gameCoordinator.luncman.animationTarget;
    this.luncmanPos = {
      x: parseFloat(this.luncman.style.left),
      y: parseFloat(this.luncman.style.top)
    }
    console.log('got luncman pos', this.luncmanPos, 'from', this.luncman.style.left, window.luncMachine.gameCoordinator.scale)
    this.images = window.luncMachine.gameCoordinator.onomatImages[type];
    this.determinedImageIndex = determinedImageIndex;
    console.log('created onomat', this.images, this.determinedImageIndex)
    
    this.offset = { x: 0, y: 0 };
    this.duration = 1000;
    
    this.elements = [];

    this.createOnomatopoeia();
  }

  createOnomatopoeia() {
    if (!this.images || this.images.length === 0) {
      console.error('No images available for this type:', this.type);
      return;
    }

    // Randomly select an image index from the available images for the type
    const imageIndex = Math.floor(Math.random() * this.images.length);
    console.log(`Selected image index for type ${this.type}:`, imageIndex);
    let width;
    let height;
    let offset = {
      x: 0,
      y: 0
    };
    let hueRotate;

    switch (this.type) {
      case 'attack':
        // Type-specific configurations
        this.duration = 0;
        this.fadeDuration = 500;
        this.frameCount = 8;
        this.fps = 8;
        this.follow = true;
        width = 30;
        height = 100;

        if (window.luncMachine.gameCoordinator.attackOnomat) {
          window.luncMachine.gameCoordinator.attackOnomat.removeOnomat();
          window.luncMachine.gameCoordinator.attackOnomat = null;
    
          window.luncMachine.gameCoordinator.attackOnomat = this;
        } else {
          window.luncMachine.gameCoordinator.attackOnomat = this;
          console.log('set attackOnomat', this)
        }

        // Create onomatopoeia element with the random image
        this.createOnomatopoeiaElement(this.determinedImageIndex, { width: width * .5, height: height * .5}, { width: width, height: height });
        break;
      case 'hit':
        this.frameCount = 8;
        this.fps = 8;
        this.duration = 1000;
        this.fadeDuration = 0;
        width = 100;
        height = 50;
        // Create onomatopoeia element with the random image
        this.createOnomatopoeiaElement(imageIndex, { width: width, height: height }, { width: width, height: height }); // Example of different size
        break;
      case '$coin':
        this.duration = 2000;
        this.fadeDuration = 1000;
        this.frameCount = 8;
        this.fps = 8;
        width = 57;
        height = 27;
        offset = {
          x: 0,
          y: -35
        }
        // Create onomatopoeia element with the random image
        this.createOnomatopoeiaElement(this.determinedImageIndex, { width: width * 1.5, height: height * 1.5 }, { width: width, height: height }, offset); // Example of different size
        
        width = 100;
        height = 50;
        offset = {
          x: 0,
          y: -2
        };
        const pointIndex = this.determinedImageIndex += 1;
        this.createOnomatopoeiaElement(pointIndex, { width: width * .75, height: height * .75 }, { width: width, height: height }, offset);
        break;
      case 'kill':
        this.duration = 2000;
        this.fadeDuration = 1000;
        this.frameCount = 8;
        this.fps = 8;
        width = 91;
        height = 27;
        switch (imageIndex) {
          case 0:
            window.luncMachine.gameCoordinator.soundManager.play('byebye', true)
            break;
          case 1:
            window.luncMachine.gameCoordinator.soundManager.play('adios', true)
            break;
          case 2:
            window.luncMachine.gameCoordinator.soundManager.play('fudoff', true)
            break;
          case 3:
            window.luncMachine.gameCoordinator.soundManager.play('lunc', true)
            break;
          default:
            break;
        }
        // Create onomatopoeia element with the random image
        this.createOnomatopoeiaElement(imageIndex, { width: width * 2, height: height * 2 }, { width: width, height: height }); // Example of different size
        break;
      case 'collat':
        this.duration = 3000;
        this.fadeDuration = 1000;
        this.frameCount = 8;
        this.fps = 8;
        width = 174;
        height = 67;
        if (window.collateralCount > 1) {
          offset = {
            x: width / 8,
            y: (-height * .25) * window.collateralCount
          }
          hueRotate = 90;
          console.log('set offset to', offset, 'using', width / 8, 'and', height * window.collateralCount)
        }
        // Create onomatopoeia element with the random image
        this.createOnomatopoeiaElement(imageIndex, { width: width, height: height }, { width: width, height: height }, offset, hueRotate); // Example of different size
        window.collateralCount++;
        setTimeout(() => {
          window.collateralCount = 1;
        }, 650);
        break;
      case 'chain':
        this.duration = 3000;
        this.fadeDuration = 1000;
        this.frameCount = 8;
        this.fps = 8;
        width = 174;
        height = 67;
        // Create onomatopoeia element with the random image
        this.createOnomatopoeiaElement(imageIndex, { width: width, height: height }, { width: width, height: height }); // Example of different size
        break;
      case 'crit':
        this.frameCount = 8;
        this.fps = 8;
        this.duration = 1000;
        this.fadeDuration = 0;
        width = 100;
        height = 50;
        // Create onomatopoeia element with the random image
        this.createOnomatopoeiaElement(imageIndex, { width: width, height: height }, { width: width, height: height }); // Example of different size
        break;
      case 'scared':
        this.frameCount = 8;
        this.fps = 8;
        this.duration = 1000;
        this.fadeDuration = 0;
        width = 100;
        height = 50;
        // Create onomatopoeia element with the random image
        this.createOnomatopoeiaElement(imageIndex, { width: width, height: height }, { width: width, height: height }); // Example of different size
        break;
      case 'scaredCrit':
        this.frameCount = 8;
        this.fps = 8;
        this.duration = 1000;
        this.fadeDuration = 0;
        width = 100;
        height = 50;
        // Create onomatopoeia element with the random image
        this.createOnomatopoeiaElement(imageIndex, { width: width, height: height }, { width: width, height: height }); // Example of different size
        break;
      case 'scaredKill':
        this.duration = 2000;
        this.fadeDuration = 1000;
        this.frameCount = 8;
        this.fps = 8;
        width = 21;
        height = 9;
        // Create onomatopoeia element with the random image
        this.createOnomatopoeiaElement(imageIndex, { width: width * 2, height: height * 2 }, { width: width, height: height }); // Example of different size
        break;
      case 'eat':
        this.duration = 2000;
        this.fadeDuration = 1000;
        this.frameCount = 8;
        this.fps = 8;
        width = 124;
        height = 40;
        // Create onomatopoeia element with the random image
        this.createOnomatopoeiaElement(imageIndex, { width: width, height: height }, { width: width, height: height }); // Example of different size
        break;
      case 'gloUp':
        this.duration = 2000;
        this.fadeDuration = 1000;
        this.frameCount = 8;
        this.fps = 8;
        width = 91;
        height = 27;
        // Create onomatopoeia element with the random image
        this.createOnomatopoeiaElement(imageIndex, { width: width, height: height }, { width: width, height: height }); // Example of different size
        break;
      case 'newLife':
        this.duration = 2000;
        this.fadeDuration = 1000;
        this.frameCount = 8;
        this.fps = 8;
        width = 16;
        height = 12;
        // Create onomatopoeia element with the random image
        this.createOnomatopoeiaElement(imageIndex, { width: width * 3, height: height * 3 }, { width: width, height: height }); // Example of different size
        break;
      default:
        console.error('Tried to create onomatopoeia but no valid type was given');
        break;
    }
  }

  createOnomatopoeiaElement(imageIndex, size, imgSize, offset, hueRotate) {
    this.onomatElement = document.createElement('div');
    this.onomatElement.style.position = 'absolute';
    this.onomatElement.style.zIndex = '5';
    this.updateElementPosition(offset); // Initial position update
    
    // Add the created onomatElement to the tracking array
    this.elements.push(this.onomatElement);

    const canvas = document.createElement('canvas');
    canvas.width = size.width;
    canvas.height = size.height;
    
    // Apply hue rotation if hueRotate is specified
    if (hueRotate) {
      const context = canvas.getContext('2d');
      context.filter = `hue-rotate(${hueRotate}deg)`;
    }

    this.onomatElement.appendChild(canvas);

    window.luncMachine.gameCoordinator.mazeDiv.appendChild(this.onomatElement);

    this.animateOnomatopoeia(canvas, imageIndex, imgSize); // Pass this.onomatElement to the animation function

    // Add a CSS class for the fade out transition
    this.onomatElement.classList.add('fade-out');

    if (this.duration > 0) {
      // Fade out the element before removing it
      setTimeout(() => {
        this.onomatElement.style.opacity = '0';
        // Remove the element after the fade duration
        setTimeout(() => this.removeOnomat(), this.fadeDuration);
      }, this.duration - this.fadeDuration);
    }
  }

  animateOnomatopoeia(canvas, imageIndex, imgSize) {
    const context = canvas.getContext('2d');
    const image = this.images[imageIndex];
    let frameIndex = 0;
    const frameCount = this.frameCount;
    const framesPerRow = this.frameCount;
    const frameWidth = imgSize.width;
    const frameHeight = imgSize.height;
    let lastFrameTime = 0;
    const fps = this.fps;
    const frameDelay = 1000 / fps;

    const startTime = Date.now();

    const animate = (timestamp) => {
        if (timestamp - lastFrameTime > frameDelay) {
            context.clearRect(0, 0, canvas.width, canvas.height);
            const frameX = (frameIndex % framesPerRow) * frameWidth;
            const frameY = Math.floor(frameIndex / framesPerRow) * frameHeight;

            context.drawImage(image, frameX, frameY, frameWidth, frameHeight, 0, 0, canvas.width, canvas.height);

            frameIndex++;
            if (frameIndex >= frameCount) frameIndex = 0;
            lastFrameTime = timestamp;
        }

        if (this.follow) {
            this.updateElementPosition();
        }

        requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }

  updateElementPosition(offset) {
    let updateOffset = offset || this.offset;
    // Calculate the position based on Luncman's current position
    let top = this.luncmanPos.y + updateOffset.y;
    let left = this.luncmanPos.x + updateOffset.x;

    // Adjust the position with the offset if this.follow is true
    if (this.follow) {
        // If following Luncman, optionally adjust for historical position
        const historicalPosition = window.luncMachine.gameCoordinator.getLuncmanPositionFromHistory(200); // Example usage
        if (historicalPosition) {
            top = historicalPosition.y + this.offset.y;
            left = historicalPosition.x + this.offset.x;
        } else {
            // Apply current offset if historical position is not used or available
            top += this.offset.y;
            left += this.offset.x;
        }
    }
    
    // Apply the calculated position
    this.onomatElement.style.top = `${top}px`;
    this.onomatElement.style.left = `${left}px`;
  }

  removeOnomat() {
    this.elements.forEach((element, index) => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
        console.log(`Onomatopoeia element removed from DOM: ${this.type}, index: ${index}`);
      } else {
        console.log(`Onomatopoeia element was already removed or never attached: ${this.type}, index: ${index}`);
      }
    });
  
    // Clear the elements array after removal
    this.elements = [];
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
    this.abilityDiv.id = `ability${this.abilityIndex}`;
    
    // Set the background image.
    this.abilityDiv.style.backgroundImage = `url(${abilitySvgPath})`;
    
    // Set the div to show only a single frame of the spritesheet.
    this.abilityDiv.style.width = `${this.frameWidth}px`;
    this.abilityDiv.style.height = '32px'; // replace with the height of your frames
    this.abilityDiv.style.zIndex = '2';
    this.abilityDiv.style.backgroundRepeat = 'no-repeat';

    // Add the div to the body of the document.
    const contentContainer = document.getElementById('content-container');
    contentContainer.appendChild(this.abilityDiv);
    
    // Calculate the x-position based on the ability index.
    // const totalWidth = 3 * this.frameWidth + 2 * 10;
    // const xPos = this.abilityIndex * (this.frameWidth + 10);
    // const screenWidth = contentContainer.offsetWidth;
    // console.log('positioning ability', this.abilityIndex, 'at', (screenWidth / 2) - (totalWidth / 2) + xPos, 'px');
    
    // Set the position of the div.
    this.abilityDiv.style.position = "absolute";
    // this.abilityDiv.style.left = `${(screenWidth / 2) - (totalWidth / 2) + xPos}px`;
    if (this.isMobile) {
      this.abilityDiv.style.top = window.abilityTop;
    } else {
      this.abilityDiv.style.top = '3.5%';
    }
    Ability.updateAllAbilityPositions();
    
    
    // Start the timer.
    this.startTimer();
  }

  static updateAllAbilityPositions() {
    const abilities = document.querySelectorAll('[id^="ability"]');
    const totalAbilities = abilities.length;
    const contentContainer = document.getElementById('content-container');
    const screenWidth = contentContainer.offsetWidth;
    const abilityWidth = 32; // Assuming all abilities have the same width
    const gap = 10; // Assuming a fixed gap between abilities
    const totalWidth = totalAbilities * abilityWidth + (totalAbilities - 1) * gap;

    abilities.forEach((ability, index) => {
      const position = (screenWidth / 2) - (totalWidth / 2) + (index * (abilityWidth + gap));
      ability.style.left = `${position}px`;
    });
  }

  startTimer() {
    // start timer (5 sec) & call completeAbility when finished
    this.abilityTimer = new Timer(() => this.completeAbility(), this.cooldownTime)

    // start animation
    this.updateAnimation();
  }

  updateTimer(updateAmount) {
    // subtract x ms from timer
    this.abilityTimer.remaining = this.abilityTimer.remaining -= updateAmount;
    this.animation.remaining = this.animation.remaining -= updateAmount;
    this.checkCooldownCompletion();
  }

  checkCooldownCompletion() {
    // If the remaining time is less than or equal to 500ms and we haven't started recording, start now
    if (this.abilityTimer.remaining <= 500 && !this.startedRecordingPosition) {
    }

    // If the total elapsed time exceeds the adjusted cooldown time, complete the cooldown
    if (this.abilityTimer.remaining <= 0) {
      this.completeAbility();
      this.cooldownComplete = true;
      // clear the timer
      clearTimeout(this.abilityTimer.timerId);
    }
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
    if (this.loopTimer) { // Ensure you refer to it correctly; it seems there was a typo in the original code.
      clearTimeout(this.loopTimer.timerId);
    }
  
    // Remove the div from the DOM
    this.abilityDiv.remove();
  
    // Defer the update of all ability positions
    setTimeout(() => Ability.updateAllAbilityPositions(), 0);
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
    this.soundButton = document.getElementById('sound-button');
    this.volumeIcon = document.getElementById('volume-icon');
    this.soundControl = document.getElementById('sound-control');
    this.pauseButton = document.getElementById('pause-button');
    this.pauseIcon = document.getElementById('pause-icon');
    this.volumeSlider = document.getElementById('volume-slider');
    this.leftCover = document.getElementById('left-cover');
    this.rightCover = document.getElementById('right-cover');
    this.bottomRow = document.getElementById('bottom-row');
    this.rightHUD = document.getElementById('right-HUD');
    this.leftHUD = document.getElementById('left-HUD');
    this.luncmanDiv = document.getElementById('luncman-div');
    this.deadFudders = [];
    this.isPanning = false;
    this.isMobile = this.checkIfMobile();
    this.highscoreDisplaySet = false;
    this.gameStarted = false;
    this.dotsEaten = 0;
    this.seventyPercent = null;
    this.twentyFivePercent = null;
    this.boostTimeout = null; // initialize the boost timeout to null
    this.loadedLevels = {};
    this.abilities = [];
    this.attackOnomat = null;
    this.waitingAbility = false; // waiting to create ability
    this.pickups = [];
    this.entityList = [];
    this.fudders = [];
    this.username = window.client.gloInfo.username;
    this.fuddersKilled = 0;

    window.collateralCount = 1;

    this.luncmanPositionHistory = [];
    this.isRecordingLuncmanPosition = false;
    this.historySizeLimit = 300; // Assuming 60 FPS, 5 seconds of history

    this.maxFps = 60;
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
      2: 200,
      3: 300,
      4: 400,
      5: 1000,
      6: 2000,
      7: 3000,
      8: 5000,
    };

    this.volume = 0.02;

    this.registerEventListeners();

    this.soundButton.addEventListener(
      'click',
      this.soundButtonClick.bind(this),
    );

    this.pauseButton.addEventListener(
      'click',
      this.pauseButtonClick.bind(this),
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

    const nameDisplay = document.getElementById('name-display');
    if (username && nameDisplay) {
      nameDisplay.innerText = username;
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
 
       this.soundManager.play('pause');
 
       if (this.gameEngine.started) {
         this.soundManager.resumeAmbience();
         this.gameUi.style.filter = 'unset';
         this.activeTimers.forEach((timer) => {
           timer.resume();
         });
       } else {
         this.soundManager.stopAmbience();
         this.soundManager.setAmbience('pause_beat', true);
         this.gameUi.style.filter = 'blur(5px)';
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
        // this.sendWalletConnectRequest(walletAddress, true);

        // Form the new username by taking the first 5 and last 6 letters from walletAddress
        this.nameDisplay.innerText = window.client.gloInfo.username;
      }
      
      

  handleWalletDisconnected() {
    //localStorage.removeItem('username');
    console.log('he disconnected')
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

  // sendWalletConnectRequest(walletAddress, checkIfExists) {
  //   const Http = new XMLHttpRequest();
  
  //   const params = JSON.stringify({ walletID: walletAddress });
  
  //   Http.open("POST", "/newplayer");
  //   Http.setRequestHeader("Content-Type", "application/json");
  
  //   Http.onreadystatechange = (e) => {
  //       if (Http.readyState === XMLHttpRequest.DONE) {
  //           const response = JSON.parse(Http.response);
            
  //           if (Http.status === 200) {
  //               // Successful response, set the client information
  //               window.client.createGloSession(response);
  //               console.log(Http.response);
  //               // The token is now securely stored as an HTTP cookie
  //           } else {
  //               // Handle error scenarios based on the error message returned from the server
  //               console.error('Error:', response.error);
  //           }
  //       }
  //   };

  //   console.log('CookieStorage:', params);
  //   Http.send(params);
  // }
     
  /**
   * Reveals the game underneath the loading covers and starts gameplay
   */
  startButtonClick() {
    this.setLevel(this.firstLevelData);
    this.gameStartButton.disabled = true;

    this.reset(this.firstLevelData);
    this.init();

    this.startGameplay(true);
  }
  


  /**
   * Toggles the master volume for the soundManager, and saves the preference to storage
   */
  soundButtonClick() {
    console.log('sound button clicked')
    let newVolume;
    if (this.previousVolume) { 
      if (this.soundVolume === 0) {
        newVolume = this.previousVolume;
      } else {
        newVolume = 0;
        this.previousVolume = this.soundVolume;
      }
    } else {
      this.previousVolume = this.soundVolume;
      newVolume = this.savedVolume === 0 ? 1 : 0;
    }
    this.savedVolume = newVolume;
    this.soundManager.setMasterVolume(newVolume);
    this.soundManager.setMusicVolume(newVolume);
    if (this.soundManager.musicPlaying) {
      this.soundManager.pauseMusic();
      this.musicPaused = true;
    } else {
      if (this.musicPaused) {
        this.soundManager.resumeMusic();
        this.musicPaused = false;
      } else {
        this.soundManager.setMusic(`music/phonk${this.level}`, true);
      }
    }
    localStorage.setItem('volumePreference', newVolume);
    this.setSoundButtonIcon();
    this.setPauseButtonIcon();
  }

  pauseButtonClick() {
    // check if music is playing
    const musicPaused = localStorage.getItem('musicPaused') || 'false';
    if (musicPaused === 'false') {
      this.soundManager.pauseMusic(false);
    } else {
      this.soundManager.resumeMusic();
    }
    this.setPauseButtonIcon();
  }

  setVolume() {
    console.log('setting master volume to', this.savedVolume)
    this.soundManager.setMasterVolume(this.savedVolume);
    this.soundManager.setMusicVolume(this.savedVolume);

    localStorage.setItem('volumePreference', this.savedVolume);
    this.setSoundButtonIcon();
  }

  /**
   * Sets the icon for the sound button
   */
  setSoundButtonIcon() {
    if (document.getElementById('header-buttons')) document.getElementById('header-buttons').style.visibility = 'visible';
    const iconSrc = this.savedVolume === 0 ? '/style/graphics/volume_off.webp' : '/style/graphics/volume_on.webp';
    this.volumeIcon.src = iconSrc;
  }

  setPauseButtonIcon(start) {
    const musicPaused = localStorage.getItem('musicPaused');
    if (!musicPaused) localStorage.setItem('musicPaused', 'false');
    let iconSrc;
    if (musicPaused === 'true') {
      iconSrc = '/style/graphics/sound_play.webp';
    } else {
      iconSrc = '/style/graphics/sound_pause.webp';
    }
    console.log('setting pause icon to', iconSrc, 'because music paused is', musicPaused)
    this.pauseIcon.src = iconSrc;
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

  async preloadOnomatAssets() {
    // preload onomatopoeia elements
    const onomatBase = '/style/graphics/onomatopoeia/';
    const onomatTypes = {
      'attack': [`${onomatBase}attack+1.webp`, `${onomatBase}attack+2.webp`, `${onomatBase}attack+3.webp`],
      'hit': [`${onomatBase}normal_attack.webp`],
      'newLife': [`${onomatBase}1up.webp`],
      'crit': [`${onomatBase}critical_attack.webp`],
      'scared': [`${onomatBase}scared_attack.webp`],
      'scaredCrit': [`${onomatBase}scared_critical_attack.webp`],
      'eat': [`${onomatBase}eat.webp`],
      'gloUp': [`${onomatBase}gloup.webp`],
      'collat': [`${onomatBase}collateral.webp`],
      'chain': [`${onomatBase}chained.webp`, `${onomatBase}chainsmoked.webp`],
      'kill': [`${onomatBase}normal_kill_1.webp`, `${onomatBase}normal_kill_2.webp`, `${onomatBase}normal_kill_3.webp`, `${onomatBase}normal_kill_4.webp`],
      'scaredKill': [`${onomatBase}scared_attack.webp`],
      '$coin': [`${onomatBase}btc.webp`, `${onomatBase}btc100.webp`, `${onomatBase}atom.webp`, `${onomatBase}atom200.webp`, `${onomatBase}eth.webp`, `${onomatBase}eth300.webp`, `${onomatBase}sol.webp`, `${onomatBase}sol400.webp`]
    };
    const onomatSources = [].concat(...Object.values(onomatTypes));
    const onomatImages = await this.createGameElements(onomatSources, 'img');
    this.categorizeLoadedImages(onomatImages, onomatTypes);
  }

  categorizeLoadedImages(loadedImages, onomatTypes) {
    console.log('preloaded onomat images', loadedImages.map(img => img.src));
    const categorizedImages = {};
    Object.keys(onomatTypes).forEach(type => {
      const orderedImages = onomatTypes[type].map(path => {
        const fileName = path.split('/').pop(); // Get the filename part of the path
        return loadedImages.find(img => img.src.includes(fileName));
      });
      categorizedImages[type] = orderedImages;
    });
    this.onomatImages = categorizedImages;
    console.log('categorizedImages', categorizedImages); // Check how images are categorized now
  }
  

  /**
   * Load all assets into a hidden Div to pre-load them into memory.
   * There is probably a better way to read all of these file names.
   */
  preloadAssets() {
    this.gameUi.style.visibility = 'hidden';
    this.mainMenu.style.opacity = 1;
    this.mainMenu.style.visibility = 'visible';
    return new Promise((resolve) => {
      const loadingContainer = document.getElementById('loading-container');
      const loadingLuncman = document.getElementById('loading-luncman');
      console.log('loading luncman:', loadingLuncman)
      const loadingDotMask = document.getElementById('loading-dot-mask');

      this.preloadOnomatAssets();

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
        `${audioBase}power_up.mp3`,
        `${audioBase}extra_life.mp3`,
        `${audioBase}eat_fudder.mp3`,
        `${audioBase}death.mp3`,
        `${audioBase}fruit.mp3`,
        `${audioBase}dot_1.mp3`,
        `${audioBase}dot_2.mp3`,
        `${audioBase}attack.mp3`,
        `${audioBase}boost.mp3`,
        `${audioBase}superattack.mp3`,
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
            this.nameDisplay.innerText = window.client.gloInfo.username;

            
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
    console.log('creating game elements', sources)
    return new Promise((resolve, reject) => {
      let loadedSources = 0;
      let loadedElements = [];

      sources.forEach((source) => {
        let element;
        if (type === 'img') {
          element = new Image();
        } else if (type === 'audio') {
          element = new Audio();
        } else if (type === 'video') {
          element = document.createElement('video');
          console.log('set up video element')
        }

        const preloadDiv = document.getElementById('preload-div');
        preloadDiv.appendChild(element);
        console.error('readying elements')

        const elementReady = () => {
          console.log('calling elementReady')
          loadedSources += 1;
          console.log(`Loaded ${type}:`, source);

          loadedElements.push(element);

          if (loadedSources === sources.length) {
            console.log('returning loaded video')
            resolve(type === 'video' ? loadedElements[0] : loadedElements);
          }
        };
        console.log('random shit fuck it')

        if (type === 'img') {
          element.onload = elementReady;
          element.onerror = reject;
        } else if (type === 'video') {
          element.onloadeddata = elementReady;
          element.onerror = reject;
        } else if (type === 'audio') {
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
    this.lives = 0;
    this.fruitEaten = 0;
    this.extraLifeGiven = false;
    this.remainingDots = 0;
    this.allowKeyPresses = true;
    this.allowLuncmanMovement = false;
    this.cutscene = true;
    this.newHighscore = false;
    this.playAgain = false;
    this.gameStarted = false;
    this.fuddersKilled = 0;
    this.dotsEaten = 0;

    this.tileSize = 8;
    this.scale = this.determineScale(1, 31, 28);
    console.log('setting scaled tile size: tileSize', this.tileSize, '* scale', this.scale)
    this.scaledTileSize = this.tileSize * this.scale;
    console.log('scaled tile size:', this.scaledTileSize);

    this.highScore = window.client.gloInfo.highscore;
    this.highScoreDisplay.innerHTML = this.highScore || '00';
    
    setInterval(() => {
      this.collisionDetectionLoop();
    }, 500);

    if (this.luncman) {
      this.luncman.reset();
      this.luncman = null;
    }
    this.luncman = new Luncman(
      this.scaledTileSize,
      new CharacterUtil(this),
      levelData,
    );
    if (this.fudder1) {
      this.fudder1.reset();
      this.fudder1 = null;
    }
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
    if (this.fudder2) {
      this.fudder2.reset();
      this.fudder2 = null;
    }
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
    if (this.fudder3) {
      this.fudder3.reset();
      this.fudder3 = null;
    }
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
    if (this.fudder4) {
      this.fudder4.reset();
      this.fudder4 = null;
    }
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
    if (this.fruit) {
      this.fruit.reset();
      this.fruit = null;
    }
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

    this.entityList = [
      this.luncman,
      this.fruit,
      this.fudder1,
      this.fudder2,
      this.fudder3,
      this.fudder4
    ];

    this.fudders = [this.fudder1, this.fudder2, this.fudder3, this.fudder4];
    this.deadFudders = [];

    this.scaredFudders = [];
    this.eyeFudders = 0;

    this.drawMaze(this.mazeArray, this.entityList, levelData);
    this.soundManager = new SoundManager();

    this.savedVolume = parseFloat(localStorage.getItem('volumePreference')) || 0;
    this.setVolume();
    this.setSoundButtonIcon();
    this.setPauseButtonIcon(true);
    // this.pauseButton.src = '/style/graphics/sound_pause.webp';

    this.setUiDimensions();

    if (this.gameEngine) {
      this.gameEngine.restart();
    }

    this.pointsDisplay.innerHTML = '00';
    this.clearDisplay(this.fruitDisplay);

    const volumePreference = parseInt(
      localStorage.getItem('volumePreference') || 1,
      10,
    );
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

    if (this.isMobile) {
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
      nameDisplay.innerText = window.client.gloInfo.username;
      
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
              const points = block === 'o' ? 1 : 5;
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
    this.checkForUsername();
    console.log('starting gameplay, initial =', initialStart)
    this.soundManager.fetchingAmbience = false;
    this.soundManager.cutscene = false;
    const musicPaused = localStorage.getItem('musicPaused') || 'false';
    if (musicPaused === 'false') {
      this.soundManager.setMusic(`music/phonk${this.level}`, false);
    } else {
      this.soundManager.setMusic(`music/phonk${this.level}`, false);
      this.soundManager.pauseMusic(true);
    }
    console.log('set music to phonk', this.level)

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
    console.log('displaying ready text', 'duration:', duration, 'width:', width, 'height:', height, 'left:', left, 'top:', top)
    this.soundManager.play('ready');
    this.updateExtraLivesDisplay();

    new Timer(() => {
      this.mazeCover.style.visibility = 'hidden';
      new Timer(() => {
      this.cutscene = false;
      // this.soundManager.setCutscene(this.cutscene);
      //this.soundManager.setAmbience(this.determineSiren(this.remainingDots));
      this.soundManager.play('start');

      this.allowLuncmanMovement = true;
      this.luncman.moving = true;

      this.fudders.forEach((fudder) => {
        const fudderRef = fudder;
        fudderRef.moving = true;
      });

      this.fudderCycle('scatter');

      // determine the alive and idle fudders
      if (initialStart) {
        this.idleFudders = [this.fudder2, this.fudder3, this.fudder4];
        this.aliveFudders = [this.fudder1, this.fudder2, this.fudder3, this.fudder4];
      } else {
        this.fudders.forEach((fudder) => {
          if (!fudder.dead) {
            this.aliveFudders.push(fudder);
            if (fudder !== this.fudder1) {
              this.idleFudders.push(fudder);
            }
          }
        });
      }

      this.releaseFudder();
      this.createAbility();

      this.gameStarted = true;
      this.gameState.gameStarted = true;
      this.gameState.sendGameState();
      this.dead = false;

      this.startRecordingLuncmanHistory();
      this.startedRecordingPosition = true; // Prevent multiple recordings

      this.burnLunc();

      if (this.level === 1 && window.firstVisit && !this.tutorialPlayed) this.playTutorial();

      if (this.advancingLevel) {
        this.advancingLevel = false;
      }
      }, 0);
    }, duration);
  }

  burnLunc() {
    if (!this.gameStarted) return;
    if (this.points > 0) {
      if (this.level > 2) {
        this.points -= 2;
      } else {
        this.points -= 1;
      }
      this.pointsDisplay.innerText = this.points;
      if (this.points > (this.highScore || 0)) {
          this.highScore = this.points;
          this.highScoreDisplay.innerText = this.points;
      }
      console.log('removed', this.level, 'points from score')
    }
    setTimeout(() => {
      this.burnLunc();
    }, 1000);
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
        if (this.attackOnomat) {
          this.attackOnomat.removeOnomat();
          this.attackOnomat = null;
        }
        const abilityImageIndex = this.abilities.length - 1;
        this.attackOnomat = new Onomat('attack', abilityImageIndex);
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
          setTimeout(() => this.giveAbility(), 10);
        }
      }
  }

  resetAbilities() {
    // Iterate over the abilities array and call removeAbility() on each
    this.abilities.forEach(ability => ability.removeAbility());

    // Once all abilities are removed, reset the abilities array to an empty array
    this.abilities = [];
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
    // window.addEventListener('WalletConnected', () => this.handleWalletConnected());
    window.addEventListener('WalletDisconnected', this.handleWalletDisconnected(this));
    window.addEventListener('receivedPlayerNfts', this.handlePlayerNfts(this));

    window.addEventListener('sessionCreated', () => {
      this.checkForUsername(this);
      this.initGameState();
    });
    
    if (this.volumeSlider) this.volumeSlider.addEventListener('input', () => {
      this.savedVolume = this.volumeSlider.value;
      this.setVolume();
    });
    
    if (this.soundControl) this.soundControl.addEventListener('mouseenter', () => {
      this.toggleVolumeSlider();
    });
    
    if (this.soundControl) this.soundControl.addEventListener('mouseleave', () => {
      this.toggleVolumeSlider();
    });
    
    if (this.isMobile) {
      this.setupSwipeListeners();

      document.addEventListener('touchstart', this.handleTouchStart.bind(this));
      window.addEventListener('orientationchange', this.orientationChange.bind(this));
    }
  }

  toggleVolumeSlider() {
    this.volumeSlider.style.display = this.volumeSlider.style.display === 'none' ? 'block' : 'none';
  }
  
  changeDirection(direction) {
    if (this.isPanning && this.direction === direction) {
      return;  // If panning and the direction is the same as the current, do nothing
    }

    if (this.finalizingChain) return;
    
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
          // emit 'speedBoost' event
          window.dispatchEvent(new Event('speedBoost'));

          this.luncman.getSpeedBoost();
          if (this.luncman.moving) this.soundManager.play('dash');
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

  handlePlayerNfts() {
    if (window.client.activePlayer || !window.client.gloSession) return;

    if (!this.luncman) {
      setTimeout(() => {
        this.handlePlayerNfts();
      }, 100);
      return;
    }

    if (window.client.gloInfo.activeLuncman) {
      // preload the luncman game images
      // Extract all the image URLs from this.luncman.imageSources
      let imageUrls = [];
      for (let category in this.luncman.imageSources) {
        for (let direction in this.luncman.imageSources[category]) {
          imageUrls.push('/style/graphics/' + this.luncman.imageSources[category][direction]);
        }
      }

      // Preload the images
      this.createGameElements(imageUrls, 'img').then((loadedImages) => {
        console.log('All images loaded');
      }).catch((error) => {
        console.error('Error loading images:', error);
      });

      // set image sources
      this.luncman.setSpriteSheetSources();
    }

    if (window.client.gloInfo.activeVictory) {
      let imageUrls = [];
      imageUrls.push('/style/graphics' + window.client.gloInfo.activeVictory.metadata.mainImg);
      // Preload the images
      this.createGameElements(imageUrls, 'img').then((loadedImages) => {
        this.victoryImage = "style/graphics" + window.client.gloInfo.activeVictory.metadata.mainImg;
        console.log('All images loaded');
      }).catch((error) => {
        this.victoryImage = "/style/graphics/winning_screen.webp";
        console.error('Error loading images:', error);
      });
    } else {
      this.victoryImage = "/style/graphics/winning_screen.webp";
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
    switch (e.keyCode) {
      case 32:
        // Spacebar
        if (this.gameStarted) e.preventDefault();
        if (this.playingCutscene) {
          this.cutsceneHinted = true;
          this.skipCutscene();
        } else {
          this.useAbility();
        }
        break;
      default:
        if (this.movementKeys[e.keyCode]) {
          this.changeDirection(this.movementKeys[e.keyCode]);
        }
        break;
    }
  }

  /**
   * Handles behavior for the attack key
   */
  useAbility() {
    if (!this.gameStarted || this.luncman.attack || this.finalizingChain) {
      return;
    }
  
    if (this.luncman.attackCount > 0) {
      // Restart ability creation loop after reaching max amount
      if (this.luncman.attackCount === 3) {
        console.log('creating ability');
        this.createAbility();
      }

      if (this.attackOnomat) {
        this.attackOnomat.removeOnomat();
        this.attackOnomat = null;
        const abilityImageIndex = this.luncman.attackCount - 2;
        console.log('ability length', abilityImageIndex);
        this.attackOnomat = new Onomat('attack', abilityImageIndex);
      }

      // emit 'useAbility' event
      window.dispatchEvent(new Event('useAbility'));

      this.luncman.getAttack();
      this.updateGameState();

      this.gameState.playerStats.attacksUsed += 1;

      window.attackId = Math.random();

      // dispatch 'attacking' event
      window.dispatchEvent(new CustomEvent('attacking'));
      
      if (this.gloPilled) {
        this.soundManager.play('superattack');
      } else {
        this.soundManager.play('attack');
      }
  
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

  killFudder(e) {
    // Increment chain count
    this.chainCount++;

    this.fuddersKilled ++;
    this.gameState.playerStats.fuddersKilled ++;
    this.soundManager.play('fudderkill');

    // if window.attackCount is used twice in 

    // Add the killed Fudder to the deadFudders array
    const killedFudder = e?.detail.fudder;
    console.log('killed fudder', killedFudder)
    this.deadFudders.push(killedFudder);

    // If collateralTimer is not running, start it
    this.noCollateral = false;
    if (this.attackId !== window.attackId) {
      this.attackId = window.attackId;
      this.collateralCount = 1; // Start collateral count
      console.log('no collateral')
      this.collateralTimer = null;
      this.collateralCount = 0;
      this.noCollateral = true;
  
      if (!this.killFudderTimeout) {
        console.log('!this.killFudderTimeouT', this.noCollateral);
        setTimeout(() => {
          if (this.noCollateral) {
            console.log('normal kill');
            new Onomat('kill')
            let points;
            if (killedFudder.totalHealth === 250) {
              points = Math.round(( killedFudder.startHealth / killedFudder.totalHealth ) * 50);
            } else {
              points = Math.round(( killedFudder.startHealth / killedFudder.totalHealth ) * 25);
            }
            
            window.dispatchEvent(
              new CustomEvent('awardPoints', {
                detail: {
                  points: points,
                },
              }),
            );
          };
          this.killFudderTimeout = setTimeout(() => {
            console.log('Timeout started');
            this.finalizeChain(this.chainCount);
            // Reset chain count
  
            this.killFudderTimeout = null;
            console.log('First timeout ended'); // Log when the first timeout ends
          }, 1500);
        }, 150);
        } else {
            clearTimeout(this.killFudderTimeout);
            this.killFudderTimeout = setTimeout(() => {
              console.log('Timeout started');
              this.finalizeChain(this.chainCount);
              // Reset chain count

              this.killFudderTimeout = null;
              console.log('Second timeout ended'); // Log when the second timeout ends
            }, 1500);
            this.changeSpeed(1000, 0.15);
            new Onomat('chain');
            window.dispatchEvent(
              new CustomEvent('awardPoints', {
                detail: {
                  points: 100,
                },
              }),
            );
            this.soundManager.play('chainkill', true);
        }
    
        if (this.deadFudders.length === this.fudders.length) {
          console.log('advancing level: dead fudders', this.deadFudders.length, '= fudders', this.fudders.length)
          this.deadFudders = []; // reset the dead fudders list
          this.advanceLevel();
          return;
        }
    } else {
      console.log('collateral')
        // Collateral in progress, increment count
        this.noCollateral = false;
        this.collateralCount++;
        // Finalize as a collateral kill if no further kills
        this.finalizeCollateral(this.collateralCount);

        if (this.deadFudders.length === this.fudders.length) {
          console.log('advancing level: dead fudders', this.deadFudders.length, '= fudders', this.fudders.length)
          this.deadFudders = []; // reset the dead fudders list
          this.advanceLevel();
          return;
        }
    }
  }

  finalizeChain(count) {
    if (!this.gameStarted) {
      window.removeEventListener('speedBoost', this.speedBoostHandler);
      window.removeEventListener('useAbility', this.useAbilityHandler);
      this.resetSpeed();
      return;
    }
    console.log('You chained', count, 'fudders!')
    let finalizingChainTimer;

    switch (count) {
      case 1:
        
        break;
      case 2:
        break;
      case 3:
        break;
      case 4:
        break;
      default:
        console.log('Cheating or some shit idk');
        break;
    }

    this.chainCount = 0;

    window.removeEventListener('speedBoost', this.speedBoostHandler);
    window.removeEventListener('useAbility', this.useAbilityHandler);
  }

  finalizeCollateral(collateralCount) {
    // Logic to handle the collateral, based on collateralCount
    console.log(`Collateral of ${collateralCount} Fudders!`);
    setTimeout(() => {
      new Onomat('collat')
      let points = 100 * collateralCount;
      window.dispatchEvent(
        new CustomEvent('awardPoints', {
          detail: {
            points: points,
          },
        }),
      );
      this.soundManager.play('collateral', true)
      this.changeSpeed(1000, 0.15)
      setTimeout(() => {
        // Reset collateral count
        this.collateralCount = 0;
      }, 350);
    }, 50)
    // Additional logic to handle rewards or effects based on collateralCount
    // ...
  }

  changeSpeed(duration, speedPercent) {
    if (!this.changingSpeed) {
      this.changingSpeed = true;
      setTimeout(() => {
        this.changingSpeed = false;
      }, duration);
    } else {
      return;
    }
    window.removeEventListener('speedBoost', this.speedBoostHandler);
    window.removeEventListener('useAbility', this.useAbilityHandler);

    // create event listener for 'speedBoost' and 'useAbility' window events
    // if either of these events are emitted, change speed back to normal
    this.speedBoostHandler = () => {
      clearTimeout(this.killFudderTimeout);
      this.resetSpeed();
      this.killFudderTimeout = setTimeout(() => {
        console.log('Timeout started');
        this.finalizeChain(this.chainCount);

        this.killFudderTimeout = null;
        console.log('Second timeout ended'); // Log when the second timeout ends
      }, 2500);
      window.removeEventListener('speedBoost', this.speedBoostHandler);
      window.removeEventListener('useAbility', this.useAbilityHandler);
    };

    this.useAbilityHandler = () => {
      if (this.abilities.length === 0) return;
      clearTimeout(this.killFudderTimeout);
      this.resetSpeed();
      this.killFudderTimeout = setTimeout(() => {
        console.log('Timeout started');
        this.finalizeChain(this.chainCount);

        this.killFudderTimeout = null;
        console.log('Second timeout ended'); // Log when the second timeout ends
      }, 2500);
      window.removeEventListener('speedBoost', this.speedBoostHandler);
      window.removeEventListener('useAbility', this.useAbilityHandler);
    };

    window.addEventListener('speedBoost', this.speedBoostHandler);
    window.addEventListener('useAbility', this.useAbilityHandler);

    setTimeout(() => {
      if (this.speedBoostHandler) {
        window.removeEventListener('speedBoost', this.speedBoostHandler);
      }

      if (this.useAbilityHandler) {
        window.removeEventListener('useAbility', this.useAbilityHandler);
      }
    }, duration)

    this.gameEngine.changeSpeed(duration, speedPercent)
    this.luncman.setSpeedFactor(duration, speedPercent)
    this.fudders.forEach((fudder) => {
      if (!fudder.dead) {
        fudder.setSpeedFactor(duration, speedPercent)
      }
    })
  }

  resetSpeed() {
    if (this.gameEngine) this.gameEngine.resetSpeed();
    if (this.luncman) this.luncman.resetSpeedFactor();
    if (this.fudders) {
        this.fudders.forEach((fudder) => {
        if (!fudder.dead) {
          fudder.resetSpeedFactor();
        }
      });
    }
  }

  startRecordingLuncmanHistory() {
    this.positionHistoryEnabled = true;
    // Clear previous history
    this.luncmanPositionHistory = [];
  }

  stopRecordingLuncmanHistory() {
    this.positionHistoryEnabled = false;
  }

  updateLuncmanPositionHistory() {
    if (!this.positionHistoryEnabled || !this.luncman.animationTarget.style.left || !this.luncman.animationTarget.style.top) return;

    // Fetch Luncman's element by ID and get its current position
    const currentPosition = {
        x: parseFloat(this.luncman.animationTarget.style.left), // Correct X coordinate
        y: parseFloat(this.luncman.animationTarget.style.top), // Correct Y coordinate
        timestamp: Date.now()
    };
    this.luncmanPositionHistory.push(currentPosition);

    // Ensure the history doesn't grow indefinitely
    if (this.luncmanPositionHistory.length > this.historySizeLimit) {
        this.luncmanPositionHistory.shift(); // Remove oldest records
    }
  }

  getLuncmanPositionFromHistory(msAgo) {
    const targetTime = Date.now() - msAgo;
    // Return the closest position by time
    return this.luncmanPositionHistory.reduce((prev, curr) => 
      Math.abs(curr.timestamp - targetTime) < Math.abs(prev.timestamp - targetTime) ? curr : prev, 
      this.luncmanPositionHistory[0] || null
    );
  }

  update() {
    this.updateLuncmanPositionHistory();
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

    if (this.points >= 1500 && !this.extraLifeGiven) {
        new Onomat('newLife');
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
        const width = e.detail.points >= 1000 ? this.scaledTileSize * 3 : this.scaledTileSize * 2;
        const height = this.scaledTileSize;

        let fruitType = e.detail.fruitType;
        if (fruitType && this.gameState.playerStats.fruitCollected.hasOwnProperty(fruitType)) {
            this.gameState.playerStats.fruitCollected[fruitType] += 1;
        }

        // this.displayText({ left, top }, e.detail.points, 2000, width, height);
        this.soundManager.play('fruit');
        this.updateFruitDisplay(
            this.fruit.determineImage('fruit', e.detail.points),
        );

        // Determine the image index for the $coin based on fruitType
        const coinImageIndex = this.determineCoinImageIndex(fruitType);

        // Create a new Onomat instance with the $coin type and determined image index
        new Onomat('$coin', coinImageIndex);
    }
  }

  /**
   * Determines the image index for $coin based on fruit type.
   * @param {string} fruitType - The type of the fruit.
   * @returns {number} The image index for the $coin.
   */
  determineCoinImageIndex(fruitType) {
      const fruitTypes = {
          'bitcoin': 0,
          'atom': 2,
          'eth': 4,
          'solana': 6
      };
      console.log('determined coin image index for', fruitType, 'to be', fruitTypes[fruitType] || 0);
      return fruitTypes[fruitType] || 0; // Default to 0 if fruitType is not found
  }


  /**
   * Animates Luncman's death, subtracts a life, and resets character positions if
   * the player has remaining lives.
   */
  deathSequence() {
    this.gameStarted = false;
    this.cutscene = true;
    this.dead = true;
    this.soundManager.setCutscene(this.cutscene);
    this.soundManager.stopAmbience();
    this.removeTimer({ detail: { timer: this.fruitTimer } });
    this.removeTimer({ detail: { timer: this.fudderCycleTimer } });
    this.removeTimer({ detail: { timer: this.endIdleTimer } });
    this.removeTimer({ detail: { timer: this.fudderFlashTimer } });

    this.stopRecordingLuncmanHistory();
    this.startedRecordingPosition = false; // Prevent multiple recordings

    this.gameState.playerStats.deaths += 1;

    if (this.attackOnomat) {
      this.attackOnomat.removeOnomat();
      this.attackOnomat = null;
    }
  
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
            this.resetAbilities();
  
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

    this.gameState.playerStats = {
      username: window.client.gloInfo.username,
      address: window.client.gloInfo.walletID,
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
  gameOver(victory) {
    this.soundManager.stopMusic();
    window.glogo.disabled = false;

    if (victory) {
      this.updatePlayerStats();

      this.playOutro();
      // const winningScreen = new WinningScreen(this.points);
    } else {
      new Timer(() => {
        this.displayText(
          {
            left: this.scaledTileSize * 9,
            top: this.scaledTileSize * 16.5,
          },
          'game_over',
          4000,
          this.scaledTileSize * 10,
          this.scaledTileSize,
        );
        this.soundManager.play('gameover');
        this.fruit.hideFruit();
        
        // Remove all abilities.
        this.abilities.forEach((ability) => {
        ability.removeAbility();
        });
        // Reset the abilities array.
        this.resetAbilities();
  
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
  
          setTimeout(() => {
            new WinningScreen(this.points);
          }, 1000);
        }, 2500);
      }, 2250);
    }
  }

  /**
   * Handle events related to the number of remaining dots
   */
  dotEaten() {
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
    if (this.abilities) {
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

  // /**
  //  * Determines the correct siren ambience
  //  * @param {Number} remainingDots
  //  * @returns {String}
  //  */
  // determineSiren(remainingDots) {
  //   let sirenNum;

  //   if (remainingDots > 40) {
  //     sirenNum = 1;
  //   } else if (remainingDots > 20) {
  //     sirenNum = 2;
  //   } else {
  //     sirenNum = 3;
  //   }

  //   return `siren_${sirenNum}`;
  // }

  /**
   * Handles cutscene logic
   */
  async setCutscene(levelData, cutscene) {
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
    this.levelData = levelData;
    this.originalCutscenes = [...levelData.loadedCutscenes];
    console.log('setting cutscene', levelData);
    if (this.isMobile) {
      this.cutscenes = levelData.loadedCutscenes.filter(img => img.src.includes('mobile_cutscenes'));
    } else {
      this.cutscenes = levelData.loadedCutscenes.filter(img => img.src.includes('cutscenes'));
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
    this.cutsceneDiv.style.zIndex = '2';
    this.contentContainer.appendChild(this.cutsceneDiv);
  
    this.cutsceneContainer = document.createElement('div');
    this.cutsceneContainer.style.display = 'flex';
    this.cutsceneContainer.style.flexDirection = 'column';
    this.cutsceneContainer.style.justifyContent = 'center';
    this.cutsceneContainer.style.alignItems = 'center';
    this.cutsceneDiv.appendChild(this.cutsceneContainer);
  
    this.cutsceneImg = document.createElement('img');
    this.cutsceneContainer.appendChild(this.cutsceneImg);
  
    this.cutsceneText = document.createElement('div');
    this.cutsceneText.id = 'cutSceneText';
    this.cutsceneText.style.display = 'flex';
    this.cutsceneText.style.opacity = '0';
    this.cutsceneText.style.flexDirection = 'column';
    this.cutsceneText.style.alignItems = 'center';
    this.cutsceneText.style.justifyContent = 'center';
    this.cutsceneText.style.color = 'black';
    this.cutsceneText.style.textAlign = 'center';
    this.cutsceneText.style.zIndex = '1';
    if (this.isMobile) {
      this.cutsceneText.style.width = '70vw';
      this.cutsceneText.style.fontSize = '1.5em';
    } else {
      this.cutsceneText.style.width = '40vw';
      this.cutsceneText.style.fontSize = '1vw';
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

    //new ish
    this.cutsceneTextLabel = document.createElement('span');
    this.cutsceneTextLabel.id = 'cutSceneTextLabel';
    this.cutsceneTextLabel.innerText = '-- PRESS SPACE TO SKIP --';
    this.cutsceneTextLabel.style.fontSize = '0.75em';
    this.cutsceneTextLabel.style.color = 'white';
    this.cutsceneTextLabel.style.top = '97.5%';
    this.cutsceneTextLabel.style.zIndex = '1';
    this.cutsceneTextLabel.style.opacity = '0.6';
    this.cutsceneTextLabel.style.position = 'absolute';
    this.cutsceneTextLabel.style.display = 'none';
    this.cutsceneContainer.appendChild(this.cutsceneTextLabel);

    let flashInterval = setInterval(() => {
      if (this.cutsceneHinted) {
        clearInterval(flashInterval);
        this.cutsceneTextLabel.style.display = 'none';
      } else {
        this.cutsceneTextLabel.style.display = this.cutsceneTextLabel.style.display === 'none' ? '' : 'none';
      }
    }, 650);
  
    this.currentCutsceneIndex = 0;
  
    if (cutscene) {
      this.playCutscene(levelData);
    } else {
      this.openCurtain(levelData);
    }
    
    // hide main menu
    this.leftCover.style.visibility = 'hidden';
    this.rightCover.style.visibility = 'hidden';
    this.luncmanDiv.style.visibility = 'hidden';
    this.mainMenu.style.opacity = 0;
  }

  openCurtain(levelData) {
    // Check if the curtain image is loaded
    const curtainImage = this.curtainVideo[0];
    console.log('setting curtain', this.curtainVideo)
    if (!curtainImage) {
      console.error('Curtain image not loaded');
      return;
    }

    this.cutsceneImg.style.display = 'none';

    // Append the video to the cutsceneDiv
    this.cutsceneDiv.appendChild(this.introVideo);

    // The videos should not loop
    this.introVideo.loop = false;
    this.introVideo.style.height = '70%';
    this.introVideo.style.position = 'absolute';
    this.introVideo.style.display = 'flex';

    console.log('playing curtain video');

    // Create a SpriteSheet for the curtain
    const curtainSprite = new SpriteSheet({
      src: curtainImage.src,
      parent: this.cutsceneDiv,
      frameWidth: 384, // replace with the width of a single frame
      frameHeight: 216, // replace with the height of a single frame
      frameCount: 15, // replace with the number of frames
      framesPerRow: 15, // replace with the number of frames per row
      fps: 10, // replace with the desired FPS
      loop: false, // replace with whether the animation should loop
      onFinished: this.playIntro.bind(this, levelData), // call playIntro when the animation finishes
      reverse: true // play the animation in reverse
    });
    curtainSprite.canvas.id = 'curtain-video';
    curtainSprite.canvas.style.position = 'absolute';
    curtainSprite.canvas.style.width = '100%';
    curtainSprite.canvas.style.height = '100%';
    this.cutsceneDiv.appendChild(curtainSprite.canvas);
  
    // Start the curtain animation
    curtainSprite.start();
  }

  playIntro(levelData) {
    if (levelData.level !== 1) {
      this.playCutscene(levelData);
      return;
    }
    // Check if the intro video is loaded
    if (!this.introVideo) {
      console.error('Intro video not loaded');
      return;
    }
    this.playingCutscene = true;

    console.log('playing intro');

    // Play the video
    this.introVideo.play();

    // When the video ends, remove it and call playCutscene
    this.introVideo.addEventListener('ended', () => {
      this.introVideo.remove();
      this.playCutscene(levelData);
    });
  }

  playCutscene(levelData) {
    console.log('playing cutscenes from:', levelData);
    this.introVideo.style.display = 'none';
    if (levelData.loadedCutscenes && levelData.loadedCutscenes.length > 0) {
      this.cutsceneText.style.opacity = '1';
      this.playingCutscene = true;
      const cutsceneImg = levelData.loadedCutscenes.shift(); // Get and remove the first cutscene
      this.cutsceneImg.replaceWith(cutsceneImg); // Replace the old img element with the preloaded one
      this.cutsceneImg = cutsceneImg; // Update the reference to the new img element
      this.cutsceneImg.style.height = '60%';
      this.cutsceneImg.style.position = 'relative';
      this.cutsceneImg.style.top = '5%';
      this.cutsceneImg.style.objectFit = 'contain';
      
      const cutsceneTextKey = cutsceneImg.src.split('/').pop().split('.')[0]; // Extract the cutscene key from the filename
      console.log('cutsceneTextKey:', cutsceneTextKey);
      console.log('cutsceneText:', levelData.assets.cutsceneText[cutsceneTextKey]);
      this.cutsceneText.innerHTML = levelData.assets.cutsceneText[cutsceneTextKey];
    } else {
      this.playingCutscene = false;
      this.cutsceneDiv.remove();
      this.levelData.loadedCutscenes = [...this.originalCutscenes];
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
      setTimeout(() => {
        this.playCutscene(this.levelData);
      }, 25);
    }
  }

  playOutro() {
    if (!this.outroVideo) {
      console.log('Outro video not loaded');
      return;
    }

    // Create a new div element
    const blackBackground = document.createElement('div');
    this.contentContainer.appendChild(blackBackground);

    // Set the div to take up the full width and height of the screen and have a black background
    blackBackground.style.width = '100%';
    blackBackground.style.height = '100%';
    blackBackground.style.backgroundColor = 'black';
    blackBackground.style.position = 'absolute';
    blackBackground.style.zIndex = '2';

    // Append the div to the body of the document

    // Set the video to take up the full height of the screen and allow overlap on the sides
    this.contentContainer.appendChild(this.outroVideo)
    this.outroVideo.style.height = '100%';
    this.outroVideo.style.width = '100%';
    this.outroVideo.style.zIndex = '2';
    this.outroVideo.style.position = 'absolute';

    // Set the video to start playing immediately
    this.outroVideo.autoplay = true;

    // After 2 seconds, remove the video and the black background from the document and create a new WinningScreen
    setTimeout(() => {
      this.outroVideo.remove();
      blackBackground.remove();
      window.winningScreen = new WinningScreen(this.points);
    }, 2000); // 2000 milliseconds = 2 seconds
  }

  async loadOutro() {
    const outroVideoUrl = 'levels/level_4/cutscenes/5s1.webp';
    this.outroVideo = (await this.createGameElements([outroVideoUrl], 'img'))[0];
  }

  /**
   * Load the next level
   */
  async loadLevel(levelNumber) {
    if (levelNumber === 0) {
      this.loadOutro();
      return;
    }
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

        const loadedImages = await this.createGameElements(assetSources, 'img');

        // Store the loaded images in level.assets
        levelData.assets.loadedImages = loadedImages;

        console.log('all cutscenes:', levelData.assets.cutscenes);
        const cutsceneSources = [];

        for (const cutsceneKey in levelData.assets.cutscenes) {
          if (this.isMobile) {
            cutsceneSources.push(`${imgBase}mobile_cutscenes/${levelData.assets.mobileCutscenes[cutsceneKey]}.webp`);
          } else {
            cutsceneSources.push(`${imgBase}cutscenes/${levelData.assets.cutscenes[cutsceneKey]}.webp`);
          }
          console.log('loading cutscene:', levelData.assets.cutscenes[cutsceneKey]);
        }

        const loadedCutscenesArray = await this.createGameElements(cutsceneSources, 'img');

        // Sort the loaded cutscenes based on the order number in the src attribute
        const loadedCutscenes = loadedCutscenesArray.sort((a, b) => {
          const aOrder = a.src.charAt(a.src.length - 6); // Get the character before '.webp'
          const bOrder = b.src.charAt(b.src.length - 6); // Get the character before '.webp'
          return aOrder - bOrder;
        });

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
          assets: levelData.assets,
          loadedCutscenes: loadedCutscenes
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
      this.backgroundImageElement.style.backgroundSize = '155%';
      this.backgroundImageElement.style.backgroundPosition = 'center';
      this.backgroundImageElement.style.position = 'absolute';
      this.backgroundImageElement.style.zIndex = '0';
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

    this.level = this.levelData.level;

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

    this.attackOnomat.removeOnomat();
    this.attackOnomat = null;

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
                    this.resetAbilities();
                    //handle beating all levels
                    if (this.nextLevel === 0) {
                      this.gameOver(true);
                      return
                    }

                    const nextLevelData = this.loadedLevels[this.nextLevel];
                    if (nextLevelData) {
                      this.levelData = nextLevelData;
                      console.log('setting level to:', nextLevelData)
                      this.setCutscene(nextLevelData, true);
                    } else {
                      this.loadLevel(this.nextLevel).then(levelData => {
                        this.levelData = levelData;
                        console.log('loaded level and now setting to:', levelData)
                        this.setCutscene(levelData, true)
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
    this.checkForUsername();

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

    this.luncman.setScaredSpriteSheet();
    console.log('setscaredspritesheet');
    
    new Onomat('gloUp')

    if (this.remainingDots !== 0) {
      // this.soundManager.setAmbience('power_up');
         this.soundManager.play('luna');
    }

    this.removeTimer({ detail: { timer: this.fudderFlashTimer } });

    this.fudderCombo = 0;
    this.scaredFudders = [];
    this.gloPilled = true;

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
      this.gloPilled = false;
    }, 6000); 
  }

  /**
   * Determines the quantity of points to give based on the current combo
   */
  determineComboPoints() {
    let comboPoints;
    switch (this.fudderCombo) {
      case 1:
        comboPoints = 5;
        break;
      case 2:
        comboPoints = 25;
        break;
      case 3:
        comboPoints = 50;
      break;
      case 4:
        comboPoints = 200;
        break;
        default:
        comboPoints = 5;
        break;
    }
    return comboPoints;
  }

  /**
   * Upon eating a fudder, award points and temporarily pause movement
   * @param {CustomEvent} e - Contains a target fudder object
   */
  eatFudder(e) {
    const pauseDuration = 1000;
    const { position, measurement } = e.detail.fudder;

    new Onomat('eat');
    e.detail.fudder.reduceHealth(10);

    this.pauseTimer({ detail: { timer: this.fudderFlashTimer } });
    this.pauseTimer({ detail: { timer: this.fudderCycleTimer } });
    this.pauseTimer({ detail: { timer: this.fruitTimer } });
    this.soundManager.play('luncpill');

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
    // this.displayText(position, comboPoints, pauseDuration, measurement);
    new Onomat('+25');

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
      // this.soundManager.setAmbience('eyes');

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
      // this.soundManager.setAmbience(sound);
    }
  }

  playTutorial() {
    const tutDiv = document.createElement('div');
    tutDiv.style.position = 'absolute';
    tutDiv.style.top = `${this.scaledTileSize * 23.5}px`;
    tutDiv.style.transform = 'translate(-50%, -50%)';
    tutDiv.style.left = '50%';
    tutDiv.style.zIndex = 2;
    this.mazeDiv.appendChild(tutDiv);

    const tutorialImages = ['tut1.webp', 'tut2.webp', 'tut3.webp', 'tut4.webp', 'tut5.webp'];
    let currentIndex = 0;

    const displayImage = () => {
      if (currentIndex >= tutorialImages.length) {
        this.tutPlayed = true;
        return;
      }

      const img = document.createElement('img');
      img.src = `/style/graphics/tutorial/${tutorialImages[currentIndex]}`;
      img.style.height = `${this.scaledTileSize * 1.5}px`;
      img.style.width = 'auto';
      img.style.opacity = '0';
      tutDiv.appendChild(img);

      gsap.fromTo(img, {opacity: 0}, {opacity: 1, duration: 0.5}); // fade in

      setTimeout(() => {
        gsap.fromTo(img, {opacity: 1}, {opacity: 0, duration: 0.5, // fade out
          onComplete: () => {
            tutDiv.removeChild(img);
            currentIndex++;
            setTimeout(displayImage, 1000); // delay before next image
          }
        });
      }, 2500); // display time
    };

    displayImage();
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
    pointsDiv.style.height = `${height}px`;
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
    // if (finalscore < 1000) {
    //   this.showLoser();
    //   return;
    // }
    if (!window.client.gloSession && !window.client.gloInfo.walletID.startsWith('terra')) return;
    fetch('/fakeWin', {
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
        if (typeof sa_event === 'function') sa_event("won_glochip");
        if (data.tokenId) {
          this.glochipType = data.tokenId.split('_')[1] + ' glochip';
        } else {
          this.glochipType = null;
        }
        setTimeout(() => {
            // resultDiv.innerHTML = `You Won: ${data.result === 'win' ? 'Yes' : 'No'}<br>Percentile: ${data.percentile.toFixed(2)}%`;
            const loadingSpinner = document.getElementById('loadingSpinner');
            const awaitText = document.getElementById('awaitText');
            if (loadingSpinner) loadingSpinner.style.display = 'none';
            if (awaitText) awaitText.style.display = 'none';
            this.loadFinalResult(data.result, data.percentile);
        }, 2000);  // Wait for 2 seconds before updating the result
    })
    .catch(error => {
        console.error('Error:', error);
    });
  }

  loadFinalResult(result, percentile) {
    console.log('loading final result', percentile);
    const resultImg = document.getElementById('resultImg');
    if (resultImg) {
      resultImg.style.height = '25%';
      resultImg.style.position = 'absolute';
      resultImg.style.left = '10%';
      resultImg.style.top = '5%';
      if (result === 'win'){
        resultImg.src = '/style/graphics/yescheck.webp';
      } else {
        resultImg.src = '/style/graphics/nox.webp';
      }
    }
    const resultBool = document.getElementById('resultBool');
    if (resultBool) {
      resultBool.style.color = 'white';
      resultBool.style.position = 'absolute';
      resultBool.style.right = '10%';
      resultBool.style.top = '15%';
      resultBool.style.fontSize = '150%';
    }
    if(result === 'win'){
      if (resultBool) resultBool.innerText = 'YOU WON';
    } else {
      if (resultBool) resultBool.innerText = 'YOU LOST'
    }
    const resultPerformance = document.getElementById('resultPerformance');
    if (resultPerformance) {
      if (percentile === 100) {
        resultPerformance.innerText = 'New Top Highscore!';
        resultPerformance.style.color = 'gold';
        resultPerformance.style.fontSize = '150%';
        resultPerformance.style.fontWeight = 'bold';
      } else {
        resultPerformance.innerText = `${percentile.toFixed(2)}% Performance`;
        resultPerformance.style.color = 'white';
      }
      resultPerformance.style.position = 'absolute';
      resultPerformance.style.top = '42.5%';
      resultPerformance.style.left = '50%';
      resultPerformance.style.transform = 'translateX(-50%)';
    }
    if (result === 'win' && this.glochipType!=null) {
      const resultClaim = document.getElementById('resultClaim');
      if (resultClaim) {
        resultClaim.style.display = 'flex';
        resultClaim.style.position = 'relative';
        resultClaim.style.top = '65%';
        resultClaim.innerText = 'CLAIM';
        resultClaim.addEventListener('click', this.loadResultSpinner.bind(this));
      }
    }
  }

  showLoser() {
    const loadingSpinner = document.getElementById('loadingSpinner');
    if (loadingSpinner) loadingSpinner.style.display = 'none';

    const awaitText = document.getElementById('awaitText');
    if (awaitText) awaitText.style.display = 'none';
    
    const resultImg = document.getElementById('resultImg');
    if (resultImg) {
      resultImg.style.height = '25%';
      resultImg.style.position = 'absolute';
      resultImg.style.left = '10%';
      resultImg.style.top = '5%';
      resultImg.src = '/style/graphics/nox.webp';
    }

    const resultBool = document.getElementById('resultBool');
    if (resultBool) {
      resultBool.style.color = 'white';
      resultBool.style.position = 'absolute';
      resultBool.style.right = '10%';
      resultBool.style.top = '15%';
      resultBool.style.fontSize = '150%';
      resultBool.innerText = 'YOU LOST';
    }

    const resultPerformance = document.getElementById('resultPerformance');
    if (resultPerformance) {
      resultPerformance.innerText = 'Score Too Low';
      resultPerformance.style.color = 'white';
      resultPerformance.style.position = 'absolute';
      resultPerformance.style.top = '42.5%';
      resultPerformance.style.left = '50%';
      resultPerformance.style.transform = 'translateX(-50%)';
    }
  }

  loadResultSpinner() {
    console.log('loading result spinner')
    document.getElementById('resultClaim').style.visibility = 'hidden';
    const oldResult = document.getElementsByClassName('result-spinner-container')
    if (oldResult.length > 0) {
      oldResult.forEach((result) => {
        result.remove();
      });
    }
    const container = document.createElement('div');
    container.className = 'result-spinner-container';
    document.body.appendChild(container);
    Object.assign(container.style, {
      display: 'grid',
      placeItems: 'center',
      height: '35vh',
      background: 'linear-gradient(to right, rgb(213 127 127), rgb(231 228 134), rgb(234 145 145))',
      fontFamily: 'Helvetica, sans-serif',
      position: 'absolute',
      zIndex: '2',
      left: '50%',
      top: '30%',
      transform: 'translateX(-50%)',
      borderRadius: '20px',
      border: '5px solid black',
    });
  
    const spinnerContainer = document.createElement('div');
    spinnerContainer.className = 'spinner';
    spinnerContainer.id = 'spinnerContainer';
    container.appendChild(spinnerContainer);
    Object.assign(spinnerContainer.style, {
      position: 'relative',
      overflowX: 'hidden',
      backgroundColor: 'white',
      boxShadow: '0px 5px 7px -2px rgba(0, 0, 0, 0.4)',
      borderRadius: '5px',
      maxWidth: '610px',
      minWidth: '610px',
      borderTop: '5px solid black',
      borderBottom: '5px solid black',
      height: '125px'
    });
  
    const spinnerList = document.createElement('ul');
    spinnerList.className = 'spinner-items';
    spinnerList.id = 'spinnerList';
    spinnerContainer.appendChild(spinnerList);
    Object.assign(spinnerList.style, {
      position: 'relative',
      display: 'inline-flex',
      margin: '0',
      padding: '0',
      marginLeft: '-246px',
    });
  
    const emojis = ['esoteric_glochip_preview.webp', 'generic_glochip_preview.webp', 'spectral_glochip_preview.webp', 'esoteric_glochip_preview.webp', 'generic_glochip_preview.webp', 'spectral_glochip_preview.webp', 'esoteric_glochip_preview.webp', 'generic_glochip_preview.webp', 'spectral_glochip_preview.webp'];
    emojis.forEach((emoji, index) => {
      const item = document.createElement('li');
      item.className = 'spinner-items__item';
      item.id = `item${index}`;
  
      const img = document.createElement('img');
      img.src = `/style/graphics/token_images/glochips/${emoji}`;
      img.width = 125; // set the width
      img.height = 125; // set the height
      item.appendChild(img);
  
      spinnerList.appendChild(item);
  
      let backgroundColor;
      switch (emoji) {
        case 'generic_glochip_preview.webp':
          backgroundColor = '#c5cbd1';
          break;
        case 'esoteric_glochip_preview.webp':
          backgroundColor = '#b19d06';
          break;
        case 'spectral_glochip_preview.webp':
          backgroundColor = '#7718c5';
          break;
        default:
          backgroundColor = 'transparent';
      }
  
      Object.assign(item.style, {
        display: 'block',
        listStyleType: 'none',
        fontSize: '32px',
        color: '#c2c2c2',
        borderLeft: '5px solid black',
        width: '134px',
        maxWidth: '134px',
        overflow: 'hidden',
        textAlign: 'center',
        backgroundColor: backgroundColor,
      });
    });
  
    // const emojis = ['🐶', '🐷', '🐸', '🐶', '🐷', '🐸', '🐶', '🐷', '🐸'];
    // emojis.forEach((emoji, index) => {
    //   const item = document.createElement('li');
    //   item.className = 'spinner-items__item';
    //   item.id = `item${index}`;
    //   item.textContent = emoji;
    //   spinnerList.appendChild(item);
    //   let backgroundColor;
    //   switch (emoji) {
    //     case '🐶':
    //       backgroundColor = '#e5a3ff';
    //       break;
    //     case '🐷':
    //       backgroundColor = '#9bfff9';
    //       break;
    //     case '🐸':
    //       backgroundColor = '#b3ffb3';
    //       break;
    //     default:
    //       backgroundColor = 'transparent';
    //   }
    //   Object.assign(item.style, {
    //     display: 'block',
    //     listStyleType: 'none',
    //     padding: '32px 0',
    //     fontSize: '32px',
    //     color: '#c2c2c2',
    //     borderLeft: '5px solid yellow',
    //     width: '117px',
    //     maxWidth: '117px',
    //     overflow: 'hidden',
    //     textAlign: 'center',
    //     backgroundColor: backgroundColor,
    //   });
    // });
  
  
    const spinnerMarker = document.createElement('div');
    spinnerMarker.className = 'spinner__marker';
    spinnerMarker.id = 'spinnerMarker';
    spinnerContainer.appendChild(spinnerMarker);
    Object.assign(spinnerMarker.style, {
      position: 'absolute',
      height: '100%',
      width: '3px',
      backgroundColor: 'yellow',
      transform: 'translateX(-50%)',
      left: '50%',
      top: '0',
    });
  
    console.log(this.glochipType)
  
    this.spinnerAnimation = new SpinnerAnimation({
      container: 'spinnerContainer',
      list: 'spinnerList',
      outcome: this.glochipType
    });
    
    setTimeout(() => {
      if (!this.spinnerAnimation.started) {
        this.spinnerAnimation.start();
      } else {
        console.log("Animation is already running.");
      }
    }, 1000); // delay of 1 second
  }

  removeSpinner() {
    this.spinnerAnimation = null;
  }
  
    showResult() {
      // //create a result image
      // const resultImage = document.createElement('img');
      // resultImage.style.position = 'absolute';
      // resultImage.style.top = '50%';
      // resultImage.style.left = '50%';
      // resultImage.style.transform = 'translateX(-50%';
      // resultImage.src = '/style/graphics/token_images/holokeys/' + this.glochipType + '.webp';
      // Create a new paragraph element
      const resultParagraph = document.createElement('p');
    
      // Set the text of the paragraph
      resultParagraph.innerText = `You just won a ${this.glochipType}!`;
      resultParagraph.style.color = 'white';
      resultParagraph.style.position = 'absolute';
      resultParagraph.style.top = '67%';
      resultParagraph.style.left = '50%';
      resultParagraph.style.transform = 'translateX(-50%';
    
      // Append the paragraph to the resultSpinnerDiv
      const resultSpinnerDiv = document.querySelector('.result-spinner-div');
      // resultSpinnerDiv.appendChild(resultImage);
      resultSpinnerDiv.appendChild(resultParagraph);
    
      const resultSpinnerOverflow = document.querySelector('.result-spinner-overflow');
      // Add a click event listener to the resultSpinnerDiv
      resultSpinnerOverflow.addEventListener('click', () => {
        // Remove the resultSpinnerDiv when it's clicked
        resultSpinnerDiv.remove();
        resultSpinnerOverflow.remove();
      });
    }
  
  // FOR GUEST SHIT
  // if(window.client.gloSession)
  
    playWinningScreen() {
      this.winScreen = true;
      // Create a div for the background
      const backgroundDiv = document.createElement('div');
      backgroundDiv.id = 'winning-background-div';
      backgroundDiv.style.zIndex = '2';
      const contentContainer = document.getElementById('content-container');
      contentContainer.appendChild(backgroundDiv);
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
        backgroundDiv.style.position = 'absolute';
        backgroundDiv.style.top = '0';
        backgroundDiv.style.left = '0';
        backgroundDiv.style.width = '100%';
        backgroundDiv.style.height = '100%';
      }
  
      /*winning card*/
      const winningCard = document.createElement('div');
      winningCard.id = 'winningCard';
      winningCard.style.display = 'flex';
      winningCard.style.position = 'absolute';
      winningCard.style.justifyContent = 'center';
      winningCard.style.height = '100%';
      winningCard.style.width = '100%';
      winningCard.style.left = '50%';
      winningCard.style.transform = 'translateX(-50%)';
      backgroundDiv.appendChild(winningCard);
  
  
    /* temporarily blocked out winning screen bg image */
    // Create an image element for the webp
    const webpImage = document.createElement('img');
    webpImage.id = 'webpImage';
    if (this.isMobile) {
      webpImage.src = 'style/graphics/winning_screen_mobile.webp';
    }
    else {
      if (!window.client.gloSession) {
        console.log('no glosession', window.client.gloSession, window.client.gloInfo)
        webpImage.src = 'style/graphics/winning_screen.webp';
      } else {
        if (window.client.gloInfo.activeVictory) {
          webpImage.src = '/style/graphics' + window.client.gloInfo.activeVictory.metadata.mainImg;
        } else {
          webpImage.src = 'style/graphics/winning_screen.webp';
        }
      }
    }
    webpImage.style.position = 'absolute';
    // webpImage.style.display = 'none';
    webpImage.style.width = '100%';
    webpImage.style.height = '100%'; // Set the height to 100%
    webpImage.style.top = '50%'; // Set the top to 50%
    webpImage.style.left = '50%'; // Set the left to 50%
    webpImage.style.transform = 'translate(-50%, -50%)';
    winningCard.appendChild(webpImage);
  
    // Create a div for the username
    const usernameDiv = document.createElement('div');
    usernameDiv.style.position = 'absolute';
    usernameDiv.style.top = '3%';
    usernameDiv.style.fontSize = '300%';
    usernameDiv.style.color = 'white';
    usernameDiv.style.whiteSpace = 'nowrap';
    if (window.client.gloInfo.username.length > 20) {
      usernameDiv.innerHTML = window.client.gloInfo.username.substring(0, 8) + '...' + window.client.gloInfo.username.substring(window.client.gloInfo.username.length - 5);
    } else {
      usernameDiv.innerHTML = window.client.gloInfo.username;
    }
    if (this.isMobile) {
      usernameDiv.style.top = '7.5%';
      usernameDiv.style.left = '50%';
    }
    winningCard.appendChild(usernameDiv);
  
  
    // Create a similar div for the "LUNC burned" message
    const luncDiv = document.createElement('div');
    luncDiv.innerHTML = 'LUNC "burned": ' + window.luncMachine.gameCoordinator.points;
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
      luncDiv.style.fontSize = '150%';
      luncDiv.style.top = '12.5%';
    }
    winningCard.appendChild(luncDiv);
  
    //winning portal
    const winningPortal = document.createElement('div');
    winningPortal.style.position = 'absolute';
    winningPortal.style.right = '5%';
    winningPortal.style.top = '37.5%';
    winningPortal.style.height = '30%';
    winningPortal.style.width= '30%';
    winningPortal.style.border = '1px solid white';
    winningPortal.style.backgroundColor = 'black';
    winningPortal.style.borderRadius = '10px';
    winningCard.appendChild(winningPortal);
  
    if (!window.client.gloSession || !window.client.gloInfo.walletID.startsWith('terra')) {
      const signInText = document.createElement('div');
      signInText.id = 'signInText';
      signInText.style.position = 'relative';
      signInText.style.color = 'white';
      signInText.style.fontSize = '1.4em';
      signInText.style.left = '50%';
      signInText.style.width = '90%';
      signInText.style.transform = 'translateX(-50%)';
      signInText.style.textAlign = 'center';
      signInText.style.top = '20%';  // Adjust these values as needed
      signInText.innerHTML = 'log in with a wallet<br><br>and<br><br>play again to win rewards';
      winningPortal.appendChild(signInText);
    } else {
      // loading spinner
      const loadingSpinner = document.createElement('div');
      loadingSpinner.id = 'loadingSpinner';
      loadingSpinner.className = 'winning-spinner';
      loadingSpinner.style.left = '50%';
      loadingSpinner.style.top = '20%';
      loadingSpinner.style.transform = 'translateX(-50%)';
    
      for(let i = 1; i <= 5; i++) {
        const square = document.createElement('div');
        square.id = 'winning-spinner-' + i;
        loadingSpinner.appendChild(square);
      }
    
      winningPortal.appendChild(loadingSpinner);
    
    
      // Create a div for displaying the result
      const awaitText = document.createElement('div');
      awaitText.id = 'awaitText';  // Set an id so we can find it later
      awaitText.style.position = 'relative';
      awaitText.style.color = 'white';
      awaitText.style.fontSize = '85%';
      awaitText.style.left = '50%';
      awaitText.style.transform = 'translateX(-50%)';
      awaitText.style.textAlign = 'center';
      awaitText.style.top = '75%';  // Adjust these values as needed
      awaitText.innerHTML = 'waiting for result...';  // Initial text
      winningPortal.appendChild(awaitText);
    
      // html for final result
      const resultImg = document.createElement('img');
      resultImg.id = 'resultImg';
      winningPortal.appendChild(resultImg);
      const resultBool = document.createElement('div');
      resultBool.id = 'resultBool';
      winningPortal.appendChild(resultBool);
      const resultPerformance = document.createElement('div');
      resultPerformance.id = 'resultPerformance';
      winningPortal.appendChild(resultPerformance);
      const resultClaim = document.createElement('button');
      resultClaim.style.display = 'none';
      resultClaim.id = 'resultClaim';
      resultClaim.className = 'mint-button';
      winningPortal.appendChild(resultClaim);
    }
  
    //buttons container
    const buttonsContainer = document.createElement('div');
    buttonsContainer.style.position = 'absolute';
    buttonsContainer.style.bottom = '5%';
    buttonsContainer.style.height = '7.5%';
    buttonsContainer.style.display = 'flex';
    buttonsContainer.style.background = 'rgba(0, 0, 0, 0.5)'; // 50% transparent black
    winningCard.appendChild(buttonsContainer);
  
    // // create a div for the share button
    // const shareDiv = document.createElement('button');
    // shareDiv.className = 'winning-button';
  
    // // create a span for the text
    // const shareSpan = document.createElement('span');
    // shareSpan.textContent = 'Share';
  
    // // append the span to the button
    // shareDiv.appendChild(shareSpan);
    // buttonsContainer.appendChild(shareDiv);
  
    // // Add an event listener to the share button
    // shareDiv.addEventListener('click', function() {
    //   console.log('share clicked');
  
    //   // Get the winningCard element
    //   const winningCard = document.getElementById('winningCard');
  
    //   // Use html2canvas to take a screenshot of the winningCard element
    //   html2canvas(winningCard).then(canvas => {
    //     // Create a preview box
    //     const previewBox = document.createElement('div');
    //     previewBox.id = 'previewBox';
    //     previewBox.style.position = 'fixed';
    //     previewBox.style.top = '50%';
    //     previewBox.style.left = '50%';
    //     previewBox.style.transform = 'translate(-50%, -50%)';
    //     previewBox.style.border = '1px solid black';
    //     previewBox.style.padding = '10px';
    //     previewBox.style.background = 'white';
    //     previewBox.style.zIndex = '4';
    //     previewBox.style.height = '100%';
    //     previewBox.style.width = '100%';
  
    //     canvas.style.position = 'absolute';
    //     canvas.style.left = '50%';
    //     canvas.style.top = '5%';
    //     canvas.style.transform = 'translateX(-50%)';
  
    //     // Append the canvas to the preview box
    //     previewBox.appendChild(canvas);
  
    //     // Create a copy button
    //     const copyButton = document.createElement('button');
    //     copyButton.textContent = 'Copy to clipboard';
    //     copyButton.addEventListener('click', function() {
    //       // Convert the canvas to a Blob
    //       canvas.toBlob(function(blob) {
    //         // Create a ClipboardItem object
    //         const item = new ClipboardItem({ 'image/png': blob });
  
    //         // Copy the ClipboardItem to the clipboard
    //         navigator.clipboard.write([item]);
    //       });
    //     });
  
    //     // Append the copy button to the preview box
    //     previewBox.appendChild(copyButton);
  
    //     // Append the preview box to the body
    //     document.body.appendChild(previewBox);
    //   });
    // });
  
  
      // create a div for the play again button
      const againDiv = document.createElement('button');
      againDiv.className = 'winning-button';
  
      // create a span for the text
      const againSpan = document.createElement('span');
      againSpan.textContent = 'Play Again';
  
      // append the span to the button
      againDiv.appendChild(againSpan);
      buttonsContainer.appendChild(againDiv);
  
      // create a div for main menu button
      const menuDiv = document.createElement('button');
      menuDiv.className = 'winning-button';
      menuDiv.style.pointerEvents = 'auto';
  
      // create a span for the text
      const menuSpan = document.createElement('span');
      menuSpan.textContent = 'Main Menu';
  
      // append the span to the button
      menuDiv.appendChild(menuSpan);
      buttonsContainer.appendChild(menuDiv);
  
      // Set a click event listener to play again after game over
      againDiv.addEventListener('click', () => {
        if (!this.winScreen) return;
        this.winScreen = false;
        if (typeof sa_event === 'function') sa_event("play_luncman_again");
        window.luncMachine.gameCoordinator.playAgain = true;
        // audio.pause();
        const bg = document.getElementById('winning-background-div');
        if (bg) bg.remove();
        console.log('first level data:', window.luncMachine.gameCoordinator.firstLevelData);
        setTimeout(() => {
          window.glogo.disabled = true;
          window.luncMachine.gameCoordinator.gameStartButton.disabled = false;
          window.luncMachine.gameCoordinator.reset(window.luncMachine.gameCoordinator.firstLevelData);
          window.luncMachine.gameCoordinator.setCutscene(window.luncMachine.gameCoordinator.firstLevelData);
        }, 1000);
      });

      // document.addEventListener('keydown', (event) => {
      //   if (!window.luncMachine.gameCoordinator.playingCutscene && window.luncMachine.gameCoordinator.gameStartButton.disabled && !this.winScreen) return;
      //   if (event.code === 'Space') {
      //     this.winScreen = false;
      //     sa_event("play_luncman_again");
      //     window.luncMachine.gameCoordinator.playAgain = true;
      //     // audio.pause();
      //     const bg = document.getElementById('winning-background-div');
      //     if (bg) bg.remove();
      //     console.log('first level data:', window.luncMachine.gameCoordinator.firstLevelData);
      //     setTimeout(() => {
      //       window.glogo.disabled = true;
      //       window.luncMachine.gameCoordinator.gameStartButton.disabled = false;
      //       window.luncMachine.gameCoordinator.reset(window.luncMachine.gameCoordinator.firstLevelData);
      //       window.luncMachine.gameCoordinator.setCutscene(window.luncMachine.gameCoordinator.firstLevelData);
      //     }, 1000);
      //   }
      // });
      
      if (!this.isMobile) {
      // Reset display for video backgrounds
      videoBackground.videos.forEach((video) => {
        video.style.display = '';
      });
      }
  
      // Set a click event listener to go to main menu
      menuDiv.addEventListener('click', () => {
        if (!this.winScreen) return;
        this.winScreen = false;
        window.dispatchEvent(new CustomEvent('menuGameStateChange', {
          detail: { state: "menu" },
        }));
  
        console.log('menu button clicked');
        const bg = document.getElementById('winning-background-div');
        if (bg) bg.remove();
        // audio.pause();
        if (!this.isMobile) {
          window.luncMachine.gameCoordinator.mainMenu.style.opacity = "1";
          window.luncMachine.gameCoordinator.gameStartButton.disabled = false;
          window.luncMachine.playButtonDisabled = false;
          window.luncMachine.gameCoordinator.mainMenu.style.visibility = 'visible';
          window.luncMachine.gameCoordinator.mainMenu.style.display = '';
          window.luncMachine.gameCoordinator.leftCover.style.visibility = 'hidden';
          window.luncMachine.gameCoordinator.rightCover.style.visibility = 'hidden';
          document.getElementById('luncman-div').style.visibility = 'visible';
      } else {
        window.luncMachine.gameCoordinator.mainMenu.style.opacity = '1';
        window.luncMachine.gameCoordinator.gameStartButton.disabled = false;
        window.luncMachine.gameCoordinator.mainMenu.style.visibility = 'visible';
        window.luncMachine.gameCoordinator.mainMenu.style.display = '';
        window.luncMachine.gameCoordinator.leftCover.style.visibility = 'hidden';
        window.luncMachine.gameCoordinator.rightCover.style.visibility = 'hidden';
      }
      });
    }
  
  }
  
  class SpinnerAnimation {
    constructor({container, list, outcome}) {
      this.tickSound = new Audio("https://freesound.org/data/previews/269/269026_5094889-lq.mp3");
      this.tickSound.playbackRate = 4;
      
      this.winSound = new Audio("https://freesound.org/data/previews/511/511484_6890478-lq.mp3");
      
      this.firstRound = true;
  
      this.reset();
  
      this.spinnerContainer = document.getElementById(container);
      this.spinnerList = this.spinnerContainer.children.namedItem(list);
      this.spinnerMarker = this.spinnerContainer.children.namedItem("spinnerMarker");
      this.spinnerItems = this.spinnerList.children;
      this.outcome = outcome;
      console.log('inputted outcome:', outcome);
      console.log(`Spinner outcome set to: ${this.outcome}`);
    }
  
    reset() {
        this.started = false;
        this.stopped = false;
        this.stopAnimation = false;
        this.lowerSpeed = 0;
        this.ticks = 0;
        this.offSet = 0;
        this.recycle = false;
        this.tick = false;
        this.state = null;
        this.speed = 0;
        this.winningItem = 0;
        this.firstRound = false;
    }
  
    start(speed = 1200) {
        this.started = true;
        this.speed = speed;
        console.log(`Starting spinner with speed: ${this.speed}`);
        this.loop();
    }
  
    loop() {
        let dt = 0; // Delta Time is the amount of time between two frames
        let last = 0; // Last time of frame
  
        // The Animation Loop
        function loop(ms) {
  
            if(this.recycle) {
                this.recycle = false;
                const item = this.spinnerList.firstElementChild;
                this.spinnerList.append(item);
            }
  
            if(this.tick) {
                this.tick = false;
                this.tickSound.play();
            }
  
            this.offSet += this.speed * dt;
  
            const ct = ms / 1000; // MS == The amount of Milliseconds the animation is already going for. Divided by 1000 is the amount of seconds
            dt = ct - last;
            last = ct;
  
            // Move the item to the left
            this.spinnerList.style.right = this.offSet + "px";
          
            if(this.offSet >= 122 ) {
                this.recycle = true;
                this.offSet = 0;
                this.tick = true;
                this.ticks += 1;
                console.log(`Tick: ${this.ticks}, Speed: ${this.speed}`); // Log tick count and speed
                if(this.ticks >= 25) {
                    this.stop();
                  console.log("Decided to stop");
                }
            }
  
            if(this.stopped) {
                let stopped = false;
                if(!stopped) this.speed -= this.lowerSpeed;
                if(this.speed <= 0) {
                    stopped = true;
                    this.speed = 0;
                }
  
                if(stopped) {
                    if(this.offSet >= 58.6) {
                        this.offSet += 6;
                    } else {
                        this.offSet -= 6;
                    }
                    console.log(`Adjusting Offset: ${this.offSet}`);
  
                    if(this.offSet >= 122 || this.offSet <= 0) {
                        this.stopAnimation = true;
                        
                        this.winSound.play();
                      
                        if(this.offSet >= 122) {
                          this.winningItem = 5;
                          this.spinnerItems.item(5).classList.add("win");
                          this.offSet = 122;
                        }
                        
                        if(this.offSet <= 0) {
                          this.winningItem = 4;
                          this.spinnerItems.item(4).classList.add("win");
                          this.offSet = 0;
                        }
                      
                        console.log(`Winning Item: ${this.winningItem}`);
  
                        // Delay the hiding of spinnerContainer by 1 second
                        setTimeout(() => {
                          this.spinnerContainer.style.visibility = 'hidden';
                          this.final();
                        }, 1000);
                      
                    }
                  
                }
            }
  
            if(!this.stopAnimation) {
                requestAnimationFrame(loop);
            }
        }
  
        // Bind Class to loop function
        loop = loop.bind(this);
        requestAnimationFrame(loop);
    }
  
    stop() {
        this.stopped = true;
        console.log(`Stopping with outcome: ${this.outcome}`);
        // Calculate a random lower speed
        switch(this.outcome){
          case 'generic glochip':
            this.lowerSpeed = 8;
            break;
          case 'esoteric glochip':
            this.lowerSpeed = 12;
            break;
          case 'spectral glochip':
            this.lowerSpeed = 13.85;
            break;
          default:
             console.log("Unknown outcome, using default lowerSpeed");
             this.lowerSpeed = 10; // Default or fallback value
              break;
        }
    }
  
    final(){
      const spinnerContainer = document.querySelector('.result-spinner-container');
  
      const spinWinContainer = document.createElement('div');
      spinWinContainer.id = 'spinWinContainer';
      spinWinContainer.style.position = 'absolute';
      spinWinContainer.style.top = '12.5%';
      spinWinContainer.style.left = '5%';
      spinWinContainer.style.border = '3px solid black';
      spinWinContainer.style.width = '250px';
      spinWinContainer.style.height = '250px';
      spinWinContainer.style.display = 'flex';
      spinWinContainer.style.justifyContent = 'center';
      spinWinContainer.style.alignItems = 'center';
      spinnerContainer.appendChild(spinWinContainer);
  
      const spinWinImage = document.createElement('img');
      spinWinImage.id = 'claim-spinWinImage';
      spinWinImage.style.position = 'absolute';
      spinWinImage.style.height = '225px';
      spinWinImage.style.width = '225px';
      spinWinContainer.appendChild(spinWinImage);
  
      const winMessage = document.createElement('div');
      winMessage.id = 'claim-winMessage';
      winMessage.style.position = 'absolute';
      winMessage.innerText = `You just won a ${this.outcome}!`;
      winMessage.style.top = '33%';
      winMessage.style.width = '45%';
      winMessage.style.left = '52.5%';
      winMessage.style.fontSize = '1em';
      winMessage.style.textAlign = 'center';
      winMessage.style.fontWeight = '900';
      spinnerContainer.appendChild(winMessage);
  
      const winButtons = document.createElement('div');
      winButtons.id = 'claim-winButtons';
      winButtons.style.position = 'absolute';
      winButtons.style.bottom = '25%';
      winButtons.style.height = '10%';
      winButtons.style.width = '45%';
      winButtons.style.left = '50%';
      winButtons.style.display = 'flex';
      winButtons.style.justifyContent = 'space-evenly';
      spinnerContainer.appendChild(winButtons);
  
      const backButton = document.createElement('button');
      backButton.id = 'claim-backButton';
      backButton.innerText = 'back';
      backButton.style.color = 'white';
      backButton.style.backgroundColor = 'black';
      backButton.style.cursor = 'pointer';
      winButtons.appendChild(backButton);
      backButton.addEventListener('click', () => {
        gsap.to(spinnerContainer, {
          opacity: 0,
          duration: 0.75,
          onComplete: () => spinnerContainer.style.display = 'none'
        });
      });
      
      const sellButton  = document.createElement('button');
      sellButton.id = 'claim-sellButton';
      sellButton.innerText = 'sell';
      sellButton.style.color = 'white';
      sellButton.style.backgroundColor = 'black';
      sellButton.style.cursor = 'pointer';
      winButtons.appendChild(sellButton);
      sellButton.addEventListener('click', () => {
        document.querySelectorAll('.result-spinner-container').forEach(element => {
          element.style.display = 'none';
        });

        // document.querySelectorAll('#winning-background-div').forEach(element => {
        //   element.style.display = 'none';
        // });

        document.getElementById('content-container').style.display = 'none';
        if (!window.nftMachine.gloMartInstance) window.nftMachine.gloMartInstance = new GloMart();
        window.videoBackground.transitionTo('printer_glomart', () => {
          window.windowState = 'marketplace';
          const event = new Event('WindowStateChanged');
          window.dispatchEvent(event);

          setTimeout(() => {
            window.nftMachine.gloMartInstance.handleNavItemClick('sell');
            window.nftMachine.gloMartInstance.activePage = 'Sell';
            window.luncMachine.gameCoordinator.removeSpinner();
          }, 100);
        });
      });
      
      const mintButton  = document.createElement('button');
      mintButton.id = 'claim-mintButton';
      mintButton.innerText = 'open';
      mintButton.style.color = 'white';
      mintButton.style.backgroundColor = 'black';
      mintButton.style.cursor = 'pointer';
      winButtons.appendChild(mintButton);
      mintButton.addEventListener('click', () => {
        document.querySelectorAll('.result-spinner-container').forEach(element => {
          element.style.display = 'none';
        });

        // document.querySelectorAll('#winning-background-div').forEach(element => {
        //   element.style.display = 'none';
        // });

        document.getElementById('content-container').style.display = 'none';
        if (!window.nftMachine.gloMintInstance) window.nftMachine.gloMintInstance = new GloMint();
        window.windowState = 'mint';
        window.videoBackground.transitionTo('printer_glomint', () => {
          // Dispatch a custom event to notify that windowState has changed
          const event = new Event('WindowStateChanged');
          window.dispatchEvent(event);
        });
      });
  
      switch (this.outcome) {
        case 'generic glochip':
            spinWinImage.src = '/style/graphics/token_images/glochips/generic_glochip_preview.webp';
            spinWinContainer.style.background = '#c5cbd1';
            winMessage.innerText = `You just won a ${this.outcome}!`;
            break;
        case 'esoteric glochip':
            spinWinImage.src = '/style/graphics/token_images/glochips/esoteric_glochip_preview.webp';
            spinWinContainer.style.background = '#b19d06';
            winMessage.innerText = `You just won an ${this.outcome}!`;
            break;
        case 'spectral glochip':
            spinWinImage.src = '/style/graphics/token_images/glochips/spectral_glochip_preview.webp';
            spinWinContainer.style.background = '#7718c5';
            winMessage.innerText = `You just won a ${this.outcome}!`;
            break;
        default:
            // Handle the case where the option doesn't match any of the above
            console.error('Invalid option type');
            break;
      }
    }
  }

class GameState {
  constructor() {
      if (GameState.instance) {
        GameState.instance.resetGameState();
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
    console.log('setting timestep to', this.timestep)
    this.boundMainLoop = null;
    this.boundMainLoop = this.mainLoop.bind(this);
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
    this.gameCoord.update();
  }

  /**
   * In the event that a ton of unsimulated frames pile up, discard all of these frames
   * to prevent crashing the game
   */
  panic() {
    this.elapsedMs = 0;
  }

  restart() {
    // First, stop the game engine if it's running
    this.stop();

    this.entityList = []; // Clear the entity list
  
    this.gameCoord = null;
  
    // Reset game-specific properties
    this.elapsedMs = 0;
    this.lastFrameTimeMs = 0;
    this.fps = this.maxFps;
    this.framesThisSecond = 0;
    this.lastFpsUpdate = 0;
    this.boundMainLoop = null;
  
    // Optionally, remove or reset any DOM elements or event listeners associated with the game
    if (this.fpsDisplay) {
      this.fpsDisplay.textContent = '';
    }
  
    this.start();
    console.log('Game engine restart completed.');
  }  

  /**
   * Draws an initial frame, resets a few tracking variables related to animation, and calls
   * the mainLoop function to start the engine
   */
  start() {
    if (!this.running && this.frameId === 0) { // Check if the engine is not already running and no frame request is pending
      this.running = true; // Indicate that the engine is now running
      this.started = true; // Indicate that the engine has started
      this.frameId = requestAnimationFrame((firstTimestamp) => {
        this.draw(1, []);
        this.lastFrameTimeMs = firstTimestamp;
        this.lastFpsUpdate = firstTimestamp;
        this.framesThisSecond = 0;
        // Correctly kick off the main loop
        this.frameId = requestAnimationFrame(this.boundMainLoop);
      });
    }
  }

  /**
   * Stops the engine and cancels the current animation frame
   */
  stop() {
    if (this.frameId !== 0) {
      cancelAnimationFrame(this.frameId); // Ensure the current animation frame is cancelled
      this.frameId = 0; // Reset frameId to indicate no pending frame request
      this.running = false; // Indicate that the engine is no longer running
      this.started = false; // Indicate that the engine is no longer started
    }
  }

  /**
   * Changes the game engine speed for duration milliseconds by speedPercent percent.
   * @param {number} duration - The amount of milliseconds the changed speed should last.
   * @param {number} speedPercent - The percent speed the game should run at (e.g., 0.5 for 50% speed).
   */
  changeSpeed(duration, speedPercent) {
    const originalTimestep = this.timestep;
    this.timestep = originalTimestep / speedPercent; // Adjust timestep based on speedPercent
    console.log('setting timestep to', this.timestep)

    // Adjust other speed-related variables here if necessary

    setTimeout(() => {
      this.timestep = originalTimestep; // Restore original game speed after duration
      // Restore any other adjusted variables to their original state
    }, duration);
  }

  /**
   * Resets the game engine speed back to normal.
   */
    resetSpeed() {
      this.timestep = 1000 / this.maxFps;
    }

  /**
   * The loop which will process all necessary frames to update the game's entities
   * prior to animating them
   */
  processFrames() {
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
  engineCycle(gameTime) {
    if (!this.running) return;

    // All timing calculations should use gameTime
    if (gameTime < this.lastFrameTimeMs + (1000 / this.maxFps)) {
        this.frameId = requestAnimationFrame(this.boundMainLoop);
        return;
    }

    this.elapsedMs += gameTime - this.lastFrameTimeMs;
    this.lastFrameTimeMs = gameTime;
    this.updateFpsDisplay(gameTime);
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
    if (!this.running) return;
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
      200: 'atom',
      300: 'eth',
      400: 'solana',
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
    this.threshold = 15;
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
    const threshold = this.threshold;

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
    this.musicVolume = 0.0075;
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
  }

  /**
   * Plays a single sound effect
   * @param {String} sound
   */
  play(sound, onomat = false) {
    let baseUrl;
    if (onomat) {
      baseUrl = '/style/audio/onomat/';
    } else {
      baseUrl = this.baseUrl;
    }
    this.soundEffect = new Audio(`${baseUrl}${sound}.${this.fileFormat}`);
    this.soundEffect.volume = this.masterVolume;
    this.soundEffect.play();
  }

  /**
   * Special method for eating dots. The dots should alternate between two
   * sound effects, but not too quickly.
   */
  playDotSound() {
    // this.queuedDotSound = true;

    // if (!this.dotPlayer) {
      // this.queuedDotSound = false;
      // this.dotSound = (this.dotSound === 1) ? 2 : 1;

    //   this.dotPlayer = new Audio(
    //     `${this.baseUrl}lunc.${this.fileFormat}`,
    //   );
    //   // this.dotPlayer.onended = this.dotSoundEnded.bind(this);
    //   this.dotPlayer.volume = this.masterVolume;
    //   this.dotPlayer.play();
    // }
    const dotPlay = new Audio(`${this.baseUrl}lunc.${this.fileFormat}`);
    dotPlay.volume = this.masterVolume;
    dotPlay.play();
  }

  /**
   * Deletes the dotSound player and plays another dot sound if needed
   */
  // dotSoundEnded() {
  //   this.dotPlayer = undefined;

  //   if (this.queuedDotSound) {
  //     this.playDotSound();
  //   }
  // }

  setMusicVolume(newVolume) {
    this.musicVolume = newVolume * 0.15;
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

  async setMusic(sound, keepCurrentMusic, important = false) {
    if (this.importantMusicPlaying && !important) {
      console.log('Tried to update music but important music is already playing.');
      return;
    }

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
        this.musicElement = new Audio(`${this.baseUrl}${sound}.${this.fileFormat}`);
        this.musicElement.loop = true;
        this.musicSource = this.music.createMediaElementSource(this.musicElement);
        this.musicSource.connect(this.musicGainNode);
        this.musicElement.play();
    
        this.fetchingMusic = false;
        this.importantMusicPlaying = important;
      }

      // if (this.masterVolume !== 0) {
      //   this.fetchingMusic = true;
      //   const response = await fetch(
      //     `${this.baseUrl}${sound}.${this.fileFormat}`,
      //   );
      //   const arrayBuffer = await response.arrayBuffer();
      //   const audioBuffer = await this.music.decodeAudioData(arrayBuffer);

      //   this.musicSource = this.music.createBufferSource();
      //   this.musicSource.buffer = audioBuffer;
      //   this.musicSource.connect(this.musicGainNode);
      //   this.musicSource.loop = true;
      //   this.musicSource.start();

      //   this.fetchingMusic = false;
      //   this.importantMusicPlaying = important;
      // }
    }
  }

  pauseMusic(start) {
    if (this.musicElement) {
      this.musicElement.pause();
      if (start) return;
      localStorage.setItem('musicPaused', true);
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

  resumeMusic() {
    if (this.musicElement) {
      this.musicElement.play();
      localStorage.setItem('musicPaused', false);
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
      if (this.musicElement) {
        this.musicElement.pause();
        this.musicElement.currentTime = 0;
        this.musicSource.disconnect();
        this.musicSource = null;
        this.musicElement = null;

        this.importantMusicPlaying = false;
        this.paused = true;
      }
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