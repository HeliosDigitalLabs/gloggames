class LuncMachine {
  constructor() {
    this.init();
    this.handleState(); 
    console.log('luncmachine constructor')
  }
  
  init() {
    this.contentContainer = document.getElementById('content-container');
    this.retroCover = document.getElementById('retro-cover');
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
      return;
    } else {
      // Create the rectangle
      this.homeElement = document.createElement('div');
      this.homeElement.id = 'luncElement';
      
      // Apply styles to the rectangle
      this.homeElement.style.position = 'absolute';
      this.homeElement.style.bottom = '0';  // Place it on the bottom edge
      this.homeElement.style.left = '50%';  // Start from the middle
      this.homeElement.style.transform = 'translateX(-50%)';  // Center it
      this.homeElement.style.width = '20vw';  // Width of the rectangle, adjust as needed
      this.homeElement.style.height = '50vh';  // Height of the rectangle, adjust as needed
      this.homeElement.style.backgroundColor = '#333';  // Color of the rectangle, adjust as needed
      
      // Add event listener for click event
      this.homeElement.addEventListener('click', this.switchState.bind(this));

      // Append the rectangle to the body
      document.body.appendChild(this.homeElement);
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
  }

  setLuncman() {
    //set luncman background
    // create main menu elements
    this.createGameCoordinator();

    window.videoBackground.transitionTo('main_static', () => {
    });

    // show gamescreen
    this.contentContainer.style.display = 'flex';
    this.retroCover.style.display = 'flex';
    this.gameUi = document.getElementById('game-ui');
    this.headerButtons = document.getElementById('header-buttons');
    this.headerButtons.style.visibility = 'hidden';
    this.gameUi.style.visibility = 'hidden';
    this.overflowMask.style.backgroundColor = 'black';
    this.createLuncMenu();
    if (!this.dashboard) {
      this.dashboard = new Dashboard();
    }
  }

  hideLuncman() {
    if (!this.contentContainer) {
      if (!this.retroCover) return;
      this.retroCover.style.display = 'none';
      return;
    } else {
      this.contentContainer.style.display = 'none';
      if (!this.retroCover) return;
      this.retroCover.style.display = 'none';
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

    // Load the first level
    this.gameCoordinator.setLevel(level1Data);
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

    this.playButton.addEventListener('click', this.gameCoordinator.startGameSequence.bind(this));
  }

  createLuncMenu() {
   // 1. Create playButton element
   if (!this.playButton) {
    this.playButton = document.createElement('div');
    this.playButton.id = 'credit-check';
    this.playButton.className = 'play-btn navigation-link';
    this.playButton.textContent = 'PLAY'; 
    this.addPlayButtonListener();

    // Append playButton to its parent container
    this.mainMenuContainer = document.querySelector('.main-menu-container');
    this.mainMenuContainer.appendChild(this.playButton);
  }

    // 3. Create howToPlay link
   if (!this.howToPlay) {
    this.howToPlay = document.createElement('a');
    this.howToPlay.href = '#';
    this.howToPlay.id = 'how-to-play';
    this.howToPlay.className = 'navigation-link';
    this.howToPlay.textContent = 'HOW-TO-PLAY';
    this.howToPlay.style.position = 'absolute';
    this.howToPlay.style.top = '43%';

    // You can append this link wherever appropriate in your DOM structure.
    // For the sake of this example, I'll append it to the mainMenuContainer.
    this.mainMenuContainer.appendChild(this.howToPlay);
  }
  }

  createHowToPlay() {
    let tabDiv = document.getElementById("howToPlayTabDiv");
    let tabs = [
      { 
        label: "Intro", 
        content: "Welcome to Luncman. Defy the odds and defend the LUNC mothership from the fiendish FUDders. Play for in-game NFTs and to mount the leaderboard and claim your status as the True LUNCMAN..." 
      },
      { 
        label: "Controls", 
        content: "Direction: WASD/Keyboard Arrows <br> Boost: Double Tap Direction <br> Attack: Spacebar <br>" 
      },
      { 
        label: "Rules", 
        content: "Defeat the FUDders to beat each level. Burn LUNC, collect crypto, and speedrun each level to max out your score. Attack the FUDders by charging up your charges and slash through your enemies. Charges generate over time and are boosted by LUNA2 and LUNC. Eating LUNA2 powers LUNCMAN and allows him to disable the FUDders and recieve bonus points." 
      },
      { 
        label: "Rewards", 
        content: "Coming Soon..." 
      },
      { 
        label: "Tips", 
        content: "Try boosting until you max out your charges to quickly defeat the FUDders. Camping their spawn is a risky tactic, but can provide quick wins!" 
      },
      { 
        label: "FAQ", 
        content: "Coming Soon..." 
      }
    ];
  
    if (!tabDiv) {
      let tabDiv = document.createElement("div");
      tabDiv.id = "howToPlayTabDiv";
      tabDiv.className = "tab";
      tabDiv.style.color = 'white';
      tabDiv.style.zIndex = 6;
      tabDiv.style.position = 'absolute';
      if (isMobile()) {
        tabDiv.style.top = '25%';
      } else {
        tabDiv.style.top = '33%';
      }
      tabDiv.style.left = '50%';
      tabDiv.style.transform = 'translate(-50%, -50%)';
  
      for (var i = 0; i < tabs.length; i++) {
        let tabButton = document.createElement("button");
        tabButton.className = "tablinks";
        tabButton.id = "tablinks";
  
        if (isMobile()) {
          tabButton.style.fontSize = '1vh';
        } else {
          tabButton.style.fontSize = '1.2vh';
        }
        tabButton.innerText = tabs[i].label;
        tabButton.style.pointerEvents = "auto"; // Enable pointer events
        tabButton.onclick = function(index) {
          return function() {
            openTab('Tab' + (index + 1));
          };
        }(i);
        tabDiv.appendChild(tabButton);
      }
  
      for (var i = 0; i < tabs.length; i++) {
        tabContent = document.createElement("div");
        tabContent.id = "Tab" + (i + 1);
        tabContent.className = "tabcontent";
        tabContent.innerText = tabs[i].content;
        tabContent.contentEditable = true;
        tabContent.style.color = 'white';
        tabContent.style.zIndex = 6;
        tabContent.style.position = 'absolute';
        tabContent.style.top = '42%';
        tabContent.style.left = '50%';
        tabContent.style.transform = 'translate(-50%, -50%)';
        tabContent.style.fontSize = '1.5vh';
        tabContent.style.display = 'none';
        if (isMobile()) {
          tabContent.style.width = '70%';  // Adjust width
        } else {
          tabContent.style.width = '50%';  // Adjust width
        }
        tabContent.style.lineHeight = '2';  // Adjust line height
        tabContent.style.whiteSpace = 'normal';  // Wrap text
        document.body.appendChild(tabContent);
  
        // Here, add conditions to change the style of specific tabs
        if (i === 2) { // Style for third tab
          tabContent.style.top = '45%';
          tabContent.style.fontSize = '1.2vh';
        }
        if (i === 3) { // Style for fourth tab
          tabContent.style.width = 'auto';
        }
        if (i === 5) { // Style for sixth tab
          tabContent.style.width = 'auto';
        }
  
      }
  
      document.body.appendChild(tabDiv);
    }
  
    tabDiv.style.display = "flex";
    for (var i = 0; i < tabs.length; i++) {
      let tabContent = document.getElementById("Tab" + (i + 1));
      tabContent.style.display = "none";
    }
  }

  openTab(tabName) {
    let tabContent = document.getElementById(tabName);
    if (tabContent) {
      let allTabContent = document.getElementsByClassName("tabcontent");
      for (var i = 0; i < allTabContent.length; i++) {
        allTabContent[i].style.display = "none";
      }
      tabContent.style.display = "flex";
    }
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
      if (isMobile()) {
        this.aboutSection.style.fontSize = '1.1vh';  // Increase font size
        this.aboutSection.style.lineHeight = '1';  // Increase space between lines
        this.aboutSection.style.top = '40%';
      } else {
        this.aboutSection.style.fontSize = '1.5vh';  // Increase font size
        this.aboutSection.style.lineHeight = '2.5';  // Increase space between lines
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
      document.body.appendChild(this.aboutSection);
    } else {
      this.aboutSection.style.display = 'flex';
    }
  }
}

class Dashboard {
  constructor() {
    this.username = window.client.gloInfo.username;
    console.log('dashboard name', this.username)

    this.createDashboard();
  }

  createDashboard() {
    this.dashboard = document.createElement('div');
    this.dashboard.className = 'dashboard';
    this.dashboard.style.color = 'white';
    this.luncPic = document.createElement('div');
    this.luncPic.className = 'picture';
    const luncPicImg = document.createElement('img');
    luncPicImg.src = "js/background/Luncman.gif";
    luncPicImg.alt = "Your Picture";
    this.luncPic.appendChild(luncPicImg);
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
  }

  //update name
  updateName() {
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

  updateDashNameFontSize() {
    if (this.username) {
      this.dashName.innerText = this.username + '!';
      
      if (!this.isMobile) {
        if (this.username.length > 20) {
          this.dashName.style.fontSize = '1.2vh';
        } else if (this.username.length > 15) {
          this.dashName.style.fontSize = '1.5vh';
        } else if (this.username.length > 11) {
          this.dashName.style.fontSize = '2vh';
        } else {
          this.dashName.style.fontSize = '2.5vh';  // Default font size
        }
      } else {
        if (this.username.length > 20) {
          this.dashName.style.fontSize = '0.8vh';
        } else if (this.username.length > 15) {
          this.dashName.style.fontSize = '.95vh';
        } else if (this.username.length > 11) {
          this.dashName.style.fontSize = '1.05vh';
        } else {
          this.dashName.style.fontSize = '1.25vh';  // Default font size for mobile
        }
      }
    }
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