class LuncMachine {
  constructor() {
    this.init();
    this.handleState(); 
    window.addEventListener('sessionCreated', this.remakeDashboard.bind(this));
    console.log('luncmachine constructor')
  }
  
  init() {
    this.contentContainer = document.getElementById('content-container');
    this.overflowImage = document.getElementById('overflow-image');
    this.overflowMask = document.getElementById('overflow-mask');
    window.addEventListener('WindowStateChanged', this.handleState.bind(this));
  }

  handleState() {
    switch (window.windowState) {
      case 'home':
        console.log('setting website to home');
        this.createHomeElements();
        this.hideLuncman();
        if (!this.gameCoordinator) this.createGameCoordinator();
        break;
      case 'luncman':
        this.setLuncman();
        this.hideHomeElements();
        break;
      
      case 'leaderboard':
        this.hideHomeElements();
        this.hideLuncman();
        break;

      case 'nft':
        this.hideHomeElements();
        this.hideLuncman();
        break;

      default:
        console.log("no luncmachine state found");
        break;
    }
  }

  createHomeElements() {
    // Check if the rectangle with the ID 'luncElement' already exists
    if (this.homeElement) {
      this.homeElement.style.display = 'flex';
      console.log('displaying luncman home element')
      return;
    } else {
      // Create the rectangle
      this.homeElement = document.createElement('div');
      document.body.appendChild(this.homeElement);
      this.homeElement.id = 'luncElement';
      
      // Apply styles to the rectangle
      this.homeElement.style.position = 'absolute';
      this.homeElement.style.transform = 'translateX(-50%)';  // Center it
      this.homeElement.style.backgroundColor = 'transparent';  // Make the inside of the rectangle transparent
      this.homeElement.style.cursor = 'pointer';
      console.log('created luncElement', this.homeElement);
      window.videoBackground.addSetElement('luncElement', 382.81, 739.5, 219.75, 950.06);
      // this.homeElement.style.border = '2px solid purple';  // Add a blue border
      
      // Add event listener for click event
      this.homeElement.addEventListener('click', this.switchState.bind(this));

      // Create the image
      this.hoverImage = document.createElement('img');
      this.hoverImage.src = '/style/graphics/hover/hover_PLAY.svg';
      this.hoverImage.style.opacity = '0'; // Hide the image initially
      this.hoverImage.style.position = 'absolute';
      this.hoverImage.style.height = '100%'; // Adjust as needed
      this.hoverImage.style.top = '0';
      this.hoverImage.style.left = '50%';
      this.hoverImage.style.transform = 'translateX(-50%)';

      this.hoverImage.style.pointerEvents = 'none'; // Disable pointer events

      // Add event listener for hover event
      this.homeElement.addEventListener('mouseover', () => {
        gsap.to(this.hoverImage, {autoAlpha: 1, duration: 0.5}); // Fade in the image when hovered over
      });
      this.homeElement.addEventListener('mouseout', () => {
        gsap.to(this.hoverImage, {autoAlpha: 0, duration: 0.5}); // Fade out the image when not hovered over
      });

      document.body.appendChild(this.hoverImage);
    }
  }  

  hideHomeElements() {
    console.log('hiding home elements');
    if (!this.homeElement) {
      if (!this.overflowImage) return;
      this.overflowImage.style.display = 'none';
      return;
    } else{
      this.homeElement.style.display = 'none';
      if (!this.overflowImage) return;
      this.overflowImage.style.display = 'none';
    }
  }

  switchState() {
    console.log('poop');
    window.windowState = 'luncman';

    // Dispatch a custom event to notify that windowState has changed
    const event = new Event('WindowStateChanged');
    window.dispatchEvent(event);
    console.log('Window state:', window.windowState);

    if (window.firstVisit && !window.glogoHinted) {
      window.glogoHinted = true;
      setTimeout(() => {
        gsap.to(window.glogo.glogoHint, {opacity: 1, duration: 1});
      }, 1000);

      setTimeout(() => {
        gsap.to(window.glogo.glogoHint, {opacity: 0, duration: 1.5});
      }, 5000);
    }
  }

  setContentCovers() {
    if (this.leftBox) {
      this.leftBox.classList.add('moveRight');
    } else {
      this.leftBox = document.createElement('div');
      this.leftBox.id = 'left-box';
      this.leftBox.className = 'blackBox';
      this.contentContainer.appendChild(this.leftBox);
    }

    if (this.rightBox) {
      this.rightBox.classList.add('moveLeft');
    } else {
      this.rightBox = document.createElement('div');
      this.rightBox.id = 'right-box';
      this.rightBox.className = 'blackBox';
      this.contentContainer.appendChild(this.rightBox);
    }
  }

  setLuncman() {
    //set luncman background
    // create main menu elements
    if (!this.gameCoordinator) this.createGameCoordinator();

    this.setContentCovers();

    window.videoBackground.transitionTo('home_luncman', () => {
      // show gamescreen
      this.contentContainer.style.display = 'flex';
      gsap.to(this.contentContainer, {
        opacity: 1,
        duration: 0.75,
      });
      this.leftBox.classList.add('moveLeft');
      this.rightBox.classList.add('moveRight');
      this.gameUi = document.getElementById('game-ui');
      this.headerButtons = document.getElementById('header-buttons');
      this.headerButtons.style.visibility = 'hidden';
      this.gameUi.style.visibility = 'hidden';
      this.overflowMask.style.backgroundColor = 'black';
      this.createLuncMenu();
      if (!this.dashboard) {
        this.dashboard = new Dashboard();
      }
    });
  }

  remakeDashboard() {
    if (this.dashboard) {
      this.dashboard.remove();
      this.dashboard = new Dashboard();
    }
  }

  hideLuncman() {
    if (!this.contentContainer) {
      return;
    } else {
      gsap.to(this.contentContainer, {
        opacity: 0,
        duration: 0.2,
        onComplete: () => {
            this.contentContainer.style.display = 'none';
        }
    });
    }
  }

