class NftMachine {
  constructor() {
      this.init();
      this.handleState();
      console.log('NftMachine constructor called');
  }

  init() {
      this.contentContainer = document.getElementById('content-container');
      this.retroCover = document.getElementById('retro-cover');
      this.videoElement = document.getElementById('background-video2');
      window.addEventListener('WindowStateChanged', this.handleState.bind(this));
      window.addEventListener('resize', () => this.setPositionAndSize());
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
            this.setPositionAndSize();
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
          window.videoBackground.transitionTo('home', () => {});
          return; // If it exists, exit the function
      }

      // Set home background
      window.videoBackground.transitionTo('home', () => {});

      // Create the rectangle
      this.rectangle = document.createElement('div');
      this.rectangle.id = 'nftElement';

      // Apply styles to the rectangle
      this.rectangle.style.position = 'absolute';
      this.rectangle.style.bottom = '0';  // Place it on the bottom edge
      this.rectangle.style.left = '70%';  // Start from the left, 10% from the edge
      this.rectangle.style.width = '20vw';  // Width of the rectangle, adjust as needed
      this.rectangle.style.height = '50vh';  // Height of the rectangle, adjust as needed
      this.rectangle.style.backgroundColor = '#333';  // Color of the rectangle, adjust as needed

      // Add event listener for click event
      this.rectangle.addEventListener('click', this.switchState.bind(this));

      // Append the rectangle to the body
      document.body.appendChild(this.rectangle);
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

      // Dispatch a custom event to notify that windowState has changed
      const event = new Event('WindowStateChanged');
      window.dispatchEvent(event);
      console.log('Window state:', window.windowState);
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
      window.videoBackground.transitionTo('main_nft', () => {});
      this.createMarketplaceCage();
      this.createMintCage();
      this.appendTo();
  }

  setMintMachine() {
    this.createMarketplaceCage();
    this.createMintCage();
    this.appendTo();
    this.handleMintRoute();
    this.initGlo();
  }

  setMarketplaceMachine() {
    console.log('setting marketplace machien')
    this.createMarketplaceCage();
    this.createMintCage();
    this.appendTo();
    this.handleMarketplaceRoute();
    this.initGlo();
  }

  hideNftMachine() {
      if (this.marketplace) this.marketplace.style.display = 'none';
      if (this.mint) this.mint.style.display = 'none';
      // Hide any other NftMachine-specific elements if needed
  }

  createMarketplaceCage() {
    if (!this.marketplace) {
      this.marketplace = document.createElement('div');
      this.marketplace.id = 'gloMartCage';
      this.configureElement(this.marketplace);
      return
    }
    this.marketplace.style.display = 'flex';
  }

  createMintCage() {
      if (!this.mint) {
      this.mint = document.createElement('div');
      this.mint.id = 'gloMintCage';
      this.configureElement(this.mint);
      return
    }
  this.mint.style.display = 'flex';
 }


  configureElement(element) {
      // Apply initial styles to the div
      element.style.backgroundColor = 'transparent';
      element.style.position = 'absolute';
      element.style.zIndex = '1';
      element.style.border = '3px solid transparent';
      element.style.transition = 'border 0.3s ease, box-shadow 0.3s ease';

      element.addEventListener('mouseenter', () => {
          element.style.boxShadow = '0 0 15px 5px rgba(255, 255, 255, 0.8)';
          element.style.border = '3px solid white';
      });

      element.addEventListener('mouseleave', () => {
          element.style.boxShadow = 'none';
          element.style.border = '3px solid transparent';
      });

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
    if (!this.gloMartInstance) this.gloMartInstance = new GloMart();
    this.hideCages();
    window.windowState = 'marketplace';

    // Dispatch a custom event to notify that windowState has changed
    const event = new Event('WindowStateChanged');
    window.dispatchEvent(event);
  }

  handleMarketplaceRoute() {
    console.log("marketplace clicked!");
    if (!this.gloMartInstance) this.gloMartInstance = new GloMart();
    this.hideCages();
  }

  handleMintClick() {
    console.log("mint clicked!");
    if (!this.gloMintInstance) this.gloMintInstance = new GloMint();
    this.hideCages();
    window.windowState = 'mint';

    // Dispatch a custom event to notify that windowState has changed
    const event = new Event('WindowStateChanged');
    window.dispatchEvent(event);
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

  appendTo() {
    // Appending to the body
    console.log("appending glomart rectangle");
    document.body.appendChild(this.marketplace);
    console.log("appending glomart mint");
    document.body.appendChild(this.mint);
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
          break;

      default:
        this.hideMintPageElements();
        this.hideMintPageBackground();
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
      this.gloMintBackground.style.backgroundColor = 'grey';
      document.body.appendChild(this.gloMintBackground);
    }
}

