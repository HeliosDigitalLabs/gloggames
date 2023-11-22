class LuncMobile {
    constructor() {
        this.init();
    }

    init() {
      console.log('Welcome to Luncman!');
      const isFirefoxAndroid = navigator.userAgent.includes('Firefox') && navigator.userAgent.includes('Android');
      const isFirefoxiOS = navigator.userAgent.includes('FxiOS') && this.isMobile();
  
      if (isFirefoxAndroid || isFirefoxiOS) {
          alert('Sorry, but this application is not compatible with Firefox on mobile. Please use desktop, mobile Safari, or mobile Chromium instead.');
      }
      
    // Add touchend event to prevent double-tap zoom
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function (event) {
        let now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
 }

    isMobile() {
        return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      }

    disableUserInteraction() {
          // Disable scrolling
          document.body.style.overflow = 'hidden';
  
          // Disable zooming by setting the maximum and initial scale to 0.4
          const metaViewport = document.querySelector('meta[name=viewport]');
          if (metaViewport) {
              metaViewport.content = 'width=device-width, initial-scale=0.4, maximum-scale=0.5, user-scalable=no';
          } else {
              const newMetaViewport = document.createElement('meta');
              newMetaViewport.name = 'viewport';
              newMetaViewport.content = 'width=device-width, initial-scale=0.4, maximum-scale=0.5, user-scalable=no';
              document.head.appendChild(newMetaViewport);
          }
      }

    toggleHideElements() {
        const canvas = document.getElementById("canvas");
        const luncmanText = document.getElementById("luncman-text");
        luncmanText.style.display = 'none';
      
        if (canvas.style.visibility === 'hidden') {
          canvas.style.visibility = 'visible'; // Show the canvas
        } else {
          canvas.style.visibility = 'hidden'; // Hide the canvas
          window.gameCoordinator.setCutscene(gameCoordinator.levelData);
        }
      }

    setGaiaBoy() {
      this.disableUserInteraction();

      let vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
      
        const contentContainer = document.getElementById('content-container');
        const retroCover = document.getElementById('retro-cover');
        document.body.style.overflow = 'hidden';

        // style gamescreen
        const luncmanText = document.getElementById('luncman-text');
        const playButton = document.getElementById('credit-check');
        const navBar = document.getElementById('nav');
        const smallNav = document.getElementById('small-nav');
        const dashBoard = document.getElementById('dashboard');
        const greeting = document.getElementById('greeting');
        const dashName = document.getElementById('dash-name');
        const pic = document.getElementById('luncpic');
        const rHud = document.getElementById('right-HUD');

        contentContainer.style.display = 'flex';
        retroCover.style.display = 'flex';

        const aspectRatio = window.innerHeight / window.innerWidth;
        console.log('aspect ratio', aspectRatio);
        
        const aspectRatios = [
          /* 1 */
          /* XBOX/PS/DS */
          { ratio: 1, action: () => {
            window.aspectRatio = 1;
            navBar.style.marginTop = 'calc(33 * var(--vh))';
            rHud.style.top = 'calc(60 * var(--vh))';
            window.cutSceneHeight = 'calc(59.999 * var(--vh))';
            window.winScreenHeight = 'calc(59.999 * var(--vh))';
            window.abilityTop = 'calc(63.5 * var(--vh))';
            window.scaleAdjustment = '0.25';
          } },

          /* 1.25 */
          /* Blackberry Curve */
          { ratio: 5 / 4, action: () => {
            window.aspectRatio = 5 / 4;
            navBar.style.marginTop = 'calc(35 * var(--vh))';
            rHud.style.top = 'calc(60 * var(--vh))';  
            window.cutSceneHeight = 'calc(59.999 * var(--vh))';
            window.winScreenHeight = 'calc(59.999 * var(--vh))';
            window.abilityTop = 'calc(63.5 * var(--vh))';
            window.scaleAdjustment = '0.25';
          } },

          /* 1.33 */
          /* Surface Duo */
          { ratio: 4 / 3, action: () => {
            window.aspectRatio = 4 / 3;
            navBar.style.marginTop = 'calc(36 * var(--vh))';
            rHud.style.top = 'calc(60.5 * var(--vh))'; 
            window.cutSceneHeight = 'calc(59.999 * var(--vh))';
            window.winScreenHeight = 'calc(59.999 * var(--vh))';
            window.abilityTop = 'calc(63.5 * var(--vh))';
            window.scaleAdjustment = '0.25';
          } },

          /* 1.4 */
          /* iPad Air */
          { ratio: 7 / 5, action: () => {
            window.aspectRatio = 7 / 5;
            navBar.style.marginTop = 'calc(36.5 * var(--vh))';
            rHud.style.top = 'calc(60.6 * var(--vh))'; 
            window.cutSceneHeight = 'calc(59.999 * var(--vh))';
            window.winScreenHeight = 'calc(59.999 * var(--vh))';
            window.abilityTop = 'calc(63.5 * var(--vh))';
            window.scaleAdjustment = '0.25';
          } },

          /* 1.5 */
          /* iPad Mini, Surface Pro 7 */
          { ratio: 3 / 2, action: () => { 
            window.aspectRatio = 3 / 2;
            navBar.style.marginTop = 'calc(36.5 * var(--vh))';
            rHud.style.top = 'calc(60 * var(--vh))';  
            window.cutSceneHeight = 'calc(59.999 * var(--vh))';
            window.winScreenHeight = 'calc(59.999 * var(--vh))';
            window.abilityTop = 'calc(63.5 * var(--vh))';
            window.scaleAdjustment = '0.25';
          } },

          /* 1.6 */
          /* Nest Hub, Nest Hub Max */
          { ratio: 8 / 5, action: () => {
            window.aspectRatio = 8 / 5;
            navBar.style.marginTop = 'calc(37.5 * var(--vh))';
            rHud.style.top = 'calc(60 * var(--vh))';  
            window.cutSceneHeight = 'calc(59.999 * var(--vh))';
            window.winScreenHeight = 'calc(59.999 * var(--vh))';
            window.abilityTop = 'calc(63.5 * var(--vh))';
            window.scaleAdjustment = '0.25';
          } },

          /* 1.67 */
          /*  */
          { ratio: 5 / 3, action: () => {
            window.aspectRatio = 5 / 3;
            navBar.style.marginTop = 'calc(37.5 * var(--vh))';
            rHud.style.top = 'calc(60 * var(--vh))'; 
            window.cutSceneHeight = 'calc(59.999 * var(--vh))';
            window.winScreenHeight = 'calc(59.999 * var(--vh))';
            window.abilityTop = 'calc(63.5 * var(--vh))';
            window.scaleAdjustment = '0.25';
          } },

          /* 1.7 */
          /*  */
          { ratio: 17 / 10, action: () => {
            window.aspectRatio = 17 / 10;
            navBar.style.marginTop = 'calc(37.5 * var(--vh))'; 
            rHud.style.top = 'calc(60 * var(--vh))'; 
            window.cutSceneHeight = 'calc(59.999 * var(--vh))';
            window.winScreenHeight = 'calc(59.999 * var(--vh))';
            window.abilityTop = 'calc(63.5 * var(--vh))';
            window.scaleAdjustment = '0.25';
          } },
          
          /* 1.78 */
          /* iPhone SE */
          { ratio: 16 / 9, action: () => { 
            window.aspectRatio = 16 / 9;
            navBar.style.marginTop = 'calc(38 * var(--vh))';
            playButton.style.width = '20vw';
            rHud.style.top = 'calc(60.5 * var(--vh))'; 
            window.cutSceneHeight = 'calc(59.999 * var(--vh))';
            window.winScreenHeight = 'calc(59.999 * var(--vh))';
            window.abilityTop = 'calc(63.5 * var(--vh))';
            window.scaleAdjustment = '0.5';
          } },
          
          /* 2 */
          /*  */
          { ratio: 2, action: () => {
            window.aspectRatio = 2;
            navBar.style.marginTop = 'calc(39 * var(--vh))'; 
            rHud.style.top = 'calc(60.6 * var(--vh))'; 
            window.cutSceneHeight = 'calc(59.999 * var(--vh))';
            window.winScreenHeight = 'calc(59.999 * var(--vh))';
            window.abilityTop = 'calc(63.5 * var(--vh))';
            window.scaleAdjustment = '0.25';
          } },
          
          /* 2.1 */
          /* Galaxy S8 */
          { ratio: 21 / 10, action: () => {
            window.aspectRatio = 21 / 10;
            navBar.style.marginTop = 'calc(38.5 * var(--vh))';
            rHud.style.top = 'calc(60 * var(--vh))'; 
            window.cutSceneHeight = 'calc(59.999 * var(--vh))';
            window.winScreenHeight = 'calc(59.999 * var(--vh))';
            window.abilityTop = 'calc(63.5 * var(--vh))';
            window.scaleAdjustment = '0.25';
            smallNav.style.top = '20%';
          } },
          
          /* 2.16 */
          /* iPhone XR, iPhone 12 Pro, Pixel 5 */
          { ratio: 19.5 / 9, action: () => {
            window.aspectRatio = 19.5 / 9;
            navBar.style.marginTop = 'calc(39.5 * var(--vh))'; 
            rHud.style.top = 'calc(60.6 * var(--vh))'; 
            window.cutSceneHeight = 'calc(59.999 * var(--vh))';
            window.winScreenHeight = 'calc(59.999 * var(--vh))';
            window.abilityTop = 'calc(63.5 * var(--vh))';
            window.scaleAdjustment = '0.25';
            smallNav.style.top = '18%';
          } },
          
          /* 2.2 */
          /* Samsung Galaxy S20 Ultra, Samsung Galaxy A51/71 */
          { ratio: 22 / 10, action: () => {
            window.aspectRatio = 22 / 10;
            navBar.style.marginTop = 'calc(39.5 * var(--vh))'; 
            rHud.style.top = 'calc(60.6 * var(--vh))'; 
            window.cutSceneHeight = 'calc(59.999 * var(--vh))';
            window.winScreenHeight = 'calc(59.999 * var(--vh))';
            window.abilityTop = 'calc(63.5 * var(--vh))';
            window.scaleAdjustment = '0.25';
            smallNav.style.top = '18%';
          } },
          
          /* 2.3 */
          /* Galaxy Fold */
          { ratio: 23 / 10, action: () => {
            window.aspectRatio = 23 / 10;
            navBar.style.marginTop = 'calc(39 * var(--vh))'; 
            rHud.style.top = 'calc(60.6 * var(--vh))'; 
            window.cutSceneHeight = 'calc(59.999 * var(--vh))';
            window.winScreenHeight = 'calc(59.999 * var(--vh))';
            window.abilityTop = 'calc(63.5 * var(--vh))';
            window.scaleAdjustment = '0.25';
            smallNav.style.top = '18%';
          } },
          
          /* 2.45 */
          /*  */
          { ratio: 49 / 20, action: () => {
            window.aspectRatio = 49 / 20;
            navBar.style.marginTop = 'calc(40 * var(--vh))'; 
            rHud.style.top = 'calc(60 * var(--vh))';
            window.cutSceneHeight = 'calc(59.999 * var(--vh))';
            window.winScreenHeight = 'calc(59.999 * var(--vh))';
            window.abilityTop = 'calc(63.5 * var(--vh))';
          } },
          
          { ratio: Number.MAX_SAFE_INTEGER, action: () => { 
            window.aspectRatio = aspectRatio;
            navBar.style.marginTop = 'calc(38 * var(--vh))'; 
            rHud.style.top = 'calc(60 * var(--vh))'; 
            window.cutSceneHeight = 'calc(59.999 * var(--vh))';
            window.winScreenHeight = 'calc(59.999var * var(--vh))';
            window.abilityTop = 'calc(63.5 * var(--vh))';
          } }, // default case
        ];
        
        // Find the closest ratio range
        let closestRatio = aspectRatios[0];
        for(let i = 1; i < aspectRatios.length; i++) {
            if(Math.abs(aspectRatio - aspectRatios[i].ratio) < Math.abs(aspectRatio - closestRatio.ratio)) {
                closestRatio = aspectRatios[i];
            }
        }
        console.log('closest Ratio', closestRatio);
        
        // Perform the action of the closest ratio range
        closestRatio.action();
    
        // set position, top, left, and transform for centering
        [contentContainer, retroCover].forEach(el => {
            el.style.position = 'fixed';
            el.style.width = '91.8vw';
            el.style.height = 'calc(59.999 * var(--vh))';
            el.style.top = 'calc(5.54 * var(--vh))';
            el.style.left = '4.1vw';
            el.style.transform = 'translate(0%, 0%)';
        });

        luncmanText.setAttribute('y', '8%');
        luncmanText.style.display = 'none';

        navBar.style.marginLeft = '50%';
        navBar.style.fontSize = '3vw';

        dashBoard.style.display = 'flex';
        dashBoard.style.position ='fixed';
        dashBoard.style.top = 'calc(35 * var(--vh))';
        dashBoard.style.left = '10%';
        dashBoard.style.fontSize = '3vw';
        dashBoard.style.minWidth = '40%';
        dashBoard.style.minHeight = '35%';

        playButton.style.top = 'calc(20 * var(--vh))';
        playButton.style.fontSize = '3vw';

        pic.style.display = 'flex';
        pic.style.position ='fixed';
        pic.style.top = 'calc(40 * var(--vh))';
        pic.style.height = '20%';
        pic.style.width = '20%';

        greeting.style.display = 'flex';
        greeting.style.position ='fixed';
        greeting.style.top = '80%';

        
        dashName.style.display = 'flex';
        dashName.style.position ='fixed';
        dashName.style.top = '85%';
        
        //style gaiaboy
        // Create the background element
        var backgroundElement = document.createElement('div');
        backgroundElement.className = 'background-element';

        // Append the element to the body
        document.body.appendChild(backgroundElement);

        var backgroundImage = document.createElement('img');
        backgroundElement.appendChild(backgroundImage);
        backgroundImage.src = './js/background/gaiaboy_rough.png';
        backgroundImage.style.position = 'absolute';
        backgroundImage.style.top = '0';
        backgroundImage.style.left = '0';
        backgroundImage.style.width = '100%';
        backgroundImage.style.height = '100%';


        
    }

    loadJSON(jsonPath) {
      fetch(jsonPath)
          .then(response => response.json())
          .then(data => {
            this.setGaiaBoy();
          })
          .catch(error => console.error('Error loading JSON:', error));
    }
}