  async createGameCoordinator() {
    const level1Data = await loadFirstLevelMaze();
    console.log('level1Data is ', level1Data);
    this.gameCoordinator = new GameCoordinator(
      level1Data.mazeArray,
      level1Data.nextLevel
    );
    this.level1Data = level1Data;
    this.gameCoordinator.level1Data = level1Data;
    console.log('set game coordinator level 1 data')

    let videoSource = `levels/level_1/cutscenes/${level1Data.assets.intro}.webm`;
    this.gameCoordinator.introVideo = await this.gameCoordinator.createGameElements([videoSource], 'video');
    console.log('loaded intro video')

    // Load cutscenes
    const imgBase = `levels/level_1/`;
    const assetSources = [];

    for (const cutsceneKey in level1Data.assets.cutscenes) {
      assetSources.push(`${imgBase}cutscenes/${level1Data.assets.cutscenes[cutsceneKey]}.webp`);
      console.log('loading cutscene:', level1Data.assets.cutscenes[cutsceneKey]);
    }

    const loadedCutscenesArray = await this.gameCoordinator.createGameElements(assetSources, 'img');

    // Sort the loaded cutscenes based on the order number in the src attribute
    const loadedCutscenes = loadedCutscenesArray.sort((a, b) => {
      const aOrder = a.src.charAt(a.src.length - 6); // Get the character before '.webp'
      const bOrder = b.src.charAt(b.src.length - 6); // Get the character before '.webp'
      return aOrder - bOrder;
    });

    let curtain = [];
    curtain.push(`/levels/curtain.webp`);
    const curtainVideo = await this.gameCoordinator.createGameElements(curtain, 'img');

  
    // Store the loaded images in level.assets
    this.gameCoordinator.level1Data.loadedCutscenes = loadedCutscenes;
    this.gameCoordinator.curtainVideo = curtainVideo;
    console.log('loaded cutscenes', loadedCutscenes, 'for', this.gameCoordinator.level1Data.loadedCutscenes)

    // Load the first level
    this.gameCoordinator.setLevel(this.level1Data);
    console.log('gameCoordinator is ', this.gameCoordinator);

    // Load the next level only after the first level is set
    this.gameCoordinator.nextLevelData = await this.gameCoordinator.loadLevel(
      this.gameCoordinator.nextLevel
    );
  }

  addPlayButtonListener() {
    if (!this.gameCoordinator) {
      setTimeout(() => this.addPlayButtonListener(), 100);
      return;
    }
    this.playButton.addEventListener('click', () => {
      if (this.playButtonDisabled) return;
      if (typeof sa_event === 'function') sa_event("play_luncman");
      this.playButtonDisabled = true;
      window.glogo.disabled = true;
      this.gameCoordinator.setCutscene(window.luncMachine.gameCoordinator.level1Data)
    });
  }

  createLuncMenu() {
   // 1. Create playButton element
   if (!this.playButton) {
    this.playButton = document.createElement('button');
    this.playButton.id = 'credit-check';
    this.playButton.className = 'play-btn navigation-link';
    this.playButton.innerHTML = `
    <span class="play-text">PLAY</span>
      <div id="clip">
        <div id="leftTop" class="corner"></div>
        <div id="rightBottom" class="corner"></div>
        <div id="rightTop" class="corner"></div>
        <div id="leftBottom" class="corner"></div>
      </div>
      <span id="rightArrow" class="arrow"></span>
      <span id="leftArrow" class="arrow"></span>
    `;
    this.addPlayButtonListener();

    // Append playButton to its parent container
    this.mainMenuContainer = document.querySelector('.main-menu-container');
    this.mainMenuContainer.appendChild(this.playButton);
  }

    // 3. Create howToPlay link
    if (!this.howToPlay) {
      this.luncMachineState = 'home';
      this.howToPlay = document.createElement('a');
      this.howToPlay.id = 'how-to-play';
      this.howToPlay.className = 'navigation-link';
      this.howToPlay.textContent = 'HOW-TO-PLAY';
      this.howToPlay.style.position = 'absolute';
      this.howToPlay.style.top = '43%';

        // Add event listener for click event
        this.howToPlay.addEventListener('click', (event) => {
          event.preventDefault(); // Prevent the default action
          this.createHowToPlay(); // Call the function
        });

      // You can append this link wherever appropriate in your DOM structure.
      // For the sake of this example, I'll append it to the mainMenuContainer.
      this.mainMenuContainer.appendChild(this.howToPlay);

      document.getElementById('luncman-link').addEventListener('click', (event) => {
        event.preventDefault(); // Prevent the default action
        this.handleLuncmanClick();
      });
    }
  }

  handleLuncmanClick() {
    console.log('luncmachinestate: ', this.luncMachineState);
    switch (this.luncMachineState) {
      case 'home':
        this.playButton.style.display = 'none';
        this.howToPlay.style.display = 'none';
        document.querySelector('.dashboard').style.display = 'none';
        this.luncMachineState = 'about';
        this.createAboutSection();
        break;
      case 'how2play':
        this.howToPlaySection.style.display = 'none';
        this.luncMachineState = 'home';
        this.playButton.style.display = 'flex';
        this.howToPlay.style.display = 'flex';
        document.querySelector('.dashboard').style.display = 'flex';
        break;
      case 'about':
        this.aboutSection.style.display = 'none';
        this.playButton.style.display = 'flex';
        this.howToPlay.style.display = 'flex';
        this.luncMachineState = 'home';
        document.querySelector('.dashboard').style.display = 'flex';
        break;
    }
  }
  