hideMintPageBackground() {
  if (this.gloMintBackground) this.gloMintBackground.style.display = 'none';
}
  
createMintPageElements() {
      // Create the parent div
      if (this.mintContainer) {
        this.mintContainer.style.display = 'flex';
        return
      }
      this.mintContainer = document.createElement('div');
      this.mintContainer.id = 'mintContainer';
      this.mintContainer.style.height = '80vh';
      this.mintContainer.style.width = '90vw'
      this.mintContainer.style.position = 'absolute';
      this.mintContainer.style.top = '15%';
      this.mintContainer.style.left = '50%';
      this.mintContainer.style.transform = 'translate(-50%, 0%)';
      this.mintContainer.style.zIndex = '1';
  
      // Create the top div
      this.mintWindow = document.createElement('div');
      this.mintWindow.id = 'sell-window';
      this.mintWindow.style.width = '100%';
      this.mintWindow.style.height = '75%';
      this.mintWindow.style.display = 'flex'; // to align items side by side
      this.mintWindow.style.alignItems = 'center'; // to center align vertically
      this.mintWindow.style.justifyContent = 'space-between'; // space out the items
  
      // Left side container for Price label and dropdown
      this.caseContainer = document.createElement('div');
      this.caseContainer.style.display = 'flex';
      this.caseContainer.style.flexDirection = 'column'; // stack label and dropdown vertically
      this.caseContainer.style.alignItems = 'center'; 
      this.caseContainer.style.flex = '1';
  
      this.caseLabel = document.createElement('label');
      this.caseLabel.textContent = 'Case';
      this.caseLabel.style.color = 'white';
      this.caseLabel.style.fontSize = '2.75rem';
      this.caseLabel.style.position = 'absolute';
      this.caseLabel.style.top = '10%';
      this.caseLabel.style.fontFamily  = "Gabarito, sans-serif";
      this.caseContainer.appendChild(this.caseLabel);
  
      this.caseDropdown = document.createElement('select');
      this.caseDropdown.style.flex = '1';
  
      // Example options for the dropdown (you can add more)
      this.case1 = document.createElement('option');
      this.case1.textContent = 'Option 1';
      this.caseDropdown.appendChild(this.case1);
  
      this.case2 = document.createElement('option');
      this.case2.textContent = 'Option 2';
      this.caseDropdown.appendChild(this.case2);
  
      
      this.caseContainer.appendChild(this.caseDropdown);
      this.mintWindow.appendChild(this.caseContainer);
  
      // Create the middle big plus sign
      this.mintCard = document.createElement('div');
      this.mintCard.textContent = '?';
      this.mintCard.style.fontFamily  = "Gabarito, sans-serif";
      this.mintCard.style.fontSize = '9em';
      this.mintCard.style.color = 'grey';
      this.mintCard.style.textAlign = 'center';
  
      // Set the width and height to create a square
      this.mintCard.style.width = '2em'; 
      this.mintCard.style.height = '2em';
  
      // Make it a square with white border and rounded edges
      this.mintCard.style.border = '2px solid white';
      this.mintCard.style.backgroundColor = 'white';
      this.mintCard.style.borderRadius = '15%'; // Adjust as needed for desired roundness
      this.mintCard.style.display = 'flex';
      this.mintCard.style.justifyContent = 'center';  // Center the plus sign horizontally
      this.mintCard.style.alignItems = 'center';      // Center the plus sign vertically
  
      this.mintWindow.appendChild(this.mintCard);
  
      // Right side container for Expiration label and dropdown
      this.keyContainer = document.createElement('div');
      this.keyContainer.style.display = 'flex';
      this.keyContainer.style.flexDirection = 'column'; // stack label and dropdown vertically
      this.keyContainer.style.alignItems = 'center'; 
      this.keyContainer.style.flex = '1';
      
      this.keyLabel = document.createElement('label');
      this.keyLabel.textContent = 'Key';
      this.keyLabel.style.color = 'white';
      this.keyLabel.style.fontSize = '2.75rem';
      this.keyLabel.style.position = 'absolute';
      this.keyLabel.style.top = '10%';
      this.keyLabel.style.fontFamily  = "Gabarito, sans-serif";
      this.keyContainer.appendChild(this.keyLabel);
      
      this.keyDropdown = document.createElement('select');
      this.keyDropdown.style.flex = '1';
  
      this.key1 = document.createElement('option');
      this.key1.textContent = 'Option A';
      this.keyDropdown.appendChild(this.key1);
  
      this.key2 = document.createElement('option');
      this.key2.textContent = 'Option B';
      this.keyDropdown.appendChild(this.key2);
  
      this.keyContainer.appendChild(this.keyDropdown);
      this.mintWindow.appendChild(this.keyContainer);
      this.mintContainer.appendChild(this.mintWindow);
  
  
      // Create the bottom button
      this.mintButton = document.createElement('button'); // Changed from 'div' to 'button'
      this.mintButton.id = 'mint-button';
      this.mintButton.textContent = 'Mint'; // Set button label
      this.mintButton.style.width = '10vw';
      this.mintButton.style.height = '10vh';
      this.mintButton.style.position = 'absolute';
      this.mintButton.style.fontFamily  = "Gabarito, sans-serif";
      this.mintButton.style.backgroundColor = 'transparent';
      this.mintButton.style.border = '2px solid white'
      this.mintButton.style.left = '50%';
      this.mintButton.style.top = '55vh';
      this.mintButton.style.transform = 'translate(-50%, 0%)';
      this.mintButton.style.cursor = 'pointer'; // Change the mouse cursor when over the button
      this.mintButton.style.color = 'white'; // Set text color
      this.mintButton.style.fontSize = '1.5em'; // Set font size
      this.mintButton.style.display = 'flex';
      this.mintButton.style.justifyContent = 'center'; // Center the label horizontally
      this.mintButton.style.alignItems = 'center'; // Center the label vertically
  
      // Add the click event listener
      this.mintButton.addEventListener('click', function() {
          // This is your empty function
      });
  
      this.mintContainer.appendChild(this.mintButton);
  
  
      // Append the parent div to the body or another container
      document.body.appendChild(this.mintContainer); 
  }

  hideMintPageElements() {
    if (this.mintContainer) this.mintContainer.style.display = 'none';
  }
}

