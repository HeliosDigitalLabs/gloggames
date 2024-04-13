// register gsap plugins
gsap.registerPlugin(Flip);


// classes for main glo page 
class VideoBackground { 
  constructor(preloader, backgrounds) {
      this.videos = backgrounds;
      this.videoElementIndex = 0;
      this.preloadVideoElement = null;
      this.currentVideoIndex = 0;
      this.jsonData = null;
      this.videosLoaded = [false, false];
      this.preloadQueue = [];
      this.preloadVideos = {};
      this.allPreloaded = false;
      this.supportsWebp = this.checkWebpSupport();
      this.elementsSet = false;

      // Initialize the z-index of the videos
      this.videos[0].style.zIndex = -3;
      this.videos[1].style.zIndex = -3;

      // Set preloader video
      this.setVideoSource(this.videos[0], preloader);
      this.videos[0].loop = true;

      this.settingElements = [];
      this.attachResizeListener();
      
      // Add preload-finished event listener
      document.addEventListener('preload-finished', this.handlePreloadFinished.bind(this));
  }

  handleGuestPreload(){
    if (window.client.gloSession) return;
    this.welcome = true;
    window.welcomed = true;
    const textContainer = document.createElement('div');
    document.body.appendChild(textContainer);

    // The text to be typed out
    let text = 'Welcome to glo, the crypto arcade';

    // The index of the current character
    let index = 0;

    // The typing speed in milliseconds
    let speed = 88;

    // Type out the text one character at a time
    let typing = setInterval(() => {
      // Add the current character to the innerText
      textContainer.innerText += text.charAt(index);

      index++;

      // If all the characters have been typed out, stop the typing animation
      if (index >= text.length) {
        clearInterval(typing);

        // Fade out all the text at once after 1 second
        gsap.to(textContainer, {opacity: 0, delay: 1, duration: 1, onComplete: () => {
          textContainer.innerText = '';
          textContainer.style.opacity = 1;
          this.welcome = false;
        }});
      }
    }, speed);

    textContainer.style = `
      position:absolute;
      color: white;
      font-size: 4em;
      top: 15%;
      left: 50%;
      transform: translateX(-50%);
      font-family: gabarito;
      text-align: center;
      font-weight: 900;
      opacity: 1;
      white-space: pre;`; // Add this line
  }

  handlePreloadFinished() {
    if (this.preloadFinished) return;
    if (this.welcome) {
      setTimeout(()=> {
        this.welcome = false;
        this.handlePreloadFinished();
        return;
      }, 25)
    }
    this.allPreloaded = true;
    console.log('All videos preloaded');
    
    // Assume 'window.windowState' contains the current state of the window.
    const currentState = window.windowState; 
    let preloaderTransition;
    
    // Check if the current state is one of the keys in the transitions object.
    if (this.jsonData.videos[0].transitions[currentState]) {
      preloaderTransition = this.jsonData.videos[0].transitions[currentState];
    } else {
      // Fallback transition if currentState is not found.
      preloaderTransition = this.jsonData.videos[0].transitions[0];
    }
    
    console.log('preloader transition:', preloaderTransition);
    this.transitionTo(preloaderTransition);

    this.preloadFinished = true;
  }

  checkWebpSupport() {
      return document.createElement('canvas').toDataURL('image/webp').indexOf('data:image/webp') == 0;
  }

  setVideoSource(video, path) {
    return new Promise((resolve, reject) => {
      if (!video) {
        console.error("Video object is undefined or null");
        reject("Video object is undefined or null");
        return;
      }

      let videoPathWebm = `${path}.webm`;
      let videoPathMp4 = `${path}.mp4`;

      console.log('Setting webm source:', videoPathWebm);
      video.src = videoPathWebm;

      video.onloadedmetadata = () => {
        resolve();
        video.onloadedmetadata = null;
      };

      video.onerror = () => {
        console.log('Failed to load webm, trying mp4:', videoPathMp4);
        video.src = videoPathMp4;

        video.onloadedmetadata = () => {
          resolve();
          video.onloadedmetadata = null;
        };

        video.onerror = () => {
          console.error('Failed to load mp4:', videoPathMp4);
          reject('Failed to load video');
        };
      };
    });
  }
  
  // Function to check if a file exists at a given path
  async checkFileExists(url) {
    return fetch(url, { method: 'HEAD' })
      .then(res => {
        return res.ok;
      })
      .catch(err => {
        console.error('Error checking file:', err);
        return false;
      });
  }

  loadJSON(jsonPath) {
    fetch(jsonPath)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        this.jsonData = data; // Now jsonData is populated with the fetched data
        this.imgBase = data.imgBase;

        if (!Array.isArray(data.videos)) {
          throw new Error('Invalid video data');
        }

        // Initialize preloadVideos object for videos that need to be preloaded
        this.preloadVideos = {};
        data.videos.forEach((video, index) => {
          if (video.preload) {
            this.preloadVideos[video.path] = false; // Start with false, indicating not loaded
          }
        });

        // Start the preloading process
        this.startPreloading();
      })
      .catch(error => {
        console.error('Error loading JSON:', error);
        // Handle the error appropriately, possibly setting an error state
      });
  }

  async loadVideos(videoNames) {
    const videosToPreload = this.jsonData.videos.filter(video => videoNames.includes(video.path.split('/').pop()));
  
    for (let videoData of videosToPreload) {
      if (this.preloadVideos[videoData.path] !== 'loaded') {
        console.log(`Preloading video: ${videoData.path}`);
        await this.preloadVideo(videoData.path); // Utilize the existing preloadVideo method
      }
    }
  }

  async loadSpecificVideo(specificPath) {
    // Create a new video element for the specific video
    let videoElement = document.createElement('video');
    videoElement.muted = true;
    videoElement.playsInline = true;
    videoElement.style.visibility = 'hidden';  // Ensure it's not visible
    document.body.appendChild(videoElement);  // Add to the DOM

    console.log('Loading specific video:', specificPath);

    // Set the source of the video
    await this.setVideoSource(videoElement, specificPath);

    let videoData = this.jsonData.videos.find(video => video.path === specificPath);
    if (videoData) {
      videoElement.loop = videoData.loop;
      videoElement.preload = videoData.preload ? 'auto' : 'none';
      videoElement.width = this.jsonData.videoWidth;
      videoElement.height = this.jsonData.videoHeight;

      let index = this.jsonData.videos.indexOf(videoData);

      videoElement.oncanplaythrough = () => {
        console.log('Specific video loaded:', specificPath);
        this.videosLoaded[index] = true;
        videoElement.oncanplaythrough = null; // remove the oncanplaythrough event listener
      };
    }
  }

  // Format name for instance variable created to represent transition(s)
  // e.g. "load_main" -> "loadMain"
  formatTransitionName(name) {
    let words = name.split('_');
    let formattedName = words.map((word, index) => {
      if (index === 0) {
        return word.toLowerCase();
      } else {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
    }).join('');

    return formattedName;
  }

  startPreloading() {
    this.preloadedCount = 0;
    this.totalToPreload = Object.keys(this.preloadVideos).length;
    
    // Loop over preloadVideos object to start preloading each video
    for (const path of Object.keys(this.preloadVideos)) {
      this.preloadVideo(path);
    }
  }

  // Create a video element for preloading
  createPreloadVideoElement() {
    let video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.style.visibility = 'hidden';  // Ensure it's not visible
    document.body.appendChild(video);  // Add to the DOM
    this.preloadVideoElement = video;
  }

  async preloadVideo(path) {
    if (this.preloadVideos[path]) {
      return; // If already preloaded or in progress, do nothing
    }

    this.preloadVideos[path] = 'loading';
    const videoElement = document.createElement('video');
    videoElement.muted = true;
    videoElement.playsInline = true;
    videoElement.style.visibility = 'hidden';
    document.body.appendChild(videoElement);

    try {
      await this.setVideoSource(videoElement, path);
      videoElement.oncanplaythrough = () => {
        console.log(`Video at path ${path} preloaded using ${videoElement}`);
        this.preloadVideos[path] = 'loaded';
        this.preloadedCount++;

        if (document.body.contains(videoElement)) {
          document.body.removeChild(videoElement); // Clean up if the video element is still in the DOM
        }

        if (this.preloadedCount === this.totalToPreload) {
          console.log('All videos preloaded. Dispatching "preload-finished" event.');
          document.dispatchEvent(new CustomEvent('preload-finished'));
        }
      };
    } catch (error) {
      console.error(`Failed to preload video at path ${path}:`, error);
      this.preloadVideos[path] = 'error';
      // Decide if you want to retry or handle the error differently
    }
  }

  checkAndPreloadNextVideo() {
    // Check if there are any videos left to preload
    const notLoaded = Object.values(this.preloadVideos).filter(v => v.status === 'not_loaded');
    if (notLoaded.length > 0) {
      // Preload the next not loaded video
      const nextVideo = notLoaded[0];
      this.preloadVideo(nextVideo.index, Object.keys(this.preloadVideos).find(path => this.preloadVideos[path] === nextVideo));
    } else {
      console.log('All videos preloaded. Dispatching "preload-finished" event.');
      document.dispatchEvent(new CustomEvent('preload-finished'));
    }
  }

  renderElements(video) {
    this.video = video;

    this.contentContainer = document.getElementById('content-container');

    this.videoWidth = 4550;
    this.videoHeight = 1080;
    this.screenWidth = 1229;
    this.screenHeight = 911;

    // Resize containers when window is resized
    window.addEventListener('resize', this.resizeContainers.bind(this));

    // Resize containers when video is loaded
    this.resizeContainers();

    window.resizeContainers = this.resizeContainers.bind(this);
}

renderElementSizeAndPosition(element, width, height, top, left) {
    element.style.width = width + 'px';
    element.style.height = height + 'px';
    element.style.top = top - 2 + 'px';
    element.style.left = left + 'px';
}

resizeContainers() {
    // Get size and position of visible video element
    let videoRect = this.video.getBoundingClientRect();

    // Set up constants
    const viewWidth = videoRect.width;
    const viewHeight = videoRect.height;
    const percentWidth = this.screenWidth / this.videoWidth;
    const percentHeight = viewHeight / this.videoHeight;

    // Calculate container size
    const containerWidthCandidate = ((viewHeight / this.videoHeight) * this.videoWidth) * percentWidth;
    const containerHeightCandidate = containerWidthCandidate * (this.screenHeight / this.screenWidth);

    const maxHeight = (viewWidth / this.videoWidth) * this.videoHeight; // Calculate the maximum container height that fits within the viewport

    if (viewHeight > maxHeight) {
        const containerHeight = containerHeightCandidate;
        const containerWidth = containerHeight * (this.screenWidth / this.screenHeight);

        const containerTop = viewHeight * 0.0834477777777; // 90 / 1080
        const containerLeft = (viewWidth / 2) - (containerWidth / 2);

        this.renderElementSizeAndPosition(this.contentContainer, containerWidth, containerHeight, containerTop, containerLeft);
    } else {
        const containerTop = 38 - ((maxHeight / 2) - (viewHeight / 2));
        const containerLeft = (viewWidth / 2) - (parseFloat(this.contentContainer.style.width) / 2);

        this.renderElementSizeAndPosition(this.contentContainer, containerWidthCandidate, containerHeightCandidate, containerTop, containerLeft);
    }
}

  // setElements(video) {
  //   console.log('setElements() called');
  //   const contentContainer = document.getElementById('content-container');
  //   const retroCover = document.getElementById('retro-cover');
  //   const play = document.getElementById('play-btn');
  //   const nav = document.getElementById('nav');
  //   const dashboard = document.getElementById('dashboard');
    

  //   function resizeContainers() {
  //     console.log('resizeContainers() called');

  //     // Get size and position of visible video element
  //     let videoRect = video.getBoundingClientRect();

  //     // input video dimensions
  //     const videoWidth = 4550;
  //     const videoHeight = 1080;       /**********************/
  //     // input screen dimensions      *** INPUT VARIABLES ***
  //     const screenWidth = 1192;       /**********************/
  //     const screenHeight = 900;
  //     // input navbar/dashboard dimensions
  //     const navWidth = 338;
  //     const navHeight = 312;
  //     // input min top
  //     const minTop = 38;
  //     // font size
  //     const fontSize = 32;

    
  //     // set up constants
  //     const viewWidth = videoRect.width;
  //     const viewHeight = videoRect.height;
  //     const percentWidth = screenWidth / videoWidth;
  //     const percentHeight = viewHeight / videoHeight;
  //     const navPercentWidth = navWidth / videoWidth;
  //     const screenAspect = screenHeight / screenWidth;
  //     const navAspect = navHeight / navWidth;
  //     console.log('video width:', viewWidth);
  //     console.log('video height:', viewHeight);
  //     console.log('navPercentWidth:', navPercentWidth);
  //     console.log('navAspect:', navAspect);
    
  //     // Calculate container + main elements size
  //     const containerWidthCandidate = ((viewHeight / videoHeight) * videoWidth) * percentWidth;
  //     const containerHeightCandidate = containerWidthCandidate * screenAspect;
  //     const navWidthCandidate = ((viewHeight / videoHeight) * videoWidth) * navPercentWidth;
  //     const navHeightCandidate = navWidthCandidate * navAspect;
     
  //     const maxHeight = (viewWidth / videoWidth) * videoHeight; // Calculate the maximum container height that fits within the viewport
  //     console.log('max height:', maxHeight)

  //     // If the container would overflow the viewport height, set the container size to the maximum allowed size
  //     if (viewHeight > maxHeight) {
  //       console.log('right size')
  //       const containerHeight = containerHeightCandidate;
  //       const containerWidth = containerHeight / screenAspect;
  //       console.log('containerWidth:', containerWidth);
  //       console.log('containerHeight:', containerHeight);

  //       const navHeight = navHeightCandidate;
  //       const navWidth = navHeight / navAspect;
  //       console.log('navWidth:', navWidth);
  //       console.log('navHeight:', navHeight);
  //       contentContainer.style.width = containerWidth + 'px';
  //       contentContainer.style.height = containerHeight + 'px';
  //       retroCover.style.width = containerWidth + 'px';
  //       retroCover.style.height = containerHeight + 'px';
  //       nav.style.width = navWidth + 'px';
  //       nav.style.height = navHeight + 'px';
  //       dashboard.style.height = navHeight + 'px';
  //       dashboard.style.width = navWidth + 'px';

  //       // set font size
  //       document.getElementById('nav').style.fontSize = (fontSize * percentHeight) + 'px';
  //       document.getElementsByClassName('play-btn')[0].style.fontSize = ((fontSize + 4) * percentHeight) + 'px';
  //       console.log('percentHeight:', percentHeight)
  //       console.log('play btn font size:', document.getElementsByClassName('play-btn')[0].style.fontSize)

  //       // nav / dashboard gap
  //       const navGap = containerWidth * 0.2; // 20% of screen width
  //       console.log('navGap:', navGap)

  //       // Calculate and set container / main elements positions
  //       const containerTop = viewHeight * 0.0834477777777; //   90 / 1080
  //       const containerLeft = (viewWidth / 2) - (parseFloat(contentContainer.style.width) / 2);
  //       console.log('containerTop:', containerTop);
  //       console.log('containerLeft:', containerLeft);
  //       const navTop = (percentHeight * 630) - (navHeight / 2) // 500px from top of video for 1080px
  //       const navLeft = navGap + (navWidth / 1.5); // 5 % of screen width
  //       console.log('navTop:', navTop);
  //       console.log('navLeft:', navLeft);
      
  //       contentContainer.style.top = containerTop + 'px';
  //       contentContainer.style.left = containerLeft + 'px';
  //       retroCover.style.top = containerTop + 'px';
  //       retroCover.style.left = containerLeft + 'px';
  //       nav.style.paddingTop = '46vh';
  //       nav.style.paddingLeft = navLeft + 'px';
  //       dashboard.style.marginTop = navTop + 'px';
  //       dashboard.style.marginRight = navLeft + 'px';
  //       console.log('paddingLeft:', nav.style.paddingLeft)

  //       // Set Chat
  //       const contentContainerRect = contentContainer.getBoundingClientRect();
  //       const aspectRatio = window.innerWidth / window.innerHeight;
        

  //       if (contentContainer.style.display !== 'none' && contentContainerRect.left === 0) {
  //         setTimeout(() => resizeContainers(), 10);
  //     }
      

  //       if (window.chat.chatElement.style.display === 'none' && !NftMachine.instance) {
  //         window.chat.chatElement.style.display = 'flex';
  //       }
        
  //       if (aspectRatio > 1.925) {
  //         // Calculate the maximum possible width of the chat element, ensuring it doesn't exceed 400px
  //         let maxChatWidth = contentContainerRect.left - (4.5 / 100 * window.innerWidth) - (0.5 / 100 * window.innerWidth);
  //         let chatWidth = maxChatWidth > 400 ? 400 : maxChatWidth;
        
  //         window.chat.chatElement.style.position = 'absolute';
  //         window.chat.chatElement.style.width = chatWidth + 'px';
  //         window.chat.chatElement.style.marginLeft = (0.5 / 100 * window.innerWidth) + 'px';
  //         window.chat.chatElement.style.top = contentContainer.style.top;
  //         window.chat.chatElement.style.height = contentContainer.style.height;
        
  //         console.log('setting chat left', window.chat.chatElement.style.marginLeft, 'using container left, offset width, and window width', contentContainerRect.left, window.chat.chatElement.offsetWidth, window.innerWidth);
  //       } else {
  //         window.chat.chatElement.style.position = 'absolute';
  //         window.chat.chatElement.style.marginLeft = (contentContainerRect.left + (0.5 / 100 * window.innerWidth)) + 'px';
  //         window.chat.chatElement.style.marginTop = contentContainer.style.marginTop;
  //         window.chat.chatElement.style.height = '90%';
  //       }
  //     } else {
  //       console.log('wrong size')
  //       // Calculate and set container / main elements positions
  //       const containerTop = minTop - ((maxHeight / 2) - (viewHeight / 2));
  //       const containerLeft = (viewWidth / 2) - (parseFloat(contentContainer.style.width) / 2);
  //       const navTop = minTop - ((maxHeight / 2) - (viewHeight / 2)) + (viewHeight * 0.4629629629629); // 500 / 1080
  //       const navLeft = (viewWidth / 2) - (parseFloat(nav.style.width) / 2);
  //       console.log('navTop1:', navTop);
  //       console.log('navLeft1:', navLeft);
      
  //       contentContainer.style.top = containerTop + 'px';
  //       contentContainer.style.left = containerLeft + 'px';
  //       retroCover.style.top = containerTop + 'px';
  //       retroCover.style.left = containerLeft + 'px';
  //       nav.style.top = 200 + 'px';
  //       nav.style.left = navLeft + 'px';
  //     }
  //   }

  //   // Resize containers when window is resized
  //   window.addEventListener('resize', resizeContainers);

  //   // Resize containers when video is loaded
  //   resizeContainers();

  //   window.resizeContainers = resizeContainers;
  // }

  setElements() {
    if (this.elementsSet) return;
    if (window.windowState == 'mint') return;
    if (window.windowState == 'marketplace') return;
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
      console.log('no leaderboard', window.leaderboard)
    }

    if (!window.nftMachine) {
      window.nftMachine = new NftMachine(); 
    }

    if (!window.hoverDisplay) {
      window.hoverDisplay = new HoverDisplay();
    }
  }  
  
  setElement(elementId, originalWidth, originalHeight, originalTop, originalLeft) {
    const desiredHeight = 1080; // The height your design is based on
    const desiredWidth = 1920; // The width your design is based on
  
    // Get size and position of visible video element
    let videoRect;
    if (this.video) {
      videoRect = this.video.getBoundingClientRect();
    } else if (this.nextVideo) {
      videoRect = this.nextVideo.getBoundingClientRect();
    } else {
      videoRect = this.videos[0].getBoundingClientRect();
    }
  
    // Set up constants
    const currentWidth = videoRect.width;
    const currentHeight = videoRect.height;
    const scalingFactorHeight = currentHeight / desiredHeight; // Calculate scaling factor for height
    const scalingFactorWidth = currentWidth / desiredWidth; // Calculate scaling factor for width
  
    // Calculate the width of the design as it would appear at the current scaling factor
    const scaledDesignWidth = desiredWidth * scalingFactorHeight;
  
    // Adjust dimensions and positions according to the scaling factors
    // Width, height, and top adjustments use the height scaling factor
    const adjustedWidth = originalWidth * scalingFactorHeight;
    const adjustedHeight = originalHeight * scalingFactorHeight;
    const adjustedTop = originalTop * scalingFactorHeight;
    
    // Calculate base left position using height scaling factor
    const baseLeft = originalLeft * scalingFactorHeight;
    // Adjust the base left value by considering the difference in the viewport's width and the scaled design width
    const adjustmentForWidth = (currentWidth - scaledDesignWidth) / 2;
    const adjustedLeft = baseLeft + adjustmentForWidth; // Apply adjustment
  
    // Select the element and apply adjustments
    const element = document.getElementById(elementId);
    if (element) {
      element.style.width = `${adjustedWidth}px`;
      element.style.height = `${adjustedHeight}px`;
      element.style.top = `${adjustedTop}px`;
      element.style.left = `${adjustedLeft}px`;
    } else {
      console.error('Element not found: ', elementId);
    }
  }

  addSetElement(elementId, originalWidth, originalHeight, originalTop, originalLeft) {
    // Check if element with same elementId already exists
    const existingElement = this.settingElements.find(el => el.elementId === elementId);
  
    // If it does, return and don't add the element
    if (existingElement) {
      this.setElement(elementId, originalWidth, originalHeight, originalTop, originalLeft);
      return;
    }

    // Add element details to the list
    this.settingElements.push({elementId, originalWidth, originalHeight, originalTop, originalLeft});

    // Immediately set the element to ensure it's correctly positioned at startup
    this.setElement(elementId, originalWidth, originalHeight, originalTop, originalLeft);
  }

  attachResizeListener() {
    window.addEventListener('resize', () => {
      // Iterate over each element in the list and adjust its size and position
      this.settingElements.forEach(el => {
        this.setElement(el.elementId, el.originalWidth, el.originalHeight, el.originalTop, el.originalLeft);
      });
    });
  }

  async transitionTo(videoName, callback) {
    console.error('Transitioning to:', videoName);
    let videoData = this.jsonData.videos.find(video => video.path.split('/').pop() === videoName);
  
    if (!videoData) {
      console.error('Invalid video name');
      return;
    }
  
    // Check if the video is marked as 'loaded' in the preloadVideos object
    if (this.preloadVideos[videoData.path] !== 'loaded') {
      console.error(`Video ${videoName} not preloaded yet.`);
      await this.loadSpecificVideo(videoData.path);
    }
  
    // Calculate the index for the current and next video elements
    let currentElementIndex = this.videoElementIndex;
    let nextElementIndex = (this.videoElementIndex + 1) % 2; // Switch between 0 and 1
  
    let currentVideo = this.videos[currentElementIndex];
    if(currentVideo.endedListener) {
      console.log('Removing ended listener from', currentVideo);
      currentVideo.removeEventListener('ended', currentVideo.endedListener); // remove existing listener
    }
  
    let nextVideo = this.videos[nextElementIndex];
    if(nextVideo.endedListener) {
      nextVideo.removeEventListener('ended', nextVideo.endedListener); // remove existing listener
    }
  
    // Set the source of next video
    nextVideo.loop = videoData.loop;
    await this.setVideoSource(nextVideo, videoData.path);
    this.nextVideo = nextVideo;

    // Check whether to call setElements on this video
    if (videoData.setElements) {
      this.renderElements(nextVideo);
      this.setElements(nextVideo);
    } else {
      nextVideo.setElements = false;
    }
  
    // Wait for nextVideo to be able to play through
    nextVideo.oncanplaythrough = async () => {
      try {
        // Attempt to play the next video
        await nextVideo.play();

        // Once play starts successfully, change visibility
        nextVideo.style.visibility = 'visible';
        currentVideo.style.visibility = 'hidden';
      } catch (error) {
        console.error('Error playing video:', error);
      }
      // Clean up the event listener as it's no longer needed
      nextVideo.oncanplaythrough = null;
    };
  
    console.log('Transitioning to:', videoData.path, 'for', nextVideo);
  
    // If the video is not looping, set up an event listener to transition to the next video when it ends
    if (!videoData.loop) {
      nextVideo.endedListener = () => {
        if (videoData.transitions && videoData.transitions.length > 0) {
          if(videoData.transitions[0] === "none") {
            console.log('Transitioning to full screen')
          } else {
            console.log('Transitioning to next video:', videoData.transitions[0]);
            this.transitionTo(videoData.transitions[0]);  // transition to the first video in the transitions array
          }
          if (callback) {
            callback = callback.bind(this);
            callback();
          }
        }
      }
      nextVideo.addEventListener('ended', nextVideo.endedListener);
    }
  
    // Update the videoElementIndex to the next one
    this.videoElementIndex = nextElementIndex;
  }
}

class HoverDisplay {
  constructor(){
    if (window.client.gloSession === true) {
      this.createElements();
    } else if (!window.welcomed) {
      window.videoBackground.handleGuestPreload();
    }

    // Add event listener for WindowStateChanged event
    window.addEventListener('WindowStateChanged', () => {
      if (this.textContainer && window.windowState != 'home') {
        this.textContainer.style.display = 'none'; // Hide textContainer when the window state changes
      }
    });
  }

  createElements() {
    if (window.windowState === 'home') {
      this.textContainer = document.createElement('div');
      document.body.appendChild(this.textContainer);

      // The text to be typed out
      let text = `Welcome ${window.client.gloInfo.username}`;

      // The index of the current character
      let index = 0;

      // The typing speed in milliseconds
      let speed = 88;

      // Type out the text one character at a time
      let typing = setInterval(() => {
        // Add the current character to the innerText
        this.textContainer.innerText += text.charAt(index);

        index++;

        // If all the characters have been typed out, stop the typing animation
        if (index >= text.length) {
          clearInterval(typing);

          // Fade out all the text at once after 1 second
          gsap.to(this.textContainer, {opacity: 0, delay: 1, duration: 1, onComplete: () => {
            this.textContainer.innerText = '';
            this.textContainer.style.opacity = 1;
          }});
        }
      }, speed);

      this.textContainer.style = `
        position:absolute;
        color: white;
        font-size: 4em;
        top: 15%;
        left: 50%;
        transform: translateX(-50%);
        font-family: gabarito;
        text-align: center;
        font-weight: 900;
        opacity: 1;
        white-space: pre;`; // Add this line
    }
  }
}

class SpriteSheet {
  constructor({src, parent = null, x = 0, y = 0, rotation = 0, frameWidth, frameHeight, frameCount, framesPerRow, fps = 24, loop, onFinished, reverse = false}) {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');

    this.canvas.width = frameWidth;
    this.canvas.height = frameHeight;

    if (onFinished) this.onFinished = onFinished;
    this.reverse = reverse;

    this.parent = parent;
    this.frameWidth = frameWidth;
    this.frameHeight = frameHeight;
    this.frameCount = frameCount;
    this.framesPerRow = framesPerRow;
    this.fps = fps;
    this.frameDelay = 1000 / this.fps;
    this.lastFrameTime = 0;
    this.loop = loop;
    this.frames = [];
    this.currentFrame = 0;
    this.isPlaying = false;
    this.speed = 1;
    this.rotation = rotation;
    this.x = x;
    this.y = y;
    this.loadFrames();

    if (this.parent) {
      this.parent.appendChild(this.canvas);
    }

    if (frameCount === 1) {
      this.singleImage = new Image();
      this.singleImage.src = src;
      return;
    }

    this.image = new Image();
    this.image.src = src;
    this.image.onload = () => this.start();
  }

  loadFrames() {
    for (let i = 0; i < this.frameCount; i++) {
      const x = (i % this.framesPerRow) * this.frameWidth;
      const y = Math.floor(i / this.framesPerRow) * this.frameHeight;
      this.frames.push({ x, y });
    }
  }

  start() {
    this.isPlaying = true;
    this.currentFrame = this.reverse ? this.frameCount - 1 : 0;
    this.animationFrameId = requestAnimationFrame(this.animate.bind(this));
  }

  animate(timestamp = 0) {
    if (timestamp - this.lastFrameTime >= this.frameDelay) {
      this.update();
      this.lastFrameTime = timestamp;
    }
    this.animationFrameId = requestAnimationFrame(this.animate.bind(this));
  }

  pause() {
    this.isPlaying = false;
    cancelAnimationFrame(this.animationFrameId);
  }

  remove() {
    // This method would depend on how you're managing your spritesheets in your game
  }

  moveTo(x, y) {
    this.x = x;
    this.y = y;
  }

  rotateBy(degrees) {
    this.rotation = degrees;
  }

  changeSpeed(speed) {
    this.speed = speed;
  }

  update() {
    if (this.singleImage) return;
    if (this.isPlaying) {
      this.currentFrame += this.reverse ? -this.speed : this.speed;
      if (this.reverse ? this.currentFrame < 0 : this.currentFrame >= this.frameCount) {
        if (this.loop) {
          this.currentFrame = this.reverse ? this.frameCount - 1 : 0;
        } else {
          this.currentFrame = this.reverse ? 0 : this.frameCount - 1;
          this.isPlaying = false;
          if (this.onFinished) {
            this.onFinished();
          }
        }
      }

      // Calculate the frame position
      const frame = this.frames[Math.floor(this.currentFrame)];
      const x = frame.x;
      const y = frame.y;

      // Apply transformations
      this.ctx.save();
      this.ctx.translate(this.x, this.y);
      this.ctx.rotate(this.rotation * Math.PI / 180);
    
      // Clear the canvas and draw the current frame
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.drawImage(this.image, x, y, this.frameWidth, this.frameHeight, 0, 0, this.frameWidth, this.frameHeight);
    
      this.ctx.restore();
    }
  }

  updateStyle(style) {
    Object.assign(this.image.style, style);
  }
}

function isMobile() {
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}


class Chat {
  constructor() {
    // initialize Chat object
    this.chatElement = null;
    this.messagesElement = null;
    this.messageInputElement = null;
    this.buttonElement = null;
    this.messages = [];
    this.toggleButton = null;
    this.isChatVisible = localStorage.getItem('isChatVisible') === 'true' ? true : false;
    this.init();
  }

  init() {
    this.createChat();

    if (window.client.socketConnected) {
      this.attachSocketListeners();
    } else {
      this.createGuestChat();
    }

    this.toggleButton.addEventListener('click', () => this.toggleChat());

    this.registerEventListeners();

    // TEMP //
    this.preloadReactionImages();

    // Listen for the custom event 'socketConnectionSuccess'
    document.addEventListener('socketConnectionSuccess', () => {
      this.switchToChat();
      this.attachSocketListeners();
      this.loadChatHistory();
    });
  }

  clearChat() {
    // Clear the messages array
    this.messages = [];

    // Remove all child elements from the messagesElement
    while (this.messagesElement.firstChild) {
      this.messagesElement.removeChild(this.messagesElement.firstChild);
    }
  }

  preloadReactionImages() {
    // Preload reaction images
    this.thumbsUpImageSrc = '/style/graphics/thumbs_up.png';
    this.thumbsDownImageSrc = '/style/graphics/thumbs_down.png';
  }

  attachSocketListeners() {
    // Add socket
    window.client.socket.on('new_message', (data) => {
      this.newMessage(data);
    });

    window.client.socket.on('delete_confirmation', (data) => {
      this.deleteMessage(data.id);
    });

    window.client.socket.on('chat_history', (data) => {
      console.log('loading chat history', data)
      this.messagesElement.innerHTML = '';
      this.messages = [];
      
      // Handle the normal messages
      data.messages.forEach(message => this.newMessage(message));

      // Handle the pinned message
      if (data.pinnedMessage) {
        this.newPinnedMessage(data.pinnedMessage);
      }

      // Scroll to the bottom
      this.messagesElement.scrollTop = this.messagesElement.scrollHeight;
    });

    window.client.socket.on('message_reacted', (data) => {
      this.updateMessageReaction(data.id, data.reactions);
    });

    window.client.socket.on('new_pinned_message', (data) => {
      console.log('new pinned message', data);
      
      // Handle the new pinned message
      this.newPinnedMessage(data.message);
    });

    this.loadChatHistory();
  }

  resetSocketListeners() {
    window.client.socket.off('new_message');
    window.client.socket.off('delete_confirmation');
    window.client.socket.off('chat_history');
    window.client.socket.off('message_reacted');
    window.client.socket.off('new_pinned_message');
  }

  styleChat() {
    if (!window.client.activePlayer) {
      if (window.client.gloInfo.activeGlotag && this.chatElement) {
        this.chatElement.style.backgroundColor = window.client.gloInfo.activeGlotag.metadata.glotagColor;
        this.chatElement.style.boxShadow = window.client.gloInfo.activeGlotag.metadata.boxShadow;
      } else {
        this.chatElement.style.backgroundColor = 'white';
        this.chatElement.style.boxShadow = '0 0 0.1rem #FFFFFF, 0 0 0.25rem #FFFFFF, 0 0 0.5rem #FFFFFF';
      }
    } else {
      if (window.client.activePlayer.playerInfo.activeGlotag && this.chatElement) {
        this.chatElement.style.backgroundColor = window.client.activePlayer.playerInfo.activeGlotag.metadata.glotagColor;
        this.chatElement.style.boxShadow = window.client.activePlayer.playerInfo.activeGlotag.metadata.boxShadow;
      } else {
        this.chatElement.style.backgroundColor = 'white';
        this.chatElement.style.boxShadow = '0 0 0.1rem #FFFFFF, 0 0 0.25rem #FFFFFF, 0 0 0.5rem #FFFFFF';
      }
    }
  }

  createChat() {
    // Create the chat div
    this.chatElement = document.createElement('div');
    this.chatElement.className = 'chatElement';
    this.chatElement.setAttribute('id', 'chat');
    this.chatElement.style.width = '340px';
    this.chatElement.style.height = '93vh';
    this.chatElement.style.borderRadius = '1.1rem';
    this.chatElement.style.padding = '10px';
    this.chatElement.style.boxSizing = 'border-box';
    this.chatElement.style.display = 'flex';
    this.chatElement.style.flexDirection = 'column';
    this.chatElement.style.position = 'absolute';
    this.chatElement.style.top = '1vh';
    this.chatElement.style.right = '1vw';
    this.chatElement.style.zIndex = '6';
    this.chatElement.style.opacity = '0.95';
    if (window.client.gloInfo.activeGlotag) {
      this.chatElement.style.backgroundColor = window.client.gloInfo.activeGlotag.metadata.glotagColor;
      this.chatElement.style.boxShadow = window.client.gloInfo.activeGlotag.metadata.boxShadow;
    } else {
      this.chatElement.style.backgroundColor = 'white';
      this.chatElement.style.boxShadow = '0 0 0.1rem #FFFFFF, 0 0 0.25rem #FFFFFF, 0 0 0.5rem #FFFFFF';
    }

    // Create the messages div
    this.messagesElement = document.createElement('div');
    this.messagesElement.setAttribute('id', 'messages');
    this.messagesElement.style.marginTop = '67.5%';
    this.messagesElement.style.marginBottom = '5%';
    this.messagesElement.style.overflowY = 'scroll';
    this.messagesElement.style.overflowX = 'hidden';
    this.messagesElement.style.flexGrow = '1';
    this.messagesElement.style.padding = '10px'; 
    this.messagesElement.style.borderBottom = '1px solid #ccc';
    this.messagesElement.scrollTop = this.messagesElement.scrollHeight;
    if(window.chat && window.chat.isChatVisible) {
      this.messagesElement.style.display = window.chat.isChatVisible === false ? 'none' : 'block';
    } else {
      this.messagesElement.style.display = 'none';
    }
    
    // Create a <style> element for the CSS rules
    let styleElement = document.createElement('style');
    styleElement.innerText = `
      #messages::-webkit-scrollbar {
        width: 3px !important;
      }
      #messages::-webkit-scrollbar-track {
        background: transparent !important;
      }
      #messages::-webkit-scrollbar-thumb {
        background: #d7dcda; /* Black color */
        border-radius: 10px !important;
      }
      @media screen and (max-width: 768px) {
        #messages::-webkit-scrollbar {
          width: 3px !important;
        }
      }
    `;

    // Append the <style> element to the <head> of the document
    document.head.appendChild(styleElement);
  
    // Create the input element
    this.messageInputElement = document.createElement('input');
    this.messageInputElement.setAttribute('id', 'messageInput');
    this.messageInputElement.setAttribute('type', 'text');
    this.messageInputElement.setAttribute('autocomplete', 'off');
    this.messageInputElement.style.width = 'calc(100% - 20px)';
    this.messageInputElement.style.padding = '5px';
    this.messageInputElement.style.borderRadius = '5px';
    this.messageInputElement.style.border = '1px solid #ccc';
    this.messageInputElement.style.fontFamily = 'Gabarito';
    this.messageInputElement.style.fontWeight = '900';
    this.messageInputElement.style.fontSize = '1.13em';

    // List of curse words to filter out
    const curseWords = ['nigger', 'n|gger', 'n|gga', 'n|gg4','n|gg3r', 'nigga', 'niggas', 'cracker', 'chink', 'kyke', 'spic', 'beaner', 'gook', 'niggers', 'n1gger', 'nigg3r', 'n1ggers', 'nigg3rs', 'n1gg3r', 'n1gg3rs'];

    // Add an event listener to the input event
    this.messageInputElement.addEventListener('input', function() {
      let value = this.value;
      
      // Replace all occurrences of '|\|' with asterisks
      let specialCharRegex = new RegExp('\\|\\\\\\|', 'gi');
      value = value.replace(specialCharRegex, '****');

      for (let curseWord of curseWords) {
        // Escape special characters in the curse word
        let escapedCurseWord = curseWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
        let regex = new RegExp(escapedCurseWord, 'gi');
        value = value.replace(regex, '****'); // replace curse word with asterisks
      }
      this.value = value;
    });

    // Create the button element
    this.buttonElement = document.createElement('div');
    this.buttonElement.className = 'message-send';
    this.buttonElement.style.marginLeft = '10px';
    this.buttonTop = document.createElement('div');
    this.buttonTop.className = 'message-send-top';
    this.buttonElement.appendChild(this.buttonTop);
    this.buttonBottom = document.createElement('div');
    this.buttonBottom.className = 'message-send-bottom';
    this.buttonElement.appendChild(this.buttonBottom);

  
    // Create a container for input and button
    this.inputContainer = document.createElement('div');
    this.inputContainer.id = 'inputContainer';
    this.inputContainer.appendChild(this.messageInputElement);
    // this.inputContainer.appendChild(this.messageInputElement);
    this.inputContainer.appendChild(this.buttonElement);
    if (window.client.socketConnected) {
      this.inputContainer.style.display = 'flex';
    } else {
      this.inputContainer.style.display = 'none';
    }
  
    // Append the elements to the chat div
    this.chatElement.appendChild(this.messagesElement);
    this.chatElement.appendChild(this.inputContainer);

    // In the createChat method
    this.dragDown = document.createElement('div');
    this.dragDown.className = 'drag-down';
    this.dragDown.style.cursor = 'grab'; // Change the cursor to indicate vertical resize
    if (window.client.gloInfo.activeGlotag) {
      this.dragDown.style.backgroundColor = window.client.gloInfo.activeGlotag.metadata.glotagColor;
      this.dragDown.style.boxShadow = window.client.gloInfo.activeGlotag.metadata.boxShadow;
    }
    this.chatElement.appendChild(this.dragDown);

    //dragdown lines
    this.dragDownLine1 = document.createElement('div');
    this.dragDownLine1.className = 'drag-down-line';
    this.dragDownLine2 = document.createElement('div');
    this.dragDownLine2.className = 'drag-down-line';
    this.dragDownLine3 = document.createElement('div');
    this.dragDownLine3.className = 'drag-down-line';
    this.dragDown.appendChild(this.dragDownLine1);
    this.dragDown.appendChild(this.dragDownLine2);
    this.dragDown.appendChild(this.dragDownLine3);

    // Add event listeners for mousedown, mousemove, and mouseup events
    let startY, startHeight;

    this.dragDown.addEventListener('mousedown', (e) => {
      startY = e.clientY;
      startHeight = parseFloat(getComputedStyle(this.chatElement, null).getPropertyValue('height').replace('px', ''));
      document.addEventListener('mousemove', resize);
      document.addEventListener('mouseup', stopResize);
    });

    const resize = (e) => {
      let newHeight = startHeight + e.clientY - startY;
      let maxHeight = window.innerHeight * 0.93; // 95% of the viewport height

      if (newHeight < 389) newHeight = 389;
      if (newHeight > maxHeight) newHeight = maxHeight;

      this.chatElement.style.height = newHeight + 'px';
    };

    const stopResize = () => {
      document.removeEventListener('mousemove', resize);
      document.removeEventListener('mouseup', stopResize);
    };
  
    // Append the chat div to the body
    document.body.appendChild(this.chatElement);

    // Style the toggle button to look like a black circle with three white dots
    this.toggleButton = document.createElement('div'); // Change to 'div' to allow child elements
    this.toggleButton.id = 'toggleButton';
    this.toggleButton.style.position = 'absolute';
    this.toggleButton.style.top = '3.25vh';
    this.toggleButton.style.right = '21.5vw';
    this.toggleButton.style.width = '50px'; // Example size, adjust as needed
    this.toggleButton.style.height = '50px';
    this.toggleButton.style.backgroundImage = 'url(/style/graphics/chat.png)';
    this.toggleButton.style.backgroundSize = '100%';
    this.toggleButton.style.display = 'flex';
    this.toggleButton.style.alignItems = 'center';
    this.toggleButton.style.justifyContent = 'center';
    this.toggleButton.style.cursor = 'pointer';
    this.toggleButton.style.zIndex = '3';
    this.toggleButton.style.opacity = '0.95';

    // Create the three dots inside the toggle button
    for (let i = 0; i < 3; i++) {
      let dot = document.createElement('div');
      dot.style.width = '8px';
      dot.style.height = '8px';
      dot.style.marginBottom = '10px';
      dot.style.backgroundColor = 'white';
      dot.style.borderRadius = '50%';
      if (i === 1) { // Middle dot, no margin needed
        this.toggleButton.appendChild(dot);
        dot.style.marginBottom = '10px';
      } else {
        dot.style.margin = '0 4px';
        this.toggleButton.appendChild(dot);
        dot.style.marginBottom = '10px';
      }
    }

    // Append the toggle button to the body
    document.body.appendChild(this.toggleButton);
    
    // Call the function initially to set the position
    this.updateToggleButtonPosition();

    // Update the position whenever the window is resized
    window.addEventListener('resize', () => this.updateToggleButtonPosition());

    if (this.isChatVisible === false) {
      this.chatElement.style.height = '96px';
      this.messagesElement.style.marginTop = '0';
      this.messagesElement.style.marginBottom = '0';
      this.messagesElement.style.display = 'none';
      Array.from(this.chatElement.children).forEach(child => {
        child.style.opacity = '0';
        child.style.display = 'none';
      });
    }
  }

  newPinnedMessage(pinnedMessage) {
    pinnedMessage.pinned = true;
    const message = new Message(pinnedMessage)
    const messageElement = message.render();
  }

  updateToggleButtonPosition() {
    // Get the bounding rectangle of the chat element
    const chatRect = this.chatElement.getBoundingClientRect();
    console.log('chatRect', chatRect);

    // Calculate the right position for the toggle button
    const rightPosition = window.innerWidth - chatRect.left + 40;
    console.log('rightPosition', rightPosition);

    // Set the right style of the toggle button
    this.toggleButton.style.right = `${rightPosition}px`;
  }

   // Define the animation function
   animateDots() {
    // Select the dots
    const dots = this.toggleButton.querySelectorAll('div');

    // Define the animation sequence for the dots
    gsap.timeline({ paused: true })
      .to(dots, {
        duration: 0.3,
        y: -5,
        stagger: 0.1,
        ease: 'power1.inOut',
      })
      .to(dots, {
        duration: 0.3,
        y: 0,
        stagger: 0.1,
        ease: 'power1.inOut',
      })
      // You can add more animations here if desired
      .play(); // Play the animation sequence
  }

  createGuestChat() {
    const infoElement = document.createElement('p');
    infoElement.textContent = 'Log in to view chat';
    this.messagesElement.appendChild(infoElement);
  }


  toggleChat() {
    this.animateDots();
    this.buttonClickAnimation(); // Add the 3D click effect here

    if (this.isChatVisible) {
      // Create a timeline for simultaneous animations when hiding the chat
      let tl = gsap.timeline({
        onComplete: () => {
          this.isChatVisible = false;
          // Save the new state to localStorage
          localStorage.setItem('isChatVisible', this.isChatVisible);
        }
      });

      tl.to(this.chatElement, {
        duration: 0.33,
        height: '96px', // Adjust this height so it fits the input bar and send button
        ease: "power1.inOut"
      })
      .to(this.messagesElement, {
        duration: 0.33,
        marginTop: '0', // Reduce the margin-top of messagesElement to 0
        marginBottom: '0',
        display: 'none',
        ease: "power1.inOut"
      }, "<") // "<" means start at the same time as the previous animation
      .to(this.chatElement.children, {
        duration: 0.33,
        opacity: 0,
        ease: "power1.inOut"
      }, "<"); // Fade out the elements appended to chatElement

    } else {
      // Create a timeline for simultaneous animations when showing the chat
      let tl = gsap.timeline({
        onStart: () => {
          this.chatElement.style.display = 'flex';
          document.getElementById('pinnedBG').style.display = 'flex';
          this.chatElement.style.height = '75px'; // Start as a slightly thicker line
        },
        onComplete: () => {
          this.isChatVisible = true;
          // Save the new state to localStorage
          localStorage.setItem('isChatVisible', this.isChatVisible);
        }
      });

      tl.to(this.chatElement, {
        duration: 0.33,
        height: '93vh', // Expand to a slightly larger height
        ease: "power1.inOut"
      })
      .to(this.messagesElement, {
        duration: 0.33,
        marginTop: '67.5%', // Reset to 25%
        marginBottom: '5%',
        display: 'block',
        ease: "power1.inOut"
      }, "<") // "<" means start at the same time as the expansion of chatElement
      .to(this.chatElement.children, {
        duration: 0.33,
        opacity: 1,
        ease: "power1.inOut",
      }, "<"); // Fade in the elements appended to chatElement
    }
  }
  
  buttonClickAnimation() {
    // Create a 3D press effect on click
    gsap.to(this.toggleButton, {
      scale: 0.95, // Slightly scale down the button
      duration: 0.1, // Short duration for quick press effect
      ease: "power1.out", // Smoothing the animation
      onComplete: () => {
        // Scale back to normal after the press
        gsap.to(this.toggleButton, { scale: 1, duration: 0.1, ease: "power1.in" });
      }
    });
  }   

  switchToChat() {
    this.messagesElement.innerHTML = ''; // Clear the base chat content
    this.inputContainer.style.display = 'flex';
  }

  loadChatHistory() {
    window.client.socket.emit('load_chat_history');
  }

  // async handleChatClick(walletID) {
  //   if (window.glotag.gloPage == 'player') {
  //     if (walletID == window.client.gloInfo.walletID) {
  //       window.glotag.backToClientPage()
  //       return;
  //     }
  //   }

  //   // Make a request to the '/api/chatters/:walletID' endpoint
  //   const response = await fetch(`/api/chatters/${walletID}`);
  //   const activeInfo = await response.json();

  //   window.client.switchingPlayers = true;

  //   let activePlayer = new Player('player_page', activeInfo);
  //   window.client.storeActivePlayer(activePlayer);

  //   window.glotag.gloPage = 'player';
  //   window.glotag.glotagMode = 'player';
  //   window.glotag.handleGlotagMode();
  // }

  newMessage(data) {
    console.log('newmessage data:',  data);
    if (!data || !data.message) return;

    // Set data.playerInfo to window.client.gloPlayerInfo
    if (!data.playerInfo) data.playerInfo = window.client.gloPlayerInfo;

    console.log('creating new message object')
    const message = new Message(data);
    this.messages.push(message);
    console.log('new message object created', this.messages)

    // Render the message and append it to messagesElement
    console.log('rendering message')
    const messageElement = message.render();
    console.log('appending message')
    this.messagesElement.appendChild(messageElement); 

    // Add a hover event listener to scale the messageElement with GSAP
    messageElement.addEventListener('mouseenter', () => {
      gsap.to(messageElement, { scale: 1.01, duration: 0.25 });
    });

    // Add a mouseleave event listener to scale the messageElement back to its original size
    messageElement.addEventListener('mouseleave', () => {
      gsap.to(messageElement, { scale: 1.0, duration: 0.25 });
    });
  }

  sendMessage() {
    const message = this.messageInputElement.value;
    const username = window.client.gloInfo.username;
    const pfp = window.client.gloInfo.pfp;
    const walletID = window.client.gloInfo.walletID;

    // initialize reactions
    const reactions = {
      "thumbs_up": { count: 0, users: [], name: 'default' },
      "thumbs_down": { count: 0, users: [], name: 'default' }
    };
    
    // Check if the message is a reply
    const isReply = this.messageInputElement.hasAttribute('data-reply-to-username');
    const replyUsername = isReply ? this.messageInputElement.getAttribute('data-reply-to-username') : null;
    const replyText = isReply ? this.messageInputElement.getAttribute('data-reply-to-text') : null;

    this.messageInputElement.placeholder = "Type your message...";
    this.messageInputElement.removeAttribute('data-reply-to-username');
    this.messageInputElement.removeAttribute('data-reply-to-text');
    
    if (window.client.sessionCreated) {
        window.client.socket.emit('send_message', { walletID, username, pfp, message, type: isReply ? 'reply' : 'normal', replyUsername, replyText, reactions });
        console.log('sending message', message)
        this.messageInputElement.value = '';
    } else {
        this.messageInputElement.value = 'Sign in bitch';
    }
  }



  registerEventListeners() {
    this.buttonElement.addEventListener('click', () => this.sendMessage());

    this.messageInputElement.addEventListener('keydown', (event) => {
      if (event.keyCode === 13 || event.key === 'Enter') {
          event.preventDefault(); // Prevents the default action of the enter key
          this.sendMessage();
      }
    });
  }

  deleteMessage(messageId) {
    // Find and remove the message object from the messages array
    this.messages = this.messages.filter(message => message.id !== messageId);

    // Find and remove the message element from the DOM
    const messageElement = document.querySelector(`.message[data-id="${messageId}"]`);
    if (messageElement) {
      messageElement.remove();
    }
  }

  updateMessageReaction(messageId, updatedReaction) {
    // Validate that updatedReaction is neither undefined nor null
    if (!updatedReaction) {
        console.error("updatedReaction is not defined:", updatedReaction);
        return;
    }
    
    // Find the message in the chat's messages array
    const message = this.messages.find(msg => msg.id === messageId);
    if (message) {
      // Merge the updated reaction data with the existing reactions
      console.log('updating message reactions', message.reactions);
      
      for (const [reactionType, reactionData] of Object.entries(updatedReaction)) {
        message.reactions[reactionType] = {
          ...message.reactions[reactionType],
          ...reactionData
        };
      }
      
      console.log('updated message reactions', message.reactions);
  
      // Update the reactions display for this message
      message.updateReactionDisplay();
    }
  }
}

class Message {
  constructor(data) {
    this.id = data.id; // Assuming each message has a unique ID
    this.walletID = data.walletID;
    this.username = data.username;
    this.playerInfo = data.playerInfo;
    console.log('player info', data.playerInfo)
    this.text = data.message;
    this.timestamp = data.timestamp
    this.type = data.type || 'normal'; 
    this.pfp = '/style/graphics/pfp.png';
    this.glotag = 'black';
    this.textColor = 'white';
    if (data.playerInfo.activeNfts) this.initNfts(data);
    this.replyText = data.replyText || null;
    this.replyUsername = data.replyUsername || null;
    this.reactions = data.reactions || {
      thumbs_up: { count: 0, users: [] },
      thumbs_down: { count: 0, users: [] }
    };
    this.replyState = false;
    if (data.pinned) this.pinned = true;

    this.checkFriend();
  }

  async initNfts() {
    if (!this.playerInfo) return;
    this.nftsInitialized = false;

    try {
      await this.setPfp();
      await this.setGlotag();
      this.nftsInitialized = true;
      this.setNfts();
    } catch (error) {
      console.error('Error loading NFT:', error);
    }
  }

  async setPfp() {
    return new Promise((resolve, reject) => {
      if (this.playerInfo.activeNfts.pfp) {
        console.log('Player instance has a set pfp');
        let pfp = window.client.loadedNfts?.get(this.playerInfo.activeNfts.pfp);

        if (!pfp) {
          console.log('Player instance pfp not loaded, fetching metadata for', this.playerInfo.activeNfts.pfp);
          this.fetchUserNftMetadata(this.playerInfo.activeNfts.pfp, 'pfp');

          window.client.socket.once('return_pfp_metadata', (metadata) => {
            if (metadata && metadata.type) {
              console.log('Received metadata for pfp', metadata);
              this.pfp = `/style/graphics/token_images${metadata.mainImg}.webp`;
              window.client.addToLoadedNfts([{ tokenId: this.playerInfo.activeNfts.pfp, metadata }]);
              resolve();
            } else {
              reject('Metadata type is undefined.');
            }
          });
        } else {
          console.log('Player instance pfp already loaded', pfp.metadata.mainImg);
          this.pfp = `/style/graphics/token_images${pfp.metadata.mainImg}.webp`;
          resolve();
        }
      } else {
        console.log('Player instance has no active pfp');
        this.pfp = '/style/graphics/pfp.png';
        resolve();
      }
    });
  }

  setNfts() {
    if (this.glotagContainer) {
      this.glotagContainer.style.background = this.glotag;
      this.glotagContainer.style.backgroundSize = 'cover';
    }
    if (this.pfpElement) this.pfpElement.src = this.pfp;
    if (this.usernameElement) this.usernameElement.style.color = this.textColor;
  }

  async setGlotag() {
    return new Promise((resolve, reject) => {
      if (this.playerInfo.activeNfts.glotag) {
        console.log('Player instance has a set glotag');
        let glotag = window.client.loadedNfts?.get(this.playerInfo.activeNfts.glotag);

        if (!glotag) {
          console.log('Player instance glotag not loaded, fetching metadata for', this.playerInfo.activeNfts.glotag);
          this.fetchUserNftMetadata(this.playerInfo.activeNfts.glotag, 'glotag');

          window.client.socket.once('return_glotag_metadata', (metadata) => {
            if (metadata) {
              console.log('Received metadata for glotag', metadata);
              this.glotag = `url(/style/graphics/token_images${metadata.mainImg}.webp)`;
              this.textColor = metadata.textColor;
              window.client.addToLoadedNfts([{ tokenId: this.playerInfo.activeNfts.glotag, metadata }]);
              resolve();
            } else {
              reject('Metadata type is undefined.');
            }
          });
        } else {
          console.log('Player instance glotag already loaded', glotag.metadata.mainImg, glotag.metadata.textColor, glotag.metadata);
          this.glotag = `url(/style/graphics/token_images${glotag.metadata.mainImg}.webp)`;
          this.textColor = glotag.metadata.textColor;
          resolve();
        }
      } else {
        console.log('Player instance has no active glotag');
        this.glotag = 'black';
        this.textColor = 'white';
        resolve();
      }
    });
  }

  checkFriend() {
    if (!window.client.gloSession) return;
    if (window.client.gloInfo.friendRequestsSent.includes(this.walletID)) {
      this.clientRequest = true;
      return;
    }

    if (window.client.gloInfo.friends.includes(this.walletID)) {
      this.clientFriend = true;
    } else {
      this.clientFriend = false;
    }
  }

  render() {
    if (!this.nftsInitialized) {
      console.log('NFTs not initialized, returning');
      setTimeout(() => this.render(), 50);
    }
    console.log('rendering')
    this.messageElement = document.createElement('div');
    this.messageElement.classList.add('message');
    this.messageElement.setAttribute('data-id', this.id);
    this.messageElement.style.borderBottom = '1px solid #ccc';
    this.messageElement.style.background = '#d7dcda';
    this.messageElement.style.borderRadius = '10px';
    this.messageElement.style.marginBottom = '10px';
    this.messageElement.style.display = 'flex';
    this.messageElement.style.flexDirection = 'row';
    this.messageElement.style.alignItems = 'flex-start';
    this.messageElement.style.position = 'relative';
    this.messageElement.style.border = '2px solid rgb(206, 206, 206)'; // Add this line
    this.messageElement.style.width = '200px';
    this.messageElement.style.overflow = 'visible';

    // Message content container
    const contentContainer = document.createElement('div');
    contentContainer.style.flexGrow = '1'; // Allow it to take remaining width

    // New container for text
    const textContainer = document.createElement('div');
    textContainer.id = 'textContainer';
    textContainer.style.display = 'flex'; 
    textContainer.style.alignItems = 'center';
    textContainer.style.flexWrap = 'wrap';
    textContainer.style.position = 'relative';
    textContainer.style.left = '3.5%';
    textContainer.style.width = '93%';
    textContainer.style.marginTop = '16.5%';
    textContainer.style.marginBottom = '9%';
    textContainer.style.flexGrow = '1'; // Allow it to expand

    // New container for glotag (pfp + username + glotag background)
    this.glotagContainer = document.createElement('div');
    this.glotagContainer.id = 'glotagContainer';
    this.glotagContainer.style.width = '115px';
    this.glotagContainer.style.height = '30px';
    this.glotagContainer.style.borderRadius = '10px';
    this.glotagContainer.style.display = 'flex';
    this.glotagContainer.style.alignItems = 'center';
    this.glotagContainer.style.position = 'absolute';
    this.glotagContainer.style.top = '3px';
    this.glotagContainer.style.left = '3px';
    this.glotagContainer.style.flexGrow = '1'; // Allow it to expand
    this.glotagContainer.style.background = this.glotag;
    this.glotagContainer.style.backgroundSize = 'cover';
    this.glotagContainer.addEventListener('click', this.handleGlotagClick.bind(this));
    contentContainer.appendChild(this.glotagContainer);

    //date container
    const dateContainer = document.createElement('div');
    dateContainer.id = 'dateContainer';
    dateContainer.style.position = 'absolute';
    dateContainer.style.top = '25px';
    dateContainer.style.width = '65px';
    dateContainer.style.display = 'flex';
    dateContainer.style.justifyContent = 'center';
    dateContainer.style.alignItems = 'center';
    contentContainer.appendChild(dateContainer);

    // Create a new Date object from the timestamp
    const messageDate = new Date(this.timestamp);
    // Options for toLocaleDateString
    const dateOptions = { month: 'numeric', day: 'numeric' };
    // Convert the date to the local date
    const localDate = messageDate.toLocaleDateString(undefined, dateOptions);
    // Options for toLocaleTimeString
    const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
    // Convert the time to the local time
    const localTime = messageDate.toLocaleTimeString(undefined, timeOptions).replace(/ /, '');
    // Create a new element to display the date and time
    const dateTimeElement = document.createElement('span');
    dateTimeElement.textContent = `${localDate} ${localTime}`;
    // Style the dateTimeElement as needed
    dateTimeElement.style.fontSize = '0.5rem';
    if (window.client.gloInfo.activeGlotag) {
      dateTimeElement.style.color = window.client.gloInfo.activeGlotag.metadata.highlightColor;
    } else {
      dateTimeElement.style.color = '#545454';
    }
    dateTimeElement.style.textAlign = 'center';

    // Append the dateTimeElement to the dateContainer
    dateContainer.appendChild(dateTimeElement);

    //button container
    const chatButtonContainer = document.createElement('div');
    chatButtonContainer.id = 'chatButtonContainer';
    chatButtonContainer.style.position = 'absolute';
    chatButtonContainer.style.top = '3px';
    chatButtonContainer.style.right = '3px';
    chatButtonContainer.style.width = '60px';
    chatButtonContainer.style.display = 'flex';
    chatButtonContainer.style.justifyContent = 'space-between';
    contentContainer.appendChild(chatButtonContainer);

    // Profile picture
    this.pfpElement = document.createElement('img');
    console.log('setting chat user pfp', this.pfp)
    this.pfpElement.src = this.pfp;
    console.log('pfp set')
    this.pfpElement.style.width = '25px';
    this.pfpElement.style.height = '25px';
    this.pfpElement.style.borderRadius = '50%'; // Circle shape
    this.pfpElement.style.marginRight = '10px';
    this.pfpElement.style.marginLeft = '5%';
    this.pfpElement.style.alignSelf = 'center';
    this.glotagContainer.appendChild(this.pfpElement);

    // Username
    this.usernameElement = document.createElement('span');
    this.usernameElement.textContent = this.username.length > 15 ? this.username.substring(0, 8) + '...' + this.username.substring(this.username.length - 5) : this.username;
    this.usernameElement.style.fontWeight = 'bold';
    this.usernameElement.style.fontFamily = 'Gabarito';
    this.usernameElement.style.color = this.textColor;
    this.usernameElement.style.fontSize = '1rem';
    this.glotagContainer.appendChild(this.usernameElement);
    console.log('glotagContainer set')

    // Message text
    const textElement = document.createElement('span');
    textElement.textContent = this.text;
    textElement.style.fontStyle = 'italic';
    textElement.style.display = 'block';
    textElement.style.fontFamily = 'Gabarito';
    textElement.style.color = '#545454';
    textElement.style.fontSize = '1rem';
    textElement.style.overflowWrap = 'anywhere'; // Add this line
    textElement.style.width = '89%';
    textContainer.appendChild(textElement);
    console.log('text element set')

    // Modify visuals if type is 'reply'
    if (this.type === 'reply' && this.replyText) {
      const originalMessageElement = document.createElement('div');
      originalMessageElement.id = 'originalMessageElement';
      originalMessageElement.style.padding = '4px';
      originalMessageElement.style.borderRadius = '10px';
      originalMessageElement.style.marginTop = '20%';
      originalMessageElement.style.fontSize = '0.8em';
      originalMessageElement.style.position = 'absolute';
      originalMessageElement.style.marginLeft = '12%';
      originalMessageElement.style.overflow = 'hidden'; 
      originalMessageElement.style.fontFamily = 'gabarito';
      originalMessageElement.style.textOverflow = 'ellipsis';
      originalMessageElement.style.whiteSpace = 'nowrap'; 
      originalMessageElement.style.width = '93.5%';

      const replyUsernameElement = document.createElement('span');
      replyUsernameElement.textContent = this.replyUsername + ": ";
      replyUsernameElement.style.fontWeight = 'bold';
      replyUsernameElement.style.fontFamily = 'gabarito';
      originalMessageElement.appendChild(replyUsernameElement);

      const replyTextElement = document.createElement('span');
      replyTextElement.textContent = this.replyText;
      replyTextElement.style.fontFamily = 'gabarito';
      replyTextElement.style.fontStyle = 'italic';
      originalMessageElement.appendChild(replyTextElement);

      this.messageElement.appendChild(originalMessageElement);
      textContainer.style.marginTop = '30%';

      //add reply indicator
      const replyIndicator = document.createElement('img');
      replyIndicator.src = '/style/graphics/replyicon.webp';
      replyIndicator.style.height = '15px';
      replyIndicator.style.marginRight = '5px';
      replyIndicator.style.opacity = '0.5'
      textContainer.prepend(replyIndicator);    
    }
    
    this.messageElement.appendChild(contentContainer);

    if (this.pinned) {
      // Check if pinnedBG already exists
      let pinnedBG = document.getElementById('pinnedBG');
      
      // If it doesn't exist, create it
      if (!pinnedBG) {
        //pinned background
        const pinnedBG = document.createElement('div');
        pinnedBG.id = 'pinnedBG';
        pinnedBG.style.position = 'absolute';
        pinnedBG.style.top = '110px';
        pinnedBG.style.left = '5%';
        pinnedBG.style.height = '110px';
        pinnedBG.style.width = '89%';
        pinnedBG.style.backgroundColor = '#ffcf00d9';
        pinnedBG.style.boxShadow = '0 0 10px 10px #ffcf00d9';
        pinnedBG.style.borderRadius = '8px';
        pinnedBG.style.color = '#fff5c8';
        console.log('poopiop');
        console.log(window.chat); // Log the entire window.chat object
        console.log(window.chat?.isChatVisible);
        pinnedBG.style.display = window.chat.isChatVisible === false ? 'none' : 'block';
        const pinnedBadge = document.createElement('div');
        pinnedBadge.className = 'point-burst';
        pinnedBadge.style.cursor = 'pointer';
        pinnedBG.appendChild(pinnedBadge);
        const pinnedI = document.createElement('span');
        pinnedI.innerText = 'i';
        pinnedI.style.position = 'absolute';
        pinnedI.style.rotate = '-20deg';
        pinnedI.style.fontSize = '11px';
        pinnedI.style.fontFamily = 'Gabarito';
        pinnedI.style.fontWeight = '900';
        pinnedI.style.left = '44%';
        pinnedBadge.appendChild(pinnedI);
        // Create tooltip
        const tooltip = document.createElement('div');
        tooltip.innerText = 'The message reacted to by the most people will be pinned here';
        tooltip.style.position = 'absolute';
        tooltip.style.top = '141px';
        tooltip.style.right = '47px';
        tooltip.style.zIndex = '8';
        tooltip.style.color = 'white';
        tooltip.style.background = 'rgb(200, 166, 28)';
        tooltip.style.width = '275px';
        tooltip.style.height = '75px';
        tooltip.style.padding = '20px';
        tooltip.style.fontFamily = 'Gabarito';
        tooltip.style.fontWeight = '900';
        tooltip.style.lineHeight = '1.5';
        tooltip.style.fontSize = '18px';
        tooltip.style.display = 'none'; // Initially hide the tooltip
        document.body.appendChild(tooltip);

        // Add mouseover event listener to pinnedI
        pinnedBadge.addEventListener('mouseover', () => {
          tooltip.style.display = 'flex'; // Show the tooltip
        });

        // Add mouseout event listener to pinnedI
        pinnedBadge.addEventListener('mouseout', () => {
        tooltip.style.display = 'none'; // Hide the tooltip
        });

        const pinnedLabel = document.createElement('span');
        pinnedLabel.style.position = 'absolute';
        pinnedLabel.style.left = '50%';
        pinnedLabel.style.transform = 'translateX(-50%)';
        pinnedLabel.style.fontFamily = 'Gabarito';
        pinnedLabel.style.color = '#c8a61c';
        pinnedLabel.innerText = 'PINNED';
        pinnedLabel.style.fontWeight = '900';
        pinnedLabel.style.fontSize = '14px';
        pinnedBG.appendChild(pinnedLabel);
        window.chat.messagesElement.appendChild(pinnedBG);
        this.messageElement.id = 'pinnedMessage';
        this.messageElement.style.border = '';
        this.messageElement.style.boxShadow = '0px 0px 6px 2px #9f6f10';
        this.messageElement.style.height = '80px';
        this.messageElement.style.background = 'radial-gradient(at right bottom, #543602 0%, #896122 10%, rgb(179, 143, 66) 25%, rgb(179, 143, 66) 40%, transparent 80%), radial-gradient(at left top, #ffffff 0%, #ffffac 8%, rgb(209, 180, 100) 25%, rgb(127, 106, 63) 62.5%, rgb(127, 106, 63) 100%)';
        this.messageElement.style.top = '23%';
        pinnedBG.appendChild(this.messageElement);
        dateTimeElement.style.color = '#c8a61c';
        textElement.style.color = 'rgb(255, 216, 58)';
      } else {
        pinnedBG.style.display = 'flex';
        pinnedBG.style.display = window.chat.isChatVisible === false ? 'none' : 'flex';
      }
    }

    const currentUser = window.client?.gloInfo?.username || 'guest';

  // Create a delete button and add it to the message element only if the user is the message author
  // Create a delete button and add it to the message element only if the user is the message author
  if (currentUser === this.username) {
    dateContainer.style.left = '-75px';
    contentContainer.appendChild(textContainer);
    console.log('apending textcontainerr in currentuser = this.username');
    this.messageElement.style.right = '-95px';
    const deleteButton = document.createElement('img'); // Changed from 'button' to 'img'
    deleteButton.src = '/style/graphics/chatxicon.webp'; // Path to your delete icon
    deleteButton.classList.add('delete-button');
    deleteButton.style.display = 'flex'; // Hide the button initially
    deleteButton.style.cursor = 'pointer'; // Change cursor to pointer on hover
    deleteButton.style.width = '20px'; // Set the width of the icon
    deleteButton.style.height = '20px'; // Set the height of the icon
    deleteButton.style.position = 'absolute';
    deleteButton.style.right = '3px';
    deleteButton.addEventListener('click', () => this.delete());

    chatButtonContainer.appendChild(deleteButton);
  } else {
      dateContainer.style.right = '-75px';
      this.messageElement.style.left = '0';
      if (!this.clientFriend) {
        const addButton = document.createElement('img');
        addButton.classList.add('add-button');
        addButton.style.display = 'flex'; // Hide the button initially
        addButton.style.transform = 'rotate(135deg)'; // Rotate the image 90 degrees
        addButton.style.height = '1.5vh';
        addButton.style.cursor = 'pointer';
        addButton.style.position = 'relative';
        if(this.pinned){
          addButton.style.filter = 'sepia(1) saturate(4) hue-rotate(14deg) brightness(1.6)';
        }
        const addButtonClick = () => {
          gsap.to(addButton, {
            opacity: 0,
            rotation: 0,
            duration: 0.5,
            onComplete: () => {
              addButton.src = '/style/graphics/check.webp';
              gsap.to(addButton, {
                opacity: 1,
                rotation: 0,
                duration: 0.5,
                onComplete: () => {
                  // Remove the event listener
                  addButton.removeEventListener('click', addButtonClick);
                }
              });
            }
          });
          this.requestFriend();
        }

        if (this.clientRequest) {
          addButton.src = '/style/graphics/check.webp';
          addButton.style.transform = 'rotate(0deg)';
        } else {
          addButton.src = '/style/graphics/chatxicon.webp';
          addButton.addEventListener('click', addButtonClick);
        }
  
        chatButtonContainer.appendChild(addButton);
      }

      // Create the reply button
      const replyButton = document.createElement('img');
      replyButton.src = '/style/graphics/replyicon.webp';
      replyButton.classList.add('reply-button'); // Assuming you want it to look the same
      replyButton.style.display = 'flex'; // Hide the button initially
      replyButton.style.height = '1.75vh';
      replyButton.style.cursor = 'pointer';
      replyButton.style.position = 'relative';
      replyButton.addEventListener('click', () => this.reply());

      chatButtonContainer.appendChild(replyButton); // Add reply button to the container

      contentContainer.appendChild(textContainer);
      console.log('appending textcontainer in else');

      // Create the '*' button for reaction functionality
      const reactionButton = document.createElement('img');
      reactionButton.id = 'reactionButton';
      reactionButton.className = 'reactionButton';
      reactionButton.src = '/style/graphics/reactionicon.webp';
      reactionButton.style.height = '1.75vh';
      reactionButton.classList.add('reaction-button');
      reactionButton.style.display = 'flex'; // Hide the button initially
      reactionButton.style.position = 'relative';
      reactionButton.style.cursor = 'pointer';
      reactionButton.style.zIndex = '3';
      reactionButton.addEventListener('click', (event) => this.react(event.target));

      chatButtonContainer.appendChild(reactionButton);

      if(this.pinned){
        replyButton.style.filter = 'sepia(1) saturate(4) hue-rotate(14deg) brightness(1.6)';
        reactionButton.style.filter = 'sepia(1) saturate(4) hue-rotate(14deg) brightness(1.6)';
      }
    }

    // Handle reaction display
    this.updateReactionDisplay();

    return this.messageElement;
  }

  delete() {
    // Include username in delete_message event
    window.client.socket.emit('delete_message', { id: this.id, username: this.username });
  }

  requestFriend() {
    // Send a fetch request to /requestfriend with the message creator's walletID
    fetch('/requestfriend', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ friendWalletID: this.walletID }),
    })
    .then(response => response.json())
    .then(data => {
      console.log('Success:', data);
    })
    .catch((error) => {
      console.error('Error:', error);
    });
  }

  reply() {
    // Set the reply-to data attributes on the message input field
    window.chat.messageInputElement.setAttribute('data-reply-to-username', this.username);
    window.chat.messageInputElement.setAttribute('data-reply-to-text', this.text);
    
    // Update the placeholder to indicate replying
    window.chat.messageInputElement.placeholder = `Replying to ${this.username}: ${this.text}`;
    window.chat.messageInputElement.focus();

    // Use GSAP to animate the scale and box-shadow
    gsap.to(this.messageElement, {scale: 1.05, boxShadow: '2px 4px 6px black', duration: 0.5});

    // Define the event listener
    const clickOutsideListener = (event) => {
      if (this.replyState && event.target.id !== 'inputContainer') {
        // Use GSAP to animate the scale and box-shadow back to their original values
        gsap.to(this.messageElement, {scale: 1, boxShadow: 'none', duration: 0.5});
        this.replyState = false;

        // Remove the placeholder
        window.chat.messageInputElement.placeholder = '';

        // Remove the event listener
        document.removeEventListener('click', clickOutsideListener);
      }
    };

    // Add event listener to the document after the current call stack has cleared
    setTimeout(() => {
      document.addEventListener('click', clickOutsideListener);
    }, 0);

    // Set replyState to true
    this.replyState = true;
  }

  react(reactionButton) {
    // Remove any existing reaction containers
    const existingContainers = document.querySelectorAll('.reaction-container');
    existingContainers.forEach(container => container.remove());

    // Check if the reaction container already exists for this message
    let reactionContainer = this.messageElement.querySelector('.reaction-container');
    
    // If the container doesn't exist, create it and the reaction buttons
    if (!reactionContainer) {
      // Create a container for reaction buttons
      reactionContainer = document.createElement('div');
      reactionContainer.id = 'reaction-container';
      reactionContainer.classList.add('reaction-container');
      reactionContainer.style.position = 'fixed'; // Position relative to the viewport
      reactionContainer.style.zIndex = '5'; // Increase z-index
      reactionContainer.style.display = 'flex';
      reactionContainer.style.flexDirection = 'column';
      reactionContainer.style.background = '#404040';
      reactionContainer.style.opacity = '.95';
      reactionContainer.style.maxHeight = '175px'; // Set max height
      reactionContainer.style.height = 'auto'; // Make height fit content
      reactionContainer.style.width = '125px'; 
      reactionContainer.style.borderRadius = '15px';
      reactionContainer.style.padding = '10px'; // Add padding
      reactionContainer.style.gap = '15px';
      //create standard container
      const standardContainer = document.createElement('div');
      standardContainer.style.display = 'flex';
      standardContainer.style.width = '75%';
      reactionContainer.appendChild(standardContainer);

      //create standard title
      const standardTitle = document.createElement('span');
      standardTitle.innerText = 'STANDARD';
      standardTitle.style.fontFamily = 'gabarito';
      standardTitle.style.color = 'white';
      standardTitle.style.fontSize = '1em';
      standardTitle.style.position= 'absolute';
      standardTitle.style.left = '50%';
      standardTitle.style.transform = 'translateX(-50%)';
      standardContainer.appendChild(standardTitle);

      // Create the thumbs up button
      const thumbsUpButton = document.createElement('img');
      thumbsUpButton.src = window.chat.thumbsUpImageSrc;
      thumbsUpButton.style.width = '4vh';
      thumbsUpButton.style.height = '4vh';
      thumbsUpButton.style.cursor = 'pointer';
      thumbsUpButton.style.position= 'relative';
      thumbsUpButton.style.left = '50%';
      thumbsUpButton.style.transform = 'translateX(-50%)';
      thumbsUpButton.style.marginTop = '20px';
      thumbsUpButton.addEventListener('click', () => {
        this.sendReaction('thumbs_up');
        reactionContainer.remove(); // Remove the container after selection
      });

      // Create the thumbs down button
      const thumbsDownButton = document.createElement('img');
      thumbsDownButton.src = window.chat.thumbsDownImageSrc; 
      thumbsDownButton.style.width = '4vh';
      thumbsDownButton.style.height = '4vh';
      thumbsDownButton.style.cursor = 'pointer';
      thumbsDownButton.style.position= 'relative';
      thumbsDownButton.style.left = '50%';
      thumbsDownButton.style.transform = 'translateX(-50%)';
      thumbsDownButton.style.marginTop = '20px';
      thumbsDownButton.addEventListener('click', () => {
        this.sendReaction('thumbs_down');
        reactionContainer.remove(); // Remove the container after selection
      });
  
      // Append the buttons to the container
      standardContainer.appendChild(thumbsUpButton);
      standardContainer.appendChild(thumbsDownButton);

      // Get the bounding rectangle of the reaction button
      const reactionButtonRect = reactionButton.getBoundingClientRect();
      console.log(reactionButton);
      console.log(reactionButtonRect.left, reactionButtonRect.top);
      console.log(reactionContainer.offsetWidth);
      console.log(window.getComputedStyle(reactionContainer).left, window.getComputedStyle(reactionContainer).top);
      console.log(window.chat.messagesElement.children);

      // Set the position of the reaction container
      reactionContainer.style.left = `${reactionButtonRect.left - reactionContainer.offsetWidth - 65}px`; // 10px to the left of the reaction button
      reactionContainer.style.top = `${reactionButtonRect.top + 20}px`;// Align to the top of the reaction button

      // Append the container to the body element
      window.chat.messagesElement.appendChild(reactionContainer);

      // Add an event listener to the document that removes the reaction container when clicked outside
      const removeReactionContainer = (event) => {
        if (!reactionContainer.contains(event.target)) {
          reactionContainer.remove();
          document.removeEventListener('click', removeReactionContainer); // Remove the event listener
        }
      };
      setTimeout(() => document.addEventListener('click', removeReactionContainer), 0);

      try {
        (async () => {
          await this.importReactions();
          // Code to execute after importReacetions() has completed
        })();
      } catch (error) {
        // Code to execute if importReacetions() throws an error
        console.error(error);
      }


    } else {
      // Toggle the visibility of the existing reaction container
      reactionContainer.style.display = reactionContainer.style.display === 'none' ? 'flex' : 'none';
    }
  }

async importReactions() {
    console.log('importing reactions');

    if (window.client.gloInfo.activeReactions) { 
        let data = window.client.gloInfo.activeReactions;

        // Convert the array to a Set to remove duplicates, then convert it back to an array
        let uniqueActiveReactions = [...new Set(data)];
        console.log('created unique active reactions', uniqueActiveReactions);

        // Create an img element for each file and set the src to the file's URL
        data.forEach((reaction) => {
          let container = document.createElement('div'); // Create a new container for each tokenId
          container.style.display = 'flex';
          container.style.flexDirection = 'column';
          container.style.gap = '5px';
          container.id = reaction.tokenId; // Set the id of the container to the tokenId

          let title = document.createElement('span'); // Create a new span for the title
          title.innerText = reaction.metadata.name.toUpperCase(); // Set the text of the span to the tokenId
          console.log('setting reaction group name', reaction.metadata.name, 'from', reaction)
          title.style.fontFamily = 'gabarito';
          title.style.color = 'white';
          title.style.fontSize = '1em';
          title.style.position = 'relative';
          title.style.textAlign = 'center';
          container.appendChild(title); // Append the title to the container

          let imgContainer = document.createElement('div'); // Create a new container for the images
          imgContainer.style.display = 'flex';
          imgContainer.style.flexDirection = 'row';

          reaction.metadata.reactions.forEach(reactionImg => {
            console.log(reactionImg);
            let img = document.createElement('img');
            img.src = `style/graphics/token_images/reactions/${reaction.metadata.name.toLowerCase()}/${reactionImg}.webp`;
            img.style.display = 'block';
            img.style.height = '25px';
            img.style.width = 'auto';
            img.style.aspectRatio = '1';
            imgContainer.appendChild(img); // Append the image to the imgContainer

            img.addEventListener('click', () => {
              this.sendReaction(reactionImg, reaction.metadata.name);

              const reactionContainer = document.getElementById('reaction-container');
              if (reactionContainer) reactionContainer.remove(); // Remove the container after selection
            });
          });

          container.appendChild(imgContainer); // Append the imgContainer to the container
          document.getElementById('reaction-container').appendChild(container); // Append the new container to the reaction-container
        });
      }
  }
  
  sendReaction(reactionType, nftName = 'default') {
    console.log('reacting to message', reactionType, nftName)
    // Emit a 'react_message' event to the server with the message ID and reaction type
    window.client.socket.emit('react_message', { id: this.id, reaction: reactionType, nftName: nftName, walletID: window.client.gloInfo.walletID });
  }

  updateReactionDisplay() {
    // Ensure the message element is created first
    console.log('updating reaction display', this.reactions, this.messageElement);
    if (!this.messageElement) {
      console.log('!this.messageElement');
      this.render();
    }

    // Find or create the reaction display container element
    if (!this.reactionContainer) {
      console.log('!this.reactionContainer');
      this.reactionContainer = document.createElement('div');
      this.reactionContainer.classList.add('reaction-display-container');
      this.reactionContainer.style.position = 'absolute';
      this.reactionContainer.style.bottom = '5px';
      this.reactionContainer.style.right = '5px';
      this.reactionContainer.style.display = 'flex';
      this.reactionContainer.style.width = '96%';
      this.messageElement.appendChild(this.reactionContainer);
    } 
  
    // Clear existing reactions display
    this.reactionContainer.innerHTML = ''; 
 
    // Guard clause
    if (!this.reactions) return;
 
    // Display updated reactions
    Object.entries(this.reactions).forEach(([type, reactionData]) => {
      const count = reactionData.count;
      console.log("Processing reaction:", type, "with count:", count, "from", reactionData, "using", this.reactions);
      if (count > 0) { // Only display reactions with a count > 0
        const reactionElement = document.createElement('div');
        this.reactionContainer.appendChild(reactionElement);
        reactionElement.classList.add(`reaction-${type}`);
        reactionElement.style.marginRight = '5px';
        reactionElement.style.display = 'flex';
        
        const reactionImage = document.createElement('img');
        reactionElement.appendChild(reactionImage);
        reactionImage.style.width = '15px';
        reactionImage.style.height = '15px';

        // Determine the image src
        if (reactionData.name === 'default') {
          reactionImage.src = type === 'thumbs_up' ? window.chat.thumbsUpImageSrc : window.chat.thumbsDownImageSrc;
        } else if (reactionData.name) {
          reactionImage.src = `/style/graphics/token_images/reactions/${reactionData.name.toLowerCase()}/${type}.webp`;
        } else {
          reactionImage.src = type === 'thumbs_up' ? window.chat.thumbsUpImageSrc : window.chat.thumbsDownImageSrc;
        }
        console.log('set reaction image to', reactionImage.src)
    
        const counter = document.createElement('span');
        reactionElement.appendChild(counter);
        counter.textContent = count;
        counter.style.marginLeft = '2px';
        counter.style.fontFamily = 'gabarito';
        counter.style.fontSize = '0.8em';
        if(this.pinned){
          counter.style.color = '#ffd83a';
        }
      }
    });
  }

  handleGlotagClick() {
    console.log('handling glotag click', this)
    if (!window.client.gloSession) {
      return;
    }

    // handle glotag click
    if (this.walletID === window.client.gloInfo.walletID) {
      window.glotag.handleGloTagClick();
      return;
    }
    console.log('storing active player', this)
    const activePlayer = new Player('', this.playerInfo)
    window.client.storeActivePlayer(activePlayer);

    window.glotag.gloPage = 'player';
    window.glotag.glotagMode = 'player';
    window.glotag.handleGlotagMode();
  }

  fetchUserNftMetadata(id, type) {
    console.log('fetching user nft metdata', id, type)
    if (type) {
      switch (type) {
        case 'pfp':
          window.client.socket.emit('get_pfp_metadata', id);
          break;
        case 'glotag':
          console.log('fetching glotag metadata')
          window.client.socket.emit('get_glotag_metadata', id);
          break;
        default:
          window.client.socket.emit('get_nft_metadata', id);
          break;
      }
      return;
    }
    window.client.socket.emit('get_nft_metadata', id);
  }
}

class Glogo { 
  constructor() {
    this.createGlogo();
    this.createFullscreenButton();
    this.createSuggestionsButton();
    this.showAlphaDeets();
    this.handleGlogoText();
    window.addEventListener('WindowStateChanged', this.handleWindowStateChange.bind(this));
  }

  handleWindowStateChange() {
    this.returning = true;
    this.handleGlogoText();
    this.updateURL();
  }

  updateURL() {
    let newURL;

    switch (window.windowState) {
      case 'home':
        newURL = '/';
        break;
      case 'luncman':
        newURL = '/luncman';
        break;
      case 'nft':
        newURL = '/gloprint';
        break;
      case 'leaderboard':
        newURL = '/leaderboard';
        break;
      case 'marketplace':
        console.log('setting marketplace url', window.nftMachine.gloMartInstance.activePage)
        switch (window.nftMachine.gloMartInstance.activePage) {
          case 'GloMart':
            newURL = '/glomart';
            break;
          case 'Browse':
            newURL = '/glomart/browse';
            break;
          case 'Listing':
            console.log('listing marketplace page')
            break;
          case 'Sell':
            newURL = '/glomart/sell';
            break;  
          case 'Market':
            // if (!this.returning) return;
            // const currentUrl = window.location.href;
            // console.log('current url', currentUrl)
            // let pathArray = currentUrl.split('/');
            // pathArray.pop(); // Remove the last segment
            // newURL = pathArray.join('/');
            // window.nftMachine.gloMartInstance.activePage = 'MarketPool'
            // this.returning = false;
            console.log('setting newUrl', newURL)
            break;
          case 'MarketPool':
            break;
          case 'MarketStand':
            newURL = '/glomart/market';
            break;
          default:
            newURL = '/glomart';
            console.log('default glomart glogo and the active page is:', window.nftMachine.gloMartInstance.activePage);
            break;
        }
        break;
      case 'mint':
        newURL = '/glomint';
        break;      
      default:
        newURL = '/glomint';
        break;
    }

    // Update the URL using the HTML5 History API
    history.pushState({ windowState: windowState }, "", newURL);
  }

  createGlogo() {
    if (this.glogo) return;
    this.glogoContainer = document.createElement('div');
    this.glogoContainer.style.position = "absolute";
    this.glogoContainer.style.top = "1.5vh";
    this.glogoContainer.style.left = "0vw";
    this.glogoContainer.style.width = "17.5vw";
    this.glogoContainer.style.height = "5vh";
    this.glogoContainer.style.display = "flex";
    this.glogoContainer.style.alignItems = "center";
    document.body.appendChild(this.glogoContainer);

    this.glogo = document.createElement('div');
    this.glogo.innerText = 'glo';
    this.glogo.style.color = "white";
    this.glogo.style.fontWeight = "bold";
    this.glogo.style.display = "flex";
    this.glogo.style.marginLeft = "7.5%";
    this.glogo.style.fontSize = "4.5rem";  // Adjust the size if necessary
    this.glogo.style.zIndex = "1";  // Ensure it's on top of other elements
    this.glogo.style.fontFamily = "Gabarito, sans-serif"; // Set the font to Gabarito and fallback to sans-serif
    this.glogo.style.cursor = 'pointer';
    this.glogo.style.webkitTextFillColor = 'transparent';
    this.glogo.style.webkitTextStrokeWidth = '1px';
    this.glogo.style.webkitTextStrokeColor = 'white'; // Or use 'hsl(0, 0%, 100%)' for pure white
    this.glogo.style.textShadow = '0 0 5px hsla(0, 0%, 100%, 0.8), 0 0 2px hsla(0, 0%, 100%, 0.85), 0 0 1px hsla(0, 0%, 100%, 0.9), 0 0 10px hsla(0, 0%, 100%, 0.95), 0 0 5px hsla(0, 0%, 100%, 1)';
    this.glogo.addEventListener('click', this.handleGlogoClick.bind(this));
    this.glogoContainer.appendChild(this.glogo);

    this.glogoHint = document.createElement('div');
    this.glogoHint.innerText = '< back';
    this.glogoHint.style.color = "white";
    this.glogoHint.style.fontWeight = "bold";
    this.glogoHint.style.display = "flex";
    this.glogoHint.style.marginLeft = "7.5%";
    this.glogoHint.style.fontSize = "1.5rem";
    this.glogoHint.style.zIndex = "1";
    this.glogoHint.style.opacity = "0";
    this.glogoHint.style.fontFamily = "Gabarito, sans-serif";
    this.glogoHint.style.cursor = 'pointer';
    this.glogoHint.style.webkitTextFillColor = 'transparent';
    this.glogoHint.style.webkitTextStrokeWidth = '1px';
    this.glogoHint.style.webkitTextStrokeColor = 'white';
    this.glogoHint.style.textShadow = '0 0 5px hsla(0, 0%, 100%, 0.8), 0 0 2px hsla(0, 0%, 100%, 0.85), 0 0 1px hsla(0, 0%, 100%, 0.9), 0 0 10px hsla(0, 0%, 100%, 0.95), 0 0 5px hsla(0, 0%, 100%, 1)';
    this.glogoContainer.appendChild(this.glogoHint);
  }

  createFullscreenButton() {
    if (this.fullscreenButton) return;
    this.fullscreenButton = document.createElement('div');
    this.fullscreenButton.style.backgroundSize = 'cover';
    this.fullscreenButton.style.position = "absolute";
    this.fullscreenButton.style.bottom = "1vh";
    this.fullscreenButton.style.width = "50px";
    this.fullscreenButton.style.height = "50px";
    this.fullscreenButton.style.opacity = "70%";
    this.fullscreenButton.style.right = "1vh";
    this.fullscreenButton.style.zIndex = "1";
    this.fullscreenButton.style.cursor = 'pointer';

    this.setFullscreenIcon();

    this.fullscreenButton.addEventListener('click', this.handleFullscreenClick.bind(this));
    document.addEventListener('fullscreenchange', this.setFullscreenIcon.bind(this));
    document.body.appendChild(this.fullscreenButton);

    this.refreshButton = document.createElement('div');
    this.refreshButton.style.background = 'url(/style/graphics/refresh.webp)';
    this.refreshButton.style.backgroundSize = 'cover';
    this.refreshButton.style.position = "absolute";
    this.refreshButton.style.bottom = "7vh";
    this.refreshButton.style.width = "35px";
    this.refreshButton.style.height = "35px";
    this.refreshButton.style.opacity = "70%";
    this.refreshButton.style.right = "1vh"; // Adjust this value so the button is above the fullscreen button
    this.refreshButton.style.zIndex = "1";
    this.refreshButton.style.cursor = 'pointer';
    this.refreshButton.style.display = 'none'; // Initially hidden
    this.refreshButton.addEventListener('click', () => location.reload());
  
    document.body.appendChild(this.refreshButton);
  }

  setFullscreenIcon() {
    if (document.fullscreenElement) {
      this.fullscreenButton.style.background = 'url(/style/graphics/fullscreen_exit.webp)';
      if (this.refreshButton) this.refreshButton.style.display = 'block'; 
    } else {
      this.fullscreenButton.style.background = 'url(/style/graphics/fullscreen.webp)';
      if (this.refreshButton) this.refreshButton.style.display = 'none';
    }
    this.fullscreenButton.style.backgroundSize = 'cover';
  }

  handleFullscreenClick() {
    if (document.fullscreenElement) {
      localStorage.setItem('fullscreen', 'false');
      document.exitFullscreen();
    } else {
      localStorage.setItem('fullscreen', 'true');
      document.body.requestFullscreen();
    }
  }

  createSuggestionsButton() {
    if (this.suggestionsButton) return;
    this.suggestionsButton = document.createElement('button');
    this.suggestionsButton.className = 'suggestions-button';

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'suggestions-button-svgIcon');
    svg.setAttribute('viewBox', '0 0 384 512');

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M214.6 41.4c-12.5-12.5-32.8-12.5-45.3 0l-160 160c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L160 141.2V448c0 17.7 14.3 32 32 32s32-14.3 32-32V141.2L329.4 246.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-160-160z');

    svg.appendChild(path);
    this.suggestionsButton.appendChild(svg);

    // Add event listener
    this.suggestionsButton.addEventListener('click', () => {
      this.createSuggestionsContainer();
    });

    document.body.appendChild(this.suggestionsButton);
  }

  createSuggestionsContainer() {
    console.log('creating suggestions container');
    if (this.suggestionsContainer) return;
    //container
    this.suggestionsContainer = document.createElement('div');
    this.suggestionsContainer.className = 'suggestions-container';
    document.body.appendChild(this.suggestionsContainer);
    //close button
    this.suggestionsClose = document.createElement('div');
    this.suggestionsClose.innerText = 'x';
    this.suggestionsClose.className = 'suggestions-close';
    this.suggestionsContainer.appendChild(this.suggestionsClose);
    //container title
    this.suggestionsTitle = document.createElement('span');
    this.suggestionsTitle.className = 'suggestions-title';
    this.suggestionsTitle.innerText = 'got feedback?';
    this.suggestionsContainer.appendChild(this.suggestionsTitle);
    //feedback button
    this.feedbackButton = document.createElement('div');
    this.feedbackButton.style.position = 'absolute';
    this.feedbackButton.style.borderRadius = '5px';
    this.feedbackButton.style.height = '175px';
    this.feedbackButton.style.aspectRatio = '1';
    this.feedbackButton.style.top = '23%';
    this.feedbackButton.style.left = '50%';
    this.feedbackButton.style.transform = 'translate(-50%)';
    this.feedbackButton.style.display = 'flex';
    this.feedbackButton.style.flexDirection = 'column';
    this.feedbackButton.style.alignItems = 'center';
    this.feedbackButton.style.border = '1px solid black';
    this.feedbackButton.style.cursor = 'pointer';
    this.feedbackButton.style.transition = 'box-shadow 0.3s ease';
    this.feedbackButton.style.boxShadow = '0 0 10px rgba(255, 255, 255, 0)';
    this.feedbackButton.onmouseover = () => {
      this.feedbackButton.style.boxShadow = '0 0 10px rgba(255, 255, 255, 1)';
    };
    this.feedbackButton.onmouseout = () => {
      this.feedbackButton.style.boxShadow = '0 0 10px rgba(255, 255, 255, 0)';
    };
    this.feedbackButton.onclick = () => {
      this.showInputBox('feedback');
    };
    this.suggestionsContainer.appendChild(this.feedbackButton);
    this.feedbackImg = document.createElement('img');
    this.feedbackImg.style.height = '75%';
    this.feedbackImg.src = '/style/graphics/fb.webp';
    this.feedbackButton.appendChild(this.feedbackImg);
    this.feedbackText = document.createElement('span');
    this.feedbackText.style.fontFamily = 'Gabarito';
    this.feedbackText.innerText = 'feedback';
    this.feedbackText.style.fontSize = '22px';
    this.feedbackButton.appendChild(this.feedbackText);

    //bug button
    this.bugButton = document.createElement('div');
    this.bugButton.style.position = 'absolute';
    this.bugButton.style.borderRadius = '5px';
    this.bugButton.style.height = '175px'
    this.bugButton.style.aspectRatio = '1';
    this.bugButton.style.top = '62%';
    this.bugButton.style.display = 'flex';
    this.bugButton.style.alignItems = 'center';
    this.bugButton.style.flexDirection = 'column';
    this.bugButton.style.left = '50%';
    this.bugButton.style.transform = 'translate(-50%)';
    this.bugButton.style.border = '1px solid black';
    this.bugButton.style.cursor = 'pointer';
    this.bugButton.style.transition = 'box-shadow 0.3s ease';
    this.bugButton.style.boxShadow = '0 0 10px rgba(255, 255, 255, 0)';
    this.bugButton.onmouseover = () => {
      this.bugButton.style.boxShadow = '0 0 10px rgba(255, 255, 255, 1)';
    };
    this.bugButton.onmouseout = () => {
      this.bugButton.style.boxShadow = '0 0 10px rgba(255, 255, 255, 0)';
    };
    this.bugButton.onclick = () => {
      this.showInputBox('report a bug');
    };
    this.suggestionsContainer.appendChild(this.bugButton);
    this.bugImg = document.createElement('img');
    this.bugImg.style.height = '75%';
    this.bugImg.src = '/style/graphics/bug.webp';
    this.bugButton.appendChild(this.bugImg);
    this.bugText = document.createElement('span');
    this.bugText.style.fontFamily = 'Gabarito';
    this.bugText.style.textAlign = 'center';
    this.bugText.innerText = 'report a bug';
    this.bugText.style.fontSize = '22px';
    this.bugButton.appendChild(this.bugText);
    
    // overlay
    this.suggestionsOverlay = document.createElement('div');
    this.suggestionsOverlay.className = 'suggestionsOverlay';
    document.body.appendChild(this.suggestionsOverlay);

    // Add event listener to close button and overlay
    [this.suggestionsClose, this.suggestionsOverlay].forEach(element => {
        element.addEventListener('click', () => {
            this.suggestionsContainer.remove();
            this.suggestionsOverlay.remove();
            this.suggestionsContainer = null;
            this.suggestionsOverlay = null;
        });
    });
  }

  showInputBox(title) {
    // Hide all elements
    this.suggestionsTitle.style.display = 'none';
    this.feedbackButton.style.display = 'none';
    this.bugButton.style.display = 'none';

    //input title
    this.inputTitle = document.createElement('span');
    this.inputTitle.innerText = title;
    this.inputTitle.style.position = 'absolute';
    this.inputTitle.style.left = '50%';
    this.inputTitle.style.transform = 'translateX(-50%)';
    this.inputTitle.style.color = 'black';
    this.inputTitle.style.top = '3%';
    this.inputTitle.style.fontFamily = 'Gabarito';
    this.inputTitle.style.fontSize = '35px';
    this.inputTitle.style.width = '100%';
    this.inputTitle.style.textAlign = 'center';
    this.suggestionsContainer.appendChild(this.inputTitle);
  
    // Create and show text input box
    this.inputBox = document.createElement('textarea');
    this.inputBox.placeholder = title;
    this.inputBox.style.position = 'absolute';
    this.inputBox.style.top = '12%';
    this.inputBox.style.left = '50%';
    this.inputBox.style.transform = 'translateX(-50%)';
    this.inputBox.style.width = '75%';
    this.inputBox.style.height = '75%';
    this.inputBox.style.padding = '10px'; // Add padding
    this.inputBox.style.lineHeight = '1'; // Adjust line height
    this.inputBox.style.boxSizing = 'border-box';
    this.inputBox.style.resize = 'none'; // Prevent resizing
    this.inputBox.style.overflow = 'auto'; // Enable scrolling
    this.inputBox.style.fontFamily = 'Gabarito';
    this.inputBox.style.color = 'white';
    this.inputBox.style.background = 'black';
    this.suggestionsContainer.appendChild(this.inputBox);

    this.inputBox.addEventListener('keydown', function(e) {
      if (e.key === ' ') {
        e.stopPropagation();
      }
    });
  
    // Create and show back button
    this.backButton = document.createElement('div');
    this.backButton.className = 'suggestions-back';
    this.backButton.innerText = '<';
    this.backButton.onclick = () => {
      // Hide text input box and back button
      this.inputBox.remove();
      this.backButton.remove();
      this.suggestionsEnter.remove();
      this.inputTitle.remove();
  
      // Show all elements
      this.suggestionsTitle.style.display = '';
      this.feedbackButton.style.display = 'flex';
      this.bugButton.style.display = 'flex';
    };
    this.suggestionsContainer.appendChild(this.backButton);

    this.suggestionsEnter = document.createElement('button');
    this.suggestionsEnter.className = 'suggestions-enter';
    this.suggestionsEnter.innerText = 'SEND';
    this.suggestionsContainer.appendChild(this.suggestionsEnter);

    this.suggestionsEnter.onclick = () => {
      const input = this.inputBox.value;
      const url = this.inputTitle.innerText.toLowerCase() === 'report a bug' ? '/reportbug' : '/givefeedback';
      console.log(input);
      console.log(url);
      
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input: input }),
      })
      .then(response => {
        if (response.ok) {
          this.handleInputBox('Thank you for your input!');
        } else {
          throw new Error('Network response was not ok');
        }
      })
      .catch((error) => {
        console.error('Error:', error);
        this.handleInputBox('Sorry, an error occurred. Please try again!');
      });
    }
  }

    handleInputBox(result) {
      console.log('handlingInputBox:', result);
      this.inputBox.style.display = 'none';
      this.suggestionsEnter.style.display = 'none';
      this.inputTitle.innerText = result; // Display the result message
      this.inputTitle.style.top = '45%';
    }

    showAlphaDeets() {
      this.alphaDeets = document.createElement('div');
      this.alphaDeets.id = 'alphaDeets';
      this.alphaDeets.style.color = 'white';
      this.alphaDeets.style.textAlign = 'center';
      this.alphaDeets.style.position = 'absolute';
      this.alphaDeets.style.bottom = '1%';
      this.alphaDeets.style.left = '50%';
      this.alphaDeets.style.transform = 'translateX(-50%)';
      this.alphaDeets.style.zIndex = '25';
      document.body.appendChild(this.alphaDeets);
      let version = document.createElement('span');

      version.innerText = 'glo indev v1';
      version.style.color = '#774989';
      this.alphaDeets.appendChild(version);
    }

  handleGlogoText() {
    if (window.windowState == 'marketplace') {
      this.glogo.innerText = 'glomart';
      this.glogo.style.webkitTextStrokeColor = '#39FF14'; // Neon green in hexadecimal
      this.glogo.style.textShadow = '0 0 5px #39FF14, 0 0 2px #39FF14, 0 0 1px #39FF14, 0 0 10px #39FF14, 0 0 5px #39FF14';
      console.log('green glomart');
    } else if (window.windowState == 'mint') {
      this.glogo.innerText = 'glomint';
      this.glogo.style.webkitTextStrokeColor = '#ff8e26'; // Change to #ff8e26
      this.glogo.style.textShadow = '0 0 5px #ff8e26, 0 0 2px #ff8e26, 0 0 1px #ff8e26, 0 0 10px #ff8e26, 0 0 5px #ff8e26'; // Change to #ff5000
      console.log('orange glomint');
    } else if (window.windowState == 'laser') {
      this.glogo.innerText = 'glazer';
      this.glogo.style.webkitTextStrokeColor = 'white'; // Change to #ff8e26
      this.glogo.style.textShadow = '0 0 5px white, 0 0 2px white, 0 0 1px white, 0 0 10px white, 0 0 5px white'; // Change to #ff5000
      console.log('white glazer');
    }
     else {
      this.glogo.innerText = 'glo';
      this.glogo.style.webkitTextStrokeColor = 'white'; // Or use 'hsl(0, 0%, 100%)' for pure white
      this.glogo.style.textShadow = '0 0 5px hsla(0, 0%, 100%, 0.8), 0 0 2px hsla(0, 0%, 100%, 0.85), 0 0 1px hsla(0, 0%, 100%, 0.9), 0 0 10px hsla(0, 0%, 100%, 0.95), 0 0 5px hsla(0, 0%, 100%, 1)';
      console.log('white glo');
    }
  }

  handleGlogoClick() {
    if (window.glogo.disabled) return;
    if (window.windowState == 'home') {
      console.log('home click');
    } else if (window.windowState == 'luncman') {
      console.log('luncman click');
      window.windowState = 'home';
      window.luncMachine.handleState();
      window.leaderboard.handleState();
      window.nftMachine.handleState();
      window.videoBackground.transitionTo('luncman_home', () => {
        const event = new Event('WindowStateChanged');
        window.dispatchEvent(event);
      });
      return;
    } else if (window.windowState == 'leaderboard') {
      console.log('leaderboard click');
      window.windowState = 'home';
      window.leaderboard.handleState();
      window.luncMachine.handleState();
      window.nftMachine.handleState();
      window.videoBackground.transitionTo('leaderboard_home', () => {
        const event = new Event('WindowStateChanged');
        window.dispatchEvent(event);
      });
      return;
    } else if (window.windowState == 'nft') {
      console.log('nft click');
      window.windowState = 'home';
      window.nftMachine.handleState();
      window.leaderboard.handleState();
      window.luncMachine.handleState();
      window.videoBackground.transitionTo('printer_home', () => {
        const event = new Event('WindowStateChanged');
        window.dispatchEvent(event);
      });
      return;
    } else if (window.windowState == 'marketplace') {
      if (window.nftMachine.gloMartInstance.activePage == 'GloMart') {
        console.log('marketplace click');
        window.windowState = 'nft';
        window.nftMachine.gloMartInstance.hideMarketplacePageElements();
        window.videoBackground.transitionTo('glomart_printer', () => {
          window.videoBackground.addSetElement('gloMartCage', 795.58, 705.69, 287.34, 198.86);
          window.videoBackground.addSetElement('gloMintCage', 590.47, 546.03, 374.80, 1105.64);
        });
        const event = new Event('WindowStateChanged');
        window.dispatchEvent(event);
        return;
      } else {
        window.nftMachine.gloMartInstance.handleGloMartClick();
      }
    } else if (window.windowState == 'mint') {
      console.log('mint click');
      window.windowState = 'nft';
      window.nftMachine.gloMintInstance.hideMintPage();
      window.videoBackground.transitionTo('glomint_printer', () => {
        window.videoBackground.addSetElement('gloMartCage', 795.58, 705.69, 287.34, 198.86);
        window.videoBackground.addSetElement('gloMintCage', 590.47, 546.03, 374.80, 1105.64);
      });
      const event = new Event('WindowStateChanged');
      window.dispatchEvent(event);
      return;
    }
    else if (window.windowState == 'laser') {
      if (window.nftMachine.gloMintInstance.nftPrizeMenu) window.nftMachine.gloMintInstance.nftPrizeMenu.remove();
      console.log('glazer click');
      if (window.nftMachine.gloMintInstance.prizeContainer) window.nftMachine.gloMintInstance.prizeContainer.remove();
      window.videoBackground.transitionTo('laser_glomint', () => {
        window.windowState = 'mint';
        this.handleGlogoText();
        window.nftMachine.gloMintInstance.hideGlazer();
      });
      const event = new Event('WindowStateChanged');
      window.dispatchEvent(event);
      return;
    }

    // Dispatch the event on the window object
    const event = new Event('WindowStateChanged');
    window.dispatchEvent(event);
  }
}



class Glotag {
  constructor(glotagMode) {
    this.init();

    this.glotagMode = glotagMode;
    this.handleGlotagMode();

    this.handleGloPage();
    this.updateUI();
  }

  init() {
    this.playerCardCreated = false;
    this.glotagCreated = false;
    this.callingCard = null;
    this.pfpElement = null;
    this.levelDisplay = null;
    this.luncmanDisplay = null;
    this.glotagVisible = false;
    this.username = window.client.gloInfo.username;
    this.glolvl = null;
    this.friends = null;
    this.friendsTitle = null;
    this.friendsList = null;
    this.gloPage = null;

    window.addEventListener('playerActiveNftsUpdated', () => {
      this.updateUI();
    });

    this.initGameStats();

    this.setPlayerDataLoop();
  }

  updateUI() {
    console.log('updating ui')
    this.styleCallingCard();

    if (this.friendsList) {
      this.friendsList.showFriendRequestsSent();
      this.friendsList.showFriendRequestsRecieved();
    }
  }

  handleGlotagMode() {
    if (this.handlingGlotagMode) return;
    this.handlingGlotagMode = true;
    // init gsap state
    let gsapState, gsapStateGloTag, gsapStateChat;  
    switch(this.glotagMode) {
    case 'calling_card':
      console.log('setting glotag to calling card')
      // Capture the state of the elements
      gsapStateGloTag = Flip.getState("#gloTagElement");
      gsapStateChat = Flip.getState("#chat");

      // Hide and setup for calling card mode
      this.hideGlotag();
      this.onCallingCardMode();
      this.styleCallingCard();
      this.hideOutsideDiv();

      // function for chat resize
      Flip.from(gsapStateGloTag, {
        duration: 0.33,
        ease: "power1.inOut",
        absolute: true,
        delay: 0.45, // Add a delay of 0.45 seconds
      }),
      Flip.from(gsapStateChat, {
        duration: 0.33,
        ease: "power1.inOut",
        absolute: true,
        delay: 0.45, // Add a delay of 0.5 seconds
      })
      break;
      // Display glotag in profile mode
      case 'glotag':
        // Capture the state of the elements
        gsapStateGloTag = Flip.getState("#gloTagElement");
        gsapStateChat = Flip.getState("#chat");

        console.log('heaya');

        // Close the chat before it animates to another spot
        if (window.chat && window.chat.chatElement && window.chat.isChatVisible) {
          // Create a timeline for simultaneous animations when hiding the chat
          let tl = gsap.timeline({
            onComplete: () => {
              window.chat.isChatVisible = false;
            }
          });

          tl.to(window.chat.chatElement, {
            duration: 0.33,
            height: '96px', // Adjust this height so it fits the input bar and send button
            ease: "power1.inOut"
          })
          .to(window.chat.messagesElement, {
            duration: 0.33,
            marginTop: '0', // Reduce the margin-top of messagesElement to 0
            marginBottom: '0',
            display: 'none',
            ease: "power1.inOut"
          }, "<") // "<" means start at the same time as the previous animation
          .to(Array.from(window.chat.chatElement.children), {
            duration: 0.33,
            opacity: 0,
            ease: "power1.inOut"
          }, "<"); // Fade out the elements appended to chatElement
        }

        if (window.client.sessionCreated) window.client.getSession();
        this.hideGlotag();
        let reset = false;
        if (!this.glotagCreated) reset = true;
        if (this.playerCardCreated) reset = false;
        this.onGlotagMode(reset);

        console.log('hoowla');

        // Perform the flip animation on the gloTagElement
        Flip.from(gsapStateGloTag, {
          duration: 0.33,
          ease: "power1.inOut",
          absolute: true
        });

        // Perform the flip animation on the chatElement
        Flip.from(gsapStateChat, {
          duration: 0.33,
          ease: "power1.inOut",
          absolute: true
        });
        break;
      case 'player':
        gsapStateGloTag = Flip.getState("#gloTagElement");
        gsapStateChat = Flip.getState("#chat");
        
          // Close the chat before it animates to another spot
          if (window.chat && window.chat.chatElement && window.chat.isChatVisible) {
          // Create a timeline for simultaneous animations when hiding the chat
          let tl = gsap.timeline({
            onComplete: () => {
              window.chat.isChatVisible = false;
            }
          });

          tl.to(window.chat.chatElement, {
            duration: 0.33,
            height: '96px', // Adjust this height so it fits the input bar and send button
            ease: "power1.inOut"
          })
          .to(window.chat.messagesElement, {
            duration: 0.33,
            marginTop: '0', // Reduce the margin-top of messagesElement to 0
            marginBottom: '0',
            ease: "power1.inOut"
          }, "<") // "<" means start at the same time as the previous animation
          .to(Array.from(window.chat.chatElement.children), {
            duration: 0.33,
            opacity: 0,
            ease: "power1.inOut"
          }, "<"); // Fade out the elements appended to chatElement
        }

        this.onPlayerMode();
        this.hideGlotag();
        this.styleCallingCard();

        // Perform the flip animation on the gloTagElement
        Flip.from(gsapStateGloTag, {
          duration: 0.33,
          ease: "power1.inOut",
          absolute: true
        });

        // Perform the flip animation on the chatElement
        Flip.from(gsapStateChat, {
          duration: 0.33,
          ease: "power1.inOut",
          absolute: true
        });
        break;
      case 'guest':
        gsapState = Flip.getState("#gloTagElement");
        console.error('glotag in guest mode')
        this.hideGlotag();
        this.createGuestCard();
        this.hideOutsideDiv();
        Flip.from(gsapState, {
          duration: 0.33,
          ease: "power1.inOut",
          absolute: true
        });
        break;
      default:
        // handle guest card state
        this.createGuestCard();
        this.hideOutsideDiv();
        break;
    }
    this.handlingGlotagMode = false;
  }

  handleGloPage() {
    if (this.glotagMode !== 'glotag' && this.glotagMode !== 'player') return;
    console.log('glotaggg page', this.gloPage)
    if (!this.gloPage) {
      console.error('No Glo Page Found')
    } else {
      console.log('handling glo page', this.gloPage)
      this.createFriendList();
      this.createNftList();
      this.createLuncmanStats();
      this.createWalletsMenu();
      this.createSettingsMenu();
      this.createNftSelectionMenu();
      this.styleCallingCard();
      console.log('handleGloPage on this.glotagMode:', this.glotagMode);
    }
  }

  handleClickOutside() {
    // If there is an active GSAP animation, ignore the click
    if (this.glotagPage.style.width !== '85%') {
      console.log('globaltimeline:', gsap.globalTimeline.isActive());
      return;
    }
    // Check if clicked element is outside the glotagBackground
    console.log('click outside')
    window.chat.isChatVisible = false;

    if (!window.client.sessionCreated) return;
    
    // close glotag
    if (window.client.activePlayer) {
      this.resetToClient();
      return;
    }

    // this.previousGloPage = this.gloPage;
    this.previousGloPage = 'home';
    console.log('set previousGloPage to', this.previousGloPage);
    this.glotagMode = 'calling_card';
    
    this.handleGlotagMode();
  }

  onCallingCardMode() {
    // handle calling card state
    if (!this.playerCardCreated) {
      this.resetCallingCard();
    }
    this.createPlayerCard();
  }

  onGlotagMode(reset) {
    if (reset) {
      this.resetCallingCard();
    }
    // handle glotag state
    this.createPlayerCard();
    this.createGlotagPage();
    this.createOutsideDiv();
    document.getElementById('glotagPageContainer').style.display = 'flex';

    // Set the opacity to 1 after the delay
    gsap.set("#glotagPage", {
      delay: 0.22, // Wait for 0.25 seconds
      x: '-50%',
      y: '-50%',
      opacity: 1 // Then instantly set the opacity to 1
    });

    gsap.to("#glotagPage", {
      scale: 1, // Scale to original size
      top: '50%', // Position at 50% from the top
      left: '50%', // Position at 50% from the left
      width: '85%', // Set width to 85%
      height: '85%', // Set height to 85%
      delay: 0.22, // Delay the start of the animation by 0.25 seconds
      ease: "power1.inOut",
      onComplete: () => {
        console.log('#glotagPage scale animation complete!');
        document.getElementById('glotagPageContainer').style.display = 'flex';
      }
    });
  }

  resetCallingCard() {
    console.log('resetting calling card')
    // Remove the pfpElement, usernameElement, and glotagElement from the DOM if they exist
    if (this.pfpElement && this.glotagElement.contains(this.pfpElement)) {
        this.glotagElement.removeChild(this.pfpElement);
    }
    if (this.usernameElement && this.glotagElement.contains(this.usernameElement)) {
        this.glotagElement.removeChild(this.usernameElement);
    }
    if (this.glotagElement && document.body.contains(this.glotagElement)) {
        document.body.removeChild(this.glotagElement);
    }

    // Reset references
    this.pfpElement = null;
    this.usernameElement = null;
    this.glotagElement = null;
  }

  onPlayerMode() {
    // handle glotag state
    console.log('handling player mode')
    this.resetNfts();
    this.createPlayerCard();
    this.createGlotagPage();
    this.createOutsideDiv();
  }

  resetNfts() {
    const inspectNftContainer = document.getElementById('inspectNftContainer');
    if (inspectNftContainer) {
      inspectNftContainer.remove();
    }

    if (this.nftList) {
      this.nftList.innerText = '';
    }
  }

  createGuestCard() {
    if (!this.glotagElement) {
      this.glotagElement = document.createElement('div');
      this.glotagElement.id = 'gloTagElement';
      this.glotagElement.className = 'glotag-element';
      this.glotagElement.style.opacity = '0.9';
    }
    document.body.appendChild(this.glotagElement);
    this.glotagElement.style.background = 'black';
    console.log('set client active glotag', this.glotagElement.style.background);
    this.glotagElement.style.backgroundSize = 'cover';
    // this.glotagElement.style.backgroundImage = 'url(/style/graphics/glotag.svg)';
    // this.glotagElement.style.backgroundSize = 'contain'; // This will scale the image to fit inside the element
    // this.glotagElement.style.backgroundPosition = 'center'; // This will center the image in the container
    // this.glotagElement.style.backgroundRepeat = 'no-repeat'; // This will prevent the image from repeating
    this.glotagElement.style.position = "absolute";
    this.glotagElement.style.borderRadius = '1rem';
    this.glotagElement.style.top = "1vh";
    this.glotagElement.style.left = '';
    this.glotagElement.style.right = "1vw";
    this.glotagElement.style.height = '87px';
    this.glotagElement.style.width = '330px';
    this.glotagElement.style.display = "flex";
    this.glotagElement.style.alignItems = "center";
    this.glotagElement.style.zIndex = "7";
    this.glotagElement.style.fontFamily = "Gabarito, sans-serif";
    this.glotagElement.style.fontWeight = "bold";
    this.glotagElement.style.cursor = 'pointer';
    // this.glotagElement.style.borderTop = '0px solid white';
    // this.glotagElement.style.borderBottom = '6px solid white';
    // this.glotagElement.style.borderRight = '0px solid white';
    // this.glotagElement.style.borderLeft = '6px solid white';
    // this.glotagElement.style.boxShadow = '-0.025rem 0 0.025rem #FFFFFF, 0 0.025rem 0.025rem #FFFFFF, -0.25rem 0.25rem 0.25rem #FFFFFF, -0.1rem 0.1rem 0.1rem #FFFFFF, -0.35rem 0.35rem 0.35rem #FFFFFF, inset 0 0 0.1625rem #FFFFFF';

    
  
    // Create PFP flat black line
    if (!this.pfpElement) {
      this.pfpElement = document.createElement('div');
    }
    this.pfpElement.style.height = '2px';  // Flat line
    this.pfpElement.style.backgroundColor = 'black';  // Black line
    this.pfpElement.style.marginLeft = '0.5vh';
    this.pfpElement.style.marginTop = '-2.5vh';  // Adjusted to vertically center the line

    // Create a flat black line for the text
    if (!this.usernameElement) {
      this.usernameElement = document.createElement('div');
      this.usernameElement.id = 'usernameElement';
      this.usernameElement.class = 'usernameElement';
    }
    // Set styles directly related to the usernameElement
    this.usernameElement.style.width = '85%';  // Approximate width of the text
    this.usernameElement.style.position = 'absolute';
    this.usernameElement.style.left = '50%';
    this.usernameElement.style.transform = 'translate(-50%, 0)';
    this.usernameElement.style.textAlign = 'center';
    this.usernameElement.innerText = 'glotag login';
    this.usernameElement.style.color = 'white';
    
    // Store the actual text in a data attribute to retrieve it on hover
    this.usernameElement.dataset.content = "retrieve glotag";
    this.usernameElement.style.fontSize = "2rem";
    this.usernameElement.style.fontFamily = 'Gabarito';

    // Show PFP and text on hover
    this.glotagElement.addEventListener('mouseover', () => {
      this.pfpElement.style.height = '5vh';
      this.pfpElement.style.borderRadius = '50%';
      this.pfpElement.style.backgroundColor = "grey";
      
      this.usernameElement.innerText = this.usernameElement.dataset.content;  // Show the actual text
      this.usernameElement.style.color = "white";
      this.usernameElement.style.fontSize = "2rem";
      this.usernameElement.style.height = 'auto';
      this.usernameElement.style.width = '78%';
      this.usernameElement.style.fontFamily = 'Gabarito';
    });

    // Change back to flat black lines when not hovering
    this.glotagElement.addEventListener('mouseout', () => {
      this.pfpElement.style.height = '2px';
      this.pfpElement.style.borderRadius = '0';
      this.pfpElement.style.backgroundColor = "black";
      
      this.usernameElement.innerText = 'glotag login';  // Hide the text
    });
    
    // Append child elements to GloTag
    this.glotagElement.appendChild(this.pfpElement);
    this.glotagElement.appendChild(this.usernameElement);

    //attach event listener
    this.glotagElement.addEventListener('click', this.handleGloTagClick.bind(this));
  }

  createPlayerCard() {
    if (!window.client.activePlayer) {
      if (window.client.gloSession && !window.client.receivedNfts) {
        setTimeout(() => {
          this.createPlayerCard();
        }, 50);
        return;
      }
    }
    // create player calling card
    let pfp;
    let username;
    let glotag;
    let gloLvl;
    if (window.client.activePlayer) {
      console.log('setting players profile')
      if (window.client.activePlayer.playerInfo.activePfp) {
        pfp = `url(/style/graphics/token_images${window.client.activePlayer.playerInfo.activePfp.metadata.mainImg}.webp)`;
      } else {
        pfp = `url(/style/graphics/pfp.png)`;
      }

      if (window.client.activePlayer.playerInfo.activeGlotag) {
        glotag = `url(/style/graphics/token_images${window.client.activePlayer.playerInfo.activeGlotag.metadata.mainImg}.webp)`;
      } else {
        glotag = `black`;
      }
      username = window.client.activePlayer.playerInfo.nickname;
      gloLvl = window.client.activePlayer.playerInfo.gloLvl;
    } else {
      if (window.client.gloInfo.activePfp) {
        pfp = `url(/style/graphics/token_images${window.client.gloInfo.activePfp.metadata.mainImg}.webp)`;
      } else {
        pfp = `url(/style/graphics/pfp.png)`;
      }

      if (window.client.gloInfo.activeGlotag) {
        glotag = `url(/style/graphics/token_images${window.client.gloInfo.activeGlotag.metadata.mainImg}.webp)`;
      } else {
        glotag = `black`;
      }
      console.log('created player card glotag', glotag, 'and pfp', pfp)
      
      username = window.client.gloInfo.username;
      gloLvl = window.client.gloInfo.gloLvl;
    }
    if (this.playerCardCreated) {
      this.glotagElement.style.display = 'flex';
      console.log('showing glotag background size to cover')
      if (this.glotagMode !== 'player' && this.glotagMode !== 'glotag') {
        document.body.appendChild(this.glotagElement);
      }
    } else {
        if (!this.glotagElement) {
          console.log('creating player calling card')
          this.glotagElement = document.createElement('div');
          this.glotagElement.style.opacity = '0.9';
          this.glotagElement.id = 'gloTagElement';
          this.glotagElement.style.background = glotag;
          console.log('set client active glotag', this.glotagElement.style.background);
          this.glotagElement.className = 'gloTag-element';
          
          this.pfpElement = document.createElement('div');
          this.glotagElement.appendChild(this.pfpElement);
          this.pfpElement.id = 'pfpElement';

          this.usernameElement = document.createElement('div');
          this.glotagElement.appendChild(this.usernameElement);
          this.usernameElement.id = 'usernameElement';

          this.glotagElement.addEventListener('click', this.handleGloTagClick.bind(this));
        }
        if (this.glotagMode !== 'player' && this.glotagMode !== 'glotag') {
          document.body.appendChild(this.glotagElement);
        }
        if (window.client.activePlayer) this.glotagElement.style.background = glotag;
        console.log('set client active glotag', this.glotagElement.style.background);
        console.log('setting glotag background size to cover')
        this.glotagElement.style.backgroundSize = 'cover';
        this.glotagElement.style.position = "absolute";
        this.glotagElement.style.borderRadius = '1rem';
        this.glotagElement.style.top = "1vh";
        this.glotagElement.style.left = '';
        this.glotagElement.style.right = "1vw";
        this.glotagElement.style.height = '87px';
        this.glotagElement.style.width = '330px';
        this.glotagElement.style.display = "flex";
        this.glotagElement.style.alignItems = "center";
        this.glotagElement.style.zIndex = "7";
        this.glotagElement.style.fontFamily = "Gabarito, sans-serif";
        this.glotagElement.style.fontWeight = "bold";
        this.glotagElement.style.cursor = 'pointer';
        // this.glotagElement.style.position = "absolute";
        // this.glotagElement.style.borderRadius = '2rem';
        // this.glotagElement.style.top = "1vh";
        // this.glotagElement.style.left = '';
        // this.glotagElement.style.right = "1vw";
        // this.glotagElement.style.height = '87px';
        // this.glotagElement.style.width = '330px';
        // console.log('creating playercard, setting to playercard im a retard, width is 330px');
        // this.glotagElement.style.display = "flex";
        // this.glotagElement.style.alignItems = "center";
        // this.glotagElement.style.zIndex = "4";
        // this.glotagElement.style.fontWeight = "bold";
        // this.glotagElement.style.cursor = 'pointer';
        // this.glotagElement.style.borderTop = '0px solid white';
        // this.glotagElement.style.borderBottom = '6px solid white';
        // this.glotagElement.style.borderRight = '0px solid white';
        // this.glotagElement.style.borderLeft = '6px solid white';
        // this.glotagElement.style.boxShadow = '-0.025rem 0 0.025rem #FFFFFF, 0 0.025rem 0.025rem #FFFFFF, -0.25rem 0.25rem 0.25rem #FFFFFF, -0.1rem 0.1rem 0.1rem #FFFFFF, -0.35rem 0.35rem 0.35rem #FFFFFF, inset 0 0 0.1625rem #FFFFFF';

    
        // Create PFP element
        this.pfpElement.style.height = '5vh';  // Circle
        this.pfpElement.style.width = '5vh';
        this.pfpElement.style.borderRadius = '50%';  // Circle

        this.pfpElement.style.backgroundImage = pfp;
        this.pfpElement.style.backgroundSize = 'cover'; 
        this.pfpElement.style.backgroundPosition = 'center';
        this.pfpElement.style.marginLeft = '0.5vh';

        // Create username element
        if (username.length > 20) {
          this.usernameElement.innerText = username.substring(0, 8) + '...' + username.substring(username.length - 5);
          this.usernameElement.style.fontSize = '2rem';
        } else {
          this.usernameElement.innerText = username;
          this.usernameElement.style.fontSize = '3rem';
        }
        this.usernameElement.style.marginLeft = '1vh';
        this.usernameElement.style.width = '70%';
        this.usernameElement.style.fontFamily = "gabarito";
        if (window.client.gloInfo.activeGlotag) {
          this.usernameElement.style.color = window.client.gloInfo.activeGlotag.metadata.textColor;
        } else {
          this.usernameElement.style.color = 'white';
        }
        this.usernameElement.style.overflow = 'hidden'; // Add this line
        this.usernameElement.style.textOverflow = 'ellipsis'; // Add this line
        this.usernameElement.style.whiteSpace = 'nowrap'; // Add this line

        // create level display
        if (!this.levelDisplay) {
          this.levelDisplay = document.createElement('div');
          this.levelDisplay.id = 'levelDisplay';
          this.levelDisplay.style.display = 'none'; // TEMPORARY FOR DEMO
          this.glotagElement.appendChild(this.levelDisplay);
        }
        this.levelDisplay.innerText = `${gloLvl}`;
        console.log('set level display to', gloLvl)
        this.levelDisplay.style.fontSize = '4rem';
        this.levelDisplay.style.color = 'white';
        this.levelDisplay.style.position = 'absolute';
        this.levelDisplay.style.top = '15%';
        this.levelDisplay.style.right = '5%';
        this.levelDisplay.style.textAlign = 'center';
        this.levelDisplay.style.display = 'none'; // TEMPORARY FOR DEMO
        // this.levelDisplay.style.display = 'flex'; // TEMPORARY FOR DEMO
        this.levelDisplay.style.flexDirection = 'column';
      }
    this.playerCardCreated = true;

    this.glotagElement.removeEventListener('mouseover', this.handleMouseOverGuest);
    this.glotagElement.removeEventListener('mouseout', this.handleMouseOutGuest);
  }

  createOutsideDiv() {
    if (this.outsideDiv) {
      this.outsideDiv.style.display = 'flex';
    } else {
      console.log('creating outside div')
      this.outsideDiv = document.createElement('div');
      document.body.appendChild(this.outsideDiv)
      this.outsideDiv.id = 'outsideDiv'
      this.outsideDiv.style.position = 'fixed';
      this.outsideDiv.style.top = '0';
      this.outsideDiv.style.left = '0';
      this.outsideDiv.style.width = '100vw';
      this.outsideDiv.style.height = '100vh';
      this.outsideDiv.style.backgroundColor = 'transparent';
      this.outsideDiv.style.zIndex = '5';
      this.outsideDiv.style.pointerEvents = 'all';
      this.outsideDiv.style.backdropFilter = 'blur(10px)';
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
          this.handleClickOutside();
        }
      });
      this.outsideDiv.addEventListener('click', this.handleClickOutside.bind(this));
    }
  }

  hideOutsideDiv() {
    if (this.outsideDiv) this.outsideDiv.style.display = 'none';
  }

  handleGloTagClick() {
    let gsapState = Flip.getState('#gloTagElement');
    console.log("glotag clicked on this.glotagMode:", this.glotagMode, "and this.gloPage:", this.gloPage);
    
    switch (this.glotagMode) {
      case 'glotag':
        switch (this.gloPage) {
          case 'home':
            this.gloPage = 'nftSelection';
            this.handleGloPage();
            Flip.from(gsapState, {
              duration: 0.33,
              ease: "power1.inOut",
              absolute: true,
              onComplete: () => console.log('Flip animation complete!')
            });
            break;
          case 'inspect_nft':
            this.gloPage = 'library';
            this.handleGloPage();
            Flip.from(gsapState, {
              duration: 0.33,
              ease: "power1.inOut",
              absolute: true,
              onComplete: () => console.log('Flip animation complete!')
            });
            break;
          case 'nftLibrary':
              this.gloPage = 'nftSelection';
              this.handleGloPage();
              Flip.from(gsapState, {
                duration: 0.33,
                ease: "power1.inOut",
                absolute: true,
                onComplete: () => console.log('Flip animation complete!')
              });
            break;
            // case 'friend_list':
            //   this.gloPage = 'nftSelection';
            //   this.handleGloPage();
            //   Flip.from(gsapState, {
            //     duration: 0.33,
            //     ease: "power1.inOut",
            //     absolute: true,
            //     onComplete: () => console.log('Flip animation complete!')
            //   });
            // case 'friend_menu':
            //   this.gloPage = 'nftSelection';
            //   this.handleGloPage();
            //   Flip.from(gsapState, {
            //     duration: 0.33,
            //     ease: "power1.inOut",
            //     absolute: true,
            //     onComplete: () => console.log('Flip animation complete!')
            //   });
            break;
          default:
            console.log('glotag clicked in glotag mode on glopage')
            if (this.previousGloPage) {
              console.log('going to', this.previousGloPage)
              this.gloPage = this.previousGloPage;
              console.log('set gloPage to', this.previousGloPage);
              this.previousGloPage = null;
            } else {
              this.gloPage = 'home';
              console.error('setting glopage to home')
            }
            this.handleGloPage();
            Flip.from(gsapState, {
              duration: 0.33,
              ease: "power1.inOut",
              absolute: true,
              onComplete: () => console.log('Flip animation complete!')
            });
            break;
        }
        // this.handleGlotagMode();
        break;
      case 'guest':
        this.createLoginPortal();
        this.handleGlotagMode();
        break;
      case 'calling_card':
        if (window.client.activePlayer) {
          if (typeof sa_event === 'function') sa_event("open_player_glotag");
          this.glotagMode = 'player';
        } else {
          this.glotagMode = 'glotag';
          if (typeof sa_event === 'function') sa_event("open_glotag");
        }
        this.handleGlotagMode();
        break;
      case 'player':
        switch (this.gloPage) {
          case 'home':
            console.log('glotag clicked in glotag mode on home')
            break;
          case 'inspect_nft':
            this.gloPage = 'library';
            this.handleGloPage();
            break;
          default:
            console.log('glotag clicked in glotag mode on glopage')
            if (this.previousGloPage) {
              console.log('going to', this.previousGloPage)
              this.gloPage = this.previousGloPage;
              console.log('set gloPage to', this.previousGloPage);
              this.previousGloPage = null;
            } else {
              this.gloPage = 'player';
            }
            this.handleGloPage();
            Flip.from(gsapState, {
              duration: 0.33,
              ease: "power1.inOut",
              absolute: true,
              onComplete: () => console.log('Flip animation complete!')
            });
            break;
        }
        // this.handleGlotagMode();
        break;
      default:
        console.error('Invalid Glotag Mode', this.glotagMode)
        break;
    }
  }

  initGameStats() {
    this.highscore = null;
    this.highestLevelReached = null;
    this.totalPlayTime = null;
    this.coinsCollected = null;
    this.enemiesKilled = null;
    this.attacksUsed = null;
    this.deaths = null;
    this.coinsPerLevel = null;
    this.attackEfficiency = null;
    this.KD = null;
    this.attacksHit = null;
    this.levelsPlayed = null;
    this.bitcoinCollected = null;
    this.ethereumCollected = null;
    this.atomCollected = null;
    this.solanaCollected = null;
  }

  createLoginPortal() {
    if (this.loginPortal) {
      this.loginPortal.style.display = 'flex';
      this.backdrop.style.display = 'flex';
      this.backdrop.style.zIndex = '5';
    } else {
      // Create the main popup container
      this.loginPortal = document.createElement('div');
      this.loginPortal.id = 'login-portal';
      this.loginPortal.style = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: #ffffff;
        border: 1px solid #ccc;
        padding: 20px;
        z-index: 10;
        display: flex;
        flex-direction: column;
        gap: 10px;
        align-items: center;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        width: 25%;
        height: 30%;
      `;

      //main-login-container
      this.loginContainer = document.createElement('div');
      this.loginContainer.style.display = 'flex';
      this.loginContainer.style.flexDirection = 'column';
      this.loginContainer.style.gap = '10px';
      this.loginContainer.style.alignItems = 'center';
      this.loginPortal.appendChild(this.loginContainer);

      //login bar
      const loginBar = document.createElement('div');
      loginBar.id = 'loginBar';
      loginBar.style.width = '100%';
      this.loginPortal.appendChild(loginBar);
      //login-tooltip
      const loginTool = document.createElement('div');
      loginTool.style.position = 'absolute';
      loginTool.style.height = '18px';
      loginTool.style.width = '18px';
      loginTool.style.top = '16.5%';
      loginTool.style.left = '26%';
      loginTool.style.background = '#333333';
      loginTool.style.borderRadius = '100%';
      loginTool.style.color = '#f0f0f0';
      loginTool.innerText = 'i';
      loginTool.style.fontSize = '8px';
      loginTool.style.textAlign = 'center';
      loginTool.style.display = 'flex';
      loginTool.style.justifyContent = 'center';
      loginTool.style.alignItems = 'center';
      loginTool.style.cursor = 'pointer';
      loginBar.appendChild(loginTool);

      loginTool.addEventListener('mouseover', function() {
          // Code to execute when the mouse enters the loginTool element
          const loginToolText = document.createElement('div');
          loginToolText.id = 'loginToolText';
          loginToolText.innerText = 'Log in to your glotag which acts as your profile on glo';
          loginToolText.style.backgroundColor = '#333333';
          loginToolText.style.position = 'absolute';
          loginToolText.style.top = '42%';
          loginToolText.style.left = '50%';
          loginToolText.style.transform = 'translateX(-50%)';
          loginToolText.style.zIndex = '10';
          loginToolText.style.color = '#f0f0f0';
          loginToolText.style.padding = '20px';
          loginToolText.style.width = '20%';
          loginToolText.style.lineHeight = '1.25';
          document.body.appendChild(loginToolText);
      });

      loginTool.addEventListener('mouseout', function() {
          document.getElementById('loginToolText').remove();
      });

      //login-title
      const loginTitle = document.createElement('h2');
      loginTitle.textContent = 'Log-In';
      loginTitle.style.textAlign = 'center';
      loginBar.appendChild(loginTitle);

      //wallet container
      const walletContainer = document.createElement('div');
      walletContainer.id = 'walletContainer'
      walletContainer.style.position = 'absolute';
      walletContainer.style.top = '40%';
      walletContainer.style.display = 'flex'; // Add this line
      walletContainer.style.alignItems = 'center'; // Add this line
      this.loginContainer.appendChild(walletContainer);

      //wallet bar
      const walletBar = document.createElement('div');
      walletBar.style.width = '50%';
      walletContainer.appendChild(walletBar);

      document.querySelector('.CreditSelect').style.color = 'transparent';
      
      let ogElement = document.querySelector('.wallet-login-portal');
      if (ogElement) {
        ogElement.style.display = 'flex';
        return;
      }
      const walletLoginPortal = document.createElement('div');
      walletLoginPortal.className = 'wallet-login-portal';
      walletLoginPortal.style.position = 'absolute';
      walletLoginPortal.style.top = '24%';
      walletLoginPortal.style.left = '37.5%';
      this.loginPortal.appendChild(walletLoginPortal);

      const walletLoginBtn = document.getElementById('root');
      walletLoginBtn.style.display = 'flex';
      walletLoginPortal.appendChild(walletLoginBtn);

      const terraStationText = document.createElement('span');
      terraStationText.innerText = 'Station';
      terraStationText.style.position = 'absolute';
      terraStationText.style.top = '53%';
      terraStationText.style.left = '64%';
      terraStationText.style.transform = 'translateX(-50%)';
      this.loginContainer.appendChild(terraStationText);

      //add helper for setting up new terra wallet
      const walletHelper = document.createElement('div');
      walletHelper.style.position = 'absolute';
      walletHelper.style.bottom = '2.5%';
      walletHelper.style.left = '50%';
      walletHelper.style.width = '90%';
      walletHelper.style.transform = 'translateX(-50%)';
      this.loginPortal.appendChild(walletHelper);

      // Create a div element
      const walletHelperLink = document.createElement('div');
      walletHelperLink.innerText = 'Click here to set up a terra wallet';
      walletHelperLink.style.textDecoration = 'underline';
      walletHelperLink.style.color = 'lightgrey';
      walletHelperLink.style.textAlign = 'center';
      walletHelperLink.style.fontSize = '11px';
      walletHelperLink.style.border = '2px solid transparent'; 
      walletHelperLink.style.padding = '10px';
      walletHelperLink.style.cursor = 'pointer'; // Change cursor to pointer when hovering over the div
      walletHelperLink.style.lineHeight = '1.75';

      // Add a click event listener that opens the link in a new tab
      walletHelperLink.addEventListener('click', function() {
        window.open('https://station.money/', '_blank');
      });

      // Add a mouseover event listener that applies the hover styles
      walletHelperLink.addEventListener('mouseover', function() {
        this.style.color = '#000';
        this.style.backgroundColor = '#FFA500';
        this.style.cursor = 'pointer';
        this.style.animation = 'fire 1s infinite';
        this.style.border = '2px solid orange';
        this.style.boxShadow = '0 0 10px 5px rgba(255,165,0,0.5)';
        this.style.textDecoration = 'none';
      });

      // Add a mouseout event listener that removes the hover styles
      walletHelperLink.addEventListener('mouseout', function() {
        this.style.color = '';
        this.style.backgroundColor = '';
        this.style.cursor = '';
        this.style.animation = '';
        this.style.border = '2px solid transparent';
        this.style.boxShadow = '';
        this.style.textDecoration = 'underline';
      });

      // Append the link and the rest of the text to the walletHelper div
      walletHelper.appendChild(walletHelperLink);
      
      window.addEventListener('oldPlayer', () => {
        console.log("SETTING USERNAME, DUH , DUH, I M RETARD");
        document.querySelector('.CreditSelect').style.display = 'none';
        document.getElementById('login-backdrop').remove();
        document.getElementById('login-portal').remove();
        this.setPlayerData();

        this.glotagMode = 'calling_card';
        this.handleGlotagMode();
      });

      window.addEventListener('newPlayer', () => {
        console.log("SETTING USERNAME, DUH , DUH, I M RETARD");
        document.querySelector('.CreditSelect').style.display = 'none';
        const walletInputLabel = document.createElement('span');
        walletInputLabel.className = 'wallet-input-label';
        walletInputLabel.innerText = 'enter your username';
        walletLoginPortal.appendChild(walletInputLabel);

        const walletInput = document.createElement('input');
        walletInput.className = 'wallet-login-input';
        walletLoginPortal.appendChild(walletInput);
        walletInput.focus();

        // List of curse words to filter out
        const curseWords = ['nigger', 'n|gger', 'n|gga', 'n|gg4','n|gg3r', 'nigga', 'niggas', 'cracker', 'chink', 'kyke', 'spic', 'beaner', 'gook', 'niggers', 'n1gger', 'nigg3r', 'n1ggers', 'nigg3rs', 'n1gg3r', 'n1gg3rs'];

        // Add an event listener to the input event
        walletInput.addEventListener('input', function() {
          let value = this.value;
          
          // Replace all occurrences of '|\|' with asterisks
          let specialCharRegex = new RegExp('\\|\\\\\\|', 'gi');
          value = value.replace(specialCharRegex, '****');

          for (let curseWord of curseWords) {
            // Escape special characters in the curse word
            let escapedCurseWord = curseWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
            let regex = new RegExp(escapedCurseWord, 'gi');
            value = value.replace(regex, '****'); // replace curse word with asterisks
          }
          this.value = value;
        });
        
        const walletSubmit = document.createElement('button');
        walletSubmit.innerText = 'submit';
        walletSubmit.className = 'wallet-submit';
        walletSubmit.style.cursor = 'pointer';
        walletLoginPortal.appendChild(walletSubmit);
        walletSubmit.addEventListener('click', () => {
        const username = walletInput.value.trim(); // Get the input value and remove leading/trailing whitespace
      
          if (username) { // Check if username is not an empty string
            fetch('/newplayer', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ walletID: window.client.gloInfo.walletID, nickname: username }),
            })
            .then(response => response.json())
            .then(data => {
              console.log('data:', data);
              // Remove this.overlay and this.loginPortal when the username is successfully set
              window.client.createGloSession(data);
              window.client.initSocketConnection();
              document.getElementById('login-backdrop').remove();
              document.getElementById('login-portal').remove();

              this.glotagMode = 'calling_card';
              this.handleGlotagMode();
            })
            .catch((error) => {
              console.error('Error:', error);
                const errorMessage = document.createElement('span');
                errorMessage.id = 'login-error-message';
                errorMessage.innerText = 'Username already taken';
                errorMessage.style.color = 'red';
                errorMessage.style.fontFamily = 'Gabarito';
                errorMessage.style.position = 'absolute';
                errorMessage.style.bottom = '30%';
                errorMessage.style.left = '50%';
                errorMessage.style.transform = 'translateX(-50%)';

                const walletLoginPortal = document.querySelector('.wallet-login-portal');

                if(walletLoginPortal) {
                  walletLoginPortal.appendChild(errorMessage);
                }

                // Fade out the error message after 10 seconds and then remove it
                gsap.to(errorMessage, {
                  opacity: 0,
                  duration: 10,
                  onComplete: function() {
                    console.log('ready to remove');
                    errorMessage.remove();
                  }
                });
            });
          } else {
            // Update the label text if the username is not valid
            walletInputLabel.innerText = 'Please enter a valid username.';
          }
        });

        walletInput.addEventListener('keydown', (event) => {
          if (event.keyCode === 13) { // 13 is the key code for the Enter key
            walletSubmit.click(); // Programmatically click the walletSubmit button
          }
        });
      });


      // add the backdrop
      this.backdrop = document.createElement('div');
      this.backdrop.id = 'login-backdrop'
      this.backdrop.style = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      backdrop-filter: blur(10px); // Blur effect
      z-index: 8; // Ensure it's below the login portal but above other content
      display: flex`;
      document.body.appendChild(this.backdrop);
      this.backdrop.style.zIndex = '8';
      this.backdrop.addEventListener('click', () => {
        this.loginPortal.style.display = 'none';
        this.backdrop.style.display = 'none';
      });
  
      // Append the portal to the body
      document.body.appendChild(this.loginPortal);
    }


  }

  handleWrongNetwork() {
    // Check if the error message already exists
    let errorMessage = document.getElementById('network-error-message');
    if (!errorMessage) {
      // If it doesn't exist, create it
      errorMessage = document.createElement('div');
      errorMessage.id = 'network-error-message';
      errorMessage.style = `
        color: #d00606;
        top: 70%;
        font-size: 14px;
        position: absolute;
        text-align: center;
      `;
      // Append this message to the walletContainer or directly under the walletButton
      const walletContainer = document.getElementById('login-portal') // Assuming the walletContainer is the third child, adjust if necessary
      walletContainer.appendChild(errorMessage);
    }
    // Update or set the text of the error message
    errorMessage.textContent = 'Incorrect network, please change your Terra Station Extension to testnet and refresh the page.';
  }
  
  createGlotagPage() {
    console.log('glotagggg page', this.gloPage)
    if (window.client.activePlayer && this.glotagPageContainer) {
      console.log('showing glotagpagecontainer on createglotagpage()');
      this.glotagPageContainer.style.display = 'flex';
      this.glotagPage.style.display = 'none';
      setTimeout(() => {
        this.glotagPage.style.display = 'flex';
      }, 250);
      let optionsContainer = document.getElementById('options-container');
      if (optionsContainer) {
        if (this.glotagMode === 'player') {
          optionsContainer.style.display = 'none';
        } else {
          optionsContainer.style.display = 'flex';
        }
      }
      this.handleGloPage();
      this.glotagCreated = true;
      return;
    } else {
      if (!this.glotagPageContainer) {
        this.glotagPageContainer = document.createElement('div');
        this.glotagPageContainer.id = 'glotagPageContainer';
        this.glotagPageContainer.style.overflow = 'hidden';
        document.body.appendChild(this.glotagPageContainer);

        this.glotagPage = document.createElement('div'); 
        this.glotagPage.id = 'glotagPage';
        this.glotagPageContainer.appendChild(this.glotagPage);
      }
      this.glotagPage.style.backgroundColor = "rgba(0, 0, 0, 0.75)";
      this.glotagPage.style.borderStyle = 'solid'; // Sets the border style to solid
      this.glotagPage.style.borderWidth = '8px'; // Sets the border width to 1px
      this.glotagPage.style.borderColor = 'white'; // Sets the border color to white
      this.glotagPage.style.height = '15%';
      this.glotagPage.style.width = '14%';
      this.glotagPage.style.position = 'absolute';
      this.glotagPage.style.zIndex = '6';
      this.glotagPage.style.top = '22%';
      this.glotagPage.style.left = '35%';
      this.glotagPage.style.borderTopLeftRadius = '2% 3%';
      this.glotagPage.style.borderTopRightRadius = '2% 3%';
      this.glotagPage.style.borderBottomLeftRadius = '2% 3%';
      this.glotagPage.style.borderBottomRightRadius = '2% 3%';
      this.glotagPage.style.border = '1px solid white';
      this.glotagPage.style.fontFamily = 'Gabarito, sans-serif';
      this.glotagPage.style.boxShadow =  'rgb(255, 255, 255) -0.25rem 0px 0.25rem, rgb(255, 255, 255) 0px 0.25rem 0.25rem, rgb(255, 255, 255) -0.5rem 0.5rem 0.5rem, rgb(255, 255, 255) -0.2rem 0.2rem 0.2rem, rgb(255, 255, 255) -0.5rem 0.5rem 0.5rem, rgb(255, 255, 255) 0px 0px 0.3rem inset';
    }
    this.glotagPageContainer.style.display = 'flex';
    this.glotagPage.style.opacity = '0';

    if (this.previousGloPage && !window.client.activePlayer) {
      this.gloPage = this.previousGloPage;
      this.previousGloPage = null;
    } else {
      if (this.gloPage == 'player') {
        console.log('player page')
      } else {
        console.error('setting glopage to home')
        this.gloPage = 'home';
      }
    }
    console.log('glotagggg page', this.gloPage);
    console.log('glotagggg mode', this.glotagMode);
    this.handleGloPage();
    this.glotagCreated = true;
  }

  hideGlotag() {
      // Reverse animation for 'calling_card' and 'glotag'
    console.log('hiding glotag @:', this.glotagMode);

    switch (this.glotagMode) {
      case 'glotag':
        // if (this.glotagPageContainer) {
        //   console.log('hiding glotagpage container on calling card glotagmode');

        //   // Then animate the rest
        //   gsap.to(this.glotagPage, {
        //     width: '14%', // Set width to 14%
        //     height: '15%', // Set height to 15%
        //     top: '22%',
        //     left: '35%',
        //     duration: 0.5,
        //     ease: "power1.inOut",
        //     onComplete: () => {
        //       this.glotagPageContainer.style.display = 'none';
        //       this.glotagPage.style.transform = ''
        //     }
        //   });
        // }
        if (this.loginPortal) this.loginPortal.style.display = 'none';
        // if (this.backdrop) this.backdrop.style.display = 'none';
        if (this.backButton) this.backButton.style.display = 'none';
        break;
      case 'guest':
        if (this.glotagElement) this.glotagElement.style.display = 'none';
        if (this.glotagPageContainer) {
          console.log('hiding glotagpage container on calling card glotagmode');

          // Then animate the rest
          gsap.to(this.glotagPage, {
            width: '14%', // Set width to 14%
            height: '15%', // Set height to 15%
            top: '22%',
            left: '35%',
            duration: 0.33,
            ease: "power1.inOut",
            onComplete: () => {
              this.glotagPageContainer.style.display = 'none';
              this.glotagPage.style.transform = ''
            }
          });
        }
        // if (this.backdrop) this.backdrop.style.display = 'none';

        if (this.backButton) this.backButton.style.display = 'none';
        break;
      case 'calling_card':
        if (this.glotagPageContainer) {
          console.log('hiding glotagpage container on calling card glotagmode');

          // Then animate the rest
          gsap.to(this.glotagPage, {
            width: '14%', // Set width to 14%
            height: '15%', // Set height to 15%
            top: '22%',
            left: '35%',
            duration: 0.33,
            ease: "power1.inOut",
            onComplete: () => {
              this.glotagPageContainer.style.display = 'none';
              this.glotagPage.style.transform = ''
            }
          });
        }
        if (this.loginPortal) this.loginPortal.style.display = 'none';
        // if (this.backdrop) this.backdrop.style.display = 'none';
        if (this.backButton) this.backButton.style.display = 'none';
        break;
      case 'player':
        // if (this.glotagElement) this.glotagElement.style.display = 'none';
        break;
      default:
        if (this.glotagElement) this.glotagElement.style.display = 'none';
        if (this.loginPortal) this.loginPortal.style.display = 'none';
        // if (this.backdrop) this.backdrop.style.display = 'none';
        if (this.backButton) this.backButton.style.display = 'none';
        break;
    }
  }

  createSettings() {
    // TEMP //
    if (this.settingsElement) {
      this.settingsElement.style.display = 'flex';
    } else {
      this.settingsElement = document.createElement('div');
      this.glotagPage.appendChild(this.settingsElement);
      this.settingsElement.style.height = '65%';
      this.settingsElement.style.width = '80%';
      this.settingsElement.style.position = 'absolute';
      this.settingsElement.style.backgroundColor = 'grey';
      this.settingsElement.style.zIndex = '6';
      this.settingsElement.style.display = 'flex';
      this.settingsElement.style.top = '58%';
      this.settingsElement.style.left = '50%';
      this.settingsElement.style.transform = 'translate(-50%,  -50%)';
    }
  }

  hideSettings() {
    // TEMP //
    if (this.settingsElement) this.settingsElement.style.display = 'none';
  }

  shrinkCallingCard() {
    // shrink calling card
    // if (!this.glotagElement) return;

    console.log('shrinkcallingCard()', this.glotagElement);
    // if (this.gloPage === 'friend_list' || 'nft_list' || 'luncman_stats'){
      this.glotagElement.style.height = '10%';
      this.glotagElement.style.width = '34%';
      this.glotagElement.style.left = '11%';
      this.glotagElement.style.top = '11%';
    // } else {
    //   gsap.to(this.glotagElement, {
    //     height: '10%',
    //     width: '34%',
    //     left: '11%',
    //     top: '11%',
    //     duration: 0.2,
    //     delay: 0.075
    //   });
    // }

    if (window.chat && window.chat.chatElement) {
      console.log('chat shrink animation at shrinkcalling card');

      gsap.to(window.chat.chatElement, {
        height: '11.25%',
        width: '35%',
        top: '11%',
        left: '10%',
        duration: 0.33,
        delay: 0.04
      });
    }

    if (this.username.length > 20) {
      this.usernameElement.innerText = this.username.substring(0, 8) + '...' + this.username.substring(this.username.length - 5);
      this.usernameElement.style.fontSize = '2rem';
    } else {
      this.usernameElement.innerText = this.username;
      this.usernameElement.style.fontSize = '3rem';
      gsap.to(this.usernameElement, {
        top: '18%',
        duration: 0.33,
        delay: 0.04
      });

    }
    // this.usernameElement.style.top = '37%';
    // this.usernameElement.style.left = '25%';
    this.levelDisplay.style.fontSize = '1rem';
    this.levelDisplay.style.top = '10%';
    this.levelDisplay.style.left = '';
    this.pfpElement.style.top = '7%';

    if (this.backButton && window.client.activePlayer) {
      this.backButton.style.fontSize = '2.5rem';
      this.backButton.style.top = '9%';
      this.backButton.style.left = '41.5%';
    }
  }

  setPlayerData() {
    if (!window.client.gloSession) return;
    this.username = window.client.gloInfo.username;
    this.glolvl = window.client.gloInfo.gloLvl;
    this.friends = window.client.gloInfo.friends;
    this.highscore = window.client.gloInfo.highscore;
    this.highestLevelReached = window.client.gameStats.highestLevelReached;
    this.totalPlayTime = window.client.gameStats.totalPlayTime;
    this.coinsCollected = window.client.gameStats.coinsCollected;
    this.enemiesKilled = window.client.gameStats.enemiesKilled;
    this.attacksUsed = window.client.gameStats.attacksUsed;
    this.deaths = window.client.gameStats.deaths;
    this.coinsPerLevel = window.client.gameStats.coinsPerLevel;
    this.attackEfficiency = window.client.gameStats.attackEfficiency;
    this.KD = window.client.gameStats.KD;
    this.attacksHit = window.client.gameStats.attacksHit;
    this.levelsPlayed = window.client.gameStats.levelsPlayed;
    this.bitcoinCollected = window.client.gameStats.fruitCollected[0].bitcoin;
    this.ethereumCollected = window.client.gameStats.fruitCollected[0].ethereum;
    this.atomCollected = window.client.gameStats.fruitCollected[0].atom;
    this.solanaCollected = window.client.gameStats.fruitCollected[0].solana;
  }

  setPlayerDataLoop() {
    setInterval(() => {
      this.setPlayerData();
    }, 250);
  }

  setGuestStats() {
    // TEMP //
    //////////
    
    this.friends = [];
    this.highscore = 5000;
    this.highestLevelReached = 12;
    this.totalPlayTime = 500;
    this.coinsCollected = 5000;
    this.enemiesKilled = 200;
    this.attacksUsed = 210;
    this.deaths = 50;
    this.coinsPerLevel = 10;
    this.attackEfficiency = 2;
    this.KD = 5;
    this.attacksHit = 36;
    this.levelsPlayed = 22;
    this.bitcoinCollected = 0;
    this.ethereumCollected = 12;
    this.atomCollected = 24;
    this.solanaCollected = 36;
  }

  //create personal glotag
  styleCallingCard() {
    if (window.client.gloSession && !window.client.receivedNfts) {
      setTimeout(() => {
        this.styleCallingCard();
      }, 50);
      return;
    }
    if (window.chat) window.chat.styleChat();
    console.log('stylizing calling card', this.glotagMode)
    // main
    switch (this.glotagMode) {
      case 'glotag':
        this.glotagPageContainer.appendChild(this.glotagElement);
        this.glotagPageContainer.style.display = 'flex';
        console.log('showing glotagpagecontainer on glotag glotagmode and glopage:', this.gloPage);
        if (window.chat && window.chat.chatElement) {
          this.glotagPageContainer.appendChild(window.chat.chatElement);
          if (window.chat.chatElement.style.height === '11.25%' && this.gloPage != 'friend_requests' && this.gloPage != 'inspect_nft' && this.gloPage != 'friend_list'&& this.gloPage != 'library' && this.gloPage != 'nftSelection') {
            console.log('expanding chat animation using gsap.to at style calling card glotag glotagmode');
            gsap.to(window.chat.chatElement, {
              height: '22%',
              width: '51%',
              left: '10%',
              top: '11%',
              zIndex: '6',
              delay: 0.075,
              duration: 0.29
            });
          } else {
          if (this.gloPage != 'friend_requests' && this.gloPage != 'inspect_nft' && this.gloPage != 'friend_list' && this.gloPage != 'library' && this.gloPage != 'nftSelection') {
            console.log('expanding chat manually at style calling card glotag glotagmode');
            window.chat.chatElement.style.height = '22%';
            window.chat.chatElement.style.width = '51%';
            window.chat.chatElement.style.left = '10%';
            window.chat.chatElement.style.top = '11%';
            window.chat.chatElement.style.zIndex = '6';
          }
          }


          // Set all children of chatElement to display none
          Array.from(window.chat.chatElement.children).forEach(child => {
            child.style.display = 'none';
          });

          window.chat.isChatVisible = false;
        }
        if (this.gloPage === 'home') {
          //glotag
          this.glotagElement.style.height = '20%';
          console.error('setting glotag height and width to 20%, 50%');
          this.glotagElement.style.width = '50%';
          this.glotagElement.style.position = 'absolute';
          this.glotagElement.style.left = '11%';
          this.glotagElement.style.top = '11%';
          this.glotagElement.style.zIndex = '7';

          console.error('setting client glotag, checking for active', window.client.gloInfo)
          if (window.client.gloInfo.activeGlotag) {
            this.glotagElement.style.background = `url(/style/graphics/token_images${window.client.gloInfo.activeGlotag.metadata.mainImg}.webp)`;
            this.usernameElement.style.color = window.client.gloInfo.activeGlotag.metadata.textColor;
           } else {
            console.error('User had no active glotag', window.client.gloInfo)
            this.glotagElement.style.background = 'black';
            this.usernameElement.style.color = 'white';
          }
          this.glotagElement.style.backgroundSize = 'cover';
          console.log('set client active glotag', this.glotagElement.style.background);
          // this.glotagElement.style.border = '8px solid white';
          // this.glotagElement.style.border = '2rem';
          // this.glotagElement.style.borderTop = '1px solid white';
          // this.glotagElement.style.borderRight = '1px solid white';
          // this.glotagElement.style.borderBottom = '12px solid white';
          // this.glotagElement.style.borderLeft = '12px solid white';
          // this.glotagElement.style.boxShadow = '-0.025rem 0 0.025rem #FFFFFF, 0 0.025rem 0.025rem #FFFFFF, -0.25rem 0.25rem 0.25rem #FFFFFF, -0.1rem 0.1rem 0.1rem #FFFFFF, -0.35rem 0.35rem 0.35rem #FFFFFF, inset 0 0 0.1625rem #FFFFFF';
          

          // pfp
          this.pfpElement.style.borderRadius = '50%';
          this.pfpElement.style.height = '80%';
          this.pfpElement.style.aspectRatio = '1/1';
          this.pfpElement.style.position = 'absolute';
          this.pfpElement.style.top = '10%';
          this.pfpElement.style.left = '2.5%';
          this.pfpElement.style.width = 'auto';

          if (window.client.gloInfo.activePfp) {
            this.pfpElement.style.backgroundImage = `url(/style/graphics/token_images${window.client.gloInfo.activePfp.metadata.mainImg}.webp)`;
           } else {
            console.error('User had no active pfp', window.client.gloInfo)
            this.pfpElement.style.backgroundImage = 'url(/style/graphics/pfp.webp)';
          }
      
          // username
          if (!this.usernameElement) {
            this.usernameElement = document.createElement('div');
            this.usernameElement.style.top = '33%';
            this.glotagElement.appendChild(this.usernameElement);
          } else {
            this.usernameElement.id = 'usernameElement';
            gsap.to(this.usernameElement, {
              top: '33%',
              duration: 0.33,
              delay: 0.04
            });
          }
          this.usernameElement.innerText = window.client.gloInfo.username;
          console.log('set username to', window.client.gloInfo.username)
          this.usernameElement.style.marginLeft = '';
          this.usernameElement.style.fontSize = '3.5rem';
          this.usernameElement.style.position = 'absolute';
          this.usernameElement.style.left = '30%';
      
          // level display
          if (!this.levelDisplay) {
            this.levelDisplay = document.createElement('div');
            this.levelDisplay.id = 'levelDisplay';
            this.glotagElement.appendChild(this.levelDisplay);
          }
          this.levelDisplay.innerText = `${window.client.gloInfo.gloLvl}`;
          this.levelDisplay.style.fontSize = '4rem';
          this.levelDisplay.style.color = 'white';
          this.levelDisplay.style.position = 'absolute';
          this.levelDisplay.style.top = '35%';
          this.levelDisplay.style.left = '82%';
          this.levelDisplay.style.textAlign = 'center';
          // this.levelDisplay.style.display = 'flex';// TEMPORARY FOR DEMO
          this.levelDisplay.style.display = 'none';
          this.levelDisplay.style.flexDirection = 'column';

          //OPTIONS MENU
          // Check if optionsMenu already exists, if not create it
          if (!this.optionsContainer) {
            this.optionsContainer = document.createElement('div');
            this.optionsContainer.id = 'options-container';
            this.glotagPage.appendChild(this.optionsContainer);

            // Style the options container
            this.optionsContainer.style.display = 'flex';
            this.optionsContainer.style.position = 'absolute';
            this.optionsContainer.style.top = '8.5%';
            this.optionsContainer.style.height = '15%';
            this.optionsContainer.style.width = '37%';
            this.optionsContainer.style.left = '60%'; // Adjust as needed
            this.optionsContainer.style.alignItems = 'center'; // Center items vertically
            this.optionsContainer.style.justifyContent = 'space-evenly'; // Evenly space out the buttons
          }
          this.optionsContainer.style.display = 'flex';

          // Create and style a logout button
          if (!this.walletsButton) {
            this.walletsButton = document.createElement('button');
            this.walletsButton.className = 'wallets-button';

            let svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svgElement.setAttribute('class', 'wallets-svgIcon');
            svgElement.setAttribute('viewBox', '0 0 512 512');

            let pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            pathElement.setAttribute('d', 'M410.3 231l11.3-11.3-33.9-33.9-62.1-62.1L291.7 89.8l-11.3 11.3-22.6 22.6L58.6 322.9c-10.4 10.4-18 23.3-22.2 37.4L1 480.7c-2.5 8.4-.2 17.5 6.1 23.7s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L387.7 253.7 410.3 231zM160 399.4l-9.1 22.7c-4 3.1-8.5 5.4-13.3 6.9L59.4 452l23-78.1c1.4-4.9 3.8-9.4 6.9-13.3l22.7-9.1v32c0 8.8 7.2 16 16 16h32zM362.7 18.7L348.3 33.2 325.7 55.8 314.3 67.1l33.9 33.9 62.1 62.1 33.9 33.9 11.3-11.3 22.6-22.6 14.5-14.5c25-25 25-65.5 0-90.5L453.3 18.7c-25-25-65.5-25-90.5 0zm-47.4 168l-144 144c-6.2 6.2-16.4 6.2-22.6 0s-6.2-16.4 0-22.6l144-144c6.2-6.2 16.4-6.2 22.6 0s6.2 16.4 0 22.6z');

            svgElement.appendChild(pathElement);
            this.walletsButton.appendChild(svgElement);

            this.optionsContainer.appendChild(this.walletsButton);
          }

          // Add click event listener for the logout function
          // this.walletsButton.addEventListener('click', () => {
          //   window.client.hardLogout(); // Call the logout method of window.client
          //   this.usernameElement.textContent = '';
          //   this.playerCardCreated = false;
          //   this.glotagCreated = false;
          // });
          this.walletsButton.addEventListener('click', () => {
            this.gloPage = 'wallets';
            this.walletsButton.style.display = 'none'; // Hide the button
            this.settingsButton.style.display = 'none';
            let gsapStateGlotagElement = Flip.getState('#gloTagElement');
            this.handleGloPage();
          
            Flip.from(gsapStateGlotagElement, {
              duration: 0.33,
              ease: "power1.inOut",
              absolute: true
            });
          });

          this.walletsButton.style.display = 'flex';

          // Create and style a settings button
          if (!this.settingsButton) {
            this.settingsButton = document.createElement('div');
            this.settingsButton.id = 'settings-button';
            this.optionsContainer.appendChild(this.settingsButton);

          // Set the gear image as the background of the button
          this.settingsButton.style.backgroundImage = 'url("/style/graphics/gearicon.png")';
          this.settingsButton.style.backgroundSize = 'cover';
          this.settingsButton.style.backgroundRepeat = 'no-repeat';
          this.settingsButton.style.backgroundPosition = 'center';
          this.settingsButton.style.width = '10vh'; // Example size, adjust as needed
          this.settingsButton.style.height = '10vh'; // Example size, adjust as needed
          this.settingsButton.style.cursor = 'pointer';
          this.settingsButton.style.display = 'none'; // TEMPORARY FOR DEMO
          }
          // this.settingsButton.style.display = 'flex'; // TEMPORARY FOR DEMO

          this.settingsButton.addEventListener('click', () => {
            // GSAP animation to spin the gear
            gsap.to(this.settingsButton, {
              rotation: '+=360',
              duration: 1,
              ease: "power2.inOut",
              onComplete: () => {
                // The logic you want to execute after the animation goes here
                this.gloPage = 'settings';
                this.walletsButton.style.display = 'none'; // Hide the button
                this.settingsButton.style.display = 'none';
                let gsapStateElement = Flip.getState('#gloTagElement');
                this.handleGloPage();
                Flip.from(gsapStateElement, {
                  duration: 0.33,
                  ease: "power1.inOut",
                  absolute: true
                });
              }
            });
          });   
          
          // Wallet Button Hover In
          this.walletsButton.addEventListener('mouseenter', () => {
            gsap.to("#wallets-button", { scale: 1.1, duration: 0.3, ease: "power1.inOut" });
          });

          // Wallet Button Hover Out
          this.walletsButton.addEventListener('mouseleave', () => {
            gsap.to("#wallets-button", { scale: 1, duration: 0.3, ease: "power1.inOut" });
          });

          // Settings Button Hover In
          this.settingsButton.addEventListener('mouseenter', () => {
            gsap.to("#settings-button", { scale: 1.1, duration: 0.3, ease: "power1.inOut" });
          });

          // Settings Button Hover Out
          this.settingsButton.addEventListener('mouseleave', () => {
            gsap.to("#settings-button", { scale: 1, duration: 0.3, ease: "power1.inOut" });
          });
        } else {
          this.shrinkCallingCard();
          this.optionsContainer.style.display = 'none';
        }
        break;
      case 'player':
        if (!this.glotagPage) {
          // create glotag page
          console.log('styling player card but need to create glotag page first')
          this.createGlotagPage();
          return;
        }
        console.error('appending glotag element to glotag page')
        this.glotagPageContainer.appendChild(this.glotagElement);
        if (window.chat && window.chat.chatElement) {
          this.glotagPageContainer.appendChild(window.chat.chatElement);

          if (window.chat.chatElement.style.height === '11.25%' && this.gloPage != 'friend_requests' && this.gloPage != 'inspect_nft' && this.gloPage != 'friend_list'&& this.gloPage != 'library' && this.gloPage != 'nftSelection') {
            console.log('expanding chat animation using gsap.to at style calling card glotag glotagmode');
            gsap.to(window.chat.chatElement, {
              height: '22%',
              width: '51%',
              left: '10%',
              top: '11%',
              zIndex: '6',
              delay: 0.075,
              duration: 0.29
            });
          } else {
          if (this.gloPage != 'friend_requests' && this.gloPage != 'inspect_nft' && this.gloPage != 'friend_list' && this.gloPage != 'library' && this.gloPage != 'nftSelection') {
            console.log('expanding chat manually at style calling card glotag glotagmode');
            window.chat.chatElement.style.height = '22%';
            window.chat.chatElement.style.width = '51%';
            window.chat.chatElement.style.left = '10%';
            window.chat.chatElement.style.top = '11%';
            window.chat.chatElement.style.zIndex = '6';
          }
          }


          // Set all children of chatElement to display none
          Array.from(window.chat.chatElement.children).forEach(child => {
            child.style.display = 'none';
          });

          window.chat.isChatVisible = false;

          // Set the opacity to 1 after the delay
          gsap.set("#glotagPage", {
            delay: 0.22, // Wait for 0.25 seconds
            x: '-50%',
            y: '-50%',
            opacity: 1 // Then instantly set the opacity to 1
          });

          gsap.to("#glotagPage", {
            scale: 1, // Scale to original size
            top: '50%', // Position at 50% from the top
            left: '50%', // Position at 50% from the left
            width: '85%', // Set width to 85%
            height: '85%', // Set height to 85%
            delay: 0.22, // Delay the start of the animation by 0.25 seconds
            ease: "power1.inOut",
            onComplete: () => {
              console.log('#glotagPage scale animation complete!');
              document.getElementById('glotagPageContainer').style.display = 'flex';
            }
          });
        }
        
        if (this.gloPage === 'player' || this.gloPage === 'home') {
          console.log('styling player card styling for player/home page')
          this.glotagElement.style.height = '20%';
          this.glotagElement.style.width = '50%';
          console.error('setting glotag height and width to 20%, 50%')
          this.glotagElement.style.position = 'absolute';
          this.glotagElement.style.left = '11%';
          this.glotagElement.style.top = '11%';
          this.glotagElement.style.borderRadius = '1rem';
          this.glotagElement.style.backgroundSize = 'cover';

          console.log('checking active player active glotag', window.client.activePlayer.playerInfo)
          if (window.client.activePlayer && window.client.activePlayer.playerInfo.activeGlotag) {
            this.glotagElement.style.background = `url(/style/graphics/token_images${window.client.activePlayer.playerInfo.activeGlotag.metadata.mainImg}.webp)`;
            this.usernameElement.style.color = window.client.activePlayer.playerInfo.activeGlotag.metadata.textColor;
          } else {
            this.glotagElement.style.background = 'black';
            this.usernameElement.style.color = 'white';
          }
          console.log('set client active glotag', this.glotagElement.style.background);

          // pfp
          this.pfpElement.style.borderRadius = '50%';
          this.pfpElement.style.height = '80%';
          this.pfpElement.style.width = 'auto';
          this.pfpElement.style.aspectRatio = '1/1';
          this.pfpElement.style.position = 'absolute';
          this.pfpElement.style.top = '10%';
          this.pfpElement.style.left = '2.5%';
          this.pfpElement.style.backgroundSize = 'cover';

          if (window.client.activePlayer && window.client.activePlayer.playerInfo.activePfp) {
            this.pfpElement.style.backgroundImage = `url(/style/graphics/token_images${window.client.activePlayer.playerInfo.activePfp.metadata.mainImg}.webp)`;
          } else {
            this.pfpElement.style.backgroundImage = 'url(/style/graphics/pfp.webp)';
          }
          console.log('set active player active pfp', this.pfpElement.style.backgroundImage);
      
          // username
          if (!this.usernameElement) {
            this.usernameElement = document.createElement('div');
            this.usernameElement.id = 'usernameElement';
            this.glotagElement.appendChild(this.usernameElement);
          }
          this.usernameElement.style.marginLeft = '';
          this.usernameElement.style.fontSize = '4rem';
          this.usernameElement.style.position = 'absolute';
          this.usernameElement.style.top = '33%';
          this.usernameElement.style.left = '25%';
      
          // level display
          if (!this.levelDisplay) {
            this.levelDisplay = document.createElement('div');
            this.levelDisplay.id = 'levelDisplay';
            this.glotagElement.appendChild(this.levelDisplay);
          }
          this.levelDisplay.style.fontSize = '4rem';
          this.levelDisplay.style.color = 'white';
          this.levelDisplay.style.position = 'absolute';
          this.levelDisplay.style.top = '35%';
          this.levelDisplay.style.left = '82%';
          this.levelDisplay.style.textAlign = 'center';
          // this.levelDisplay.style.display = 'flex'; // TEMPORARY FOR DEMO
          this.levelDisplay.style.display = 'none';
          this.levelDisplay.style.flexDirection = 'column';

          // back button
          if (!this.backButton) {
            this.backButton = document.createElement('div');
            this.backButton.id = 'backButton';
            this.glotagPage.appendChild(this.backButton);
          }
          this.backButton.innerText = '<';
          this.backButton.style.position = 'absolute';
          this.backButton.style.top = '13%';
          this.backButton.style.left = '80%';
          this.backButton.style.width = '20px';
          this.backButton.style.height = '20px';
          this.backButton.style.fontSize = '5rem';
          this.backButton.style.display = 'flex';
          this.backButton.style.color = 'white';
          this.backButton.addEventListener('click', this.backToClientPage.bind(this));
        } else {
          console.log('shrinking')
          this.shrinkCallingCard();
        }
        this.usernameElement.innerText = window.client.activePlayer.playerInfo.nickname;
        this.levelDisplay.innerText = `${window.client.activePlayer.playerInfo.gloLvl}`;

        // if(window.client.activePlayer.playerInfo.activeNfts.pfp) {
        //   //fetch metadata
        //   console.log('player has a set pfp')
        //   const pfp = window.client.loadedNfts.get(window.client.activePlayer.playerInfo.activeNfts.pfp);
        //   if (!pfp) {
        //     console.log('player pfp not loaded, fetching metadata for', window.client.activePlayer.playerInfo.activeNfts.pfp)
        //     this.fetchUserNftMetadata(window.client.activePlayer.playerInfo.activeNfts.pfp);

        //     window.client.socket.once('return_metadata', (metadata) => {
        //       console.log('received metadata for pfp', metadata);
        //       this.pfpElement.style.backgroundImage = `url('/style/graphics/token_images${metadata.mainImg}.webp')`;
        //       window.client.addToLoadedNfts([{
        //         tokenId: window.client.activePlayer.playerInfo.activeNfts.pfp,
        //         metadata
        //       }]);
        //     });
        //   } else {
        //     console.log('player pfp already loaded', pfp.metadata.mainImg);
        //     this.pfpElement.style.backgroundImage = `url(/style/graphics/token_images${pfp.metadata.mainImg}.webp)`;
        //   }
        // } else {
        //   this.pfpElement.style.backgroundImage = `url(/style/graphics/pfp.png)`;
        // }

        // if(window.client.gloInfo.activeGlotag) {
        //   //fetch metadata
        //   console.log('player has a set glotag')
        //   const glotag = window.client.loadedNfts.get(window.client.gloInfo.activeNfts.glotag);
        //   if (!glotag) {
        //     console.log('player glotag not loaded, fetching metadata for', window.client.gloInfo.activeGlotag)
        //     this.fetchUserNftMetadata(window.client.gloInfo.activeNfts.glotag);

        //     window.client.socket.once('return_metadata', (metadata) => {
        //       console.log('received metadata for glotag', metadata);
        //       this.glotagElement.style.backgroundImage = `url(/style/graphics/token_images${metadata.mainImg}.webp)`;
        //       window.client.addToLoadedNfts([{
        //         tokenId: window.client.gloInfo.activeNfts.glotag,
        //         metadata
        //       }]);
        //     });
        //   } else {
        //     console.log('player glotag already loaded', glotag.metadata.mainImg);
        //     this.glotagElement.style.backgroundImage = `url(/style/graphics/token_images${glotag.metadata.mainImg}.webp)`;
        //   }
        // } else {
        //   this.glotagElement.style.backgroundImage = 'black';
        // }
        break;
      case 'guest':
        if (!this.glotagElement) {
          this.glotagElement = document.createElement('div');
          this.glotagElement.style.opacity = '0.9';
          this.glotagElement.id = 'gloTagElement';     
          this.glotagElement.className = 'gloTag-element';     
          this.pfpElement = document.createElement('div');
          this.pfpElement.id = 'pfpElement';
          this.glotagElement.appendChild(this.pfpElement);
          
          this.usernameElement = document.createElement('div');
          this.usernameElement.id = 'usernameElement';
          this.glotagElement.appendChild(this.usernameElement);
        }
        document.body.appendChild(this.glotagElement);
        this.glotagElement.style.backgroundColor = "black";
        console.log('set client active glotag', this.glotagElement.style.background);
        this.glotagElement.style.backgroundSize = 'cover';
        this.glotagElement.style.position = "absolute";
        this.glotagElement.style.borderRadius = '1rem';
        this.glotagElement.style.top = "1vh";
        this.glotagElement.style.left = '';
        this.glotagElement.style.right = "1vw";
        this.glotagElement.style.height = '87px';
        this.glotagElement.style.width = '330px';
        console.log('case guest, im a retard, width is 330px');
        this.glotagElement.style.display = "flex";
        this.glotagElement.style.alignItems = "center";
        this.glotagElement.style.zIndex = "7";
        this.glotagElement.style.fontFamily = "Gabarito, sans-serif";
        this.glotagElement.style.fontWeight = "bold";
        this.glotagElement.style.cursor = 'pointer';
        // this.glotagElement.style.borderTop = '0px solid white';
        // this.glotagElement.style.borderBottom = '6px solid white';
        // this.glotagElement.style.borderRight = '0px solid white';
        // this.glotagElement.style.borderLeft = '6px solid white';
        // this.glotagElement.style.boxShadow = '-0.025rem 0 0.025rem #FFFFFF, 0 0.025rem 0.025rem #FFFFFF, -0.25rem 0.25rem 0.25rem #FFFFFF, -0.1rem 0.1rem 0.1rem #FFFFFF, -0.35rem 0.35rem 0.35rem #FFFFFF, inset 0 0 0.1625rem #FFFFFF';
        break;
      case 'calling_card':
        if (!this.glotagElement) {
          this.glotagElement = document.createElement('div');
          this.glotagElement.id = 'gloTagElement';
          this.glotagElement.className = 'gloTag-element';
          this.glotagElement.style.opacity = '0.9';
          
          this.pfpElement = document.createElement('div');
          this.pfpElement.id = 'pfpElement';
          this.glotagElement.appendChild(this.pfpElement);
          
          this.usernameElement = document.createElement('div');
          this.usernameElement.id = 'usernameElement';
          this.glotagElement.appendChild(this.usernameElement);
        }
        document.body.appendChild(this.glotagElement);
        if (window.chat && window.chat.chatElement) {
          document.body.appendChild(window.chat.chatElement);
          window.chat.chatElement.style.width = '340px';
          console.log('setting small chat height on stylecallingcard: callingcard');
          window.chat.chatElement.style.height = window.chat.isChatVisible ?  '93vh' : '96px';
          window.chat.chatElement.style.top = '1vh';
          window.chat.chatElement.style.right = '1vw';
          window.chat.chatElement.style.left = '';       


          Array.from(window.chat.chatElement.children).forEach(child => {
            if (child.id === 'inputContainer') {
              child.style.display = 'flex';
            }else if (child.className === 'drag-down') {
              child.style.display = 'flex';
            }else {
              child.style.display = 'block';
            }
          });
        }
        // this.glotagElement.style.backgroundImage = 'linear-gradient(45deg, rgba(140, 0, 255, .6) 0%, rgba(2, 242, 114, .7) 100%)';

        this.glotagElement.style.position = "absolute";
        this.glotagElement.style.borderRadius = '1rem';
        this.glotagElement.style.backgroundSize = 'cover';
        this.glotagElement.style.top = "1vh";
        this.glotagElement.style.left = '';
        this.glotagElement.style.right = "1vw";
        this.glotagElement.style.height = '87px';
        this.glotagElement.style.width = '330px';
        this.glotagElement.style.display = "flex";
        this.glotagElement.style.alignItems = "center";
        this.glotagElement.style.zIndex = "7";
        this.glotagElement.style.fontFamily = "Gabarito, sans-serif";
        this.glotagElement.style.fontWeight = "bold";
        this.glotagElement.style.cursor = 'pointer';
        // this.glotagElement.style.borderTop = '0px solid white';
        // this.glotagElement.style.borderBottom = '6px solid white';
        // this.glotagElement.style.borderRight = '0px solid white';
        // this.glotagElement.style.borderLeft = '6px solid white';
        // this.glotagElement.style.boxShadow = '-0.025rem 0 0.025rem #FFFFFF, 0 0.025rem 0.025rem #FFFFFF, -0.25rem 0.25rem 0.25rem #FFFFFF, -0.1rem 0.1rem 0.1rem #FFFFFF, -0.35rem 0.35rem 0.35rem #FFFFFF, inset 0 0 0.1625rem #FFFFFF';
        if (window.client.gloInfo.username.length > 20) {
          this.usernameElement.innerText = window.client.gloInfo.username.substring(0, 8) + '...' + window.client.gloInfo.username.substring(window.client.gloInfo.username.length - 5);
          this.usernameElement.style.fontSize = '2rem';
        } else {
          this.usernameElement.innerText = window.client.gloInfo.username;
          this.usernameElement.style.fontSize = '3rem';
        }
        this.usernameElement.style.top = '34%';
        this.levelDisplay.style.fontSize = '1rem';
        this.levelDisplay.style.right = '5%';
        this.levelDisplay.style.top = '15%';
        this.pfpElement.style.top = '';
        this.levelDisplay.style.left = '';
        // PFP adjustments based on the presence of a picture
        if (window.client.gloInfo.activePfp) {
          this.pfpElement.style.backgroundImage = `url('/style/graphics/token_images${window.client.gloInfo.activePfp.metadata.mainImg}.webp')`;
          this.pfpElement.style.backgroundSize = 'cover'; 
          this.pfpElement.style.backgroundPosition = 'center';
        } else {
          this.pfpElement.style.backgroundImage = `url(/style/graphics/pfp.png)`;
        }

        //glotag custom styling
        if (window.client.gloInfo.activeGlotag) {
          this.glotagElement.style.backgroundImage = `url('/style/graphics/token_images${window.client.gloInfo.activeGlotag.metadata.mainImg}.webp')`;
          this.usernameElement.style.color = window.client.gloInfo.activeGlotag.metadata.textColor;
        } else {
          this.glotagElement.style.backgroundColor = 'black';
          this.usernameElement.style.color = 'white';
        }
        console.log('set client active glotag', this.glotagElement.style.background);

        // Check if the animations have been run before
        let isFirstLoad = typeof window.isFirstLoad === 'undefined' || window.isFirstLoad;

        if (isFirstLoad) {
          // This is the first load
          window.isFirstLoad = false;
        }

        console.log('setting pfpelement height to 5vh w/gsap');
        gsap.to(this.pfpElement, {
          height: '5vh',
          borderRadius: '50%',
          marginLeft: '1.5vh',
          marginRight: '1.5vh',
          border: '2px solid black',
          duration: isFirstLoad ? 0 : 0.25,
          delay: isFirstLoad ? 0 : 0.5
        });

        gsap.to(this.usernameElement, {
          top: '18%',
          duration: isFirstLoad ? 0 : 0.25,
          delay: isFirstLoad ? 0 : 0.5
        });
        break;
      default:
        console.error('Invalid Glotag Mode', this.glotagMode)
    }
  }

  createFriendList() {
    // create friend list page
    if (this.friendList) {
      // show luncman stats
      this.friendList.handleGloPage();
    } else {
      this.friendList = new FriendList();
    }
  }

  createNftList() {
    // create nft list
    if (this.nftList) {
      this.nftList.handleGloPage();
    } else {
      this.nftList = new NftList();
    }
  }

  createLuncmanStats() {
    if (this.luncmanStats) {
      // show luncman stats
      this.luncmanStats.handleGloPage();
    } else {
      this.luncmanStats = new LuncmanStats();
    }
  }

  createWalletsMenu() {
    if (this.walletsMenu) {
      // show luncman stats
      this.walletsMenu.handleGloPage();
    } else {
      this.walletsMenu = new Wallets();
    }
  }

  createSettingsMenu() {
    if (this.settingsMenu) {
      // show luncman stats
      this.settingsMenu.handleGloPage();
    } else {
      this.settingsMenu = new Settings();
    }
  }

  createNftSelectionMenu() {
    if (this.nftSelectionMenu) {
      // show luncman stats
      this.nftSelectionMenu.handleGloPage();
    } else {
      this.nftSelectionMenu = new NftSelection();
    }
  }

  showLuncmanStats() {
    this.gloPage = 'luncman_stats';

    this.hideHomePag();
    this.luncmanStats.showLuncmanStats();
  }

  hideLuncmanStats() {
    this.luncmanStats.hideLuncmanStats();
  }

  createFriendsList() {

    this.friendsList = new FriendList();
  
    // friends title
    this.friendsTitle = document.createElement('div');
    this.friendsContainer.appendChild(this.friendsTitle);
    this.friendsTitle.style.position = 'absolute';
    this.friendsTitle.style.top = '40%';
    this.friendsTitle.style.left = '5%';
    this.friendsTitle.style.fontSize = '2rem';
    this.friendsTitle.innerText = 'FRIENDS';
  }

  showFriendList() {
    this.gloPage = 'friend_list';
    this.friendsList.showFriendList();
  }

  hideFriendsList() { 
  }

  backToClientPage() {
    console.log('going back to home glotag')
    window.client.switchingPlayers = true;
    window.client.activePlayer = null;
    console.error('setting glopage to home')
    this.gloPage = 'home';
    this.glotagMode = 'glotag';
    this.handleGloPage();
    if (this.backButton) {
      this.backButton.style.display = 'none';
    }
  }

  resetToClient() {
    console.log('resetting to client glotag')
    if (!window.client.switchingPlayers) window.client.switchingPlayers = true;
    window.client.activePlayer = null;

    if (this.nftList.nfts.length > 0) {
      this.nftList.innerText = '';
    }

    if (this.friendListHomeElement) {
      this.friendListHomeElement.innerHTML = '';
    }

    if (this.nftListHomeElement) {
      this.nftListHomeElement.innerHTML = '';
    }

    const inspectNftContainer = document.getElementById('inspectNftContainer');
    if (inspectNftContainer) {
      inspectNftContainer.remove();
    }

    if (this.backButton) {
      this.backButton.style.display = 'none';
    }
    console.error('setting glopage to home')
    this.gloPage = 'home';
    this.glotagMode = 'calling_card';
    this.handleGloPage();
    this.handleGlotagMode();
  }

  fetchUserNftMetadata(nftId) {
    window.client.socket.emit('get_nft_metadata', nftId);
  }
}

class LuncmanStats {
  constructor() {
    console.log('creating Luncman Stats')

    this.handleGloPage();
  }

  handleGloPage() {
    if (window.glotag.gloPage === 'home' || window.glotag.gloPage === 'player') {
      // handle home page
      console.log('glopage = home/player')
      this.createHomeLuncmanStats();
      this.hideLuncmanStatsPage();
    } else if (window.glotag.gloPage == 'luncman_stats') {
      // handle luncman stats page
      console.log('glopage = luncman_stats')
      this.createLuncmanStatsPage();
      this.hideHomeLuncmanStats();
    } else {
      this.hideHomeLuncmanStats();
      this.hideLuncmanStatsPage();
    }
  }

  changeGloPage(page) {
    window.glotag.gloPage = page;
    window.glotag.handleGloPage();
  }

  createHomeLuncmanStats() {
    // add luncman portal
    if (this.luncmanDisplay) {
      this.luncmanDisplay.style.display = 'flex';
    } else {
      this.luncmanDisplay = document.createElement('div');
      this.luncmanDisplay.id = 'luncmanDisplay';
      window.glotag.glotagPage.appendChild(this.luncmanDisplay);
      this.luncmanDisplay.style.backgroundImage = 'url(/style/graphics/glotagLMan.png)';
      this.luncmanDisplay.style.backgroundSize = '100%';
      this.luncmanDisplay.style.height = '12.5%';
      this.luncmanDisplay.style.aspectRatio = '1/1';
      this.luncmanDisplay.style.position = 'absolute';
      this.luncmanDisplay.style.top = '79%';
      this.luncmanDisplay.style.left = '10%';
      this.luncmanDisplay.style.cursor = 'pointer';
      this.luncmanDisplay.addEventListener('click', this.handleLuncmanStatsClick.bind(this));
    }

    // Assuming GSAP is already included in your project
    gsap.to("#luncmanDisplay", {
      scale: 1.05, // Scales up to 110%
      duration: 0.25,
      ease: "power1.inOut",
      paused: true
    }).eventCallback("onComplete", () => {
      gsap.to("#luncmanDisplay", {
        scale: 1, // Scale back to original size
        duration: 0.25,
        ease: "power1.inOut"
      });
    });

    document.getElementById('luncmanDisplay').addEventListener('mouseenter', () => {
      gsap.to("#luncmanDisplay", { scale: 1.05, duration: 0.25, ease: "power1.inOut" });
    });

    document.getElementById('luncmanDisplay').addEventListener('mouseleave', () => {
      gsap.to("#luncmanDisplay", { scale: 1, duration: 0.25, ease: "power1.inOut" });
    });
  }

  handleLuncmanStatsClick() {
    let gsapState = Flip.getState('#gloTagElement');
    this.changeGloPage('luncman_stats')
    this.previousGloPage = 'luncman_stats';
    Flip.from(gsapState, {
      duration: 0.33,
      ease: "power1.inOut",
      absolute: true,
      onComplete: () => console.log('Flip animation complete!')
    });
  }
    
  createLuncmanStatsPage() {
    // Add Headers
    if (this.luncmanStatsHeader) {
      this.luncmanStatsHeader.style.display = 'flex';
    } else {
      this.luncmanStatsHeader = document.createElement('div');
      window.glotag.glotagPage.appendChild(this.luncmanStatsHeader)
      this.luncmanStatsHeader.style.display = 'flex';
      this.luncmanStatsHeader.innerText = 'LUNCMAN';
      this.luncmanStatsHeader.style.color = '#ffd700';
      this.luncmanStatsHeader.style.fontSize = '3rem';
      this.luncmanStatsHeader.style.position = 'absolute';
      this.luncmanStatsHeader.style.top = '10.5%';
      this.luncmanStatsHeader.style.left = '70%';
      this.luncmanStatsHeader.style.transform = 'translate(-50%, -50%)';
      this.luncmanStatsHeader.style.textShadow = "0.15rem 0.15rem 0 #fff, 0.15rem 0.15rem 0 #fff, 0.15rem 0.15rem 0 #fff, 0.15rem 0.15rem 0 #fff";
    }

    // add stats/achievments parent
    if (this.luncmanStatsParent) {
      this.luncmanStatsParent.style.display = 'flex';
      if (this.statsSet) this.refreshLuncmanStats();
    } else {
      this.luncmanStatsParent = document.createElement('div');
      window.glotag.glotagPage.appendChild(this.luncmanStatsParent);
      this.luncmanStatsParent.style.display = 'flex';
      // this.luncmanStatsParent.style.border = '1px dashed white';
      this.luncmanStatsParent.style.position = 'absolute';
      this.luncmanStatsParent.style.top = '57%';
      this.luncmanStatsParent.style.left = '50%';
      this.luncmanStatsParent.style.transform = 'translate(-50%, -50%)';
      this.luncmanStatsParent.style.height = '75%';
      this.luncmanStatsParent.style.width = '90%';
      this.luncmanStatsParent.style.borderRadius = '3rem';

      this.createLuncmanStatsMenu();
      this.createLuncmanStatistics();
      this.createLuncmanAchievements();
    }
  }

  hideLuncmanStatsPage() {
    if (this.luncmanStatsHeader) this.luncmanStatsHeader.style.display = 'none';
    if (this.luncmanStatsParent) this.luncmanStatsParent.style.display = 'none';
  }

  hideHomeLuncmanStats() {
    if (this.luncmanDisplay) this.luncmanDisplay.style.display = 'none';
  }

  createLuncmanStatsMenu() {
    console.log('creating luncman stats menu')
    // Container
    this.container = document.createElement('div');
    this.container.id = 'container';

    // First inner-container
    this.innerContainer1 = document.createElement('div');
    this.innerContainer1.className = 'inner-container';
  
    this.toggle1Achievements = document.createElement('div');
    this.toggle1Achievements.className = 'toggle';
    this.p1Achievements = document.createElement('p');
    this.p1Achievements.innerText = 'Achievements';
    this.toggle1Achievements.appendChild(this.p1Achievements);
  
    this.toggle1Statistics = document.createElement('div');
    this.toggle1Statistics.className = 'toggle';
    this.p1Statistics = document.createElement('p');
    this.p1Statistics.innerText = 'Statistics';
    this.toggle1Statistics.appendChild(this.p1Statistics);
  
    this.innerContainer1.appendChild(this.toggle1Achievements);
    this.innerContainer1.appendChild(this.toggle1Statistics);
  
    // Second inner-container
    this.innerContainer2 = document.createElement('div');
    this.innerContainer2.className = 'inner-container';
    this.innerContainer2.id = 'toggle-container';
  
    this.toggle2Achievements = document.createElement('div');
    this.toggle2Achievements.className = 'toggle';
    this.p2Achievements = document.createElement('p');
    this.p2Achievements.innerText = 'Achievements';
    this.toggle2Achievements.appendChild(this.p2Achievements);
  
    this.toggle2Statistics = document.createElement('div');
    this.toggle2Statistics.className = 'toggle';
    this.p2Statistics = document.createElement('p');
    this.p2Statistics.innerText = 'Statistics';
    this.toggle2Statistics.appendChild(this.p2Statistics);
  
    this.innerContainer2.appendChild(this.toggle2Achievements);
    this.innerContainer2.appendChild(this.toggle2Statistics);
  
    // Appending to container
    this.container.appendChild(this.innerContainer1);
    this.container.appendChild(this.innerContainer2);
  
    // Appending to parent
    this.luncmanStatsParent.appendChild(this.container);
  
    // Adding event listener for toggle functionality
    this.container.addEventListener('click', this.toggleMenus.bind(this));

    // CSS Styling
    const styles = `
      #container {
            width: 97.5%;
            height: 2.5rem;
            margin: auto;
            font-size: 1.75rem;
            position: relative;
            border-radius: 6px;
            top: -45.5%;
            overflow: hidden;
            user-select: none;
            cursor: pointer;
        }
        
        .inner-container {
            position: absolute;
            left: 0;
            top: 0;
            width: inherit;
            height: inherit;
            text-transform: uppercase;
            font-size: .6em;
            letter-spacing: .2em;
        }
        
        .inner-container:first-child {
            color: #ffd700;
        }
        
        .inner-container:nth-child(2) {
            background: #ffd700;
            color: black;
            clip-path: inset(0 50% 0 0);
            transition: .3s cubic-bezier(0,0,0,1);
        }
        
        .toggle {
            width: 50%;
            position: absolute;
            height: inherit;
            display: flex;
            box-sizing: border-box;
        }
        
        .toggle p {
            margin: auto;
        }
        
        .toggle:nth-child(1) {
            right: 0;
        }
    `;
  
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);
  }

  toggleMenus(event) {
    if (event.target.innerText === 'STATISTICS') {
      console.log('toggling statistics')
      this.innerContainer2.style.clipPath = 'inset(0 50% 0 0)';
      this.innerContainer2.style.backgroundColor = '#ffd700';
      this.showLuncmanStatistics();
      this.hideLuncmanAchievements();
    } else if (event.target.innerText === 'ACHIEVEMENTS') {
      console.log('toggling achievements')
      this.innerContainer2.style.clipPath = 'inset(0 0 0 50%)';
      this.innerContainer2.style.backgroundColor = '#ffd700';
      this.hideLuncmanStatistics();
      this.showLuncmanAchievements();
    }
  }

  // create luncman statistics
  createLuncmanStatistics() {
    console.log('creating luncman statistics');
    const statsContainer = document.createElement('div');
    statsContainer.id = 'statsContainer';
    statsContainer.style.position = 'absolute';
    statsContainer.style.top = '58%';
    statsContainer.style.left = '50%';
    statsContainer.style.transform = 'translate(-50%, -50%)';
    statsContainer.style.display = 'flex';
    statsContainer.style.flexDirection = 'row';
    statsContainer.style.flexWrap = 'wrap';    
    statsContainer.style.flexDirection = 'column';
    statsContainer.style.width = '100%'; // Take the full width of the parent
    statsContainer.style.height = '99%'; // Adjust as needed for the view height
    statsContainer.style.overflowY = 'scroll'; // Enable vertical scrolling
    
    // Append custom CSS for scrollbar in the head of the document
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = `
      #statsContainer::-webkit-scrollbar {
        width: 6px !important;
      }
      #statsContainer::-webkit-scrollbar-track {
        background: transparent !important;
      }
      #statsContainer::-webkit-scrollbar-thumb {
        background: #ffd700;
        border-radius: 10px !important;
      }
      @media screen and (max-width: 768px) {
        #statsContainer::-webkit-scrollbar {
          width: 6px !important;
        }
      }
    `;
    document.head.appendChild(styleSheet);

    // Function to style each stat div
    const styleStatDiv = (divElement) => {
      divElement.style.flex = '1 0 29%'; // Each stat will take up roughly half the width of the container
      divElement.style.margin = '1.75%'; // Add some margin for spacing
      divElement.style.padding = '1%';
      divElement.style.border = '2px solid yellow'; // Thin neon yellow border
      divElement.style.backgroundColor = 'lightgoldenrodyellow';
      divElement.style.borderRadius = '1rem'; // This will give the rounded corners
      divElement.style.boxSizing = 'border-box'; // Include padding in width calculation
      divElement.style.textAlign = 'center'; // Center the text
      divElement.style.alignItems = 'center'; // Center content vertically within each stat div
      divElement.style.height = '25%';
      divElement.style.maxWidth = '30%';
      divElement.style.display = 'flex';
      divElement.style.boxShadow = `0 0 5px #ffd700, 0 0 10px #ffd700, 0 0 15px #ffd700, 0 0 20px #ffd700`; // Neon glow effect
      statsContainer.appendChild(divElement);
    };

    //function to style each image
    const styleStatImage = (divElement, imagePath) => {
      const imgElement = document.createElement('img');
      imgElement.src = imagePath; // Set the source of the image
      imgElement.style.height = 'auto'; // Maintain the aspect ratio of the image
      imgElement.style.position = 'relative';
      
      switch(imagePath){
        case '/style/graphics/stats/bitcoincollected.webp':
          imgElement.style.width = '7vh'; // Set the width of the image as needed
          break;
        case '/style/graphics/stats/atomcollected.webp':
          imgElement.style.width = '7vh'; // Set the width of the image as needed
          break;
        case '/style/graphics/stats/ethereumcollected.webp':
          imgElement.style.width = '7vh'; // Set the width of the image as needed
          break;
        case '/style/graphics/stats/solanacollected.webp':
          imgElement.style.width = '7vh'; // Set the width of the image as needed
          break;
        default:
          imgElement.style.width = '10vh'; // Set the width of the image as needed
          break;
      }
      // Append the image to the div
      divElement.appendChild(imgElement);
    };
    
    // Adjust the statsContainer to use flex row direction and wrap
    statsContainer.style.flexDirection = 'row';
    statsContainer.style.flexWrap = 'wrap';

    //style captions
    const styleStatCaption = (divElement, captionElement, innerHTML) => {
      captionElement.style.color = 'black';
      captionElement.style.fontSize = '1.25rem';
      captionElement.style.fontWeight = '999';
      captionElement.style.maxWidth = '75%';
      captionElement.style.textAlign = 'center';
      captionElement.innerHTML = innerHTML;
      switch(divElement.id){
        case 'KDDisplay':
          captionElement.style.marginLeft = '5%';
          break;
        case 'atomCollectedDisplay':
          captionElement.style.marginLeft = '5%';
          break;
        default:
          break;
      }

      // Append the image to the div
      divElement.appendChild(captionElement);
    };

    let highscore;
    let highestLevelReached;
    let playTime;
    let coinsCollected;
    let enemiesKilled;
    let attacksUsed;
    let deaths;
    let coinsPerLevel;
    let attackEfficiency;
    let KD;
    let attacksHit;
    let levelsPlayed;
    let bitcoin;
    let atom;
    let ethereum;
    let solana;

    if (!window.client.activePlayer) {
      highscore = window.client.gloInfo.highscore;
      highestLevelReached = window.client.gameStats.highestLevelReached;
      playTime = window.client.gameStats.totalPlayTime;
      coinsCollected = window.client.gameStats.coinsCollected;
      enemiesKilled = window.client.gameStats.enemiesKilled;
      attacksUsed = window.client.gameStats.attacksUsed;
      deaths = window.client.gameStats.deaths;
      coinsPerLevel = window.client.gameStats.coinsPerLevel;
      attackEfficiency = window.client.gameStats.attackEfficiency;
      KD = window.client.gameStats.KD;
      attacksHit = window.client.gameStats.attacksHit;
      levelsPlayed = window.client.gameStats.levelsPlayed;
      bitcoin = window.client.gameStats.fruitCollected[0].bitcoin;
      atom = window.client.gameStats.fruitCollected[0].atom;
      ethereum = window.client.gameStats.fruitCollected[0].ethereum;
      solana = window.client.gameStats.fruitCollected[0].solana;
    } else {
      highscore = window.client.activePlayer.playerInfo.highscore;
      highestLevelReached = window.client.activePlayer.playerInfo.gameStats.highestLevelReached;
      playTime = window.client.activePlayer.playerInfo.gameStats.totalPlayTime;
      coinsCollected = window.client.activePlayer.playerInfo.gameStats.coinsCollected;
      enemiesKilled = window.client.activePlayer.playerInfo.gameStats.enemiesKilled;
      attacksUsed = window.client.activePlayer.playerInfo.gameStats.attacksUsed;
      deaths = window.client.activePlayer.playerInfo.gameStats.deaths;
      coinsPerLevel = window.client.activePlayer.playerInfo.gameStats.coinsPerLevel;
      attackEfficiency = window.client.activePlayer.playerInfo.gameStats.attackEfficiency;
      KD = window.client.activePlayer.playerInfo.gameStats.KD;
      attacksHit = window.client.activePlayer.playerInfo.gameStats.attacksHit;
      levelsPlayed = window.client.activePlayer.playerInfo.gameStats.levelsPlayed;
      bitcoin = window.client.activePlayer.playerInfo.gameStats.fruitCollected[0].bitcoin;
      atom = window.client.activePlayer.playerInfo.gameStats.fruitCollected[0].atom;
      ethereum = window.client.activePlayer.playerInfo.gameStats.fruitCollected[0].ethereum;
      solana = window.client.activePlayer.playerInfo.gameStats.fruitCollected[0].solana;
    }

    //highscore
    this.highscoreDisplay = document.createElement('div');
    styleStatDiv(this.highscoreDisplay);
    this.highscoreEmoji = document.createElement('div');
    styleStatImage(this.highscoreDisplay, '/style/graphics/stats/highscore.webp'); 
    this.highscoreCaption = document.createElement('div');
    styleStatCaption(this.highscoreDisplay, this.highscoreCaption, 'Highscore: <br>' + highscore);

    //highest level reached
    this.highestLevelReachedDisplay = document.createElement('div');
    styleStatDiv(this.highestLevelReachedDisplay);
    this.highestLevelReachedEmoji = document.createElement('div');
    styleStatImage(this.highestLevelReachedDisplay, '/style/graphics/stats/highestlevelreached.webp');
    this.highestLevelReachedCaption = document.createElement('div');
    styleStatCaption(this.highestLevelReachedDisplay, this.highestLevelReachedCaption, 'Highest LvL Reached: <br>' + highestLevelReached);
    
    //total play time
    this.totalPlayTimeDisplay = document.createElement('div');
    styleStatDiv(this.totalPlayTimeDisplay);
    this.totalPlayTimeEmoji = document.createElement('div');
    styleStatImage(this.totalPlayTimeDisplay, '/style/graphics/stats/totalplaytime.webp');
    this.totalPlayTimeCaption = document.createElement('div');

    function formatPlayTime(totalMilliseconds) {
      let totalSeconds = Math.floor(totalMilliseconds / 1000);
      let remainingSeconds = totalSeconds % 60;
    
      let totalMinutes = Math.floor(totalSeconds / 60);
      let remainingMinutes = totalMinutes % 60;
    
      let totalHours = Math.floor(totalMinutes / 60);
      let remainingHours = totalHours % 24;
    
      let totalDays = Math.floor(totalHours / 24);
    
      return `${totalDays} days, ${remainingHours} hours, ${remainingMinutes} minutes, ${remainingSeconds} seconds`;
    }
    
    // Convert total playtime to a human-readable format
    let totalPlayTime = formatPlayTime(playTime);
    
    styleStatCaption(this.totalPlayTimeDisplay, this.totalPlayTimeCaption, 'Total Play Time: <br>' + totalPlayTime);

    //coins collected
    this.coinsCollectedDisplay = document.createElement('div');
    styleStatDiv(this.coinsCollectedDisplay);
    this.coinsCollectedEmoji = document.createElement('div');
    styleStatImage(this.coinsCollectedDisplay,'/style/graphics/stats/coinscollected.webp')
    this.coinsCollectedCaption = document.createElement('div');
    styleStatCaption(this.coinsCollectedDisplay, this.coinsCollectedCaption, 'Coins Collected: <br>' + coinsCollected);


    //enemies killed
    this.enemiesKilledDisplay = document.createElement('div');
    styleStatDiv(this.enemiesKilledDisplay);
    this.enemiesKilledEmoji = document.createElement('div');
    styleStatImage(this.enemiesKilledDisplay, '/style/graphics/stats/enemieskilled.webp');
    this.enemiesKilledCaption = document.createElement('div');
    styleStatCaption(this.enemiesKilledDisplay, this.enemiesKilledCaption, 'Enemies Killed: <br>' + enemiesKilled);
    
    //attacks used
    this.attacksUsedDisplay = document.createElement('div');
    styleStatDiv(this.attacksUsedDisplay);
    this.attacksUsedEmoji = document.createElement('div');
    styleStatImage(this.attacksUsedDisplay,'/style/graphics/stats/attacksused.webp');
    this.attacksUsedCaption = document.createElement('div');
    styleStatCaption(this.attacksUsedDisplay, this.attacksUsedCaption, 'Attacks Used: <br>' + attacksUsed);


    //deaths
    this.deathsDisplay = document.createElement('div');
    styleStatDiv(this.deathsDisplay);
    this.deathsEmoji = document.createElement('div');
    styleStatImage(this.deathsDisplay, '/style/graphics/stats/deaths.webp');
    this.deathsCaption = document.createElement('div');
    styleStatCaption(this.deathsDisplay, this.deathsCaption, 'Deaths: <br>' + deaths);

    //coins per level
    this.coinsPerLevelDisplay = document.createElement('div');
    styleStatDiv(this.coinsPerLevelDisplay);
    this.coinsPerLevelEmoji = document.createElement('div');
    styleStatImage(this.coinsPerLevelDisplay, '/style/graphics/stats/coinsperlevel.webp');
    this.coinsPerLevelCaption = document.createElement('div');
    styleStatCaption(this.coinsPerLevelDisplay, this.coinsPerLevelCaption, 'Coins Per Level: <br>' + coinsPerLevel);

    //attack efficiency
    this.attackEfficiencyDisplay = document.createElement('div');
    styleStatDiv(this.attackEfficiencyDisplay);
    this.attackEfficiencyEmoji = document.createElement('div');
    styleStatImage(this.attackEfficiencyDisplay, '/style/graphics/stats/attackefficiency.webp');
    this.attackEfficiencyCaption = document.createElement('div');
    styleStatCaption(this.attackEfficiencyDisplay, this.attackEfficiencyCaption, 'Attack Efficiency: <br>' + attackEfficiency);
    
    //kd
    this.KDDisplay = document.createElement('div');
    this.KDDisplay.id = 'KDDisplay';
    styleStatDiv(this.KDDisplay);
    this.KDEmoji = document.createElement('div');
    styleStatImage(this.KDDisplay,'/style/graphics/stats/kd.webp');
    this.KDCaption = document.createElement('div');
    styleStatCaption(this.KDDisplay, this.KDCaption,  'KD: <br>' + KD);

    //attacks hit
    this.attacksHitDisplay = document.createElement('div');
    styleStatDiv(this.attacksHitDisplay);
    this.attacksHitEmoji = document.createElement('div');
    styleStatImage(this.attacksHitDisplay, '/style/graphics/stats/attackshit.webp');
    this.attacksHitCaption = document.createElement('div');
    styleStatCaption(this.attacksHitDisplay, this.attacksHitCaption, 'Attacks Hit: <br>' + attacksHit);

    //levels played
    this.levelsPlayedDisplay = document.createElement('div');
    styleStatDiv(this.levelsPlayedDisplay);
    this.levelsPlayedEmoji = document.createElement('div');
    styleStatImage(this.levelsPlayedDisplay, '/style/graphics/stats/levelsplayed.webp');
    this.levelsPlayedCaption = document.createElement('div');
    styleStatCaption(this.levelsPlayedDisplay, this.levelsPlayedCaption, 'Levels Played: <br>' + levelsPlayed);

    //btc collected
    this.bitcoinCollectedDisplay = document.createElement('div');
    styleStatDiv(this.bitcoinCollectedDisplay);
    this.bitcoinCollectedEmoji = document.createElement('div');
    styleStatImage(this.bitcoinCollectedDisplay, '/style/graphics/stats/bitcoincollected.webp');
    this.bitcoinCollectedCaption = document.createElement('div');
    styleStatCaption(this.bitcoinCollectedDisplay, this.bitcoinCollectedCaption, 'Bitcoin Collected: <br>' + bitcoin);

    //eth collected
    this.ethereumCollectedDisplay = document.createElement('div');
    styleStatDiv(this.ethereumCollectedDisplay);
    this.ethereumCollectedEmoji = document.createElement('div');
    styleStatImage(this.ethereumCollectedDisplay, '/style/graphics/stats/ethereumcollected.webp');
    this.ethereumCollectedCaption = document.createElement('div');
    styleStatCaption(this.ethereumCollectedDisplay, this.ethereumCollectedCaption, 'Ethereum Collected: <br>' + ethereum);

    //atom collected
    this.atomCollectedDisplay = document.createElement('div');
    this.atomCollectedDisplay.id = 'atomCollectedDisplay';
    styleStatDiv(this.atomCollectedDisplay);
    this.atomCollectedEmoji = document.createElement('div');
    styleStatImage(this.atomCollectedDisplay, '/style/graphics/stats/atomcollected.webp');
    this.atomCollectedCaption = document.createElement('div');
    styleStatCaption(this.atomCollectedDisplay, this.atomCollectedCaption, 'Atom Collected: <br>' + atom);

    //sol collected   
    this.solanaCollectedDisplay = document.createElement('div');
    styleStatDiv(this.solanaCollectedDisplay);
    this.solanaCollectedEmoji = document.createElement('div');
    styleStatImage(this.solanaCollectedDisplay,  '/style/graphics/stats/solanacollected.webp');
    this.solanaCollectedCaption = document.createElement('div');
    styleStatCaption(this.solanaCollectedDisplay, this.solanaCollectedCaption, 'Solana Collected: <br>' + solana);

    this.luncmanStatsParent.appendChild(statsContainer);

    this.statsSet = true;
  }

  refreshLuncmanStats() {
    this.statsSet = false;
    let highscore;
    let highestLevelReached;
    let playTime;
    let coinsCollected;
    let enemiesKilled;
    let attacksUsed;
    let deaths;
    let coinsPerLevel;
    let attackEfficiency;
    let KD;
    let attacksHit;
    let levelsPlayed;
    let bitcoin;
    let atom;
    let ethereum;
    let solana;

    if (!window.client.activePlayer) {
      highscore = window.client.gloInfo.highscore;
      highestLevelReached = window.client.gameStats.highestLevelReached;
      playTime = window.client.gameStats.totalPlayTime;
      coinsCollected = window.client.gameStats.coinsCollected;
      enemiesKilled = window.client.gameStats.enemiesKilled;
      attacksUsed = window.client.gameStats.attacksUsed;
      deaths = window.client.gameStats.deaths;
      coinsPerLevel = window.client.gameStats.coinsPerLevel;
      attackEfficiency = window.client.gameStats.attackEfficiency;
      KD = window.client.gameStats.KD;
      attacksHit = window.client.gameStats.attacksHit;
      levelsPlayed = window.client.gameStats.levelsPlayed;
      bitcoin = window.client.gameStats.fruitCollected[0].bitcoin;
      atom = window.client.gameStats.fruitCollected[0].atom;
      ethereum = window.client.gameStats.fruitCollected[0].ethereum;
      solana = window.client.gameStats.fruitCollected[0].solana;
    } else {
      highscore = window.client.activePlayer.playerInfo.highscore;
      highestLevelReached = window.client.activePlayer.playerInfo.gameStats.highestLevelReached;
      playTime = window.client.activePlayer.playerInfo.gameStats.totalPlayTime;
      coinsCollected = window.client.activePlayer.playerInfo.gameStats.coinsCollected;
      enemiesKilled = window.client.activePlayer.playerInfo.gameStats.enemiesKilled;
      attacksUsed = window.client.activePlayer.playerInfo.gameStats.attacksUsed;
      deaths = window.client.activePlayer.playerInfo.gameStats.deaths;
      coinsPerLevel = window.client.activePlayer.playerInfo.gameStats.coinsPerLevel;
      attackEfficiency = window.client.activePlayer.playerInfo.gameStats.attackEfficiency;
      KD = window.client.activePlayer.playerInfo.gameStats.KD;
      attacksHit = window.client.activePlayer.playerInfo.gameStats.attacksHit;
      levelsPlayed = window.client.activePlayer.playerInfo.gameStats.levelsPlayed;
      bitcoin = window.client.activePlayer.playerInfo.gameStats.fruitCollected[0].bitcoin;
      atom = window.client.activePlayer.playerInfo.gameStats.fruitCollected[0].atom;
      ethereum = window.client.activePlayer.playerInfo.gameStats.fruitCollected[0].ethereum;
      solana = window.client.activePlayer.playerInfo.gameStats.fruitCollected[0].solana;
    }

    function formatPlayTime(totalMilliseconds) {
      let totalSeconds = Math.floor(totalMilliseconds / 1000);
      let remainingSeconds = totalSeconds % 60;
    
      let totalMinutes = Math.floor(totalSeconds / 60);
      let remainingMinutes = totalMinutes % 60;
    
      let totalHours = Math.floor(totalMinutes / 60);
      let remainingHours = totalHours % 24;
    
      let totalDays = Math.floor(totalHours / 24);
    
      return `${totalDays} days, ${remainingHours} hours, ${remainingMinutes} minutes, ${remainingSeconds} seconds`;
    }

    this.highscoreCaption.innerHTML = 'Highscore: <br>' + highscore;
    this.highestLevelReachedCaption.innerHTML = 'Highest LvL Reached: <br>' + highestLevelReached;
    this.totalPlayTimeCaption.innerHTML = 'Total Play Time: <br>' + formatPlayTime(playTime);
    this.coinsCollectedCaption.innerHTML = 'Coins Collected: <br>' + coinsCollected;
    this.enemiesKilledCaption.innerHTML = 'Enemies Killed: <br>' + enemiesKilled;
    this.attacksUsedCaption.innerHTML = 'Attacks Used: <br>' + attacksUsed;
    this.deathsCaption.innerHTML = 'Deaths: <br>' + deaths;
    this.coinsPerLevelCaption.innerHTML = 'Coins Per Level: <br>' + coinsPerLevel;
    this.attackEfficiencyCaption.innerHTML = 'Attack Efficiency: <br>' + attackEfficiency;
    this.KDCaption.innerHTML = 'KD: <br>' + KD;
    this.attacksHitCaption.innerHTML = 'Attacks Hit: <br>' + attacksHit;
    this.levelsPlayedCaption.innerHTML = 'Levels Played: <br>' + levelsPlayed;
    this.bitcoinCollectedCaption.innerHTML = 'Bitcoin Collected: <br>' + bitcoin;
    this.ethereumCollectedCaption.innerHTML = 'Ethereum Collected: <br>' + ethereum;
    this.atomCollectedCaption.innerHTML = 'Atom Collected: <br>' + atom;
    this.solanaCollectedCaption.innerHTML = 'Solana Collected: <br>' + solana;
    this.statsSet = true;
  }

  createLuncmanAchievements() {
    this.achievementsDisplay = document.createElement('div');
    this.achievementsDisplay.innerText = 'COMING SOON';
    this.achievementsDisplay.style.position = 'absolute';
    this.achievementsDisplay.style.top = '55%'; // Adjust position as needed
    this.achievementsDisplay.style.left = '50%';
    this.achievementsDisplay.style.transform = 'translate(-50%, -50%)';
    this.achievementsDisplay.style.color = 'white';
    this.achievementsDisplay.style.fontSize = '5rem';
    this.achievementsDisplay.style.textAlign = 'center';
    this.achievementsDisplay.style.display = 'none'; // Initially hidden
    this.luncmanStatsParent.appendChild(this.achievementsDisplay);
  }

  showLuncmanAchievements() {
    this.achievementsDisplay.style.display = 'flex';
  }

  hideLuncmanAchievements() {
    this.achievementsDisplay.style.display = 'none';
  }

  showLuncmanStatistics(){
  this.highscoreDisplay.style.display = 'flex';
  this.highestLevelReachedDisplay.style.display = 'flex';
  this.totalPlayTimeDisplay.style.display = 'flex';
  this.coinsCollectedDisplay.style.display = 'flex';
  this.enemiesKilledDisplay.style.display = 'flex';
  this.attacksUsedDisplay.style.display = 'flex';
  this.deathsDisplay.style.display = 'flex';
  this.coinsPerLevelDisplay.style.display = 'flex';
  this.attackEfficiencyDisplay.style.display = 'flex';
  this.KDDisplay.style.display = 'flex';
  this.attacksHitDisplay.style.display = 'flex';
  this.levelsPlayedDisplay.style.display = 'flex';
  this.bitcoinCollectedDisplay.style.display = 'flex';
  this.ethereumCollectedDisplay.style.display = 'flex';
  this.atomCollectedDisplay.style.display = 'flex';
  this.solanaCollectedDisplay.style.display = 'flex';
  }

  hideLuncmanStatistics(){
  this.highscoreDisplay.style.display = 'none';
  this.highestLevelReachedDisplay.style.display = 'none';
  this.totalPlayTimeDisplay.style.display = 'none';
  this.coinsCollectedDisplay.style.display = 'none';
  this.enemiesKilledDisplay.style.display = 'none';
  this.attacksUsedDisplay.style.display = 'none';
  this.deathsDisplay.style.display = 'none';
  this.coinsPerLevelDisplay.style.display = 'none';
  this.attackEfficiencyDisplay.style.display = 'none';
  this.KDDisplay.style.display = 'none';
  this.attacksHitDisplay.style.display = 'none';
  this.levelsPlayedDisplay.style.display = 'none';
  this.bitcoinCollectedDisplay.style.display = 'none';
  this.ethereumCollectedDisplay.style.display = 'none';
  this.atomCollectedDisplay.style.display = 'none';
  this.solanaCollectedDisplay.style.display = 'none';
  }
}

class FriendList {
  constructor() {
    console.log('creating FriendList Stats')
    this.players = {};
    this.loadedFriends = false;

    this.handleGloPage();
  }

  handleGloPage() {
    console.error('handling glopage, active player:', window.glotag.gloPage)
    switch(window.glotag.gloPage) {
      case 'friend_list':
        this.hideFriendList();
        this.onFriendListPage();
        break;
      case 'home':
        this.hideFriendList();
        this.onHomePage();
        break;
      case 'friend_requests':
        this.hideFriendList();
        this.createFriendRequestsPage();
        break;
      case 'player':
        this.hideFriendList();
        this.onPlayerPage();
      default:
        this.hideFriendList();
        break;
    }
  }

  onFriendListPage() {
    // create friend list page
    this.hideFriendList();
    this.createFriendListPage();
  }

  onHomePage() {
    // create home page friend list
    this.createHomeFriendList();
    if (window.client.switchingPlayers) {
      this.players = {};
      console.error('switching players', window.client.activePlayer)
      if (window.client.activePlayer) {
        console.log('window.client.activePlayer case:', window.client);
        this.fetchAndCreatePlayers(window.client.activePlayer.playerInfo.friends);
      } else {
        console.log('!window.client.activePlayer case:', window.client);
        this.fetchAndCreatePlayers(window.client.gloInfo.friends);
      }
    } else {
      console.error(this.loadedFriends, 'Setting Home')
      if (!this.loadedFriends) {
        console.log('loadedFriends case:', window.client);
        if (window.client.activePlayer) {
          console.log('window.client.activePlayer case:', window.client);
          this.fetchAndCreatePlayers(window.client.activePlayer.playerInfo.friends);
        } else {
          console.log('!window.client.activePlayer case:', window.client);
          this.fetchAndCreatePlayers(window.client.gloInfo.friends);
        }
      } else {
        this.showHomeFriends();
      }
    }
  }

  onPlayerPage() {
    console.error('setting player page')
    console.log('activeplayer:', window.client.activePlayer);
    console.log('fetching friends', window.client.activePlayer.playerInfo)
    this.players = {};
    this.playersLoaded = false;
    this.createHomeFriendList();
    console.log('look:', JSON.parse(JSON.stringify(window.client.activePlayer)));
    console.log('fetching friends', window.client.activePlayer.playerInfo.friends)
    this.fetchAndCreatePlayers(window.client.activePlayer.playerInfo.friends);
    console.log('activeplayer:', window.client.activePlayer);
  }

  createHomeFriendList() {
    if (this.friendListHomeText) {
      this.friendListHomeText.style.display = 'flex';
      this.friendListHomeElement.style.display = 'flex';
      return;
    } else {
      //title
      this.friendListHomeText = document.createElement('div');
      this.friendListHomeText.style.position = 'absolute';
      this.friendListHomeText.id = 'friendListHomeText';
      this.friendListHomeText.style.top = '37%';
      this.friendListHomeText.style.width = '20%';
      this.friendListHomeText.style.height = '12.5%';
      this.friendListHomeText.style.left = '2.5%';
      this.friendListHomeText.style.flexDirection = 'column';
      this.friendListHomeText.style.display = 'flex';
      this.friendListHomeText.style.gap = '7px';
      window.glotag.glotagPage.appendChild(this.friendListHomeText);
      this.friendListHomeTitle = document.createElement('span');
      this.friendListHomeTitle.id = 'friendListTitle';
      this.friendListHomeTitle.innerText = 'FRIENDS:';
      this.friendListHomeText.appendChild(this.friendListHomeTitle);
      this.friendListHomeTitle.style =
        `color: white;
        text-align: center;
        font-size: 2.75vw;
        font-family: 'Gabarito';`;

      this.friendListHomeCount = document.createElement('span');
      this.friendListHomeCount.id = 'friendListCount';
      this.friendListHomeText.appendChild(this.friendListHomeCount);
      this.friendListHomeCount.style =
        `color: white;
        text-align: center;
        font-size: 2vw;
        font-family: 'Gabarito';`;

      // container
      this.friendListHomeElement = document.createElement('div');
      window.glotag.glotagPage.appendChild(this.friendListHomeElement);
      this.friendListHomeElement.id = 'friendList';
      this.friendListHomeElement.style.position = 'absolute';
      this.friendListHomeElement.style.alignItems = 'center';
      this.friendListHomeElement.style.display = 'flex';
      this.friendListHomeElement.style.height = '15%';
      this.friendListHomeElement.style.width = '65%';
      this.friendListHomeElement.style.borderTop = '10px double white';
      this.friendListHomeElement.style.borderBottom = '10px double white';  
      this.friendListHomeElement.style.borderLeft = '10px double white';
      this.friendListHomeElement.style.borderRight = '10px double white';  
      this.friendListHomeElement.style.top = '35%';
      this.friendListHomeElement.style.left = '25%';
      this.friendListHomeElement.style.flexWrap = 'nowrap';
      this.friendListHomeElement.style.overflowX = 'scroll';
      this.friendListHomeElement.style.overflowY = 'hidden';
      this.friendListHomeElement.style.whiteSpace = 'nowrap'; // Prevent wrapping of children
      this.friendListHomeElement.style.justifyContent = 'flex-start'; // Align children to the start        
      this.friendListHomeElement.className = 'home-glotag-container';


      
      // Styles to hide the scrollbar
      const styleSheet = document.createElement('style');
      styleSheet.innerText = `
          #friendList::-webkit-scrollbar {
              display: none;  /* Chrome, Safari, Opera */
          }
          #friendList {
              -ms-overflow-style: none;  /* IE and Edge */
              scrollbar-width: none;  /* Firefox */
          }
      `;
      document.head.appendChild(styleSheet);
    
      // register friends container hover event listener
      this.friendListHomeElement.addEventListener('mouseout', () => {
        this.friendListHomeElement.style.boxShadow = '';
      });

      // Event listener to handle horizontal scrolling with the mouse wheel
      this.friendListHomeElement.addEventListener('wheel', (event) => {
        // Prevent default scrolling behavior
        event.preventDefault();

        // Scroll the element
        this.friendListHomeElement.scrollLeft += event.deltaY;
      }, { passive: false });
    
      // register friends container click event listener to show friends list
      this.friendListHomeElement.addEventListener('click', this.handleFriendListClick.bind(this));
    }
  }

  async fetchAndCreatePlayers(friendData) {
    try {
      // Make sure friends is defined and is an array
      if (!Array.isArray(friendData)) {
        console.log('friendData:', friendData);
        console.error('friends is not an array');
        return;
      }

      const response = await fetch('/get_player_info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ friends: friendData }) // Send the friends array
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const playerDataArray = await response.json();
      console.log('creating playerDataArray:', playerDataArray)
      this.createHomeFriends(playerDataArray); // Use the fetched player info to create Player instances
      this.loadedFriends = true;
    } catch (error) {
      console.error("Could not fetch player info: ", error);
    }
  }

  createHomeFriends(friendsInfo) {
    console.error('Creating home friends with new data:', friendsInfo);
    this.friendListHomeElement.innerHTML = '';

    console.log('Creating home friends from', friendsInfo, this.players);

    if (friendsInfo.length === 0) {
      this.friendListHomeCount.innerText = '(0)'
    }

    friendsInfo.forEach(playerInfo => {
      // Check if playerInfo.walletID exists in this.players, if not create a new Player instance
      if (!this.players[playerInfo.walletID]) {
        this.players[playerInfo.walletID] = new Player('home', playerInfo);
      }
      console.log('Added', playerInfo, 'to friends', this.players);
      this.friendListHomeElement.appendChild(this.players[playerInfo.walletID].previewElement);
      this.friendListHomeCount.innerText = `(${Object.keys(this.players).length})`;
    });
  }

  showHomeFriends() {
    console.error('Showing home friends', this.players);
    this.friendListHomeElement.innerHTML = '';
  
    // Convert the values of the this.players object into an array and then iterate
    Object.values(this.players).forEach(player => {
      this.friendListHomeElement.appendChild(player.previewElement);
    });
  }

  createFriendRequestsPage() {
    console.log('creating friend requests page');
    window.glotag.previousGloPage = 'friend_list';
    if (this.container) {
      this.container.style.display = 'block';
      return;
    }

    // Container
    this.container = document.createElement('div');
    this.container.id = 'container2';
    this.container.style.border = '10px double white';
  
    // Navbar
    this.innerContainer1 = document.createElement('div');
    this.innerContainer1.className = 'inner-container2';
  
    this.toggle1Received = document.createElement('div');
    this.toggle1Received.className = 'toggle active';
    this.p1Received = document.createElement('p');
    this.p1Received.innerText = 'Friend Requests Received';
    this.toggle1Received.appendChild(this.p1Received);
  
    this.toggle1Sent = document.createElement('div');
    this.toggle1Sent.className = 'toggle';
    this.p1Sent = document.createElement('p');
    this.p1Sent.innerText = 'Friend Requests Sent';
    this.toggle1Sent.appendChild(this.p1Sent);
  
    this.innerContainer1.appendChild(this.toggle1Received);
    this.innerContainer1.appendChild(this.toggle1Sent);
  
    // Content container
    this.innerContainer2 = document.createElement('div');
    this.innerContainer2.className = 'inner-container2';
    this.innerContainer2.id = 'toggle-container';
  
    // Appending to container
    this.container.appendChild(this.innerContainer1);
    this.container.appendChild(this.innerContainer2);
  
    // Friend Requests Display Container
    this.friendRequestsContainer = document.createElement('div');
    this.friendRequestsContainer.id = 'friendRequestsContainer';
    this.innerContainer2.appendChild(this.friendRequestsContainer);
  
    // Appending to parent
    window.glotag.glotagPage.appendChild(this.container);
  
    // Adding event listener for toggle functionality
    this.container.addEventListener('click', this.toggleFriendRequestPage.bind(this));

    // CSS Styling
    const styles = `
      #container2 {
        width: 80%;
        top: 25%;
        height:60%;
        margin: auto;
        font-size: 1.75rem;
        position: relative;
        border-radius: 6px;
        overflow: hidden;
        user-select: none;
      }
      
      .inner-container2 {
        width: 100%;
        display: flex;
        text-transform: uppercase;
        font-size: .6em;
        letter-spacing: .2em;
        cursor: pointer;
      }
      
      .inner-container2:first-child {
        background: #000000;
        color: #ffffff;
      }

      #friendRequestsContainer {
        color: white;
        padding: 10px;
        position: absolute;
        top: 15%;
        width: 100%;
        text-align: center;
      }
      
      .toggle {
        width: 50%;
        height: 50px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .toggle p {
        margin: auto;
        text-align: center;
      }

      .toggle.active {
        background-color: #ffd700;
        color: #000000;
      }
    `;
  
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);

    this.showFriendRequestsReceived();
}

toggleFriendRequestPage(event) {
    if (event.target.closest('.toggle') && event.target.innerText === 'FRIEND REQUESTS SENT') {
      console.log('toggling friend requests sent');
      this.innerContainer1.querySelector('.toggle:nth-child(1)').classList.remove('active');
      this.innerContainer1.querySelector('.toggle:nth-child(2)').classList.add('active');
      this.showFriendRequestsSent();
    } else if (event.target.closest('.toggle') && event.target.innerText === 'FRIEND REQUESTS RECEIVED') {
      console.log('toggling friend requests received');
      this.innerContainer1.querySelector('.toggle:nth-child(1)').classList.add('active');
      this.innerContainer1.querySelector('.toggle:nth-child(2)').classList.remove('active');
      this.showFriendRequestsReceived();
    }
}

    showFriendRequestsSent() {
      // Clear any existing data
      this.friendRequestsContainer.innerHTML = '';
      console.log('logging friend request sent:', window.client.gloInfo.friendRequestsSent);
  
      // Example of how you can display the friend requests sent
      // Assuming you have an array of friend requests called friendRequestsSent
      if (window.client.gloInfo.friendRequestsSent && window.client.gloInfo.friendRequestsSent.length > 0) {
        window.client.gloInfo.friendRequestsSent.forEach(request => {
              let p = document.createElement('p');
              console.log(request);
              p.innerText = window.client.gloInfo.walletID + " sent request to " + request; // Modify this based on your data structure
              this.friendRequestsContainer.appendChild(p);
          });
      } else {
        this.friendRequestsContainer.innerText = 'No friend requests sent.';
      }
  }
  
  showFriendRequestsReceived() {
    // Clear any existing data
    this.friendRequestsContainer.innerHTML = '';
    console.log('logging friend request received:', window.client.gloInfo.friendRequestsReceived);

    if (window.client.gloInfo.friendRequestsReceived && window.client.gloInfo.friendRequestsReceived.length > 0) {
        window.client.gloInfo.friendRequestsReceived.forEach(request => {
            let requestDiv = document.createElement('div');
            requestDiv.className = 'friend-request-entry';
            
            let p = document.createElement('p');
            p.innerText = request + " sent request to " + window.client.gloInfo.walletID;
            
            let yesButton = document.createElement('button');
            yesButton.innerText = 'Yes';
            yesButton.addEventListener('click', () => this.handleFriendRequestResponse(request, 'yes'));

            let noButton = document.createElement('button');
            noButton.innerText = 'No';
            noButton.addEventListener('click', () => this.handleFriendRequestResponse(request, 'no'));

            requestDiv.appendChild(p);
            requestDiv.appendChild(yesButton);
            requestDiv.appendChild(document.createTextNode(' / '));
            requestDiv.appendChild(noButton);

            this.friendRequestsContainer.appendChild(requestDiv);
        });
    } else {
        this.friendRequestsContainer.innerText = 'No friend requests received.';
    }
}

handleFriendRequestResponse(requester, response) {
    fetch('/acceptfriend', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ friendWalletID: requester, response: response }),
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
        window.client.getSession();
        // Refresh friend requests or perform some other UI updates based on the response
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}



  handleFriendListClick() {
    let gsapState = Flip.getState('#gloTagElement'); 
    console.log("friend list clicked");
    window.glotag.gloPage = 'friend_list';
    window.glotag.handleGloPage();
    Flip.from(gsapState, {
      duration: 0.33,
      ease: "power1.inOut",
      absolute: true,
      onComplete: () => console.log('Flip animation complete!')
    });
  }

  initGlotagElements() {
    this.glotag = window.glotag.glotag;
  }

  createFriendListPage() {
    // Create the elements
    this.createPageTitle();
    this.createFriendsListContainer();
    this.populateFriendsList();

  }
  

  createPageTitle() {
    if (window.client.activePlayer) return;
    if (this.pageTitle) {
      this.pageTitle.style.display = 'flex';
      this.friendRequestIndicator.style.display = 'flex';
    } else {
      this.pageTitle = document.createElement('h1');
      window.glotag.glotagPage.appendChild(this.pageTitle);
      this.pageTitle.style.display = 'flex';
      this.pageTitle.textContent = 'FRIENDS';
      this.pageTitle.style.color = 'white';
      this.pageTitle.style.position = 'absolute';
      this.pageTitle.style.top = '7.5%';
      this.pageTitle.style.left = '70%';
      this.pageTitle.style.transform = 'translate(-50%, -50%)';
      this.pageTitle.style.fontSize = '3rem';
      this.pageTitle.style.textShadow = "0.15rem 0.15rem 0 #000, 0.15rem 0.15rem 0 #000, 0.15rem 0.15rem 0 #000, 0.15rem 0.15rem 0 #000";

      this.friendRequestIndicator = document.createElement('button');
      this.friendRequestIndicator.className = 'friend-request-btn';

      let svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svgElement.setAttribute('viewBox', '0 0 512 512');
      svgElement.setAttribute('height', '16');

      let pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      pathElement.setAttribute('d', 'M48 64C21.5 64 0 85.5 0 112c0 15.1 7.1 29.3 19.2 38.4L236.8 313.6c11.4 8.5 27 8.5 38.4 0L492.8 150.4c12.1-9.1 19.2-23.3 19.2-38.4c0-26.5-21.5-48-48-48H48zM0 176V384c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V176L294.4 339.2c-22.8 17.1-54 17.1-76.8 0L0 176z');

      svgElement.appendChild(pathElement);
      this.friendRequestIndicator.appendChild(svgElement);

      let friendRequestCount = document.createElement('span');
      friendRequestCount.className = 'friend-request-count';
      friendRequestCount.textContent = '+'; // Replace with actual friend request count

      this.friendRequestIndicator.appendChild(friendRequestCount);

      window.glotag.glotagPage.appendChild(this.friendRequestIndicator);
      this.friendRequestIndicator.addEventListener('click', this.handleFriendRequestClick);
    }
  }

  createFriendsListContainer() {
    if (this.friendsListContainer) {
      this.friendsListContainer.style.display = 'flex';
      if (this.friendsListController) this.friendsListController.style.display = 'flex';
      console.log('set containers to display');
    } else {
      this.friendsListContainer = document.createElement('div');
      window.glotag.glotagPage.appendChild(this.friendsListContainer);
      this.friendsListContainer.style.display = 'flex';
      this.friendsListContainer.style.position = 'absolute';
      this.friendsListContainer.style.top = '22.5%';
      this.friendsListContainer.style.left = '5%';
      this.friendsListContainer.style.width = '45%';
      this.friendsListContainer.style.height = '65%';
      this.friendsListContainer.style.overflowY = 'scroll';
      this.friendsListContainer.style.border = '10px double white';
      this.friendsListContainer.style.borderRadius = '1rem';
      this.friendsListContainer.style.flexWrap = 'wrap';
      this.friendsListContainer.style.flexDirection = 'row';
      this.friendsListContainer.style.alignItems = 'flex-start';
      this.friendsListContainer.style.justifyContent = 'flex-start';
      this.friendsListContainer.style.maxHeight = '100%';
      this.friendsListContainer.style.overflowY = 'auto';

      if (Object.keys(this.players).length === 0) {
        console.log('poop');
        const warning = document.createElement('span');
        warning.id = 'friend-list-warning';
        warning.innerText = 'You have no friends';
        warning.style.color = 'white';
        warning.style.left = '50%';
        warning.style.transform = 'translateX(-50%)';
        warning.style.top = '45%';
        warning.style.position = 'absolute';
        warning.style.width = '80%';
        warning.style.textAlign = 'center';
        this.friendsListContainer.appendChild(warning);
        this.friendsListContainer.style.width = '89%';
        return;
      }

      this.friendsListController = document.createElement('div');
      this.friendsListController.style.position = 'absolute';
      this.friendsListController.style.top = '24%';
      this.friendsListController.style.right = '5%';
      this.friendsListController.style.width = '35%';
      this.friendsListController.style.height = '65%';
      this.friendsListController.style.display = 'flex';
      this.friendsListController.style.flexDirection = 'column';
      window.glotag.glotagPage.appendChild(this.friendsListController);

      // Create the div element
      const groupDiv = document.createElement('div');
      groupDiv.className = 'friends-list-group';

      // Create the SVG element
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'friends-list-icon');
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('filter', 'none');

      // Create the G element
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');

      // Create the path element
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', 'M21.53 20.47l-3.66-3.66C19.195 15.24 20 13.214 20 11c0-4.97-4.03-9-9-9s-9 4.03-9 9 4.03 9 9 9c2.215 0 4.24-.804 5.808-2.13l3.66 3.66c.147.146.34.22.53.22s.385-.073.53-.22c.295-.293.295-.767.002-1.06zM3.5 11c0-4.135 3.365-7.5 7.5-7.5s7.5 3.365 7.5 7.5-3.365 7.5-7.5 7.5-7.5-3.365-7.5-7.5z');

      // Append the path to the G, and the G to the SVG
      g.appendChild(path);
      svg.appendChild(g);

      // Create the input element
      const input = document.createElement('input');
      input.setAttribute('placeholder', 'Search');
      input.setAttribute('type', 'search');
      input.className = 'friends-list-input';
      input.addEventListener('input', (event) => {
        this.searchFriends(event.target.value);
        this.activeFriendContainer.innerHTML = '';
      });

      // Append the SVG and input to the div
      groupDiv.appendChild(svg);
      groupDiv.appendChild(input);

      // Append the div to the friendsListContainer
      this.friendsListController.appendChild(groupDiv);
    }
  }

  searchFriends(searchWord){
    const playerNames = Object.keys(this.players);
    const playersArray = playerNames.map(name => this.players[name]);
    const filteredPlayers = playersArray.filter(player => 
      player.gloInfo.username.toLowerCase().includes(searchWord.toLowerCase())
    );
    console.log('Filtered players:', filteredPlayers);
    window.glotag.friendList.friendsListContainer.innerHTML = '';
    filteredPlayers.forEach(player => {
      window.glotag.friendList.friendsListContainer.appendChild(player.previewElement);
    });
  }

  handleFriendRequestClick() {
    console.log('calling handlefriendrequestclick');
    window.glotag.gloPage = 'friend_requests';
    window.glotag.handleGloPage();
  }

  populateFriendsList() {
    if (Object.keys(this.players).length === 0) return;
    // Clear the friends list container before appending the player instances
    this.friendsListContainer.innerHTML = '';
  
    // Set container styles for a grid layout with a maximum of 6 items per row
    this.friendsListContainer.style.display = 'grid';
    this.friendsListContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
    this.friendsListContainer.style.gridTemplateRows = 'repeat(3, 1fr)';
    this.friendsListContainer.style.gap = '10px';
    this.friendsListContainer.style.overflowY = 'auto'; // Allow vertical scrolling
  
    // Append each player's preview element to the friends list container
    console.log('populating friends list with', this.friends)
    Object.values(this.players).forEach(player => {
      // Append the existing preview element to the friends list container
      this.friendsListContainer.appendChild(player.previewElement);

      player.state = 'friend_list';
      player.handleState();
    });
  }

  hideFriendList() {
    switch (window.glotag.gloPage) {
      case 'friend_list':
        if (this.friendListHomeElement) this.friendListHomeElement.style.display = 'none';
        if (this.friendListHomeText)   this.friendListHomeText.style.display = 'none';
        if (this.container) this.container.style.display = 'none';
        break;
      case 'home':
        if (this.friendsListContainer) this.friendsListContainer.style.display = 'none';
        if (this.friendsListController) this.friendsListController.style.display = 'none';
        if (this.pageTitle) this.pageTitle.style.display = 'none';
        if (this.friendRequestIndicator) this.friendRequestIndicator.style.display = 'none';
        if (this.container) this.container.style.display = 'none';
        break;
      case 'player':
        if (this.friendsListContainer) this.friendsListContainer.style.display = 'none';
        if (this.friendsListController) this.friendsListController.style.display = 'none';
        if (this.pageTitle) this.pageTitle.style.display = 'none';
        if (this.friendRequestIndicator) this.friendRequestIndicator.style.display = 'none';
        if (this.container) this.container.style.display = 'none';
        break;
      default:
        if (this.friendListHomeElement) this.friendListHomeElement.style.display = 'none';
        if (this.friendListHomeText)   this.friendListHomeText.style.display = 'none';
        if (this.friendsListContainer) this.friendsListContainer.style.display = 'none';
        if (this.friendsListController) this.friendsListController.style.display = 'none';
        if (this.friendRequestIndicator) this.friendRequestIndicator.style.display = 'none';
        if (this.pageTitle) this.pageTitle.style.display = 'none';
        if (this.container) this.container.style.display = 'none';
        break;
    }
  }
}

class NftList {
  constructor() {
    console.log('creating NFT List');
    this.nfts = [];
    this.handleGloPage();

    document.addEventListener('receivedPlayerNfts', this.handleNftData.bind(this));
    document.addEventListener('receivedNftData', this.handleNftData.bind(this));

    if (!window.client.activePlayer && window.client.clientNfts) {
      this.createClientNfts();
    } else if (window.client.activePlayer && window.client.retrievedPlayerNfts) {
      this.createPlayerNfts();
    }
  }

  handleGloPage() {
    console.error('glopage =', window.glotag.gloPage);
    switch(window.glotag.gloPage) {
      case 'home':
        this.onHomePage();
        break;
      case 'library':
        // handle library page
        this.onLibraryPage();
        break;
      case 'player':
        this.onPlayerPage();
      default:
        this.hideNftList();
        break;
    }
  }

  async onHomePage() {
    this.resetNftState();
    this.hideNftList();
    try {
      await this.createHomeNftList();
      console.log('creating client nfts', window.client.allNfts)
      this.createHomeNfts(window.client.allNfts);
    } catch (error) {
      console.error('Failed to create home NFT list:', error);
    }
  }

  async onPlayerPage() {
    if (this.nftListHomeElement) this.nftListHomeElement.innerHTML = '';
    this.hideNftList();
    console.log('creating player nfts', window.client.playerNfts)
    if (this.receivedPlayerNfts) {
      try {
        await this.createHomeNftList();
        this.createPlayerNfts();
      } catch (error) {
        console.error('Failed to create home NFT list:', error);
      }
    } else {
      console.log('no received nfts');
      this.createHomeNftList();
    }

  }

  onLibraryPage() {
    // Create or show the NFT page and its container
    this.hideNftList();
    this.createNftPageContainer();
    this.populateNftPage();
  }

  onReceivedPlayerNfts() {
    if (!window.client.activePlayer) return;
    console.log('resetting nfts', this.nfts)
    this.receivedPlayerNfts = true;
    this.nftListHomeCount.innerText = `(${window.client.totalPlayerNfts})`;
    // Check if the event data includes NFTs and recreate them
    this.createPlayerNfts(window.client.retrievedPlayerNfts);
  }

  createHomeNftList(child) {
    if (window.glotag.gloPage !== 'home' && window.glotag.gloPage !== 'player') return;
    return new Promise((resolve, reject) => {
      console.log('creating home nft list')
      if (!this.nftListHomeText) {
          //title
          this.nftListHomeText = document.createElement('div');
          this.nftListHomeText.id = 'nftListHomeText';
          window.glotag.glotagPage.appendChild(this.nftListHomeText);
          this.nftListHomeText.style =
            `position: absolute;
            top: 57%;
            width: 20%;
            height: 12.5%;
            left: 2.5%;
            flex-direction: column;
            display: flex;
            gap: 7px;`;
          this.nftListHomeTitle = document.createElement('span');
          this.nftListHomeTitle.id = 'nftListHomeTitle';
          this.nftListHomeTitle.innerText = 'NFTS:';
          this.nftListHomeText.appendChild(this.nftListHomeTitle);
          this.nftListHomeTitle.style =
            `color: white;
            font-size: 2.75vw;
            text-align: center;
            font-family: 'Gabarito';`;
          this.nftListHomeCount = document.createElement('span');
          this.nftListHomeCount.id = 'nftListHomeCount';
          this.nftListHomeText.appendChild(this.nftListHomeCount);
          this.nftListHomeCount.style =
            `color: white;
            font-size: 2vw;
            text-align: center;
            font-family: 'Gabarito';`;
    
          // container
          this.nftListHomeElement = document.createElement('div');
          window.glotag.glotagPage.appendChild(this.nftListHomeElement);

          // Styles to hide the scrollbar
          const styleSheet = document.createElement('style');
          styleSheet.innerText = `
              #nftList::-webkit-scrollbar {
                  display: none;  /* Chrome, Safari, Opera */
              }
              #nftList {
                  -ms-overflow-style: none;  /* IE and Edge */
                  scrollbar-width: none;  /* Firefox */
              }
          `;
          document.head.appendChild(styleSheet);

          // Set up the NFT list container for horizontal scrolling
          this.nftListHomeElement.id = 'nftList';
          this.nftListHomeElement.style.position = 'absolute';
          this.nftListHomeElement.style.display = 'flex';
          this.nftListHomeElement.style.flexDirection = 'row'; // Ensure items are in a row
          this.nftListHomeElement.style.alignItems = 'center'; // Center items vertically
          this.nftListHomeElement.style.height = '15%';
          this.nftListHomeElement.style.width = '65%';
          this.nftListHomeElement.style.top = '55%';
          this.nftListHomeElement.style.left = '25%';
          this.nftListHomeElement.style.overflowX = 'scroll'; // Allow horizontal scrolling
          this.nftListHomeElement.style.overflowY = 'hidden'; // Hide vertical scrollbar
          this.nftListHomeElement.style.whiteSpace = 'nowrap'; // Prevent wrapping of children
          this.nftListHomeElement.style.justifyContent = 'flex-start'; // Align children to the start
          this.nftListHomeElement.style.borderTop = '10px double white';     /* Top border */
          this.nftListHomeElement.style.borderBottom = '10px double white';  /* Bottom border */
          this.nftListHomeElement.style.borderLeft = '10px double white';
          this.nftListHomeElement.style.borderRight = '10px double white';  
          this.nftListHomeElement.className = 'home-glotag-container';

          if (child) {
            this.nftListHomeElement.appendChild(child)
          }

          // Event listeners for hover effects
          this.nftListHomeElement.addEventListener('mouseout', () => {
              this.nftListHomeElement.style.boxShadow = '';
          });

          // Event listener to handle horizontal scrolling with the mouse wheel
          this.nftListHomeElement.addEventListener('wheel', (event) => {
            // Prevent default scrolling behavior
            event.preventDefault();

            // Scroll the element
            this.nftListHomeElement.scrollLeft += event.deltaY;
          }, { passive: false });

          // Event listener for click action
          this.nftListHomeElement.addEventListener('click', (event) => {
            if (event.target === this.nftListHomeElement) {
              this.handleNftListClick();
            }
          });
      } else {
          // If the element already exists, simply ensure it's displayed
          console.log('displaying home nft list as flex')
          this.nftListHomeElement.style.display = 'flex';
          this.nftListHomeText.style.display = 'flex';
      }
      let totalNfts;
      if (window.client.activePlayer) {
        if (!window.client.totalPlayerNfts) {
          totalNfts = '0';
        } else {
          totalNfts = window.client.totalPlayerNfts;
        }
      } else {
        if (!window.client.totalNfts) {
          totalNfts = '0';
        } else {
          totalNfts = window.client.totalNfts;
        }
      }
      this.nftListHomeCount.innerText = `(${totalNfts})`;

      // Check if nftListHomeElement is successfully created
      if (this.nftListHomeElement) {
        resolve();
      } else {
        reject('Failed to create nftListHomeElement');
      }
    });
  }

  handleNftData() {
    if (window.client.activePlayer) {
      this.playerNfts = new Set();
      this.createRetrievedPlayerNfts();
    } else {
      this.createClientNfts();
    }
  }

  createClientNfts() {
    const clientNfts = window.client.clientNfts;
    console.log('received and creating client nfts', clientNfts)
    if (!this.clientNfts) this.clientNfts = new Set();

    for (let i = 0; i < clientNfts.length; i++) {
      const nftData = clientNfts[i];
      let existingNft = Array.from(this.clientNfts).find(nft => nft.tokenId === nftData.tokenId);
      if (!existingNft) {
        let nft = new Nft('home', nftData);
        this.clientNfts.add({tokenId: nftData.tokenId, nft: nft});
      } else {
        // update nft data for existing nft in set
        existingNft.nft.nftInfo = nftData;
      }
    }
    console.log('created client nfts', this.clientNfts)
  }

  createRetrievedPlayerNfts() {
    this.receievedPlayerNfts = true;
    const playerNfts = window.client.retrievedPlayerNfts;
    console.log('received and creating client nfts', playerNfts)
    if (!this.playerNfts) this.playerNfts = new Set();

    for (let i = 0; i < playerNfts.length; i++) {
      const nftData = playerNfts[i];
      let existingNft = Array.from(this.playerNfts).find(nft => nft.tokenId === nftData.tokenId);
      if (!existingNft) {
        let nft = new Nft('home', nftData);
        this.playerNfts.add({tokenId: nftData.tokenId, nft: nft});
      } else {
        // update nft data for existing nft in set
        existingNft.nft.nftInfo = nftData;
      }
    }
    console.log('created player nfts', this.playerNfts)
    this.onReceivedPlayerNfts();
  }

  // createPlayerNfts() {
  //   const playerNfts = window.client.retrievedPlayerNfts;
  //   console.log('received and creating player nfts', playerNfts)

  //   if (!this.playerNfts) this.playerNfts = new Set();

  //   for (let i = 0; i < playerNfts.length; i++) {
  //     const nftData = playerNfts[i];
  //     let existingNft = Array.from(this.playerNfts).find(nft => nft.tokenId === nftData.tokenId);
  //     if (!existingNft) {
  //       let nft = new Nft('', nftData);
  //       this.playerNfts.add({tokenId: nftData.tokenId, nft: nft});
  //     } else {
  //       // update nft data for existing nft in set
  //       existingNft.nft.nftInfo = nftData;
  //     }
  //   }
  // }

  createHomeNfts() {
    if (!this.clientNfts) return;

    this.nftListHomeElement.innerHTML = '';

    this.clientNfts.forEach(nft => {
      // console.log('attempting to append', nft.nft.previewElement, 'from', nft, 'to', this.nftListHomeElement)
      this.nftListHomeElement.appendChild(nft.nft.previewElement);
    });
  }

  createPlayerNfts() {
    if (!this.playerNfts) {
      if (this.nftListHomeElement) this.nftListHomeElement.innerHTML = '';
      return;
    }

    this.nftListHomeElement.innerHTML = '';
    
    this.playerNfts.forEach(nft => {
      console.log('attempting to append', nft.nft.previewElement, 'from', nft, 'to', this.nftListHomeElement)
      this.nftListHomeElement.appendChild(nft.nft.previewElement);
    });
  }
 
  // createHomeNfts(ownedNfts) {
  //   console.error('Creating home NFTs with new data:', ownedNfts);

  //   if (!ownedNfts || !Array.isArray(ownedNfts)) {
  //       console.error('Invalid NFT data provided to createHomeNfts');
  //       return;
  //   }

  //   this.nftListHomeElement.innerHTML = ''; // Clear the NFT list home element to repopulate it

  //   // Use token_id as the key in existingNftsMap
  //   if (!this.existingNftsMap) {
  //       this.existingNftsMap = new Map(this.nfts.map(nft => [nft.nftInfo.token_id, nft]));
  //   }

  //   let fetchMetadataPromises = [];

  //   ownedNfts.forEach(nftInfo => {
  //       // Check if an NFT with the same token_id already exists in the map
  //       if (!this.existingNftsMap.has(nftInfo.token_id)) {
  //           let nft = new Nft('home', nftInfo);
  //           this.nfts.push(nft);
  //           this.existingNftsMap.set(nftInfo.token_id, nft);

  //           // Add the promise to the array
  //           fetchMetadataPromises.push(nft.fetchNftMetadata().then(() => {
  //               // Append the preview element to the nftListHomeElement after the metadata has been fetched
  //               this.nftListHomeElement.appendChild(nft.previewElement);
  //           }));
  //       } else {
  //           let nft = this.existingNftsMap.get(nftInfo.token_id);
  //           this.nftListHomeElement.appendChild(nft.previewElement);
  //       }
  //   });

  //   Promise.all(fetchMetadataPromises)
  //     .then(() => {
  //       console.log("All NFT metadata has been fetched.");

  //       window.glotag.styleCallingCard();

  //       const successEvent = new CustomEvent('receivedNftData');
  //       window.dispatchEvent(successEvent);

  //       window.client.switchingPlayers = false;
  //     })
  //     .catch(error => {
  //       console.error("An error occurred while fetching NFT metadata:", error);
  //     });
  // }

  createNftPageContainer() {
    if (!this.nftPageContainer) {
      this.nftPageContainer = document.createElement('div');
      window.glotag.glotagPage.appendChild(this.nftPageContainer);
      this.nftPageContainer.id = 'nftPageContainer';
      this.nftPageContainer.style.display = 'flex';
      this.nftPageContainer.style.flexDirection = 'row';
      this.nftPageContainer.style.flexWrap = 'wrap';
      this.nftPageContainer.style.justifyContent = 'flex-start';
      this.nftPageContainer.style.alignItems = 'flex-start';
      this.nftPageContainer.style.position = 'absolute';
      this.nftPageContainer.style.top = '20%';
      this.nftPageContainer.style.right = '7.5%';
      this.nftPageContainer.style.width = '65%';
      this.nftPageContainer.style.height = '70%';
      this.nftPageContainer.style.border = '10px double white';
      this.nftPageContainer.style.borderRadius = '1rem';

      //dropdown menu
      this.nftPageController = document.createElement('div');
      window.glotag.glotagPage.appendChild(this.nftPageController);
      this.nftPageController.id = 'nftPageController';
      this.nftPageController.style.position = 'absolute';
      this.nftPageController.style.top = '25%';
      this.nftPageController.style.left = '7.5%';
      this.nftPageController.style.width = '19%';
      this.nftPageController.style.height = '65%';
      this.nftPageController.style.display = 'flex';
      this.nftPageController.style.flexDirection = 'column';
      this.nftPageController.style.color = 'white';

      //count dropdown
      this.countDropdown = document.createElement('div');
      this.countDropdown.innerText = 'Count:';
      this.nftPageController.appendChild(this.countDropdown);

      this.countDropdownDiv = document.createElement('div');
      this.countDropdownDiv.style.display = 'flex';
      this.countDropdownDiv.style.height = '10%';
      this.countDropdownDiv.style.width = '80%';
      this.countDropdownDiv.style.left = '50%';
      this.countDropdownDiv.style.transform = 'translateX(-50%)';
      this.countDropdownDiv.style.position = 'relative';
      this.countDropdownDiv.style.marginBottom = '10%';
      this.nftPageController.appendChild(this.countDropdownDiv);

      //hi2lo label
      const hi2lo = document.createElement('span');
      hi2lo.innerText = 'hi2lo';
      hi2lo.style.fontFamily = 'Gabarito';
      hi2lo.style.color = 'white';
      hi2lo.style.position = 'absolute';
      hi2lo.style.left = '2%';
      hi2lo.style.top = '33%';
      this.countDropdownDiv.appendChild(hi2lo);

      // Create the label element
      const label = document.createElement('label');
      label.className = 'count-dropdown-switch';

      // Create the input element
      const input = document.createElement('input');
      input.className = 'count-dropdown-toggle';
      input.type = 'checkbox';
      input.addEventListener('change', () => {
        console.log(`this.toggleCount(${input.checked})`);
        this.toggleCount(input.checked);
      });

      // Create the span elements
      const slider = document.createElement('span');
      slider.className = 'count-dropdown-slider';

      const cardSide = document.createElement('span');
      cardSide.className = 'count-dropdown-card-side';

      // Append the input and span elements to the label
      label.appendChild(input);
      label.appendChild(slider);
      label.appendChild(cardSide);

      // Append the label to the countDropdownDiv
      this.countDropdownDiv.appendChild(label);

      //lo2hi label
      const lo2hi = document.createElement('span');
      lo2hi.innerText = 'lo2hi';
      lo2hi.style.fontFamily = 'Gabarito';
      lo2hi.style.color = 'white';
      lo2hi.style.position = 'absolute';
      lo2hi.style.left = '62%';
      lo2hi.style.top = '33%';
      this.countDropdownDiv.appendChild(lo2hi);

      //rarity dropdown
      this.rarityDropdown = document.createElement('div');
      this.rarityDropdown.innerText = 'Rarity:';
      this.rarityDropdown.style.marginBottom = '2.5%';
      this.nftPageController.appendChild(this.rarityDropdown);
      
      this.rarityDropdownDiv = document.createElement('div');
      this.rarityDropdownDiv.style.display = 'flex';
      this.rarityDropdownDiv.style.height = '20%';
      this.rarityDropdownDiv.style.width = '80%';
      this.rarityDropdownDiv.style.left = '50%';
      this.rarityDropdownDiv.style.transform = 'translateX(-50%)';
      this.rarityDropdownDiv.style.position = 'relative';
      this.rarityDropdownDiv.style.flexDirection = 'column';
      this.rarityDropdownDiv.style.marginBottom = '10%';
      this.rarityDropdownDiv.style.gap = '1%';
      this.nftPageController.appendChild(this.rarityDropdownDiv);

      const rarityAllCheck = document.createElement('input');
      rarityAllCheck.id = 'rarity-all-check';
      rarityAllCheck.type = 'checkbox';
      rarityAllCheck.className = 'ui-checkbox';
      rarityAllCheck.checked = 'true';
      this.rarityDropdownDiv.appendChild(rarityAllCheck);
      rarityAllCheck.addEventListener('click', () => {
        if (rarityAllCheck.checked) {
          this.raritySortState = [true, true, true];
          this.updateFilter();
          this.handleRaritySort(true);
          console.log('calling update filter, raritySortState:', this.raritySortState);
        }
      });
      const rarityAllText = document.createElement('span');
      rarityAllText.innerText = 'all';
      rarityAllText.style.position = 'absolute';
      rarityAllText.style.left = '20%';
      rarityAllText.style.top = '5%';
      rarityAllText.style.fontFamily = 'gabarito';
      this.rarityDropdownDiv.appendChild(rarityAllText);
      

      const genericCheck = document.createElement('input');
      genericCheck.id = 'generic-check';
      genericCheck.type = 'checkbox';
      genericCheck.className = 'ui-checkbox';
      this.rarityDropdownDiv.appendChild(genericCheck);
      genericCheck.addEventListener('click', () => {
        if (genericCheck.checked) {
          if (this.raritySortState.every(val => val === true)){
            this.raritySortState = [true, false, false];
            this.handleRaritySort(false);
          } else {
            this.raritySortState[0] = true;
          }
          this.updateFilter();
          console.log('calling update filter, raritySortState:', this.raritySortState);

        } else {
          this.raritySortState[0] = false;
          this.updateFilter();
          console.log('calling update filter, raritySortState:', this.raritySortState);
        }
      });
      const genericText = document.createElement('span');
      genericText.innerText = 'generic';
      genericText.style.position = 'absolute';
      genericText.style.left = '20%';
      genericText.style.top = '29%';
      genericText.style.fontFamily = 'gabarito';
      this.rarityDropdownDiv.appendChild(genericText);

      const esotericCheck = document.createElement('input');
      esotericCheck.id = 'esoteric-check';
      esotericCheck.type = 'checkbox';
      esotericCheck.className = 'ui-checkbox';
      this.rarityDropdownDiv.appendChild(esotericCheck);
      esotericCheck.addEventListener('click', () => {
        if (esotericCheck.checked) {
          if (this.raritySortState.every(val => val === true)){
            this.raritySortState = [false, true, false];
            this.handleRaritySort(false);
          } else {
            this.raritySortState[1] = true;
          }
          this.updateFilter();
          console.log('calling update filter, raritySortState:', this.raritySortState);

        }
        else {
          this.raritySortState[1] = false;
          this.updateFilter();
          console.log('calling update filter, raritySortState:', this.raritySortState);
        }
      });
      const esotericText = document.createElement('span');
      esotericText.innerText = 'esoteric';
      esotericText.style.position = 'absolute';
      esotericText.style.left = '20%';
      esotericText.style.top = '55%';
      esotericText.style.fontFamily = 'gabarito';
      this.rarityDropdownDiv.appendChild(esotericText);

      const spectralCheck = document.createElement('input');
      spectralCheck.id = 'spectral-check';
      spectralCheck.type = 'checkbox';
      spectralCheck.className = 'ui-checkbox';
      this.rarityDropdownDiv.appendChild(spectralCheck);
      spectralCheck.addEventListener('click', () => {
        if (spectralCheck.checked) {
          if (this.raritySortState.every(val => val === true)){
            this.raritySortState = [false, false, true];
            this.handleRaritySort(false);
          } else {
            this.raritySortState[2] = true;
          }
          this.updateFilter();
          console.log('calling update filter, raritySortState:', this.raritySortState);
        }
        else {
          this.raritySortState[2] = false;
          this.updateFilter();
          console.log('calling update filter, raritySortState:', this.raritySortState);
        }
      });
      const spectralText = document.createElement('span');
      spectralText.innerText = 'spectral';
      spectralText.style.position = 'absolute';
      spectralText.style.left = '20%';
      spectralText.style.bottom = '2%';
      spectralText.style.fontFamily = 'gabarito';
      this.rarityDropdownDiv.appendChild(spectralText);

      //type dropdown  
      this.typeDropdown = document.createElement('div');
      this.typeDropdown.innerText = 'Type:';
      this.typeDropdown.marginBottom = '1.5%';
      this.nftPageController.appendChild(this.typeDropdown);

      this.typeDropdownDiv = document.createElement('div');
      this.typeDropdownDiv.style.display = 'flex';
      this.typeDropdownDiv.style.width = '80%';
      this.typeDropdownDiv.style.left = '50%';
      this.typeDropdownDiv.style.height = '45%';
      this.typeDropdownDiv.style.transform = 'translateX(-50%)';
      this.typeDropdownDiv.style.position = 'relative';
      this.typeDropdownDiv.style.flexDirection = 'column';
      this.typeDropdownDiv.style.marginBottom = '10%';
      this.typeDropdownDiv.style.gap = '1%';
      this.nftPageController.appendChild(this.typeDropdownDiv);

      const typeAllCheck = document.createElement('input');
      typeAllCheck.id = 'type-all-check';
      typeAllCheck.type = 'checkbox';
      typeAllCheck.className = 'ui-checkbox';
      typeAllCheck.checked = 'true';
      this.typeDropdownDiv.appendChild(typeAllCheck);
      typeAllCheck.addEventListener('click', () => {
        if (typeAllCheck.checked) {
          this.typeSortState = [true, true, true, true, true, true, true, true, true];
          this.updateFilter();
          this.handleTypeSort(true);
          console.log('calling update filter, typeSortState:', this.typeSortState);
        }
      });
      const typeAllText = document.createElement('span');
      typeAllText.innerText = 'all';
      typeAllText.style.position = 'absolute';
      typeAllText.style.left = '20%';
      typeAllText.style.top = '4%';
      typeAllText.style.fontFamily = 'gabarito';
      this.typeDropdownDiv.appendChild(typeAllText);

      const glochipCheck = document.createElement('input');
      glochipCheck.id = 'glochip-check';
      glochipCheck.type = 'checkbox';
      glochipCheck.className = 'ui-checkbox';
      this.typeDropdownDiv.appendChild(glochipCheck);
      glochipCheck.addEventListener('click', () => {
        if (glochipCheck.checked) {
          if (this.typeSortState.every(val => val === true)){
            this.typeSortState = [true, false, false, false, false, false, false, false];
            this.handleTypeSort(false);
          } else {
            this.typeSortState[0] = true;
          }
          this.updateFilter();
          console.log('calling update filter, typeSortState:', this.typeSortState);
        }
        else {
          this.typeSortState[0] = false;
          this.updateFilter();
          console.log('calling update filter, typeSortState:', this.typeSortState);
        }
      });
      const glochipText = document.createElement('span');
      glochipText.innerText = 'glochip';
      glochipText.style.position = 'absolute';
      glochipText.style.left = '20%';
      glochipText.style.top = '14%';
      glochipText.style.fontFamily = 'gabarito';
      this.typeDropdownDiv.appendChild(glochipText);

      const holokeyCheck = document.createElement('input');
      holokeyCheck.id = 'holokey-check';
      holokeyCheck.type = 'checkbox';
      holokeyCheck.className = 'ui-checkbox';
      this.typeDropdownDiv.appendChild(holokeyCheck);
      holokeyCheck.addEventListener('click', () => {
        if (holokeyCheck.checked) {
          if (this.typeSortState.every(val => val === true)){
            this.typeSortState = [false, true, false, false, false, false, false, false];
            this.handleTypeSort(false);
          } else {
            this.typeSortState[1] = true;
          }
          this.updateFilter();
          console.log('calling update filter, typeSortState:', this.typeSortState);
        }
        else {
          this.typeSortState[1] = false;
          this.updateFilter();
          console.log('calling update filter, typeSortState:', this.typeSortState);
        }
      });
      const holokeyText = document.createElement('span');
      holokeyText.innerText = 'holokey';
      holokeyText.style.position = 'absolute';
      holokeyText.style.left = '20%';
      holokeyText.style.top = '26%';
      holokeyText.style.fontFamily = 'gabarito';
      this.typeDropdownDiv.appendChild(holokeyText);

      const glotagCheck = document.createElement('input');
      glotagCheck.id = 'glotag-check';
      glotagCheck.type = 'checkbox';
      glotagCheck.className = 'ui-checkbox';
      this.typeDropdownDiv.appendChild(glotagCheck);
      glotagCheck.addEventListener('click', () => {
        if (glotagCheck.checked) {
          if (this.typeSortState.every(val => val === true)){
            this.typeSortState = [false, false, true, false, false, false, false, false];
            this.handleTypeSort(false);
          } else {
            this.typeSortState[2] = true;
          }
          this.updateFilter();
          console.log('calling update filter, typeSortState:', this.typeSortState);
        }
        else {
          this.typeSortState[2] = false;
          this.updateFilter();
          console.log('calling update filter, typeSortState:', this.typeSortState);
        }
      });
      const glotagText = document.createElement('span');
      glotagText.innerText = 'glotag';
      glotagText.style.position = 'absolute';
      glotagText.style.left = '20%';
      glotagText.style.top = '37%';
      glotagText.style.fontFamily = 'gabarito';
      this.typeDropdownDiv.appendChild(glotagText);

      const pfpCheck = document.createElement('input');
      pfpCheck.id = 'pfp-check';
      pfpCheck.type = 'checkbox';
      pfpCheck.className = 'ui-checkbox';
      this.typeDropdownDiv.appendChild(pfpCheck);
      pfpCheck.addEventListener('click', () => {
        if (pfpCheck.checked) {
          if (this.typeSortState.every(val => val === true)){
            this.typeSortState = [false, false, false, true, false, false, false, false];
            this.handleTypeSort(false);
          } else {
            this.typeSortState[3] = true;
          }
          this.updateFilter();
          console.log('calling update filter, typeSortState:', this.typeSortState);
        }
        else {
          this.typeSortState[3] = false;
          this.updateFilter();
          console.log('calling update filter, typeSortState:', this.typeSortState);
        }
      });
      const pfpText = document.createElement('span');
      pfpText.innerText = 'pfp';
      pfpText.style.position = 'absolute';
      pfpText.style.left = '20%';
      pfpText.style.top = '48%';
      pfpText.style.fontFamily = 'gabarito';
      this.typeDropdownDiv.appendChild(pfpText);

      const reactionsCheck = document.createElement('input');
      reactionsCheck.id = 'reactions-check';
      reactionsCheck.type = 'checkbox';
      reactionsCheck.className = 'ui-checkbox';
      this.typeDropdownDiv.appendChild(reactionsCheck);
      reactionsCheck.addEventListener('click', () => {
        if (reactionsCheck.checked) {
          if (this.typeSortState.every(val => val === true)){
            this.typeSortState = [false, false, false, false, true, false, false, false];
            this.handleTypeSort(false);
          } else {
            this.typeSortState[4] = true;
          }
          this.updateFilter();
          console.log('calling update filter, typeSortState:', this.typeSortState);
        }
        else {
          this.typeSortState[4] = false;
          this.updateFilter();
          console.log('calling update filter, typeSortState:', this.typeSortState);
        }
      });
      const reactionsText = document.createElement('span');
      reactionsText.innerText = 'reactions';
      reactionsText.style.position = 'absolute';
      reactionsText.style.left = '20%';
      reactionsText.style.top = '59%';
      reactionsText.style.fontFamily = 'gabarito';
      this.typeDropdownDiv.appendChild(reactionsText);

      const arcadeCheck = document.createElement('input');
      arcadeCheck.id = 'arcade-check';
      arcadeCheck.type = 'checkbox';
      arcadeCheck.className = 'ui-checkbox';
      this.typeDropdownDiv.appendChild(arcadeCheck);
      arcadeCheck.addEventListener('click', () => {
        if (arcadeCheck.checked) {
          if (this.typeSortState.every(val => val === true)){
            this.typeSortState = [false, false, false, false, false, true, false, false];
            this.handleTypeSort(false);
          } else {
            this.typeSortState[5] = true;
          }
          this.updateFilter();
          console.log('calling update filter, typeSortState:', this.typeSortState);
        }
        else {
          this.typeSortState[5] = false;
          this.updateFilter();
          console.log('calling update filter, typeSortState:', this.typeSortState);
        }
      });
      const arcadeText = document.createElement('span');
      arcadeText.innerText = 'arcade';
      arcadeText.style.position = 'absolute';
      arcadeText.style.left = '20%';
      arcadeText.style.top = '71%';
      arcadeText.style.fontFamily = 'gabarito';
      this.typeDropdownDiv.appendChild(arcadeText);

      const luncmanCheck = document.createElement('input');
      luncmanCheck.id = 'luncman-check';
      luncmanCheck.type = 'checkbox';
      luncmanCheck.className = 'ui-checkbox';
      this.typeDropdownDiv.appendChild(luncmanCheck);
      luncmanCheck.addEventListener('click', () => {
        if (luncmanCheck.checked) {
          if (this.typeSortState.every(val => val === true)){
            this.typeSortState = [false, false, false, false, false, false, true, false];
            this.handleTypeSort(false);
          } else {
            this.typeSortState[6] = true;
          }
          this.updateFilter();
          console.log('calling update filter, typeSortState:', this.typeSortState);
        }
        else {
          this.typeSortState[6] = false;
          this.updateFilter();
          console.log('calling update filter, typeSortState:', this.typeSortState);
        }
      });
      const luncmanText = document.createElement('span');
      luncmanText.innerText = 'luncman';
      luncmanText.style.position = 'absolute';
      luncmanText.style.left = '20%';
      luncmanText.style.top = '82%';
      luncmanText.style.fontFamily = 'gabarito';
      this.typeDropdownDiv.appendChild(luncmanText);

      const victoryCheck = document.createElement('input');
      victoryCheck.id = 'victory-check';
      victoryCheck.type = 'checkbox';
      victoryCheck.className = 'ui-checkbox';
      this.typeDropdownDiv.appendChild(victoryCheck);
      victoryCheck.addEventListener('click', () => {
        if (victoryCheck.checked) {
          if (this.typeSortState.every(val => val === true)){
            this.typeSortState = [false, false, false, false, false, false, false, true];
            this.handleTypeSort(false);
          } else {
            this.typeSortState[7] = true;
          }
          this.updateFilter();
          console.log('calling update filter, typeSortState:', this.typeSortState);
        }
        else {
          this.typeSortState[7] = false;
          this.updateFilter();
          console.log('calling update filter, typeSortState:', this.typeSortState);
        }
      });
      const victoryText = document.createElement('span');
      victoryText.innerText = 'victory';
      victoryText.style.position = 'absolute';
      victoryText.style.left = '20%';
      victoryText.style.top = '93.5%';
      victoryText.style.fontFamily = 'gabarito';
      this.typeDropdownDiv.appendChild(victoryText);

      //nft title
      this.myNftsTitle = document.createElement('h1');
      window.glotag.glotagPage.appendChild(this.myNftsTitle);
      this.myNftsTitle.innerText = 'NFTS';
      this.myNftsTitle.style.display = 'flex';
      this.myNftsTitle.style.color = 'white';
      this.myNftsTitle.style.position = 'absolute';
      this.myNftsTitle.style.top = '4%';
      this.myNftsTitle.style.left = '54%';
      this.myNftsTitle.style.width = '35%';
      this.myNftsTitle.style.transform = '(-50%, -50%)';
      this.myNftsTitle.style.fontSize = '3rem';
      this.myNftsTitle.style.textShadow = 'rgb(0, 0, 0) 0.15rem 0.15rem 0px, rgb(0, 0, 0) 0.15rem 0.15rem 0px, rgb(0, 0, 0) 0.15rem 0.15rem 0px, rgb(0, 0, 0) 0.15rem 0.15rem 0px';

      this.typeSortState = [true, true, true, true, true, true, true, true];
      this.raritySortState = [true, true, true];
      this.updateFilter();
    } else {
      this.nftPageContainer.style.display = 'flex';
      this.myNftsTitle.style.display = 'flex';
      this.nftPageController.style.display = 'flex';
      this.typeSortState = [true, true, true, true, true, true, true, true];
      this.raritySortState = [true, true, true];
      this.updateFilter();
    }
  }



  updateFilter() {
    console.log('updating filter');
    // Clear the current NFTs from the display
    this.sortedNfts = [];

    // Define the rarities and types
    const rarities = ['generic', 'esoteric', 'spectral'];
    const types = ['glochip', 'key', 'glotag', 'pfp', 'reaction', 'arcade', 'luncman', 'victory']

    // Filter the NFTs based on the raritySortState and typeSortState
    let nfts;
    if (window.client.activePlayer) {
      nfts = this.playerNfts;
    } else {
      nfts = this.clientNfts;
    };
    this.sortedNfts = Array.from(nfts).filter(nft => {
      // Determine if the NFT's rarity matches any of the selected rarities
      for (let i = 0; i < this.raritySortState.length; i++) {
        // If the raritySortState for this rarity is true and the NFT's rarity matches, include it
        if (this.raritySortState[i] && nft.nft.nftInfo.metadata.rarity === rarities[i]) {
          // Determine if the NFT's type matches any of the selected types
          for (let j = 0; j < this.typeSortState.length; j++) {
            // If the typeSortState for this type is true and the NFT's type matches, include it
            if (this.typeSortState[j] && nft.nft.nftInfo.metadata.type === types[j]) {
              return true; // Include this NFT
            }
          }
        }
      }
      return false; // Exclude this NFT if no rarity or type matches
    });

    if (this.lo2hi) {
      this.sortedNfts.sort((a, b) => {
        return a.nft.nftInfo.count - b.nft.nftInfo.count;
      });
    } else {
      this.sortedNfts.sort((a, b) => {
        return b.nft.nftInfo.count - a.nft.nftInfo.count;
      });
    }

    // Sort the NFTs by rarity and type
    this.sortedNfts.sort((a, b) => {
      // Get the rarity and type index of each NFT
      const rarityA = rarities.indexOf(a.nft.nftInfo.metadata.rarity);
      const rarityB = rarities.indexOf(b.nft.nftInfo.metadata.rarity);
      const typeA = types.indexOf(a.nft.nftInfo.metadata.type);
      const typeB = types.indexOf(b.nft.nftInfo.metadata.type);

      // Sort in descending order of rarity, and then type
      return rarityB - rarityA || typeB - typeA;
    });

    // Display the sorted NFTs
    console.log('sorted nfts', this.sortedNfts)
    this.nftPageContainer.innerHTML = '';
    this.sortedNfts.forEach(nft => {
      this.nftPageContainer.appendChild(nft.nft.previewElement);
    });
  }
  
  toggleCount(lo2hi) {
    if (lo2hi) {
      this.lo2hi = true;
      this.sortedNfts.sort((a, b) => {
        return a.nft.nftInfo.count - b.nft.nftInfo.count;
      });
      this.nftPageContainer.innerHTML = '';
      this.sortedNfts.forEach(nft => {
        this.nftPageContainer.appendChild(nft.nft.previewElement);
      });
    } else {
      this.lo2hi = false;
      this.sortedNfts.sort((a, b) => {
        return b.nft.nftInfo.count - a.nft.nftInfo.count;
      });
      this.nftPageContainer.innerHTML = '';
      this.sortedNfts.forEach(nft => {
        this.nftPageContainer.appendChild(nft.nft.previewElement);
      });
    }
  }

  resetNftState() {
    if (this.nftPageContainer) this.nftPageContainer.innerHTML = '';
    if (this.clientNfts) {
      this.clientNfts.forEach(nft => {
        nft.nft.state = '';
        nft.nft.handleState();
      });
    }
    if (this.playerNfts) {
      this.playerNfts.forEach(nft => {
        nft.nft.state = '';
        nft.nft.handleState();
      });
    }
  }

  populateNftPage() {
    this.nftPageContainer.innerHTML = '';
    if (!window.client.activePlayer) {
      this.clientNfts.forEach(nft => {
        this.nftPageContainer.appendChild(nft.nft.previewElement);
        nft.nft.state = 'library';
        nft.nft.handleState();
      });
    } else {
      this.playerNfts.forEach(nft => {
        this.nftPageContainer.appendChild(nft.nft.previewElement);
        nft.nft.state = 'library';
        nft.nft.handleState();
      });
    }
  }

  
  handleRaritySort(state){
    console.log('poop');
    const generic = document.getElementById('generic-check');
    const esoteric = document.getElementById('esoteric-check');
    const spectral = document.getElementById('spectral-check');
    const all = document.getElementById('rarity-all-check');

    if(state === true){
      generic.checked = false;
      esoteric.checked = false;
      spectral.checked = false;
    } else if (state === false){
      all.checked = false;
    }
  }

  handleTypeSort(state){
    console.log('poop');
    const glochip = document.getElementById('glochip-check');
    const holokey = document.getElementById('holokey-check');
    const glotag = document.getElementById('glotag-check');
    const pfp = document.getElementById('pfp-check');
    const reactions = document.getElementById('reactions-check');
    const arcade = document.getElementById('arcade-check');
    const luncman = document.getElementById('luncman-check');
    const victory = document.getElementById('victory-check');
    const all = document.getElementById('type-all-check');

    if(state === true){
      glochip.checked = false;
      holokey.checked = false;
      glotag.checked = false;
      pfp.checked = false;
      reactions.checked = false;
      arcade.checked = false;
      luncman.checked = false;
      victory.checked = false;
    } else if (state === false){
      all.checked = false;
    }
  }

  handleNftListClick() {
    let gsapState = Flip.getState('#gloTagElement');
    console.log("nft list clicked");
    window.glotag.gloPage = 'library';
    window.glotag.handleGloPage();
    Flip.from(gsapState, {
      duration: 0.33,
      ease: "power1.inOut",
      absolute: true,
      onComplete: () => console.log('Flip animation complete!')
    });
  }

  hideNftList() {
    switch (window.glotag.gloPage) {
      case 'home':
        if (this.nftPageContainer) this.nftPageContainer.style.display = 'none';
        if (this.myNftsTitle) this.myNftsTitle.style.display = 'none';
        if (this.nftPageController) this.nftPageController.style.display = 'none';
        break;
      case 'library':
        console.error('setting nft home list display to none')
        if (this.nftListHomeElement) this.nftListHomeElement.style.display = 'none';
        if (this.nftListHomeText) this.nftListHomeText.style.display = 'none';
        break;
      case 'player':
        if (this.nftPageContainer) this.nftPageContainer.style.display = 'none';
        if (this.myNftsTitle) this.myNftsTitle.style.display = 'none';
        if (this.nftPageController) this.nftPageController.style.display = 'none';
        break;
      default:
        console.error('setting library display to none')
        if (this.nftListHomeElement) this.nftListHomeElement.style.display = 'none';
        if (this.nftListHomeText) this.nftListHomeText.style.display = 'none';
        if (this.nftPageContainer) this.nftPageContainer.style.display = 'none';
        if (this.myNftsTitle) this.myNftsTitle.style.display = 'none';
        if (this.nftPageController) this.nftPageController.style.display = 'none';
        break;
    }
  }
}

class Nft {
  constructor(state, nftInfo) {
    this.state = state;
    this.nftInfo = nftInfo;
    if (nftInfo.metadata) this.metadata = nftInfo.metadata;
    if (nftInfo.count) this.count = nftInfo.count;
    if (nftInfo.tokenId) this.tokenId = nftInfo.tokenId;
    if (nftInfo.tokenIds) this.tokenIds = nftInfo.tokenIds;

    if (nftInfo.listing) {
      console.log('creating nft', nftInfo)
      this.listing = nftInfo.listing;
      this.metadata = nftInfo.listing.data;
      return;
    }

    // Start fetching metadata
    if (!nftInfo.metadata) this.fetchNftMetadata();
    
    this.handleState();
  }


  handleState() {
    switch (this.state) {
      case 'home':
        this.createPreviewNftElement();
        // this.createPreviewNft();
        break;
      case 'library':
        this.createLibraryElement();
        this.hideInspectNftContainer();
        break;
      case 'inspect_nft':
        this.inspectNft();
        break;
      case 'market_preview':
        this.createMarketPreviewNft();
        break;
      // ... any other states ...
      default:
        this.hideInspectNftContainer();
        break;
    }
  }

  createPreviewNftElement() {
    console.log('checking tokenid')
    if (!this.tokenId) return;
    console.log('creating preview element for', this.tokenId)
    if (this.previewElement) {
      this.previewElement.style.display = 'flex';
    } else {
      this.previewElement = document.createElement('div');
      this.previewElement.id = 'nftPreview-' + this.tokenId;
      this.previewElement.style.display = 'flex';
      this.previewElement.style.flex = '0 0 auto';
      this.previewElement.style.justifyContent = 'center';
      this.previewElement.style.alignItems = 'center';
      this.previewElement.style.borderRadius = '50%'; // Rounded corners for a circle
      this.previewElement.style.margin = '0 20px';
      this.previewElement.style.height = '80px'; // Fixed height
      this.previewElement.style.width = '80px'; // Fixed width
      this.previewElement.style.minWidth = '80px'; // Prevent width from scaling
      this.previewElement.style.minHeight = '80px'; // Prevent height from scaling
      // Set the font size to ensure text fits inside the circle
      this.previewElement.style.fontSize = '12px'; // Adjust as needed

      // Create an img element for the preview image
      this.previewImgElement = document.createElement('img');
      this.previewElement.appendChild(this.previewImgElement);
      this.previewImgElement.src = `/style/graphics/token_images${this.metadata.previewImg}.webp`;

      // Scale down the image to fit within the border
      this.previewImgElement.style.height = '80px'; // Original height - double the border width
      this.previewImgElement.style.width = '80px'; // Original width - double the border width

      // Create a video element for the hover state
      this.previewVideoElement = document.createElement('video');
      this.previewElement.appendChild(this.previewVideoElement);
      this.previewVideoElement.src = `/style/graphics${this.metadata.showcase}`;
      this.previewVideoElement.style.height = '80px'; // Original height - double the border width
      this.previewVideoElement.style.width = '80px'; // Original width - double the border width
      this.previewVideoElement.autoplay = true;
      this.previewVideoElement.loop = true;
      this.previewVideoElement.muted = true;
      this.previewVideoElement.style.display = 'none';

      let color;
      let fontColor;
      if (this.metadata.rarity) {
        switch (this.metadata.rarity) {
          case 'generic':
            color = '#8c8c8c';
            fontColor = 'black';
            break;
          case 'esoteric':
            color = '#e59907';
            fontColor = 'black';
            break;
          case 'spectral':
            color = '#7b03b5';
            fontColor = 'white';
            break;
          default:
            color = 'blue';
            fontColor = 'black';
            break;
        }
      }
      fontColor = 'black';

      // Create a div element for the count
      const countElement = document.createElement('div');
      this.previewElement.appendChild(countElement);
      countElement.style.position = 'absolute';
      countElement.style.marginTop = '70px';
      countElement.style.marginLeft = '70px';
      countElement.style.width = '30px';
      countElement.style.height = '30px';
      countElement.style.borderRadius = '50%'; // Make it circular
      countElement.style.backgroundColor = color;
      countElement.style.border = '2px solid white';
      countElement.style.color = fontColor;
      countElement.style.display = 'flex';
      countElement.style.justifyContent = 'center';
      countElement.style.alignItems = 'center';
      countElement.style.fontSize = '80%';
      countElement.textContent = this.count;

      this.previewElement.addEventListener('dblclick', this.handlePreviewClick.bind(this));

      this.previewElement.addEventListener('mouseenter', () => {
        gsap.to(this.previewElement, { scale: 1.2, duration: 0.25 });
        this.previewImgElement.style.display = 'none'; // Hide the image
        this.previewVideoElement.style.display = 'block'; // Show the video
        this.previewVideoElement.currentTime = 0; // Reset the video to the first frame
        this.previewVideoElement.play();
      });

      this.previewElement.addEventListener('mouseleave', () => {
        gsap.to(this.previewElement, { scale: 1.0, duration: 0.25 });
        this.previewImgElement.style.display = 'block'; // Show the image
        this.previewVideoElement.style.display = 'none'; // Hide the video
      });
      
      // Add mouseover and mouseout event listeners
      // this.previewElement.addEventListener('mouseover', this.handleMouseOver.bind(this));
      // this.previewElement.addEventListener('mouseout', this.handleMouseOut.bind(this));
    }
  }

  createPreviewNft() {
    if (this.previewElement) {
      this.previewElement.style.display = 'flex';
    } else {
      if (!window.glotag.nftList) {
        return;
      }
      this.previewElement = document.createElement('div');
      this.previewElement.id = 'nftPreview-' + this.nftInfo.token_id;
      window.glotag.nftList.nftListHomeElement.appendChild(this.previewElement);
      this.previewElement.style.display = 'flex';
      this.previewElement.style.flex = '0 0 auto';
      this.previewElement.style.justifyContent = 'center';
      this.previewElement.style.alignItems = 'center';
      this.previewElement.style.borderRadius = '50%'; // Rounded corners for a circle
      this.previewElement.style.margin = '0 20px';
      this.previewElement.style.height = '80px'; // Fixed height
      this.previewElement.style.width = '80px'; // Fixed width
      this.previewElement.style.minWidth = '80px'; // Prevent width from scaling
      this.previewElement.style.minHeight = '80px'; // Prevent height from scaling
      // Set the font size to ensure text fits inside the circle
      this.previewElement.style.fontSize = '12px'; // Adjust as needed

      // Create an img element for the preview image
      const imgElement = document.createElement('img'); 
      imgElement.src = `/style/graphics/token_images${this.metadata.previewImg}.webp`;
      
      // Scale down the image to fit within the border
      imgElement.style.height = '80px'; // Original height - double the border width
      imgElement.style.width = '80px'; // Original width - double the border width
  
      this.previewElement.appendChild(imgElement);

      this.previewElement.addEventListener('click', this.handlePreviewClick.bind(this));
      
      // Add mouseover and mouseout event listeners
      this.previewElement.addEventListener('mouseover', this.handleMouseOver.bind(this));
      this.previewElement.addEventListener('mouseout', this.handleMouseOut.bind(this));
    }
  }

  hideInspectNftContainer() {
    if (this.inspectNftContainer) this.inspectNftContainer.style.display = 'none';
  }

  createLibraryElement() {
    // Apply styles for the NFT page
    this.previewElement.style.display = 'flex';
    this.previewElement.style.margin = '20px 20px';
    this.previewElement.style.height = '90px';
    this.previewElement.style.width = '90px';
  }

  createMarketPreviewNft() {
    // Similar to createPreviewNft, but for market preview
    if (this.previewElement) {
      this.previewElement.style.display = 'flex';
    } else {
      this.previewElement = document.createElement('div');
      this.previewElement.id = 'nftMarketPreview';
      
      // Add mouseover and mouseout event listeners
      this.previewElement.addEventListener('mouseover', this.handleMouseOver.bind(this));
      this.previewElement.addEventListener('mouseout', this.handleMouseOut.bind(this));

      this.listing.populateMarketListing(this);
    }
  }

  determineRarity() {
    let color;
    switch(this.metadata.rarity) {
      case 'generic':
        color = '#8c8c8c';
        break;
      case 'esoeric':
        color = '#e59907';
        break;
      case 'spectral':
        color = '#7b03b5';
        break;
      default:
        color = '#8c8c8c';
        break;
    }
    return color;
  }

  inspectNft() {
    console.log('inspecting', this)
    const color = this.determineRarity();
    //create parent container
    this.inspectNftContainer = document.createElement('div');
    this.inspectNftContainer.id = 'inspectNftContainer';
    this.inspectNftContainer.style.display = 'flex';
    this.inspectNftContainer.style.flexDirection = 'column';
    window.glotag.glotagPage.appendChild(this.inspectNftContainer);
    
    this.dataContainer = document.createElement('div');
    this.dataContainer.id = 'dataContainer';
    this.dataContainer.style.position = 'absolute';
    this.dataContainer.style.left = '45%';
    this.dataContainer.style.top = '6%';
    this.dataContainer.style.width = '50%';
    this.dataContainer.style.height = '75%';
    this.dataContainer.style.color = 'white';
    this.dataContainer.style.justifyContent = 'center';
    this.dataContainer.style.display = 'flex';
    this.dataContainer.style.overflow = 'hidden';
    this.dataContainer.style.textOverflow = 'ellipsis';
    this.dataContainer.style.whiteSpace = 'nowrap';
    this.inspectNftContainer.appendChild(this.dataContainer);
    
    // Create a wrapper div
    this.tokenIdsWrapper = document.createElement('div');
    this.tokenIdsWrapper.style.position = 'absolute';
    this.tokenIdsWrapper.style.left = '5%';
    this.tokenIdsWrapper.style.top = '25%';
    this.tokenIdsWrapper.style.width = '35%';
    this.tokenIdsWrapper.style.height = '53%';
    this.tokenIdsWrapper.style.borderRadius = '7.5%';
    this.tokenIdsWrapper.style.border = 'solid ' + color + ' 3px';
    this.tokenIdsWrapper.style.overflow = 'hidden'; // Hide the scrollbar from the wrapper

    // Modify the tokenIdsContainer
    this.tokenIdsContainer = document.createElement('div');
    this.tokenIdsContainer.id = 'tokenIdsContainer';
    this.tokenIdsContainer.style.width = '100%';
    this.tokenIdsContainer.style.height = '100%';
    this.tokenIdsContainer.style.color = 'white';
    this.tokenIdsContainer.style.justifyContent = 'flex-start';
    this.tokenIdsContainer.style.display = 'flex';
    this.tokenIdsContainer.style.flexDirection = 'column';
    this.tokenIdsContainer.style.overflowY = 'auto';
    this.tokenIdsContainer.style.whiteSpace = 'nowrap';

    // Append the tokenIdsContainer to the wrapper
    this.tokenIdsWrapper.appendChild(this.tokenIdsContainer);

    // Append the wrapper to the parent container
    this.inspectNftContainer.appendChild(this.tokenIdsWrapper);

    // Assuming `color` is the color you want for the scrollbar thumb
    const scrollbarColor = color; // Use the determined rarity color for the scrollbar thumb
    const scrollbarBackgroundColor = 'transparent'; // Making the track transparent
    const scrollbarWidth = '8px'; // The width of your scrollbar

    // Applying styles to the tokenIdsContainer for custom scrollbar
    this.tokenIdsContainer.style.scrollbarWidth = 'thin'; // For Firefox
    this.tokenIdsContainer.style.scrollbarColor = `${scrollbarColor} ${scrollbarBackgroundColor}`; // For Firefox
    this.tokenIdsContainer.style.boxSizing = 'content-box'; // Exclude padding from width and height
    this.tokenIdsContainer.style.paddingRight = scrollbarWidth; // Add right padding equal to scrollbar width

    // For Webkit (Chrome, Edge, Safari), using CSS properties in JavaScript
    this.tokenIdsContainer.style.overflowY = 'auto'; // Ensuring scrollbar is only shown when necessary
    this.tokenIdsContainer.style.msOverflowStyle = 'none'; // For Internet Explorer 10+
    this.tokenIdsContainer.style.scrollbarWidth = 'thin'; // For modern browsers supporting it

    // For Webkit (Chrome, Edge, Safari), creating a <style> element for pseudo-elements
    const styleSheet = document.createElement('style');
    styleSheet.innerText = `
      #tokenIdsContainer::-webkit-scrollbar {
        width: ${scrollbarWidth}; // Adjust the width of the scrollbar here
      }
      #tokenIdsContainer::-webkit-scrollbar-track {
        background: ${scrollbarBackgroundColor}; // Optional: Adjust track background color
      }
      #tokenIdsContainer::-webkit-scrollbar-thumb {
        background-color: ${scrollbarColor}; // Use the rarity color for the thumb
        border-radius: 4px; // Adjust for rounded corners
      }
      #tokenIdsContainer::-webkit-scrollbar-thumb:hover {
        background: darken(${scrollbarColor}, 20%); // Optional: Change color on hover (use a darker shade of the scrollbar color)
      }
    `;
    document.head.appendChild(styleSheet);
    
    this.sellContainer = document.createElement('div');
    this.sellContainer.id = 'glotagSellContainer';
    this.sellContainer.style.position = 'absolute';
    this.sellContainer.style.left = '5%';
    this.sellContainer.style.top = '85%';
    this.sellContainer.style.width = '83.5%';
    this.sellContainer.style.height = '10%';
    this.sellContainer.style.borderRadius = '15px';
    this.sellContainer.style.overflow = 'hidden';
    this.sellContainer.style.border = 'solid ' + color + ' 3px';
    this.sellContainer.style.justifyContent = 'center';
    this.sellContainer.style.alignItems = 'center';
    this.sellContainer.style.display = 'flex';
    this.inspectNftContainer.appendChild(this.sellContainer);

    //create name
    this.inspectNftName = document.createElement('div');
    this.inspectNftName.innerText = `${this.metadata.name}`;
    this.inspectNftName.style.display = 'flex';
    this.inspectNftName.style.position = 'absolute';
    this.inspectNftName.style.top = '2.5%';
    this.inspectNftName.style.fontSize = '2em';
    this.dataContainer.appendChild(this.inspectNftName);

    //create rarity
    
    this.rarityDisplay = document.createElement('div');
    this.rarityDisplay.innerText = `${this.metadata.rarity}`;
    this.rarityDisplay.style.display = 'flex';
    this.rarityDisplay.style.position = 'absolute';
    this.rarityDisplay.style.color = color;
    this.rarityDisplay.style.top = '10%';
    this.rarityDisplay.style.fontSize = '1.5em';
    this.dataContainer.appendChild(this.rarityDisplay);
    
    this.typeDisplay = document.createElement('div');
    this.typeDisplay.innerText = `${this.metadata.type}`;
    this.typeDisplay.style.display = 'flex';
    this.typeDisplay.style.position = 'absolute';
    this.typeDisplay.style.top = '16%';
    this.typeDisplay.style.fontSize = '1em';
    this.dataContainer.appendChild(this.typeDisplay);
    
    this.descriptionDisplay = document.createElement('div');
    this.descriptionDisplay.innerText = `${this.metadata.description}`;
    this.descriptionDisplay.style.display = 'flex';
    this.descriptionDisplay.style.position = 'absolute';
    this.descriptionDisplay.style.top = '95.5%';
    this.descriptionDisplay.style.fontSize = '1em';
    this.dataContainer.appendChild(this.descriptionDisplay);
    
    this.selectedTokenIdDisplay = document.createElement('div');
    this.selectedTokenIdDisplay.innerText = `${this.metadata.description}`;
    this.selectedTokenIdDisplay.style.display = 'flex';
    this.selectedTokenIdDisplay.style.position = 'absolute';
    this.selectedTokenIdDisplay.style.top = '95.5%';
    this.selectedTokenIdDisplay.style.fontSize = '1em';
    this.dataContainer.appendChild(this.selectedTokenIdDisplay);
    
    //create video container
    this.videoContainer = document.createElement('div');
    this.videoContainer.id = 'videoContainer';
    this.videoContainer.style.display = 'flex';
    this.videoContainer.style.top = '27%'; // Set the width to 200 pixels
    this.videoContainer.style.position = 'absolute';
    this.dataContainer.appendChild(this.videoContainer);

    this.inspectNftVideo = document.createElement('video');
    this.inspectNftVideo.src = `/style/graphics${this.metadata.showcase}`;
    this.inspectNftVideo.style.width = this.metadata.dimensions.mainWidth; // Set the width to 200 pixels
    this.inspectNftVideo.style.height = this.metadata.dimensions.mainHeight; // Set the height to 200 pixels
    this.inspectNftVideo.autoplay = true;
    this.inspectNftVideo.loop = true;
    this.inspectNftVideo.muted = true;
    this.videoContainer.appendChild(this.inspectNftVideo);
    
    this.sellButton = document.createElement('div');
    this.sellButton.id = 'sellButton';
    this.sellButton.style.position = 'absolute';
    this.sellButton.style.right = '0%';
    this.sellButton.style.width = '20%';
    this.sellButton.style.height = '100%';
    this.sellButton.style.backgroundColor = color;
    this.sellButton.style.justifyContent = 'center';
    this.sellButton.style.alignItems = 'center';
    this.sellButton.style.fontColor = 'white';
    this.sellButton.innerText = 'SELL';
    this.sellButton.style.justifyContent = 'center';
    this.sellButton.style.display = 'flex';
    this.sellContainer.appendChild(this.sellButton);

    if (window.client.activePlayer) {
      this.sellContainer.style.display = 'none';
    } else {
      this.sellContainer.style.display = 'flex';
    }
    
    this.sellButton.addEventListener('click', () => {
      this.hideInspectNftContainer();
      
      window.glotag.glotagMode = 'calling_card';
      window.glotag.handleGlotagMode();

      window.windowState = 'marketplace';
      window.dispatchEvent(new CustomEvent('WindowStateChanged'));

      setTimeout(() => {
        window.nftMachine.gloMartInstance.handleNavItemClick('sell');
        window.nftMachine.gloMartInstance.activePage = 'Sell';
      }, 100);
    });

    // Create a div to display the selected token id
    this.selectedTokenIdDisplay = document.createElement('div');
    this.selectedTokenIdDisplay.style.color = 'white';
    this.selectedTokenIdDisplay.style.position = 'absolute';
    this.selectedTokenIdDisplay.style.left = '5%';
    this.selectedTokenIdDisplay.style.fontSize = '1.25em';
    this.selectedTokenIdDisplay.style.width = '73%';
    this.selectedTokenIdDisplay.style.textAlign = 'center';
    this.sellContainer.appendChild(this.selectedTokenIdDisplay);

    // Initialize the currently selected item to null
    this.selectedItem = null;

    const adjustFontSize = (element) => {
      const parentWidth = element.parentElement.offsetWidth;
      const textLength = element.innerText.length;
      const fontSize = Math.min(11, parentWidth / textLength); // 12 is the maximum font size
      element.style.fontSize = `${fontSize}px`;
    }

    this.tokenIds.forEach((tokenId, index) => {
      let item = document.createElement('div');
      item.innerText = tokenId;
      item.style.cursor = 'pointer'; // Change the cursor when hovering over the item
      item.style.padding = '10px'; // Add some padding to each item
      item.addEventListener('click', () => {
        // If there is a currently selected item, remove the highlight from it
        if (this.selectedItem) {
          this.selectedItem.style.backgroundColor = 'transparent';
          this.selectedItem.style.color = 'white';
        }
        // Highlight the selected item
        item.style.backgroundColor = 'white';
        item.style.color = 'black';
        // Update the currently selected item
        this.selectedItem = item;
        // Display the selected token id
        this.selectedTokenIdDisplay.innerText = tokenId;
      });
      this.tokenIdsContainer.appendChild(item);
      adjustFontSize(item);

      // If this is the first item, automatically select it
      if (index === 0) {
        item.click();
      }
    });
    
    //create jump to market button
    if (!this.nftInfo.isListing) return;
    this.jumpToMarketButton = document.createElement('button');
    this.jumpToMarketButton.innerText = 'View in Market';
    this.jumpToMarketButton.addEventListener('click', this.jumpToMarket.bind(this));
    this.inspectNftContainer.appendChild(this.jumpToMarketButton);
    // this.updateUrl();
  }

  // TODO: add later if routing to nfts in glotag is desireable
  // updateUrl() {
  //   // handle glotag nft url
  // }

  jumpToMarket() {
    // set url to go to market listing
    const url = `/glomart/market/${this.nftInfo.token_id}`;
    window.location.href = url;
  }

  handlePreviewClick() {
    if (this.nftInfo.isListed) {
      // take client to listing
      return;
    }

    this.state = 'inspect_nft';
    this.handleState();

    console.log('handling preview click')

    window.glotag.gloPage = 'inspect_nft';
    window.glotag.handleGloPage();
  }

  handleMouseOver() {
    switch (this.state) {
      case 'home':
        this.previewElement.style.height = '90px';
        this.previewElement.style.width = '90px';
        this.previewElement.style.margin = '0px 10px';
        break;
      case 'friend_list':
        this.previewElement.style.height = '100px';
        this.previewElement.style.width = '100px';
        this.previewElement.style.margin = '10px 10px';
        break;
      case 'player_page':
        this.previewElement.style.height = '90px';
        this.previewElement.style.width = '90px';
        this.previewElement.style.margin = '0px 10px';
        break;
      case 'library':
        this.previewElement.style.height = '100px';
        this.previewElement.style.width = '100px';
        this.previewElement.style.margin = '10px 10px';
        break;
      case 'market_preview':
        this.previewElement.style.height = '110px';
        this.previewElement.style.width = '110px';
        this.previewElement.style.margin = '15px 15px';
        break;
      default:
        this.previewElement.style.height = '90px';
        this.previewElement.style.width = '90px';
        this.previewElement.style.margin = '0px 10px';
        break;
    }
  }

  handleMouseOut() {
    switch (this.state) {
      case 'home':
        this.previewElement.style.height = '80px';
        this.previewElement.style.width = '80px';
        this.previewElement.style.margin = '0px 20px';
        break;
      case 'friend_list':
        this.previewElement.style.height = '90px';
        this.previewElement.style.width = '90px';
        this.previewElement.style.margin = '20px 20px';
        break;
      case 'player_page':
        this.previewElement.style.height = '80px';
        this.previewElement.style.width = '80px';
        this.previewElement.style.margin = '0px 20px';
        break;
      case 'library':
        this.previewElement.style.height = '90px';
        this.previewElement.style.width = '90px';
        this.previewElement.style.margin = '20px 20px';
        break;
      case 'market_preview':
        this.previewElement.style.height = '100px';
        this.previewElement.style.width = '100px';
        this.previewElement.style.margin = '25px 25px';
        break;
      default:
        this.previewElement.style.height = '80px';
        this.previewElement.style.width = '80px';
        this.previewElement.style.margin = '0px 20px';
        break;
    }
  }

  async fetchNftMetadata() {
    return new Promise(async (resolve, reject) => {
      try {
        // If the URI has already been fetched, use the fetched metadata
        if (window.client.fetchedUris.has(this.nftInfo.token_uri)) {
          this.metadata = window.client.fetchedUris.get(this.nftInfo.token_uri);
          window.client.createNftList(this);
          this.handleState();
          resolve(this); // Resolve with the NFT object
          return;
        }

        const response = await fetch(this.nftInfo.token_uri);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        this.metadata = await response.json();

        // Add the URI and its metadata to the map of fetched URIs
        window.client.fetchedUris.set(this.nftInfo.token_uri, this.metadata);

        window.client.createNftList(this);
        this.handleState();
        resolve(this); // Resolve with the NFT object
      } catch (error) {
        console.error('Error fetching NFT metadata from IPFS:', error);
        reject(error); // Reject with the error
      }
    });
  }

  createWebpImageObject(source) {
    const image = new Image();
    image.src = source + ".webp";
    this.previewImg = image.src;
  }

    fetchUserNftMetadata(id) {
    window.client.socket.emit('get_nft_metadata', id);
  }
}

class Player {
  constructor(state, playerInfo) {
    this.state = state;
    this.playerInfo = playerInfo;
    this.gloInfo = {
      username: playerInfo.nickname,
      walletID: playerInfo.walletID,
      levelRank: playerInfo.ranks.levelRank,
      luncRank: playerInfo.ranks.luncRank
    }
    
    this.glotagSrc = 'black'; // Default value or path for glotag
    this.pfpSrc = '/style/graphics/pfp.png'; // Default path for pfp
    this.glotagBoxShadowSrc = '-0.025rem 0 0.025rem #FFFFFF, 0 0.025rem 0.025rem #FFFFFF, -0.25rem 0.25rem 0.25rem #FFFFFF, -0.1rem 0.1rem 0.1rem #FFFFFF, -0.35rem 0.35rem 0.35rem #FFFFFF, inset 0 0 0.1625rem #FFFFFF';
    this.glotagTextColorSrc = 'white';

    this.setActiveNfts();
    this.handleState();
  }

  updatePlayerInfo(callback) {
    console.log('updatePlayerInfo called');
    fetch('/get_player', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ walletID: this.gloInfo.walletID }),
    })
    .then(response => response.json())
    .then(data => {
      this.playerInfo = data;
      console.log('got player info', this);
      this.handlePreviewClick();
    })
    .catch((error) => {
      console.error('Error:', error);
    });
  }

  handleState() {
    switch (this.state) {
      case 'home':
        this.createPreviewPlayer();
        break;
      case 'friend_list':
        this.createFriendListPlayer();
        break;
      case 'leaderboard':
        this.createLeaderboardEntry();
        break;
      default:
        break;
    }
  }

  createPreviewPlayer() {
    if (this.previewElement) {
      this.previewElement.style.display = 'flex';
    } else {
      this.previewElement = document.createElement('div');
      this.previewElement.id = 'playerPreview';
      this.previewElement.style.display = 'flex';
      this.previewElement.style.flex = '0 0 auto';
      this.previewElement.style.justifyContent = 'center';
      this.previewElement.style.alignItems = 'center';
      this.previewElement.style.paddingLeft = '2.5%';
      this.previewElement.style.height = '125px';
      this.previewElement.style.width = '125px';
      // Set the font size to ensure text fits inside the circle
      this.previewElement.style.fontSize = '12px'; // Adjust as needed
      this.previewElement.style.overflow = 'hidden'; // Prevent text from overflowing
      this.previewElement.style.flexDirection = 'column';

      
      this.playerPfpElement = new Image();
      this.playerPfpElement.id = 'playerPfpPreview';
      this.playerPfpElement.style.display = 'flex';
      this.playerPfpElement.style.height = '80px';
      this.playerPfpElement.style.borderRadius = '50%';
      this.playerPfpElement.style.justifyContent = 'center';
      this.playerPfpElement.style.alignItems = 'center';
      if (this.playerInfo.activeNfts.pfp) {
        console.log('player has a set pfp', window.client.loadedNfts)
        const pfp = window.client.loadedNfts.get(this.playerInfo.activeNfts.pfp);
        if (!pfp) {
          console.log('player pfp not loaded, fetching metadata for', this.playerInfo.activeNfts.pfp)
          this.fetchUserNftMetadata(this.playerInfo.activeNfts.pfp);

          window.client.socket.once('return_metadata', (metadata) => {
            console.log('received metadata for pfp', metadata);
            this.playerPfpElement.src = `/style/graphics/token_images${metadata.mainImg}.webp`;
            window.client.addToLoadedNfts([{
              tokenId: this.playerInfo.activeNfts.pfp,
              metadata
            }]);
          });
        } else {
          console.log('player pfp already loaded', pfp.metadata.mainImg);
          this.playerPfpElement.src = `/style/graphics/token_images${pfp.metadata.mainImg}.webp`;
        }
      } else {
        console.log('player has no set pfp')
        this.playerPfpElement.src = '/style/graphics/pfp.png';
      }
      this.previewElement.appendChild(this.playerPfpElement);

      
      this.nameElement = document.createElement('div');
      this.nameElement.id = 'playerNamePreview';
      this.nameElement.style.display = 'flex';
      this.nameElement.style.justifyContent = 'center';
      this.nameElement.style.alignItems = 'center';
      this.nameElement.style.color = 'white';
      this.nameElement.innerText = this.playerInfo.nickname;
      this.previewElement.appendChild(this.nameElement);

      // this.playerPfpElement.addEventListener('mouseenter', () => {
      //   gsap.to(this.previewElement, { scale: 1.1, duration: 0.25 });
      // });

      
      // this.playerPfpElement.addEventListener('mouseleave', () => {
      //   gsap.to(this.previewElement, { scale: 1.0, duration: 0.25 });
      // });

    this.previewElement.addEventListener('mouseover', (event) => {
        event.stopPropagation(); // This stops the event from propagating further
        this.previewElement.style.cursor = 'pointer';
        this.playerPfpElement.style.boxShadow = 'white 0px 0px 17px 3px';
    });

    this.previewElement.addEventListener('mouseout', (event) => {
        event.stopPropagation(); // This stops the event from propagating further
        this.playerPfpElement.style.boxShadow = 'none';
    });

      this.previewElement.addEventListener('dblclick', (event) => {
        event.stopPropagation(); // This stops the event from propagating further
        if (this.state === 'home') {
          this.handlePreviewClick();
        }
      });

      this.previewElement.addEventListener('click', (event) => {
        event.stopPropagation(); // This stops the event from propagating further
        if (this.state !== 'home') {
          this.handlePreviewSelect(this.playerInfo);
        }
      });
    }
  }

  createFriendListPlayer() {
    this.previewElement.style.display = 'flex';
    // this.previewElement.style.height = '40%';
    // this.previewElement.style.width = '100%';
    this.previewElement.style.margin = '5% 2.5%';
    // this.playerPfpElement.style.width = '30%';
    // this.playerPfpElement.style.height = 'auto';
  }

  createLeaderboardEntry() {
    console.log('Created Leaderboard Player:', this)
  }

  handleMouseOver() {
    switch (this.state) {
      case 'home':
        this.previewElement.style.height = '90px';
        this.previewElement.style.width = '90px';
        this.previewElement.style.margin = '0px 10px';
        break;
      case 'friend_list':
        this.previewElement.style.height = '100px';
        this.previewElement.style.width = '100px';
        this.previewElement.style.margin = '10px 10px';
        break;
      default:
        this.previewElement.style.height = '90px';
        this.previewElement.style.width = '90px';
        this.previewElement.style.margin = '0px 10px';
        console.error('invalid friend state');
        break;
    }
  }

  handleMouseOut() {
    switch (this.state) {
      case 'home':
        this.previewElement.style.height = '80px';
        this.previewElement.style.width = '80px';
        this.previewElement.style.margin = '0px 20px';
        break;
      case 'friend_list':
        this.previewElement.style.height = '90px';
        this.previewElement.style.width = '90px';
        this.previewElement.style.margin = '20px 20px';
        break;
      default:
        this.previewElement.style.height = '80px';
        this.previewElement.style.width = '80px';
        this.previewElement.style.margin = '0px 20px';
        console.error('invalid friend state');
        break;
    }
  }

  async handlePreviewClick() {
    console.log('walletid', this.playerInfo.walletID, 'walletID', window.client.gloInfo.walletID)
    window.client.switchingPlayers = true;
    if (window.glotag.friendList && window.glotag.friendList.friendListHomeElement) window.glotag.friendList.friendListHomeElement.innerText = '';
    if (window.glotag.nftList && window.glotag.nftList.nftListHomeElement) window.glotag.nftList.nftListHomeElement.innerText = '';
    if (window.glotag.gloPage == 'player') {
      if (this.playerInfo.walletID == window.client.gloInfo.walletID) {
        window.glotag.backToClientPage()
        return;
      }
    }
    console.log('storing active player', this)
    window.client.storeActivePlayer(this);

    window.glotag.gloPage = 'player';
    window.glotag.glotagMode = 'player';
    window.glotag.handleGlotagMode();
  }

  handlePreviewSelect(nickname) {
    console.log('handling preview select with player:', nickname);
    let active = document.getElementById('activeFriendContainer');
    if(!active) {
      this.activeFriendContainer = document.createElement('div');
      this.activeFriendContainer.id = 'activeFriendContainer';
      this.activeFriendContainer.style.position = 'relative';
      this.activeFriendContainer.style.top = '15%';
      this.activeFriendContainer.style.width = '80%';
      this.activeFriendContainer.style.height = '30%';
      window.glotag.friendList.friendsListController.appendChild(this.activeFriendContainer);
      this.activeFriendGlotag = document.createElement('div');
      this.activeFriendGlotag.id = 'activeFriendGlotag';
      this.activeFriendGlotag.style.position = 'absolute';
      this.activeFriendGlotag.style.borderRadius = '1rem';
      this.activeFriendGlotag.style.height = '100px';
      this.activeFriendGlotag.style.width = '400px';
      this.activeFriendGlotag.style.display = 'flex';
      this.activeFriendGlotag.style.alignItems = 'center';
      this.activeFriendGlotag.style.zIndex = '4';
      this.activeFriendGlotag.style.fontFamily = 'Gabarito, sans-serif';
      this.activeFriendGlotag.style.fontWeight = 'bold';
      this.activeFriendGlotag.style.cursor = 'pointer';
      this.activeFriendGlotag.style.backgroundSize = 'cover';
      this.activeFriendContainer.appendChild(this.activeFriendGlotag);
      this.activeFriendPFP = document.createElement('img');
      this.activeFriendPFP.id = 'activeFriendPFP';
      this.activeFriendPFP.style.height = '75px';
      this.activeFriendPFP.style.borderRadius = '60px';
      this.activeFriendPFP.style.position = 'relative';
      this.activeFriendPFP.style.borderRadius = '40px';
      this.activeFriendPFP.style.left = '7.55%';
      this.activeFriendGlotag.appendChild(this.activeFriendPFP);
      this.activeFriendName = document.createElement('span');
      this.activeFriendName.id = 'activeFriendName';
      this.activeFriendName.style.color = 'white';
      this.activeFriendName.style.position = 'relative';
      this.activeFriendName.style.left = '12.5%';
      this.activeFriendName.style.fontFamily = 'Gabarito';
      this.activeFriendName.style.fontSize = '3em';
      this.activeFriendGlotag.appendChild(this.activeFriendName);
      this.activeFriendDescription = document.createElement('div');
      this.activeFriendDescription.id = 'activeFriendDescription';
      this.activeFriendDescription.style.color = 'white';
      this.activeFriendDescription.style.position = 'relative';
      this.activeFriendDescription.style.top = '30%';
      this.activeFriendDescription.style.height = '30%';
      this.activeFriendDescription.style.width = '80%';
      this.activeFriendDescription.style.display = 'flex';
      this.activeFriendDescription.style.flexDirection = 'column';
      window.glotag.friendList.friendsListController.appendChild(this.activeFriendDescription);
      this.activeFriendUsernameTitle = document.createElement('span');
      this.activeFriendUsernameTitle.id = 'activeFriendUsernameTitle';
      this.activeFriendUsernameTitle.innerText = 'HIGHSCORE:';
      this.activeFriendUsernameTitle.style.textAlign = 'center';
      this.activeFriendDescription.appendChild(this.activeFriendUsernameTitle);
      this.activeFriendHighscore = document.createElement('span');
      this.activeFriendHighscore.id = 'activeFriendHighscore';
      this.activeFriendHighscore.style.textAlign = 'center';
      this.activeFriendDescription.appendChild(this.activeFriendHighscore);
    }
    document.getElementById('activeFriendGlotag').addEventListener('click', (event) => {
      this.handlePreviewClick(event);
      document.getElementById('activeFriendContainer').remove();
      document.getElementById('activeFriendDescription').remove();
    });

    //update data
    if(nickname.activeNfts.glotag) {
      //fetch metadata
      console.log('player has a set glotag')
      const glotag = window.client.loadedNfts.get(nickname.activeNfts.glotag);
      if (!glotag) {
        console.log('player glotag not loaded, fetching metadata for', nickname.activeNfts.glotag)
        this.fetchUserNftMetadata(nickname.activeNfts.glotag, 'glotag');

        window.client.socket.once('return_glotag_metadata', (metadata) => {
          console.log('received metadata for glotag', metadata);
          document.getElementById('activeFriendGlotag').style.background = `url(/style/graphics/token_images${metadata.mainImg}.webp)`;
          window.client.addToLoadedNfts([{
            tokenId: nickname.activeNfts.glotag,
            metadata
          }]);
        });
      } else {
        console.log('player glotag already loaded', glotag.metadata.mainImg);
        document.getElementById('activeFriendGlotag').style.background = `url(/style/graphics/token_images${glotag.metadata.mainImg}.webp)`;
      }
    } else {
      document.getElementById('activeFriendGlotag').style.background = 'black';
      document.getElementById('activeFriendGlotag').style.boxShadow = 'rgb(255, 255, 255) -0.025rem 0px 0.025rem, rgb(255, 255, 255) 0px 0.025rem 0.025rem, rgb(255, 255, 255) -0.25rem 0.25rem 0.25rem, rgb(255, 255, 255) -0.1rem 0.1rem 0.1rem, rgb(255, 255, 255) -0.35rem 0.35rem 0.35rem, rgb(255, 255, 255) 0px 0px 0.1625rem inset';
    }

    document.getElementById('activeFriendPFP').src = this.playerPfpElement.src;
    document.getElementById('activeFriendName').innerText = nickname.nickname;
    document.getElementById('activeFriendHighscore').innerText = nickname.highscore;
  }

  setActiveNfts() {
    this.setPfp();
    this.setGlotag();
  }

  async setPfp() {
    if (this.playerInfo.activeNfts.pfp) {
      console.log('Player instance has a set pfp');
      let pfp = window.client.loadedNfts?.get(this.playerInfo.activeNfts.pfp);

      if (!pfp) {
        console.log('Player instance pfp not loaded, fetching metadata for', this.playerInfo.activeNfts.pfp);
        // Wait for metadata event before proceeding
        this.fetchUserNftMetadata(this.playerInfo.activeNfts.pfp, 'pfp');

        window.client.socket.once('return_pfp_metadata', (metadata) => {
          if (metadata && metadata.type) {
            console.log('Received metadata for pfp', metadata);
            this.pfpSrc = `url(/style/graphics/token_images${metadata.mainImg}.webp)`;
            window.client.addToLoadedNfts([{ tokenId: this.playerInfo.activeNfts.pfp, metadata }]);
          }
        });
      } else {
        console.log('Player instance pfp already loaded', pfp.metadata.mainImg);
        this.pfpSrc = `url(/style/graphics/token_images${pfp.metadata.mainImg}.webp)`;
      }
    } else {
      console.log('Player instance has no active pfp');
      this.pfpSrc = 'url(/style/graphics/pfp.png)';
    }
  }

  async setGlotag() {
    if (this.playerInfo.activeNfts.glotag) {
      console.log('Player instance has a set glotag, checking', this.playerInfo.activeNfts.glotag, 'against', window.client.loadedNfts);
      let glotag = window.client.loadedNfts?.get(this.playerInfo.activeNfts.glotag);

      if (!glotag) {
        console.log('Player instance glotag not loaded, fetching metadata for', this.playerInfo.activeNfts.glotag);
        // Wait for metadata event before proceeding
          this.fetchUserNftMetadata(this.playerInfo.activeNfts.glotag, 'glotag');

          window.client.socket.once('return_glotag_metadata', (metadata) => {
            if (metadata && metadata.type) {
              console.log('Received metadata for glotag', metadata);
              this.glotagSrc = `url(/style/graphics/token_images${metadata.mainImg}.webp)`;
              this.glotagBoxShadowSrc = metadata.boxShadow;
              this.glotagTextColorSrc = metadata.textColor;
              window.client.addToLoadedNfts([{ tokenId: this.playerInfo.activeNfts.glotag, metadata }]);
            }
        });
      } else {
        console.log('Player instance glotag already loaded', glotag.metadata.mainImg);
        this.glotagSrc = `url(/style/graphics/token_images${glotag.metadata.mainImg}.webp)`;
        this.glotagBoxShadowSrc = glotag.metadata.boxShadow;
        this.glotagTextColorSrc = glotag.metadata.textColor;
      }
    } else {
      console.log('Player instance has no active glotag');
      this.glotagSrc = 'black';
      this.glotagBoxShadowSrc = '-0.025rem 0 0.025rem #FFFFFF, 0 0.025rem 0.025rem #FFFFFF, -0.25rem 0.25rem 0.25rem #FFFFFF, -0.1rem 0.1rem 0.1rem #FFFFFF, -0.35rem 0.35rem 0.35rem #FFFFFF, inset 0 0 0.1625rem #FFFFFF';
      this.glotagTextColorSrc = 'white';
    }
  }

  

  async checkAndLoadNft(nftType) {
    if (this.playerInfo.activeNfts && this.playerInfo.activeNfts[nftType]) {
      console.log(`Player instance has a set ${nftType}`);
      let nft = window.client.loadedNfts?.get(this.playerInfo.activeNfts[nftType]);
  
      if (!nft) {
        console.log(`Player instance ${nftType} not loaded, fetching metadata for`, this.playerInfo.activeNfts[nftType]);
        // Wait for metadata event before proceeding
        const metadata = await new Promise((resolve, reject) => {
          this.fetchUserNftMetadata(this.playerInfo.activeNfts[nftType]);
  
          window.client.socket.once('return_metadata', (metadata) => {
            if (metadata && metadata.type) {
              console.log(`Received metadata for ${metadata.type}`, metadata);
              resolve(metadata);
            } else {
              reject('Failed to receive metadata');
            }
          });
        });
  
        this[nftType + 'Src'] = `url(/style/graphics/token_images${metadata.mainImg}.webp)`;
        window.client.addToLoadedNfts([{ tokenId: this.playerInfo.activeNfts[nftType], metadata }]);
      } else {
        console.log(`Player instance ${nftType} already loaded`, nft.metadata.mainImg);
        this[nftType + 'Src'] = `url(/style/graphics/token_images${nft.metadata.mainImg}.webp)`;
      }
  
      // Trigger updates or re-render if necessary here, after setting src
    } else {
      console.log(`Player instance has no active nft`);
      // Default assignments when no active NFT is found
      this[nftType + 'Src'] = nftType === 'pfp' ? 'url(/style/graphics/pfp.png)' : 'black'; // Default value or style for glotag
    }
  }

  fetchUserNftMetadata(id, type) {
    console.log('fetching user nft metdata', id, type)
    if (type) {
      switch (type) {
        case 'pfp':
          window.client.socket.emit('get_pfp_metadata', id);
          break;
        case 'glotag':
          console.log('fetching glotag metadata')
          window.client.socket.emit('get_glotag_metadata', id);
          break;
        default:
          window.client.socket.emit('get_nft_metadata', id);
          break;
      }
      return;
    }
    window.client.socket.emit('get_nft_metadata', id);
  }
}



class Wallets {
  constructor(){
    this.handleGloPage();
  }
  handleGloPage() {
    switch(window.glotag.gloPage){
      case "wallets":
        this.createWalletsPage();
      break;
      default:
        if (this.walletsPage) {
          this.hideWalletsPage();
        }
    }
  }

  createWalletsPage(){
    if (!this.walletsPage) {
      //wallets page
      this.walletsPage = document.createElement('div');
      this.walletsPage.id = 'walletPage';
      this.walletsPage.style.height = '100%';
      this.walletsPage.style.width = '100%';
      window.glotag.glotagPage.appendChild(this.walletsPage);

      //page title
      this.pageTitle = document.createElement('h1');
      this.walletsPage.appendChild(this.pageTitle);
      this.pageTitle.style.display = 'flex';
      this.pageTitle.textContent = 'MANAGE WALLETS';
      this.pageTitle.style.color = 'white';
      this.pageTitle.style.position = 'absolute';
      this.pageTitle.style.top = '7.5%';
      this.pageTitle.style.left = '70%';
      this.pageTitle.style.transform = 'translate(-50%, -50%)';
      this.pageTitle.style.fontSize = '2.5rem';
      this.pageTitle.style.textShadow = "0.15rem 0.15rem 0 #000, 0.15rem 0.15rem 0 #000, 0.15rem 0.15rem 0 #000, 0.15rem 0.15rem 0 #000";
      this.pageTitle.style.whiteSpace = 'nowrap';

      //main container
      this.walletsContainer = document.createElement('div');
      this.walletsPage.appendChild(this.walletsContainer);
      this.walletsContainer.style.position = 'absolute';
      this.walletsContainer.style.borderRadius = '65px';
      this.walletsContainer.style.height = '65%';
      this.walletsContainer.style.width = '75%';
      this.walletsContainer.style.top = '20%';
      this.walletsContainer.style.left = '50%';
      this.walletsContainer.style.width = '100%';
      this.walletsContainer.style.transform = 'translate(-50%, 0%)';

      //wallet display
      this.walletDisplay = document.createElement('div');
      this.walletDisplay.style.position = 'absolute';
      this.walletDisplay.style.top = '7.55%';
      this.walletDisplay.style.width = '80%';
      this.walletDisplay.style.left = '50%';
      this.walletDisplay.style.transform = 'translateX(-50%)';
      this.walletDisplay.style.height = '33%';
      this.walletDisplay.style.display = 'flex';
      this.walletDisplay.style.justifyContent = 'center';
      this.walletDisplay.style.alignItems = 'center';
      this.walletDisplay.style.flexDirection = 'column';
      this.walletsContainer.appendChild(this.walletDisplay);

      //wallet title
      this.walletTitle = document.createElement('span');
      this.walletTitle.innerText = 'WALLET:';
      this.walletTitle.style.color = 'white';
      this.walletTitle.style.fontSize = '3em';
      this.walletTitle.style.fontWeight = '750';
      this.walletTitle.style.marginBottom = '2.5%';
      this.walletDisplay.appendChild(this.walletTitle);

      //wallet text
      this.activeWallet = document.createElement('span');
      this.walletDisplay.appendChild(this.activeWallet);
      this.activeWallet.style.fontSize = '3em';
      this.activeWallet.style.color = 'white';
      this.activeWallet.style.fontFamily = 'Gabarito';
      this.activeWallet.style.fontWeight = '750';
      this.activeWallet.textContent = window.client.gloInfo.walletID;

      //name display
      this.nameDisplay = document.createElement('div');
      this.nameDisplay.style.position = 'absolute';
      this.nameDisplay.style.top = '55%';
      this.nameDisplay.style.width = '50%';
      this.nameDisplay.style.left = '50%';
      this.nameDisplay.style.transform = 'translateX(-50%)';
      this.nameDisplay.style.height = '33%';
      this.nameDisplay.style.display = 'flex';
      this.nameDisplay.style.justifyContent = 'center';
      this.nameDisplay.style.alignItems = 'center';
      this.nameDisplay.style.flexDirection = 'column';
      this.walletsContainer.appendChild(this.nameDisplay);

      //name title
      this.nameTitle = document.createElement('span');
      this.nameTitle.innerText = 'USERNAME:';
      this.nameTitle.fontFamily = 'Silkscreen';
      this.nameTitle.style.color = 'white';
      this.nameTitle.style.fontSize = '3em';
      this.nameTitle.style.fontWeight = '750';
      this.nameTitle.style.marginBottom = '7.5%';
      this.nameDisplay.appendChild(this.nameTitle);

      // Create the div element
      this.inputBox = document.createElement('div');
      this.inputBox.className = 'inputbox';

      // Create the input element
      this.inputElement = document.createElement('input');
      this.inputElement.required = 'required';
      this.inputElement.type = 'text';
      this.inputBox.appendChild(this.inputElement);

      // List of curse words to filter out
      const curseWords = ['nigger', 'n|gger', 'n|gga', 'n|gg4','n|gg3r', 'nigga', 'niggas', 'cracker', 'chink', 'kyke', 'spic', 'beaner', 'gook', 'niggers', 'n1gger', 'nigg3r', 'n1ggers', 'nigg3rs', 'n1gg3r', 'n1gg3rs'];

      // Add an event listener to the input event
      this.inputElement.addEventListener('input', function() {
        let value = this.value;
        
        // Replace all occurrences of '|\|' with asterisks
        let specialCharRegex = new RegExp('\\|\\\\\\|', 'gi');
        value = value.replace(specialCharRegex, '****');

        for (let curseWord of curseWords) {
          // Escape special characters in the curse word
          let escapedCurseWord = curseWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
          let regex = new RegExp(escapedCurseWord, 'gi');
          value = value.replace(regex, '****'); // replace curse word with asterisks
        }
        this.value = value;
      });

      // Create the span element
      this.spanElement = document.createElement('span');
      this.spanElement.innerText = window.client.gloInfo.username;
      this.inputBox.appendChild(this.spanElement);

      // Create the svg element
      this.svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      this.svgElement.setAttribute('class', 'pencil'); // changed class to 'pencil'
      this.svgElement.setAttribute('viewBox', '0 0 512 512');

      // Create the path element
      this.pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      this.pathElement.setAttribute('d', 'M410.3 231l11.3-11.3-33.9-33.9-62.1-62.1L291.7 89.8l-11.3 11.3-22.6 22.6L58.6 322.9c-10.4 10.4-18 23.3-22.2 37.4L1 480.7c-2.5 8.4-.2 17.5 6.1 23.7s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L387.7 253.7 410.3 231zM160 399.4l-9.1 22.7c-4 3.1-8.5 5.4-13.3 6.9L59.4 452l23-78.1c1.4-4.9 3.8-9.4 6.9-13.3l22.7-9.1v32c0 8.8 7.2 16 16 16h32zM362.7 18.7L348.3 33.2 325.7 55.8 314.3 67.1l33.9 33.9 62.1 62.1 33.9 33.9 11.3-11.3 22.6-22.6 14.5-14.5c25-25 25-65.5 0-90.5L453.3 18.7c-25-25-65.5-25-90.5 0zm-47.4 168l-144 144c-6.2 6.2-16.4 6.2-22.6 0s-6.2-16.4 0-22.6l144-144c6.2-6.2 16.4-6.2 22.6 0s6.2 16.4 0 22.6z');
      this.pathElement.setAttribute('fill', '#ffffff'); // set fill to white

      // Append the path element to the svg element
      this.svgElement.appendChild(this.pathElement);

      // Append the svg element to the inputBox
      this.inputBox.appendChild(this.svgElement);

      // Add event listener for focus event
      this.inputElement.addEventListener('focus', () => {
        this.spanElement.innerText = 'New Username';

      // Create the div element with class 'thick-check-mark'
      this.editNameCheck = document.createElement('div');
      this.editNameCheck.className = 'thick-check-mark';
      this.editNameCheck.addEventListener('click', (event) => {
        console.log('Check mark clicked');
        // Stop the event propagation
        event.stopPropagation();

        // Get the new username from the input element
        const newUsername = this.inputElement.value;

        // Make a POST request to the "/updateplayer" endpoint
        fetch('/updateplayer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            walletID: window.client.gloInfo.walletID,
            newUsername: newUsername,
          }),
        })
        .then(response => response.json())
        .then(data => {
          if (data.message === "Username updated successfully") {
            // Update the username in the client info
            window.client.gloInfo.username = newUsername;
            // Update the span element text
            this.spanElement.innerText = newUsername;
            this.inputElement.value = '';
            this.inputElement.blur();
          } else {
            console.error('Error:', data.message);
          }
        })
        .catch((error) => {
          console.error('Error:', error);
        });
      });

      // Prevent the blur event from being triggered when the check mark is clicked
      this.editNameCheck.addEventListener('mousedown', (event) => {
        event.preventDefault();
      });

      // Append the check mark to the inputBox
      this.inputBox.appendChild(this.editNameCheck);
      });

      // Add event listener for blur event
      this.inputElement.addEventListener('blur', () => {
        this.spanElement.innerText = window.client.gloInfo.username;

      // Fade out the check mark over 0.5 seconds
      gsap.to(this.editNameCheck, {opacity: 0, duration: 0.5, onComplete: () => {
        // Remove the check mark from the inputBox after the animation completes
        if (this.editNameCheck) {
          this.inputBox.removeChild(this.editNameCheck);
          this.editNameCheck = null;
        }
      }});
      });

      // Create the i element
      this.iElement = document.createElement('i');
      this.inputBox.appendChild(this.iElement);

      // Append the inputBox to the parent element
      this.nameDisplay.appendChild(this.inputBox);

      //account name
      // this.accountUsername = document.createElement('input');
      // this.walletsContainer.appendChild(this.accountUsername);
      // this.accountUsername.placeholder = window.client.gloInfo.username;
      // this.accountUsername.style.position = 'absolute';
      // this.accountUsername.style.fontSize = '2rem';
      // this.accountUsername.style.left = '50%';
      // this.accountUsername.style.top = '35%';
      // this.accountUsername.style.transform = 'translate(-50%, 0%)';
      // this.accountUsername.style.background = 'black';
      // this.accountUsername.style.color = 'white';
      // this.accountUsername.style.fontFamily = 'Gabarito';

      // this.accountUsername.addEventListener('click', () => {
      //   // Create and append the cancel and accept buttons when the input is clicked
      //   const cancelButton = document.createElement('button');
      //   cancelButton.textContent = 'Cancel';
      //   this.walletsContainer.appendChild(cancelButton);

      //   const acceptButton = document.createElement('button');
      //   acceptButton.textContent = 'Accept';
      //   this.walletsContainer.appendChild(acceptButton);

      //   // Add event listeners to the buttons
      //   cancelButton.addEventListener('click', () => {
      //     // Remove the buttons when the cancel button is clicked
      //     cancelButton.remove();
      //     acceptButton.remove();
      //   });

      //   acceptButton.addEventListener('click', () => {
      //     // Send a POST request to the /changeUsername endpoint when the accept button is clicked
      //     const username = this.accountUsername.value.trim();
      //     if (username) {
      //       fetch('/changeUsername', {
      //         method: 'POST',
      //         headers: {
      //           'Content-Type': 'application/json',
      //         },
      //         body: JSON.stringify({ walletID: window.client.gloInfo.walletID, username: username }),
      //       })
      //       .then(response => response.json())
      //       .then(data => console.log(data))
      //       .catch((error) => {
      //         console.error('Error:', error);
      //       });
      //     }
      //     // Remove the buttons
      //     cancelButton.remove();
      //     acceptButton.remove();
      //   });
      // // });

      // this.accountUsername.addEventListener('keydown', (event) => {
      //   if (event.keyCode === 13) { // 13 is the key code for the Enter key
      //     // Send a POST request to the /changeUsername endpoint when Enter is pressed
      //     const username = this.accountUsername.value.trim();
      //     if (username) {
      //       fetch('/changeUsername', {
      //         method: 'POST',
      //         headers: {
      //           'Content-Type': 'application/json',
      //         },
      //         body: JSON.stringify({ walletID: window.client.gloInfo.walletID, username: username }),
      //       })
      //       .then(response => response.json())
      //       .then(data => console.log(data))
      //       .catch((error) => {
      //         console.error('Error:', error);
      //       });
      //     }
      //   }
      // });
      

      // hard logout container
      this.hardLogoutContainer = document.createElement('div');
      this.hardLogoutContainer.style.position = 'absolute';
      this.hardLogoutContainer.style.bottom = '-10%';
      this.hardLogoutContainer.style.left = '50%';
      this.hardLogoutContainer.style.transform = 'translateX(-50%)';
      this.walletsContainer.appendChild(this.hardLogoutContainer);

      //hardlogout button
      this.hardLogout = document.createElement('button');
      this.hardLogout.className = 'hard-logout';
      this.hardSign = document.createElement('div');
      this.hardSign.className = 'hard-sign';
      let svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svgElement.setAttribute('viewBox', '0 0 512 512');
      let pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      pathElement.setAttribute('d', 'M377.9 105.9L500.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L377.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1-128 0c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM160 96L96 96c-17.7 0-32 14.3-32 32l0 256c0 17.7 14.3 32 32 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-64 0c-53 0-96-43-96-96L0 128C0 75 43 32 96 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32z');
      svgElement.appendChild(pathElement);
      this.hardSign.appendChild(svgElement);
      let hardText = document.createElement('div');
      hardText.className = 'hard-text';
      hardText.textContent = 'Logout';
      this.hardLogout.appendChild(this.hardSign);
      this.hardLogout.appendChild(hardText);
      this.hardLogoutContainer.appendChild(this.hardLogout);

      this.hardLogout.addEventListener('click', () => {
        window.client.hardLogout(); // Call the logout method of window.client
        window.glotag.usernameElement.textContent = '';
        window.glotag.playerCardCreated = false;
        window.glotag.glotagCreated = false;
      });
    }
    this.walletsPage.style.display = 'flex';
  }

  hideWalletsPage() {
    this.walletsPage.style.display = 'none';
  }
}

class Settings {
  constructor(){
    this.handleGloPage();
  }
  handleGloPage() {
    switch(window.glotag.gloPage){
      case "settings":
        this.createSettingsPage();
      break;
      default:
        if (this.settingsPage) {
          this.hideSettingsPage();
        }
    }
  }

  createSettingsPage(){
    if (!this.settingsPage) {
      //setting page
      this.settingsPage = document.createElement('div');
      this.settingsPage.id = 'settingsPage';
      this.settingsPage.style.height = '100%';
      this.settingsPage.style.width = '100%';
      window.glotag.glotagPage.appendChild(this.settingsPage);

      //page title
      this.pageTitle = document.createElement('h1');
      this.settingsPage.appendChild(this.pageTitle);
      this.pageTitle.style.display = 'flex';
      this.pageTitle.textContent = 'SETTINGS';
      this.pageTitle.style.color = 'white';
      this.pageTitle.style.position = 'absolute';
      this.pageTitle.style.top = '7.5%';
      this.pageTitle.style.left = '70%';
      this.pageTitle.style.transform = 'translate(-50%, -50%)';
      this.pageTitle.style.fontSize = '3rem';
      this.pageTitle.style.textShadow = "0.15rem 0.15rem 0 #000, 0.15rem 0.15rem 0 #000, 0.15rem 0.15rem 0 #000, 0.15rem 0.15rem 0 #000";
      this.pageTitle.style.whiteSpace = 'nowrap';
    }
    this.settingsPage.style.display = 'flex';
  }

  hideSettingsPage() {
    this.settingsPage.style.display = 'none';
  }
}

class NftSelection {
  constructor() {
    this.handleGloPage();
  }

  handleGloPage() {
    switch(window.glotag.gloPage){
      case "nftSelection":
        this.createNftSelectionPage();
      break;
      default:
        if (this.nftSelectionPage) {
          this.hideNftSelectionPage();
        }
    }
  }

  createNftSelectionPage(){
    if(this.nftSelectionPage) {
      this.nftSelectionPage.style.display = 'flex';
      let gridElement =  document.getElementById('gridContainer');
      gridElement.style.display = 'grid';
      let element = document.getElementById('grid-select-container');
      if(element) element.remove();
      return;
    }

      //setting page
      this.nftSelectionPage = document.createElement('div');
      this.nftSelectionPage.id = 'nftSelectionPage';
      this.nftSelectionPage.style.height = '100%';
      this.nftSelectionPage.style.width = '100%';
      window.glotag.glotagPage.appendChild(this.nftSelectionPage);

      //page title
      this.pageTitle = document.createElement('h1');
      this.nftSelectionPage.appendChild(this.pageTitle);
      this.pageTitle.style.display = 'flex';
      this.pageTitle.textContent = 'NFT SELECTION';
      this.pageTitle.style.color = 'white';
      this.pageTitle.style.position = 'absolute';
      this.pageTitle.style.top = '7.5%';
      this.pageTitle.style.left = '70%';
      this.pageTitle.style.transform = 'translate(-50%, -50%)';
      this.pageTitle.style.fontSize = '3rem';
      this.pageTitle.style.textShadow = "0.15rem 0.15rem 0 #000, 0.15rem 0.15rem 0 #000, 0.15rem 0.15rem 0 #000, 0.15rem 0.15rem 0 #000";
      this.pageTitle.style.whiteSpace = 'nowrap';
    
    
    // Create the grid container
    this.gridContainer = document.createElement('div');
    this.gridContainer.id = 'gridContainer';
    this.gridContainer.style.display = 'grid';
    this.gridContainer.style.width = '90%';
    this.gridContainer.style.height = '70%';
    this.gridContainer.style.position = 'absolute';
    this.gridContainer.style.left = '50%';
    this.gridContainer.style.transform = 'translateX(-50%';
    this.gridContainer.style.top = '23%';
    this.gridContainer.style.gridTemplateColumns = 'repeat(3, 1fr)'; // 3 columns
    this.gridContainer.style.gridTemplateRows = 'repeat(2, 1fr)'; // 2 rows
    this.gridContainer.style.gap = '10px'; // Gap between grid items

    // Array of labels
    const labels = ['pfp', 'glotag', 'arcade', 'luncman', 'victory'];

    // Create the grid items
    labels.forEach((label, index) => {
      // Create the container
      const container = document.createElement('div');
      container.id = `${label}-selection-container`;
      container.style.border = '1px solid white';
      container.style.width = '80%'; // Make it square
      container.style.height = '80%'; // Make it square
      container.style.cursor = 'pointer';
      container.style.display = 'flex';
      container.style.justifyContent = 'center';
      container.style.alignItems = 'center';

      this.gridContainer.appendChild(container);


      // Check if there is an active NFT for this label
      let activeNft;
      if (label === 'pfp') {
        if (window.client.gloInfo.activePfp) activeNft = window.client.gloInfo.activePfp;
      } else if (label === 'glotag') {
        if (window.client.gloInfo.activeGlotag) activeNft = window.client.gloInfo.activeGlotag;
      } else if (label === 'arcade') {
        if (window.client.gloInfo.activeArcade) activeNft = window.client.gloInfo.activeArcade;
      } else if (label === 'luncman') {
        if (window.client.gloInfo.activeLuncman) activeNft = window.client.gloInfo.activeLuncman;
      } else if (label === 'victory') {
        if (window.client.gloInfo.activeVictory) activeNft = window.client.gloInfo.activeVictory;
      }
      console.log('activenft is:', activeNft);

      if (activeNft) {
        const imgContainer = document.createElement('div');
        imgContainer.style.display = 'flex';
        imgContainer.style.flexDirection = 'column';
        imgContainer.style.justifyContent = 'center';
        imgContainer.style.alignItems = 'center';
        container.appendChild(imgContainer);

        // Create the image
        const img = document.createElement('img');
        img.src = '/style/graphics/token_images' + activeNft.metadata.previewImg + '.webp';
        console.log('img.src:', img.src);  
        img.style.width = '44%';
        img.style.height = '80%';
        imgContainer.appendChild(img);

        // Create the label
        const nftLabel = document.createElement('label');
        nftLabel.textContent = activeNft.metadata.name;
        nftLabel.style.fontSize = '1em';
        nftLabel.style.color = 'white';
        imgContainer.appendChild(nftLabel);
      } else {
        const imgContainer = document.createElement('div');
        imgContainer.style.display = 'flex';
        imgContainer.style.flexDirection = 'column';
        imgContainer.style.justifyContent = 'center';
        imgContainer.style.alignItems = 'center';
        container.appendChild(imgContainer);

        let imageDefault;

        switch(label) {
          case 'pfp':
            imageDefault = 'pfp';
            break;
          case 'glotag':
            imageDefault = 'default_glotag';
            break;
          case 'arcade':
          imageDefault = '';
            break;
          case 'luncman':
            imageDefault = 'Luncman' ;
            break;
          case 'victory':
            imageDefault = 'winning_screen';
            break;
          default:
            break;
        }

        // Create the image
        const img = document.createElement('img');
        img.src = '/style/graphics/' + imageDefault + '.webp';
        console.log('img.src:', img.src);  
        img.style.width = '44%';
        img.style.height = '80%';
        imgContainer.appendChild(img);

        // Create the label
        const nftLabel = document.createElement('label');
        nftLabel.textContent = 'default';
        nftLabel.style.fontSize = '1em';
        nftLabel.style.color = 'white';
        imgContainer.appendChild(nftLabel);
      }

      // Create the label
      const labelElement = document.createElement('label');
      labelElement.textContent = label;
      labelElement.style.fontSize = '1.5em';
      labelElement.style.color = 'white';
      labelElement.style.position = 'absolute';
      labelElement.className = `nft-select-label${index + 1}`;
      this.gridContainer.appendChild(labelElement);

      // Add a mouseover event listener to the container
      container.addEventListener('mouseover', () => {
        container.style.border = '1px solid #FFFF00'; // Change the border color to yellow
        container.style.boxShadow = '0 0 10px #FFFF00'; // Add a glow effect
      });

      // Add a mouseout event listener to the container
      container.addEventListener('mouseout', () => {
        container.style.border = '1px solid white'; // Change the border color back to white
        container.style.boxShadow = 'none'; // Remove the glow effect
      });

      // Add a click event listener to the container
      container.addEventListener('click', () => {
        // Hide the grid container
        this.gridContainer.style.display = 'none';

        switch(label){
          case 'pfp':
            let defaultPfp = 'pfp';
            this.populateNftSelection(label, defaultPfp);
            break;
          case 'glotag':
            let defaultGlotag = 'default_glotag';
            this.populateNftSelection(label, defaultGlotag);
            break;
          case 'arcade':
            let defaultArcade = 'arcade';
            this.populateNftSelection(label, defaultArcade);
            break;
          case 'luncman':
            let defaultLuncman = 'Luncman';
            this.populateNftSelection(label, defaultLuncman);
            break;
          case 'victory':
            let defaultVictory = 'winning_screen';
            this.populateNftSelection(label, defaultVictory);
            break;
          default:
            break;
        }
      });
    });

    // Append the grid container to the page
    this.nftSelectionPage.appendChild(this.gridContainer);
  }

 populateNftSelection(label, defaultImage) {
  window.glotag.gloPage = 'nftLibrary';
  console.log('label:', label);
  this.selectionContainerLabel = label;
  // Create the selection container
  this.gridSelectContainer = document.getElementById('grid-select-container');
  if(this.gridSelectContainer){
    this.gridSelectContainer.style.display = 'grid';
    return;
  }
  this.gridSelectContainer = document.createElement('div');
  this.gridSelectContainer.style.display = 'grid';
  this.gridSelectContainer.id = 'grid-select-container';
  this.gridSelectContainer.style.width = '90%';
  this.gridSelectContainer.style.height = '70%';
  this.gridSelectContainer.style.position = 'absolute';
  this.gridSelectContainer.style.left = '50%';
  this.gridSelectContainer.style.transform = 'translateX(-50%)';
  this.gridSelectContainer.style.top = '23%';
  this.gridSelectContainer.style.gridTemplateColumns = 'repeat(3, 1fr)'; // 3 columns
  this.gridSelectContainer.style.gridTemplateRows = 'repeat(3, 1fr)'; // 3 rows
  this.gridSelectContainer.style.gap = '10px'; // Gap between grid items
  this.nftSelectionPage.appendChild(this.gridSelectContainer);

  let seenNames = new Set();
  console.log('clientNfts:', window.client.clientNfts);
  window.client.clientNfts
    .filter(nftData => nftData.tokenId.includes(label))
    .filter(nftData => {
      if (seenNames.has(nftData.metadata.name)) {
        return false;
      } else {
        seenNames.add(nftData.metadata.name);
        return true;
      }
    })
    .forEach((nftData) => {
    console.log('nftData:', nftData);
    // Create the container
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'center';
    container.style.justifyContent = 'center';
    container.style.cursor = 'pointer';
    container.style.transition = 'transform 0.3s ease';
    container.style.transform = 'scale(1)';

    // Create the image
    const img = document.createElement('img');
    img.src = '/style/graphics/token_images/' + nftData.metadata.previewImg + '.webp';
    img.style.width = '44%';
    img.style.height = '80%';
    container.appendChild(img);

    // Create the label
    const label = document.createElement('label');
    label.textContent = nftData.metadata.name;
    label.style.fontSize = '1em';
    label.style.color = 'white';
    container.appendChild(label);

    // Add a mouseover event listener to the container
    container.addEventListener('mouseover', () => {
      container.style.transform = 'scale(1.1)'; // Grow the container slightly
    });

    // Add a mouseout event listener to the container
    container.addEventListener('mouseout', () => {
      container.style.transform = 'scale(1)'; // Shrink the container back to its original size
    });

    // Add the event listener
    container.addEventListener('click', () => {
      console.log(label);
      console.log('updating active nft to', nftData.tokenId, 'from', nftData)

      // Update the activeNfts
      fetch('/updateActiveNftCategory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletID: window.glotag.walletID,
          label: this.selectionContainerLabel,
          baseTokenId: nftData.tokenId
        }),
      })
      .then(response => response.json())
      .then(data => {
        console.log('Updated activeNfts successfully:', data);
        window.client.gloInfo.activeNfts = data.activeNfts;
        window.client.updateUserActiveNfts();
        window.glotag.gloPage = 'nftSelection';
        let gsapStateElement = Flip.getState('#gloTagElement');
        window.glotag.handleGloPage();  
        Flip.from(gsapStateElement, {
          duration: 0.33,
          ease: "power1.inOut",
          absolute: true
        });
        let labelContainer =  document.getElementById(`${this.selectionContainerLabel}-selection-container`);
        labelContainer.innerHTML = '';
        labelContainer.appendChild(container);
        container.style.pointerEvents = 'none';
        if (this.selectionContainerLabel === 'arcade') location.reload();
      })
      .catch(error => {
        console.error('Error updating activeNfts:', error);
      });
    });

    // Append the container to the grid
    this.gridSelectContainer.appendChild(container);
  });

  // Create additional containers
  const additionalContainers = [
    { img: defaultImage, label: 'default' },
    { img: 'buy_more', label: 'buy more' },
  ];

  additionalContainers.forEach(({ img, label }) => {
    // Create the container
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'center';
    container.style.justifyContent = 'center';
    container.style.cursor = 'pointer';
    container.style.transition = 'transform 0.3s ease';
    container.style.transform = 'scale(1)';

    // Add a mouseover event listener to the container
    container.addEventListener('mouseover', () => {
      container.style.transform = 'scale(1.1)'; // Grow the container slightly
    });

    // Add a mouseout event listener to the container
    container.addEventListener('mouseout', () => {
      container.style.transform = 'scale(1)'; // Shrink the container back to its original size
    });
    

    // Create the image
    const imgElement = document.createElement('img');
    imgElement.src = '/style/graphics/' + img + '.webp';
    imgElement.style.width = '44%';
    imgElement.style.height = '80%';
    container.appendChild(imgElement);

    // Create the label
    const labelElement = document.createElement('label');
    labelElement.textContent = label;
    labelElement.style.fontSize = '1em';
    labelElement.style.color = 'white';
    container.appendChild(labelElement);

    // Append the container to the grid
    this.gridSelectContainer.appendChild(container);

    if (label === 'default') {
        container.addEventListener('click', () => {
          console.log('setting', this.selectionContainerLabel, 'to default');
          
          // Extract the base token ID
          let tokenId = '';
          if (this.selectionContainerLabel === 'arcade' && localStorage.getItem('activeArcade')) {
            localStorage.removeItem('activeArcade');
            location.reload();
          }
          
          // Update the activeNfts
          fetch('/updateActiveNftCategory', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              walletID: window.glotag.walletID,
              label: this.selectionContainerLabel,
              baseTokenId: tokenId
            }),
          })
          .then(response => response.json())
          .then(data => {
            console.log('Updated activeNfts successfully:', data);
            window.client.gloInfo.activeNfts = data.activeNfts;
            window.client.updateUserActiveNfts();
            window.glotag.gloPage = 'nftSelection';
            let gsapStateElement = Flip.getState('#gloTagElement');
            window.glotag.handleGloPage();
            Flip.from(gsapStateElement, {
              duration: 0.33,
              ease: "power1.inOut",
              absolute: true
            });
            let labelContainer =  document.getElementById(`${this.selectionContainerLabel}-selection-container`);
            labelContainer.innerHTML = '';
            labelContainer.appendChild(container);
            container.style.pointerEvents = 'none';
          })
          .catch(error => {
            console.error('Error updating activeNfts:', error);
          });
        });
      } else {
        container.addEventListener('click', () => {
          // this.hideInspectNftContainer();
          
          window.glotag.glotagMode = 'calling_card';
          window.glotag.handleGlotagMode();
    
          window.windowState = 'marketplace';
          window.dispatchEvent(new CustomEvent('WindowStateChanged'));
    
          setTimeout(() => {
            window.windowState = 'marketplace';
            window.dispatchEvent(new CustomEvent('WindowStateChanged'));
            window.nftMachine.gloMartInstance.handleNavItemClick('marketpool');
            window.nftMachine.gloMartInstance.market = new Market();
            window.nftMachine.gloMartInstance.activePage = 'MarketPool';
            
            let poolItem;
            console.log(defaultImage);
            switch(defaultImage){
              case 'pfp':
                poolItem = { caption: 'pfps', type: 'pfp' };
                break;
              case 'default_glotag':
                poolItem = { caption: 'glotags', type: 'glotag' };
                break;
              case 'arcade':
                poolItem = { caption: 'arcades', type: 'arcade' };
                break;
              case 'Luncman':
                poolItem = { caption: 'luncmen', type: 'luncman' };
                break;
              case 'winning_screen':
                poolItem = { caption: 'victories', type: 'victory' };
                break;
              default:
                break;
            }
            
            console.log('trying to open listing stalll of:', poolItem);
            window.nftMachine.gloMartInstance.market.lookbookAll = false;

            if (!window.nftMachine.gloMartInstance.lookbook) {
              this.awaitLookbook(poolItem);
            } else {
              window.nftMachine.gloMartInstance.market.createListingStall(poolItem);
              document.getElementById('marketStandsContainer').remove();
              console.log('creating listing stall for', poolItem.type)
            }
          }, 100);
        });
      }
    });
  }

  awaitLookbook(poolItem) {
    console.log('awaiting lookbook')
    if (!window.nftMachine.gloMartInstance.lookbook) {
      setTimeout(() => {
        this.awaitLookbook(poolItem);
      }, 10);
      return;
    }
    console.log('creating listing stall for', poolItem.type)
    window.nftMachine.gloMartInstance.market.createListingStall(poolItem);
    document.getElementById('marketStandsContainer').remove();
  }

  hideNftSelectionPage() {
    this.nftSelectionPage.style.display = 'none';
  }
}