  createHowToPlay() {
   console.log('creating how to play');
   this.luncMachineState = 'how2play';
   this.playButton.style.display = 'none';
   this.howToPlay.style.display = 'none';
   document.querySelector('.dashboard').style.display = 'none';

  if (!this.howToPlaySection) {
    this.howToPlaySection = document.createElement('div');
    this.howToPlaySection.id = "howToPlaySection";
    this.howToPlaySection.className = 'how-to-play-section';
    this.howToPlaySection.innerHTML = `
      <div class="how-input">
        <label>
          <input type="radio" id="how-1" name="how-radio" value="how-1" checked>
          <span>Intro</span>
        </label>
        <label>
          <input type="radio" id="how-2" name="how-radio" value="how-2">
          <span>Controls</span>
        </label>
        <label>
          <input type="radio" id="how-3" name="how-radio" value="how-3">
          <span>Rules</span>
        </label>
        <label>
          <input type="radio" id="how-4" name="how-radio" value="how-4">
          <span>Rewards</span>
        </label>
        <label>
          <input type="radio" id="how-5" name="how-radio" value="how-5">
          <span>Tips</span>
        </label>
        <label>
          <input type="radio" id="how-6" name="how-radio" value="how-6">
          <span>Updates</span>
        </label>
        <span class="selection"></span>
      </div>
      <div id="how-1-content" class="how-content"></div>
      <div id="how-2-content" class="how-content" style="display: none;"></div>
      <div id="how-3-content" class="how-content" style="display: none;"></div>
      <div id="how-4-content" class="how-content" style="display: none;"></div>
      <div id="how-5-content" class="how-content" style="display: none;"></div>
      <div id="how-6-content" class="how-content" style="display: none;"></div>
    `;
    this.mainMenuContainer.appendChild(this.howToPlaySection);
    
    // intro
    let how1Content = document.getElementById('how-1-content');
    how1Content.style.overflow = 'hidden'; // Hide horizontal overflow
    
    let text1 = document.createElement('div');
    text1.className = 'how-intro-text';
    text1.style.top = '15%';
    text1.textContent = 'An arcade slasher-maze game where you play as Luncman, the heroic saviour of LUNC.';
    document.getElementById('how-1-content').appendChild(text1);

    let text2 = document.createElement('div');
    text2.className = 'how-intro-text';
    text2.style.top = '47.5%';
    text2.textContent = 'Dash through intricate mazes and punish LUNC\'s enemies in a last-ditch effort to save the LUNC mothership from total collapse.';
    document.getElementById('how-1-content').appendChild(text2);

    let text3 = document.createElement('div');
    text3.className = 'how-intro-text';
    text3.style.top = '10%';
    text3.textContent = 'Earn in-game NFTs, climb the leaderboard, and secure your legacy as the one true LUNCMAN.';
    document.getElementById('how-1-content').appendChild(text3);

    let introButtonContainer = document.createElement('div');
    introButtonContainer.className = 'how-button-container';
    document.getElementById('how-1-content').appendChild(introButtonContainer);

    let introButtonLeft = document.createElement('button');
    introButtonLeft.innerText = '<';
    introButtonLeft.className = 'how-intro-button';
    introButtonLeft.style.position = 'absolute';
    let introButtonRight = document.createElement('button');
    introButtonRight.innerText = '>';
    introButtonRight.className = 'how-intro-button';
    introButtonRight.style.position = 'absolute';
    introButtonRight.style.right = '0';
    introButtonContainer.appendChild(introButtonLeft);
    introButtonContainer.appendChild(introButtonRight);

    // Create videos
    let video1 = document.createElement('video');
    video1.src = 'style/graphics/intro_1.webm';
    video1.style.display = 'block'; // Initially show video1
    video1.style.height = '45%';
    video1.style.top = '53.5%'
    video1.className = 'intro-video';
    video1.autoplay = true;
    video1.loop = true;
    video1.muted = true;
    how1Content.appendChild(video1);

    let video2 = document.createElement('video');
    video2.src = 'style/graphics/intro_2.webm';
    video2.className = 'intro-video';
    video2.style.display = 'none'; // Initially hide video2
    video2.style.height  = '15%';
    video2.style.top = '20%';
    video2.style.border = '2px solid #ffc300'
    video2.autoplay = true;
    video2.loop = true;
    video2.muted = true;
    how1Content.appendChild(video2);

    let video3 = document.createElement('video');
    video3.src = 'style/graphics/intro_3.webm';
    video3.className = 'intro-video';
    video3.style.display = 'none'; // Initially hide video3
    video3.style.height = '68%';
    video3.style.top = '32%';
    video3.autoplay = true;
    video3.loop = true;
    video3.muted = true;
    how1Content.appendChild(video3);

    // Initially hide text2, text3 and the left button
    text2.style.display = 'none';
    text3.style.display = 'none';
    introButtonLeft.style.display = 'none';

    // Keep track of the current text
    let currentText = 1;

    // Modify the event listeners for the left and right buttons to show and hide the gifs
    introButtonRight.addEventListener('click', () => {
      if (currentText === 1) {
        // Hide text1 and video1, and show text2 and video2
        text1.style.display = 'none';
        video1.style.display = 'none';
        text2.style.display = 'block';
        video2.style.display = 'block';
        introButtonLeft.style.display = 'block'; // Show the left button
        currentText = 2;
      } else if (currentText === 2) {
        // Hide text2 and video2, and show text3 and video3
        text2.style.display = 'none';
        video2.style.display = 'none';
        text3.style.display = 'block';
        video3.style.display = 'block';
        introButtonRight.style.display = 'none'; // Hide the right button
        currentText = 3;
      }
    });
    introButtonLeft.addEventListener('click', () => {
      if (currentText === 2) {
        // Hide text2 and video2, and show text1 and video1
        text2.style.display = 'none';
        video2.style.display = 'none';
        text1.style.display = 'block';
        video1.style.display = 'block';
        introButtonRight.style.display = 'block'; // Show the right button
        introButtonLeft.style.display = 'none'; // Hide the left button
        currentText = 1;
      } else if (currentText === 3) {
        // Hide text3 and video3, and show text2 and video2
        text3.style.display = 'none';
        video3.style.display = 'none';
        text2.style.display = 'block';
        video2.style.display = 'block';
        introButtonLeft.style.display = 'block'; // Show the left button
        introButtonRight.style.display = 'block'; // Show the right button
        currentText = 2;
      }
    });

    // controls
    let moveContainer = document.createElement('div');
    let moveControlsText = document.createElement('div');
    moveControlsText.className = 'how-controls-text';
    moveControlsText.textContent = 'Move';
    moveControlsText.style.top = '18%';
    moveContainer.appendChild(moveControlsText);
    let moveKey = document.createElement('div');
    moveKey.className = 'move-container';
    moveKey.style.display = 'grid';
    moveKey.style.gridTemplateColumns = 'repeat(3, 1fr)';
    moveKey.style.gridTemplateRows = 'repeat(3, 1fr)';
    moveKey.style.gap = '10px';
    let upKey = document.createElement('div');
    upKey.textContent = 'W/↑';
    upKey.className = 'move-key';
    upKey.style.gridRow = '1';
    upKey.style.gridColumn = '2';
    upKey.style.display = 'flex';
    upKey.style.justifyContent = 'center';
    upKey.style.alignItems = 'center';
    moveKey.appendChild(upKey);
    let leftKey = document.createElement('div');
    leftKey.className = 'move-key';
    leftKey.textContent = 'A/←';
    leftKey.style.gridRow = '2';
    leftKey.style.gridColumn = '1';
    leftKey.style.display = 'flex';
    leftKey.style.justifyContent = 'center';
    leftKey.style.alignItems = 'center';
    moveKey.appendChild(leftKey);
    let downKey = document.createElement('div');
    downKey.className = 'move-key';
    downKey.textContent = 'S/↓';
    downKey.style.gridRow = '2';
    downKey.style.gridColumn = '2';
    downKey.style.display = 'flex';
    downKey.style.justifyContent = 'center';
    downKey.style.alignItems = 'center';
    moveKey.appendChild(downKey);
    let rightKey = document.createElement('div');
    rightKey.className = 'move-key';
    rightKey.textContent = 'D/→';
    rightKey.style.gridRow = '2';
    rightKey.style.gridColumn = '3';
    rightKey.style.display = 'flex';
    rightKey.style.justifyContent = 'center';
    rightKey.style.alignItems = 'center';
    moveKey.appendChild(rightKey);
    moveContainer.appendChild(moveKey);
    let keys = [upKey, leftKey, downKey, rightKey];
    let transformations = ['rotate(270deg)', 'rotate(180deg) scaleY(-1)', 'rotate(90deg)', 'rotate(0deg)'];
    let index = 0;

    setInterval(() => {
      // Remove the 'pressed' class from the current key
      keys[index].classList.remove('pressed');

      // Move to the next key
      index = (index + 1) % keys.length;

      // Add the 'pressed' class to the next key
      keys[index].classList.add('pressed');

      // Rotate the video
      moveVideo.style.transform = transformations[index];
    }, 1000);
    let moveVideo = document.createElement('video');
    moveVideo.src = 'style/graphics/controls_lunc.webm';
    moveVideo.autoplay = true;
    moveVideo.loop = true;
    moveVideo.muted = true;
    moveVideo.style.position = 'absolute';
    moveVideo.style.height = '15%';
    moveVideo.style.right = '15%';
    moveVideo.style.top = '15%';
    moveContainer.appendChild(moveVideo);
    document.getElementById('how-2-content').appendChild(moveContainer);

    let dashContainer = document.createElement('div');
    let dashControlsText = document.createElement('div');
    dashControlsText.className = 'how-controls-text';
    dashControlsText.textContent = 'Dash';
    dashControlsText.style.top = '48%';
    dashContainer.appendChild(dashControlsText);
    let dashKeyContainer = document.createElement('div');
    dashKeyContainer.style.display = 'grid';
    dashKeyContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
    dashKeyContainer.style.gridTemplateRows = 'repeat(3, 1fr)';
    dashKeyContainer.style.gap = '10px';
    dashKeyContainer.style.position = 'absolute';
    dashKeyContainer.style.left = '50%';
    dashKeyContainer.style.transform = 'translateX(-50%)';
    dashKeyContainer.style.top = '40%';
    
    let dashKeys = ['W/↑', 'A/←', 'S/↓', 'D/→'].map((keyText, i) => {
      let key = document.createElement('div');
      key.className = 'move-key';
      key.textContent = keyText;
      key.style.display = 'flex';
      key.style.justifyContent = 'center';
      key.style.alignItems = 'center';
    
      // Adjust gridRow and gridColumn for WASD layout
      if (keyText === 'W/↑') {
        key.style.gridRow = 1;
        key.style.gridColumn = 2;
      } else if (keyText === 'A/←') {
        key.style.gridRow = 2;
        key.style.gridColumn = 1;
      } else if (keyText === 'S/↓') {
        key.style.gridRow = 2;
        key.style.gridColumn = 2;
      } else if (keyText === 'D/→') {
        key.style.gridRow = 2;
        key.style.gridColumn = 3;
      }
    
      dashKeyContainer.appendChild(key);
      return key;
    });
    
    dashContainer.appendChild(dashKeyContainer);
    
    let pressKey = false;
    
    setInterval(() => {
      if (pressKey) {
        dashKeys[3].classList.add('dash-pressed');
        setTimeout(() => dashKeys[3].classList.remove('dash-pressed'), 200);
        setTimeout(() => dashKeys[3].classList.add('dash-pressed'), 400);
        setTimeout(() => dashKeys[3].classList.remove('dash-pressed'), 600);
      }
      pressKey = !pressKey;
    }, 1000);
    let dashVideo = document.createElement('video');
    dashVideo.src = 'style/graphics/controls_dash.webm';
    dashVideo.autoplay = true;
    dashVideo.loop = true;
    dashVideo.muted = true;
    dashVideo.style.position = 'absolute';
    dashVideo.style.right =  '4%';
    dashVideo.style.top = '43%';
    dashVideo.style.height = '15%';
    dashContainer.appendChild(dashVideo);
    document.getElementById('how-2-content').appendChild(dashContainer);

    let attackContainer = document.createElement('div');
    let attackControlsText = document.createElement('div');
    attackControlsText.className = 'how-controls-text';
    attackControlsText.textContent = 'Attack';
    attackControlsText.style.top = '79%';
    attackContainer.appendChild(attackControlsText);
    let attackKey = document.createElement('div');
    attackKey.style.position = 'absolute';
    attackKey.style.left = '50%';
    attackKey.style.transform = 'translateX(-50%)';
    attackKey.className = 'move-space';
    attackKey.textContent = 'space';
    attackKey.style.gridRow = '2';
    attackKey.style.gridColumn = '3';
    attackKey.style.display = 'flex';
    attackKey.style.justifyContent = 'center';
    attackKey.style.alignItems = 'center';
    attackContainer.appendChild(attackKey);
    let pressAttack = false;

    setInterval(() => {
      if (pressAttack) {
        attackKey.classList.add('attack-pressed');
      } else {
        attackKey.classList.remove('attack-pressed');
      }
      pressAttack = !pressAttack;
    }, 1000);
    let attackVideo = document.createElement('video');
    attackVideo.src = 'style/graphics/controls_attack.webm';
    attackVideo.autoplay = true;
    attackVideo.loop = true;
    attackVideo.muted = true;
    attackVideo.style.position = 'absolute';
    attackVideo.style.left = '87%';
    attackVideo.style.height = '15%';
    attackVideo.style.top = '73%';
    attackVideo.style.transform = 'translateX(-50%)';
    attackContainer.appendChild(attackVideo);
    document.getElementById('how-2-content').appendChild(attackContainer);

    //rules
    let rulesText = document.createElement('div');

    rulesText.style.position = 'absolute';
    rulesText.style.left = '40%';
    rulesText.style.top = '12%';
    rulesText.style.fontSize = 'xxx-large';
    rulesText.style.lineHeight = '1.5em';
    rulesText.style.color = 'white';
    document.getElementById('how-3-content').appendChild(rulesText);

    let rulesButtonContainer = document.createElement('div');
    rulesButtonContainer.className = 'how-button-container';
    document.getElementById('how-3-content').appendChild(rulesButtonContainer);

    let rulesButtonLeft = document.createElement('button');
    rulesButtonLeft.innerText = '<';
    rulesButtonLeft.className = 'how-rules-button';
    rulesButtonLeft.style.position = 'absolute';
    rulesButtonLeft.style.color = 'white';
    rulesButtonLeft.style.background = 'black';
    rulesButtonLeft.style.border = '1px solid white';
    rulesButtonLeft.style.padding = '10px';
    rulesButtonLeft.style.fontSize = '1vw';
    rulesButtonLeft.style.cursor = 'pointer';
    let rulesButtonRight = document.createElement('button');
    rulesButtonRight.innerText = '>';
    rulesButtonRight.className = 'how-rules-button';
    rulesButtonRight.style.position = 'absolute';
    rulesButtonRight.style.right = '0';
    rulesButtonRight.style.color = 'white';
    rulesButtonRight.style.background = 'black';
    rulesButtonRight.style.border = '1px solid white';
    rulesButtonRight.style.padding = '10px';
    rulesButtonRight.style.fontSize = '1vw';
    rulesButtonRight.style.cursor = 'pointer';
    rulesButtonContainer.appendChild(rulesButtonLeft);
    rulesButtonContainer.appendChild(rulesButtonRight);

    let style = document.createElement('style');
    style.innerHTML = `
      .rules-list {
        padding: 0;
      }
      .rules-list li {
        margin-bottom: 90px;
        line-height: 1.25;
      }
      .meta-list {
        padding: 35px;
      }
      .meta-list li {
        margin-bottom: 25px; 
        line-height: 1.25;
      }
      .collect-list {
        padding: 0;
      }
      .collect-list li {
        margin-bottom: 275px; 
        line-height: 1.25;
      }
    `;
    document.head.appendChild(style);

    let metaRulesContainer = document.createElement('div');
    metaRulesContainer.style.color = 'white';
    metaRulesContainer.style.position = 'absolute';
    metaRulesContainer.style.height = '97%';
    metaRulesContainer.style.width = '75%';
    metaRulesContainer.style.top = '5%';
    metaRulesContainer.style.left = '50%';
    metaRulesContainer.style.transform = 'translateX(-50%)';
    metaRulesContainer.style.display = 'flex';
    metaRulesContainer.style.alignItems = 'center';
    metaRulesContainer.style.flexDirection = 'column';
    document.getElementById('how-3-content').appendChild(metaRulesContainer); 
    let metaRulesTitle =  document.createElement('span');
    metaRulesTitle.innerText = 'META';
    metaRulesContainer.appendChild(metaRulesTitle); 
    let metaRulesText =  document.createElement('span');
    metaRulesText.innerHTML = `
    <ul class="meta-list">
      <li>Each level unveils a chapter in the epic tale of Luncman.</li>
      <li>Kill all enemies to unlock the next level of the game.</li>
      <li>Your score is determined by how fast you complete each level, how many pickups you collect, and how efficiently you kill your enemies.</li>
      <li>Aim for top scores to enhance your chances of securing NFT rewards.</li>
    </ul>
    `;
    metaRulesContainer.appendChild(metaRulesText); 


    let collectRulesContainer = document.createElement('div');
    collectRulesContainer.style.color = 'white';
    collectRulesContainer.style.position = 'absolute';
    collectRulesContainer.style.height = '97%';
    collectRulesContainer.style.width = '75%';
    collectRulesContainer.style.top = '5%';
    collectRulesContainer.style.left = '50%';
    collectRulesContainer.style.transform = 'translateX(-50%)';
    collectRulesContainer.style.display = 'flex';
    collectRulesContainer.style.alignItems = 'center';
    collectRulesContainer.style.flexDirection = 'column';
    collectRulesContainer.style.gap = '10px';  
    document.getElementById('how-3-content').appendChild(collectRulesContainer); 
    let collectRulesTitle =  document.createElement('span');
    collectRulesTitle.innerText = 'COLLECT';
    collectRulesContainer.appendChild(collectRulesTitle); 
    let collectRulesText =  document.createElement('span');
    collectRulesText.innerHTML = `
    <ul class="collect-list">
      <li>Collect lunc, luna, and other crypto to increase your score</li>
      <li>Luna powers up Luncman so that enemies are more vulnerable and can be LUNCPILLED for extra score</li>
    </ul>
    `;
    collectRulesContainer.appendChild(collectRulesText); 
    let points = ['= 1 pts', '= 10 pts', '= 100 pts', '= 200 pts', '= 300 pts', '= 400 pts'];
    let imageUrls = ['/style/graphics/spriteSheets/pickups/luncdot.webp', '/style/graphics/spriteSheets/pickups/luna2.webp', '/style/graphics/spriteSheets/pickups/bitcoin.webp', '/style/graphics/spriteSheets/pickups/atom.webp', '/style/graphics/spriteSheets/pickups/eth.webp', '/style/graphics/spriteSheets/pickups/solana.webp'];
      
    let collectImgContainer = document.createElement('div');
    collectImgContainer.style.position = 'absolute';
    collectImgContainer.style.top = '27%';
    collectRulesContainer.appendChild(collectImgContainer);
    for (let i = 0; i < points.length; i++) {
      let rulesCaptions = document.createElement('div');
      rulesCaptions.style.marginBottom = '5px';
      let img = document.createElement('img');
      img.src = imageUrls[i];
      img.style.marginRight = '10px'; 
      img.style.height = '35px';
      rulesCaptions.appendChild(img);
        
      let textNode = document.createTextNode(points[i]);
      rulesCaptions.appendChild(textNode);
        
      collectImgContainer.appendChild(rulesCaptions);
    }
    
    let attackRulesContainer = document.createElement('div');
    attackRulesContainer.style.color = 'white';
    attackRulesContainer.style.position = 'absolute';
    attackRulesContainer.style.height = '97%';
    attackRulesContainer.style.width = '75%';
    attackRulesContainer.style.top = '5%';
    attackRulesContainer.style.left = '50%';
    attackRulesContainer.style.transform = 'translateX(-50%)';
    attackRulesContainer.style.display = 'flex';
    attackRulesContainer.style.alignItems = 'center';
    attackRulesContainer.style.flexDirection = 'column';
    attackRulesContainer.style.gap = '10px';  
    document.getElementById('how-3-content').appendChild(attackRulesContainer); 
    let attackRulesTitle =  document.createElement('span');
    attackRulesTitle.innerText = 'ATTACK';
    attackRulesContainer.appendChild(attackRulesTitle); 
    let attackRulesText =  document.createElement('span');
    attackRulesText.innerHTML = `
    <ul class="rules-list">
      <li>Luncman obtains a new attack every 10 seconds, maxing out at 3. Collecting crypto boosts this charging speed!</li>
      <li>Use Luncman's dash and luna powerup to maximize damage to enemies</li>
      <li>No attacks? Steer clear of enemies to keep Luncman alive</li>
    </ul>
    `;
    attackRulesContainer.appendChild(attackRulesText); 

    let rulesContainers = [metaRulesContainer, collectRulesContainer, attackRulesContainer];
    let currentRulesIndex = 0;

    function showRulesContainer(index) {
        // Hide all rules containers
        for (let container of rulesContainers) {
            container.style.display = 'none';
        }

        // Show the selected rules container
        rulesContainers[index].style.display = 'flex';
    }

    // Show the initial rules container
    showRulesContainer(currentRulesIndex);

    rulesButtonLeft.addEventListener('click', () => {
        // Decrement the index, wrapping around to the end if necessary
        currentRulesIndex = (currentRulesIndex - 1 + rulesContainers.length) % rulesContainers.length;
        showRulesContainer(currentRulesIndex);
    });

    rulesButtonRight.addEventListener('click', () => {
        // Increment the index, wrapping around to the start if necessary
        currentRulesIndex = (currentRulesIndex + 1) % rulesContainers.length;
        showRulesContainer(currentRulesIndex);
    });



    //rewards
    let rewardsText = document.createElement('div');
    rewardsText.className = 'reward-text';
    rewardsText.innerHTML = `
    <ul class="rewards-list">
      <li>Playing Luncman can occassionally grant you free glochips, which can be opened at the glmoint station for arcade nfts</li>
      <li>Any score over 1000 is eligble for a chance to win a glochip</li>
      <li>The higher your score the more likely to win a glochip & that glochip is more likely to be more rare</li>
      <li>Your performance is a percentage calculated by dividing your score by the global Luncman highscore</li>
    </ul>
    `;
    let rewardsTextstyle = document.createElement('style');
    rewardsTextstyle.innerHTML = `
      .rewards-list li {
        margin-bottom: 30px;
        font-size: 1.6vh;
      }
    `;
    document.head.appendChild(rewardsTextstyle);
    document.getElementById('how-4-content').appendChild(rewardsText);
    let rewardGlochips = document.createElement('div');
    rewardGlochips.style.position = 'absolute';
    rewardGlochips.style.bottom = '-2%';
    rewardGlochips.style.color = 'white';
    rewardGlochips.style.display = 'flex';
    rewardGlochips.style.width = '100%';
    rewardGlochips.style.justifyContent = 'space-around';
    document.getElementById('how-4-content').appendChild(rewardGlochips);
    let rewardGenericContainer = document.createElement('div');
    rewardGenericContainer.className = 'reward-container';
    let rewardGenericImage = document.createElement('img');
    rewardGenericImage.src = '/style/graphics/token_images/glochips/generic_glochip_preview.webp';
    rewardGenericImage.style.height = '9vh';
    rewardGenericImage.style.marginBottom = '10px';
    let rewardGenericDesc = document.createElement('span');
    rewardGenericDesc.innerText = 'Generic Glochip';
    rewardGenericDesc.style.fontSize = '1vw';
    rewardGenericContainer.appendChild(rewardGenericImage);
    rewardGenericContainer.appendChild(rewardGenericDesc);
    let rewardEsotericContainer = document.createElement('div');
    rewardEsotericContainer.className = 'reward-container';
    let rewardEsotericImage = document.createElement('img');
    rewardEsotericImage.src = '/style/graphics/token_images/glochips/esoteric_glochip_preview.webp';
    rewardEsotericImage.style.height = '9vh';
    rewardEsotericImage.style.marginBottom = '10px';
    let rewardEsotericDesc = document.createElement('span');
    rewardEsotericDesc.innerText = 'Esoteric Glochip';
    rewardEsotericDesc.style.fontSize = '1vw';
    rewardEsotericContainer.appendChild(rewardEsotericImage);
    rewardEsotericContainer.appendChild(rewardEsotericDesc);
    let rewardSpectralContainer = document.createElement('div');
    rewardSpectralContainer.className = 'reward-container';
    let rewardSpectralImage = document.createElement('img');
    rewardSpectralImage.src = '/style/graphics/token_images/glochips/spectral_glochip_preview.webp';
    rewardSpectralImage.style.height = '9vh';
    rewardSpectralImage.style.marginBottom = '10px';
    let rewardSpectralDesc = document.createElement('span');
    rewardSpectralDesc.innerText = 'Spectral Glochip';
    rewardSpectralDesc.style.fontSize = '1vw';
    rewardSpectralContainer.appendChild(rewardSpectralImage);
    rewardSpectralContainer.appendChild(rewardSpectralDesc);
    rewardGlochips.appendChild(rewardGenericContainer);
    rewardGlochips.appendChild(rewardEsotericContainer);
    rewardGlochips.appendChild(rewardSpectralContainer);
    
    //tips
    let tipsText = document.createElement('div');
    tipsText.className = 'tips-text';
    tipsText.innerHTML = `
    <ul class="tips-list">
      <li>Efficiently defeat enemies, ideally in 1-2 hits.</li>
      <li>Aim for collateral and chain kills for bonus points.</li>
      <li>Complete levels swiftly to minimize score decay.</li>
      <li>Collect as many items as possible, focusing on luncpilling and gathering all 'fruit'.</li>
    </ul>
    `;
    document.getElementById('how-5-content').appendChild(tipsText);
    let tipsTextstyle = document.createElement('style');
    tipsTextstyle.innerHTML = `
      .tips-list li {
        margin-bottom: 60px;
        font-size: 1.75vh;
        line-height: 1.75;
      }
    `;
    document.head.appendChild(tipsTextstyle);
    //updates
    let updatesText = document.createElement('div');
    updatesText.className = 'updates-text';
    updatesText.innerHTML = `
    <ul class="updates-list">
      <li>glo indev (in-development) v1 will contain the first chapter of LUNCMAN, encompassing the first 4 levels of the game</li>
      <li>LUNCMAN will be updated chapter by chapter over time until the full game and story is released.</li>
      <li>As glo is still in development, occasional glitches are expected, please let us know and fixes will be provided ASAP. </li>
      <li>Look out for more features, game modes, nfts,  and levels coming out on a rolling basis!</li>
    </ul>
    `;
    document.getElementById('how-6-content').appendChild(updatesText);
    let updatesTextstyle = document.createElement('style');
    updatesTextstyle.innerHTML = `
      .updates-list li {
        margin-bottom: 40px;
        font-size: 1.75vh;
        line-height: 1.75;
      }
    `;
    document.head.appendChild(updatesTextstyle);

  } else {
    this.howToPlaySection.style.display = 'block';
  }

  let radioInputs = document.querySelectorAll('.how-input input');
  radioInputs.forEach((input) => {
    input.addEventListener('change', (event) => {
      let howContent = document.querySelectorAll('.how-content');
      howContent.forEach((content) => {
        content.style.display = 'none';
      });
      let selectedContent = document.getElementById(`${event.target.id}-content`);
      selectedContent.style.display = 'block';
    });
  });

  }