// Add Glomart class
class GloMart {
  constructor() {
    this.activePage = 'GloMart';
    this.navItems = []; // ['search', 'browse', 'listing', 'sell'];
    this.selectedIndex = 0; // Index of the selected nav item
    if (window.windowState == 'marketplace') this.handleState();
    window.addEventListener('WindowStateChanged', this.handleState.bind(this));
  }

  handleState() {
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
    window.videoBackground.transitionTo('main_nft', () => {});
  }
  
  createMarketplacePageElements() {
    this.createGloMartBackground();
    this.createNavBarElement();
    this.setupMarketAnimation();
    this.setupCartAnimation();

    // Start the animation sequence
    this.animateNavBarSequence();
  }

  hideMarketplacePageElements() {
    this.hideGloMartBackground();
    this.hideNavBarElement();
  }

  hideGloMartBackground() {
    if(this.gloMartBackground) this.gloMartBackground.style.display = 'none';
  }

  hideNavBarElement() {
    if(this.navBarContainer) this.navBarContainer.style.display = 'none';
  }

  createGloMartBackground() {
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
      this.gloMartBackground.style.backgroundColor = 'grey';
      document.body.appendChild(this.gloMartBackground);
    }
}


  handleGloMartClick() {
    switch (this.activePage) {
      case 'GloMart':
        this.gloTagElement.style.display = 'none';
        this.navBarContainer.style.display = 'none';
        this.gloMartElement.style.display = 'none';
        const nftMachineInstance = NftMachine.getInstance();
        break;
      case 'Browse':
        this.navBarContainer.style.display = 'flex'
        const browseContainer = document.getElementById('browseContainer');
        browseContainer.remove();
        this.activePage = 'GloMart';
        break;
      case 'Listing':
        this.navBarContainer.style.display = 'flex'
        const listingContainer = document.getElementById('listingContainer');
        listingContainer.remove();
        this.activePage = 'GloMart';
        break;
      case 'Sell':
        this.navBarContainer.style.display = 'flex'
        const sellContainer = document.getElementById('sellContainer');
        sellContainer.remove();
        this.activePage = 'GloMart';
        break;
      default:
        console.error('Unknown active page');
        break;
    }
  }

  handleNavItemClick(navItem) {
    switch (navItem) {
        case 'search':
            document.getElementById('searchInput').focus();
            break;
        case 'browse':
            this.navBarContainer.style.display = 'none';
            new Browse();
            break;
        case 'market':
          this.navBarContainer.style.display = 'none';
          new Listing();
          break;
        case 'sell':
            this.navBarContainer.style.display = 'none';
            new Sell();
            break;
        default:
            console.error(`Unknown nav item clicked: ${navItem}`);
    }
}

  handleGloTagClick() {
    console.log('GloTag clicked');
    const browseContainer = document.getElementById('browseContainer');
    if (browseContainer) {
      browseContainer.remove();
    }

    const listingContainer = document.getElementById('listingContainer');
    if (listingContainer) {
      listingContainer.remove();
    }

    const sellContainer = document.getElementById('sellContainer');
    if (sellContainer) {
      sellContainer.remove();
    }
    //instantiate profile page
    new Profile();

    // hide glotag
    this.gloTagElement.style.display = 'none';
  }

  createNavBarElement() {
    // Create main nav bar container
    if (this.navBarContainer) {
      this.navBarContainer.style.display = 'flex';
      return
    }
    this.navBarContainer = document.createElement('div');
    this.navBarContainer.style.position = "absolute";
    this.navBarContainer.style.top = '55%';
    this.navBarContainer.style.left = "50%";
    this.navBarContainer.style.transform = "translate(-50%, -50%)";
    this.navBarContainer.style.display = "flex";
    this.navBarContainer.style.flexDirection = "column";
    this.navBarContainer.style.alignItems = "center";
    this.navBarContainer.style.gap = "10px";
    this.navBarContainer.style.opacity = '100%'; // Set initial opacity to 0 for the fade-in effect

    // Create nav items and append them to the navBarContainer
    const navItemsText = ['search', 'market', 'sell']; // ['search', 'browse', 'listing', 'sell'];


    for (let i = 0; i < navItemsText.length; i++) {
      let navItemWrapper = document.createElement('div');
      navItemWrapper.style.position = 'relative'; // Set position to relative
      navItemWrapper.style.display = 'flex';
      navItemWrapper.style.flexDirection = 'column';
      navItemWrapper.style.alignItems = 'center';
      navItemWrapper.style.marginBottom = '10%';

      let navItem = document.createElement('div');
      navItem.innerText = navItemsText[i];
      navItem.style.color = "white";
      navItem.style.cursor = 'pointer';
      navItem.style.fontWeight = 'bold';
      navItem.style.fontSize = '5rem';
      navItem.style.fontFamily = "Gabarito, sans-serif";
      navItem.style.transform = 'scale(0)'; // Use transform for initial scale;
      navItem.addEventListener('click', this.handleNavItemClick.bind(this, navItemsText[i]));

      // Create and style content container for each nav item
      let contentContainer = document.createElement('div');
      contentContainer.id = `content-${navItemsText[i]}`;
      contentContainer.style.display = 'flex'; // Make sure it's flex to grow in width
      contentContainer.style.top = '100%'; // Position below navItem
      contentContainer.style.width = '100%'; // Adjust as needed
      contentContainer.style.overflow = 'hidden'; // Prevent content from showing when width is 0
      contentContainer.style.borderRadius = '1rem';
      contentContainer.style.fontSize = '3rem';
      contentContainer.style.textAlign = 'center';
      contentContainer.style.display = 'flex'; // Set to none initially
      contentContainer.style.opacity = '0';


      // Check if the nav item is 'search'
      switch (navItemsText[i]) {
        case 'search':
          // Create a container for the search bar and icon
          let searchContainer = document.createElement('div');
          searchContainer.style.display = 'flex';
          searchContainer.style.alignItems = 'center';
          searchContainer.style.marginTop = '20px';
          searchContainer.style.borderBottom = '2px solid #ccc'; // Thin line for the search bar
          searchContainer.style.padding = '5px';
          searchContainer.style.cursor = 'pointer';
        
          // Create a magnifying glass icon
          let searchIcon = document.createElement('img');
          searchIcon.src = './style/graphics/searchicon.png'; // Path to your icon image
          searchIcon.style.width = '5vh'; // Adjust size as needed
          searchIcon.style.marginRight = '10px'; // Space between the icon and the input field
        
          // Create a search input field
          let searchInput = document.createElement('input');
          searchInput.id = 'searchInput';
          searchInput.type = 'text';
          searchInput.style.flexGrow = '1'; // Allows input to take up available space
          searchInput.style.border = 'none'; // No border
          searchInput.style.outline = 'none'; // No outline
          searchInput.style.backgroundColor = 'transparent'; // Transparent background
          searchInput.style.fontSize = '2rem';
          searchInput.style.cursor = 'pointer';
        
          // Append the icon and input field to the search container
          searchContainer.appendChild(searchIcon);
          searchContainer.appendChild(searchInput);
        
          // Append the search container to the content container
          contentContainer.appendChild(searchContainer);
          break;
    
        case 'market':
          // Create a container for the squares
          let squaresContainer = document.createElement('div');
          squaresContainer.id = 'squaresContainer'; // Assign an ID for targeting with JS
          squaresContainer.style.display = 'flex';
          squaresContainer.style.justifyContent = 'space-around';
          squaresContainer.style.alignItems = 'center';
          squaresContainer.style.overflow = 'hidden'; // Hide the overflowing squares
          squaresContainer.style.width = '600px'; // Set a fixed width to show only 5 squares
          squaresContainer.style.cursor = 'pointer';
        
          // Create and append ten grey squares
          for (let j = 0; j < 15; j++) { // Create 15 squares instead of 10
            let square = document.createElement('div');
            square.style.width = '100px';
            square.style.height = '100px';
            square.style.backgroundColor = 'white';
            square.style.borderRadius = '5px';
            square.style.margin = '0 10px';
            square.style.flexShrink = '0';
            square.style.flexBasis = '100px';
          
            squaresContainer.appendChild(square);
          }

          squaresContainer.addEventListener('click', () => {
            this.handleSquaresContainerClick();
          });

          // Append the squares container to the content container
          contentContainer.appendChild(squaresContainer);
          break;                       
        case 'sell':
          let sellCart = document.createElement('div');
          sellCart.id = 'sellCart';
          sellCart.style.backgroundImage = 'url(./style/graphics/cart.png)';
          sellCart.style.backgroundSize = '100%';
          sellCart.style.height = '15vh';
          sellCart.style.width = '15vh';
          sellCart.style.cursor = 'pointer';

          sellCart.addEventListener('click', () => {
            this.handleSellCartClick();
          });

          contentContainer.appendChild(sellCart);
        break;
    
        default:
          // Optional: Default content if the nav item is not recognized
          break;
      }
    
      navItemWrapper.appendChild(navItem);
      navItemWrapper.appendChild(contentContainer);
      this.navBarContainer.appendChild(navItemWrapper);
      this.navItems.push(navItem);
    }
    
    document.body.appendChild(this.navBarContainer);
  }

  handleSquaresContainerClick() {
    this.navBarContainer.style.display = 'none';
    new Listing(); // Assuming this is the desired action for the 'market' case
  }

  handleSellCartClick() {
    this.navBarContainer.style.display = 'none';
    new Sell();
  }

  // New method to handle the animation sequence
  animateNavBarSequence() {
    const tl = gsap.timeline();

    // Scale in nav items with a bounce effect
    this.navItems.forEach(navItem => {
      // Animate the scale to 1 with a bounce effect
      tl.to(navItem, {
        scale: 1,
        duration: 0.5,
        ease: "bounce.out" // This creates the bounce effect
      });
    });

   // Select all contentContainers
   const contentContainers = this.navBarContainer.querySelectorAll('div[id^="content-"]');

   // Fade in all contentContainers at once
   tl.to(contentContainers, {
     opacity: 1, // Fade in from 0 to 1
     duration: 0.5, // Duration of the fade in
     ease: "power2.inOut", // Easing function for a smooth transition
   });
 }

  setupMarketAnimation() {
    const squaresContainer = document.getElementById('squaresContainer');

    // GSAP timeline for the market animation
    const marketTl = gsap.timeline({ paused: true, repeat: -1 });

    marketTl.to(squaresContainer.children, {
      x: () => `-=${(squaresContainer.children[0].offsetWidth + 20) * 5}`, // Move by 5 squares
      ease: "none",
      duration: 10
    });    

    // Hover interaction
    squaresContainer.addEventListener('mouseenter', () => marketTl.pause());
    squaresContainer.addEventListener('mouseleave', () => marketTl.play());

    // Start the animation
    marketTl.play();
  }

  setupCartAnimation() {
    gsap.to('#sellCart', {
      rotationY: 360, // Rotates the element 360 degrees along the Y-axis
      transformOrigin: '50% 50%', // Sets the origin of transformation
      repeat: -1, // Infinite loop
      ease: 'linear', // Ensures a smooth, constant rotation
      duration: 5 // Duration of one complete spin
    });
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
      this.browseContainer.style.display = 'flex';
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

class Listing {
  constructor() {
    window.nftMachine.gloMartInstance.activePage = 'Listing';
    window.glogo.updateURL();
    this.createListingContainer();
  }

  createListingContainer() {
    // Main listing container
    this.listingContainer = document.createElement('div');
    this.listingContainer.id = 'listingContainer';
    this.listingContainer.style.width = '93vw';
    this.listingContainer.style.height = '84vh';
    this.listingContainer.style.position = 'absolute';
    this.listingContainer.style.top = '13%'; // Leave space at the top
    this.listingContainer.style.left = '50%';
    this.listingContainer.style.transform = 'translate(-50%, 0%)';
    this.listingContainer.style.backgroundColor = 'transparent';
    this.listingContainer.style.color = 'white';
    document.body.appendChild(this.listingContainer);

    // Table of contents to the left
    this.listingSort = document.createElement('div');
    this.listingSort.id = 'listingSort';
    this.listingSort.style.width = '20%';
    this.listingSort.style.height = '100%';
    this.listingSort.style.float = 'left';
    this.listingSort.style.backgroundColor = 'transparent';
    this.listingContainer.appendChild(this.listingSort);

    // Add title "Sort by:" at the top
    this.sortByTitle = document.createElement('h3');
    this.sortByTitle.innerText = 'Sort by:';
    this.sortByTitle.style.textAlign = 'center';
    this.sortByTitle.style.fontFamily = "Gabarito, sans-serif";
    this.sortByTitle.style.fontSize = '2.5rem';
    this.sortByTitle.style.margin = '0';
    this.listingSort.appendChild(this.sortByTitle);

    this.sections = ['Genre', 'Type', 'Price', 'Date Listed', 'Popularity', 'Status', 'Bidding'];
    this.sections.forEach(section => {
      this.sectionElement = document.createElement('div');
      this.sectionElement.id = 'sectionElement';
      this.sectionElement.style.fontSize = '1.25rem';
      this.sectionElement.style.fontFamily = "Gabarito, sans-serif";
      this.sectionElement.style.marginTop = '10px'; // Add space between elements
      this.checkbox = document.createElement('input');
      this.checkbox.id = 'checkbox';
      this.checkbox.type = 'checkbox';
      this.sectionElement.appendChild(this.checkbox);
      this.labelText = document.createTextNode(section);
      this.sectionElement.appendChild(this.labelText);
      this.listingSort.appendChild(this.sectionElement);
    });

    // Content to the right
    this.content = document.createElement('div');
    this.content.id = 'rightContent';
    this.content.style.width = '80%';
    this.content.style.height = '100%';
    this.content.style.float = 'right';
    this.content.style.backgroundColor = 'transparent';
    this.listingContainer.appendChild(this.content);

    this.squares = 5; // Number of squares you want
    for (let i = 0; i < this.squares; i++) {
      this.square = document.createElement('div');
      this.square.style.width = '7.5vw'; // Size of square
      this.square.style.height = '7.5vw';
      this.square.style.margin = '10px';
      this.square.style.backgroundColor = 'white';
      this.square.style.float = 'left';
      this.content.appendChild(this.square);
    }
  }
}

class Sell {
  constructor() {
    window.nftMachine.gloMartInstance.activePage = 'Sell';
    window.glogo.updateURL();
    this.createSellPageElements();
  }

  createSellPageElements() {
    // Create the parent div
    this.sellContainer = document.createElement('div');
    this.sellContainer.id = 'sellContainer';
    this.sellContainer.style.height = '80vh';
    this.sellContainer.style.width = '90vw'
    this.sellContainer.style.position = 'absolute';
    this.sellContainer.style.top = '15%';
    this.sellContainer.style.left = '50%';
    this.sellContainer.style.transform = 'translate(-50%, 0%)';

    // Create the top div
    this.sellWindow = document.createElement('div');
    this.sellWindow.id = 'sell-window';
    this.sellWindow.style.width = '100%';
    this.sellWindow.style.height = '75%';
    this.sellWindow.style.display = 'flex'; // to align items side by side
    this.sellWindow.style.alignItems = 'center'; // to center align vertically
    this.sellWindow.style.justifyContent = 'space-between'; // space out the items

    // Left side container for Price label and dropdown
    this.leftContainer = document.createElement('div');
    this.leftContainer.style.display = 'flex';
    this.leftContainer.style.flexDirection = 'column'; // stack label and dropdown vertically
    this.leftContainer.style.alignItems = 'center'; 
    this.leftContainer.style.flex = '1';

    this.leftLabel = document.createElement('label');
    this.leftLabel.textContent = 'Price';
    this.leftLabel.style.color = 'white';
    this.leftLabel.style.fontSize = '2.75rem';
    this.leftLabel.style.position = 'absolute';
    this.leftLabel.style.top = '10%';
    this.leftLabel.style.fontFamily  = "Gabarito, sans-serif";
    this.leftContainer.appendChild(this.leftLabel);

    this.leftDropdown = document.createElement('select');
    this.leftDropdown.style.flex = '1';

    // Example options for the dropdown (you can add more)
    this.option1 = document.createElement('option');
    this.option1.textContent = 'Option 1';
    this.leftDropdown.appendChild(this.option1);

    this.option2 = document.createElement('option');
    this.option2.textContent = 'Option 2';
    this.leftDropdown.appendChild(this.option2);

    
    this.leftContainer.appendChild(this.leftDropdown);
    this.sellWindow.appendChild(this.leftContainer);

    // Create the middle big plus sign
    this.plusSign = document.createElement('div');
    this.plusSign.textContent = '+';
    this.plusSign.style.fontFamily  = "Gabarito, sans-serif";
    this.plusSign.style.fontSize = '9em';
    this.plusSign.style.color = 'grey';
    this.plusSign.style.textAlign = 'center';

    // Set the width and height to create a square
    this.plusSign.style.width = '2em'; 
    this.plusSign.style.height = '2em';

    // Make it a square with white border and rounded edges
    this.plusSign.style.border = '2px solid white';
    this.plusSign.style.backgroundColor = 'white';
    this.plusSign.style.borderRadius = '15%'; // Adjust as needed for desired roundness
    this.plusSign.style.display = 'flex';
    this.plusSign.style.justifyContent = 'center';  // Center the plus sign horizontally
    this.plusSign.style.alignItems = 'center';      // Center the plus sign vertically

    this.plusSign.addEventListener('click', this.createSelectListing.bind(this));

    this.sellWindow.appendChild(this.plusSign);

    // Right side container for Expiration label and dropdown
    this.rightContainer = document.createElement('div');
    this.rightContainer.style.display = 'flex';
    this.rightContainer.style.flexDirection = 'column'; // stack label and dropdown vertically
    this.rightContainer.style.alignItems = 'center'; 
    this.rightContainer.style.flex = '1';
    
    this.rightLabel = document.createElement('label');
    this.rightLabel.textContent = 'Expiration';
    this.rightLabel.style.color = 'white';
    this.rightLabel.style.fontSize = '2.75rem';
    this.rightLabel.style.position = 'absolute';
    this.rightLabel.style.top = '10%';
    this.rightLabel.style.fontFamily  = "Gabarito, sans-serif";
    this.rightContainer.appendChild(this.rightLabel);
    
    this.rightDropdown = document.createElement('select');
    this.rightDropdown.style.flex = '1';

    this.option3 = document.createElement('option');
    this.option3.textContent = 'Option A';
    this.rightDropdown.appendChild(this.option3);

    this.option4 = document.createElement('option');
    this.option4.textContent = 'Option B';
    this.rightDropdown.appendChild(this.option4);

    this.rightContainer.appendChild(this.rightDropdown);
    this.sellWindow.appendChild(this.rightContainer);

    this.sellContainer.appendChild(this.sellWindow); 

    // Create the bottom button
    this.sellButton = document.createElement('button'); // Changed from 'div' to 'button'
    this.sellButton.id = 'sell-button';
    this.sellButton.textContent = 'List'; // Set button label
    this.sellButton.style.width = '10vw';
    this.sellButton.style.height = '10vh';
    this.sellButton.style.position = 'absolute';
    this.sellButton.style.fontFamily  = "Gabarito, sans-serif";
    this.sellButton.style.backgroundColor = 'transparent';
    this.sellButton.style.border = '2px solid white'
    this.sellButton.style.left = '50%';
    this.sellButton.style.transform = 'translate(-50%, 0%)';
    this.sellButton.style.cursor = 'pointer'; // Change the mouse cursor when over the button
    this.sellButton.style.color = 'white'; // Set text color
    this.sellButton.style.fontSize = '1.5em'; // Set font size
    this.sellButton.style.display = 'flex';
    this.sellButton.style.justifyContent = 'center'; // Center the label horizontally
    this.sellButton.style.alignItems = 'center'; // Center the label vertically

    // Add the click event listener
    this.sellButton.addEventListener('click', function() {
        // This is your empty function
    });

    this.sellContainer.appendChild(this.sellButton);


    // Append the parent div to the body or another container
    document.body.appendChild(this.sellContainer); 
  }

    createSelectListing() {
      if (this.myNfts) {
        // If it exists, just ensure it's visible and return
        this.overlay.style.display = 'block';
        return;
    }
      // Create a semi-transparent dark overlay for the background
      this.overlay = document.createElement('div');
      this.overlay.style.position = 'fixed'; // Fullscreen overlay
      this.overlay.style.top = '0';
      this.overlay.style.left = '0';
      this.overlay.style.zIndex = '2';
      this.overlay.style.width = '100vw';
      this.overlay.style.height = '100vh';
      this.overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'; // Semi-transparent black
      document.body.appendChild(this.overlay);

      // Create a big div in the center of the screen
      this.myNfts = document.createElement('div');
      this.myNfts.style.width = '85vw';
      this.myNfts.style.height = '85vh';
      this.myNfts.style.position = 'absolute';
      this.myNfts.style.top = '50%';
      this.myNfts.style.left = '50%';
      this.myNfts.style.transform = 'translate(-50%, -50%)';
      this.myNfts.style.backgroundColor = 'lightgrey';
      this.myNfts.style.borderRadius = '7.5vw';
      this.myNfts.style.overflowY = 'auto'; 

      // Add a search bar to the top left of the big div
      this.searchMyNfts = document.createElement('input');
      this.searchMyNfts.type = 'search';
      this.searchMyNfts.style.position = 'absolute';
      this.searchMyNfts.style.top = '2.5%';
      this.searchMyNfts.style.left = '7.5%';
      this.myNfts.appendChild(this.searchMyNfts);

      // Add 'my nfts' to the top right of the big div
      this.myNftLabel = document.createElement('div');
      this.myNftLabel.textContent = 'my nfts';
      this.myNftLabel.style.position = 'absolute';
      this.myNftLabel.style.top = '2.5%';
      this.myNftLabel.style.right = '7.5%';
      this.myNfts.appendChild(this.myNftLabel);

      // Create an array of squares below the search bar and label
      const numberOfSquares = 20; 
      this.squaresContainer = document.createElement('div');
      this.squaresContainer.style.display = 'flex';
      this.squaresContainer.style.flexWrap = 'wrap'; 
      this.squaresContainer.style.marginTop = '5%'; 

      for(let i = 0; i < numberOfSquares; i++) {
          const square = document.createElement('div');
          square.style.width = '100px'; 
          square.style.height = '100px'; 
          square.style.margin = '10px';
          square.style.backgroundColor = 'white'; 
          this.squaresContainer.appendChild(square);
      }

      this.myNfts.appendChild(this.squaresContainer);

      // Append the big div over the overlay
      this.overlay.appendChild(this.myNfts);

      this.overlay.addEventListener('click', (event) => {
        if (event.target === this.overlay) {
            this.hideOverlay();
        }
    });
  }

  hideOverlay(){
    this.overlay.style.display = 'none'; 
  }
}


