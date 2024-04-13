class NftMachine {
  constructor(subdomain) {
      if (subdomain) this.subdomain = subdomain;
      this.init();
      this.handleState();
      console.log('NftMachine constructor called');
  }

  init() {
    this.contentContainer = document.getElementById('content-container');
    this.retroCover = document.getElementById('retro-cover');
    this.videoElement = document.getElementById('background-video2');
    window.addEventListener('WindowStateChanged', this.handleState.bind(this));
    // window.addEventListener('resize', () => this.setPositionAndSize());

    // Check if the subdomain is 'gloprint'
    const url = new URL(window.location);
    const path = url.pathname;
    console.log('path', path, url)
    if (path === '/gloprint') {
      this.initializing = true;
    }
  }

  handleState() {
      switch (window.windowState) {
          case 'home':
            console.log('Setting website to home state for NftMachine');
            this.createHomeElements();
            this.hideNftMachine();
            break;
          
          case 'nft':
            this.setNftMachine();
            this.hideHomeElements();
            // this.setPositionAndSize();
            break;

          case 'luncman':
            this.hideHomeElements();
            this.hideNftMachine();
            break;

          case 'leaderboard':
            this.hideHomeElements();
            this.hideNftMachine();
            break;

          case 'mint':
            this.setMintMachine();
            break;

          case 'marketplace':
            this.setMarketplaceMachine();
            break;

          default:
              console.log("No NftMachine state found");
              break;
      }
  }

  createHomeElements() {
      // Check if the rectangle with the ID 'nftElement' already exists
      const existingElement = document.getElementById('nftElement');
      if (existingElement) {
          existingElement.style.display = 'flex';
          return; // If it exists, exit the function
      }

      // Create the rectangle
      this.rectangle = document.createElement('div');
      document.body.appendChild(this.rectangle);
      this.rectangle.id = 'nftElement';

      // Apply styles to the rectangle
      this.rectangle.style.position = 'absolute';
      this.rectangle.style.backgroundColor = 'transparent';  // Make the inside of the rectangle transparent
      this.rectangle.style.cursor = 'pointer';
      window.videoBackground.addSetElement('nftElement', 341.19, 644.6957, 271.75, 1231.38);
      // this.rectangle.style.border = '2px solid green';  // Add a blue border

      // Add event listener for click event
      this.rectangle.addEventListener('click', this.switchState.bind(this));

      // Create the image
      this.hoverImage = document.createElement('img');
      this.hoverImage.src = '/style/graphics/hover/hover_NFTs.svg';
      this.hoverImage.style.opacity = '0'; // Hide the image initially
      this.hoverImage.style.position = 'absolute';
      this.hoverImage.style.height = '100%'; // Adjust as needed
      this.hoverImage.style.top = '0';
      this.hoverImage.style.left = '50%';
      this.hoverImage.style.transform = 'translateX(-50%)';

      this.hoverImage.style.pointerEvents = 'none'; // Disable pointer events

      // Add event listener for hover event
      this.rectangle.addEventListener('mouseover', () => {
        gsap.to(this.hoverImage, {autoAlpha: 1, duration: 0.5}); // Fade in the image when hovered over
      });
      this.rectangle.addEventListener('mouseout', () => {
        gsap.to(this.hoverImage, {autoAlpha: 0, duration: 0.5}); // Fade out the image when not hovered over
      });
      document.body.appendChild(this.hoverImage);
  }

  hideHomeElements() {
      console.log('Hiding home elements for NftMachine');
      const existingElement = document.getElementById('nftElement');
      if (existingElement) {
          existingElement.style.display = 'none';
      }
  }

  switchState() {
      console.log('Switching state for NftMachine');
      window.windowState = 'nft';
      this.rectangle.style.display = 'none';
      window.luncMachine.homeElement.style.display = 'none';
      window.leaderboard.rectangle.style.display = 'none';
      window.videoBackground.transitionTo('home_printer', () => {
        // Dispatch a custom event to notify that windowState has changed
        const event = new Event('WindowStateChanged');
        window.dispatchEvent(event);
        console.log('Window state:', window.windowState);
      });

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

  initGlo() {
    if (this.elementsSet) return;
    this.elementsSet = true;

    if (!window.glotag) {
      let glotagMode;
      if (window.client.sessionCreated) {
        glotagMode = 'calling_card';
      } else {
        glotagMode = 'guest';
      }
      window.glotag = new Glotag(glotagMode);
    }

    if (!window.glogo) {
      window.glogo = new Glogo();
    }

    if (!window.chat) {
      window.chat = new Chat();
    }

    if (!window.luncMachine) {
      window.luncMachine = new LuncMachine();
    }

    if (!window.leaderboard) {
      window.leaderboard = new Leaderboard();
      console.log('leaderboard', window.leaderboard)
    }
  }

  setNftMachine() {
    if (this.initializing) {
      console.log('initializing')
      window.videoBackground.transitionTo('home_printer', () => {
        this.createMarketplaceCage();
        this.createMintCage();
        this.initializing = false;
      });
      return;
    }
    console.log('not initializing')
      this.createMarketplaceCage();
      this.createMintCage();
  }

  setMintMachine() {
    this.createMarketplaceCage();
    this.createMintCage();
    this.handleMintRoute();
    this.initGlo();
  }

  setMarketplaceMachine() {
    console.log('setting marketplace machien')
    this.createMarketplaceCage();
    this.createMintCage();
    this.handleMarketplaceRoute();
    this.initGlo();
  }

  hideNftMachine() {
      if (this.marketplace) this.marketplace.style.display = 'none';
      if (this.mint) this.mint.style.display = 'none';
      // Hide any other NftMachine-specific elements if needed
  }

  createMarketplaceCage() {
    console.log('creating marketplace cage')
    if (!this.marketplace) {
      new Promise((resolve, reject) => {
        this.marketplace = document.createElement('div');
        this.marketplace.id = 'gloMartCage';
        this.marketplace.style.backgroundColor = 'transparent';
        this.marketplace.style.position = 'absolute';
        resolve(this.marketplace);
      })
      .then((marketplaceElement) => {
        document.body.appendChild(this.marketplace);
        window.videoBackground.addSetElement('gloMartCage', 795.58, 705.69, 287.34, 198.86);
        this.configureElement(marketplaceElement);
      })
      .catch((error) => {
        console.error('Error creating marketplace element:', error);
      });
      return;
    }
    this.marketplace.style.display = 'flex';
  }

  createMintCage() {
    if (!this.mint) {
      new Promise((resolve, reject) => {
        this.mint = document.createElement('div');
        this.mint.id = 'gloMintCage';
        this.mint.style.backgroundColor = 'transparent';
        this.mint.style.position = 'absolute';
        resolve(this.mint);
      })
      .then((mintElement) => {
        document.body.appendChild(this.mint);
        window.videoBackground.addSetElement('gloMintCage', 590.47, 546.03, 374.80, 1105.64);
        this.configureElement(mintElement);
      })
      .catch((error) => {
        console.error('Error creating mint element:', error);
      });
      return;
    }
    this.mint.style.display = 'flex';
  }


  configureElement(element) {
      // Apply initial styles to the div
      element.style.backgroundColor = 'transparent';
      element.style.position = 'absolute';
      element.style.zIndex = '1';
      element.style.cursor = 'pointer';

      // element.addEventListener('mouseenter', () => {
      //     element.style.boxShadow = '0 0 15px 5px rgba(255, 255, 255, 0.8)';
      //     element.style.border = '3px solid white';
      // });

      // element.addEventListener('mouseleave', () => {
      //     element.style.boxShadow = 'none';
      //     element.style.border = '3px solid transparent';
      // });

      if (element === this.marketplace) {
        element.addEventListener('click', this.handleMarketplaceClick.bind(this));
    } else if (element === this.mint) {
        element.addEventListener('click', this.handleMintClick.bind(this));
    }
  }

  hideCages() {
    this.mint.style.display = 'none';
    this.marketplace.style.display = 'none';
  }

  handleMarketplaceClick() {
    console.log("marketplace clicked!");
    this.hideCages();
    window.windowState = 'marketplace';
    window.videoBackground.transitionTo('printer_glomart', () => {
      if (!this.gloMartInstance) this.gloMartInstance = new GloMart();
      // Dispatch a custom event to notify that windowState has changed
      const event = new Event('WindowStateChanged');
      window.dispatchEvent(event);
    });
  }

  handleMarketplaceRoute() {
    console.log("marketplace clicked!");
    if (!this.gloMartInstance) {
      if (this.subdomain) {
        this.gloMartInstance = new GloMart(this.subdomain);
        this.subdomain = null;
      } else {
        this.gloMartInstance = new GloMart();
      }
    }
    this.hideCages();
  }

  handleMintClick() {
    console.log("mint clicked!");
    if (!this.gloMintInstance) this.gloMintInstance = new GloMint();
    this.hideCages();
    window.windowState = 'mint';
    window.videoBackground.transitionTo('printer_glomint', () => {
      // Dispatch a custom event to notify that windowState has changed
      const event = new Event('WindowStateChanged');
      window.dispatchEvent(event);
    });
  }

  handleMintRoute() {
    console.log("marketplace clicked!");
    if (!this.gloMintInstance) this.gloMintInstance = new GloMint();
    this.hideCages();
  }


  setPositionAndSize() {
    console.log('setting position and size')
    if (!this.videoElement) {
      this.videoElement = document.getElementById('background-video2');
    }
    const videoBounds = this.videoElement.getBoundingClientRect();

    const videoWidth = 1920;
    const videoHeight = 1080;
    const rectWidth = 800;
    const rectHeight = 475;
    const fixedTop = 225;
    const fixedLeft = 75;

    const boundsAspectRatio = videoBounds.width / videoBounds.height;
    const videoAspectRatio = videoWidth / videoHeight;

    let widthRatio, heightRatio, offsetTop = 0, offsetLeft = 0;


    if (boundsAspectRatio < videoAspectRatio) {
      console.log('op1: boundsAR:', boundsAspectRatio, 'videoAR:', videoAspectRatio );
      // Pillarboxed (vertical bars)
      heightRatio = videoBounds.height / videoHeight;
      widthRatio = heightRatio;
      offsetLeft = (videoBounds.width - videoWidth * widthRatio) / 2;
  } else if (boundsAspectRatio > videoAspectRatio) {
    console.log('op2: boundsAR:', boundsAspectRatio, 'videoAR:', videoAspectRatio );
      // Letterboxed (horizontal bars)
      widthRatio = videoBounds.width / videoWidth;
      heightRatio = widthRatio;
      offsetTop = (videoBounds.height - videoHeight * heightRatio) / 2;
  } else {
    console.log('op3: boundsAR:', boundsAspectRatio, 'videoAR:', videoAspectRatio );
      // No boxing
      widthRatio = videoBounds.width / videoWidth;
      heightRatio = videoBounds.height / videoHeight;
      // No need to set offsets since they remain 0
  }
  

    const calculatedTop = videoBounds.top + fixedTop * heightRatio + offsetTop;
    const calculatedLeft = videoBounds.left + fixedLeft * widthRatio + offsetLeft;
    const calculatedWidth = rectWidth * widthRatio;
    const calculatedHeight = rectHeight * heightRatio;

    this.marketplace.style.top = `${calculatedTop}px`;
    this.marketplace.style.left = `${calculatedLeft}px`;
    this.marketplace.style.width = `${calculatedWidth}px`;
    this.marketplace.style.height = `${calculatedHeight}px`;

    const mintWidth = 525;
    const mintHeight = 375;
    
    this.setElementPositionAndSize(this.marketplace, videoBounds, rectWidth, rectHeight, 225, 75, widthRatio, heightRatio, offsetTop, offsetLeft);
    this.setElementPositionAndSize(this.mint, videoBounds, mintWidth, mintHeight, 375, 1250, widthRatio, heightRatio, offsetTop, offsetLeft);
  }
  
  setElementPositionAndSize(element, videoBounds, rectWidth, rectHeight, fixedTop, fixedLeft, widthRatio, heightRatio, offsetTop, offsetLeft) {
    const calculatedTop = videoBounds.top + fixedTop * heightRatio + offsetTop;
    const calculatedLeft = videoBounds.left + fixedLeft * widthRatio + offsetLeft;
    const calculatedWidth = rectWidth * widthRatio;
    const calculatedHeight = rectHeight * heightRatio;

    element.style.top = `${calculatedTop}px`;
    element.style.left = `${calculatedLeft}px`;
    element.style.width = `${calculatedWidth}px`;
    element.style.height = `${calculatedHeight}px`;
  }
}

class Profile {
  constructor() {
    GloMart.activePage = 'Profile';
    GloMint.activeMintPage = 'Profile';
    this.navItems = ['Library', 'Friends', 'Listings', 'Favorites', 'Statistics', 'History']; 
    this.activeNavIndex = 0;
    this.createProfilePage();
  }

  createNavbar(profileContainer) {
    const navbar = document.createElement('div');
    navbar.style.display = 'flex';
    navbar.style.justifyContent = 'center';
    navbar.style.alignItems = 'center';
    navbar.style.position = 'absolute';
    navbar.style.top = '7%';
    navbar.style.left = '30%';
    navbar.style.width = '50%';

    const leftArrow = document.createElement('button');
    leftArrow.textContent = '<';
    leftArrow.onclick = () => this.changeNavItem(-1);
    navbar.appendChild(leftArrow);

    const activeNavItem = document.createElement('div');
    activeNavItem.id = 'activeNavItem';
    activeNavItem.textContent = this.navItems[this.activeNavIndex];
    activeNavItem.style.fontFamily = "Gabarito, sans-serif";
    activeNavItem.style.fontSize = '3.75rem';
    activeNavItem.style.fontWeight = '900';
    navbar.appendChild(activeNavItem);

    const rightArrow = document.createElement('button');
    rightArrow.textContent = '>';
    rightArrow.onclick = () => this.changeNavItem(1);
    navbar.appendChild(rightArrow);

    profileContainer.appendChild(navbar);
  }

  changeNavItem(direction) {
    this.activeNavIndex += direction;
    if (this.activeNavIndex < 0) this.activeNavIndex = this.navItems.length - 1;
    if (this.activeNavIndex > this.navItems.length - 1) this.activeNavIndex = 0;

    document.getElementById('activeNavItem').textContent = this.navItems[this.activeNavIndex];
    
    // Update content based on the active nav item
    document.getElementById('profileContent').textContent = 'Content for ' + this.navItems[this.activeNavIndex];
  }

  createProfilePage(){
      // Creating the container div
      const profileContainer = document.createElement('div');
      profileContainer.id = 'profileContainer';
      profileContainer.style.backgroundColor = 'white';
      profileContainer.style.position = 'absolute';
      profileContainer.style.height = '85%';
      profileContainer.style.width = '95%';
      profileContainer.style.top = '54%';
      profileContainer.style.left = '50%';
      profileContainer.style.transform = 'translate(-50%, -50%)';
      profileContainer.style.borderRadius = '100px';
      profileContainer.style.padding = '20px'; // Added padding to ensure content is inside border
      profileContainer.style.display = 'flex'; // Added for flex display
      profileContainer.style.alignItems = 'center'; // Center align items

      // Creating the circle div (representing profile picture)
      const profileCircle = document.createElement('div');
      profileCircle.style.width = '6rem'; // Example size
      profileCircle.style.height = '6rem';
      profileCircle.style.borderRadius = '50%'; // Makes it a circle
      profileCircle.style.backgroundColor = 'gray'; // Placeholder color
      profileCircle.style.marginRight = '20px'; // Space between circle and name
      profileCircle.style.position = 'absolute';
      profileCircle.style.top = '5%';
      profileCircle.style.left = '5%';

      // Creating the h2 element for the profile name
      const profileName = document.createElement('h2');
      profileName.classList.add('profile-name');
      profileName.textContent = 'terra...';  // Placeholder name for now
      profileName.style.position = 'absolute';
      profileName.style.top = '2.5%';
      profileName.style.left = '15%';
      profileName.style.fontSize = '3rem';
      profileName.style.fontFamily = "Gabarito, sans-serif";
      profileName.style.fontWeight = '800';

      // Appending the profileCircle and profileName to the profileContainer
      profileContainer.appendChild(profileCircle);
      profileContainer.appendChild(profileName);

      this.createNavbar(profileContainer);

      // Placeholder content div
      const contentArea = document.createElement('div');
      contentArea.id = 'profileContent';  // Added this line
      contentArea.style.position = 'absolute';
      contentArea.style.top = '40%'; // Place it below the navbar
      contentArea.textContent = 'Content for ' + this.navItems[this.activeNavIndex];
      profileContainer.appendChild(contentArea);
      
      document.body.appendChild(profileContainer);
    }
}

// Add Glomint class
class GloMint {
  constructor() {
    if (window.windowState == 'mint') this.handleState();
    window.addEventListener('WindowStateChanged', this.handleState.bind(this));
  }

  handleState() {
    switch (window.windowState) {
      case 'mint':
        this.createMintPageElements();
        this.createMintPageBackground();
        this.preloadLaser();
          break;

      default:
        this.hideMintPage();
          break;
    }
  }

  createMintPageBackground() {
    if (this.gloMintBackground) {
      this.gloMintBackground.style.display = 'flex';
    } else {
      this.gloMintBackground = document.createElement('div');
      this.gloMintBackground.id = 'gloMintBackground';
      this.gloMintBackground.style.position = 'fixed'; // Make it fixed position
      this.gloMintBackground.style.top = '0';          // Start from the top
      this.gloMintBackground.style.left = '0';         // Start from the left
      this.gloMintBackground.style.zIndex = '0';
      this.gloMintBackground.style.height = '100%';    
      this.gloMintBackground.style.width = '100%';
      this.gloMintBackground.style.backgroundColor = '#3f2a22';

      this.abstractVideo = document.createElement('video');
      this.abstractVideo.src = '/style/graphics/glomint.webm';
      this.abstractVideo.style.position = 'absolute';
      this.abstractVideo.style.width = '100%';
      this.abstractVideo.style.height = '110%';
      this.abstractVideo.style.opacity = '0.75';
      this.abstractVideo.style.objectFit = 'cover';
      this.abstractVideo.loop = true;
      this.abstractVideo.autoplay = true;
      this.abstractVideo.muted = true;
      this.gloMintBackground.appendChild(this.abstractVideo);
      document.body.appendChild(this.gloMintBackground);
    }
}
  
createMintPageElements() {
      // Create the parent div
      if (this.mintContainer) {
        this.mintContainer.style.display = 'flex';
        gsap.to(this.mintContainer, {
          opacity: 0.9725,
          duration: 0.5,
        });
        return
      }
      this.mintContainer = document.createElement('div');
      this.mintContainer.id = 'mintContainer';
      this.mintContainer.style.height = '83vh';
      this.mintContainer.style.width = '98vw'
      this.mintContainer.style.position = 'absolute';
      this.mintContainer.style.top = '13%';
      this.mintContainer.style.left = '50%';
      this.mintContainer.style.transform = 'translate(-50%, 0%)';
      this.mintContainer.style.zIndex = '1';
      this.mintContainer.style.flexDirection = 'column';
      this.mintContainer.style.display = 'flex';
      this.mintContainer.style.opacity = '0';

      gsap.to(this.mintContainer, {
        opacity: 0.9725,
        duration: 0.5,
      });

      // key container
      this.keyWindow = document.createElement('div');
      this.keyWindow.style.display = 'flex';
      this.keyWindow.style.flexDirection = 'column';
      this.keyWindow.style.width = '33%';
      this.keyWindow.style.height =  '100%';
      this.keyWindow.style.alignItems = 'center';
      this.keyWindow.style.position = 'relative';
      this.keyWindow.style.left = '69%';
      this.mintContainer.appendChild(this.keyWindow);

      //generic container
      this.genericKeyWindow = document.createElement('div');
      this.genericKeyWindow.id = 'genericKeyWindow';
      this.genericKeyWindow.className = 'genericKeyWindow';
      this.genericKeyWindow.style.position = 'relative';
      this.genericKeyWindow.style.height = '27.5%';
      this.genericKeyWindow.style.marginBottom = '10%';
      this.genericKeyWindow.style.display = 'flex';
      this.genericKeyWindow.style.justifyContent = 'center';
      this.genericKeyWindow.className = 'generic-key-window';
      this.keyWindow.appendChild(this.genericKeyWindow);
      this.genericKeyWindow.onclick = () => this.mintKey('generic');
      //loading thing here

      this.genericKeyImage = document.createElement('video');
      this.genericKeyImage.className = 'generic-key-image';
      this.genericKeyImage.src = '/style/graphics/token_images/holokeys/predemo_generic_key.webm';
      this.genericKeyImage.style.height = '50%';
      this.genericKeyImage.style.position = 'absolute';
      this.genericKeyImage.style.top = '12.5%';
      this.genericKeyImage.autoplay = true;
      this.genericKeyImage.loop = true;
      this.genericKeyImage.muted = true;
      this.genericKeyWindow.appendChild(this.genericKeyImage);

      // Add rotation animation
      // gsap.to(this.genericKeyImage, {
      //   rotationY: 360,
      //   repeat: -1, // -1 means repeat indefinitely
      //   ease: 'none', // Linear movement
      //   duration: 5, // Duration of one complete spin in seconds
      //   transformOrigin: "center center", // Ensures the rotation is around the center
      // });

      this.genericKeyLabel = document.createElement('div');
      this.genericKeyLabel.className = 'generic-key-text';
      this.genericKeyLabel.innerText = 'GENERIC KEY:  1 LUNA';
      this.genericKeyLabel.style.position = 'relative';
      this.genericKeyLabel.style.color = 'white';
      this.genericKeyLabel.style.fontSize = '1.5vh';
      this.genericKeyLabel.style.top = '75%';
      this.genericKeyWindow.appendChild(this.genericKeyLabel);

      //esoteric containter
      this.esotericKeyWindow = document.createElement('div');
      this.esotericKeyWindow.id = 'esotericKeyWindow';
      this.esotericKeyWindow.className = 'esoteric-key-window';
      this.esotericKeyWindow.style.marginBottom = '10%';
      // this.esotericKeyWindow.innerText = 'mint esoteric key';
      this.esotericKeyWindow.style.position = 'relative';
      this.esotericKeyWindow.style.height = '27.5%';
      this.esotericKeyWindow.style.display = 'flex';
      this.esotericKeyWindow.style.justifyContent = 'center';
      this.esotericKeyWindow.className = 'esoteric-key-window';
      this.keyWindow.appendChild(this.esotericKeyWindow);
      this.esotericKeyWindow.onclick = () => this.mintKey('esoteric');

      this.esotericKeyImage = document.createElement('video');
      this.esotericKeyImage.className = 'esoteric-key-image';
      this.esotericKeyImage.src = '/style/graphics/token_images/holokeys/predemo_esoteric_key.webm';
      this.esotericKeyImage.style.height = '50%';
      this.esotericKeyImage.style.position = 'absolute';
      this.esotericKeyImage.style.top = '12.5%';
      this.esotericKeyImage.autoplay = true;
      this.esotericKeyImage.loop = true;
      this.esotericKeyImage.muted = true;
      this.esotericKeyWindow.appendChild(this.esotericKeyImage);

      
      // Add rotation animation
      // gsap.to(this.esotericKeyImage, {
      //   rotationY: 360,
      //   repeat: -1, // -1 means repeat indefinitely
      //   ease: 'none', // Linear movement
      //   duration: 5, // Duration of one complete spin in seconds
      //   transformOrigin: "center center", // Ensures the rotation is around the center
      // });

      this.esotericKeyLabel = document.createElement('div');
      this.esotericKeyLabel.className = 'esoteric-key-text';
      this.esotericKeyLabel.innerText = 'ESOTERIC KEY:  10 LUNA';
      this.esotericKeyLabel.style.position = 'relative';
      this.esotericKeyLabel.style.color = 'white';
      this.esotericKeyLabel.style.fontSize = '1.5vh';
      this.esotericKeyLabel.style.top = '75%';
      this.esotericKeyWindow.appendChild(this.esotericKeyLabel);


      //spectral window
      this.spectralKeyWindow = document.createElement('div');
      this.spectralKeyWindow.id = 'spectralKeyWindow';
      this.spectralKeyWindow.className = 'spectralKeyWindow';
      // this.spectralKeyWindow.innerText = 'mint spectral key';
      this.spectralKeyWindow.style.position = 'relative';
      this.spectralKeyWindow.style.height = '27.5%';
      this.spectralKeyWindow.style.display = 'flex';
      this.spectralKeyWindow.style.justifyContent = 'center';
      this.spectralKeyWindow.className = 'spectral-key-window';
      this.keyWindow.appendChild(this.spectralKeyWindow);
      this.spectralKeyWindow.onclick = () => this.mintKey('spectral');

      this.spectralKeyImage = document.createElement('video');
      this.spectralKeyImage.className = 'spectral-key-image';
      this.spectralKeyImage.src = '/style/graphics/token_images/holokeys/predemo_spectral_key.webm';
      this.spectralKeyImage.style.height = '50%';
      this.spectralKeyImage.style.position = 'absolute';
      this.spectralKeyImage.style.top = '12.5%';
      this.spectralKeyImage.autoplay = true;
      this.spectralKeyImage.loop = true;
      this.spectralKeyImage.muted = true;
      this.spectralKeyWindow.appendChild(this.spectralKeyImage);

      // Add rotation animation
      // gsap.to(this.spectralKeyImage, {
      //   rotationY: 360,
      //   repeat: -1, // -1 means repeat indefinitely
      //   ease: 'none', // Linear movement
      //   duration: 5, // Duration of one complete spin in seconds
      //   transformOrigin: "center center", // Ensures the rotation is around the center
      // });

      this.spectralKeyLabel = document.createElement('div');
      this.spectralKeyLabel.className = 'spectral-key-text';
      this.spectralKeyLabel.innerText = 'SPECTRAL KEY: 50 LUNA';
      this.spectralKeyLabel.style.position = 'relative';
      this.spectralKeyLabel.style.color = 'white';
      this.spectralKeyLabel.style.fontSize = '1.5vh';
      this.spectralKeyLabel.style.top = '75%';
      this.spectralKeyWindow.appendChild(this.spectralKeyLabel);

  
      // Create the top div
      this.mintWindow = document.createElement('div');
      this.mintWindow.className = 'mint-element';
      this.mintWindow.id = 'mint-window';
      this.mintWindow.style.position = 'absolute';
      this.mintWindow.style.zIndex = '3';
      this.mintWindow.style.width = '65%';
      this.mintWindow.style.left = '4%';
      this.mintWindow.style.top = '0';
      this.mintWindow.style.height = '99%';
      this.mintWindow.style.borderRadius = '100px';
      this.mintWindow.style.display = 'flex'; // to align items side by side
      this.mintWindow.style.alignItems = 'center'; // to center align vertically
      this.mintWindow.style.justifyContent = 'space-between'; // space out the items
      this.mintWindow.style.background = '#795445';
      this.mintWindow.style.borderRadius = '8px';
      this.mintWindowTools = document.createElement('div');
      this.mintWindowTools.className = 'mint-tools';

      const colors = ['red', 'yellow', 'green'];

      colors.forEach(color => {
        const circle = document.createElement('div');
        circle.className = 'mint-circle';

        const box = document.createElement('span');
        box.className = `${color} box`;

        circle.appendChild(box);
        this.mintWindowTools.appendChild(circle);
      });

      this.mintWindow.appendChild(this.mintWindowTools);

      //TITLE
      this.mintTitle = document.createElement('div');
      this.mintTitle.className = 'mint-title';
      this.mintTitleText = document.createElement('h1');
      this.mintTitleText.className = 'mint-title-text';
      this.mintTitleText.innerText = 'ACTIVATE GLOCHIP';
      this.mintTitle.appendChild(this.mintTitleText);
      this.mintWindow.appendChild(this.mintTitle);
      
  
      // Left side container for Price label and dropdown
      this.caseContainer = document.createElement('div');
      this.caseContainer.style.display = 'flex';
      this.caseContainer.style.flexDirection = 'column'; // stack label and dropdown vertically
      this.caseContainer.style.alignItems = 'center'; 
      this.caseContainer.style.flex = '1';
      this.caseContainer.style.zIndex = '1';
  
      // this.caseDropdown = document.createElement('select');
      // this.caseDropdown.style.flex = '1';
  
      // this.caseDropdown.addEventListener('change', () => {
      //   const selectedTokenID = this.caseDropdown.value;
      //   console.log('Selected GloChip Token ID:', selectedTokenID);
      //   // Perform actions based on the selected Token ID
      // });
      
      // this.caseContainer.appendChild(this.caseDropdown);

      //card for selection
      this.caseSelectCard = document.createElement('div');
      this.caseSelectCard.className = 'case-select-card';
      this.caseSelectCard.id = 'empty-case-select';
      this.caseSelectCard.style.cursor = 'pointer';
      this.caseSelectCard.addEventListener('click', () => {
        this.selectGlochip();
      });
      this.caseContainer.appendChild(this.caseSelectCard);
      this.caseSelectText = document.createElement('h2');
      this.caseSelectText.innerText = 'Select GloChip';
      this.caseSelectText.className = 'case-select-text';
      this.caseSelectCard.appendChild(this.caseSelectText);

      this.mintWindow.appendChild(this.caseContainer);
  
      // Create the middle big plus sign
      this.mintCard = document.createElement('div');
      this.mintCard.className = 'mint-spin';
      this.mintCard.id = 'mint-spin'
      // Create the six child divs
      for (let i = 0; i < 6; i++) {
        const div = document.createElement('div');
        this.mintCard.appendChild(div);
      }
      this.mintWindow.appendChild(this.mintCard);
  
      // Right side container for Expiration label and dropdown
      this.keyContainer = document.createElement('div');
      this.keyContainer.style.display = 'flex';
      this.keyContainer.style.flexDirection = 'column'; // stack label and dropdown vertically
      this.keyContainer.style.alignItems = 'center'; 
      this.keyContainer.style.flex = '1';
      this.keyContainer.style.zIndex = '1';

      //card for selection
      this.keySelectCard = document.createElement('div');
      this.keySelectCard.className = 'key-select-card';
      this.keySelectCard.id = 'empty-case-select'
      this.keySelectCard.style.cursor = 'pointer';
      this.keySelectCard.addEventListener('click', () => {
        this.selectHolokey();
      });
      this.keyContainer.appendChild(this.keySelectCard);
      this.keySelectText = document.createElement('h2');
      this.keySelectText.innerText = 'Select HoloKey';
      this.keySelectText.className = 'key-select-text';
      this.keySelectCard.appendChild(this.keySelectText);

      this.mintWindow.appendChild(this.keyContainer);
      this.mintContainer.appendChild(this.mintWindow);
  
  
      // Create the bottom button
      this.mintButtonContainer = document.createElement('div');
      this.mintButtonContainer.style.position = 'absolute';
      this.mintButtonContainer.style.bottom = '12.5%';
      this.mintButtonContainer.style.left = '50%';
      this.mintButtonContainer.style.transform = 'translateX(-50%';
      this.mintWindow.appendChild(this.mintButtonContainer);
      this.mintButton = document.createElement('button'); // Changed from 'div' to 'button'
      this.mintButton.id = 'mint-button';
      this.mintButton.className = 'glomint-button';
      this.mintButtonBase = document.createElement('span');
      this.mintButtonBase.className = 'glomint-button-base';
      this.mintButton.appendChild(this.mintButtonBase);
      this.mintButtonRed = document.createElement('span');
      this.mintButtonRed.className = 'glomint-button-red';
      this.mintButton.appendChild(this.mintButtonRed);
  

    // Add these properties to store the selected token_id
    this.selectedHolokeyTokenId = null;
    this.selectedGlochipTokenId = null;

    // Add an event listener to the mintButton
    this.mintButton.addEventListener('click', () => {
      if (this.selectedHolokeyTokenId && this.selectedGlochipTokenId) {
        // Extract the type from the token ids
        const holokeyType = this.selectedHolokeyTokenId.split('_')[1];
        const glochipType = this.selectedGlochipTokenId.split('_')[1];

        // Check if the types are the same
        if (holokeyType === glochipType) {
          this.openGloChip(this.selectedGlochipTokenId, this.selectedHolokeyTokenId);
        } else {
          // If types are not the same, shake the mintButtonContainer
          gsap.to(this.mintButtonContainer, {duration: 0.25, x: "+=10", yoyo: true, repeat: 3, ease: "power1.inOut"});
        }
      } else {
        console.log('Please select a holokey and a glochip.');
      }
    });

  
      this.mintButtonContainer.appendChild(this.mintButton);
  
  
      // Append the parent div to the body or another container
      document.body.appendChild(this.mintContainer); 
  }

  preloadLaser() {
    if (!window.videoBackground) {
      setTimeout(() => this.preloadLaser(), 100);
      return;
    }
    window.videoBackground.loadVideos(['laser_print_generic', 'laser_print_esoteric', 'laser_print_spectral']);
  }

  hideGlazer(){
    this.mintContainer.style.display = 'flex';
    this.mintWindow.style.display = 'flex';
    this.keyWindow.style.display = 'flex';
    this.gloMintBackground.style.display = 'flex';
    this.removeSquareFromContainer();
    gsap.to(this.mintContainer, {
      opacity: 0.9725,
      duration: 0.5,
    });
  }

  handleOpenedGlochip(e) {
    // Extract the glochipId and keyId from the event detail
    const tokenId = e.detail.logs[0].eventsByType.wasm.token_id[0];
    const tokenUri = e.detail.logs[0].eventsByType.wasm.token_uri[0];
    console.error('opened glochip!', e);
    if (typeof sa_event === 'function') sa_event("opened_glochip");

    this.prizeTokenId = tokenId;

    if (this.selectedHolokeyTokenId) window.client.removeClientNft(this.selectedHolokeyTokenId);
    if (this.selectedGlochipTokenId) window.client.removeClientNft(this.selectedGlochipTokenId);

    window.client.addClientNft(tokenId, tokenUri).then((metadata) => {
      this.setPrizeMetadata(metadata);
    }).catch((error) => {
      console.error('Failed to add client NFT:', error);
    });

    console.log('Token ID:', this.prizeTokenId);
  
    // Execute your function
    this.styleFinalAnimation();

    this.selectedHolokeyTokenId = null;
    this.selectedGlochipTokenId = null;
  }

  setPrizeMetadata(metadata) {
    this.prizeMetadata = metadata;
    console.log('set prize metadata', metadata, 'for', this)

    // Create a video element to preload the video
    this.preloadVideo = document.createElement('video');
    this.preloadVideo.src = `/style/graphics/token_images${metadata.glazed}`;
    this.preloadVideo.preload = 'auto'; // Preload the video
  }

  styleFinalAnimation() {
    console.log('animating final animation');
    // Hide the mint-spin loader
    const mintSpin = document.getElementById('loadSpinnerContainer');
    mintSpin.remove();
  
    const key = document.querySelector('.select-image-key');
    const chip = document.querySelector('.select-image-chip');
    const labels = document.querySelectorAll('.select-label');
    labels.forEach(x => x.style.display = 'none');
    const xes = document.querySelectorAll('.select-x');
    xes.forEach(x => x.style.display = 'none');
  
    // Animate the key and chip
    gsap.to(key, { x: '-125%', scale: 0,  duration: 0.5 });
    gsap.to(chip, { x: '125%', scale: 0,  duration: 0.5 });
  
    // Get the mintWindow element
    const mintWindow = document.getElementById('mint-window');
    if (mintWindow) {
      // Create the loader
      const loader = document.createElement('div');
      loader.className = 'loader';
  
      // Create the boxes and the ground
      for (let i = 0; i < 8; i++) {
        const box = document.createElement('div');
        box.className = `box box${i}`;
        box.innerHTML = '<div></div>';
        loader.appendChild(box);
      }
      const ground = document.createElement('div');
      ground.className = 'ground';
      ground.innerHTML = '<div></div>';
      loader.appendChild(ground);
  
      // Append the loader to the mintWindow
      mintWindow.appendChild(loader);

      // Set a timeout to remove the loader after 3 seconds
      setTimeout(() => {
        loader.style.display = 'none';
        this.transitionToPrinter();
      }, 3000);
          }
  }

  // styleMintAnimation(){
  //   // Hide the mint-spin element
  //   const mintSpin = document.getElementById('mint-spin');
  //   if (mintSpin) {
  //     mintSpin.style.display = 'none';
  //   }
  //   // Get the mintWindow element
  //   const mintWindow = document.getElementById('mint-window');
  //   if (mintWindow) {
  //     const tempLoader = document.createElement('div');
  //     tempLoader.className = 'temp-loader';
  //     tempLoader.className = 'temp-loader'
  
  //     for (let i = 1; i <= 9; i++) {
  //       const div = document.createElement('div');
  //       div.className = 'temp-loader-square';
  //       div.id = `temp-loader${i}`;
  //       tempLoader.appendChild(div);
  //     }
  //     // Append the loader to the mintWindow
  //     mintWindow.appendChild(tempLoader);
      
  //     this.styleFinalAnimation();
  //   }
  // }

  transitionToPrinter() {
    if (this.mintContainer) {
      gsap.to(this.mintContainer, {
        opacity: 0,
        duration: .15,
        onComplete: () => {
          this.mintContainer.style.display = 'none';
          this.gloMintBackground.style.display = 'none';
          if(document.getElementById('backgroundFilter')) document.getElementById('backgroundFilter').remove();
        }
    });
    }

    window.videoBackground.transitionTo('glomint_laser', () => {
      const prizeVideo = `laser_print_${this.prizeMetadata.rarity}`;
      this.displayPrize();
      setTimeout(() => {
        this.prizeContainer.style.opacity = '1';
        this.createNftOverlay();
      }, 5167);
      window.videoBackground.transitionTo(prizeVideo, () => {
      });
    });

    //add glazer shit
    window.windowState = 'laser';
    window.glogo.handleGlogoText();

    let url = window.location.href; // Get the current URL
    url += '/glazer'; // Add '/gloprint' to the URL

    // Update the URL without causing a page reload
    history.pushState({}, null, url);
  }

  displayPrize() {
    this.prizeContainer = document.createElement('video');
    this.prizeContainer.style.position = 'absolute';
    this.prizeContainer.style.transform = 'translate(-50%, -50%)';
    this.prizeContainer.style.pointerEvents = 'none';
    this.prizeContainer.style.top = '50%';
    this.prizeContainer.style.left = '50%';
    this.prizeContainer.style.height = '100%';
    this.prizeContainer.style.zIndex = '5';
    this.prizeContainer.style.opacity = '0'; // Start off with 0% opacity
    this.prizeContainer.style.transition = 'opacity 1s'; // Transition the opacity over 1 second
    this.prizeContainer.src = `/style/graphics/token_images${this.prizeMetadata.glazed}`;
    this.prizeContainer.autoplay = true;
    this.prizeContainer.loop = true;
    document.body.appendChild(this.prizeContainer);
  }

  createNftOverlay() {
    console.log('creating nft overlay')
    this.nftOverlay = document.createElement('div');
    this.nftOverlay.id = 'nftOverlay'
    this.nftOverlay.style.position = 'absolute';
    this.nftOverlay.style.top = '64%';
    this.nftOverlay.style.transform = 'translateX(-50%)';
    this.nftOverlay.style.left = '50%';
    this.nftOverlay.style.width = '13%';
    this.nftOverlay.style.height = '21%';
    this.nftOverlay.style.zIndex = '6';
    this.nftOverlay.style.border = '1px solid transparent'; // Make the border transparent by default
    this.nftOverlay.style.cursor = 'pointer'; // Change the cursor to a pointer
    document.body.appendChild(this.nftOverlay);

    // Add a hover effect
    // this.nftOverlay.addEventListener('mouseover', () => {
    //   // make visual indication
    // });
    // this.nftOverlay.addEventListener('mouseout', () => {
    //   // make visual indication
    // });

    // Add a click event listener
    // Add a click event listener
    this.nftOverlay.addEventListener('click', () => {
      this.nftOverlay.remove();
      this.createNftPrizeMenu();
    });
  }

  createNftPrizeMenu() {
    this.nftPrizeMenu = document.createElement('div');
    this.nftPrizeMenu.style.position = 'absolute';
    this.nftPrizeMenu.style.background = 'black';
    this.nftPrizeMenu.style.border = '30px';
    this.nftPrizeMenu.style.height = '70%';
    this.nftPrizeMenu.style.width = '70%';
    this.nftPrizeMenu.style.top = '20%';
    this.nftPrizeMenu.style.left = '50%';
    this.nftPrizeMenu.style.transform = 'translateX(-50%)';
    this.nftPrizeMenu.style.opacity = '0';
    this.nftPrizeMenu.style.borderRadius = '35px';
    document.body.appendChild(this.nftPrizeMenu);

    // Append the prizeContainer to nftPrizeMenu
    this.nftPrizeMenu.appendChild(this.prizeContainer);

    // Fade in the nftPrizeMenu and its child elements
    gsap.fromTo(this.nftPrizeMenu, { opacity: 0 }, {
      duration: 0.33, // Animation duration in seconds
      opacity: 0.9
    });

    // Animate the prizeContainer
    gsap.to(this.prizeContainer, {
      duration: 0.33, // Animation duration in seconds
      top: '-40%',
      height: '300%'
    });

    this.menuPrizeContainer = document.createElement('div');
    this.menuPrizeContainer.className = 'prize-container';
    this.nftPrizeMenu.appendChild(this.menuPrizeContainer);
    this.prizeMessage = document.createElement('span');
    this.prizeMessage.className = 'prize-message';

    let grammarCorrection;
    if (this.prizeMetadata.rarity === 'esoteric') {
      grammarCorrection = 'AN'
    } else {
      grammarCorrection = 'A'
    }
    this.prizeMessage.innerText = `YOU JUST GLAZED ${grammarCorrection}`;

    this.prizeMessage.style.color = 'white';
    this.menuPrizeContainer.appendChild(this.prizeMessage);
    this.rarityLabel = document.createElement('span');
    this.rarityLabel.className = 'rarity-label';
    this.rarityLabel.style.color = this.prizeMetadata.rarityColor;
    this.menuPrizeContainer.appendChild(this.rarityLabel);
    this.prizeLabel = document.createElement('span');
    this.prizeLabel.className = 'prize-label';
    this.prizeLabel.style.color = 'white';
    this.menuPrizeContainer.appendChild(this.prizeLabel);

    document.querySelector('.rarity-label').innerText = this.prizeMetadata.rarity.toUpperCase();
    document.querySelector('.prize-label').innerText = `${this.prizeMetadata.name} ${this.prizeMetadata.type}`.toUpperCase();

    // this.prizePreview = document.createElement('div');
    // this.prizePreview.className = 'prize-preview';
    // this.prizePreview.innerText = 'PREVIEW';
    // this.prizePreview.style.color = window.client.prizeMetadata.rarityColor;
    // this.prizePreview.style.border = `3px solid ${window.client.prizeMetadata.rarityColor}`;
    // this.nftPrizeMenu.appendChild(this.prizePreview);
    
    // this.prizePreview.addEventListener('mouseover', () => {
    //   this.prizePreview.style.color = 'rgb(10, 10, 10)';
    //   this.prizePreview.style.background = window.client.prizeMetadata.rarityColor;
    // });
    
    // this.prizePreview.addEventListener('mouseout', () => {
    //   this.prizePreview.style.color = window.client.prizeMetadata.rarityColor;
    //   this.prizePreview.style.background = '';
    // });

    this.prizeBackButton = document.createElement('div');
    this.prizeBackButton.className = 'prize-back';
    this.prizeBackButton.style.cursor = 'pointer';
    this.prizeBackButton.innerText = 'BACK TO GLOMINT';
    this.prizeBackButton.style.background = this.prizeMetadata.rarityColor;
    this.prizeBackButton.style.border = `3px solid ${this.prizeMetadata.rarityColor}`;
    this.nftPrizeMenu.appendChild(this.prizeBackButton);
    
    this.prizeBackButton.addEventListener('mouseover', () => {
      this.prizeBackButton.style.color = this.prizeMetadata.rarityColor;
      this.prizeBackButton.style.background = '';
      this.prizeBackButton.style.border = `3px solid ${this.prizeMetadata.rarityColor}`;
    }); 
    
    this.prizeBackButton.addEventListener('mouseout', () => {
      this.prizeBackButton.style.color = 'rgb(10, 10, 10)';
      this.prizeBackButton.style.background = this.prizeMetadata.rarityColor;
      this.prizeBackButton.style.border = '';
    });

    this.prizeBackButton.addEventListener('click', () => {
      console.log('back to glomint');
      this.nftPrizeMenu.remove();
      window.videoBackground.transitionTo('laser_glomint', () => {
        window.windowState = 'mint';
        window.glogo.handleGlogoText();
        this.hideGlazer();
        document.querySelector('.mint-spin').style.visibility = 'visible';
      });
      const event = new Event('WindowStateChanged');
      window.dispatchEvent(event);
    })
  } 


  hideMintPage() {
    if (this.mintContainer) {
      gsap.to(this.mintContainer, {
        opacity: 0,
        duration: .15,
        onComplete: () => {
          this.mintContainer.style.display = 'none';
        }
      });
    }

    if (this.gloMintBackground) this.gloMintBackground.style.display = 'none';
  }

  selectGlochip() {
    this.mintTitle.style.display = 'none';
    this.caseContainer.style.display = 'none';
    this.keyContainer.style.display = 'none';
    this.mintButton.style.display = 'none';
    this.mintCard.style.display = 'none';

    this.glochipTitle = document.createElement('div');
    this.glochipTitle.innerText = 'SELECT GLOCHIP';
    this.glochipTitle.className = 'library-title';
    this.mintWindow.appendChild(this.glochipTitle);

    if (!this.selectedHolokeyTokenId) {
      this.glochipSelectionMenu = document.createElement('div');
      this.glochipSelectionMenu.id = 'glochipSelectionMenu';
      this.glochipSelectionMenu.className = 'glomintSelectionMenu';
      this.mintWindow.appendChild(this.glochipSelectionMenu);

      // Create the first input element
      const input1 = document.createElement('input');
      input1.setAttribute('label', 'All');
      input1.setAttribute('type', 'radio');
      input1.setAttribute('id', 'male');
      input1.setAttribute('name', 'gender');
      input1.setAttribute('value', 'all');
      input1.setAttribute('checked', '');

      // Create the second input element
      const input2 = document.createElement('input');
      input2.setAttribute('label', 'Generic');
      input2.setAttribute('type', 'radio');
      input2.setAttribute('id', 'female');
      input2.setAttribute('name', 'gender');
      input2.setAttribute('value', 'generic');

      // Create the third input element
      const input3 = document.createElement('input');
      input3.setAttribute('label', 'Esoteric');
      input3.setAttribute('type', 'radio');
      input3.setAttribute('id', 'other');
      input3.setAttribute('name', 'gender');
      input3.setAttribute('value', 'esoteric');

      // Create the third input element
      const input4 = document.createElement('input');
      input4.setAttribute('label', 'Spectral');
      input4.setAttribute('type', 'radio');
      input4.setAttribute('id', 'other');
      input4.setAttribute('name', 'gender');
      input4.setAttribute('value', 'spectral');

      // Append the input elements to the glochipSelectionMenu
      this.glochipSelectionMenu.appendChild(input1);
      this.glochipSelectionMenu.appendChild(input2);
      this.glochipSelectionMenu.appendChild(input3);
      this.glochipSelectionMenu.appendChild(input4);    
      input1.addEventListener('change', filterNfts.bind(this));
      input2.addEventListener('change', filterNfts.bind(this));
      input3.addEventListener('change', filterNfts.bind(this));
      input4.addEventListener('change', filterNfts.bind(this));
      
      // Function to filter NFTs based on the selected radio button
      function filterNfts(event) {
        const selectedValue = event.target.value;
        let filteredNfts;

        if (selectedValue === 'all') {
          filteredNfts = window.client.clientNfts.filter(nftData => nftData.tokenId.includes('glochip'));

          filteredNfts.sort((a, b) => {
            const aIsGeneric = a.tokenId.includes('generic');
            const bIsGeneric = b.tokenId.includes('generic');
          
            if (aIsGeneric && !bIsGeneric) {
              return -1; // a comes first
            } else if (!aIsGeneric && bIsGeneric) {
              return 1; // b comes first
            } else {
              return 0; // no change in order
            }
          });
          console.log('glochip selection all');
        } else {
          filteredNfts = window.client.clientNfts.filter(nftData => nftData.tokenId.includes('glochip') && nftData.tokenId.includes(selectedValue));
          console.log(`glochip selection ${selectedValue}`);
        }

        // Clear the current NFTs from the UI
        while (this.glochipLibrary.firstChild) {
          this.glochipLibrary.removeChild(this.glochipLibrary.firstChild);
        }
            
        // Check if filteredNfts is empty
        if (filteredNfts.length === 0) {
          const noKeysText = document.createElement('div');
          noKeysText.innerText = `No ${selectedValue} glochips found`;
          noKeysText.style.position = 'absolute';
          noKeysText.style.top = '40%';
          noKeysText.style.left = '50%';
          noKeysText.style.transform = 'translateX(-50%)';
          this.holokeyLibrary.appendChild(noKeysText);
        } else {
          filteredNfts.forEach(nftData => {
            nftData.tokenIds.forEach((tokenId) => {
            // Create a new UI element for the NFT
            const container = document.createElement('div');
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.alignItems = 'center';
        
            const square = document.createElement('div');
            square.style.width = '175px'; // Increase the size of the square
            square.style.height = '175px';
            square.style.cursor = 'pointer';
            square.style.backgroundImage = `url(/style/graphics/token_images/${nftData.metadata.previewImg}.webp)`; // Set the background image
            square.style.backgroundSize = 'cover'; // Cover the entire square
            square.style.backgroundPosition = 'center'; // Center the image
            square.style.color = 'white';
        
            const label = document.createElement('span');
            label.style.fontSize = '0.5em';
            label.style.position = 'relative';
            label.style.bottom = '-3.5%';
        
            label.textContent = nftData.tokenId;
        
            container.appendChild(square);
            container.appendChild(label);
        
            // Add the new UI element to the glochipLibrary
            this.glochipLibrary.appendChild(container);

            // Add a click event listener to the square
            square.addEventListener('click', () => {
              // Deselect the currently selected square
              if (selectedSquare) {
                selectedSquare.style.border = 'none';
              }

              // Select the clicked square
              square.style.border = '1px solid #34ff19';
              selectedNftData = nftData; 
              this.selectedGlochipTokenId = tokenId;
              // this.selectedSell = nftData.token_id;
              // this.selectedInfo = nftData.token_id;
              // this.selectedUri = nftData.token_uri;

              // Update the reference to the currently selected square
              selectedSquare = square;
              this.appendSquareToContainer(this.caseContainer, selectedNftData);
              this.doneWithMenu('glochip', 'accept');
            });

            // Add a mouseover event listener to the square
            square.addEventListener('mouseover', () => {
              gsap.to(square, { duration: 0.25, scale: 1.05 });
            });

            // Add a mouseout event listener to the square
            square.addEventListener('mouseout', () => {
              gsap.to(square, { duration: 0.25, scale: 1 });
            });
            });
          });
        }
      }
    }

    this.glochipLibrary = document.createElement('div');
    this.glochipLibrary.id = 'glochipLibrary';
    this.glochipLibrary.className = 'select-library';
    this.mintWindow.appendChild(this.glochipLibrary);
    const gloLibrary = document.createElement("style");
    gloLibrary.type = "text/css";
    gloLibrary.innerText = `
      #glochipLibrary::-webkit-scrollbar {
        width: 6px !important;
      }
      #glochipLibrary::-webkit-scrollbar-track {
        background: transparent !important;
      }
      #glochipLibrary::-webkit-scrollbar-thumb {
        background: #ff8e26;
        border-radius: 10px !important;
      }
      @media screen and (max-width: 768px) {
        #glochipLibrary::-webkit-scrollbar {
          width: 6px !important;
        }
      }
    `;
    document.head.appendChild(gloLibrary);

    console.log('populating selectOS w/nfts:', window.client.allNfts);

    let selectedSquare = null; // Keep a reference to the currently selected square
    let selectedNftData = null;

    // Create a loader element
    const loader = document.createElement('div');
    loader.className = 'mint-select-loader';
    loader.style.position = 'absolute';
    loader.style.left = '50%';
    loader.style.transform = 'translateX(-50%)';
    loader.style.top = '44%';
    this.glochipLibrary.appendChild(loader);

    // Show the loader
    loader.style.display = 'block';

    // Set up an interval to check if window.client.allNfts is not null
    let counter = 0;
    const intervalId = setInterval(() => {
      if (!window.client.gloSession) {
        clearInterval(intervalId);
        loader.style.display = 'none';
        const noGlochipsText = document.createElement('div');
        noGlochipsText.innerText = `No glochips found`;
        noGlochipsText.style.position = 'absolute';
        noGlochipsText.style.top = '40%';
        noGlochipsText.style.left = '50%';
        noGlochipsText.style.transform = 'translateX(-50%)';
        this.glochipLibrary.appendChild(noGlochipsText);
      }
      console.log('window.client.allNfts: ', window.client.clientNfts);
      if (window.client.clientNfts !== null && window.client.clientNfts.length > 0) {
        // If it's not null, clear the interval
        clearInterval(intervalId);

        // Hide the loader
        loader.style.display = 'none';

        // Now window.client.allNfts is not null, so you can proceed with the rest of the code
        window.client.clientNfts
        .filter(nftData => {
          // If a holokey has been selected, only show glochips of the same type
          if (this.selectedHolokeyTokenId) {
            const holokeyType = this.selectedHolokeyTokenId.split('_')[1];
            return nftData.tokenId.includes('glochip') && nftData.tokenId.split('_')[1] === holokeyType;
          }
          // If no holokey has been selected, show all glochips
          return nftData.tokenId.includes('glochip');
        })
        .sort((a, b) => {
          // If no holokey has been selected, sort so that 'generic' glochips come first
          if (!this.selectedHolokeyTokenId) {
            const aIsGeneric = a.tokenId.includes('generic');
            const bIsGeneric = b.tokenId.includes('generic');
        
            if (aIsGeneric && !bIsGeneric) {
              return -1; // a comes first
            } else if (!aIsGeneric && bIsGeneric) {
              return 1; // b comes first
            }
          }
          return 0; // no change in order
        })
        .forEach((nftData) => {
          // For each tokenId in the tokenIds array of the current NFT
          nftData.tokenIds.forEach((tokenId) => {
          console.log('glochip data:', nftData);
          const container = document.createElement('div');
          container.style.display = 'flex';
          container.style.flexDirection = 'column';
          container.style.alignItems = 'center';

          const square = document.createElement('div');
          square.style.width = '175px'; // Increase the size of the square
          square.style.height = '175px';
          square.style.cursor = 'pointer';
          square.style.backgroundImage = `url(/style/graphics/token_images/${nftData.metadata.previewImg}.webp)`; // Set the background image
          square.style.backgroundSize = 'cover'; // Cover the entire square
          square.style.backgroundPosition = 'center'; // Center the image
          square.style.color = 'white';

          const label = document.createElement('span');
          label.style.fontSize = '0.5em';
          label.style.position = 'relative';
          label.style.bottom = '-3.5%';

          label.textContent = nftData.tokenId;

          console.log('nftData.token_id:', nftData.token_id);

          container.appendChild(square);
          container.appendChild(label);

          // Add a click event listener to the square
          square.addEventListener('click', () => {
            // Deselect the currently selected square
            if (selectedSquare) {
              selectedSquare.style.border = 'none';
            }

            // Select the clicked square
            square.style.border = '1px solid #34ff19';
            selectedNftData = nftData; 
            this.selectedGlochipTokenId = tokenId;
            // this.selectedSell = nftData.token_id;
            // this.selectedInfo = nftData.token_id;
            // this.selectedUri = nftData.token_uri;

            // Update the reference to the currently selected square
            selectedSquare = square;
            this.appendSquareToContainer(this.caseContainer, selectedNftData);
            this.doneWithMenu('glochip', 'accept');
          });

          // Add a mouseover event listener to the square
          square.addEventListener('mouseover', () => {
            gsap.to(square, { duration: 0.25, scale: 1.05 });
          });

          // Add a mouseout event listener to the square
          square.addEventListener('mouseout', () => {
            gsap.to(square, { duration: 0.25, scale: 1 });
          });

          this.glochipLibrary.appendChild(container);
        });
      });
      } else {
        // If it's still null or doesn't start with 'terra', show the loader and try again after a delay
        loader.style.display = 'block';
        counter++;
        if (counter >= 5) {
          clearInterval(intervalId);
          loader.style.display = 'none';
          const noGlochipsText = document.createElement('div');
          noGlochipsText.innerText = `No glochips found`;
          noGlochipsText.style.position = 'absolute';
          noGlochipsText.style.top = '40%';
          noGlochipsText.style.left = '50%';
          noGlochipsText.style.transform = 'translateX(-50%)';
          this.glochipLibrary.appendChild(noGlochipsText);
        }
      }
    }, 500); // Check every 500 milliseconds

    this.glochipMenu = document.createElement('div');
    this.glochipMenu.className = 'library-menu';
    this.mintWindow.appendChild(this.glochipMenu);

    this.glochipCancel = document.createElement('div');
    this.glochipCancel.innerText = 'cancel';
    this.glochipCancel.className = 'library-button';
    this.glochipCancel.addEventListener('click', () => {
      this.doneWithMenu('glochip', 'cancel');
    });

    this.glochipMenu.appendChild(this.glochipCancel);
  }

  selectHolokey(){
    this.mintTitle.style.display = 'none';
    this.caseContainer.style.display = 'none';
    this.keyContainer.style.display = 'none';
    this.mintButton.style.display = 'none';
    this.mintCard.style.display = 'none';

    this.holokeyTitle = document.createElement('div');
    this.holokeyTitle.innerText = 'SELECT HOLOKEY';
    this.holokeyTitle.className = 'library-title';
    this.mintWindow.appendChild(this.holokeyTitle);

    if (!this.selectedGlochipTokenId) {
      this.holokeySelectionMenu = document.createElement('div');
      this.holokeySelectionMenu.id = 'holokeySelectionMenu';
      this.holokeySelectionMenu.className = 'glomintSelectionMenu';
      this.mintWindow.appendChild(this.holokeySelectionMenu);
      
      // Create the first input element
      const input1 = document.createElement('input');
      input1.setAttribute('label', 'All');
      input1.setAttribute('type', 'radio');
      input1.setAttribute('id', 'male');
      input1.setAttribute('name', 'gender');
      input1.setAttribute('value', 'all');
      input1.setAttribute('checked', '');

      // Create the second input element
      const input2 = document.createElement('input');
      input2.setAttribute('label', 'Generic');
      input2.setAttribute('type', 'radio');
      input2.setAttribute('id', 'female');
      input2.setAttribute('name', 'gender');
      input2.setAttribute('value', 'generic');

      // Create the third input element
      const input3 = document.createElement('input');
      input3.setAttribute('label', 'Esoteric');
      input3.setAttribute('type', 'radio');
      input3.setAttribute('id', 'other');
      input3.setAttribute('name', 'gender');
      input3.setAttribute('value', 'esoteric');

      // Create the third input element
      const input4 = document.createElement('input');
      input4.setAttribute('label', 'Spectral');
      input4.setAttribute('type', 'radio');
      input4.setAttribute('id', 'other');
      input4.setAttribute('name', 'gender');
      input4.setAttribute('value', 'spectral');

      // Append the input elements to the holokeySelectionMenu
      this.holokeySelectionMenu.appendChild(input1);
      this.holokeySelectionMenu.appendChild(input2);
      this.holokeySelectionMenu.appendChild(input3);
      this.holokeySelectionMenu.appendChild(input4);
      input1.addEventListener('change', filterNfts.bind(this));
      input2.addEventListener('change', filterNfts.bind(this));
      input3.addEventListener('change', filterNfts.bind(this));
      input4.addEventListener('change', filterNfts.bind(this));
      
      // Function to filter NFTs based on the selected radio button
      function filterNfts(event) {
        const selectedValue = event.target.value;
        let filteredNfts;

        if (window.client.gloSession) {
          if (selectedValue === 'all') {
            filteredNfts = window.client.clientNfts.filter(nftData => nftData.tokenId.includes('key'));
            console.log('holokey selection all');
          } else {
            filteredNfts = window.client.clientNfts.filter(nftData => nftData.tokenId.includes('key') && nftData.tokenId.includes(selectedValue));
            console.log(`holokey selection ${selectedValue}`);
          }
        } else {
          filteredNfts = [];
        }

        // Clear the current NFTs from the UI
        while (this.holokeyLibrary.firstChild) {
          this.holokeyLibrary.removeChild(this.holokeyLibrary.firstChild);
        }
            
        // Check if filteredNfts is empty
        if (filteredNfts.length === 0) {
          const noKeysText = document.createElement('div');
          noKeysText.innerText = `No ${selectedValue} holokeys found`;
          noKeysText.style.position = 'absolute';
          noKeysText.style.top = '40%';
          noKeysText.style.left = '50%';
          noKeysText.style.transform = 'translateX(-50%)';
          this.holokeyLibrary.appendChild(noKeysText);
        } else {
          filteredNfts.forEach(nftData => {
            nftData.tokenIds.forEach((tokenId) => {
            console.log('key data:', tokenId);
            // Create a new UI element for the NFT
            const container = document.createElement('div');
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.alignItems = 'center';
        
            const square = document.createElement('video');
            square.style.height = '200px';
            square.style.cursor = 'pointer';
            square.src = `/style/graphics${nftData.metadata.showcase}`;
            square.autoplay = true;
            square.loop = true;
            square.muted = true;
            square.style.color = 'white';
        
            const label = document.createElement('span');
            label.style.fontSize = '0.5em';
            label.style.position = 'relative';
            label.style.bottom = '12.5%';
        
            label.textContent = nftData.tokenId;
        
            container.appendChild(square);
            container.appendChild(label);
        
            // Add the new UI element to the glochipLibrary
            this.holokeyLibrary.appendChild(container);

            // Add a click event listener to the square
            square.addEventListener('click', () => {
              // Deselect the currently selected square
              if (selectedSquare) {
                selectedSquare.style.backgroundColor = 'white';
              }
    
              // Select the clicked square
              square.style.backgroundColor = '#34ff19';
              selectedNftData = nftData; 
              this.selectedHolokeyTokenId = tokenId;
    
              // Update the reference to the currently selected square
              selectedSquare = square;
              this.appendSquareToContainer(this.keyContainer, selectedNftData);
              this.doneWithMenu('holokey', 'accept');
            });
            });
          });
        }
      }
    }

    this.holokeyLibrary = document.createElement('div');
    this.holokeyLibrary.id = 'holokeyLibrary';
    this.holokeyLibrary.className = 'select-library';
    this.mintWindow.appendChild(this.holokeyLibrary);
    const holoLibrary = document.createElement("style");
    holoLibrary.type = "text/css";
    holoLibrary.innerText = `
      #holokeyLibrary::-webkit-scrollbar {
        width: 6px !important;
      }
      #holokeyLibrary::-webkit-scrollbar-track {
        background: transparent !important;
      }
      #holokeyLibrary::-webkit-scrollbar-thumb {
        background: #ff8e26;
        border-radius: 10px !important;
      }
      @media screen and (max-width: 768px) {
        #holokeyLibrary::-webkit-scrollbar {
          width: 6px !important;
        }
      }
    `;
    document.head.appendChild(holoLibrary);

    console.log('populating selectOS w/nfts:', window.client.allNfts);

    let selectedSquare = null; // Keep a reference to the currently selected square
    let selectedNftData = null;

    // Create a loader element
    const loader = document.createElement('div');
    loader.className = 'mint-select-loader';
    loader.style.position = 'absolute';
    loader.style.left = '50%';
    loader.style.transform = 'translateX(-50%)';
    loader.style.top = '44%';
    this.holokeyLibrary.appendChild(loader);

    // Show the loader
    loader.style.display = 'block';

  // Set up an interval to check if this.clientNfts is not null
  let counter = 0;
  const intervalId = setInterval(() => {
    if (!window.client.gloSession) {
      clearInterval(intervalId);
      loader.style.display = 'none';
      const noKeysText = document.createElement('div');
      noKeysText.innerText = `No holokeys found`;
      noKeysText.style.position = 'absolute';
      noKeysText.style.top = '40%';
      noKeysText.style.left = '50%';
      noKeysText.style.transform = 'translateX(-50%)';
      this.holokeyLibrary.appendChild(noKeysText);
    }
    console.log('this.clientNfts: ', window.client.clientNfts);
    if (window.client.clientNfts !== null && window.client.clientNfts.length > 0) {
      // If it's not null, clear the interval
      clearInterval(intervalId);

      // Hide the loader
      loader.style.display = 'none';

      // Now this.clientNfts is not null, so you can proceed with the rest of the code
      const filteredNfts = window.client.clientNfts
      .filter(nftData => {
        // If a glochip has been selected, only show holokeys of the same type
        if (this.selectedGlochipTokenId) {
          const glochipType = this.selectedGlochipTokenId.split('_')[1];
          return nftData.tokenId.includes('key') && nftData.tokenId.split('_')[1] === glochipType;
        }
        // If no glochip has been selected, show all holokeys
        return nftData.tokenId.includes('key');
      });

      if (filteredNfts.length === 0) {
        const noKeysText = document.createElement('div');
        noKeysText.innerText = `No ${this.selectedGlochipTokenId ? this.selectedGlochipTokenId.split('_')[1] : ''} holokeys found`;
        noKeysText.style.position = 'absolute';
        noKeysText.style.top = '40%';
        noKeysText.style.left = '50%';
        noKeysText.style.transform = 'translateX(-50%)';
        this.holokeyLibrary.appendChild(noKeysText);
      } else {
        filteredNfts.forEach((nftData) => {
          // For each tokenId in the tokenIds array of the current NFT
          nftData.tokenIds.forEach((tokenId) => {
            console.log('key data:', tokenId);
            const container = document.createElement('div');
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.alignItems = 'center';
    
            const square = document.createElement('video');
            square.style.height = '200px';
            square.style.cursor = 'pointer';
            square.src = `/style/graphics${nftData.metadata.showcase}`;
            square.autoplay = true;
            square.loop = true;
            square.muted = true;
            square.style.color = 'white';
    
            const label = document.createElement('span');
            label.style.fontSize = '0.75em';
            label.style.position = 'relative';
            label.style.bottom = '0%';
            label.textContent = nftData.tokenId;
    
            container.appendChild(square);
            container.appendChild(label);
    
            // Add a click event listener to the square
            square.addEventListener('click', () => {
              // Deselect the currently selected square
              if (selectedSquare) {
                selectedSquare.style.backgroundColor = 'white';
              }
    
              // Select the clicked square
              square.style.backgroundColor = '#34ff19';
              selectedNftData = nftData; 
              this.selectedHolokeyTokenId = tokenId;
    
              // Update the reference to the currently selected square
              selectedSquare = square;
              this.appendSquareToContainer(this.keyContainer, selectedNftData);
              this.doneWithMenu('holokey', 'accept');
            });
    
            this.holokeyLibrary.appendChild(container);
          });
        });
      }
    } else {
      // If it's still null or doesn't start with 'terra', show the loader and try again after a delay
      loader.style.display = 'block';
      counter++;
      if (counter >= 5) {
        clearInterval(intervalId);
        loader.style.display = 'none';
        const noKeysText = document.createElement('div');
        noKeysText.innerText = `No holokeys found`;
        noKeysText.style.position = 'absolute';
        noKeysText.style.top = '40%';
        noKeysText.style.left = '50%';
        noKeysText.style.transform = 'translateX(-50%)';
        this.holokeyLibrary.appendChild(noKeysText);
      }
    }
  }, 500); // Check every 500 milliseconds

    this.holokeyMenu = document.createElement('div');
    this.holokeyMenu.className = 'library-menu';
    this.mintWindow.appendChild(this.holokeyMenu);

    this.holokeyCancel = document.createElement('div');
    this.holokeyCancel.innerText = 'cancel';
    this.holokeyCancel.className = 'library-button';
    this.holokeyCancel.addEventListener('click', () => {
      this.doneWithMenu('holokey', 'cancel');
    });

    this.holokeyMenu.appendChild(this.holokeyCancel);
  }

  doneWithMenu(menuType, menuChoice){
    console.log('doneWithMenu called:', menuType, menuChoice);
    this.mintTitle.style.display = 'flex';
    this.caseContainer.style.display = 'flex';
    this.keyContainer.style.display = 'flex';
    this.mintButton.style.display = 'flex';
    this.mintCard.style.display = 'flex';

    if (menuType === 'glochip') {
      this.glochipTitle.style.display = 'none';
      this.glochipLibrary.style.display = 'none';
      this.glochipMenu.style.display = 'none';
      this.glochipSelectionMenu.style.display = 'none';
    } else {
      this.holokeyTitle.style.display = 'none';
      this.holokeyLibrary.style.display = 'none';
      this.holokeyMenu.style.display = 'none';
      this.holokeySelectionMenu.style.display = 'none';
    }

    if (menuChoice === 'accept'){
      console.log('poop');
    } else {
      console.log('poop');
    }
  }

  // Add this new method to create and append a square to a container
  appendSquareToContainer(container, nftData) {
    // Hide the original children of the container
    Array.from(container.childNodes).forEach(child => child.style.display = 'none');

    //create the container for it
    const caseSelectCard = document.createElement('div');
    caseSelectCard.className = 'case-select-card';
    caseSelectCard.id = 'occupied-case-select';
    caseSelectCard.style.cursor = 'pointer';
    caseSelectCard.style.overflow = 'hidden';

    // Create and append the new square
    const square = document.createElement('video');
    square.style.width = '200px';
    square.style.height = '200px';
    square.style.zIndex = '1';
    square.className = container === this.keyContainer ? 'select-image-key' : 'select-image-chip';
    square.src = `/style/graphics${nftData.metadata.showcase}`;
    square.autoplay = true;
    square.loop = true;
    square.muted = true;
    square.style.color = 'white';
    caseSelectCard.appendChild(square);

    // Create and append the close button
    const closeButton = document.createElement('button');
    closeButton.className = 'select-x';
    closeButton.textContent = 'X';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '7.5%';
    closeButton.style.left = '50%';
    closeButton.style.zIndex = '1';
    closeButton.style.cursor = 'pointer';
    closeButton.style.transform = 'translateX(-50%)';
    caseSelectCard.appendChild(closeButton);
    closeButton.addEventListener('click', () => {
      // Remove the square and the close button
      container.removeChild(caseSelectCard);

      //reset selected id
      if (container === this.keyContainer) {
        this.selectedHolokeyTokenId = null;
      } else if (container === this.caseContainer) {
        this.selectedGlochipTokenId = null;
      }

      // Show the original children
      Array.from(container.childNodes).forEach(child => child.style.display = '');
    });

    const label = document.createElement('span');
    label.style.fontSize = '0.6em';
    label.style.position = 'absolute';
    label.style.bottom = '12.5%';
    label.style.zIndex = '1';
    label.style.color = 'white';
    label.className = 'select-label';
    label.textContent = nftData.tokenId;
    caseSelectCard.appendChild(label);

    container.appendChild(caseSelectCard);
  // Append the close button to the container
  }

  removeSquareFromContainer() {
    // Find all elements with the id 'occupied-case-select'
    const occupiedCaseSelects = document.querySelectorAll('#occupied-case-select');

    // Remove all found elements
    occupiedCaseSelects.forEach(element => {
      element.parentNode.removeChild(element);
    });

    // Find all elements with the id 'empty-case-select'
    const emptyCaseSelects = document.querySelectorAll('#empty-case-select');

    // Set their display to 'flex'
    emptyCaseSelects.forEach(element => {
      element.style.display = 'flex';
    });
  }

//   mintKeyWindow(keyType) {
//   // Iterate over all children of this.mintWindow
//   Array.from(this.mintWindow.children).forEach(child => {
//     // Hide each child
//     child.style.display = 'none';
//   });

// // Create keyCheckout container if it doesn't exist
// if (!this.keyCheckout) {
//   this.keyCheckout = document.createElement('div');
//   this.keyCheckout.id = 'keyCheckout';
//   this.keyCheckout.style.position = 'absolute';
//   this.keyCheckout.style.top = '0%';
//   this.keyCheckout.style.left = '50%';
//   this.keyCheckout.style.transform = 'translateX(-50%)';
//   this.keyCheckout.style.width = '99%';
//   this.keyCheckout.style.height = '60%';
//   this.mintWindow.appendChild(this.keyCheckout);

//   //key image
//   this.keyCheckoutImage = document.createElement('img');
//   this.keyCheckoutImage.src = `/style/graphics/token_images/holokeys/${keyType}_holokey_preview.webp`
//   this.keyCheckoutImage.style.height = '75%';
//   this.keyCheckout.appendChild(this.keyCheckoutImage);

//   // Add 3D spinning animation
//   gsap.to(this.keyCheckoutImage, {
//     rotationY: 360,
//     repeat: -1, // -1 means repeat indefinitely
//     ease: 'none', // Linear movement
//     duration: 5, // Duration of one complete spin in seconds
//     transformOrigin: "center center", // Ensures the rotation is around the center
//   });

//   //key name
//   this.keyCheckoutName = document.createElement('span');
//   this.keyCheckoutName.innerText = `predemo_${keyType}_holokey`;
//   this.keyCheckoutName.style.position = 'absolute';
//   this.keyCheckoutName.style.top = '25%';
//   this.keyCheckoutName.style.left = '40%';
//   this.keyCheckoutName.style.fontSize = '1.5em';
//   this.keyCheckout.appendChild(this.keyCheckoutName);

//   //price container
//   this.keyCheckoutPriceContainer = document.createElement('div');
//   this.keyCheckoutPriceContainer.style.position = 'absolute';
//   this.keyCheckoutPriceContainer.style.left = '40%';
//   this.keyCheckoutPriceContainer.style.top = '45%';
//   this.keyCheckoutPriceContainer.style.width = '55%';
//   this.keyCheckoutPriceContainer.style.height = '10%';
//   this.keyCheckout.appendChild(this.keyCheckoutPriceContainer);
//   this.keyCheckoutPriceNo = document.createElement('span');
//   switch(keyType) {
//     case 'generic':
//       this.keyCheckoutPriceNo.innerText = 'PRICE: 1';
//       this.holokeyPrice = '1';
//       break;
//     case 'esoteric':
//       this.keyCheckoutPriceNo.innerText = 'PRICE: 10';
//       this.holokeyPrice = '10';
//       break;
//     case 'spectral':
//       this.keyCheckoutPriceNo.innerText = 'PRICE: 50';
//       this.holokeyPrice = '50';
//       break;
//     default:
//       break;
//   }
//   this.keyCheckoutPriceContainer.appendChild(this.keyCheckoutPriceNo);
//   this.keyCheckoutPriceDenom = document.createElement('img');
//   this.keyCheckoutPriceDenom.src = '/style/graphics/lunatextsvg.svg';
//   this.keyCheckoutPriceDenom.style.height = '75%';
//   this.keyCheckoutPriceContainer.appendChild(this.keyCheckoutPriceDenom);

//   // Quantity input container
//   this.keyCheckoutInputContainer = document.createElement('div');
//   this.keyCheckoutPriceContainer.appendChild(this.keyCheckoutInputContainer);
//   let quantityLabel = document.createElement('label');
//   quantityLabel.textContent = 'Qty:';
//   this.keyCheckoutInputContainer.appendChild(quantityLabel);
//   this.quantityInput = document.createElement('input');
//   this.quantityInput.type = 'number';
//   this.quantityInput.min = '1';
//   this.quantityInput.max = '100';
//   this.quantityInput.value = '1';
//   this.keyCheckoutInputContainer.appendChild(this.quantityInput);
//   this.quantityInput.addEventListener('input', () => {
//     this.lunaQuantityValue = parseInt(this.quantityInput.value) * parseInt(this.holokeyPrice);
//     this.lunaQuantity.textContent = 'Subtotal: ' + this.lunaQuantityValue;
//   });
//   }

// // Create finalCheckout container if it doesn't exist
// if (!this.finalCheckout) {
//   this.finalCheckout = document.createElement('div');
//   this.finalCheckout.id = 'finalCheckout';
//   this.finalCheckout.style.position = 'absolute';
//   this.finalCheckout.style.bottom = '0%';
//   this.finalCheckout.style.left = '50%';
//   this.finalCheckout.style.transform = 'translateX(-50%)';
//   this.finalCheckout.style.width = '99%';
//   this.finalCheckout.style.height = '40%';
//   this.mintWindow.appendChild(this.finalCheckout);

//   //subtotal container
//   this.finalCheckoutSubtotalContainer = document.createElement('div');
//   this.finalCheckoutSubtotalContainer.style.position = 'absolute';
//   this.finalCheckoutSubtotalContainer.style.bottom = '60%';
//   this.finalCheckoutSubtotalContainer.style.height = '10%';
//   this.finalCheckoutSubtotalContainer.style.width = '10%';
//   this.finalCheckoutSubtotalContainer.style.left = '50%';
//   this.finalCheckoutSubtotalContainer.style.transform = 'translateX(-50%)';
//   this.finalCheckout.appendChild(this.finalCheckoutSubtotalContainer);
//   this.lunaQuantityValue = parseInt(this.quantityInput.value) * parseInt(this.holokeyPrice);
//   this.lunaQuantity = document.createElement('span');
//   this.lunaQuantity.textContent = 'Subtotal: ' + this.lunaQuantityValue;
//   this.finalCheckoutSubtotalContainer.appendChild(this.lunaQuantity);
//   this.lunaDenomImage = document.createElement('img');
//   this.lunaDenomImage.src = '/style/graphics/lunatextsvg.svg';
//   this.finalCheckoutSubtotalContainer.appendChild(this.lunaDenomImage);

//   //checkout button
//   this.finalCheckoutButton = document.createElement('btn');
//   this.finalCheckoutButton.className = 'holokey-checkout-button';
//   this.finalCheckoutButton.innerText = 'CHECKOUT';
//   this.finalCheckout.appendChild(this.finalCheckoutButton);
// }

//   if(keyType === 'generic') {
//     this.genericKeyWindow.classList.add('active');
//     this.esotericKeyWindow.classList.remove('active');
//     this.spectralKeyWindow.classList.remove('active');
//   } else if (keyType === 'esoteric') {
//     this.genericKeyWindow.classList.remove('active');
//     this.esotericKeyWindow.classList.add('active');
//     this.spectralKeyWindow.classList.remove('active');
//   } else if (keyType === 'spectral') {
//     this.genericKeyWindow.classList.remove('active');
//     this.esotericKeyWindow.classList.remove('active');
//     this.spectralKeyWindow.classList.add('active');
//   }
//   }

  mintKey(keyType) {
    if (!window.client.gloSession) {
      console.log('jimmy');
      return
    }
    window.addEventListener('txCancel', (event) => {
      this.cancelTransaction();
    });

    //determine price, key_id
    let mintPrice;
    let keyID;

    switch(keyType){
      case 'generic':
        mintPrice = '100000';
        keyID = 'predemo_generic_key';
        break;
      case 'esoteric':
        mintPrice = '500000';
        keyID = 'predemo_esoteric_key';
        break;
      case 'spectral':
        mintPrice = '1000000';
        keyID = 'predemo_spectral_key';
        break;
      default:
        break;
    }

        // Create a custom event with details
        const event = new CustomEvent("mintKey", {
          detail: {
              keyId: keyID,
              amount: mintPrice,
              chainID: 'pisco-1'
          }
      });
  
      // Dispatch the event
      window.dispatchEvent(event);

    this.keyLoaderDiv = document.createElement('div');
    this.keyLoaderDiv.id = 'keyLoaderDiv';
    this.keyLoaderDiv.style.position = 'absolute';
    this.keyLoaderDiv.style.top = '25%';
    this.keyLoaderDiv.style.left = '50%';
    this.keyLoaderDiv.style.transform = 'translateX(-50%)';
    this.keyLoaderDiv.style.height = '50vh';
    this.keyLoaderDiv.style.width = '50vh';
    this.keyLoaderDiv.style.borderRadius = '1rem';
    this.keyLoaderDiv.style.backgroundColor = '#ff9c31';
    this.keyLoaderDiv.style.zIndex = '2';
    this.keyLoaderDiv.style.opacity = '0';
    document.body.appendChild(this.keyLoaderDiv);

    this.keyLoaderOverlay = document.createElement('div');
    this.keyLoaderOverlay.id = 'keyLoaderOverlay';
    this.keyLoaderOverlay.style.position = 'absolute';
    this.keyLoaderOverlay.style.top = '0';
    this.keyLoaderOverlay.style.left = '0';
    this.keyLoaderOverlay.style.height = '100%';
    this.keyLoaderOverlay.style.width = '100%';
    this.keyLoaderOverlay.style.backgroundColor = 'black';
    this.keyLoaderOverlay.style.opacity = '.75';
    this.keyLoaderOverlay.style.zIndex = '1';
    // Add an event listener to the overlay
    this.keyLoaderOverlay.addEventListener('click', () => {
      // Remove the overlay
      document.body.removeChild(this.keyLoaderOverlay);

      // Remove the keyLoaderDiv
      document.body.removeChild(this.keyLoaderDiv);
    });
    document.body.appendChild(this.keyLoaderOverlay);

    this.keyLoader = document.createElement('div');
    this.keyLoader.className = 'key-loader-wrapper';
    this.keyLoaderDiv.appendChild(this.keyLoader);

    for (let i = 0; i < 3; i++) {
      // Create a div with the class 'key-loader-circle'
      const circle = document.createElement('div');
      circle.className = 'key-loader-circle';
      this.keyLoader.appendChild(circle);
    }

    for (let i = 0; i < 3; i++) {
      // Create a div with the class 'key-loader-shadow'
      const shadow = document.createElement('div');
      shadow.className = 'key-loader-shadow';
      this.keyLoader.appendChild(shadow);
    }

    this.keyLoaderPreviewText = document.createElement('span');
    this.keyLoaderPreviewText.id = 'keyLoaderPreviewText';
    this.keyLoaderPreviewText.innerText = 'awaiting transaction result...';
    this.keyLoaderPreviewText.style.position = 'absolute';
    this.keyLoaderPreviewText.style.top = '55%';
    this.keyLoaderPreviewText.style.left = '50%';
    this.keyLoaderPreviewText.style.transform = 'translateX(-50%)';
    this.keyLoaderPreviewText.style.fontFamily = 'Gabarito';
    this.keyLoaderPreviewText.style.color = 'white';
    this.keyLoaderPreviewText.style.textAlign = 'center';
    this.keyLoaderPreviewText.style.fontSize = '1.5em';
    this.keyLoaderPreviewText.style.fontWeight = '900';
    this.keyLoaderPreviewText.style.width = '80%';
    this.keyLoaderDiv.appendChild(this.keyLoaderPreviewText);

    // Array of fun facts
    const funFacts = [
      "Cryptocurrencies enable instant, global transactions effortlessly.",
      "Crypto markets offer round-the-clock trading, unlike traditional banks",
      "Crypto mining secures transactions, contrasting fiat's printability",
      "Cryptocurrencies can empower the unbanked with access to financial services",
      "Blockchain's immutability means once a transaction is recorded, it's final",
      "80% of all US dollars in existence were printed within the last 4 years",
      "Decentralized apps on blockchain offer more control and fewer middlemen",
      "Smart contracts automate and enforce agreements without intermediaries, streamlining transactions",
      "Cryptos like Bitcoin have a capped supply, making them potential assets to fight inflation from money printing",
      "Crypto gives users complete control over their digital assets, enhancing personal financial sovereignty"
    ];

    // Select a random fun fact
    const randomFact = funFacts[Math.floor(Math.random() * funFacts.length)];

    // Create the fun fact span
    this.funFactSpan = document.createElement('span');
    this.funFactSpan.innerText = `${randomFact}`;
    this.funFactSpan.style.position = 'absolute';
    this.funFactSpan.style.top = '82.5%';
    this.funFactSpan.style.left = '50%';
    this.funFactSpan.style.transform = 'translateX(-50%)';
    this.funFactSpan.style.textAlign = 'left';
    this.funFactSpan.style.fontFamily = 'Gabarito';
    this.funFactSpan.style.color = '#a04b00';
    this.funFactSpan.style.fontSize = '1em';
    this.funFactSpan.style.fontWeight = '100';
    this.funFactSpan.style.width = '80%';
    this.funFactSpan.style.fontStyle = 'italic';
    

    // Append the fun fact span to the keyLoaderDiv
    this.keyLoaderDiv.appendChild(this.funFactSpan);
      
    //event handling for mintkey
    window.addEventListener('mintKeyResult', (event) => {
      // Log the event detail
      console.log('Mint key result:', event.detail);

      // Animate the elements
      gsap.to([this.keyLoader, this.keyLoaderPreviewText, this.funFactSpan], {
        duration: 0.33, // Animation duration in seconds
        opacity: 0,
        onComplete: () => {
          // Once the animation is complete, remove the elements
          this.keyLoader.remove();
          this.keyLoaderPreviewText.remove();
          this.funFactSpan.remove();
        }
      });

      //handle
      if (event.detail.status === 'success'){
        console.log('mint key success', event.detail.status)
        this.handleMintedKey(event.detail.result);

        //create success content
        this.keyLoaderSucceed = document.createElement('div');
        this.keyLoaderSucceed.style.position = 'absolute';
        this.keyLoaderSucceed.style.top = '0';
        this.keyLoaderSucceed.style.left = '0';
        this.keyLoaderSucceed.style.height = '100%';
        this.keyLoaderSucceed.style.width = '100%';
        this.keyLoaderSucceed.style.opacity = '0';
        this.keyLoaderDiv.appendChild(this.keyLoaderSucceed);

        //successVx container
        const successVContainer = document.createElement('div');
        successVContainer.id = 'successVContainer';
        successVContainer.style.marginTop = '12.5%';
        this.keyLoaderSucceed.appendChild(successVContainer);

        //create success check
        const successV = document.createElement('div');
        successV.className = 'key-loader-succeed';
        successVContainer.appendChild(successV);

        //create success message
        const successText = document.createElement('span')
        successText.innerText = 'transaction success!';
        successText.style.position = 'absolute';
        successText.style.top = '77.5%';
        successText.style.left = '50%';
        successText.style.transform = 'translateX(-50%)';
        successText.style.fontFamily = 'Gabarito';
        successText.style.color = 'white';
        successText.style.textAlign = 'center';
        successText.style.fontSize = '2.5em';
        successText.style.fontWeight = '900';
        successText.style.width = '80%';
        this.keyLoaderSucceed.appendChild(successText);

        gsap.fromTo(this.keyLoaderSucceed, { opacity: 0 }, {
          duration: 0.33, // Animation duration in seconds
          opacity: 1
        });

        // Create and style the close button
        const closeButton = document.createElement('span');
        closeButton.textContent = '×';
        closeButton.style.color = '#995100';
        closeButton.style.float = 'right';
        closeButton.style.fontSize = '40px';
        closeButton.style.fontWeight = 'bold';
        closeButton.style.cursor = 'pointer';
        closeButton.style.position = 'absolute';
        closeButton.style.right = '3%';
        closeButton.style.top = '0%';
        closeButton.style.fontFamily = 'Gabarito';
        this.keyLoaderDiv.appendChild(closeButton);
        closeButton.onclick = function() {
          // Get the elements
          const keyLoaderDiv = document.getElementById('keyLoaderDiv');
          const keyLoaderOverlay = document.getElementById('keyLoaderOverlay');

          // Animate the elements
          gsap.to([keyLoaderDiv, keyLoaderOverlay, closeButton], {
            duration: 0.5, // Animation duration in seconds
            opacity: 0,
            onComplete: () => {
              // Once the animation is complete, remove the elements
              keyLoaderDiv.remove();
              keyLoaderOverlay.remove();
              closeButton.remove();
            }
          });
        };
      } else if (event.detail.status === 'failure'){
        this.cancelTransaction();
      } else {  
        console.log('unknown or missing mint key result', event.detail.status);
      }
    });

    gsap.fromTo(this.keyLoaderDiv, { opacity: 0 }, {
      duration: 0.5, // Animation duration in seconds
      opacity: 1
    });

  }

  cancelActivation(){
    if (document.getElementById('loadSpinnerContainer')) document.getElementById('loadSpinnerContainer').remove();
    if (document.getElementById('mint-spin')) document.getElementById('mint-spin').style.visibility = 'visible';
    if(document.getElementById('backgroundFilter')) document.getElementById('backgroundFilter').remove();
    this.removeSquareFromContainer();
    this.selectedHolokeyTokenId = null;
    this.selectedGlochipTokenId = null;
  }

  cancelTransaction(){    
    console.log('Mint key failed', event.detail.status);
        if (this.keyLoader) this.keyLoader.remove();
        if (this.keyLoaderPreviewText) this.keyLoaderPreviewText.remove();
        if (this.funFactSpan) this.funFactSpan.remove();
        if (document.getElementById('loadSpinnerContainer')) document.getElementById('loadSpinnerContainer').remove();
        if (document.getElementById('mint-spin')) document.getElementById('mint-spin').style.visibility = 'visible';
        //create failure content
        this.keyLoaderFail = document.createElement('div');
        this.keyLoaderFail.style.position = 'absolute';
        this.keyLoaderFail.style.top = '0';
        this.keyLoaderFail.style.left = '0';
        this.keyLoaderFail.style.height = '100%';
        this.keyLoaderFail.style.width = '100%';
        this.keyLoaderFail.style.opacity = '0';
        this.keyLoaderDiv.appendChild(this.keyLoaderFail);

        //failure x container
        const failureXContainer = document.createElement('div');
        failureXContainer.id = 'failureXContainer';
        failureXContainer.style.marginTop = '12.5%';
        this.keyLoaderFail.appendChild(failureXContainer);

        //create failure X
        const failureX = document.createElement('div');
        failureX.className = 'key-loader-failure';
        failureXContainer.appendChild(failureX);

        //create failure message
        const failureText = document.createElement('span')
        failureText.innerText = 'transaction failed!';
        failureText.style.position = 'absolute';
        failureText.style.top = '77.5%';
        failureText.style.left = '50%';
        failureText.style.transform = 'translateX(-50%)';
        failureText.style.fontFamily = 'Gabarito';
        failureText.style.color = 'white';
        failureText.style.textAlign = 'center';
        failureText.style.fontSize = '2.5em';
        failureText.style.fontWeight = '900';
        failureText.style.width = '80%';
        this.keyLoaderFail.appendChild(failureText);

        gsap.fromTo(this.keyLoaderFail, { opacity: 0 }, {
          duration: 0.33, // Animation duration in seconds
          opacity: 1
        });

        // Create and style the close button
        const closeButton = document.createElement('span');
        closeButton.textContent = '×';
        closeButton.style.color = '#995100';
        closeButton.style.float = 'right';
        closeButton.style.fontSize = '40px';
        closeButton.style.fontWeight = 'bold';
        closeButton.style.cursor = 'pointer';
        closeButton.style.position = 'absolute';
        closeButton.style.right = '3%';
        closeButton.style.top = '0%';
        closeButton.style.fontFamily = 'Gabarito';
        this.keyLoaderDiv.appendChild(closeButton);
        closeButton.onclick = function() {
          // Get the elements
          const keyLoaderDiv = document.getElementById('keyLoaderDiv');
          const keyLoaderOverlay = document.getElementById('keyLoaderOverlay');

          // Animate the elements
          gsap.to([keyLoaderDiv, keyLoaderOverlay, closeButton], {
            duration: 0.5, // Animation duration in seconds
            opacity: 0,
            onComplete: () => {
              // Once the animation is complete, remove the elements
              keyLoaderDiv.remove();
              keyLoaderOverlay.remove();
              closeButton.remove();
            }
          });
        };
  }

  handleMintedKey(e) {
    if (typeof sa_event === 'function') sa_event("purchased_key");
    const tokenId = e.detail.logs[0].eventsByType.wasm.token_id[0];
    const tokenUri = e.detail.logs[0].eventsByType.wasm.token_uri[0];
    console.log('Minted key:', tokenId);
    window.client.addClientNft(tokenId, tokenUri)
  }

  openGloChip(gloChip, holoKey) {
    if (this.openingGlochip) return;
    this.openingGlochip = true;
    console.log('glochip:', gloChip, 'holokey:', holoKey);

    window.addEventListener('txCancel', (event) => {
      this.cancelActivation();
      this.openingGlochip = false;
    });

    // Create a custom event with details
    const event = new CustomEvent("openGlochip", {
      detail: {
        keyId: holoKey,
        glochipId: gloChip,
        chainID: 'pisco-1'
      }
    });

    // Dispatch the event
    window.dispatchEvent(event);

    //handle temporary loading spinner
    //add background filter
    const backgroundFilter = document.createElement('div');
    backgroundFilter.id = 'backgroundFilter';
    backgroundFilter.style.background = 'black';
    backgroundFilter.style.position = 'absolute';
    backgroundFilter.style.top = '-15vh';
    backgroundFilter.style.left = '-5vw';
    backgroundFilter.style.height = '115vw';
    backgroundFilter.style.width = '120vw';
    backgroundFilter.style.zIndex = '2';
    backgroundFilter.style.opacity = '0.8';
    this.mintContainer.appendChild(backgroundFilter);

    //hide mintspin
    const mintSpin = document.querySelector('.mint-spin');
    mintSpin.style.visibility = 'hidden';

    //load spinner container
    const loadSpinnerContainer = document.createElement('div');
    loadSpinnerContainer.id = 'loadSpinnerContainer';
    loadSpinnerContainer.style.position = 'absolute';
    loadSpinnerContainer.style.left = '50%';
    loadSpinnerContainer.style.transform = 'translateX(-50%)';
    loadSpinnerContainer.style.height = '13vh';
    loadSpinnerContainer.style.width = '16vh';
    this.mintWindow.appendChild(loadSpinnerContainer);

    // Create new spinner
    const boxes = document.createElement('div');
    boxes.style.position = 'relative';
    boxes.style.left = '20%';
    boxes.style.top = '60%';
    boxes.className = 'mint-load-boxes';

    for (let i = 0; i < 4; i++) {
      const box = document.createElement('div');
      box.className = 'mint-load-box';

      for (let j = 0; j < 4; j++) {
        const div = document.createElement('div');
        box.appendChild(div);
      }

      boxes.appendChild(box);
    }

    loadSpinnerContainer.appendChild(boxes);

    //load spinner text
    const loadSpinnerText = document.createElement('span');
    loadSpinnerText.innerText = 'awaiting tx...';
    loadSpinnerText.style.position = 'absolute';
    loadSpinnerText.style.top = '93%';
    loadSpinnerText.style.left = '50%';
    loadSpinnerText.style.transform = 'translateX(-50%)';
    loadSpinnerText.style.fontFamily = 'Gabarito';
    loadSpinnerText.style.fontSize = '1.25em';
    loadSpinnerText.style.color = 'white';
    loadSpinnerText.style.textAlign = 'center';
    loadSpinnerText.style.fontWeight = '800';
    loadSpinnerText.style.width = '100%';
    loadSpinnerContainer.appendChild(loadSpinnerText);


    window.addEventListener('openGlochipResult', (event) => {
      // Log the event detail
      console.log('Open glochip result:', event.detail);
      if (event.detail.status === 'success'){
        console.log('open glochip success', event.detail.status)
        this.handleOpenedGlochip(event.detail.result);
        this.openingGlochip = false;
      } else if (event.detail.status === 'failure'){
        console.log('open glochip failed', event.detail.status);
        mintSpin.style.display = 'flex';
        loadSpinnerContainer.remove();
        backgroundFilter.remove();
        this.openingGlochip = false;
      } else {  
        mintSpin.style.display = 'flex';
        loadSpinnerContainer.remove();
        backgroundFilter.remove();
        console.log('unknown or missing open glochip result', event.detail.status);
        this.openingGlochip = false;
      }
    });
  }
}

// Add Glomart class
class GloMart {
  constructor(subdomain) {
    this.init(subdomain);
  }

  async init(subdomain) {
    this.navItems = []; // ['search', 'browse', 'listing', 'sell'];
    this.selectedIndex = 0; // Index of the selected nav item

    console.log('awaiting socket connection')
    await window.client.awaitSocketConnection();

    console.log('socket connected, getting lookbook')

    //get listings data
    window.addEventListener('WindowStateChanged', this.handleState.bind(this));
    window.client.socket.on('marketplace_data', (data) => {
      console.log('recieved redis listings:', data)
      this.updatingListings = true;
      this.allListings = data;
    });
    //get lookbook data
    window.client.socket.emit('paging_lookbook');
    window.client.socket.on('lookbook_entries', (lookbookEntries) => {
      console.log('Received lookbook entries:', lookbookEntries);
      this.lookbook = lookbookEntries;
    });

    if (window.windowState == 'marketplace') await this.handleState();

    const segments = window.location.pathname.split('/').filter(segment => segment);
    if (subdomain === 'sell') {
      this.activePage = 'Sell';
      this.handleNavItemClick(subdomain);
    } else if (subdomain === 'market') {
      console.log('subdomain is market mf');
      this.handleNavItemClick(subdomain);
    } else {
      console.log('subdomain market/', subdomain)
      const marketSegments = segments.slice(2); // Get the segments after '/market'
      switch (marketSegments.length) {
        case 1:
          // Handle the case where the URL is '/market/something'
          this.handleNavItemClick('marketpool');
          console.log('Market segment:', marketSegments[0]);
          const convertedSubdomain = {
            caption: marketSegments[0],
            type: marketSegments[0] === 'all' ? null : marketSegments[0].slice(0, -1)
          };
          this.market = new Market();
          this.activePage = 'MarketPool';
          this.previousContainer = document.getElementById('marketStandsContainer');
          if (this.previousContainer) {
            this.previousContainer.remove();
          }
            new Promise((resolve, reject) => {
            // Get lookbook data
            window.client.socket.emit('paging_lookbook');
            window.client.socket.on('lookbook_entries', (lookbookEntries) => {
              console.log('Received lookbook entries:', lookbookEntries);
              this.lookbook = lookbookEntries;
              resolve();
            });
          }).then(() => {
            // Now that we have the lookbook data, we can create the listing stall
            this.market.createListingStall(convertedSubdomain);
          });
          break;
        case 2:
          // Handle the case where the URL is '/market/something/something'
          this.handleNavItemClick('listing');
          console.log('Market segments:', marketSegments[0], marketSegments[1]);
          const converted2Subdomain = {
            name: marketSegments[1],
            type: marketSegments[1].slice(0, -1)
          }
          this.activePage = 'Market';
          this.market = new Market();
          // Add this block of code to remove 'marketStandsContainer'
          this.previousContainer = document.getElementById('marketStandsContainer');
          if (this.previousContainer) {
            this.previousContainer.remove();
          }
          this.previous2Container = document.getElementById('parentContainer');
          if (this.previous2Container) {
            this.previous2Container.remove();
          }
          this.filterType = null;
          console.log('market segments', marketSegments)
          if (marketSegments[0] !== 'all') {
            /* case when type but not all (pfps...)*/
            this.filterType = converted2Subdomain;
            // this.market.previousPool = converted2Subdomain;
            if (marketSegments[0] === 'victories') {
              this.market.previousPool = {
                caption: marketSegments[0],
                type: 'victory'
              }
          } else if (marketSegments[0] === 'luncmen'){
            this.market.previousPool = {
              caption: marketSegments[0],
              type: 'luncman'
            }
          } else if (marketSegments[1] === 'listings'){
            this.market.previousPool = {
              caption: marketSegments[0],
              type: marketSegments[0].slice(0, -1)
            }
            this.filterType = {
              type: marketSegments[0].slice(0, -1)
            }
          } else{
            this.market.previousPool = {
              caption: marketSegments[0],
              type: marketSegments[0].slice(0, -1)
            }
          }
          } else {
              if (marketSegments[1] === 'listings'){
                this.market.previousPool = {
                  caption: 'all',
                  type: null
                }
            } else {
              /* case when name (predemokey...)*/
              this.filterType = {
                name: marketSegments[1]
              }
              this.market.previousPool = {
                caption: 'all',
                type: null
              }
            }
          }
          console.log(marketSegments);
          if (marketSegments[1] === 'listings') {
            this.market.listingTitle = marketSegments[0];
          } else {
            this.market.listingTitle = marketSegments[1];
          }
          console.log('previous page is :', this.market.previousPool);
          console.log('window previous page is :', window.nftMachine.gloMartInstance.market.previousPool);
          console.log('getting listings', this.filterType)
          this.loadListings(this.filterType);
          this.market.createListingContainer();
          break;
        case 3: 
          // Handle the case where the URL is '/market/something/something/something'
          this.handleNavItemClick('market_listing');
          console.log('Market segments:', marketSegments[0], marketSegments[1], marketSegments[2]);
          this.activePage = 'Listing';
          this.market = new Market();
          this.parsedListing = new Listing(window.parsedListingData, 'listing');
          this.previousContainer = document.getElementById('marketStandsContainer');
          if (this.previousContainer) {
            this.previousContainer.remove();
          }
          window.nftMachine.gloMartInstance.activePage = 'Listing';
          this.marketContainer = document.getElementById('marketContainer');
          if (this.marketContainer) {
            this.marketContainer.remove();
          }
          console.log('Market segments:', marketSegments[0], marketSegments[1]);
          const converted3Subdomain = {
            name: marketSegments[1],
            type: marketSegments[1].slice(0, -1)
          }
          this.filterType = null;
          console.log('market segments', marketSegments)
          if (marketSegments[0] !== 'all') {
            /* case when type but not all (pfps...)*/
            this.filterType = converted3Subdomain;
            // this.market.previousPool = converted2Subdomain;
            if (marketSegments[0] === 'victories') {
              this.market.previousPool = {
                caption: marketSegments[0],
                type: 'victory'
              }
          } else if (marketSegments[0] === 'luncmen'){
            this.market.previousPool = {
              caption: marketSegments[0],
              type: 'luncman'
            }
          } else if (marketSegments[1] === 'listings') {
            this.filterType = {
              name: marketSegments[0].slice(0, -1)
            }
              this.market.previousPool = {
                caption: 'all',
                type: null
              }
          }else{
            this.market.previousPool = {
              caption: marketSegments[0],
              type: marketSegments[0].slice(0, -1)
            }
          }
          } else {
              if (marketSegments[1] === 'listings'){
                this.market.previousPool = {
                  caption: 'all',
                  type: null
                }
            } else {
              /* case when name (predemokey...)*/
              this.filterType = {
                name: marketSegments[1]
              }
              this.market.previousPool = {
                caption: 'all',
                type: null
              }
            }
          }
          console.log('getting listings', this.filterType)
          this.loadListings(this.filterType);
          break;
        default:
          console.log('FUCK YOU Bitch');
          break;
      }
    } 
  }

  async handleState() {
    switch (window.windowState) {
      case 'nft':
        this.hideMarketplacePageElements();
        this.createNftPageElements();
        break;
      case 'marketplace':
        this.createMarketplacePageElements();
        break;
      default:
        break;
    }
  }

  createNftPageElements() {
    if (this.activePage !== 'GloMart') return;
    console.log('transitioning, active page:', this.activePage)
    this.activePage = 'Printer';
    // this.hideMarketplacePageElements();
    // window.videoBackground.transitionTo('glotop_printer', () => {
    // });
  }
  
  createMarketplacePageElements() {
    switch (this.activePage) {
      case 'Market':
        break;
      case 'Browse':
        console.log('create marketplace page elements for browse');
        break;
      case 'Sell':
        console.log('create marketplace page elements for sell');
        break;
      case 'MarketStand':
        console.log('create marketplace page elements for market stands');
        break;
      case 'MarketPool':
        console.log('create marketplace page elements for market stands');
        break;
      default:
        console.log('create marketplace page elements for glomart');
    
        // create glomart elements
        this.createGloMartBackground();
        this.createNavBarElement();
        this.activePage = 'GloMart';
        break;
    }
  }

  hideMarketplacePageElements() {
    this.hideGloMartBackground();
    this.hideOSElements();
  }

  loadListings(argument) {
    window.client.socket.emit('get_marketplace_data', { filter: argument });
  }


  hideGloMartBackground() {
    if(this.gloMartBackground) this.gloMartBackground.style.display = 'none';
  }

  hideOSElements() {
    if(this.marketOS) {
      gsap.killTweensOf(this.marketOS);
        this.marketOS.style.display = 'none';
        this.marketOS.style.opacity = '0';
    }

    if(this.sellOS) {
      gsap.killTweensOf(this.sellOS);
        this.sellOS.style.display = 'none';
        this.sellOS.style.opacity = '0';
    }
  }

  createGloMartBackground() {
    console.log('createglomartbackground');
    if (this.gloMartBackground) {
      this.gloMartBackground.style.display = 'flex';
    } else {
      this.gloMartBackground = document.createElement('div');
      this.gloMartBackground.id = 'gloMartBackground';
      this.gloMartBackground.style.position = 'fixed'; // Make it fixed position
      this.gloMartBackground.style.top = '0';          // Start from the top
      this.gloMartBackground.style.left = '0';         // Start from the left
      this.gloMartBackground.style.zIndex = '0';
      this.gloMartBackground.style.height = '100%';    
      this.gloMartBackground.style.width = '100%';
      this.gloMartBackground.style.backgroundColor = '#232C21';

      this.abstractVideo = document.createElement('video');
      this.abstractVideo.src = '/style/graphics/glomart.webm';
      this.abstractVideo.loop = true;
      this.abstractVideo.autoplay = true;
      this.abstractVideo.muted = true;
      this.abstractVideo.style.position = 'absolute';
      this.abstractVideo.style.width = '100%';
      this.abstractVideo.style.height = '100%';
      this.abstractVideo.style.opacity = '0.25';
      this.abstractVideo.style.objectFit = 'cover';
      this.gloMartBackground.appendChild(this.abstractVideo);
      document.body.appendChild(this.gloMartBackground);

      // Create a container for the search bar and icon
      this.searchContainer = document.createElement('div');
      this.searchContainer.className = 'search-wrapper';
      this.searchContainer.style.display = 'none'; // TEMPORARY FOR DEMO

      // Create the search icon button
      this.searchButton = document.createElement('button');
      this.searchButton.className = 'icon';

      // Create the SVG for the search icon and append it to the button
      this.searchIcon = document.createElement('img');
      this.searchIcon.src = '/style/graphics/greensearch.png'; // Path to your icon image
      this.searchIcon.style.width = '3.5vh';
      this.searchIcon.style.marginRight = '15%';

      
      this.searchButton.appendChild(this.searchIcon);

      // Create the search input and append it to the container
      this.searchInput = document.createElement('input');
      this.searchInput.placeholder = 'search..';
      this.searchInput.className = 'search-input';
      this.searchInput.name = 'text';
      this.searchInput.type = 'text';
      // Add an event listener for the click event to the search icon
      // Add an event listener for the click event to the search container
      this.searchContainer.addEventListener('click', () => {
        // When anything within the search container is clicked, focus the search input
        this.searchInput.focus();
      });
      // Append the button and input to the container
      this.searchContainer.appendChild(this.searchButton);
      this.searchContainer.appendChild(this.searchInput);

    
      // Append the search container to the content container
      gloMartBackground.appendChild(this.searchContainer);
    } 
}


  handleGloMartClick() {
    switch (this.activePage) {
      case 'GloMart':
        this.gloMartElement.style.display = 'none';
        const nftMachineInstance = NftMachine.getInstance();
        break;
      case 'Browse':
        const browseContainer = document.getElementById('browseContainer');
        browseContainer.remove();
        this.activePage = 'GloMart';
        break;
      case 'Market':
        const marketContainer = document.getElementById('marketContainer');
        marketContainer.remove();
        this.activePage = 'MarketPool';
        console.log('creating listing stall', window.nftMachine.gloMartInstance.market.previousPool)
        this.allListings = null;
        window.nftMachine.gloMartInstance.market.createListingStall(window.nftMachine.gloMartInstance.market.previousPool);
        break;
      case 'Sell':
        console.log('REMOVING SELL CONTAINERS');
        const sellContainer = document.getElementById('sellContainer');
        if(sellContainer) sellContainer.remove();
        const selectOS = document.getElementById('selectOS');
        if(selectOS) selectOS.remove();
        const sellGuest = document.getElementById('sellGuest');
        if(sellGuest) sellGuest.remove();
        this.handleMarketOS('glomart');
        this.activePage = 'GloMart';
        break;
      case 'Listing':
        this.activePage = 'Market';
        const listingContainer = document.getElementById('listingContainer');
        listingContainer.remove();
        window.nftMachine.gloMartInstance.market.createListingContainer();
        let url = new URL(window.location.href);
        let pathSegments = url.pathname.split('/');
        if (pathSegments.length > 0) {
          pathSegments.pop(); // Remove the last segment
        }
        url.pathname = pathSegments.join('/');
        window.history.pushState({}, '', url.href);
        break;
      case 'MarketStand':
        const marketStandsContainer = document.getElementById('marketStandsContainer');
        marketStandsContainer.remove();
        this.handleMarketOS('glomart');
        this.activePage = 'GloMart';
        break;
      case 'MarketPool':
        console.log('marketpool remove');
        const parentContainer = document.getElementById('parentContainer');
        parentContainer.remove();
        this.activePage = 'MarketStand';
        window.nftMachine.gloMartInstance.market.createMarketStands();
        break;
      default:
        console.error('Unknown active page', this.activePage);
        break;
    }
  }

  handleNavItemClick(navItem, returnOverride) {
    switch (navItem) {
        case 'browse':
            new Browse();
            break;
        case 'market':
          this.activePage = 'MarketStand';
          this.handleMarketOS('marketstand');
          if (!returnOverride) window.glogo.returning = true;
          this.market = new Market();
          break;
        case 'marketpool':
          this.handleMarketOS('marketstand');
          break;  
        case 'listing':
          this.handleMarketOS('marketstand');
          break;  
        case 'market_listing':
          this.handleMarketOS('marketstand');
          break; 
        case 'sell':
            this.marketOS.style.display = 'none';
            this.handleMarketOS('sell');
            new Sell();
            break;
        default:
            console.error(`Unknown nav item clicked: ${navItem}`);
    }
}

  createNavBarElement() {
    // Create main nav bar container
    console.error('creating navbar')
    if (this.marketOS) {
      this.showGloMartOS();
      return
    }

    // CREATE MARKET OS
    this.marketOS = document.createElement('div');
    this.marketOS.id = 'marketOS';
    this.marketOS.style.position = 'absolute';
    this.marketOS.style.top = '15%';
    this.marketOS.style.width = '60%';
    this.marketOS.style.height = '72.5%'
    this.marketOS.style.left = '5%';
    this.marketOS.style.border = '1px solid #39FF14';
    this.marketOS.style.borderRadius = '10px';
    this.marketOS.style.background = 'linear-gradient(to bottom, #39FF14 5%, #1B2318 5%)';
    this.marketOS.style.cursor = 'pointer';
    this.marketOS.style.display = 'flex';
    this.marketOS.style.justifyContent = 'center';
    this.marketOS.style.alignItems = 'center';
    this.marketOS.style.opacity = '0';
    document.body.appendChild(this.marketOS);

    gsap.to(this.marketOS, {
      opacity: 1,
      duration: 1,
    });

    this.marketOSEXE = document.createElement('div');
    this.marketOSEXE.innerText = 'MARKET.exe';
    this.marketOSEXE.style.fontSize = '1rem';
    this.marketOSEXE.style.zIndex = '1';
    this.marketOSEXE.style.left = '2%';
    this.marketOSEXE.style.top = '1.5%';
    this.marketOSEXE.style.position = 'absolute';
    this.marketOS.appendChild(this.marketOSEXE);

    this.marketOSUI = document.createElement('img');
    this.marketOSUI.src = '/style/graphics/OSui.png';
    this.marketOSUI.id = 'marketui';
    this.marketOSUI.style.position = 'absolute';
    this.marketOSUI.style.right = '1%';
    this.marketOSUI.style.top = '0%';
    this.marketOSUI.style.height = '5%';
    this.marketOSUI.style.zIndex = '5';
    this.marketOSUI.style.cursor = 'pointer';
    this.marketOS.appendChild(this.marketOSUI);
    this.marketOSUI.addEventListener('click', () => {
        console.log('egnog');
      if (this.activePage !== 'GloMart') {
        this.handleMarketOS('glomart');
        if(document.getElementById('parentContainer')) {
          document.getElementById('parentContainer').remove();
        }
        if(document.getElementById('marketContainer')) {
          document.getElementById('marketContainer').remove();
        }
        if(document.getElementById('marketStandsContainer')) {
          document.getElementById('marketStandsContainer').remove();
        }
        if(document.getElementById('listingContainer')) {
          document.getElementById('listingContainer').remove();
        }
        if(document.getElementById('')) {
          document.getElementById('').remove();
        }
        history.pushState({}, '', window.location.origin + '/glomart');
        this.activePage = 'GloMart';
      }
    });

    this.squaresContainer = document.createElement('video');
    this.squaresContainer.src = '/style/graphics/gloweb.webm';
    this.squaresContainer.loop = true;
    this.squaresContainer.autoplay = true;
    this.squaresContainer.muted = true;
    this.squaresContainer.id = 'squaresContainer'; 
    this.squaresContainer.style.position = 'absolute';
    this.squaresContainer.style.left = '50%';
    this.squaresContainer.style.transform = 'translate(-50%, 0%)';
    this.squaresContainer.style.width = '100%';
    this.squaresContainer.style.height = '92.5%';
    this.squaresContainer.style.objectFit = 'cover';
    this.squaresContainer.style.top = '5%';
    this.marketOS.appendChild(this.squaresContainer);

    this.squaresContainer.addEventListener('click', () => {
      this.handleNavItemClick('market');
    });

    this.marketLabel = document.createElement('button');
    this.marketLabel.className = 'marketLabel';
    this.marketLabel.style.position = 'absolute';
    this.marketLabel.style.top = 'calc(50% - 25px)'; // 50% - half of height
    this.marketLabel.style.left = 'calc(50% - 100px)'; // 50% - half of width
    this.marketLabel.style.zIndex = '2';
    this.marketLabel.id = 'marketLabel';
    this.marketLabel.addEventListener('click', () => {
      this.handleNavItemClick('market');
    });

    this.marketLabelTxt = document.createElement('span');
    this.marketLabelTxt.className = 'marketLabelTxt';
    this.marketLabelTxt.innerText = 'MARKET';
    this.marketLabelTxt.style.height = '2rem';
    this.marketLabelTxt.style.zIndex = '1';
    this.marketLabelTxt.id = 'marketLabelTxt';
    this.marketLabelTxt.style.display = 'flex';
    this.marketLabelTxt.style.alignItems = 'center';
    this.marketLabel.appendChild(this.marketLabelTxt);
    this.marketOS.appendChild(this.marketLabel);

    this.marketOS.appendChild(this.squaresContainer);

    //CREATE SELL OS WINDOW
    this.sellOS = document.createElement('div');
    this.sellOS.style.position = 'absolute';
    this.sellOS.style.bottom = '5%';
    this.sellOS.style.right = '5%';
    this.sellOS.style.height = '50%';
    this.sellOS.style.width = '35%';
    this.sellOS.style.backgroundColor = '#181D16'
    this.sellOS.style.zIndex = '5'
    this.sellOS.style.border = '1px solid #39FF14';
    this.sellOS.style.borderRadius = '10px';
    this.sellOS.id = 'sellOS';
    this.sellOS.style.cursor = 'pointer';
    this.sellOS.style.background = 'linear-gradient(to bottom, #39FF14 6%, #1B2318 5%)';
    this.sellOS.style.opacity = '0';

    gsap.to(this.sellOS, {
      opacity: 1,
      duration: 1,
    });

    this.sellOSEXE = document.createElement('div');
    this.sellOSEXE.innerText = 'LIST.exe';
    this.sellOSEXE.style.fontSize = '0.9rem';
    this.sellOSEXE.style.zIndex = '1';
    this.sellOSEXE.style.left = '2%';
    this.sellOSEXE.style.top = '1.5%';
    this.sellOSEXE.style.position = 'absolute';
    this.sellOS.appendChild(this.sellOSEXE);

    this.sellOSUI = document.createElement('img');
    this.sellOSUI.src = '/style/graphics/OSui.png';
    this.sellOSUI.id = 'marketui';
    this.sellOSUI.style.position = 'absolute';
    this.sellOSUI.style.right = '1%';
    this.sellOSUI.style.top = '0.5%';
    this.sellOSUI.style.height = '5%';
    this.sellOSUI.style.zIndex = '6';
    this.sellOS.appendChild(this.sellOSUI);
    this.sellOSUI.addEventListener('click', () => {
      if (this.activePage != 'GloMart') {
        this.handleMarketOS('glomart');
        if(document.getElementById('sellContainer')) {
          document.getElementById('sellContainer').remove();
        }
        document.getElementById('marketOS').style.display = 'flex';
        history.pushState({}, '', window.location.origin + '/glomart');
        this.activePage = 'GloMart';
      }
    });


    this.sellCart = new SpriteSheet({
      src: '/style/graphics/cart.webp',
      parent: this.sellOS,
      frameWidth: 270,
      frameHeight: 270,
      frameCount: 72,
      framesPerRow: 9,
      fps: 24,
      loop: true
    });
    this.sellCart.canvas.id = 'sellCart';
    this.sellCart.canvas.style.zIndex = '1';
    this.sellCart.canvas.style.position = 'relative';
    this.sellCart.canvas.style.left = '50%';
    this.sellCart.canvas.style.transform = 'translate(-50%, 0%)';
    this.sellCart.canvas.style.backgroundRepeat = 'no-repeat';
    this.sellCart.canvas.style.height = '95%';
    this.sellCart.canvas.style.width = '95%';
    this.sellCart.canvas.style.top = '2.5%';
    this.sellCart.canvas.addEventListener('click', () => {
        this.handleNavItemClick('sell');
      });

    this.sellLabel = document.createElement('button');
    this.sellLabel.className = 'marketLabel';
    this.sellLabel.style.position = 'absolute';
    this.sellLabel.style.top = 'calc(50% - 25px)'; // 50% - half of height
    this.sellLabel.style.left = 'calc(50% - 100px)'; // 50% - half of width
    this.sellLabel.style.zIndex = '2';
    this.sellLabel.id = 'sellLabel';
    this.sellLabel.addEventListener('click', () => {
      this.handleNavItemClick('sell');
    });

    this.sellLabelTxt = document.createElement('span');
    this.sellLabelTxt.className = 'marketLabelTxt';
    this.sellLabelTxt.innerText = 'SELL';
    this.sellLabelTxt.style.height = '2rem';
    this.sellLabelTxt.style.zIndex = '1';
    this.sellLabelTxt.id = 'sellLabelTxt';
    this.sellLabelTxt.style.display = 'flex';
    this.sellLabelTxt.style.alignItems = 'center';
    this.sellLabel.appendChild(this.sellLabelTxt);
    this.sellOS.appendChild(this.sellLabel);

    document.body.appendChild(this.sellOS);
  }

  showGloMartOS() {
    console.log('showing glomart os');
    this.marketOS.style.display = 'flex';
    this.sellOS.style.display = 'flex';

    if(this.marketOSTimeout) clearTimeout(this.marketOSTimeout);
    if(this.sellOSTimeout) clearTimeout(this.sellOSTimeout);
    
    gsap.to(this.marketOS, {
      opacity: 1,
      duration: 1,
    });

    gsap.to(this.sellOS, {
      opacity: 1,
      duration: 1,
    });
  }
  
  handleMarketOS(marketState) {
    console.log('handlingmarketos')
    switch (marketState){
      case 'glomart':
        console.log('handling market os glomart case:', marketState);
        gsap.to(this.marketOS, { width: '60%', height: '72.5%', autoAlpha: 1, duration: 0.5 });
        gsap.to(this.sellOS, { width: '35%', height: '50%', autoAlpha: 1, duration: 0.5 });
        gsap.to([this.squaresContainer, this.marketLabel, this.sellCart.canvas, this.sellLabel], { autoAlpha: 1, duration: 0.5 });
        const sellGuest = document.getElementById('sellGuest');
        if(sellGuest) sellGuest.remove();
        break;
      case 'marketstand':
        console.log('handling market os marketstand case:', marketState);
        gsap.to(this.marketOS, { width: '90%', height: '80%', autoAlpha: 1, duration: 0.5 });
        gsap.to([this.sellOS, this.squaresContainer, this.marketLabel], { autoAlpha: 0, duration: 0.5 });
        break;
      case 'marketpool':
        console.log('handling market os marketpool case:', marketState);
        break;
      case 'listing':
        console.log('handling market os listing case:', marketState);
        break;
      case 'sell':
        console.log('handling market os sell case:', marketState);
        gsap.to(this.sellOS, { width: '90%', height: '77.5%', autoAlpha: 1, duration: 0.5 });
        gsap.to([this.marketOS, this.sellCart.canvas, this.sellLabel], { autoAlpha: 0, duration: 0.5 });
        break;
      default:
        break;
    }
  }
}
    // make content container gsap scale x from 0-100% and visible
class Browse {
  constructor() {
    // Logic specific to the Browse page goes here
    window.nftMachine.gloMartInstance.activePage = 'Browse';
    window.glogo.updateURL();
    this.createBrowsePageElements();
  }

  createBrowsePageElements() {
    if (this.browseContainer) {
      gsap.to(this.browseContainer, { autoAlpha: 1, duration: 0.5 });
      return;
    }
    // Main container
    this.browseContainer = document.createElement('div');
    this.browseContainer.id = 'browseContainer';
    this.browseContainer.style.position = "absolute";
    this.browseContainer.style.top = "20%";
    this.browseContainer.style.left = "10%";
    this.browseContainer.style.width = "80%";
    this.browseContainer.style.height = "70%";
    this.browseContainer.style.overflowY = "auto"; // For scrolling

    const categories = ['Recently Purchased', 'Trending Now', 'Featured Collection', 'Newly Added'];

    categories.forEach((category, index) => {
      // Create category title
      const categoryTitle = document.createElement('h2');
      categoryTitle.innerText = category;
      categoryTitle.style.color = "white";
      categoryTitle.style.fontFamily = "Gabarito, sans-serif";
      this.browseContainer.appendChild(categoryTitle);

      // Create scrollable row container
      const rowContainer = document.createElement('div');
      rowContainer.style.display = "flex";
      rowContainer.style.overflowX = "auto"; // Horizontal scrolling

      // Let's add some sample grey rectangles for each row. You can increase the count as necessary.
      for (let i = 0; i < 10; i++) {
        const itemBox = document.createElement('div');
        itemBox.style.width = "15rem";
        itemBox.style.height = "15rem";
        itemBox.style.marginRight = "10px";
        itemBox.style.backgroundColor = "white";
        rowContainer.appendChild(itemBox);
      }

      this.browseContainer.appendChild(rowContainer);
    });

    document.body.appendChild(this.browseContainer);
  }
}

class Market {
  constructor() {
    window.glogo.updateURL();
    this.createMarketStands();
    this.sortOrder = 'lo2hi';
    this.buttonState = 'buyNow';
    this.showBidless = false;
    console.log('Creating Market Instance')
  }

  createMarketStands() {
    // Main container for market stands
    this.marketStandsContainer = document.createElement('div');
    this.marketStandsContainer.id = 'marketStandsContainer';
    this.marketStandsContainer.style.width = '97%';
    this.marketStandsContainer.style.height = '89%';
    this.marketStandsContainer.style.float = 'left';
    this.marketStandsContainer.style.position = 'absolute';
    this.marketStandsContainer.style.top = '8%';
    this.marketStandsContainer.style.left = '0%';
    this.marketStandsContainer.style.backgroundColor = 'transparent';
    this.marketStandsContainer.style.overflow = 'hidden'; // Enable horizont'al scrolling
    this.marketStandsContainer.style.display = 'grid';
    this.marketStandsContainer.style.gridTemplateColumns = 'repeat(4, 1fr)';
    this.marketStandsContainer.style.gridTemplateRows = 'repeat(4, 1fr)';
    this.marketStandsContainer.style.flexWrap = 'wrap';
    this.marketStandsContainer.style.justifyContent = 'space-between';
    this.marketStandsContainer.style.alignItems = 'center';
    this.marketStandsContainer.style.left = '50%';
    this.marketStandsContainer.style.transform = 'translate(-50%, 0%)';
    this.marketStandsContainer.style.gridGap = '1vw'; // Sets both row-gap and column-gap

    const items = [
      { caption: 'all', type: null },
      { caption: 'glotags', type: 'glotag' },
      { caption: 'arcades', type: 'arcade' },
      { caption: 'luncmen', type: 'luncman' },
      { caption: 'pfps', type: 'pfp' },
      { caption: 'victories', type: 'victory' },
      { caption: 'reactions', type: 'reaction' },
      { caption: 'glochips', type: 'glochip' },
      { caption: 'keys', type: 'key' }
    ];

    // Define styles for each unique item
    const itemStyles = {
      all: { width: '98%', height: '96%' },
      glotags: { width: '97%', height: '96%' },
      arcades: { width: '97%', height: '96%' },
      luncmen: { width: '94%', height: '96%' },
      pfps: { width: '97%', height: '96%' },
      victories: { width: '94%', height: '96%' },
      reactions: { width: '97%', height: '96%' },
      glochips: { width: '97%', height: '96%' },
      keys: { width: '97%', height: '96%' }
    };

    const itemGridAreas = {
      all: '1 / 1 / 2 / 4', // 3 grids
      glotags: '1 / 4 / 2 / 5', // 1 grid
      arcades: '2 / 1 / 4 / 3', // 2 grids
      luncmen: '2 / 3 / 3 / 4', // 1 grid
      pfps: '2 / 4 / 3 / 5', // 1 grid
      victories: '3 / 3 / 4 / 4', // 1 grid
      reactions: '3 / 4 / 4 / 5', // 1 grid
      glochips: '4 / 1 / 5 / 3', // 2 grids
      keys: '4 / 3 / 5 / 5' // 2 grids
    };

    items.forEach((item) => {
      // Create box for each item
      const itemBox = document.createElement('div');
      const gridArea = itemGridAreas[item.caption]; // Get grid area for this item
      itemBox.style.gridArea = gridArea;
      const styles = itemStyles[item.caption]; // Get styles for this item
      itemBox.style.width = styles.width;
      itemBox.style.height = styles.height;
      itemBox.style.margin = '10px auto'; // Center itemBox horizontally
      itemBox.style.color = '#34ff19';
      itemBox.style.border = '3px solid #34ff19';
      itemBox.style.boxShadow = '1px 1px 10px #34ff19';
      itemBox.style.display = 'flex';
      itemBox.style.justifyContent = 'center';
      itemBox.style.alignItems = 'center';
      itemBox.style.cursor = 'pointer';
      itemBox.className = 'btn-1';

      for (let i = 0; i < 4; i++) {
        const span = document.createElement('span');
        itemBox.appendChild(span);
      }

      const textSpan = document.createElement('span');
      textSpan.innerText = item.caption;
      textSpan.style.position = 'relative';
      textSpan.style.zIndex = '2'; // Ensure text is above the spans
      itemBox.appendChild(textSpan); 

      itemBox.addEventListener('click', () => {
        window.nftMachine.gloMartInstance.activePage = 'MarketPool';
        this.marketStandsContainer.remove();
        this.createListingStall(item);
      });

      this.marketStandsContainer.appendChild(itemBox);
    });

    window.nftMachine.gloMartInstance.marketOS.appendChild(this.marketStandsContainer);
  }

  createListingStall(item) {
    const market = document.getElementById('parentContainer');
    if (market) market.remove();

    this.hoverSelection = null;
    this.lookbook = window.nftMachine.gloMartInstance.lookbook;
    console.log('lookbook:', this.lookbook);
    this.lookbookPfps = window.nftMachine.gloMartInstance.lookbook.filter(item => item.type === 'PFP');
    this.lookbookReactions = window.nftMachine.gloMartInstance.lookbook.filter(item => item.type === 'Reaction');
    this.lookbookLuncmen = window.nftMachine.gloMartInstance.lookbook.filter(item => item.type === 'Luncman');
    this.lookbookVictories = window.nftMachine.gloMartInstance.lookbook.filter(item => item.type === 'Victory');
    this.lookbookGlotags = window.nftMachine.gloMartInstance.lookbook.filter(item => item.type === 'Glotag');
    this.lookbookArcades = window.nftMachine.gloMartInstance.lookbook.filter(item => item.type === 'Arcade');
    this.lookbookKeys = window.nftMachine.gloMartInstance.lookbook.filter(item => item.type === 'Key');
    this.lookbookGlochips = window.nftMachine.gloMartInstance.lookbook.filter(item => item.type === 'Glochip');

    console.log('item:', item, 'item.caption', item.caption);

    const newUrl = `${window.location.origin}/glomart/market/${item.caption}`;
    //set active page to 
    window.history.replaceState(null, null, newUrl);

    switch(item.caption){
      case 'all':
        this.lookbookAll = true;
        this.createListingPool(this.lookbook, item);
        break;
      case 'pfps':
        this.lookbookAll = false;
        this.createListingPool(this.lookbookPfps, item);
        break;
      case 'reactions':
        this.lookbookAll = false;
        this.createListingPool(this.lookbookReactions, item);
        break;
      case 'luncmen':
        this.lookbookAll = false;
        this.createListingPool(this.lookbookLuncmen, item);
        break;
      case 'victories':
        this.lookbookAll = false;
        this.createListingPool(this.lookbookVictories, item);
        break;
      case 'glotags':
        this.lookbookAll = false;
        this.createListingPool(this.lookbookGlotags, item);
        break;
      case 'arcades':
        this.lookbookAll = false;
        this.createListingPool(this.lookbookArcades, item);
        break;
      case 'keys':
        this.lookbookAll = false;
        this.createListingPool(this.lookbookKeys, item);
        break;
      case 'glochips':
        this.lookbookAll = false;
        this.createListingPool(this.lookbookGlochips, item);
        break;
      default:
        // Default logic if item is not recognized
        break;
    }
  }

  createListingPool(listings, item) {
    document.getElementById('marketOS').style.cursor = 'default';
    this.hoverSelection = null;
    const parentContainer = document.createElement('div');
    parentContainer.id = 'parentContainer';
    parentContainer.style.width = '100%';
    parentContainer.style.height = '100%';
    parentContainer.style.position = 'absolute';
    parentContainer.style.top = '0%';

    // Create a new container for the item boxes
    const itemSelector = document.createElement('div');
    itemSelector.style.position = 'relative';
    itemSelector.style.top = '7%';
    itemSelector.style.left = '2%';
    itemSelector.style.width = '45%';
    itemSelector.style.height = '93%';
    parentContainer.appendChild(itemSelector);

    // Create box for 'all' item
    const allItemBox = document.createElement('div');
    allItemBox.style.width = '85%'; // Change to auto to fit the text
    allItemBox.style.height = '5.65%'; // Add padding instead of fixed width and height
    allItemBox.style.color = '#39ff19';
    allItemBox.style.display = 'flex';
    allItemBox.style.justifyContent = 'center';
    allItemBox.style.alignItems = 'center';
    allItemBox.style.cursor = 'pointer';
    allItemBox.innerText = 'all';
    allItemBox.className = 'border-el-btn';
    allItemBox.style.margin = '.95vh';


    // Create the four span elements for the animation
    for (let i = 1; i <= 4; i++) {
      const span = document.createElement('span');
      span.className = `b${i}`;
      allItemBox.appendChild(span);
    }

    allItemBox.addEventListener('click', () => {
      console.log("item type:", item);
      const currentUrl = window.location.href;
      const newUrl = `${currentUrl}/listings`;
      //set active page to 
      window.history.replaceState(null, null, newUrl);
      this.previousPool = item;
      parentContainer.remove();
      window.nftMachine.gloMartInstance.activePage = 'Market';
      let filterType;
      if (item.type) filterType = { type: item.type };
      window.nftMachine.gloMartInstance.loadListings(filterType);
      this.listingTitle = item.caption;
      this.createListingContainer();
    });

    itemSelector.appendChild(allItemBox);

    // Trigger the 'all' item's mouseover event
    const mouseoverEvent = new Event('mouseover');
    allItemBox.dispatchEvent(mouseoverEvent);

    // Create a preview container
    const previewContainer = document.createElement('div');
    previewContainer.style.position = 'absolute';
    previewContainer.style.left = '45%';
    previewContainer.style.top = '15%';
    previewContainer.style.borderRadius = '10px';
    previewContainer.style.width = '50%';
    previewContainer.style.height = '75%';
    previewContainer.style.border = '1px solid #34ff19'
    previewContainer.style.boxShadow = '1px 1px 15px #34ff19';
    previewContainer.style.display = 'flex';
    previewContainer.style.alignItems = 'center';
    previewContainer.style.flexDirection = 'column';
    previewContainer.style.color = '#34ff19';
    parentContainer.appendChild(previewContainer);

    // Create elements for image, name, and description
    const previewImg = document.createElement('img');
    previewImg.style.position = 'relative';
    previewImg.style.top = '5%';
    previewImg.style.height = '35vh';
    previewImg.style.width = '35vh';
    previewImg.style.display = 'none'
    previewContainer.appendChild(previewImg);
    const previewVideo = document.createElement('video');
    previewVideo.style.position = 'relative';
    previewVideo.style.height = '35vh';
    previewVideo.style.width = '35vh';
    previewVideo.style.top = '5%';
    previewVideo.autoplay = true;
    previewVideo.loop = true;
    previewVideo.muted = true;
    previewVideo.src = 'style/graphics/all_showcase.webm'
    const previewName = document.createElement('p');
    previewName.style.position = 'relative';
    previewName.style.top = '5%';
    previewName.style.fontWeight = '900';
    previewName.innerText = 'All';
    const previewDescription = document.createElement('p');
    previewDescription.style.position = 'relative';
    previewDescription.style.top = '15%';
    previewDescription.style.fontWeight = '100';
    previewDescription.style.fontSize = 'small';
    previewDescription.style.width = '90%';
    previewDescription.style.textAlign = 'center';
    previewDescription.textContent = 'Shows all items';
    previewContainer.appendChild(previewVideo);
    previewContainer.appendChild(previewName);
    previewContainer.appendChild(previewDescription);

    
    let hoverTimeout;

    // Show preview on hover
    allItemBox.addEventListener('mouseover', () => {
      if (this.hoverSelection === 'all') return;
      gsap.set([previewImg], {rotationY: 0});
      hoverTimeout = setTimeout(() => {
        // Fade out the current image/video
        gsap.to([previewImg, previewVideo], {
          opacity: 0,
          duration: 0.25,
          onComplete: () => {
            this.hoverSelection = 'all';
            // After fade out is complete, update the source and start fade in
            previewVideo.src = 'style/graphics/all_showcase.webm'; // Set image source to empty for 'all'
            previewName.textContent = 'All'; // Set name to 'All'
            previewDescription.textContent = 'Shows all items'; // Set description

            // Check if typeElement exists and set its textContent to an empty string
            let typeElement = document.querySelector('.typeElement');
            if (typeElement) {
              typeElement.textContent = '';
              typeElement.style.backgroundColor = 'transparent';
            }

            gsap.to(previewVideo, {
              opacity: 1,
              duration: 0.25
            });
          }
        });
      }, 250); // 250 milliseconds = 0.25 seconds
    });

    allItemBox.addEventListener('mouseout', () => {
      clearTimeout(hoverTimeout);
    });

    const listingDescriptions = [
      { name: 'cockroach', description: 'If you cant beat`em, join`em', image: '/style/graphics/token_images/pfps/cockroach/cockroach.webm', rank: 1 },
      { name: 'normal', description: 'Standard reacionts, for a standard guy', image: '/style/graphics/token_images/reactions/normal/normal.webm', rank: 2 },
      { name: 'luncbliss', description: '"LUNC, LUNC, LUNC!"', image: '/style/graphics/token_images/pfps/smiling_lunc/smiling_lunc.webm', rank: 3 },
      { name: 'lunc erikson', description: 'Valhalla awaits you', image: '/style/graphics/token_images/luncmen/lunc_erikson/lunc_erikson.webm', rank: 4 },
      { name: 'steel tread', description: 'Give your glotag a rugged makeover', image: '/style/graphics/token_images/glotags/steel_tread/steel_tread.webm', rank: 5 },
      { name: 'cig', description: 'When you`re winning, anything is healthy', image: '/style/graphics/token_images/victories/stogie/stogie.webm', rank: 6 },
      { name: 'tropical beach', description: 'Swap that dry desert background for something a little more bahaman', image: '/style/graphics/token_images/arcades/tropical_beach/tropical_beach.webm', rank: 7 },
      { name: 'predemo_generic_glochip', description: 'The shittiest glochip around', image: '/style/graphics/token_images/glochips/generic_glochip_preview.webm', rank: 8 },
      { name: 'predemo_generic_key', description: 'The key of mediocrity', image: '/style/graphics/token_images/holokeys/generic_holokey_preview.webm', rank: 9 },
      { name: 'predemo_esoteric_glochip', description: 'A chip of mystery', image: '/style/graphics/token_images/glochips/esoteric_glochip_preview.webm', rank: 10 },
      { name: 'predemo_esoteric_key', description: 'This key opens doors to the unknown', image: '/style/graphics/token_images/holokeys/esoteric_holokey_preview.webm', rank: 11 },
      { name: 'predemo_spectral_glochip', description: 'The chip of legends', image: '/style/graphics/token_images/glochips/spectral_glochip_preview.webm', rank: 12 },
      { name: 'predemo_spectral_key', description: 'The key to greatness', image: '/style/graphics/token_images/holokeys/spectral_holokey_preview.webm', rank: 13 },
    ];
    // Sort the listings array based on the rank of each listing in listingDescriptions
    listings.sort((a, b) => {
      const aDescription = listingDescriptions.find(desc => desc.name === a.name);
      const bDescription = listingDescriptions.find(desc => desc.name === b.name);

      if (!aDescription || !bDescription) {
        console.error(`No description found for ${a.name} or ${b.name}`);
        return 0;
      }

      return aDescription.rank - bDescription.rank;
    });

    listings.forEach(listing => {
      const itemBox = document.createElement('div');
      itemBox.style.width = '85%';
      itemBox.style.height = '5.65%';
      itemBox.style.margin = '.95vh';
      itemBox.style.color = '#34ff19';
      itemBox.style.display = 'flex';
      itemBox.style.justifyContent = 'center';
      itemBox.style.alignItems = 'center';
      itemBox.style.cursor = 'pointer';
      itemBox.className = 'border-el-btn';
      itemBox.innerText = listing.name;
      // Find the corresponding description
      const listingDescription = listingDescriptions.find(desc => desc.name === listing.name);

      // Create the four span elements for the animation
      for (let i = 1; i <= 4; i++) {
        const span = document.createElement('span');
        span.className = `b${i}`;
        itemBox.appendChild(span);
      }

      itemBox.addEventListener('click', () => {
        window.nftMachine.gloMartInstance.activePage = 'Market';
        const newUrl = `${window.location.origin}/glomart/market/${item.caption}/${listing.name}`;
        //set active page to 
        window.history.replaceState(null, null, newUrl);
        this.previousPool = item;
        console.log("item name:", listing.name);
        parentContainer.remove();
        window.nftMachine.gloMartInstance.loadListings({name: listing.name});
        this.listingTitle = listing.name;
        this.createListingContainer();
      });

      // Similar changes for itemBox
      itemBox.addEventListener('mouseover', () => {
        if (listing.name === this.hoverSelection) return;
        hoverTimeout = setTimeout(() => {
          // Fade out the current image/video
          gsap.to([previewImg, previewVideo], {
            opacity: 0,
            duration: 0.25,
            onComplete: () => {
              this.hoverSelection = listing.name;
              // After fade out is complete, update the source and start fade in
              previewName.textContent = listing.name; // Set name
              // Check if typeElement already exists
              let typeElement = document.querySelector('.typeElement');
              if (typeElement) {
                // If it exists, update its text content
                typeElement.textContent = listing.rarity;
                typeElement.style.padding = '10px';
                typeElement.style.borderRadius = '5px';
                // Set background color based on rarity
                if (listing.rarity === 'Generic') {
                  typeElement.style.backgroundColor = 'white';
                } else if (listing.rarity === 'Esoteric') {
                  typeElement.style.backgroundColor = 'yellow';
                } else if (listing.rarity === 'Spectral') {
                  typeElement.style.backgroundColor = 'purple';
                }
              } else {
                // If it doesn't exist, create it
                typeElement = document.createElement('div');
                typeElement.className = 'typeElement'; // Add a class name to identify it later
                typeElement.textContent = listing.rarity;
                typeElement.style.position = 'relative';
                typeElement.style.top = '10%';
                // If it exists, update its text content
                typeElement.textContent = listing.rarity;
                typeElement.style.padding = '10px';
                typeElement.style.borderRadius = '5px';
                // Set background color based on rarity
                if (listing.rarity === 'Generic') {
                  typeElement.style.backgroundColor = 'white';
                } else if (listing.rarity === 'Esoteric') {
                  typeElement.style.backgroundColor = 'yellow';
                } else if (listing.rarity === 'Spectral') {
                  typeElement.style.backgroundColor = 'purple';
                }
                previewName.parentNode.insertBefore(typeElement, previewName.nextSibling);
              }
              let previewImage;
              let animation;
              if (['tropical beach', 'steel tread', 'cockroach', 'cig', 'lunc erikson', 'normal', 'luncbliss'].includes(listing.name)) {
                previewVideo.src = listingDescription.image;
                previewImg.style.display = 'none';
                previewVideo.style.display = 'block';
                previewImage = previewVideo;
              } else {
                previewImg.src = listingDescription.image.replace('.webm', '.webp');
                previewVideo.style.display = 'none';
                previewImg.style.display = 'block';
                previewImage = previewImg;
              }
              // Apply GSAP animation if the listing name includes 'key'
              if (listing.name.includes('key')) {
                animation = gsap.to(previewImage, {
                  rotationY: 360,
                  repeat: -1, // to make the animation repeat indefinitely
                  duration: 5, // duration of one complete spin in seconds
                  ease: "none" // linear rotation
                });
              } else {
                gsap.killTweensOf(previewImage);
                gsap.set([previewImg], {rotationY: 0});
              }
              previewDescription.textContent = listingDescription ? listingDescription.description : ''; // Set description
              gsap.to(previewImage, {
                opacity: 1,
                duration: 0.25
              });
            }
          });
        }, 250); // 250 milliseconds = 0.25 seconds
      });

      itemBox.addEventListener('mouseout', () => {
        clearTimeout(hoverTimeout);
      });

      itemSelector.appendChild(itemBox);
    });

    window.nftMachine.gloMartInstance.marketOS.appendChild(parentContainer);
  } 
 
  createListingContainer() {
    console.log('creating listing container');
    // Main listing container
    this.marketContainer = document.createElement('div');
    this.marketContainer.id = 'marketContainer';
    this.marketContainer.style.width = '100%';
    this.marketContainer.style.height = '100%';
    this.marketContainer.style.position = 'absolute';
    this.marketContainer.style.top = '0%'; // Leave space at the top
    this.marketContainer.style.left = '50%';
    this.marketContainer.style.transform = 'translate(-50%, 0%)';
    this.marketContainer.style.backgroundColor = 'transparent';
    this.marketContainer.style.color = 'white';
    window.nftMachine.gloMartInstance.marketOS.appendChild(this.marketContainer);

    // Table of contents to the bottom
    this.listingSort = document.createElement('div');
    this.listingSort.id = 'listingSort';
    this.listingSort.style.width = '45%'; // Change width to 100%
    this.listingSort.style.height = '10%'; // Adjust height as needed
    this.listingSort.style.position = 'absolute';
    this.listingSort.style.top = '5.5%'; // Position it at the bottom
    this.listingSort.style.right = '7.5%';
    this.listingSort.style.backgroundColor = 'transparent';
    this.listingSort.style.display = 'flex'; // Add this line
    this.listingSort.style.justifyContent = 'space-between'; // Add this line
    this.listingSort.style.zIndex = '1';
    this.marketContainer.appendChild(this.listingSort);

    //sortByContainer
    this.sortContainer = document.createElement('div');
    this.sortContainer.style.position = 'relative';
    this.sortContainer.style.height = '100%';
    this.sortContainer.style.width = '35%';
    this.sortContainer.style.cursor = 'default';
    this.sortContainer.style.display = 'flex';
    this.sortContainer.style.left = '10%';
    this.listingSort.appendChild(this.sortContainer);

    //sort by label
    this.sortLabel = document.createElement('div');
    this.sortLabel.id = 'sortLabel';
    this.sortLabel.innerText = 'sort by:';
    this.sortLabel.style.fontSize = '1rem';
    this.sortLabel.style.position = 'absolute';
    this.sortLabel.style.top = '39%';
    this.sortLabel.style.left = '-40%';
    this.sortLabel.style.display = 'flex';
    this.sortLabel.style.alignItems = 'center';
    this.sortLabel.style.justifyContent = 'center';
    this.sortContainer.appendChild(this.sortLabel);

    // Create left arrow
    this.leftArrow = document.createElement('div');
    this.leftArrow.style.position = 'absolute';
    this.leftArrow.style.top = '34%';
    this.leftArrow.style.left = '14%';
    this.leftArrow.innerText = '<';
    this.leftArrow.style.fontSize = '1.5rem';
    this.leftArrow.style.color = '#39ff14';
    this.leftArrow.style.cursor = 'pointer';
    this.leftArrow.addEventListener('click', () => {
    // Toggle sortLabel's innerText between 'hi2lo', 'lo2hi' and 'bidless'
    if (this.buttonState === 'bids'){
      if (this.sortOrder === 'hi2lo') {
        this.sortOrder = 'lo2hi';
        this.showBidless = false;
      } else if (this.sortOrder === 'lo2hi') {
        this.sortOrder = 'bidless';
        this.showBidless = true;
      } else {
        this.sortOrder = 'hi2lo';
        this.showBidless = false;
      }
    } else {
      this.sortOrder = this.sortOrder === 'hi2lo' ? 'lo2hi' : 'hi2lo';
    }
      this.sortBy.innerText = this.sortOrder;
      this.sortListings();
    });
    this.sortContainer.appendChild(this.leftArrow);

    //sort by button
    this.sortBy = document.createElement('div');
    this.sortBy.id = 'sortBy';
    this.sortBy.style.position = 'relative';
    this.sortBy.style.border = '1px solid #34ff19';
    this.sortBy.style.boxShadow = '1px 1px 10px #34ff19';
    this.sortBy.style.top = '22.5%';
    this.sortBy.style.height = '50%';
    this.sortBy.style.left = '50%';
    this.sortBy.style.width = '45%';
    this.sortBy.style.transform = 'translate(-50%, 0%)';
    this.sortBy.innerText = 'lo2hi'; 
    this.sortBy.style.display = 'flex';
    this.sortBy.style.justifyContent = 'center';
    this.sortBy.style.alignItems = 'center';
    this.sortBy.style.cursor = 'pointer';
    this.sortBy.addEventListener('click', () => {
    // Toggle sortLabel's innerText between 'hi2lo', 'lo2hi' and 'bidless'
    if (this.buttonState === 'bids'){
      if (this.sortOrder === 'hi2lo') {
        this.sortOrder = 'lo2hi';
        this.showBidless = false;
      } else if (this.sortOrder === 'lo2hi') {
        this.sortOrder = 'bidless';
        this.showBidless = true;
      } else {
        this.sortOrder = 'hi2lo';
        this.showBidless = false;
      }
    } else {
      this.sortOrder = this.sortOrder === 'hi2lo' ? 'lo2hi' : 'hi2lo';
    }
    this.sortBy.innerText = this.sortOrder;
    this.sortListings();
    });
    this.sortContainer.appendChild(this.sortBy);

    // Create right arrow
    this.rightArrow = document.createElement('div');
    this.rightArrow.style.position = 'absolute';
    this.rightArrow.style.top = '34%';
    this.rightArrow.style.right = '14%';
    this.rightArrow.innerText = '>';
    this.rightArrow.style.fontSize = '1.5rem';
    this.rightArrow.style.color = '#39ff14';
    this.rightArrow.style.cursor = 'pointer';
    this.rightArrow.addEventListener('click', () => {
    // Toggle sortLabel's innerText between 'hi2lo', 'lo2hi' and 'bidless'
    if (this.buttonState === 'bids'){
      if (this.sortOrder === 'hi2lo') {
        this.sortOrder = 'lo2hi';
        this.showBidless = false;
      } else if (this.sortOrder === 'lo2hi') {
        this.sortOrder = 'bidless';
        this.showBidless = true;
      } else {
        this.sortOrder = 'hi2lo';
        this.showBidless = false;
      }
    } else {
      this.sortOrder = this.sortOrder === 'hi2lo' ? 'lo2hi' : 'hi2lo';
    }
      this.sortBy.innerText = this.sortOrder;
      this.sortListings();
    });
    this.sortContainer.appendChild(this.rightArrow);

    //create buy/bid sort container
    this.buyBidContainer = document.createElement('div');
    this.buyBidContainer.id = 'buyBidContainer';
    this.buyBidContainer.className = 'buy-bid-container';
    this.buyBidContainer.style.position = 'absolute';
    this.buyBidContainer.style.right = '0%';
    this.buyBidContainer.style.width = '55%';
    this.buyBidContainer.style.height = '100%';
    this.listingSort.appendChild(this.buyBidContainer);

    //sort by buy now
    this.sortBuy = document.createElement('input');
    this.sortBuy.type = 'radio';
    this.sortBuy.id = 'radio1';
    this.sortBuy.name = 'sort-group';
    this.sortBuy.className = 'sort-input';
    this.sortBuy.checked = true;
    this.sortBuy.addEventListener('click', () => {
      if (this.buttonState === 'bids' && this.sortBy.innerText === 'bidless') {
        this.sortOrder = 'lo2hi';
        this.sortBy.innerText = this.sortOrder;
      }
      this.buttonState = 'buyNow';
      this.sortListings(); // Call the function to sort the listings data
    });

    // Create the label
    this.buyLabel = document.createElement('label');
    this.buyLabel.setAttribute('for', 'radio1');
    this.buyLabel.className = 'sort-label';
    this.buyLabel.style.height = '5%';
    this.buyLabel.style.position = 'absolute';
    this.buyLabel.style.top = '25%';
    this.buyLabel.style.width = '40%';
    this.buyLabel.style.cursor = 'pointer';

    // Create the inner circle span and append it to the label
    this.buyCircle = document.createElement('span');
    this.buyCircle.className = 'sort-inner-circle';
    this.buyLabel.appendChild(this.buyCircle);

    // Add the label text
    this.buyText = document.createTextNode('BUY NOW');
    this.buyLabel.appendChild(this.buyText);

    // Append the radio input and label to sortBuy
    this.buyBidContainer.appendChild(this.sortBuy);
    this.buyBidContainer.appendChild(this.buyLabel);

    //sort by bids
    this.sortBids = document.createElement('input');
    this.sortBids.type = 'radio';
    this.sortBids.id = 'radio2';
    this.sortBids.name = 'sort-group';
    this.sortBids.className = 'sort-input';
    this.sortBids.addEventListener('click', () => {
      if (this.buttonState === 'bids' && this.sortBy.innerText === 'bidless') {
        this.sortOrder = 'lo2hi';
        this.sortBy.innerText = this.sortOrder;
      }
      this.buttonState = 'bids';
      this.sortListings(); // Call the function to sort the listings data
    });

    // Create the label
    this.bidLabel = document.createElement('label');
    this.bidLabel.setAttribute('for', 'radio2');
    this.bidLabel.className = 'sort-label';
    this.bidLabel.style.position = 'absolute';
    this.bidLabel.style.height = '6%';
    this.bidLabel.style.top = '24%';
    this.bidLabel.style.right = '0%';
    this.bidLabel.style.width = '40%';
    this.bidLabel.style.cursor = 'pointer';

    // Create the inner circle span and append it to the label
    this.bidCircle = document.createElement('span');
    this.bidCircle.className = 'sort-inner-circle';
    this.bidLabel.appendChild(this.bidCircle);

    // Add the label text
    this.bidText = document.createTextNode('BIDS');
    this.bidLabel.appendChild(this.bidText);

    // Append the radio input and label to sortBuy
    this.buyBidContainer.appendChild(this.sortBids);
    this.buyBidContainer.appendChild(this.bidLabel);

    // Content to the right
    this.content = document.createElement('div');
    this.content.id = 'rightContent';
    this.content.style.width = '100%'; // Change width to 100%
    this.content.style.height = '100%'; // Adjust height as needed
    this.content.style.position = 'absolute';
    this.content.style.top = '0%'; // Position it at the top
    this.content.style.backgroundColor = 'transparent';
    this.content.style.right = '0%';
    this.content.style.overflow = 'auto';
    this.marketContainer.appendChild(this.content);

    this.listingsPoolLabel = document.createElement('div');
    this.listingsPoolLabel.innerText = `${this.listingTitle} listings`;
    this.listingsPoolLabel.style.color = '#39ff14';
    this.listingsPoolLabel.style.fontSize = '1.5rem';
    this.listingsPoolLabel.style.top = '9.5%';
    this.listingsPoolLabel.style.position = 'absolute';
    this.listingsPoolLabel.style.left = '7.5%';
    this.content.appendChild(this.listingsPoolLabel);

    //create a listingsdisplay
    this.listingsPoolDisplay = document.createElement('div');
    this.listingsPoolDisplay.id = 'listingsPoolDisplay';
    this.listingsPoolDisplay.style.width = '90%';
    this.listingsPoolDisplay.style.height = '79%';
    this.listingsPoolDisplay.style.border = 'solid 0.25vw #39ff14';
    this.listingsPoolDisplay.style.boxShadow = '1px 1px 20px #34ff19';
    this.listingsPoolDisplay.style.display = 'grid';
    this.listingsPoolDisplay.style.overflowY = 'auto';
    this.listingsPoolDisplay.style.gridTemplateColumns = 'repeat(6, 1fr)';
    this.listingsPoolDisplay.style.gridAutoRows = '38%'; // A fixed height or appropriate min value
    this.listingsPoolDisplay.style.gridAutoFlow = 'row dense';
    this.listingsPoolDisplay.style.position = 'relative';
    this.listingsPoolDisplay.style.top = '16.5%';
    this.listingsPoolDisplay.style.left = '50%';
    this.listingsPoolDisplay.style.transform = 'translateX(-50%)';
    this.content.appendChild(this.listingsPoolDisplay);

    // Append custom CSS for scrollbar in the head of the document
    const listingSheet = document.createElement("style");
    listingSheet.type = "text/css";
    listingSheet.innerText = `
      #listingsPoolDisplay::-webkit-scrollbar {
        width: 6px !important;
      }
      #listingsPoolDisplay::-webkit-scrollbar-track {
        background: transparent !important;
      }
      #listingsPoolDisplay::-webkit-scrollbar-thumb {
        background: #34ff19; // Change color here
        border-radius: 10px !important;
      }
      @media screen and (max-width: 768px) {
        #listingsPoolDisplay::-webkit-scrollbar {
          width: 6px !important;
        }
      }
    `;
    document.head.appendChild(listingSheet);

    //query for all listings
    console.log('awaiting listings')
    this.awaitListings();
  }

  awaitListings() {
    if (!window.nftMachine.gloMartInstance.allListings) {
      setTimeout(() => {
        console.log('waiting listings')
        this.awaitListings();
      }, 50);
      return;
    }

    if (!this.listings) this.listings = [];

    if (window.nftMachine.gloMartInstance.updatingListings) {
      console.log('updating listings')
      window.nftMachine.gloMartInstance.updatingListings = false;
      const newListings = window.nftMachine.gloMartInstance.allListings;
      const oldListings = this.allListings || [];

      // Find listings to remove
      const listingsToRemove = oldListings.filter(oldListing => !newListings.find(newListing => newListing.id === oldListing.id));

      // Find listings to add
      const listingsToAdd = newListings.filter(newListing => !oldListings.find(oldListing => oldListing.id === newListing.id));

      // Remove old listings
      listingsToRemove.forEach(listing => {
        const listingElement = this.listingsPoolDisplay.querySelector(`[data-id="${listing.id}"]`);
        if (listingElement) {
          this.listingsPoolDisplay.removeChild(listingElement);
        }

        const index = this.listings.findIndex(instance => instance.id === listing.id);
        if (index !== -1) {
          this.listings.splice(index, 1);
        }
      });

      // Check if listingsToAdd is empty
      if (listingsToAdd.length === 0) {
        const noListingsDiv = document.createElement('div');
        noListingsDiv.textContent = 'No listings found';
        noListingsDiv.style.display = 'flex';
        noListingsDiv.style.justifyContent = 'center';
        noListingsDiv.style.alignItems = 'center';
        noListingsDiv.style.height = '100%'; // Adjust as needed
        noListingsDiv.style.position = 'absolute';
        noListingsDiv.style.left = '50%';
        noListingsDiv.style.transform = 'translateX(-50%)';
        this.listingsPoolDisplay.appendChild(noListingsDiv);
      } else {
        // Add new listings
        listingsToAdd.forEach(listingData => {
          console.log('creating listing', listingData)
          const listing = new Listing(listingData, 'market');
          this.listingsPoolDisplay.appendChild(listing.listingBox);
          
          this.listings.push(listing);
        });
      }



      // Update this.allListings
      this.allListings = this.listings;
    } else {
      console.log('not updating listings')
      if (this.listings.length === 0) return;

      this.listings.forEach(listing => {
        listing.state = 'market';
        listing.handleListingState();
        this.listingsPoolDisplay.appendChild(listing.listingBox);
      });
    }
  }

  sortListings() {
    // Sort the listings data based on sortOrder and buttonState
    this.allListings.sort((a, b) => {
      let aValue, bValue;

      if (this.buttonState === 'buyNow') {
        // Convert price to number for sorting
        aValue = Number(a.price);
        bValue = Number(b.price);
      } else { // buttonState is 'bids'
        // Use the highest bid for sorting
        aValue = a.bids.length ? Number(a.bids[0].amount) : 0;
        bValue = b.bids.length ? Number(b.bids[0].amount) : 0;
      }

      console.log('avalue: ', aValue, 'bvalue: ', bValue);

      if (this.sortOrder === 'lo2hi') {
        return aValue - bValue;
      } else { // sortOrder is 'hi2lo'
        return bValue - aValue;
      }
    });

  // Filter the listings based on buttonState and showBidless
  this.filteredAllListings = this.allListings.filter(listing => {
    if (this.buttonState === 'buyNow') {
      return true; // Show all listings when buttonState is 'buyNow'
    } else { // buttonState is 'bids'
      return this.showBidless ? listing.bids.length === 0 : listing.bids.length > 0;
    }
  });

    // After sorting and filtering, you can call a function to update the display with the sorted listings
    this.updateListingsDisplay(this.filteredAllListings);
  }

  // Modify the updateListingsDisplay method
  updateListingsDisplay(listings) {
    console.log('updating listing display');

    // Clear the listingsPoolDisplay
    while (this.listingsPoolDisplay.firstChild) {
      this.listingsPoolDisplay.removeChild(this.listingsPoolDisplay.firstChild);
    }

    // Append the Listing instances in the new order
    listings.forEach(listingData => {
      const listing = new Listing(listingData, 'market');
      this.listingsPoolDisplay.appendChild(listing.listingBox);
    });
  }

  // Add a new method to toggle showBidless
  toggleShowBidless() {
    this.showBidless = !this.showBidless;
    this.sortListings();
  }
}

class Listing {
  constructor(listingData, state) {
    console.log('creating listing', listingData)
    this.state = state;
    this.id = listingData.id.split(':')[1]; // Get everything after the colon
    this.owner = listingData.owner;
    this.price = listingData.price; // This assumes price is an array with details
    this.uri = listingData.uri;
    this.bids = listingData.bids;
    this.data = listingData.data;

    // Create an object with id and uri properties
    this.nftData = {
      token_id: this.id,
      token_uri: this.uri,
      listing: this
    };

    this.handleListingState();

    // Temporary event listener to log the event detail
    window.addEventListener('updateListing', (event) => {
      console.log('updateListing event detail:', event);
    });
  }

  handleListingState() {
    console.log('handleListingState')
    switch(this.state){
      case 'market':
        this.createMarket();
        break;
      case 'listing':
        this.inspectListing();
        break;
      default:
        break;
    }
  }

  async createMarket() {
    console.log('creating listingbox');
    if (!this.listingBox) {
      this.listingBox = document.createElement('div');
      this.listingBox.id = 'listingBox';

      // Add event listener to call handleMarketListingClick function
      this.listingBox.addEventListener('click', () => {
        // Check if this.state is not 'listing' before calling handleMarketListingClick
        if (this.state !== 'listing') {
          this.handleMarketListingClick();
        }
      });
    }
    this.listingBox.style.width = '100%';
    this.listingBox.style.height = '100%';
    this.listingBox.style.minHeight = '100%';
    this.listingBox.style.display = 'flex'; // Add this line
    this.listingBox.style.justifyContent = 'center'; // Add this line
    this.listingBox.style.alignItems = 'center'; // Add this line
    this.listingBox.style.position = 'relative';
    this.listingBox.style.marginTop = '3%';
    // Set the HTML content of listingBox
    this.listingBox.innerHTML = `
    <article class="article-wrapper">
    <div class="project-hover">
      <svg class='no-svg' style="color: #a2ff91;" xmlns="http://www.w3.org/2000/svg" width="2em" height="2em" color="#346532" stroke-linejoin="round" stroke-linecap="round" viewBox="0 0 24 24" stroke-width="2" fill="none" stroke="currentColor">
        <line y2="12" x2="19" y1="12" x1="5"></line>
        <polyline points="12 5 19 12 12 19"></polyline>
      </svg>
    </div>
      <div class="rounded-lg container-project"></div>
      <div class="project-info">
        <div class="flex-pr">
          <div class="project-title text-nowrap"></div>
        </div>
        <div class="types">
          <span style="background-color: #39ff14; color: #000000; position: absolute; left: 50%; transform: translate(-50%, 20%); bottom: 6%;" class="project-type"></span>
        </div>
      </div>
    </article>
  `;

  // og code with types
  // <article class="article-wrapper">
  // <div class="project-hover">
  //   <svg class='no-svg' style="color: black;" xmlns="http://www.w3.org/2000/svg" width="2em" height="2em" color="#346532" stroke-linejoin="round" stroke-linecap="round" viewBox="0 0 24 24" stroke-width="2" fill="none" stroke="currentColor">
  //     <line y2="12" x2="19" y1="12" x1="5"></line>
  //     <polyline points="12 5 19 12 12 19"></polyline>
  //   </svg>
  // </div>
  //   <div class="rounded-lg container-project"></div>
  //   <div class="project-info">
  //     <div class="flex-pr">
  //       <div class="project-title text-nowrap"></div>
  //     </div>
  //     <div class="types">
  //       <span style="background-color: rgba(165, 96, 247, 0.43); color: rgb(85, 27, 177);" class="project-type">• Analytics</span>
  //       <span class="project-type">• Dashboards</span>
  //     </div>
  //   </div>
  // </article>

  //set image
  const containerProject = this.listingBox.querySelector('.container-project');
  containerProject.style.backgroundImage = `url(/style/graphics/token_images/${this.data.previewImg}.webp)`;
  containerProject.style.position = 'absolute';
  containerProject.style.top = '3%';
  containerProject.style.left = '50%';
  containerProject.style.transform = 'translate(-50%, -15%) scale(0.65)';
  containerProject.style.height = '19vh';
  containerProject.style.width = '19vh';
  containerProject.style.backgroundSize = 'cover'; // Cover the entire area of the div
  containerProject.style.backgroundPosition = 'center'; // Center the image
  console.log('setting listings image for', this.data.previewImg);

  //set name
  const projectTitle = this.listingBox.querySelector('.project-title');
  projectTitle.innerText = this.data.name;


  // //set rarity
  const projectPrice = this.listingBox.querySelector('.project-type');
  let priceInUluna = this.price;
  let priceInLuna = priceInUluna / 1000000;
  projectPrice.innerText = this.formatPrice(priceInUluna) + ' LUNA';


    if (this.listingNft) return;
    // Create a new Nft instance using the nftData object
    this.listingNft = new Nft('market_preview', this.nftData);
    console.log('created listingnft', this.listingNft);
  }

  formatPrice(priceInUluna) {
    let priceInLuna = priceInUluna / 1000000;
    if (priceInLuna < 1) {
      return priceInLuna.toFixed(2); // If less than 1 LUNA, show two decimal places
    } else if (priceInLuna >= 1 && priceInLuna < 1000) {
      return priceInLuna.toFixed(2); // If less than 1000 LUNA, show as is but with two decimal places
    } else if (priceInLuna >= 1000 && priceInLuna < 100000) {
      return (priceInLuna / 1000).toFixed(1) + 'K'; // Convert thousands to 'K' notation
    } else if (priceInLuna >= 100000 && priceInLuna < 1000000) {
      return (priceInLuna / 1000) + 'K'; // Convert thousands to 'K' notation

    } else {
      return (priceInLuna / 1000000).toFixed(1) + 'M'; // Convert millions to 'M' notation
    }
  }

  handleMarketListingClick() {
    console.log('handleMarketListingClick');
    this.state = 'listing';
    this.handleListingState();
    const marketContainer = document.getElementById('marketContainer');
    if (marketContainer) {
      marketContainer.remove();
    }
    window.nftMachine.gloMartInstance.activePage = 'Listing';

    // Remove the event listener from the listingBox element
    this.listingBox.removeEventListener('click', this.handleMarketListingClick.bind(this));
  }

  populateMarketListing(nft) {
    console.log('calling populate market listing for', nft);
    if (this.listingImg) return;
    console.log('creating listing image for', nft)

    // Find the container-project div
    this.containerProject = this.listingBox.querySelector('.container-project');
    this.projectTitle = this.listingBox.querySelector('.project-title');
    this.projectPrice = this.listingBox.querySelector('.project-type');

    if (this.containerProject) {
      // Apply styles to container-project
      this.containerProject.style.position = 'absolute';
      this.containerProject.style.top = '10%';
      this.containerProject.style.left = '50%';
      this.containerProject.style.transform = 'translate(-50%, 0%)';
      this.containerProject.style.height = '15vh';
      this.containerProject.style.width = '15vh';
      this.containerProject.style.backgroundImage = `url(/style/graphics/token_images${nft.metadata.previewImg}.webp)`;
      this.containerProject.style.backgroundSize = 'cover'; // Cover the entire area of the div
      this.containerProject.style.backgroundPosition = 'center'; // Center the image
    }

    if (nft && nft.metadata && nft.listing.price) {
      let priceInUluna = nft.listing.price;
      let priceInLuna = priceInUluna / 1000000;
      this.projectPrice.innerText = priceInLuna.toFixed(2) + ' LUNA'; // toFixed(2) is used to round the price to 2 decimal places
    } else {
      this.projectPrice.innerText = 'Price not available';
    }

    // Find the project-title div and set its innerText to nft.metadata.name
    if (this.projectTitle) {
      this.projectTitle.innerText = nft.metadata.name;
    } else if (this.projectPrice) {
      this.projectPrice.innerText = priceInLuna + ' luna';
    }
  }

  async inspectListing(){
    console.log('inspecting listing');
    if (!this.listingImg) await this.createMarket();
    
    if (!this.listingNft.metadata) {
      this.awaitMetadata();
      return;
    }

    this.listingContainer = document.createElement('div');
    this.listingContainer.id = 'listingContainer';
    this.listingContainer.style.width = '100%';
    this.listingContainer.style.height = '95%';
    this.listingContainer.style.position = 'absolute';
    this.listingContainer.style.top = '5%';
    this.listingContainer.style.left = '50%';
    this.listingContainer.style.transform = 'translate(-50%, 0%)';

    this.listingBox.style.width = '42.5%';
    this.listingBox.style.height = '100%';
    this.listingBox.style.margin = '';
    this.listingBox.style.bottom = '0%';
    this.listingBox.style.borderRadius = '20px';
    this.listingBox.style.position = 'relative';
    this.listingBox.style.left = '52.5%';
    this.listingBox.style.transform = 'translateX(-50%)';
    this.listingContainer.appendChild(this.listingBox);
    window.nftMachine.gloMartInstance.marketOS.appendChild(this.listingContainer);

    this.populateMarketListing(this.listingNft);

    document.querySelector('.article-wrapper').classList.add('disable-hover');
    document.querySelector('.project-hover').style.display = 'none';
    document.querySelector('.types').style.display = 'none';
    this.projectInfo = document.querySelector('.project-info');
    this.projectInfo.style.position = 'relative';
    this.projectInfo.style.bottom = '-92.5%';
    this.projectInfo.style.fontSize = '1.5rem';
    this.containerProject.style.height = 'auto';
    this.containerProject.style.width = '85%';
    this.containerProject.style.aspectRatio = '1';
    this.containerProject.style.top = '3%';

    this.detailsContainer = document.createElement('div');
    this.detailsContainer.style.position = 'absolute';
    this.detailsContainer.style.top = '0%';
    this.detailsContainer.style.left = '16%';
    this.detailsContainer.style.transform = 'translateX(-50%)';
    this.detailsContainer.style.height = '100%';
    this.detailsContainer.style.width = '31%';
    this.listingContainer.appendChild(this.detailsContainer)

    //listing details
    this.listingDetailsContainer = document.createElement('div');
    this.listingDetailsContainer.id = 'listingDetailsContainer';
    this.detailsContainer.appendChild(this.listingDetailsContainer);
    this.listingDetailsContainer.style.position = 'absolute';
    this.listingDetailsContainer.style.left = '50%';
    this.listingDetailsContainer.style.transform = 'translateX(-50%)';
    this.listingDetailsContainer.style.border = '1px solid #34ff19';
    this.listingDetailsContainer.style.height = '42.5%';
    this.listingDetailsContainer.style.width = '85%';
    this.listingDetailsContainer.style.top = '30.5%';

    //detailsdetails
    const detailsDetails = document.createElement('div');
    detailsDetails.style.display = 'flex';
    detailsDetails.style.flexDirection = 'column';
    detailsDetails.style.color = '#34ff19';
    detailsDetails.style.gap = '12.5%';
    detailsDetails.style.position = 'absolute';
    detailsDetails.style.height = '90%';
    detailsDetails.style.top = '7.5%';
    detailsDetails.style.left = '5%';
    detailsDetails.style.width = '90%';
    detailsDetails.style.fontSize = '0.85em';
    detailsDetails.style.lineHeight =  '1.4';
    this.listingDetailsContainer.appendChild(detailsDetails);

    //description
    const tokenDescription = document.createElement('span');
    tokenDescription.innerText = `Description: ${this.listingNft.metadata.description}`;
    detailsDetails.appendChild(tokenDescription);

    // token id
    const tokenId = document.createElement('span');
    tokenId.innerText = `Token ID: ${this.listingNft.listing.id}`;
    detailsDetails.appendChild(tokenId);

    //token type
    const tokenType = document.createElement('span');
    tokenType.innerText = `Token Type: ${this.listingNft.metadata.type}`;
    detailsDetails.appendChild(tokenType);

    //token rarity
    const tokenRarity = document.createElement('span');
    tokenRarity.innerText = `Token Rarity: ${this.listingNft.metadata.rarity}`;
    detailsDetails.appendChild(tokenRarity);

    this.listingDetails = document.createElement('div');
    this.listingDetails.id = 'listingDetails';
    this.listingDetails.style.position = 'relative';
    this.listingDetails.style.left = '50%';
    this.listingDetails.style.transform = 'translate(-50%, 0%)';
    this.listingDetails.style.top = '5%';
    this.listingDetails.style.width = '75%';
    this.listingDetails.style.height = '22.5%'; 
    this.listingDetails.style.backgroundColor = '#c2ffaa'; 
    this.listingDetails.style.borderRadius = '15px'; 
    this.listingDetails.style.display = 'flex';
    this.listingDetails.style.flexDirection = 'column';
    this.listingDetails.style.alignItems = 'center';
    this.detailsContainer.appendChild(this.listingDetails);

    this.priceLabel = document.createElement('div');
    this.priceLabel.style.position = 'relative';
    this.priceLabel.innerText = 'PRICE:';
    this.priceLabel.style.color = 'black';
    this.priceLabel.style.top = '10%';
    this.listingDetails.appendChild(this.priceLabel); 

    this.priceDisplay = document.createElement('div');
    this.priceDisplay.style.position = 'relative';
    this.priceDisplay.style.color = 'black';
    this.priceDisplay.style.top = '15%';
    this.priceDisplay.innerText = `${(this.price/1000000).toFixed(2)}`; // Add 'luna' after the amount

    // Create an img element for the SVG
    this.lunaImg = document.createElement('img');
    this.lunaImg.src = '/style/graphics/lunasvg.svg'; // Set the source to your SVG file
    this.lunaImg.style.height = '1em'; // Set the height to match the text
    this.lunaImg.style.verticalAlign = 'middle'; // Align it with the middle of the text

    // Append the img to the priceDisplay
    this.priceDisplay.appendChild(this.lunaImg);
    this.listingDetails.appendChild(this.priceDisplay);

    this.ownerLabel = document.createElement('div');
    this.ownerLabel.style.position = 'relative';
    this.ownerLabel.innerText = 'OWNER:';
    this.ownerLabel.style.color = 'black';
    this.ownerLabel.style.top = '30%';
    this.listingDetails.appendChild(this.ownerLabel); 

    this.ownerDisplay = document.createElement('div');
    this.ownerDisplay.className = 'ownerDisplay';
    this.ownerDisplay.style.position = 'relative';
    this.ownerDisplay.style.color = 'black';
    this.ownerDisplay.style.top = '37.5%';
    // Add a click event listener to this.ownerDisplay
    this.ownerDisplay.addEventListener('click', () => {
      // Copy this.owner to the clipboard
      navigator.clipboard.writeText(this.owner);
    });

    this.ownerTooltip = document.createElement('span');
    this.ownerTooltip.className = 'ownerTooltip';
    this.ownerTooltip.innerText = `${this.owner}`;

    this.ownerText = document.createElement('span');
    this.ownerText.className = 'ownerText';
    this.ownerText.innerText = `${this.owner.substring(0, 12)}...`;
    
    this.ownerDisplay.appendChild(this.ownerTooltip);
    this.ownerDisplay.appendChild(this.ownerText);
    this.listingDetails.appendChild(this.ownerDisplay);

    this.displayBids();

    if(this.owner == window.client.gloInfo.walletID){
      this.setOwnerUi();
    } else {
      this.setBidderUi();
    }

    // if (window.parsedListingData) return;
    this.updateUrl();
  }

  updateUrl() {
    if (window.parsedListingData) {
      window.parsedListingData = null;
      return;
    }
    const newUrl = `${window.location.origin}${window.location.pathname}/${this.id}`;
    
    console.log('updating url on listing page', window.location.origin, window.location.pathname);
    //set active page to 
    window.history.replaceState(null, null, newUrl);
    console.log('url:', window.location.href);
  }

  displayBids() {
    this.bidDiv = document.createElement('div');
    this.bidDiv.id = 'bidDiv';
    this.bidDiv.style.position = 'absolute';
    this.bidDiv.style.right = '0';
    this.bidDiv.style.top = '0';
    this.bidDiv.style.width = '27%';
    this.bidDiv.style.height = '100%';
    this.listingContainer.appendChild(this.bidDiv);

    this.bidContainer = document.createElement('div');
    this.bidContainer.id = 'bidContainer';
    this.bidContainer.style.position = 'absolute';
    this.bidContainer.style.top = '7%';
    this.bidContainer.style.left = '50%';
    this.bidContainer.style.transform = 'translateX(-50%)';
    this.bidContainer.style.height = '87.5%';
    this.bidContainer.style.border = '3px solid #34ff19';
    this.bidContainer.style.boxShadow = 'darkgreen 0px 0px 20px 4px';
    this.bidContainer.style.width = '75%';
    this.bidContainer.style.color = '#34ff19';
    this.bidContainer.style.display = 'flex';
    this.bidContainer.style.flexDirection = 'column';
    this.bidContainer.style.alignItems = 'center';
    this.bidContainer.style.gap = '3%';
    this.bidDiv.appendChild(this.bidContainer);

    console.log(this.bids);
    this.bidContainerLabel = document.createElement('div');
    this.bidContainerLabel.id = 'bidContainerLabel';
    this.bidContainerLabel.innerText = 'ACTIVE BIDS:';
    this.bidContainerLabel.style.marginTop = '10%';
    this.bidContainerLabel.style.marginBottom = '2.5%';
    this.bidContainerLabel.style.textDecoration = 'underline';
    this.bidContainer.appendChild(this.bidContainerLabel);
    // Check if bids array is empty
    if (this.bids.length === 0) {
      const noBidsDisplay = document.createElement('div');
      noBidsDisplay.innerText = 'No bids yet';
      this.bidContainer.appendChild(noBidsDisplay);
    } else {
      // Iterate over the bids array
      for (const bid of this.bids) {
        const bidDisplay = document.createElement('div');
        bidDisplay.innerText = `Bid Amount: ${(bid.amount/1000000).toFixed(2)} luna`;
        this.bidContainer.appendChild(bidDisplay);

        if(this.owner == window.client.gloInfo.walletID) {
          const acceptBid = document.createElement('button');
          acceptBid.innerText = 'Accept Bid';
          acceptBid.addEventListener('click', () => {
            const event = new CustomEvent('acceptBid', {
              detail: {
                tokenId: this.id,
                bidder: bid.bidder,
                chainID: 'pisco-1'
              }
            });
            window.dispatchEvent(event);
            this.registerTransaction('acceptBid');
            window.addEventListener('txCancel', (event) => {
              this.handleTransaction('txCancel');
            });
          }); // Add missing closing curly brace here
          this.bidContainer.appendChild(acceptBid); // Add this line to append the acceptBid button to the bidContainer
        }
      }
    }
  }

    setOwnerUi(){
      console.log('YOU ARE THE MOTHERAFUCKING OWNER');
      // Create button container
      this.ownerButtons = document.createElement('div');
      this.ownerButtons.id = 'ownerButtons';
      this.ownerButtons.style.position = 'absolute';
      this.ownerButtons.style.display = 'flex';
      this.ownerButtons.style.flexDirection = 'column';
      this.ownerButtons.style.left = '50%';
      this.ownerButtons.style.transform = 'translate(-50%, 0%)';
      this.ownerButtons.style.bottom = '3%';
      this.detailsContainer.appendChild(this.ownerButtons);

      //edit listing
      this.editListing = document.createElement('button');
      this.editListing.className = 'marketButton';
      this.editListing.innerText = 'Edit Listing';
      this.ownerButtons.appendChild(this.editListing);
      this.editListing.addEventListener('click', () => {
        // Create and style the modal
        const modal = document.createElement('div');
        modal.style.display = 'block';
        modal.style.position = 'fixed';
        modal.style.zIndex = '1';
        modal.style.left = '0';
        modal.style.top = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.overflow = 'auto';
        modal.style.backgroundColor = 'rgba(0,0,0,0.4)';

        // Create and style the modal content
        const modalContent = document.createElement('div');
        modalContent.style.backgroundColor = '#34ff19';
        modalContent.style.margin = '15% auto';
        modalContent.style.padding = '20px';
        modalContent.style.border = '1px solid #888';
        modalContent.style.width = '27.5%';
        modalContent.style.left = '50%';
        modalContent.style.transform = 'translateX(-50%)';
        modalContent.style.position = 'absolute';
        modalContent.style.top = '10%';
        modalContent.style.display = 'flex'; // Set display to flex
        modalContent.style.flexDirection = 'column'; // Stack the children vertically
        modalContent.style.justifyContent = 'center'; // Center the children vertically
        modalContent.style.borderRadius = '10px';

        // Create a div for the message
        const messageDiv = document.createElement('div');
        const modalMessage = document.createElement('span');
        modalMessage.textContent = 'Enter the new price:';
        modalMessage.style.color = 'black';
        modalMessage.style.display = 'flex';
        modalMessage.style.justifyContent = 'center';
        modalMessage.style.marginBottom = '5%';
        messageDiv.appendChild(modalMessage);

        // Create a div for the input elements
        const inputDiv = document.createElement('div');
        inputDiv.style.display = 'flex'; // Set display to flex
        inputDiv.style.flexDirection = 'row'; // Arrange the children horizontally
        inputDiv.style.justifyContent = 'center'; // Center the children horizontally
        inputDiv.style.gap = '3%';

        // Create the input field
        const inputField = document.createElement('input');
        inputField.type = 'text';
        inputField.id = 'amountInput';
        inputDiv.appendChild(inputField);

        // Create and style the submit button
        const submitButton = document.createElement('button');
        submitButton.textContent = 'Submit';
        inputDiv.appendChild(submitButton);
        submitButton.onclick = () => {
          const amount = inputField.value;
          const event = new CustomEvent("updateListing", {
            detail: {
              tokenId: this.id,
              amount: amount,
              chainID: 'pisco-1'
            }
          });
          window.dispatchEvent(event);
          console.log('this.id:', event.detail.tokenId, 'amount:', event.detail.amount);
          document.body.removeChild(modal);
          this.registerTransaction('updateListing');
          window.addEventListener('txCancel', (event) => {
            this.handleTransaction('txCancel');
          });
        };

          // Create and style the close button
          const closeButton = document.createElement('span');
          closeButton.textContent = '×';
          closeButton.style.color = '#aaa';
          closeButton.style.float = 'right';
          closeButton.style.fontSize = '28px';
          closeButton.style.fontWeight = 'bold';
          closeButton.style.cursor = 'pointer';
          inputDiv.appendChild(closeButton);
          closeButton.onclick = function() {
            document.body.removeChild(modal);
          };

        // Append everything to the modal content
        modalContent.appendChild(messageDiv);
        modalContent.appendChild(inputDiv);

        // Append the modal content to the modal
        modal.appendChild(modalContent);

        // Append the modal to the body
        document.body.appendChild(modal);
      });


      //cancel listing
      this.cancelListing = document.createElement('button');
      this.cancelListing.className = 'marketButton';
      this.cancelListing.innerText = 'Cancel Listing';
      this.ownerButtons.appendChild(this.cancelListing);
      this.cancelListing.addEventListener('click', () => {
        const event = new CustomEvent("cancelListing", {
          detail: {
            tokenId: this.id,
            chainID: 'pisco-1'
          }
        });
        window.dispatchEvent(event);
        this.registerTransaction('cancelListing');
        window.addEventListener('txCancel', (event) => {
          this.handleTransaction('txCancel');
        });
      });
    }

    setBidderUi(){
      console.log('YOU ARE THE MOTHERAFUCKING BIDDER');
      // Create button container
      this.bidderButtons = document.createElement('div');
      this.bidderButtons.id = 'bidderButtons';
      this.bidderButtons.style.position = 'absolute';
      this.bidderButtons.style.display = 'flex';
      this.bidderButtons.style.flexDirection = 'column';
      this.bidderButtons.style.left = '50%';
      this.bidderButtons.style.transform = 'translateX(-50%)';
      this.bidderButtons.style.bottom = '5%';
      this.bidDiv.appendChild(this.bidderButtons);

      //buy now
      this.buyNowContainer = document.createElement('div');
      this.buyNowContainer.id = 'buyNowContainer';
      this.buyNowContainer.style.position = 'absolute';
      this.buyNowContainer.style.left = '50%';
      this.buyNowContainer.style.transform = 'translateX(-50%)';
      this.buyNowContainer.style.bottom = '5%';
      this.buyNowContainer.style.width = '45%';
      this.buyNowContainer.style.display = 'flex';
      this.buyNowContainer.style.justifyContent = 'center';
      this.buyNowContainer.style.flexDirection = 'column';
      this.detailsContainer.appendChild(this.buyNowContainer);
      this.buyNow = document.createElement('button');
      this.buyNow.className = 'marketButton';
      this.buyNow.innerText = 'Buy Now';
      this.buyNowContainer.appendChild(this.buyNow);
      this.buyNow.addEventListener('click', () => {
          if (!window.client.gloSession) {
            console.log('jimmy');
            return
          }
          const event = new CustomEvent('buyNow', {
            detail: {
              tokenId: this.id,
              amount: this.price,
              chainID: 'pisco-1'
            }
          });
          window.dispatchEvent(event);
          this.registerTransaction('buyNow');
          window.addEventListener('txCancel', (event) => {
            this.handleTransaction('txCancel');
          });
        });
        
        //make a bid
        this.makeBid = document.createElement('button');
        this.makeBid.className = 'marketButton';
        this.makeBid.innerText = 'Make Bid';
        this.buyNowContainer.appendChild(this.makeBid);
        this.makeBid.addEventListener('click', () => {
          if (!window.client.gloSession) {
            console.log('jimmy');
            return
          }
          // Create and style the modal
          const modal = document.createElement('div');
          modal.style.display = 'block';
          modal.style.position = 'fixed';
          modal.style.zIndex = '1';
          modal.style.left = '0';
          modal.style.top = '0';
          modal.style.width = '100%';
          modal.style.height = '100%';
          modal.style.overflow = 'auto';
          modal.style.backgroundColor = 'rgba(0,0,0,0.4)';
  
          // Create and style the modal content
          const modalContent = document.createElement('div');
          modalContent.style.backgroundColor = '#34ff19';
          modalContent.style.margin = '15% auto';
          modalContent.style.padding = '20px';
          modalContent.style.border = '1px solid #888';
          modalContent.style.width = '27.5%';
          modalContent.style.left = '50%';
          modalContent.style.transform = 'translateX(-50%)';
          modalContent.style.position = 'absolute';
          modalContent.style.top = '10%';
          modalContent.style.display = 'flex'; // Set display to flex
          modalContent.style.flexDirection = 'column'; // Stack the children vertically
          modalContent.style.justifyContent = 'center'; // Center the children vertically
          modalContent.style.borderRadius = '10px';
  
          // Create a div for the message
          const messageDiv = document.createElement('div');
          const modalMessage = document.createElement('span');
          modalMessage.textContent = 'Enter the bid amount:';
          modalMessage.style.color = 'black';
          modalMessage.style.display = 'flex';
          modalMessage.style.justifyContent = 'center';
          modalMessage.style.marginBottom = '5%';
          messageDiv.appendChild(modalMessage);
  
          // Create a div for the input elements
          const inputDiv = document.createElement('div');
          inputDiv.style.display = 'flex'; // Set display to flex
          inputDiv.style.flexDirection = 'row'; // Arrange the children horizontally
          inputDiv.style.justifyContent = 'center'; // Center the children horizontally
          inputDiv.style.gap = '3%';
  
          // Create the input field
          const inputField = document.createElement('input');
          inputField.type = 'text';
          inputField.id = 'amountInput';
          inputDiv.appendChild(inputField);
  
          // Create and style the submit button
          const submitButton = document.createElement('button');
          submitButton.textContent = 'Submit';
          inputDiv.appendChild(submitButton);
          submitButton.onclick = () => {
            const amount = inputField.value;
            if (amount !== null) {
              const event = new CustomEvent('placeBid', {
                detail: {
                  tokenId: this.id,
                  amount: amount,
                  chainID: 'pisco-1'
                }
              });
              window.dispatchEvent(event);
              console.log('this.id:', event.detail.tokenId, 'amount:', event.detail.amount);
              document.body.removeChild(modal);

              this.registerTransaction('placeBid');
              window.addEventListener('txCancel', (event) => {
                this.handleTransaction('txCancel');
              });
            }
          };
  
            // Create and style the close button
            const closeButton = document.createElement('span');
            closeButton.textContent = '×';
            closeButton.style.color = '#aaa';
            closeButton.style.float = 'right';
            closeButton.style.fontSize = '28px';
            closeButton.style.fontWeight = 'bold';
            closeButton.style.cursor = 'pointer';
            inputDiv.appendChild(closeButton);
            closeButton.onclick = function() {
              document.body.removeChild(modal);
            };
  
          // Append everything to the modal content
          modalContent.appendChild(messageDiv);
          modalContent.appendChild(inputDiv);
  
          // Append the modal content to the modal
          modal.appendChild(modalContent);
  
          // Append the modal to the body
          document.body.appendChild(modal);
        });
      
      //cancel a bid
      // this.cancelBid = document.createElement('button');
      // this.cancelBid.className = 'marketButton';
      // this.cancelBid.innerText = 'Cancel Bid';
      // this.bidderButtons.appendChild(this.cancelBid);
      // this.cancelBid.addEventListener('click', () => {
      //   const event = new CustomEvent('withdrawBid', {
      //     detail: {
      //       tokenId: this.id,
      //       chainID: 'pisco-1'
      //     }
      //   });
      //   window.dispatchEvent(event);
      //   this.registerTransaction(event);
      // });
    }

    awaitMetadata() {
      if (!this.listingNft.metadata) {
        setTimeout(() => {
          this.awaitMetadata();
        }, 50);
        return;
      }
      this.inspectListing();
    }

    registerTransaction(event) {
      switch(event){
        case 'acceptBid':
          window.addEventListener('acceptBidResponse', (event) => {
            if (event.detail.status === 'success') {
              // Handle non-error
              console.log('The operation was successful:', event.detail.result);
              this.handleTransaction('success');
            } else if (event.detail.status === 'failure') {
              // Handle non-error
              console.log('The operation failed:', event.detail.result);
              this.handleTransaction('failure');
            } else {
              // Handle error
              console.error('An error occurred:', event.detail.error);
              this.handleTransaction('error');
            }
          });
          break;
        case 'updateListing':
          window.addEventListener('updateListingResponse', (event) => {
            if (event.detail.status === 'success') {
              // Handle non-error
              console.log('The operation was successful:', event.detail.result);
              this.handleTransaction('success');
            } else if (event.detail.status === 'failure') {
              // Handle non-error
              console.log('The operation failed:', event.detail.result);
              this.handleTransaction('failure');
            } else {
              // Handle error
              console.error('An error occurred:', event.detail.error);
              this.handleTransaction('error');
            }
          });
          break;
        case 'cancelListing':
          window.addEventListener('cancelListingResponse', (event) => {
            if (event.detail.status === 'success') {
              // Handle non-error
              console.log('The operation was successful:', event.detail.result);
              this.handleTransaction('success');
            } else if (event.detail.status === 'failure') {
              // Handle non-error
              console.log('The operation failed:', event.detail.result);
              this.handleTransaction('failure');
            } else {
              // Handle error
              console.error('An error occurred:', event.detail.error);
              this.handleTransaction('error');
            }
          });
          break;
        case 'buyNow':
          window.addEventListener('buyNowResponse', (event) => {
            if (event.detail.status === 'success') {
              // Handle non-error
              console.log('The operation was successful:', event.detail.result);
              this.handleTransaction('success');
            } else if (event.detail.status === 'failure') {
              // Handle non-error
              console.log('The operation failed:', event.detail.result);
              this.handleTransaction('failure');
            } else {
              // Handle error
              console.error('An error occurred:', event.detail.error);
              this.handleTransaction('error');
            }
          });
          break;
        case 'placeBid':
          window.addEventListener('placeBidResponse', (event) => {
            if (event.detail.status === 'success') {
              // Handle non-error
              console.log('The operation was successful:', event.detail.result);
              this.handleTransaction('success');
            } else if (event.detail.status === 'failure') {
              // Handle non-error
              console.log('The operation failed:', event.detail.result);
              this.handleTransaction('failure');
            } else {
              // Handle error
              console.error('An error occurred:', event.detail.error);
              this.handleTransaction('error');
            }
          });
          break;
        default:
          break;
      }

      console.log('registering market os transaction of', event);
      this.glomartKeyLoaderContainer = document.createElement('div');
      this.glomartKeyLoaderContainer.className = 'glomartKeyLoaderContainer';
      
      this.glomartKeyLoaderToolbar = document.createElement('div');
      this.glomartKeyLoaderToolbar.className = 'glomartKeyLoaderToolbar';
      this.glomartKeyLoaderContainer.appendChild(this.glomartKeyLoaderToolbar);
      
      this.glomartKeyLoaderButt = document.createElement('div');
      this.glomartKeyLoaderButt.className = 'glomartKeyLoaderButt';
      this.glomartKeyLoaderToolbar.appendChild(this.glomartKeyLoaderButt);
      
      this.glomartKeyLoaderBtnColor = document.createElement('button');
      this.glomartKeyLoaderBtnColor.className = 'glomartKeyLoaderBtn glomartKeyLoaderBtnColor';
      this.glomartKeyLoaderButt.appendChild(this.glomartKeyLoaderBtnColor);
      
      this.glomartKeyLoaderBtn = document.createElement('button');
      this.glomartKeyLoaderBtn.className = 'glomartKeyLoaderBtn';
      this.glomartKeyLoaderButt.appendChild(this.glomartKeyLoaderBtn);
      
      this.glomartKeyLoaderUser = document.createElement('p');
      this.glomartKeyLoaderUser.className = 'glomartKeyLoaderUser';
      this.glomartKeyLoaderUser.textContent = `${window.client.gloInfo.username}@admin: ~`;
      this.glomartKeyLoaderToolbar.appendChild(this.glomartKeyLoaderUser);
      
      this.glomartKeyLoaderBody = document.createElement('div');
      this.glomartKeyLoaderBody.className = 'glomartKeyLoaderBody';
      this.glomartKeyLoaderContainer.appendChild(this.glomartKeyLoaderBody);
      
      this.glomartKeyLoaderPrompt = document.createElement('div');
      this.glomartKeyLoaderPrompt.className = 'glomartKeyLoaderPrompt';
      this.glomartKeyLoaderBody.appendChild(this.glomartKeyLoaderPrompt);
      
      this.glomartKeyLoaderUser = document.createElement('span');
      this.glomartKeyLoaderUser.className = 'glomartKeyLoaderUser';
      this.glomartKeyLoaderUser.textContent = `${window.client.gloInfo.username}@admin:`;
      this.glomartKeyLoaderPrompt.appendChild(this.glomartKeyLoaderUser);
      
      this.glomartKeyLoaderLocation = document.createElement('span');
      this.glomartKeyLoaderLocation.className = 'glomartKeyLoaderLocation';
      this.glomartKeyLoaderLocation.textContent = '~';
      this.glomartKeyLoaderPrompt.appendChild(this.glomartKeyLoaderLocation);
      
      this.glomartKeyLoaderBling = document.createElement('span');
      this.glomartKeyLoaderBling.className = 'glomartKeyLoaderBling';
      this.glomartKeyLoaderBling.textContent = '$';
      this.glomartKeyLoaderPrompt.appendChild(this.glomartKeyLoaderBling);
      
      this.glomartKeyLoaderCursor = document.createElement('span');
      this.glomartKeyLoaderCursor.className = 'glomartKeyLoaderCursor';
      this.glomartKeyLoaderPrompt.appendChild(this.glomartKeyLoaderCursor);
      
      this.glomartKeyLoaderOutput = document.createElement('div');
      this.glomartKeyLoaderOutput.className = 'glomartKeyLoaderOutput';
      this.glomartKeyLoaderBody.appendChild(this.glomartKeyLoaderOutput);
      
      this.glomartKeyLoaderOutputText = document.createElement('pre');
      this.glomartKeyLoaderOutputText.className = 'glomartKeyLoaderOutputText';
      this.glomartKeyLoaderOutputText.id = 'console'; // Add this line
      this.glomartKeyLoaderOutput.appendChild(this.glomartKeyLoaderOutputText);
      
      var intervalID = window.setInterval(updateScreen.bind(this), 200); 
      var txt = [
        "FORCE: XX0022. ENCYPT://000.222.2345",
        "TRYPASS: ********* AUTH CODE: ALPHA GAMMA: 1___ PRIORITY 1",
        "RETRY: GLOSPHERE GLOZILLA",
        "Z:> /GLO/GAMES/GLOMART/ EXECUTE -PLAYERS 0",
        "================================================",
        "Priority 1 // local / scanning...",
        "scanning ports...",
        "BACKDOOR FOUND (23.45.23.12.00000000)",
        "BACKDOOR FOUND (13.66.23.12.00110000)",
        "BACKDOOR FOUND (13.66.23.12.00110044)",
        "...",
        "...",
        "BRUTE.EXE -r -z",
        "...locating vulnerabilities...",
        "...vulnerabilities found...",
        "MCP/> DEPLOY CLU",
        "SCAN: __ 0100.0000.0554.0080",
        "SCAN: __ 0020.0000.0553.0080",
        "SCAN: __ 0001.0000.0554.0550",
        "SCAN: __ 0012.0000.0553.0030",
        "SCAN: __ 0100.0000.0554.0080",
        "SCAN: __ 0020.0000.0553.0080",
      ];
      
      var docfrag = document.createDocumentFragment();
      
      function updateScreen() {
        //Shuffle the "txt" array
        txt.push(txt.shift());
        //Rebuild document fragment
        txt.forEach(function(e) {
          var p = document.createElement("p");
          p.textContent = e;
          docfrag.appendChild(p);
        });
        //Clear DOM body
        while (this.glomartKeyLoaderOutputText.firstChild) {
          this.glomartKeyLoaderOutputText.removeChild(this.glomartKeyLoaderOutputText.firstChild);
        }
        this.glomartKeyLoaderOutputText.appendChild(docfrag);
      }
      
      setTimeout(() => { 
        this.glomartKeyLoaderOutputText.style.background = "limegreen";
        this.glomartKeyLoaderOutputText.innerHTML = "ACCESS GRANTED";
        this.glomartKeyLoaderOutputText.style.boxShadow = "0 0 30px limegreen";
        this.glomartKeyLoaderOutput.style.display = "none";

        // The ASCII art split into an array of lines
        var asciiArtLines = [
          "                                   /$$   /$$     /$$                             /$$                         ",
          "                                  |__/  | $$    |__/                            | $$                         ",
          "  /$$$$$$  /$$  /$$  /$$  /$$$$$$  /$$ /$$$$$$   /$$ /$$$$$$$   /$$$$$$        /$$$$$$  /$$   /$$            ",
          " |____  $$| $$ | $$ | $$ |____  $$| $$|_  $$_/  | $$| $$__  $$ /$$__  $$      |_  $$_/ |  $$ /$$/            ",
          "  /$$$$$$$| $$ | $$ | $$  /$$$$$$$| $$  | $$    | $$| $$  \\ $$| $$  \\ $$        | $$    \\  $$$$/             ",
          " /$$__  $$| $$ | $$ | $$ /$$__  $$| $$  | $$ /$$| $$| $$  | $$| $$  | $$        | $$ /$$ >$$  $$             ",
          "|  $$$$$$$|  $$$$$/$$$$/|  $$$$$$$| $$  |  $$$$/| $$| $$  | $$|  $$$$$$$        |  $$$$//$$/\\  $$ /$$ /$$ /$$",
          " \\_______/ \\_____/\___/  \\_______/|__/   \\___/  |__/|__/  |__/ \\____  $$         \\___/ |__/  \\__/|__/|__/|__/",
          "                                                               /$$  \\ $$                                     ",
          "                                                              |  $$$$$$/                                     ",
          "                                                               \\______/                                      "
        ];

        var asciiContainer = document.createElement('pre');
        asciiContainer.id = 'asciiContainer';
        asciiContainer.style.fontSize = '0.45em';
        asciiContainer.style.fontFamily = 'monospace'; // Use a monospaced font
        asciiContainer.style.margin = '0'; // Remove default margin
        asciiContainer.style.padding = '0'; // Remove default padding
        asciiContainer.style.marginTop = '20%';
        asciiContainer.style.marginLeft = '10%';
        this.glomartKeyLoaderBody.appendChild(asciiContainer);
        var fullText = '';
        var lineIndex = 0;
        var charIndex = 0;

      // Function to show the next character
      function showNextChar() {
        if (lineIndex < asciiArtLines.length) {
          var chunk = asciiArtLines[lineIndex].substring(charIndex, charIndex + 5); // Get a chunk of 3 characters
          fullText += chunk;
          asciiContainer.innerText = fullText;
          charIndex += chunk.length;
          if (charIndex >= asciiArtLines[lineIndex].length) {
            fullText += '\n'; // Add a newline at the end of a line
            lineIndex++;
            charIndex = 0;
          }
        } else {
          // Clear the interval once the full ASCII art has been displayed
          clearInterval(intervalId);
          // Start the GSAP animation
          gsap.to(asciiContainer, {
            duration: 1,
            y: '+=10',
            repeat: -1,
            yoyo: true,
            ease: 'power1.inOut'
          });
        }
      }

      // Set the interval to add characters
      var intervalId = setInterval(showNextChar, 1);

      }, 2000);
      
      document.body.appendChild(this.glomartKeyLoaderContainer);
  
      this.glomartKeyLoaderOverlay = document.createElement('div');
      this.glomartKeyLoaderOverlay.id = 'glomartKeyLoaderOverlay';
      this.glomartKeyLoaderOverlay.style.position = 'absolute';
      this.glomartKeyLoaderOverlay.style.top = '0';
      this.glomartKeyLoaderOverlay.style.left = '0';
      this.glomartKeyLoaderOverlay.style.height = '100%';
      this.glomartKeyLoaderOverlay.style.width = '100%';
      this.glomartKeyLoaderOverlay.style.backgroundColor = 'black';
      this.glomartKeyLoaderOverlay.style.opacity = '.75';
      this.glomartKeyLoaderOverlay.style.zIndex = '1';
      // Add an event listener to the overlay
      this.glomartKeyLoaderOverlay.addEventListener('click', () => {
        // Remove the overlay
        document.body.removeChild(this.glomartKeyLoaderOverlay);
        document.body.removeChild(this.glomartKeyLoaderContainer);
      });

      document.body.appendChild(this.glomartKeyLoaderOverlay);
    }

    handleTransaction(result){
      console.log('calling handleTransaction with result:', result);
      const prevContainer = document.getElementById('asciiContainer')
      if (prevContainer) prevContainer.remove();
      this.glomartKeyLoaderOutput.style.display = "none";
      let asciiArtLines;
      switch(result){
        case 'success':
          asciiArtLines = [
            "   /$$                                                                                         ",
            "  | $$                                                                                         ",
            " /$$$$$$  /$$   /$$        /$$$$$$$ /$$   /$$  /$$$$$$$  /$$$$$$$  /$$$$$$   /$$$$$$$ /$$$$$$$",
            "|_  $$_/ |  $$ /$$/       /$$_____/| $$  | $$ /$$_____/ /$$_____/ /$$__  $$ /$$_____//$$_____/",
            "  | $$    \\  $$$$/       |  $$$$$$ | $$  | $$| $$      | $$      | $$$$$$$$|  $$$$$$|  $$$$$$ ",
            "  | $$ /$$ >$$  $$        \\____  $$| $$  | $$| $$      | $$      | $$_____/ \\____  $$\\____  $$",
            "  |  $$$$//$$/\\  $$       /$$$$$$$/|  $$$$$$/|  $$$$$$$|  $$$$$$$|  $$$$$$$ /$$$$$$$//$$$$$$$/",
            "   \\___/ |__/  \\__/      |_______/  \\______/  \\_______/ \\_______/ \\_______/|_______/|_______/ ",
            "                                                                                               ",
            "                                                                                               ",
            "                                                                                               "
          ];
          break;
        case 'failure':
          asciiArtLines = [
            "  /$$                     /$$$$$$          /$$ /$$                              ",
            "  | $$                    /$$__  $$        |__/| $$                              ",
            " /$$$$$$  /$$   /$$      | $$  \\__//$$$$$$  /$$| $$ /$$   /$$  /$$$$$$   /$$$$$$ ",
            " |_  $$_/ |  $$ /$$/      | $$$$   |____  $$| $$| $$| $$  | $$ /$$__  $$ /$$__  $$",
            "  | $$    \\  $$$$/       | $$_/    /$$$$$$$| $$| $$| $$  | $$| $$  \\__/| $$$$$$$$",
            "  | $$ /$$ >$$  $$       | $$     /$$__  $$| $$| $$| $$  | $$| $$      | $$_____/",
            "  |  $$$$//$$/\\  $$      | $$    |  $$$$$$$| $$| $$|  $$$$$$/| $$      |  $$$$$$$",
            "   \\___/ |__/  \\__/      |__/     \\_______/|__/|__/ \\______/ |__/       \\_______/"
          ];
          break;
        case 'error':
          asciiArtLines = [
            "  /$$                                                                     ",
            "  | $$                                                                     ",
            " /$$$$$$  /$$   /$$        /$$$$$$   /$$$$$$   /$$$$$$   /$$$$$$   /$$$$$$ ",
            " |_  $$_/ |  $$ /$$/       /$$__  $$ /$$__  $$ /$$__  $$ /$$__  $$ /$$__  $$",
            "  | $$    \\  $$$$/       | $$$$$$$$| $$  \\__/| $$  \\__/| $$  \\ $$| $$  \\__/",
            "  | $$ /$$ >$$  $$       | $$_____/| $$      | $$      | $$  | $$| $$      ",
            "  |  $$$$//$$/\\  $$      |  $$$$$$$| $$      | $$      |  $$$$$$/| $$      ",
            "   \\___/ |__/  \\__/       \\_______/|__/      |__/       \\______/ |__/      "
          ];
          break;
        case 'txCancel':
          asciiArtLines = [
            "   /$$                                                                      /$$ /$$                 /$$",
            "  | $$                                                                     | $$| $$                | $$",
            " /$$$$$$  /$$   /$$        /$$$$$$$  /$$$$$$  /$$$$$$$   /$$$$$$$  /$$$$$$ | $$| $$  /$$$$$$   /$$$$$$$",
            "|_  $$_/ |  $$ /$$/       /$$_____/ |____  $$| $$__  $$ /$$_____/ /$$__  $$| $$| $$ /$$__  $$ /$$__  $$",
            "  | $$    \\  $$$$/       | $$        /$$$$$$$| $$  \\ $$| $$      | $$$$$$$$| $$| $$| $$$$$$$$| $$  | $$",
            "  | $$ /$$ >$$  $$       | $$       /$$__  $$| $$  | $$| $$      | $$_____/| $$| $$| $$_____/| $$  | $$",
            "  |  $$$$//$$/\\  $$      |  $$$$$$$|  $$$$$$$| $$  | $$|  $$$$$$$|  $$$$$$$| $$| $$|  $$$$$$$|  $$$$$$$",
            "   \\___/ |__/  \\__/       \\_______/ \\_______/|__/  |__/ \\_______/ \\_______/|__/|__/ \\_______/ \\_______/",
            "                                                                                                       ",
            "                                                                                                       ",
            "                                                                                                       "
          ];
          break;
        default:
          break;
      }

      var asciiContainer = document.createElement('pre');
      asciiContainer.id = 'asciiContainer';
      asciiContainer.style.fontSize = '0.45em';
      asciiContainer.style.fontFamily = 'monospace'; // Use a monospaced font
      asciiContainer.style.margin = '0'; // Remove default margin
      asciiContainer.style.padding = '0'; // Remove default padding
      asciiContainer.style.marginTop = '20%';
      asciiContainer.style.marginLeft = '12.5%';
      this.glomartKeyLoaderBody.appendChild(asciiContainer);
      var fullText = '';
      var lineIndex = 0;
      var charIndex = 0;

      // Function to show the next character
      function showNextChar() {
        if (lineIndex < asciiArtLines.length) {
          var chunk = asciiArtLines[lineIndex].substring(charIndex, charIndex + 5); // Get a chunk of 3 characters
          fullText += chunk;
          asciiContainer.innerText = fullText;
          charIndex += chunk.length;
          if (charIndex >= asciiArtLines[lineIndex].length) {
            fullText += '\n'; // Add a newline at the end of a line
            lineIndex++;
            charIndex = 0;
          }
        } else {
          // Clear the interval once the full ASCII art has been displayed
          clearInterval(intervalId);
        }
      }

      // Set the interval to add characters
      var intervalId = setInterval(showNextChar, 1);
    }
}

class Sell {
  constructor() {
    window.nftMachine.gloMartInstance.activePage = 'Sell';
    window.glogo.updateURL();
    this.createSellPageElements();
  }

  createSellPageElements() {
    if(!window.client.gloInfo.activeNfts) {
      this.sellGuest = document.createElement('div');
      this.sellGuest.id = 'sellGuest';
      this.sellGuest.style.position = 'absolute';
      this.sellGuest.style.top = '48%';
      this.sellGuest.style.left = '50%';
      this.sellGuest.style.transform = 'translateX(-50%)';
      this.sellGuest.style.fontSize = '2vw';
      this.sellGuest.style.width = '90%';
      this.sellGuest.style.textAlign = 'center';
      this.sellGuest.style.color = '#34ff19';
      window.nftMachine.gloMartInstance.sellOS.appendChild(this.sellGuest);
      this.sellGuestTxt = document.createElement('span');
      this.sellGuestTxt.innerText = 'SIGN IN TO ACESS SELL PORTAL';
      this.sellGuest.appendChild(this.sellGuestTxt);
      return;
    }
    // Create the parent div
    this.sellContainer = document.createElement('div');
    this.sellContainer.id = 'sellContainer';
    this.sellContainer.style.height = '100%';
    this.sellContainer.style.width = '100%'
    this.sellContainer.style.position = 'absolute';
    this.sellContainer.style.top = '0%';
    this.sellContainer.style.left = '50%';
    this.sellContainer.style.transform = 'translate(-50%, 0%)';

    // Create the top div
    this.sellWindow = document.createElement('div');
    this.sellWindow.id = 'sell-window';
    this.sellWindow.style.position = 'absolute';
    this.sellWindow.style.top = '6%';
    this.sellWindow.style.width = '60%';
    this.sellWindow.style.height = '94%';
    this.sellWindow.style.display = 'flex'; // to align items side by side
    this.sellWindow.style.flexDirection = 'column';

    // Create the video element
    this.gridSelect = document.createElement('video');
    this.gridSelect.style.zIndex = '7';

    // Set the source of the video
    this.gridSelect.src = 'style/graphics/3d_grid.webm';

    // Set the gridSelect to autoplay, mute, and loop
    this.gridSelect.autoplay = true;
    this.gridSelect.muted = true;
    this.gridSelect.loop = true;

    // Apply the same styles as the plus sign
    this.gridSelect.style.fontFamily  = "Gabarito, sans-serif";
    this.gridSelect.style.fontSize = '9em';
    this.gridSelect.style.width = '2em'; 
    this.gridSelect.style.height = '2em';
    this.gridSelect.style.borderRadius = '25px'; 
    this.gridSelect.style.border = '2px solid #34ff19';
    this.gridSelect.style.boxShadow = 'darkgreen 0px 0px 20px 11px';  
    this.gridSelect.style.alignSelf = 'center';
    this.gridSelect.style.position = 'relative';
    this.gridSelect.style.top = '10%';

    this.sellWindow.appendChild(this.gridSelect);

    // Create an image element
    this.selectedImage = document.createElement('img');
    this.selectedImage.style.display = 'none';
    this.selectedImage.style.position = 'absolute'; // Position it over the video
    this.selectedImage.style.width = '15.5em'; // Make it fit the grid
    this.selectedImage.style.height = '15.5em';
    this.selectedImage.style.pointerEvents = 'none';
    this.selectedImage.style.top = '12.5%';
    this.selectedImage.style.left = '50%';
    this.selectedImage.style.zIndex = '8';
    this.selectedImage.style.transform = 'translateX(-50%)';
    
    // Append the image to the video grid
    this.sellWindow.appendChild(this.selectedImage);

    //main container
    this.selectOS = document.createElement('div');
    this.selectOS.id = 'selectOS';
    this.selectOS.className = 'select-os';
    this.selectOS.style.opacity = '0';
    document.body.appendChild(this.selectOS);

    // Left side container for Price label and dropdown
    this.leftContainer = document.createElement('div');
    this.leftContainer.style.display = 'flex';
    this.leftContainer.style.alignItems = 'center'; 
    this.leftContainer.style.position = 'relative';
    this.leftContainer.style.top = '20%';
    this.leftContainer.style.justifyContent = 'center';

    this.leftLabel = document.createElement('label');
    this.leftLabel.textContent = 'Price';
    this.leftLabel.style.color = 'white';
    this.leftLabel.style.fontSize = '2.75rem';
    this.leftLabel.style.fontFamily  = "Gabarito, sans-serif";
    this.leftContainer.appendChild(this.leftLabel);

    this.priceInputContainer = document.createElement('div'); // Create a new div
    this.priceInputContainer.style.display = 'flex'; // Set the display to flex to align the children
    this.priceInputContainer.style.marginLeft = '3%';
    this.priceInputContainer.className = 'priceInputContainer';

    this.priceInput = document.createElement('input');
    this.priceInput.type = 'text'; // Use a text input
    this.priceInput.style.flex = '1';
    this.priceInput.className = 'priceInput';
    this.priceInput.placeholder = "0000000";
    this.priceInputContainer.appendChild(this.priceInput); // Append the price input to the container

    this.priceInput.addEventListener('input', () => {
      if (this.selectedInfo) {
        let finalPrice = this.priceInput.value;
        this.listingPrevPrice.innerText = 'price: ' + finalPrice + 'luna';
        this.listingPrevPrice.style.display = 'flex';
      }
    });
    

    this.lunaDenomCard = document.createElement('div');
    this.lunaDenomCard.className = 'luna-denom-card';
    this.lunaDenom = document.createElement('img');
    this.lunaDenom.src = '/style/graphics/lunatextsvg.svg';
    this.lunaDenom.className = 'luna-denom';
    this.lunaDenom.style.width = '70%';
    this.lunaDenom.style.height = '100%';
    this.lunaDenom.style.objectFit = 'contain';
    this.lunaDenomCard.appendChild(this.lunaDenom);
    this.priceInputContainer.appendChild(this.lunaDenomCard);

    this.leftContainer.appendChild(this.priceInputContainer);
    this.sellWindow.appendChild(this.leftContainer);

    // Right side container for Expiration label and dropdown
    this.rightContainer = document.createElement('div');
    this.rightContainer.style.display = 'flex';
    this.rightContainer.style.alignItems = 'center'; 
    this.rightContainer.style.position = 'relative';
    this.rightContainer.style.top = '25%';
    this.rightContainer.style.justifyContent = 'center';

    
    this.rightLabel = document.createElement('label');
    this.rightLabel.textContent = 'Expiration';
    this.rightLabel.style.color = 'white';
    this.rightLabel.style.fontSize = '2.75rem';
    this.rightLabel.style.fontFamily  = "Gabarito, sans-serif";
    this.rightContainer.appendChild(this.rightLabel);
    
    // Create a container for the range input and the value display
    this.expirationInputContainer = document.createElement('div');
    this.expirationInputContainer.style.marginLeft = '3%';

    // Modify the input type and values
    this.expirationInput = document.createElement('input');
    this.expirationInput.type = 'range'; // Use a range input
    this.expirationInput.min = '1'; // Minimum value is 1
    this.expirationInput.max = '10'; // Maximum value is 10
    this.expirationInput.value = '1'; // Initial value is 1
    this.expirationInput.className = 'range'; // Add the class for styling

    this.expirationInput.addEventListener('input', () => {
      if (this.selectedInfo) {
        let dayExpired = new Date();
        dayExpired.setDate(dayExpired.getDate() + parseInt(this.expirationInput.value));
        this.listingPrevExpiration.innerText = 'expires on ' + dayExpired.toDateString();
        this.listingPrevExpiration.style.display = 'flex';
      }
    });

    // Create the span to display the value
    this.rangeValue = document.createElement('span');
    this.rangeValue.id = 'rangeValue'; // Add the id for styling and updating the value
    this.rangeValue.innerHTML = `${this.expirationInput.value} day`; // Set the initial value

    // Append the range input and the span to the container
    this.expirationInputContainer.appendChild(this.rangeValue);
    this.expirationInputContainer.appendChild(this.expirationInput);

    // Update the value display when the input value changes
    this.expirationInput.oninput = function() {
      if (this.value === '1') {
        document.getElementById('rangeValue').innerHTML = `${this.value} day`;
      } else {
        document.getElementById('rangeValue').innerHTML = `${this.value} days`;
      }
    };
    
    this.rightContainer.appendChild(this.expirationInputContainer);
    this.sellWindow.appendChild(this.rightContainer);

    this.sellContainer.appendChild(this.sellWindow); 

    //listing selection card
    this.listingSelectionCard = document.createElement('div');
    this.listingSelectionCard.style.position = 'absolute';
    this.listingSelectionCard.style.right = '0';
    this.listingSelectionCard.style.top = '0';
    this.listingSelectionCard.style.height = '100%';
    this.listingSelectionCard.style.width = '50%';
    this.sellContainer.appendChild(this.listingSelectionCard);

    //create listing selection menu
    //menu container
    this.selectMenu = document.createElement('div');
    this.selectMenu.id = 'selectMenu';
    this.selectMenu.className = 'select-menu';
    this.selectMenu.style.opacity = '0';
    this.listingSelectionCard.appendChild(this.selectMenu);

    // Define the names for the radio buttons
    const names = ['all', 'glochips', 'keys', 'glotag', 'arcade', 'L-man'];

    // Create the radio buttons and labels
    for (let i = 0; i < names.length; i++) {
      let input = document.createElement('input');
      input.type = 'radio';
      input.name = 'value-radio';
      input.id = names[i];
      input.value = names[i];

      if (names[i] === 'all') { // Add this line
        input.checked = true; // Add this line
      } 

      input.addEventListener('change', () => {
        this.selectContainer.innerHTML = ''; // Clear the current NFTs

        let filteredNfts;
        switch (names[i]) {
          case 'glochips':
            filteredNfts = window.client.clientNfts.filter(nft => nft.tokenId.includes('glochip'));
            break;
          case 'keys':
            filteredNfts = window.client.clientNfts.filter(nft => nft.tokenId.includes('key'));
            break;
          case 'glotag':
            filteredNfts = window.client.clientNfts.filter(nft => nft.tokenId.includes('glotag') || nft.tokenId.includes('pfp') || nft.tokenId.includes('reaction'));
            break;
          case 'arcade':
            filteredNfts = window.client.clientNfts.filter(nft => nft.tokenId.includes('arcade'));
            break;
          case 'L-man':
            filteredNfts = window.client.clientNfts.filter(nft => nft.tokenId.includes('luncman') || nft.tokenId.includes('victory'));
            break;
          default:
            filteredNfts = window.client.clientNfts;
        }

        if (filteredNfts.length === 0) {
          this.selectContainer.textContent = 'Nothing found';
        } else {
          filteredNfts.forEach((nftData) => {
            // The same code as in the forEach loop in createSelectListing
            const container = document.createElement('div');
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.alignItems = 'center';

            const square = document.createElement('div');
            square.style.width = '150px'; // Increase the size of the square
            square.style.height = '150px';
            square.style.cursor = 'pointer';
            square.style.backgroundImage = `url(/style/graphics/token_images/${nftData.metadata.previewImg}.webp)`; // Set the background image
            square.style.backgroundSize = 'cover'; // Cover the entire square
            square.style.backgroundPosition = 'center'; // Center the image
            square.style.color = 'white';

            const label = document.createElement('span');
            label.style.fontSize = '0.75em';
            label.style.position = 'relative';
            label.style.bottom = '0%';
            label.style.color = '#34ff19';
            label.textContent = nftData.metadata.name;

            container.appendChild(square);
            container.appendChild(label);

            // Add a click event listener to the square
            square.addEventListener('click', () => {
              // Deselect the currently selected square
              if (selectedSquare) {
                selectedSquare.style.border = 'none';
              }

              // Select the clicked square
              square.style.border = '1px solid #34ff19';
              this.selectedSell = nftData.token_id;
              this.selectedInfo = nftData.tokenIds[0];
              this.selectedUri = nftData.token_uri;

              // Update the reference to the currently selected square
              selectedSquare = square;

              // Set the source of the selected image to the background image of the square
              this.selectedImage.src = square.style.backgroundImage.slice(5, -2); // Remove 'url("' at the start and '")' at the end

              // Show the selected image
              this.selectedImage.style.display = 'block';
              document.getElementById('listing-prev-id').innerText = 'token_id: ' + this.selectedInfo;
              document.getElementById('listing-prev-id').style.display = 'block';
              gsap.to('.select-container', { duration: 0.25, opacity: 0 });
              gsap.to('.select-menu', { duration: 0.25, opacity: 0 });

              let listingCancel = document.getElementById('sellCancelButton');
              if(!listingCancel){
                listingCancel = document.createElement('span');
                listingCancel.id = 'sellCancelButton';
                listingCancel.style.position = 'absolute';
                listingCancel.style.top = '10px';
                listingCancel.style.right = '10px';
                listingCancel.innerText = 'X';
                listingCancel.style.color = '#34ff19';
                listingCancel.style.fontSize = '25px';
                this.listingPreview.appendChild(listingCancel);
              } else {
                listingCancel.style.display = 'flex';
              }
              // Add event listener to listingCancel
              listingCancel.addEventListener('click', () => {
                this.cancelListing();
              });
            });

            // Add a mouseover event listener to the square
            square.addEventListener('mouseover', () => {
              gsap.to(square, { duration: 0.25, scale: 1.05 });
            });

            // Add a mouseout event listener to the square
            square.addEventListener('mouseout', () => {
              gsap.to(square, { duration: 0.25, scale: 1 });
            });

            this.selectContainer.appendChild(container);
          });
        }
      });

      let label = document.createElement('label');
      label.htmlFor = names[i];
      label.textContent = names[i];;

        // Append the radio button and label to the radio-input container
        this.selectMenu.appendChild(input);
        this.selectMenu.appendChild(label);
      }

    //create listing preview
    this.listingPreview = document.createElement('div');
    this.listingPreview.style.position = 'absolute';
    this.listingPreview.style.left = '50%';
    this.listingPreview.style.transform = 'translateX(-50%)';
    this.listingPreview.style.width = '85%';
    this.listingPreview.style.top = '16%'
    this.listingPreview.style.height = '70%';
    this.listingPreview.style.border = '1px solid #34ff19';
    this.listingSelectionCard.appendChild(this.listingPreview);

    //handle initial load
    this.listingPreviewText = document.createElement('span');
    this.listingPreviewText.id = 'listing-prev-text';
    this.listingPreviewText.className = 'listing-prev-text';
    this.listingPreviewText.innerText = 'SELECT AN NFT TO LIST';
    this.listingPreviewText.style.color = '#34ff19';
    this.listingPreviewText.style.textAlign = 'center';
    this.listingPreviewText.style.width = '85%';
    this.listingPreviewText.style.position = 'absolute';
    this.listingPreviewText.style.left = '50%';
    this.listingPreviewText.style.transform = 'translateX(-50%)';
    this.listingPreviewText.style.top = '37.5%';
    this.listingPreviewText.style.fontSize = '3em';
    this.listingPreviewText.style.opacity = '0';
    this.listingPreview.appendChild(this.listingPreviewText);

    //populate listing preview with nfts
    //nft display
    this.selectContainer = document.createElement('div');
    this.selectContainer.id = 'selectContainer';
    this.selectContainer.className = 'select-container';
    this.selectContainer.style.opacity = '0';
    this.listingPreview.appendChild(this.selectContainer);

        // Append custom CSS for scrollbar in the head of the document
        const selectSheet = document.createElement("style");
        selectSheet.type = "text/css";
        selectSheet.innerText = `
          #selectContainer::-webkit-scrollbar {
            width: 6px !important;
          }
          #selectContainer::-webkit-scrollbar-track {
            background: transparent !important;
          }
          #selectContainer::-webkit-scrollbar-thumb {
            background: #34ff19; // Change color here
            border-radius: 10px !important;
          }
          @media screen and (max-width: 768px) {
            #selectContainer::-webkit-scrollbar {
              width: 6px !important;
            }
          }
        `;
        document.head.appendChild(selectSheet);

    console.log('populating selectOS w/nfts:', window.client.allNfts);

    let selectedSquare = null; // Keep a reference to the currently selected square

    window.client.clientNfts.forEach((nftData) => {
      const container = document.createElement('div');
      container.style.display = 'flex';
      container.style.flexDirection = 'column';
      container.style.alignItems = 'center';

      const square = document.createElement('div');
      square.style.width = '150px'; // Increase the size of the square
      square.style.height = '150px';
      square.style.cursor = 'pointer';
      square.style.backgroundImage = `url(/style/graphics/token_images/${nftData.metadata.previewImg}.webp)`; // Set the background image
      square.style.backgroundSize = 'cover'; // Cover the entire square
      square.style.backgroundPosition = 'center'; // Center the image
      square.style.color = 'white';

      const label = document.createElement('span');
      label.style.fontSize = '0.75em';
      label.style.position = 'relative';
      label.style.bottom = '0%';
      label.style.color = '#34ff19';
      label.textContent = nftData.metadata.name;

      container.appendChild(square);
      container.appendChild(label);

      // Add a click event listener to the square
      square.addEventListener('click', () => {
        // Deselect the currently selected square
        if (selectedSquare) {
          selectedSquare.style.border = 'none';
        }

        // Select the clicked square
        square.style.border = '1px solid #34ff19';
        this.selectedSell = nftData.tokenId;
        this.selectedInfo = nftData.tokenIds[0];
        this.selectedUri = nftData.metadata.tokenUri;

        // Update the reference to the currently selected square
        selectedSquare = square;

        // Set the source of the selected image to the background image of the square
        this.selectedImage.src = square.style.backgroundImage.slice(5, -2); // Remove 'url("' at the start and '")' at the end

        // Show the selected image
        this.selectedImage.style.display = 'block';
        document.getElementById('listing-prev-id').innerText = 'token_id: ' + this.selectedInfo;
        document.getElementById('listing-prev-id').style.display = 'block';
        gsap.to('.select-container', { duration: 0.25, opacity: 0 });
        gsap.to('.select-menu', { duration: 0.25, opacity: 0 });

        let listingCancel = document.getElementById('sellCancelButton');
        if(!listingCancel){
          listingCancel = document.createElement('span');
          listingCancel.id = 'sellCancelButton';
          listingCancel.style.position = 'absolute';
          listingCancel.style.top = '10px';
          listingCancel.style.right = '10px';
          listingCancel.innerText = 'X';
          listingCancel.style.color = '#34ff19';
          listingCancel.style.fontSize = '25px';
          this.listingPreview.appendChild(listingCancel);
        } else {
          listingCancel.style.display = 'flex';
        }
        // Add event listener to listingCancel
        listingCancel.addEventListener('click', () => {
          const listingPrevId = document.getElementById('listing-prev-id');
          const listingPrevPrice = document.getElementById('listing-prev-price');
          const listingPrevExp = document.getElementById('listing-prev-exp');
          const selectMenu = document.getElementById('selectMenu');
          const selectContainer = document.getElementById('selectContainer');
          const priceInput = document.querySelector('.priceInput');
          const expInput = document.querySelector('.range')

          // Set display of listingPrevId to none
          listingPrevId.style.display = 'none';
          listingCancel.style.display = 'none';
          listingPrevPrice.style.display = 'none';
          listingPrevExp.style.display = 'none';

          // Fade in selectMenu and selectContainer over 0.25 seconds
          gsap.to(selectMenu, { duration: 0.25, opacity: 1 });
          gsap.to(selectContainer, { duration: 0.25, opacity: 1 });

          //reset listing
          this.selectedImage.src = '';
          this.selectedImage.style.display = 'none';
          priceInput.value = '';
          expInput.value = expInput.min || '0';
          this.rangeValue.innerHTML = `1 day`;
          Array.from(selectContainer.children).forEach(child => {
            Array.from(child.children).forEach(grandchild => {
                grandchild.style.border = 'none';
            });
        });
        });
      });

      this.selectContainer.appendChild(container);
    });


    //popoulate listing with listing details once nft selected
    this.listingPrevId = document.createElement('div');
    this.listingPrevId.id = 'listing-prev-id';
    this.listingPrevId.className = 'listing-prev-content';
    this.listingPrevId.style.position = 'absolute';
    this.listingPrevId.style.top = '15%';
    this.listingPreview.appendChild(this.listingPrevId);

    this.listingPrevPrice = document.createElement('div');
    this.listingPrevPrice.id = 'listing-prev-price';
    this.listingPrevPrice.className = 'listing-prev-content';
    this.listingPrevPrice.style.position = 'absolute';
    this.listingPrevPrice.style.top = '40%';
    this.listingPreview.appendChild(this.listingPrevPrice);

    this.listingPrevExpiration = document.createElement('div');
    this.listingPrevExpiration.id = 'listing-prev-exp';
    this.listingPrevExpiration.className = 'listing-prev-content';
    this.listingPrevExpiration.style.position = 'absolute';
    this.listingPrevExpiration.style.top = '65%';
    this.listingPreview.appendChild(this.listingPrevExpiration);


    // Create the bottom button
    this.sellButton = document.createElement('button'); // Changed from 'button' to 'a'
    this.sellButton.id = 'sell-button';
    this.sellButton.className = 'sell-button';
    this.sellButton.textContent = 'List'; // Set button label
    this.sellButton.style.position = 'absolute';
    this.sellButton.style.left = '75%';
    this.sellButton.style.bottom = '5%';
    this.sellButton.style.backgroundColor = '#34ff19';
    this.sellButton.style.transform = 'translate(-50%, 0%)';
    this.sellButton.style.cursor = 'pointer'; // Change the mouse cursor when over the button
    this.sellButton.style.color = 'black'; // Set text color
    this.sellButton.style.fontSize = '1.5em'; // Set font size
    this.sellButton.style.textDecoration = 'none'; // Remove underline from link
    this.sellButton.style.textTransform = 'uppercase'; // Make text uppercase
    this.sellButton.style.overflow = 'hidden'; // Hide overflow
    this.sellButton.style.transition = '.5s'; // Set transition duration
    this.sellButton.style.letterSpacing = '4px'; // Set letter spacing

    // Add the click event listener
    this.sellButton.addEventListener('click', this.listEvent.bind(this));

    // Create the span for the animation
    const span = document.createElement('span');
    this.sellButton.appendChild(span);

    this.sellContainer.appendChild(this.sellButton);


    // Append the parent div to the body or another container
    window.nftMachine.gloMartInstance.sellOS.appendChild(this.sellContainer);

    // Make 'listing-prev-text' wiggle
    gsap.fromTo('.listing-prev-text', { opacity: 0 }, { opacity: 1, duration: 2});

    setTimeout(() => {
      // Fade out 'listing-prev-text'
      gsap.to('.listing-prev-text', { duration: 0.5, opacity: 0 });

      // Fade in 'selectcontainer' and 'select menu'
      gsap.to('.select-container', { duration: 0.5, opacity: 1 });
      gsap.to('.select-menu', { duration: 0.5, opacity: 1 });
      this.gridSelect.addEventListener('click', () => {
        const selectMenu = document.getElementById('selectMenu');
        const selectContainer = document.getElementById('selectContainer');
        const listingPrevId = document.getElementById('listing-prev-id');
        const listingPrevPrice = document.getElementById('listing-prev-price');
        const listingPrevExp = document.getElementById('listing-prev-exp');
        const listingCancel = document.getElementById('sellCancelButton');
  
        if (listingCancel){
          listingCancel.style.display = 'none';
        }
  
        if (selectMenu.style.opacity != 1) {
          gsap.to(selectMenu, { duration: 0.25, opacity: 1 });
        }
  
        if (selectContainer.style.opacity != 1) {
          gsap.to(selectContainer, { duration: 0.25, opacity: 1 });
        }
  
        listingPrevId.style.display = 'none';
        listingPrevPrice.style.display = 'none';
        listingPrevExp.style.display = 'none';
      });
    }, 2000);
  }

  cancelListing() {
    const listingPrevId = document.getElementById('listing-prev-id');
    const listingPrevPrice = document.getElementById('listing-prev-price');
    const listingPrevExp = document.getElementById('listing-prev-exp');
    const selectMenu = document.getElementById('selectMenu');
    const listingCancel = document.getElementById('sellCancelButton');
    const selectContainer = document.getElementById('selectContainer');
    const priceInput = document.querySelector('.priceInput');
    const expInput = document.querySelector('.range')

    // Set display of listingPrevId to none
    listingPrevId.style.display = 'none';
    listingCancel.style.display = 'none';
    listingPrevPrice.style.display = 'none';
    listingPrevExp.style.display = 'none';

    // Fade in selectMenu and selectContainer over 0.25 seconds
    gsap.to(selectMenu, { duration: 0.25, opacity: 1 });
    gsap.to(selectContainer, { duration: 0.25, opacity: 1 });

    //reset listing
    this.selectedImage.src = '';
    this.selectedImage.style.display = 'none';
    priceInput.value = '';
    expInput.value = expInput.min || '0';
    this.rangeValue.innerHTML = `1 day`;
    Array.from(selectContainer.children).forEach(child => {
      Array.from(child.children).forEach(grandchild => {
          grandchild.style.border = 'none';
      });
    });
  }

  listEvent() {
    console.log('this.selectedInfo:', this.selectedInfo);
    console.log('this.pricInput:', this.priceInput.value);

    // Convert price from uLuna to Luna
    const priceInLuna = (this.priceInput.value * 1000000).toString();

    // Create a custom event with details
    const event = new CustomEvent("listNft", {
      detail: {
          tokenId: this.selectedInfo,
          tokenUri: this.selectedUri,
          amount: priceInLuna,
          chainID: 'pisco-1'
      }
    });

    // Dispatch the event
    window.dispatchEvent(event);
    this.registerTransaction('listNft');
  }

  
  registerTransaction(event) {
    window.addEventListener('txCancel', (event) => {
      this.handleTransaction('txCancel');
    });

    window.addEventListener('listNftResponse', (event) => {
      if (event.detail.status === 'success') {
        // Handle non-error
        console.log('The operation was successful:', event.detail.result);
        
        this.cancelListing();
        this.handleTransaction('success');
      } else if (event.detail.status === 'failure') {
        // Handle non-error
        console.log('The operation failed:', event.detail.result);
        this.handleTransaction('failure');
      } else {
        // Handle error
        console.error('An error occurred:', event.detail.error);
        this.handleTransaction('error');
      }
    });
    console.log('registering market os transaction of', event);
    this.glomartKeyLoaderContainer = document.createElement('div');
    this.glomartKeyLoaderContainer.className = 'glomartKeyLoaderContainer';
    this.glomartKeyLoaderContainer.style.zIndex = '6';
    
    this.glomartKeyLoaderToolbar = document.createElement('div');
    this.glomartKeyLoaderToolbar.className = 'glomartKeyLoaderToolbar';
    this.glomartKeyLoaderContainer.appendChild(this.glomartKeyLoaderToolbar);
    
    this.glomartKeyLoaderButt = document.createElement('div');
    this.glomartKeyLoaderButt.className = 'glomartKeyLoaderButt';
    this.glomartKeyLoaderToolbar.appendChild(this.glomartKeyLoaderButt);
    
    this.glomartKeyLoaderBtnColor = document.createElement('button');
    this.glomartKeyLoaderBtnColor.className = 'glomartKeyLoaderBtn glomartKeyLoaderBtnColor';
    this.glomartKeyLoaderButt.appendChild(this.glomartKeyLoaderBtnColor);
    
    this.glomartKeyLoaderBtn = document.createElement('button');
    this.glomartKeyLoaderBtn.className = 'glomartKeyLoaderBtn';
    this.glomartKeyLoaderButt.appendChild(this.glomartKeyLoaderBtn);
    
    this.glomartKeyLoaderUser = document.createElement('p');
    this.glomartKeyLoaderUser.className = 'glomartKeyLoaderUser';
    this.glomartKeyLoaderUser.textContent = `${window.client.gloInfo.username}@admin: ~`;
    this.glomartKeyLoaderToolbar.appendChild(this.glomartKeyLoaderUser);
    
    this.glomartKeyLoaderBody = document.createElement('div');
    this.glomartKeyLoaderBody.className = 'glomartKeyLoaderBody';
    this.glomartKeyLoaderContainer.appendChild(this.glomartKeyLoaderBody);
    
    this.glomartKeyLoaderPrompt = document.createElement('div');
    this.glomartKeyLoaderPrompt.className = 'glomartKeyLoaderPrompt';
    this.glomartKeyLoaderBody.appendChild(this.glomartKeyLoaderPrompt);
    
    this.glomartKeyLoaderUser = document.createElement('span');
    this.glomartKeyLoaderUser.className = 'glomartKeyLoaderUser';
    this.glomartKeyLoaderUser.textContent = `${window.client.gloInfo.username}@admin:`;
    this.glomartKeyLoaderPrompt.appendChild(this.glomartKeyLoaderUser);
    
    this.glomartKeyLoaderLocation = document.createElement('span');
    this.glomartKeyLoaderLocation.className = 'glomartKeyLoaderLocation';
    this.glomartKeyLoaderLocation.textContent = '~';
    this.glomartKeyLoaderPrompt.appendChild(this.glomartKeyLoaderLocation);
    
    this.glomartKeyLoaderBling = document.createElement('span');
    this.glomartKeyLoaderBling.className = 'glomartKeyLoaderBling';
    this.glomartKeyLoaderBling.textContent = '$';
    this.glomartKeyLoaderPrompt.appendChild(this.glomartKeyLoaderBling);
    
    this.glomartKeyLoaderCursor = document.createElement('span');
    this.glomartKeyLoaderCursor.className = 'glomartKeyLoaderCursor';
    this.glomartKeyLoaderPrompt.appendChild(this.glomartKeyLoaderCursor);
    
    this.glomartKeyLoaderOutput = document.createElement('div');
    this.glomartKeyLoaderOutput.className = 'glomartKeyLoaderOutput';
    this.glomartKeyLoaderBody.appendChild(this.glomartKeyLoaderOutput);
    
    this.glomartKeyLoaderOutputText = document.createElement('pre');
    this.glomartKeyLoaderOutputText.className = 'glomartKeyLoaderOutputText';
    this.glomartKeyLoaderOutputText.id = 'console'; // Add this line
    this.glomartKeyLoaderOutput.appendChild(this.glomartKeyLoaderOutputText);
    
    var intervalID = window.setInterval(updateScreen.bind(this), 200); 
    var txt = [
      "FORCE: XX0022. ENCYPT://000.222.2345",
      "TRYPASS: ********* AUTH CODE: ALPHA GAMMA: 1___ PRIORITY 1",
      "RETRY: GLOSPHERE GLOZILLA",
      "Z:> /GLO/GAMES/GLOMART/ EXECUTE -PLAYERS 0",
      "================================================",
      "Priority 1 // local / scanning...",
      "scanning ports...",
      "BACKDOOR FOUND (23.45.23.12.00000000)",
      "BACKDOOR FOUND (13.66.23.12.00110000)",
      "BACKDOOR FOUND (13.66.23.12.00110044)",
      "...",
      "...",
      "BRUTE.EXE -r -z",
      "...locating vulnerabilities...",
      "...vulnerabilities found...",
      "MCP/> DEPLOY CLU",
      "SCAN: __ 0100.0000.0554.0080",
      "SCAN: __ 0020.0000.0553.0080",
      "SCAN: __ 0001.0000.0554.0550",
      "SCAN: __ 0012.0000.0553.0030",
      "SCAN: __ 0100.0000.0554.0080",
      "SCAN: __ 0020.0000.0553.0080",
    ];
    
    var docfrag = document.createDocumentFragment();
    
    function updateScreen() {
      //Shuffle the "txt" array
      txt.push(txt.shift());
      //Rebuild document fragment
      txt.forEach(function(e) {
        var p = document.createElement("p");
        p.textContent = e;
        docfrag.appendChild(p);
      });
      //Clear DOM body
      while (this.glomartKeyLoaderOutputText.firstChild) {
        this.glomartKeyLoaderOutputText.removeChild(this.glomartKeyLoaderOutputText.firstChild);
      }
      this.glomartKeyLoaderOutputText.appendChild(docfrag);
    }
    
    setTimeout(() => { 
      this.glomartKeyLoaderOutputText.style.background = "limegreen";
      this.glomartKeyLoaderOutputText.innerHTML = "ACCESS GRANTED";
      this.glomartKeyLoaderOutputText.style.boxShadow = "0 0 30px limegreen";
      this.glomartKeyLoaderOutput.style.display = "none";

      // The ASCII art split into an array of lines
      var asciiArtLines = [
        "                                   /$$   /$$     /$$                             /$$                         ",
        "                                  |__/  | $$    |__/                            | $$                         ",
        "  /$$$$$$  /$$  /$$  /$$  /$$$$$$  /$$ /$$$$$$   /$$ /$$$$$$$   /$$$$$$        /$$$$$$  /$$   /$$            ",
        " |____  $$| $$ | $$ | $$ |____  $$| $$|_  $$_/  | $$| $$__  $$ /$$__  $$      |_  $$_/ |  $$ /$$/            ",
        "  /$$$$$$$| $$ | $$ | $$  /$$$$$$$| $$  | $$    | $$| $$  \\ $$| $$  \\ $$        | $$    \\  $$$$/             ",
        " /$$__  $$| $$ | $$ | $$ /$$__  $$| $$  | $$ /$$| $$| $$  | $$| $$  | $$        | $$ /$$ >$$  $$             ",
        "|  $$$$$$$|  $$$$$/$$$$/|  $$$$$$$| $$  |  $$$$/| $$| $$  | $$|  $$$$$$$        |  $$$$//$$/\\  $$ /$$ /$$ /$$",
        " \\_______/ \\_____/\___/  \\_______/|__/   \\___/  |__/|__/  |__/ \\____  $$         \\___/ |__/  \\__/|__/|__/|__/",
        "                                                               /$$  \\ $$                                     ",
        "                                                              |  $$$$$$/                                     ",
        "                                                               \\______/                                      "
      ];

      var asciiContainer = document.createElement('pre');
      asciiContainer.id = 'asciiContainer';
      asciiContainer.style.fontSize = '0.45em';
      asciiContainer.style.fontFamily = 'monospace'; // Use a monospaced font
      asciiContainer.style.margin = '0'; // Remove default margin
      asciiContainer.style.padding = '0'; // Remove default padding
      asciiContainer.style.marginTop = '20%';
      asciiContainer.style.marginLeft = '10%';
      this.glomartKeyLoaderBody.appendChild(asciiContainer);
      var fullText = '';
      var lineIndex = 0;
      var charIndex = 0;

    // Function to show the next character
    function showNextChar() {
      if (lineIndex < asciiArtLines.length) {
        var chunk = asciiArtLines[lineIndex].substring(charIndex, charIndex + 5); // Get a chunk of 3 characters
        fullText += chunk;
        asciiContainer.innerText = fullText;
        charIndex += chunk.length;
        if (charIndex >= asciiArtLines[lineIndex].length) {
          fullText += '\n'; // Add a newline at the end of a line
          lineIndex++;
          charIndex = 0;
        }
      } else {
        // Clear the interval once the full ASCII art has been displayed
        clearInterval(intervalId);
        // Start the GSAP animation
        gsap.to(asciiContainer, {
          duration: 1,
          y: '+=10',
          repeat: -1,
          yoyo: true,
          ease: 'power1.inOut'
        });
      }
    }

    // Set the interval to add characters
    var intervalId = setInterval(showNextChar, 1);

    }, 2000);
    
    document.body.appendChild(this.glomartKeyLoaderContainer);

    this.glomartKeyLoaderOverlay = document.createElement('div');
    this.glomartKeyLoaderOverlay.id = 'glomartKeyLoaderOverlay';
    this.glomartKeyLoaderOverlay.style.position = 'absolute';
    this.glomartKeyLoaderOverlay.style.top = '0';
    this.glomartKeyLoaderOverlay.style.left = '0';
    this.glomartKeyLoaderOverlay.style.height = '100%';
    this.glomartKeyLoaderOverlay.style.width = '100%';
    this.glomartKeyLoaderOverlay.style.backgroundColor = 'black';
    this.glomartKeyLoaderOverlay.style.opacity = '.75';
    this.glomartKeyLoaderOverlay.style.zIndex = '5';
    // Add an event listener to the overlay
    this.glomartKeyLoaderOverlay.addEventListener('click', () => {
      // Remove the overlay
      document.body.removeChild(this.glomartKeyLoaderOverlay);
      document.body.removeChild(this.glomartKeyLoaderContainer);
    });

    document.body.appendChild(this.glomartKeyLoaderOverlay);
  }

  handleTransaction(result){
    console.log('calling handleTransaction with result:', result);
    document.getElementById('asciiContainer').remove();
    let asciiArtLines;
    switch(result){
      case 'success':
        asciiArtLines = [
          "   /$$                                                                                         ",
          "  | $$                                                                                         ",
          " /$$$$$$  /$$   /$$        /$$$$$$$ /$$   /$$  /$$$$$$$  /$$$$$$$  /$$$$$$   /$$$$$$$ /$$$$$$$",
          "|_  $$_/ |  $$ /$$/       /$$_____/| $$  | $$ /$$_____/ /$$_____/ /$$__  $$ /$$_____//$$_____/",
          "  | $$    \\  $$$$/       |  $$$$$$ | $$  | $$| $$      | $$      | $$$$$$$$|  $$$$$$|  $$$$$$ ",
          "  | $$ /$$ >$$  $$        \\____  $$| $$  | $$| $$      | $$      | $$_____/ \\____  $$\\____  $$",
          "  |  $$$$//$$/\\  $$       /$$$$$$$/|  $$$$$$/|  $$$$$$$|  $$$$$$$|  $$$$$$$ /$$$$$$$//$$$$$$$/",
          "   \\___/ |__/  \\__/      |_______/  \\______/  \\_______/ \\_______/ \\_______/|_______/|_______/ ",
          "                                                                                               ",
          "                                                                                               ",
          "                                                                                               "
        ];
        break;
      case 'failure':
        asciiArtLines = [
          "  /$$                     /$$$$$$          /$$ /$$                              ",
          "  | $$                    /$$__  $$        |__/| $$                              ",
          " /$$$$$$  /$$   /$$      | $$  \\__//$$$$$$  /$$| $$ /$$   /$$  /$$$$$$   /$$$$$$ ",
          " |_  $$_/ |  $$ /$$/      | $$$$   |____  $$| $$| $$| $$  | $$ /$$__  $$ /$$__  $$",
          "  | $$    \\  $$$$/       | $$_/    /$$$$$$$| $$| $$| $$  | $$| $$  \\__/| $$$$$$$$",
          "  | $$ /$$ >$$  $$       | $$     /$$__  $$| $$| $$| $$  | $$| $$      | $$_____/",
          "  |  $$$$//$$/\\  $$      | $$    |  $$$$$$$| $$| $$|  $$$$$$/| $$      |  $$$$$$$",
          "   \\___/ |__/  \\__/      |__/     \\_______/|__/|__/ \\______/ |__/       \\_______/"
        ];
        break;
      case 'error':
        asciiArtLines = [
          "  /$$                                                                     ",
          "  | $$                                                                     ",
          " /$$$$$$  /$$   /$$        /$$$$$$   /$$$$$$   /$$$$$$   /$$$$$$   /$$$$$$ ",
          " |_  $$_/ |  $$ /$$/       /$$__  $$ /$$__  $$ /$$__  $$ /$$__  $$ /$$__  $$",
          "  | $$    \\  $$$$/       | $$$$$$$$| $$  \\__/| $$  \\__/| $$  \\ $$| $$  \\__/",
          "  | $$ /$$ >$$  $$       | $$_____/| $$      | $$      | $$  | $$| $$      ",
          "  |  $$$$//$$/\\  $$      |  $$$$$$$| $$      | $$      |  $$$$$$/| $$      ",
          "   \\___/ |__/  \\__/       \\_______/|__/      |__/       \\______/ |__/      "
        ];
        break;
      case 'txCancel':
        asciiArtLines = [
          "   /$$                                                                      /$$ /$$                 /$$",
          "  | $$                                                                     | $$| $$                | $$",
          " /$$$$$$  /$$   /$$        /$$$$$$$  /$$$$$$  /$$$$$$$   /$$$$$$$  /$$$$$$ | $$| $$  /$$$$$$   /$$$$$$$",
          "|_  $$_/ |  $$ /$$/       /$$_____/ |____  $$| $$__  $$ /$$_____/ /$$__  $$| $$| $$ /$$__  $$ /$$__  $$",
          "  | $$    \\  $$$$/       | $$        /$$$$$$$| $$  \\ $$| $$      | $$$$$$$$| $$| $$| $$$$$$$$| $$  | $$",
          "  | $$ /$$ >$$  $$       | $$       /$$__  $$| $$  | $$| $$      | $$_____/| $$| $$| $$_____/| $$  | $$",
          "  |  $$$$//$$/\\  $$      |  $$$$$$$|  $$$$$$$| $$  | $$|  $$$$$$$|  $$$$$$$| $$| $$|  $$$$$$$|  $$$$$$$",
          "   \\___/ |__/  \\__/       \\_______/ \\_______/|__/  |__/ \\_______/ \\_______/|__/|__/ \\_______/ \\_______/",
          "                                                                                                       ",
          "                                                                                                       ",
          "                                                                                                       "
        ];
        break;
      default:
        break;
    }

    var asciiContainer = document.createElement('pre');
    asciiContainer.id = 'asciiContainer';
    asciiContainer.style.fontSize = '0.45em';
    asciiContainer.style.fontFamily = 'monospace'; // Use a monospaced font
    asciiContainer.style.margin = '0'; // Remove default margin
    asciiContainer.style.padding = '0'; // Remove default padding
    asciiContainer.style.marginTop = '20%';
    asciiContainer.style.marginLeft = '12.5%';
    this.glomartKeyLoaderBody.appendChild(asciiContainer);
    var fullText = '';
    var lineIndex = 0;
    var charIndex = 0;

    // Function to show the next character
    function showNextChar() {
      if (lineIndex < asciiArtLines.length) {
        var chunk = asciiArtLines[lineIndex].substring(charIndex, charIndex + 5); // Get a chunk of 3 characters
        fullText += chunk;
        asciiContainer.innerText = fullText;
        charIndex += chunk.length;
        if (charIndex >= asciiArtLines[lineIndex].length) {
          fullText += '\n'; // Add a newline at the end of a line
          lineIndex++;
          charIndex = 0;
        }
      } else {
        // Clear the interval once the full ASCII art has been displayed
        clearInterval(intervalId);
      }
    }

    // Set the interval to add characters
    var intervalId = setInterval(showNextChar, 1);
  }

  updateNfts() {
    // Check if selectContainer exists and clear its contents
    if (this.selectContainer) {
      while (this.selectContainer.firstChild) {
        this.selectContainer.removeChild(this.selectContainer.firstChild);
      }
      
      // Assuming window.client.clientNfts holds the updated list of NFTs
      window.client.clientNfts.forEach((nftData) => {
        // Create elements for each NFT similar to how it's done in the class constructor
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.alignItems = 'center';

        const square = document.createElement('div');
        square.style.width = '150px'; 
        square.style.height = '150px';
        square.style.cursor = 'pointer';
        square.style.backgroundImage = `url(/style/graphics/token_images/${nftData.metadata.previewImg}.webp)`;
        square.style.backgroundSize = 'cover'; 
        square.style.backgroundPosition = 'center'; 
        square.style.color = 'white';

        const label = document.createElement('span');
        label.style.fontSize = '0.75em';
        label.style.position = 'relative';
        label.style.bottom = '0%';
        label.style.color = '#34ff19';
        label.textContent = nftData.metadata.name;

        container.appendChild(square);
        container.appendChild(label);

        // Add your event listeners to the square if needed, similar to the constructor

        this.selectContainer.appendChild(container);
      });
    } else {
      console.error("selectContainer not found. Ensure you're calling updateNfts after the container is created.");
    }
  }
}