  createAboutSection() {
    this.aboutSection = document.getElementById("aboutSection");
    if (!this.aboutSection) {
      this.aboutSection = document.createElement('div');
      this.aboutSection.id = "aboutSection";
      this.aboutSection.style.color = 'white';
      this.aboutSection.style.zIndex = 6;
      this.aboutSection.style.position = 'absolute';
      this.aboutSection.style.left = '50%';
      this.aboutSection.style.transform = 'translate(-50%, -50%)';
      this.aboutSection.style.width = '85%';
      if (isMobile()) {
        this.aboutSection.style.fontSize = '1.1vh';  // Increase font size
        this.aboutSection.style.lineHeight = '1';  // Increase space between lines
        this.aboutSection.style.top = '40%';
      } else {
        this.aboutSection.style.fontSize = '1.75vh';  // Increase font size
        this.aboutSection.style.lineHeight = '2';  // Increase space between lines
        this.aboutSection.style.top = '55%';
      }
      this.aboutSection.style.textAlign = 'center'; // Center text
      this.aboutSection.style.display = 'flex';
      this.aboutSection.style.flexDirection = 'column';
      this.aboutSection.style.justifyContent = 'center';
      this.aboutSection.style.alignItems = 'center';
  
      // Create and append the text element
      this.textElement = document.createElement('p');
      this.textElement.textContent = "Luncman, a symbol of triumph amidst improbable odds, embodies the essence of a Faustian tale. Through its satirical portrayal of the Terra crash, Luncman serves as a metaphorical vessel for embracing the power of letting go and embracing the future. Just as Faust pursued knowledge and sought extraordinary feats, Luncman defies the shackles of defeat to rise above and conquer the enigmatic FUDders. In the face of adversity, Luncman emerges as a beacon of resilience, reminding us that our past does not define us, but rather, it fuels our determination to forge a brighter path ahead. It is a poignant reminder to seize the present moment, transcend our limitations, and embrace the limitless possibilities that await us.";
      this.aboutSection.appendChild(this.textElement);
  
      // Append the aboutSection to the document body or any other desired parent element
      this.mainMenuContainer.appendChild(this.aboutSection);
    } else {
      this.aboutSection.style.display = 'flex';
    }
  }
}

class Dashboard {
  constructor() {
    this.username = window.client.gloInfo.username;
    console.log('dashboard name', this.username)

    // add an event listener for 'receivedPlayerNfts' event
    window.addEventListener('receivedPlayerNfts', () => {
      if (window.client.activePlayer) return;
      this.setLuncmanSource();
    });

    window.addEventListener('sessionCreated', this.updateDashboard.bind(this));

    this.createDashboard();
  }
  
  updateDashboard() {
    this.updateName();
    this.setLuncmanSource();
  }

  setLuncmanSource() {
      if (window.client.gloInfo.activeLuncman) {
        this.luncPicImg.src = "style/graphics/" + window.client.gloInfo.activeLuncman.metadata.gameImages.dashboard['dash'];
      } else {
        this.luncPicImg.src = "js/background/Luncman.gif";
      }
  }

  createDashboard() {
    this.dashboard = document.createElement('div');
    this.dashboard.className = 'dashboard';
    this.dashboard.style.color = 'white';
    this.luncPic = document.createElement('div');
    this.luncPic.className = 'picture';
    this.luncPicImg = document.createElement('img');
    this.luncPicImg.id = 'dashLuncPic';
    this.setLuncmanSource();
    this.luncPicImg.alt = "Your Picture";
    this.luncPic.appendChild(this.luncPicImg);
    this.dashName = document.createElement('div');
    this.greeting = document.createElement('div');
    this.login = document.createElement('div');
    this.login.className = 'login';
    this.guest = document.createElement('div');
    this.walletConnect = document.createElement('div');
    this.logOut  = document.createElement('div');
    this.logOut.className = 'logout';
    this.nameDisplay = document.createElement('div');
    
    // Appending the elements to the dashboard
    this.dashboard.appendChild(this.luncPic);
    this.dashboard.appendChild(this.dashName);
    this.dashboard.appendChild(this.greeting);
    this.dashboard.appendChild(this.login);
    this.dashboard.appendChild(this.guest);
    this.dashboard.appendChild(this.walletConnect);
    this.dashboard.appendChild(this.logOut);
    this.dashboard.appendChild(this.nameDisplay);

    // Appending the dashboard to the main-menu-container div
    const mainMenuContainer = document.getElementById('main-menu-container');
    mainMenuContainer.appendChild(this.dashboard);

    this.showDashboard();
  }

  showDashboard() {
    this.dashboard.style.display = 'flex';
    this.luncPic.style.display = 'flex';
    this.dashName.style.display = 'flex';
    this.greeting.style.display = 'flex';
    this.login.style.display = 'flex';
    this.guest.style.display = 'flex';
    this.walletConnect.style.display = 'flex';
    this.logOut.style.display = 'flex';
    this.nameDisplay.style.display = 'flex';
  
    this.updateName();
    this.setLuncmanSource();
  }

  //update name
  updateName() {
    this.checkForUsername();
    this.greeting.innerText = `Good Luck, `;
    this.dashName.innerText = this.username + '!';
    this.dashName.style.fontSize = '2.5vh';
    this.dashName.style.position = 'absolute';
    this.dashName.style.top = '30%';
    this.greeting.style.top = '15%';
    this.greeting.style.fontSize = '2.5vh';
    this.greeting.style.position = 'absolute';
    this.updateDashNameFontSize();
  }

  checkForUsername() {
    const username = window.client.gloInfo.username;
    if (username) {
      this.username = username;
    } else {
      this.username = 'guest';
    }
  }

  updateDashNameFontSize() {
    if (this.username) {
      if (this.username.length > 20) {
        this.dashName.innerText = this.username.substring(0, 8) + '...' + this.username.substring(this.username.length - 5) + '!';
        this.dashName.style.fontSize = '1.5vh';
      } else {
        this.dashName.innerText = this.username + '!';
        this.dashName.style.fontSize = '2vh';
      }
      // this.dashName.innerText = this.username + '!';
      // this.dashName.style.fontSize = '1.5vh';
    }
  }

  remove() {
    // Remove the dashboard element from the DOM
    if (this.dashboard && this.dashboard.parentNode) {
      this.dashboard.parentNode.removeChild(this.dashboard);
    }
    
    // Remove event listeners to prevent memory leaks
    window.removeEventListener('receivedPlayerNfts', this.receivedPlayerNftsHandler);
    window.removeEventListener('sessionCreated', this.updateDashboard.bind(this));

    // Nullify properties to help with garbage collection
    this.dashboard = null;
    this.luncPic = null;
    this.luncPicImg = null;
    this.dashName = null;
    this.greeting = null;
    this.login = null;
    this.guest = null;
    this.walletConnect = null;
    this.logOut = null;
    this.nameDisplay = null;
  }
}

async function loadFirstLevelMaze() {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await fetch('/levels/level_1/level_1.json');
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const levelData = await response.json();

      const mazeArray = levelData.mazeArray;
      const nextLevel = levelData.nextLevel;

      resolve(levelData);
    } catch (error) {
      console.error('Error loading first level maze:', error);
      reject(error);
    }
  });
}