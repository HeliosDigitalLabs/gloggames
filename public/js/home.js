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
      
      // Add preload-finished event listener
      document.addEventListener('preload-finished', this.handlePreloadFinished.bind(this));
  }

  handlePreloadFinished() {
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
  }

  checkWebpSupport() {
      return document.createElement('canvas').toDataURL('image/webp').indexOf('data:image/webp') == 0;
  }

  setVideoSource(video, path) {
    return new Promise(async (resolve, reject) => {
      if(!video) {
        console.error("Video object is undefined or null");
        reject("Video object is undefined or null");
        return;
      }
  
      let webpPath = `${path}.webp`;
      let mp4Path = `${path}.mp4`;
  
      // Check if WebP is supported and the file exists
      if(this.supportsWebp && await this.checkFileExists(webpPath)) {
        console.log('Setting WebP source:', webpPath);
        video.src = webpPath;
      } else {
        console.log('Setting MP4 source:', mp4Path);
        video.src = mp4Path;
      }

      video.onloadedmetadata = () => {
        resolve();
        video.onloadedmetadata = null;
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

  loadVideos(specificPath) {
    // Initialize preload state object
    this.preloadStates = {};

    this.jsonData.videos.forEach((videoData, index) => {
      if (!videoData || typeof videoData.path !== 'string') {
        console.error('Invalid video data');
        return;
      }
  
      // Initialize the preload state for each video
      this.preloadStates[videoData.path] = 'not_loaded';
      
      if (videoData.preload) {
        // Start preloading immediately for the first video
        this.preloadVideo(index, videoData.path);
      }
    });
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
        console.log(`Video at path ${path} preloaded.`);
        this.preloadVideos[path] = 'loaded';
        this.preloadedCount++;
        
        document.body.removeChild(videoElement); // Clean up

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

  toggleHideVideo() {
    const canvas = document.getElementById("canvas");
    const contentContainer = document.getElementById('content-container');
    const retroCover = document.getElementById('retro-cover');
    const luncmanText = document.getElementById('luncman-text');
    const video = this.videos;
    const currentVideo = video[this.currentVideoIndex];
  
    if (canvas.style.visibility === 'hidden') {
      video.forEach((video, index) => {
        video.style.display = 'block';
      });
      canvas.style.visibility = 'visible'; // Show the canvas
      luncmanText.style.visibility = 'visible'; // Show the luncman text
      this.renderElements(currentVideo);
      window.addEventListener('resize', window.resizeContainers);
    } else {
      video.forEach((video, index) => {
        video.style.display = 'none';
      });
      canvas.style.visibility = 'hidden'; // Hide the canvas
      luncmanText.style.visibility = 'hidden'; // Hide the luncman text
      contentContainer.style.width = '100vw';
      contentContainer.style.height = '100vh';
      contentContainer.style.left = '0';
      contentContainer.style.top = '0';
      retroCover.style.height = '100vh';
      retroCover.style.width = '100vw';
      retroCover.style.left = '0';
      retroCover.style.top = '0';
      window.removeEventListener('resize', window.resizeContainers);
      window.luncMachine.gameCoordinator.setCutscene(window.luncMachine.gameCoordinator.levelData);
    }
  }

  renderElements(video) {
    this.video = video;

    this.contentContainer = document.getElementById('content-container');
    this.retroCover = document.getElementById('retro-cover');

    this.videoWidth = 4550;
    this.videoHeight = 1080;
    this.screenWidth = 1192;
    this.screenHeight = 900;

    // Resize containers when window is resized
    window.addEventListener('resize', this.resizeContainers.bind(this));

    // Resize containers when video is loaded
    this.resizeContainers();

    window.resizeContainers = this.resizeContainers.bind(this);
}

renderElementSizeAndPosition(element, width, height, top, left) {
    element.style.width = width + 'px';
    element.style.height = height + 'px';
    element.style.top = top + 'px';
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
        this.renderElementSizeAndPosition(this.retroCover, containerWidth, containerHeight, containerTop, containerLeft);
    } else {
        const containerTop = 38 - ((maxHeight / 2) - (viewHeight / 2));
        const containerLeft = (viewWidth / 2) - (parseFloat(this.contentContainer.style.width) / 2);

        this.renderElementSizeAndPosition(this.contentContainer, containerWidthCandidate, containerHeightCandidate, containerTop, containerLeft);
        this.renderElementSizeAndPosition(this.retroCover, containerWidthCandidate, containerHeightCandidate, containerTop, containerLeft);
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
  }

  async transitionTo(videoName, callback) {
    console.log('Transitioning to:', videoName);
    let videoData = this.jsonData.videos.find(video => video.path.split('/').pop() === videoName);
  
    if (!videoData) {
      console.error('Invalid video name');
      return;
    }
  
    // Check if the video is marked as 'loaded' in the preloadVideos object
    if (this.preloadVideos[videoData.path] !== 'loaded') {
      console.error(`Video ${videoName} not preloaded yet.`);
      return; // Exit the function if the video is not preloaded
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

    // Check whether to call setElements on this video
    if (videoData.setElements) {
      this.renderElements(nextVideo);
      this.setElements(nextVideo);
    } else {
      nextVideo.setElements = false;
    }
  
    // Wait for nextVideo to start playing before hiding currentVideo
    nextVideo.oncanplaythrough = () => {
      nextVideo.style.visibility = 'visible';
      nextVideo.play();
  
      nextVideo.onplaying = () => {
        currentVideo.style.visibility = 'hidden';
        nextVideo.onplaying = null; // remove the listener, it's not needed anymore
      };
  
      nextVideo.oncanplaythrough = null; // remove the listener, it's not needed anymore
    };
  
    console.log('Transitioning to:', videoData.path, 'for', nextVideo);
  
    // If the video is not looping, set up an event listener to transition to the next video when it ends
    if (!videoData.loop) {
      nextVideo.endedListener = () => {
        if (videoData.transitions && videoData.transitions.length > 0) {
          if(videoData.transitions[0] === "none") {
            console.log('Transitioning to full screen')
            this.toggleHideVideo(); // If transition is "none", hide the video and go fullscreen
          } else {
            console.log('Transitioning to next video:', videoData.transitions[0]);
            this.transitionTo(videoData.transitions[0]);  // transition to the first video in the transitions array
          }
          if (callback) callback();
        }
      }
      nextVideo.addEventListener('ended', nextVideo.endedListener);
    }
  
    // Update the videoElementIndex to the next one
    this.videoElementIndex = nextElementIndex;
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
    this.isChatVisible = true;
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
    });
  }

  preloadReactionImages() {
    // Preload reaction images
    this.thumbsUpImageSrc = './style/graphics/thumbs_up.png';
    this.thumbsDownImageSrc = './style/graphics/thumbs_down.png';
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
      data.forEach(message => this.newMessage(message));
    });

    window.client.socket.on('message_reacted', (data) => {
      this.updateMessageReaction(data.id, data.reactions);
    });

    this.loadChatHistory();
  }

  // Call this method at the end of your `createChat` method
  makeChatDraggable() {
    // gsap.registerPlugin(Draggable);

    // Draggable.create(this.chatElement, {
    //   type: "x,y",
    //   bounds: "body",
    //   zIndexBoost: false,
    //   onDrag: function() {
    //     console.log("Dragging the chat window!");
    //   }
    // });
  }

  // Implement a method to make the chat window resizable.
  // This is a simple example and might need a more robust solution based on your needs.
  makeChatResizable() {
    // Create a resize handle
    let resizeHandle = document.createElement('div');
    resizeHandle.style.width = '10px';
    resizeHandle.style.height = '10px';
    resizeHandle.style.background = 'grey';
    resizeHandle.style.position = 'absolute';
    resizeHandle.style.right = '0';
    resizeHandle.style.bottom = '0';
    resizeHandle.style.cursor = 'nwse-resize';
    this.chatElement.appendChild(resizeHandle);

    // Make the handle draggable
    Draggable.create(resizeHandle, {
      type: 'x,y',
      bounds: this.chatElement,
      onDrag: function(e) {
        let newWidth = this.x + this.target.parentElement.offsetWidth;
        let newHeight = this.y + this.target.parentElement.offsetHeight;

        // Set the new width and height, but you could add limits here
        gsap.set(this.target.parentElement, {
          width: newWidth,
          height: newHeight
        });
      },
      onPress: function(e) {
        // Stop propagation to prevent the chat window from being dragged when resizing
        e.stopPropagation();
      }
    });
  }

  createChat() {
    // Create the chat div
    this.chatElement = document.createElement('div');
    this.chatElement.setAttribute('id', 'chat');
    this.chatElement.style.width = '19vw';
    this.chatElement.style.backgroundColor = 'black'; // semi-transparent gray background
    this.chatElement.style.borderRadius = '1.25rem';
    this.chatElement.style.padding = '10px';
    this.chatElement.style.boxSizing = 'border-box';
    this.chatElement.style.display = 'flex';
    this.chatElement.style.flexDirection = 'column';
    this.chatElement.style.position = 'absolute';
    this.chatElement.style.top = '11.5vh';
    this.chatElement.style.right = '1vw';
    this.chatElement.style.zIndex = '2';
    this.chatElement.style.opacity = '75%';
    // Make the chat window draggable and resizable
    this.makeChatDraggable();
    this.makeChatResizable();

    // Create the messages div
    this.messagesElement = document.createElement('div');
    this.messagesElement.setAttribute('id', 'messages');
    this.messagesElement.style.overflowY = 'scroll';
    this.messagesElement.style.flexGrow = '1';
    this.messagesElement.style.padding = '10px'; 
    this.messagesElement.style.borderBottom = '1px solid #ccc';
  
    // Create the input element
    this.messageInputElement = document.createElement('input');
    this.messageInputElement.setAttribute('id', 'messageInput');
    this.messageInputElement.setAttribute('type', 'text');
    this.messageInputElement.style.width = 'calc(100% - 60px)';
    this.messageInputElement.style.padding = '5px';
    this.messageInputElement.style.borderRadius = '5px';
    this.messageInputElement.style.border = '1px solid #ccc';
  
    // Create the button element
    this.buttonElement = document.createElement('button');
    this.buttonElement.textContent = 'Send';
    this.buttonElement.style.marginLeft = '10px';
  
    // Create a container for input and button
    this.inputContainer = document.createElement('div');
    this.inputContainer.appendChild(this.messageInputElement);
    this.inputContainer.appendChild(this.buttonElement);
    if (window.client.socketConnected) {
      this.inputContainer.style.display = 'flex';
    } else {
      this.inputContainer.style.display = 'none';
    }
  
    // Append the elements to the chat div
    this.chatElement.appendChild(this.messagesElement);
    this.chatElement.appendChild(this.inputContainer);
  
    // Append the chat div to the body
    document.body.appendChild(this.chatElement);

    // Style the toggle button to look like a black circle with three white dots
    this.toggleButton = document.createElement('div'); // Change to 'div' to allow child elements
    this.toggleButton.style.position = 'absolute';
    this.toggleButton.style.top = '3.25vh';
    this.toggleButton.style.right = '21.5vw';
    this.toggleButton.style.width = '50px'; // Example size, adjust as needed
    this.toggleButton.style.height = '50px';
    this.toggleButton.style.backgroundImage = 'url(./style/graphics/chat.png)';
    this.toggleButton.style.backgroundSize = '100%';
    this.toggleButton.style.display = 'flex';
    this.toggleButton.style.alignItems = 'center';
    this.toggleButton.style.justifyContent = 'center';
    this.toggleButton.style.cursor = 'pointer';

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
  
    if (this.isChatVisible) {
      // Shrink and partially hide the chat
      gsap.to(this.chatElement, {
        duration: 0.5,
        height: '75px', // Adjust this height so it fits the input bar and send button
        ease: "power1.inOut",
        onComplete: () => {
          gsap.to(this.chatElement, {
            duration: 0.5,
            top: '5vh', // Move up but not completely out of view
            ease: "power1.inOut",
            onComplete: () => {
              this.chatElement.style.display = 'none';
              this.isChatVisible = false;
            }
          });
        }
      });
    } else {
      // Show and expand the chat
      this.chatElement.style.display = 'flex';
      this.chatElement.style.height = '75px'; // Start as a slightly thicker line
  
      gsap.to(this.chatElement, {
        duration: 0.5,
        top: '11.5vh', // Move down to the visible position
        ease: "power1.inOut",
        onComplete: () => {
          gsap.to(this.chatElement, {
            duration: 0.5,
            height: '35vh', // Expand to a slightly larger height
            ease: "power1.inOut",
            onComplete: () => {
              this.isChatVisible = true;
            }
          });
        }
      });
    }
  }
  
  
  
  
  

  switchToChat() {
    this.messagesElement.innerHTML = ''; // Clear the base chat content
    this.attachSocketListeners();
    this.inputContainer.style.display = 'flex';
  }

  loadChatHistory() {
    window.client.socket.emit('load_chat_history');
  }

  newMessage(data) {
    console.log('newmessage data:',  data);
    if (!data || !data.pfp || !data.message) return;
    if (data.type === 'reply' && data.originalMessageId) {
      const originalMessage = this.messages.find(msg => msg.id === Number(data.originalMessageId));
      console.log('newmessage called, originalMessage:', originalMessage);
      if (originalMessage) {
        data.originalText = originalMessage.text;
        data.originalUsername = originalMessage.username;
        data.originalPfp = originalMessage.pfp;
      }
    }

    const message = new Message(data);
    this.messages.push(message);
    this.messagesElement.appendChild(message.render());
  }

  sendMessage() {
    const message = this.messageInputElement.value;
    const username = window.client.gloInfo.username;
    const pfp = window.client.gloInfo.pfp;
    const walletID = window.client.gloInfo.walletID;

    // initialize reactions
    const reactions = {
      "thumbs_up": { count: 0, users: [] },
      "thumbs_down": { count: 0, users: [] }
    };
    
    // Check if the message is a reply
    const isReply = this.messageInputElement.hasAttribute('data-reply-to-id');
    const originalMessageId = isReply ? this.messageInputElement.getAttribute('data-reply-to-id') : null;

    this.messageInputElement.placeholder = "Type your message...";
    this.messageInputElement.removeAttribute('data-reply-to-id');
    
    if (window.client.sessionCreated) {
        window.client.socket.emit('send_message', { walletID, username, pfp, message, type: isReply ? 'reply' : 'normal', originalMessageId, reactions });
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
    this.pfp = data.pfp;
    this.text = data.message;
    this.type = data.type || 'normal'; 
    this.originalText = data.originalText || null;
    this.originalPfp = data.originalPfp || null;
    this.originalUsername = data.originalUsername || null;
    this.reactions = data.reactions || {
      thumbs_up: { count: 0, users: [] },
      thumbs_down: { count: 0, users: [] }
    };
  }

  render() {
    this.messageElement = document.createElement('div');
    this.messageElement.classList.add('message');
    this.messageElement.setAttribute('data-id', this.id);
    this.messageElement.style.padding = '10px';
    this.messageElement.style.borderBottom = '1px solid #ccc';
    this.messageElement.style.background = 'white';
    this.messageElement.style.borderRadius = '15px';
    this.messageElement.style.marginBottom = '10px';
    this.messageElement.style.display = 'flex';
    this.messageElement.style.flexDirection = 'row';
    this.messageElement.style.alignItems = 'center';
    this.messageElement.style.position = 'relative';

    // Message content container
    const contentContainer = document.createElement('div');
    contentContainer.style.flexGrow = '1'; // Allow it to take remaining width

    // Profile picture
    const pfpElement = document.createElement('img');
    pfpElement.src = this.pfp;
    pfpElement.style.width = '40px';
    pfpElement.style.height = '40px';
    pfpElement.style.borderRadius = '50%'; // Circle shape
    pfpElement.style.marginRight = '10px';

    // Username
    const usernameElement = document.createElement('span');
    usernameElement.textContent = this.username;
    usernameElement.style.fontWeight = 'bold';
    contentContainer.appendChild(usernameElement);

    // Message text
    const textElement = document.createElement('span');
    textElement.textContent = this.text;
    textElement.style.fontStyle = 'italic';
    textElement.style.display = 'block';
    textElement.style.marginTop = '5px';
    contentContainer.appendChild(textElement);

    // Modify visuals if type is 'reply'
    if (this.type === 'reply' && this.originalText) {
      const originalMessageElement = document.createElement('div');
      originalMessageElement.style.padding = '5px';
      originalMessageElement.style.background = '#e6e6e6';
      originalMessageElement.style.borderRadius = '10px';
      originalMessageElement.style.marginBottom = '5px';
      originalMessageElement.style.fontSize = '0.8em';
    
      const originalPfpElement = document.createElement('img');
      originalPfpElement.src = this.originalPfp;
      originalPfpElement.style.width = '20px';
      originalPfpElement.style.height = '20px';
      originalPfpElement.style.borderRadius = '50%';
      originalPfpElement.style.marginRight = '5px';
      originalMessageElement.appendChild(originalPfpElement);

      const originalUsernameElement = document.createElement('span');
      originalUsernameElement.textContent = this.originalUsername + ": ";
      originalUsernameElement.style.fontWeight = 'bold';
      originalMessageElement.appendChild(originalUsernameElement);
      
      const originalTextElement = document.createElement('span');
      originalTextElement.textContent = this.originalText;
      originalTextElement.style.fontStyle = 'italic';
      originalMessageElement.appendChild(originalTextElement);
      
      contentContainer.insertBefore(originalMessageElement, usernameElement);
    }

    this.messageElement.appendChild(pfpElement);
    this.messageElement.appendChild(contentContainer);

    const currentUser = window.client.gloInfo.username;

    // Create a delete button and add it to the message element only if the user is the message author
    if (currentUser === this.username) {
      const deleteButton = document.createElement('button');
      deleteButton.textContent = 'Delete';
      deleteButton.classList.add('delete-button');
      deleteButton.style.display = 'none'; // Hide the button initially
      deleteButton.style.marginLeft = '10px';
      deleteButton.addEventListener('click', () => this.delete());

      this.messageElement.appendChild(deleteButton);

      // Add a hover event listener to toggle the visibility of the delete button
      this.messageElement.addEventListener('mouseenter', () => {
        deleteButton.style.display = 'inline';
      });
      this.messageElement.addEventListener('mouseleave', () => {
        deleteButton.style.display = 'none';
      });
    } else {
      const addButton = document.createElement('button');
      addButton.textContent = '+';
      addButton.classList.add('add-button');
      addButton.style.display = 'none'; // Hide the button initially
      addButton.style.marginLeft = '10px';
      addButton.addEventListener('click', () => this.requestFriend());

      this.messageElement.appendChild(addButton);

      // Add a hover event listener to toggle the visibility of the add button
      this.messageElement.addEventListener('mouseenter', () => {
        addButton.style.display = 'inline';
      });
      this.messageElement.addEventListener('mouseleave', () => {
        addButton.style.display = 'none';
      });

      // Create the reply button
      const replyButton = document.createElement('button');
      replyButton.textContent = '->';
      replyButton.classList.add('add-button'); // Assuming you want it to look the same
      replyButton.style.display = 'none'; // Hide the button initially
      replyButton.style.marginLeft = '10px';
      replyButton.addEventListener('click', () => this.reply());

      this.messageElement.appendChild(replyButton);

      // Add a hover event listener to toggle the visibility of the reply button
      this.messageElement.addEventListener('mouseenter', () => {
        replyButton.style.display = 'inline';
      });
      this.messageElement.addEventListener('mouseleave', () => {
        replyButton.style.display = 'none';
      });


      // Add a hover event listener to toggle the visibility of the add and reply buttons
      this.messageElement.addEventListener('mouseenter', () => {
        if (addButton) addButton.style.display = 'inline';
        if (replyButton) replyButton.style.display = 'inline';
        if (reactionButton) reactionButton.style.display = 'inline'; // for the reaction button
      });
      this.messageElement.addEventListener('mouseleave', () => {
        if (addButton) addButton.style.display = 'none';
        if (replyButton) replyButton.style.display = 'none';
        if (reactionButton) reactionButton.style.display = 'none'; // for the reaction button
      });

      // Create the '*' button for reaction functionality
      const reactionButton = document.createElement('button');
      reactionButton.textContent = '*';
      reactionButton.classList.add('reaction-button');
      reactionButton.style.display = 'none'; // Hide the button initially
      reactionButton.style.marginLeft = '10px';
      reactionButton.addEventListener('click', () => this.react(reactionButton));

      this.messageElement.appendChild(reactionButton);
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

    window.client.getSession();
  }

  reply() {
    // Set the reply-to data attributes on the message input field
    chat.messageInputElement.setAttribute('data-reply-to-id', this.id);
    chat.messageInputElement.setAttribute('data-reply-to-text', this.text);
    
    // Update the placeholder to indicate replying
    chat.messageInputElement.placeholder = `Replying to ${this.username}: ${this.text}`;
    chat.messageInputElement.focus();
  }

  react() {
    // Check if the reaction container already exists for this message
    let reactionContainer = this.messageElement.querySelector('.reaction-container');
    
    // If the container doesn't exist, create it and the reaction buttons
    if (!reactionContainer) {
      // Create a container for reaction buttons
      reactionContainer = document.createElement('div');
      reactionContainer.classList.add('reaction-container');
      reactionContainer.style.position = 'absolute';
      reactionContainer.style.zIndex = '10';
      reactionContainer.style.left = '0'; // Align to the left of the message element
      reactionContainer.style.display = 'flex';
      reactionContainer.style.justifyContent = 'center';
      reactionContainer.style.width = '100%'; // Take full width of the message element
  
      // Create the thumbs down button
      const thumbsDownButton = document.createElement('img');
      thumbsDownButton.src = window.chat.thumbsDownImageSrc; 
      thumbsDownButton.style.width = '40px';
      thumbsDownButton.style.height = '40px';
      thumbsDownButton.style.cursor = 'pointer';
      thumbsDownButton.addEventListener('click', () => {
        this.sendReaction('thumbs_down');
        reactionContainer.remove(); // Remove the container after selection
      });
  
      // Create the thumbs up button
      const thumbsUpButton = document.createElement('img');
      thumbsUpButton.src = window.chat.thumbsUpImageSrc;
      thumbsUpButton.style.width = '40px';
      thumbsUpButton.style.height = '40px';
      thumbsUpButton.style.cursor = 'pointer';
      thumbsUpButton.addEventListener('click', () => {
        this.sendReaction('thumbs_up');
        reactionContainer.remove(); // Remove the container after selection
      });
  
      // Append the buttons to the container
      reactionContainer.appendChild(thumbsDownButton);
      reactionContainer.appendChild(thumbsUpButton);
  
      // Append the container to the message element
      this.messageElement.appendChild(reactionContainer);
    } else {
      // Toggle the visibility of the existing reaction container
      reactionContainer.style.display = reactionContainer.style.display === 'none' ? 'flex' : 'none';
    }
  }
  
  sendReaction(reactionType) {
    // Emit a 'react_message' event to the server with the message ID and reaction type
    window.client.socket.emit('react_message', { id: this.id, reaction: reactionType, walletID: window.client.gloInfo.walletID });
  }

  updateReactionDisplay() {
    // Ensure the message element is created first
    console.log('updating reaction display', this.reactions);
    if (!this.messageElement) {
      this.render();
    }

    // Find or create the reaction display container element
    let reactionContainer = this.messageElement.querySelector('.reaction-display-container');
    if (!reactionContainer) {
      reactionContainer = document.createElement('div');
      reactionContainer.classList.add('reaction-display-container');
      reactionContainer.style.position = 'absolute';
      reactionContainer.style.bottom = '5px';
      reactionContainer.style.right = '5px';
      reactionContainer.style.display = 'flex';
      this.messageElement.appendChild(reactionContainer);
    } 
  
    // Clear existing reactions display
    reactionContainer.innerHTML = ''; 
 
    // Guard clause
    if (!this.reactions) return;
 
    // Display updated reactions
    Object.entries(this.reactions).forEach(([type, reactionData]) => {
      const count = reactionData.count;
      console.log("Processing reaction:", type, "with count:", count, "from", reactionData, "using", this.reactions);
      if (count > 0) { // Only display reactions with a count > 0
        const reactionElement = document.createElement('div');
        reactionElement.classList.add(`reaction-${type}`);
        reactionElement.style.marginRight = '5px';
        
        const reactionImage = document.createElement('img');
        reactionElement.appendChild(reactionImage);
        reactionImage.src = type === 'thumbs_up' ? window.chat.thumbsUpImageSrc : window.chat.thumbsDownImageSrc;
        reactionImage.style.width = '20px';
        reactionImage.style.height = '20px';
    
        const counter = document.createElement('span');
        reactionElement.appendChild(counter);
        counter.textContent = count;
        counter.style.marginLeft = '2px';
    
        reactionContainer.appendChild(reactionElement);
      }
    });
  }
}

class Glogo { 
  constructor() {
    this.createGlogo();
    this.handleGlogoText();
    window.addEventListener('WindowStateChanged', this.handleWindowStateChange.bind(this));
  }

  handleWindowStateChange() {
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
        switch (window.nftMachine.gloMartInstance.activePage) {
          case 'GloMart':
            newURL = '/glomart';
            break;
          case 'Browse':
            newURL = '/glomart/browse';
            break;
          case 'Listing':
            newURL = '/glomart/listing';
            break;
          case 'Sell':
            newURL = '/glomart/sell';
            break;  
          default:
            break;
        }
        break;
      case 'mint':
        newURL = '/glomint';
        break;      
      default:
        break;
    }

    // Update the URL using the HTML5 History API
    history.pushState({ windowState: windowState }, "", newURL);
  }

  createGlogo() {
    this.glogo = document.createElement('div');
    this.glogo.innerText = 'glo';
    this.glogo.style.color = "white";
    this.glogo.style.fontWeight = "bold";
    this.glogo.style.position = "absolute";
    this.glogo.style.top = "0vh";
    this.glogo.style.left = "1.5vw";
    this.glogo.style.fontSize = "4.5rem";  // Adjust the size if necessary
    this.glogo.style.zIndex = "1";  // Ensure it's on top of other elements
    this.glogo.style.fontFamily = "Gabarito, sans-serif"; // Set the font to Gabarito and fallback to sans-serif
    this.glogo.style.cursor = 'pointer';
    this.glogo.style.webkitTextFillColor = 'transparent';
    this.glogo.style.webkitTextStrokeWidth = '1px';
    this.glogo.style.webkitTextStrokeColor = 'white'; // Or use 'hsl(0, 0%, 100%)' for pure white
    this.glogo.style.textShadow = '0 0 1px hsla(0, 0%, 100%, 0.8), 0 0 2px hsla(0, 0%, 100%, 0.85), 0 0 5px hsla(0, 0%, 100%, 0.9), 0 0 5px hsla(0, 0%, 100%, 0.95), 0 0 1px hsla(0, 0%, 100%, 1)';
    this.glogo.addEventListener('click', this.handleGlogoClick.bind(this));
    document.body.appendChild(this.glogo);
  }

  handleGlogoText() {
    if (window.windowState == 'marketplace') {
      this.glogo.innerText = 'glomart';
    } else if (window.windowState == 'mint') {
      this.glogo.innerText = 'glomint';
    } else {
      this.glogo.innerText = 'glo';
    }
  }

  handleGlogoClick() {
    console.log('glogo click');
    if (window.windowState == 'home'){
      console.log('home click');
    }
    else if (window.windowState == 'luncman') {
      console.log('luncman click');
      window.windowState = 'home';

      // Dispatch a custom event to notify that windowState has changed
      const event = new Event('WindowStateChanged');
      
      // Dispatch the event on the window object
      window.dispatchEvent(event);
    } 
    else if (window.windowState == 'leaderboard') {
      console.log('leaderboard click');
      window.windowState = 'home';

      // Dispatch a custom event to notify that windowState has changed
      const event = new Event('WindowStateChanged');
      
      // Dispatch the event on the window object
      window.dispatchEvent(event);
    }   
    else if (window.windowState == 'nft') {
      console.log('nft click');
      window.windowState = 'home';

      // Dispatch a custom event to notify that windowState has changed
      const event = new Event('WindowStateChanged');
      
      // Dispatch the event on the window object
      window.dispatchEvent(event);
    }
    else if (window.windowState == 'marketplace') {
      if (window.nftMachine.gloMartInstance.activePage == 'GloMart') {
      console.log('marketplace click');
      window.windowState = 'nft';

      // Dispatch a custom event to notify that windowState has changed
      const event = new Event('WindowStateChanged');
      
      // Dispatch the event on the window object
      window.dispatchEvent(event);
      } else {
        window.nftMachine.gloMartInstance.handleGloMartClick();
      }
    }
    else if (window.windowState == 'mint') {
      console.log('mint click');
      window.windowState = 'nft';

      // Dispatch a custom event to notify that windowState has changed
      const event = new Event('WindowStateChanged');
      
      // Dispatch the event on the window object
      window.dispatchEvent(event);
    }

    this.updateURL();
  }
}



class Glotag {
  constructor(glotagMode) {
    this.init();

    this.glotagMode = glotagMode;
    this.handleGlotagMode();

    this.handleGloPage();
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

    this.initGameStats();
  }

  updateUI() {
    this.styleCallingCard();

    if (this.friendsList) {
      this.friendsList.showFriendRequestsSent();
      this.friendsList.showFriendRequestsRecieved();
    }
  }

  handleGlotagMode() {
    // init gsap state
    let gsapState;
  
    switch(this.glotagMode) {
    case 'calling_card':
      // Capture the state of the elements
      gsapState = Flip.getState("#gloTagElement");

      // Hide and setup for calling card mode
      this.hideGlotag();
      this.onCallingCardMode();
      this.styleCallingCard();
      this.hideOutsideDiv();

      // Perform the flip animation on the gloTagElement
      Flip.from(gsapState, {
        duration: 0.5,
        ease: "power1.inOut",
        absolute: true,
      });
      break;
      // Display glotag in profile mode
      case 'glotag':
        gsapState = Flip.getState("#gloTagElement");
        if (window.client.sessionCreated) window.client.getSession();
        this.hideGlotag();
        let reset = false;
        if (!this.glotagCreated) reset = true;
        if (this.playerCardCreated) reset = false;
        this.onGlotagMode(reset);
        Flip.from(gsapState, {
          duration: 0.5,
          ease: "power1.inOut",
          absolute: true
        });
        break;
      case 'player':
        gsapState = Flip.getState("#gloTagElement");
        this.hideGlotag();
        this.styleCallingCard();
        this.onPlayerMode();
        Flip.from(gsapState, {
          duration: 0.5,
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
          duration: 0.5,
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
  }

  handleGloPage() {
    if (!this.glotagMode == 'glotag' || !this.glotagMode == 'player') return;

    if (!this.gloPage) {
      console.error('No Glo Page Found')
    } else {
      this.createFriendList();
      this.createNftList();
      this.createLuncmanStats();
      this.createWalletsMenu();
      this.createSettingsMenu();
      this.createNftSelectionMenu();
      this.styleCallingCard();
    }
  }

  handleClickOutside() {
    // Check if clicked element is outside the glotagBackground
    console.log('click outside')
    if (!window.client.sessionCreated) return;
    // close glotag
    console.log('closing glotag')
    this.previousGloPage = this.gloPage;
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

    gsap.from("#glotagPage", {
      opacity: 0,
      duration: 0.5,
      ease: "power1.inOut",
      onComplete: () => {
        document.getElementById("glotagPage").style.opacity = '1'; // Set opacity to 1
        console.log('#glotagPage fade-in animation complete!');
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
    this.createPlayerCard();
    this.createGlotagPage();
    this.createOutsideDiv();
  }

  createGuestCard() {
    if (!this.glotagElement) {
      this.glotagElement = document.createElement('div');
      this.glotagElement.id = 'gloTagElement';
    }
    document.body.appendChild(this.glotagElement);
    this.glotagElement.style.backgroundColor = 'black';
    this.glotagElement.style.position = "absolute";
    this.glotagElement.style.borderRadius = '3rem';
    this.glotagElement.style.top = "1vh";
    this.glotagElement.style.left = '';
    this.glotagElement.style.right = "1vw";
    this.glotagElement.style.height = '9vh';
    this.glotagElement.style.width = '18.5vw';
    this.glotagElement.style.display = "flex";
    this.glotagElement.style.alignItems = "center";
    this.glotagElement.style.zIndex = "3";
    this.glotagElement.style.fontFamily = "Gabarito, sans-serif";
    this.glotagElement.style.fontWeight = "bold";
    this.glotagElement.style.cursor = 'pointer';
    this.glotagElement.style.boxShadow = '-0.025rem 0 0.025rem #FFFFFF, 0 0.025rem 0.025rem #FFFFFF, -0.25rem 0.25rem 0.25rem #FFFFFF, -0.1rem 0.1rem 0.1rem #FFFFFF, -0.35rem 0.35rem 0.35rem #FFFFFF, inset 0 0 0.1625rem #FFFFFF';

    
  
    // Create PFP flat black line
    if (!this.pfpElement) {
      this.pfpElement = document.createElement('div');
      this.glotagElement.id = 'gloTagElement';
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
    this.usernameElement.style.backgroundColor = 'black';  // Black line
    this.usernameElement.style.position = 'absolute';
    this.usernameElement.style.left = '50%';
    this.usernameElement.style.transform = 'translate(-50%, 0)';
    
    // Store the actual text in a data attribute to retrieve it on hover
    this.usernameElement.dataset.content = "retrieve glotag";
  

    // Show PFP and text on hover
    this.glotagElement.addEventListener('mouseover', () => {
      this.pfpElement.style.height = '5vh';
      this.pfpElement.style.borderRadius = '50%';
      this.pfpElement.style.backgroundColor = "grey";
      
      this.usernameElement.innerText = this.usernameElement.dataset.content;  // Show the actual text
      this.usernameElement.style.color = "white";
      this.usernameElement.style.fontSize = "2rem";
      this.usernameElement.style.height = 'auto';
      this.usernameElement.style.backgroundColor = 'transparent';  // Hide the black line
      this.usernameElement.style.width = '78%';
      this.usernameElement.style.fontFamily = 'Gabarito';
    });

    // Change back to flat black lines when not hovering
    this.glotagElement.addEventListener('mouseout', () => {
      this.pfpElement.style.height = '2px';
      this.pfpElement.style.borderRadius = '0';
      this.pfpElement.style.backgroundColor = "black";
      
      this.usernameElement.innerText = '';  // Hide the text
      this.usernameElement.style.height = '2px';
      this.usernameElement.style.backgroundColor = 'black';  // Show the black line
    });
    
    // Append child elements to GloTag
    this.glotagElement.appendChild(this.pfpElement);
    this.glotagElement.appendChild(this.usernameElement);

    //attach event listener
    this.glotagElement.addEventListener('click', this.handleGloTagClick.bind(this));
  }

  createPlayerCard() {
    // create player calling card
    let pfp;
    let username;
    let gloLvl;
    if (window.client.activePlayer && this.glotagPage == 'calling_card') {
      pfp = window.client.activePlayer.playerInfo.pfp;
      username = window.client.activePlayer.playerInfo.nickname;
      gloLvl = window.client.activePlayer.playerInfo.gloLvl;
    } else {
      pfp = window.client.gloInfo.pfp;
      username = window.client.gloInfo.username;
      gloLvl = window.client.gloInfo.gloLvl;
    }
    if (this.playerCardCreated) {
      this.glotagElement.style.display = 'flex';
      document.body.appendChild(this.glotagElement);
    } else {
        if (!this.glotagElement) {
          console.log('creating player calling card')
          this.glotagElement = document.createElement('div');
          this.glotagElement.id = 'gloTagElement';
          
          this.pfpElement = document.createElement('div');
          this.glotagElement.appendChild(this.pfpElement);
          this.pfpElement.id = 'pfpElement';

          this.usernameElement = document.createElement('div');
          this.glotagElement.appendChild(this.usernameElement);
          this.usernameElement.id = 'usernameElement';

          this.glotagElement.addEventListener('click', this.handleGloTagClick.bind(this));
        }
        document.body.appendChild(this.glotagElement);
        this.glotagElement.style.backgroundColor = "black";
        this.glotagElement.style.position = "absolute";
        this.glotagElement.style.borderRadius = '3rem';
        this.glotagElement.style.top = "1vh";
        this.glotagElement.style.left = '';
        this.glotagElement.style.right = "1vw";
        this.glotagElement.style.height = '9vh';
        this.glotagElement.style.width = '18.5vw';
        this.glotagElement.style.display = "flex";
        this.glotagElement.style.alignItems = "center";
        this.glotagElement.style.zIndex = "3";
        this.glotagElement.style.fontWeight = "bold";
        this.glotagElement.style.cursor = 'pointer';
        this.glotagElement.style.boxShadow = '-0.025rem 0 0.025rem #FFFFFF, 0 0.025rem 0.025rem #FFFFFF, -0.25rem 0.25rem 0.25rem #FFFFFF, -0.1rem 0.1rem 0.1rem #FFFFFF, -0.35rem 0.35rem 0.35rem #FFFFFF, inset 0 0 0.1625rem #FFFFFF';

    
        // Create PFP element
        this.pfpElement.style.height = '5vh';  // Circle
        this.pfpElement.style.width = '5vh';
        this.pfpElement.style.borderRadius = '50%';  // Circle

        if (!pfp == 'unknown') {
          this.pfpElement.style.backgroundImage = `url('${pfp}')`;
          this.pfpElement.style.backgroundSize = 'cover'; 
          this.pfpElement.style.backgroundPosition = 'center';
        } else {
          this.pfpElement.style.backgroundColor = 'black';
        }
        this.pfpElement.style.marginLeft = '0.5vh';

        // Create username element
        this.usernameElement.innerText = username;
        this.usernameElement.style.marginLeft = '1vh';
        this.usernameElement.style.fontSize = '3rem';
        this.usernameElement.style.fontFamily = "gabarito";
        this.usernameElement.style.color = 'white';

        // create level display
        if (!this.levelDisplay) {
          this.levelDisplay = document.createElement('div');
          this.levelDisplay.id = 'levelDisplay';
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
        this.levelDisplay.style.display = 'flex';
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
      this.outsideDiv.style.zIndex = '4';
      this.outsideDiv.style.pointerEvents = 'all';
      this.outsideDiv.style.backdropFilter = 'blur(10px)';
      this.outsideDiv.addEventListener('click', this.handleClickOutside.bind(this));
    }
  }

  hideOutsideDiv() {
    if (this.outsideDiv) this.outsideDiv.style.display = 'none';
  }

  handleGloTagClick() {
    let gsapState = Flip.getState('#gloTagElement');
    console.log("glotag clicked");
    
    switch (this.glotagMode) {
      case 'glotag':
        switch (this.gloPage) {
          case 'home':
            this.gloPage = 'nftSelection';
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
              this.gloPage = 'home';
            }
            this.handleGloPage();
            Flip.from(gsapState, {
              duration: 0.5,
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
          this.glotagMode = 'player';
        } else {
          this.glotagMode = 'glotag';
        }
        this.handleGlotagMode();
        break;
      case 'player':
        switch (this.gloPage) {
          case 'home':
            console.log('glotag clicked in glotag mode on home')
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
            }
            this.handleGloPage();
            Flip.from(gsapState, {
              duration: 0.5,
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
      this.loginPortal.style = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: #ffffff;
        border: 1px solid #ccc;
        padding: 20px;
        z-index: 1000;
        display: flex;
        flex-direction: column;
        gap: 10px;
        align-items: center;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        width: 300px;
        height: 75px;
      `;
  
      // Wallet login button (React component)
      const walletLoginBtn = document.getElementById('root');
      walletLoginBtn.style.marginTop = '50px';

      // Guest login button
      const guestLoginBtn = document.createElement('button');
      guestLoginBtn.innerText = 'Guest Login';
      guestLoginBtn.style = `
        width: 100%; /* Match the width of walletLoginBtn */
        padding: 10px; /* Or whatever padding matches the walletLoginBtn */
        margin: 0; /* Remove default margin */
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 16px; /* Or the font size that matches walletLoginBtn */
        background-color: #f0f0f0; /* Or the background that matches walletLoginBtn */
        color: #333; /* Or the color that matches walletLoginBtn */
      `;
      guestLoginBtn.addEventListener('click', () => {
        const username = prompt('Please enter a username:');
        if (username) {
          window.client.gloInfo.username = username;
          window.client.gloInfo.walletID = username;
          window.client.gloInfo.gloLvl = 1;
          window.client.sendWalletConnectRequest(this.createSession());
        }
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
      z-index: 5; // Ensure it's below the login portal but above other content
      display: none; // Initially hidden`;
      document.body.appendChild(this.backdrop);
      this.backdrop.style.zIndex = '5';
      this.backdrop.addEventListener('click', () => {
        this.loginPortal.style.display = 'none';
        this.backdrop.style.display = 'none';
      });
  
      // Append buttons to the portal
      this.loginPortal.appendChild(walletLoginBtn);
      this.loginPortal.appendChild(guestLoginBtn);
  
      // Append the portal to the body
      document.body.appendChild(this.loginPortal);
    }
  }

  createSession() {
    this.glotagMode = 'glotag';
    console.log('creating glotag session')
    this.handleGlotagMode();
  }
  
  createGlotagPage() {
    if (window.client.activePlayer) {
      this.glotagPage.style.display = 'flex';
    } else {
      if (!this.glotagPage) {
       this.glotagPage = document.createElement('div'); 
       this.glotagPage.id = 'glotagPage';
       document.body.appendChild(this.glotagPage);
      }
      this.glotagPage.style.backgroundColor = "rgba(0, 0, 0, 0.75)";
      this.glotagPage.style.borderStyle = 'solid'; // Sets the border style to solid
      this.glotagPage.style.borderWidth = '8px'; // Sets the border width to 1px
      this.glotagPage.style.borderColor = 'white'; // Sets the border color to white
      this.glotagPage.style.height = '85%';
      this.glotagPage.style.width = '85%';
      this.glotagPage.style.position = 'absolute';
      this.glotagPage.style.zIndex = '6';
      this.glotagPage.style.top = '50%';
      this.glotagPage.style.left = '50%';
      this.glotagPage.style.transform = 'translate(-50%,  -50%)';
      this.glotagPage.style.borderTopLeftRadius = '2% 3%';
      this.glotagPage.style.borderTopRightRadius = '2% 3%';
      this.glotagPage.style.borderBottomLeftRadius = '2% 3%';
      this.glotagPage.style.borderBottomRightRadius = '2% 3%';
      this.glotagPage.style.border = '5px solid white';
      this.glotagPage.style.boxShadow = 'white 0px 0px 5px, white 0px 0px 10px, white 0px 0px 15px, white 0px 0px 20px';
    }
    this.glotagPage.style.display = 'flex';

    if (this.previousGloPage) {
      this.gloPage = this.previousGloPage;
    } else {
      if (this.gloPage == 'player') {
        console.log('player page')
      } else {
        this.gloPage = 'home';
      }
    }
    this.handleGloPage();
    this.glotagCreated = true;
  }

  hideGlotag() {
    switch (this.glotagMode) {
      case 'glotag':
        if (this.glotagPage) this.glotagPage.style.display = 'none';
        if (this.loginPortal) this.loginPortal.style.display = 'none';
        if (this.backdrop) this.backdrop.style.display = 'none';
        if (this.backButton) this.backButton.style.display = 'none';
        break;
      case 'guest':
        if (this.glotagElement) this.glotagElement.style.display = 'none';
        if (this.glotagPage) this.glotagPage.style.display = 'none';
        if (this.backdrop) this.backdrop.style.display = 'none';

        if (this.backButton) this.backButton.style.display = 'none';
        break;
      case 'calling_card':
        if (this.glotagPage) this.glotagPage.style.display = 'none';
        if (this.loginPortal) this.loginPortal.style.display = 'none';
        if (this.backdrop) this.backdrop.style.display = 'none';
        if (this.backButton) this.backButton.style.display = 'none';
        break;
      case 'player':
        if (this.glotagElement) this.glotagElement.style.display = 'none';
        break;
      default:
        if (this.glotagElement) this.glotagElement.style.display = 'none';
        if (this.loginPortal) this.loginPortal.style.display = 'none';
        if (this.backdrop) this.backdrop.style.display = 'none';
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
    if (!this.glotagElement) return;
    this.glotagElement.style.height = '10%';
    this.glotagElement.style.width = '35%';
    this.glotagElement.style.left = '5%';
    this.glotagElement.style.top = '5%';

    this.usernameElement.style.fontSize = '3rem';
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

  setPlayerStats() {
    this.username = window.client.gloInfo.username;
    this.glolvl = window.client.gloInfo.gloLvl;
    this.friends = window.client.gloInfo.friends;
    this.highscore = window.client.gloInfo.highscore;
    this.highestLevelReached = window.client.gloInfo.gameStats.highestLevelReached;
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
    console.log('stylizing calling card', this.glotagMode)
    // main
    switch (this.glotagMode) {
      case 'glotag':
        this.glotagPage.appendChild(this.glotagElement);
        if (this.gloPage == 'home') {
          this.glotagElement.style.height = '20%';
          this.glotagElement.style.width = '50%';
          this.glotagElement.style.backgroundSize = 'cover';
          this.glotagElement.style.position = 'absolute';
          this.glotagElement.style.left = '5%';
          this.glotagElement.style.top = '5%';
          this.glotagElement.style.border = '8px solid white';
          this.glotagElement.style.border = '4rem';
          this.glotagElement.style.borderTop = '1px solid white';
          this.glotagElement.style.borderRight = '1px solid white';
          this.glotagElement.style.borderBottom = '12px solid white';
          this.glotagElement.style.borderLeft = '12px solid white';
          this.glotagElement.style.boxShadow = '-0.025rem 0 0.025rem #FFFFFF, 0 0.025rem 0.025rem #FFFFFF, -0.25rem 0.25rem 0.25rem #FFFFFF, -0.1rem 0.1rem 0.1rem #FFFFFF, -0.35rem 0.35rem 0.35rem #FFFFFF, inset 0 0 0.1625rem #FFFFFF';


    
          // pfp
          this.pfpElement.style.borderRadius = '50%';
          this.pfpElement.style.height = '80%';
          this.pfpElement.style.aspectRatio = '1/1';
          this.pfpElement.style.position = 'absolute';
          this.pfpElement.style.top = '10%';
          this.pfpElement.style.left = '2.5%';
          this.pfpElement.style.width = 'auto';
      
          // username
          if (!this.usernameElement) {
            this.usernameElement = document.createElement('div');
            this.usernameElement.id = 'usernameElement';
            this.glotagElement.appendChild(this.usernameElement);
          }
          this.usernameElement.innerText = window.client.gloInfo.username;
          console.log('set username to', window.client.gloInfo.username)
          this.usernameElement.style.marginLeft = '';
          this.usernameElement.style.fontSize = '4rem';
          this.usernameElement.style.color = 'white';
          this.usernameElement.style.position = 'absolute';
          this.usernameElement.style.top = '33%';
          this.usernameElement.style.left = '33%';
      
          // level display
          if (!this.levelDisplay) {
            this.levelDisplay = document.createElement('div');
            this.levelDisplay.id = 'levelDisplay';
            this.glotagElement.appendChild(this.levelDisplay);
          }
          this.levelDisplay.innerText = `${window.client.gloInfo.gloLvl}`;
          console.log('set level display to', window.client.gloInfo.gloLvl)
          this.levelDisplay.style.fontSize = '4rem';
          this.levelDisplay.style.color = 'white';
          this.levelDisplay.style.position = 'absolute';
          this.levelDisplay.style.top = '35%';
          this.levelDisplay.style.left = '82%';
          this.levelDisplay.style.textAlign = 'center';
          this.levelDisplay.style.display = 'flex';
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
            this.walletsButton = document.createElement('div');
            this.walletsButton.id = 'wallets-button';
            this.optionsContainer.appendChild(this.walletsButton);
            
            // Set the image as the background of the button
            this.walletsButton.style.backgroundImage = 'url("style/graphics/walleticon.png")';
            this.walletsButton.style.backgroundSize = 'contain'; // Ensure the image fits within the button
            this.walletsButton.style.backgroundRepeat = 'no-repeat'; // Do not repeat the image
            this.walletsButton.style.backgroundPosition = 'center'; // Center the image within the button
            
            // Remove the previous styling that is no longer needed
            this.walletsButton.style.backgroundColor = 'transparent';
            this.walletsButton.style.border = 'none';
            this.walletsButton.style.borderRadius = '0'; // Assuming the image has its own styling
            
            // Other necessary styling for the button's size, depending on the image's aspect ratio
            this.walletsButton.style.width = '25%'; // Adjust as needed
            this.walletsButton.style.height = '60%'; // Adjust as needed
            this.walletsButton.style.display = 'flex';
            this.walletsButton.style.alignItems = 'center';
            this.walletsButton.style.justifyContent = 'center';
            this.walletsButton.style.cursor = 'pointer';
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
            this.handleGloPage();
          });        

          this.walletsButton.style.display = 'flex';

          // Create and style a settings button
          if (!this.settingsButton) {
            this.settingsButton = document.createElement('div');
            this.settingsButton.id = 'settings-button';
            this.optionsContainer.appendChild(this.settingsButton);

          // Set the gear image as the background of the button
          this.settingsButton.style.backgroundImage = 'url("style/graphics/gearicon.png")';
          this.settingsButton.style.backgroundSize = 'cover';
          this.settingsButton.style.backgroundRepeat = 'no-repeat';
          this.settingsButton.style.backgroundPosition = 'center';
          this.settingsButton.style.width = '10vh'; // Example size, adjust as needed
          this.settingsButton.style.height = '10vh'; // Example size, adjust as needed
          this.settingsButton.style.cursor = 'pointer';
          }
          this.settingsButton.style.display = 'flex';

          this.settingsButton.addEventListener('click', () => {
            // GSAP animation to spin the gear
            gsap.to(this.settingsButton, {
              rotation: '+=360',
              duration: 1,
              ease: "power2.inOut",
              onComplete: () => {
                // The logic you want to execute after the animation goes here
                this.gloPage = 'settings';
                this.handleGloPage();
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
        this.glotagPage.appendChild(this.glotagElement);
        if (this.gloPage == 'player' || this.gloPage == 'home') {
          this.glotagElement.style.height = '20%';
          this.glotagElement.style.width = '70%';
          this.glotagElement.style.position = 'absolute';
          this.glotagElement.style.left = '5%';
          this.glotagElement.style.top = '5%';
          this.glotagElement.style.borderTopLeftRadius = '10% 45%';
          this.glotagElement.style.borderBottomLeftRadius = '10% 45%';
          this.glotagElement.style.borderTopRightRadius = '10% 45%';
          this.glotagElement.style.borderBottomRightRadius = '10% 45%';
          this.glotagElement.style.boxShadow = '-0.025rem 0 0.025rem #FFFFFF, 0 0.025rem 0.025rem #FFFFFF, -0.25rem 0.25rem 0.25rem #FFFFFF, -0.1rem 0.1rem 0.1rem #FFFFFF, -0.35rem 0.35rem 0.35rem #FFFFFF, inset 0 0 0.1625rem #FFFFFF';
          this.glotagElement.style.borderTop = '1px solid white';
          this.glotagElement.style.borderRight = '1px solid white';
          this.glotagElement.style.borderBottom = '12px solid white';
          this.glotagElement.style.borderLeft = '12px solid white';

          // pfp
          this.pfpElement.style.borderRadius = '50%';
          this.pfpElement.style.height = '80%';
          this.pfpElement.style.aspectRatio = '1/1';
          this.pfpElement.style.position = 'absolute';
          this.pfpElement.style.top = '10%';
          this.pfpElement.style.left = '2.5%';
      
          // username
          if (!this.usernameElement) {
            this.usernameElement = document.createElement('div');
            this.usernameElement.id = 'usernameElement';
            this.glotagElement.appendChild(this.usernameElement);
          }
          this.usernameElement.style.marginLeft = '';
          this.usernameElement.style.fontSize = '4rem';
          this.usernameElement.style.color = 'white';
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
          this.levelDisplay.style.display = 'flex';
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
          this.shrinkCallingCard();
        }
        if (this.glotagMode == 'calling_card') return;
        this.usernameElement.innerText = window.client.activePlayer.playerInfo.nickname;
        this.levelDisplay.innerText = `${window.client.activePlayer.playerInfo.gloLvl}`;
        break;
      case 'guest':
        if (!this.glotagElement) {
          this.glotagElement = document.createElement('div');
          this.glotagElement.id = 'gloTagElement';
          
          this.pfpElement = document.createElement('div');
          this.pfpElement.id = 'pfpElement';
          this.glotagElement.appendChild(this.pfpElement);
          
          this.usernameElement = document.createElement('div');
          this.usernameElement.id = 'usernameElement';
          this.glotagElement.appendChild(this.usernameElement);
        }
        document.body.appendChild(this.glotagElement);
        this.glotagElement.style.backgroundColor = "black";
        this.glotagElement.style.position = "absolute";
        this.glotagElement.style.borderRadius = '1.25rem';
        this.glotagElement.style.top = "1vh";
        this.glotagElement.style.left = '';
        this.glotagElement.style.right = "1vw";
        this.glotagElement.style.height = '9vh';
        this.glotagElement.style.width = '18.5vw';
        this.glotagElement.style.display = "flex";
        this.glotagElement.style.alignItems = "center";
        this.glotagElement.style.zIndex = "3";
        this.glotagElement.style.fontFamily = "Gabarito, sans-serif";
        this.glotagElement.style.fontWeight = "bold";
        this.glotagElement.style.cursor = 'pointer';
        this.glotagElement.style.borderStyle = 'solid'; // Sets the border style to solid
        this.glotagElement.style.borderWidth = '8px'; // Sets the border width to 8px
        this.glotagElement.style.borderColor = 'white'; // Sets the border color to white
        this.glotagElement.style.boxShadow = '-0.025rem 0 0.025rem #FFFFFF, 0 0.025rem 0.025rem #FFFFFF, -0.25rem 0.25rem 0.25rem #FFFFFF, -0.1rem 0.1rem 0.1rem #FFFFFF, -0.35rem 0.35rem 0.35rem #FFFFFF, inset 0 0 0.1625rem #FFFFFF';
        break;
      case 'calling_card':
        if (!this.glotagElement) {
          this.glotagElement = document.createElement('div');
          this.glotagElement.id = 'gloTagElement';
          
          this.pfpElement = document.createElement('div');
          this.pfpElement.id = 'pfpElement';
          this.glotagElement.appendChild(this.pfpElement);
          
          this.usernameElement = document.createElement('div');
          this.usernameElement.id = 'usernameElement';
          this.glotagElement.appendChild(this.usernameElement);
        }
        document.body.appendChild(this.glotagElement);
        // this.glotagElement.style.backgroundImage = 'linear-gradient(45deg, rgba(140, 0, 255, .6) 0%, rgba(2, 242, 114, .7) 100%)';
        this.glotagElement.style.backgroundColor = 'black';
        this.glotagElement.style.position = "absolute";
        this.glotagElement.style.borderRadius = '2rem';
        this.glotagElement.style.top = "1vh";
        this.glotagElement.style.left = '';
        this.glotagElement.style.right = "1vw";
        this.glotagElement.style.height = '9vh';
        this.glotagElement.style.width = '18.5vw';
        this.glotagElement.style.display = "flex";
        this.glotagElement.style.alignItems = "center";
        this.glotagElement.style.zIndex = "3";
        this.glotagElement.style.fontFamily = "Gabarito, sans-serif";
        this.glotagElement.style.fontWeight = "bold";
        this.glotagElement.style.cursor = 'pointer';
        this.glotagElement.style.borderTop = '0px solid white';
        this.glotagElement.style.borderBottom = '6px solid white';
        this.glotagElement.style.borderRight = '0px solid white';
        this.glotagElement.style.borderLeft = '6px solid white';
        this.glotagElement.style.boxShadow = '-0.025rem 0 0.025rem #FFFFFF, 0 0.025rem 0.025rem #FFFFFF, -0.25rem 0.25rem 0.25rem #FFFFFF, -0.1rem 0.1rem 0.1rem #FFFFFF, -0.35rem 0.35rem 0.35rem #FFFFFF, inset 0 0 0.1625rem #FFFFFF';
        this.usernameElement.style.fontSize = '3rem';
        this.usernameElement.style.top = '34%';
        this.usernameElement.innerText = window.client.gloInfo.username;
        this.levelDisplay.style.fontSize = '1rem';
        this.levelDisplay.style.right = '5%';
        this.levelDisplay.style.top = '15%';
        this.pfpElement.style.top = '';
        this.levelDisplay.style.left = '';
        // PFP adjustments based on the presence of a picture
        if (window.client.gloInfo.pfp) {
          this.pfpElement.style.backgroundImage = `url('${window.client.gloInfo.pfp}')`;
          this.pfpElement.style.backgroundSize = 'cover'; 
          this.pfpElement.style.backgroundPosition = 'center';
        } else {
          this.pfpElement.style.backgroundcolor = 'white';
        }
        this.pfpElement.style.height = '5vh';
        this.usernameElement.style.top = '18%';
        this.pfpElement.style.borderRadius = '50%';
        this.pfpElement.style.marginLeft = '1.5vh';
        this.pfpElement.style.marginRight = '1.5vh';
        this.pfpElement.style.border = '2px solid black';
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
    this.friendsList.hideFriendsList();
  }

  backToClientPage() {
    console.log('going back to home glotag')
    if (!window.client.switchingPlayers) window.client.switchingPlayers = true;
    window.client.activePlayer = null;
    this.nftList.nfts = [];
    this.nftList.existingNftsMap.clear();
    this.gloPage = 'home';
    this.glotagMode = 'glotag';
    this.handleGloPage();
    if (this.backButton) {
      this.backButton.style.display = 'none';
    }
  }
}

class LuncmanStats {
  constructor() {
    console.log('creating Luncman Stats')

    this.handleGloPage();
  }

  handleGloPage() {
    if (window.glotag.gloPage == 'home') {
      // handle home page
      console.log('glopage = home')
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
      this.luncmanDisplay.style.backgroundImage = 'url(./style/graphics/glotagLMan.png)';
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
      scale: 1.1, // Scales up to 110%
      duration: 0.3,
      ease: "power1.inOut",
      paused: true
    }).eventCallback("onComplete", () => {
      gsap.to("#luncmanDisplay", {
        scale: 1, // Scale back to original size
        duration: 0.3,
        ease: "power1.inOut"
      });
    });

    document.getElementById('luncmanDisplay').addEventListener('mouseenter', () => {
      gsap.to("#luncmanDisplay", { scale: 1.1, duration: 0.3, ease: "power1.inOut" });
    });

    document.getElementById('luncmanDisplay').addEventListener('mouseleave', () => {
      gsap.to("#luncmanDisplay", { scale: 1, duration: 0.3, ease: "power1.inOut" });
    });
  }

  handleLuncmanStatsClick() {
    let gsapState = Flip.getState('#gloTagElement');
    this.changeGloPage('luncman_stats')
    this.previousGloPage = 'luncman_stats';
    Flip.from(gsapState, {
      duration: 0.5,
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
      divElement.style.borderRadius = '2rem'; // This will give the rounded corners
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
      imgElement.style.width = '10vh'; // Set the width of the image as needed
      imgElement.style.height = 'auto'; // Maintain the aspect ratio of the image
    
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
      captionElement.innerHTML = innerHTML;

      // Append the image to the div
      divElement.appendChild(captionElement);
    };

    //highscore
    this.highscoreDisplay = document.createElement('div');
    styleStatDiv(this.highscoreDisplay);
    this.highscoreEmoji = document.createElement('div');
    styleStatImage(this.highscoreDisplay, '/style/graphics/stats/highscore.png'); 
    this.highscoreCaption = document.createElement('div');
    styleStatCaption(this.highscoreDisplay, this.highscoreCaption, 'Highscore: <br>' + window.client.gloInfo.highscore);

    //highest level reached
    this.highestLevelReachedDisplay = document.createElement('div');
    styleStatDiv(this.highestLevelReachedDisplay);
    this.highestLevelReachedEmoji = document.createElement('div');
    styleStatImage(this.highestLevelReachedDisplay, '/style/graphics/stats/highestlevelreached.png');
    this.highestLevelReachedCaption = document.createElement('div');
    styleStatCaption(this.highestLevelReachedDisplay, this.highestLevelReachedCaption, 'Highest LvL Reached: <br>' + window.client.gameStats.highestLevelReached);
    
    //total play time
    this.totalPlayTimeDisplay = document.createElement('div');
    styleStatDiv(this.totalPlayTimeDisplay);
    this.totalPlayTimeEmoji = document.createElement('div');
    styleStatImage(this.totalPlayTimeDisplay, '/style/graphics/stats/totalplaytime.png');
    this.totalPlayTimeCaption = document.createElement('div');
    styleStatCaption(this.totalPlayTimeDisplay, this.totalPlayTimeCaption, 'Total Play Time: <br>' + window.client.gameStats.totalPlayTime);

    //coins collected
    this.coinsCollectedDisplay = document.createElement('div');
    styleStatDiv(this.coinsCollectedDisplay);
    this.coinsCollectedEmoji = document.createElement('div');
    styleStatImage(this.coinsCollectedDisplay,'/style/graphics/stats/coinscollected.png')
    this.coinsCollectedCaption = document.createElement('div');
    styleStatCaption(this.coinsCollectedDisplay, this.coinsCollectedCaption, 'Coins Collected: <br>' + window.client.gameStats.coinsCollected);


    //enemies killed
    this.enemiesKilledDisplay = document.createElement('div');
    styleStatDiv(this.enemiesKilledDisplay);
    this.enemiesKilledEmoji = document.createElement('div');
    styleStatImage(this.enemiesKilledDisplay, '/style/graphics/stats/enemieskilled.png');
    this.enemiesKilledCaption = document.createElement('div');
    styleStatCaption(this.enemiesKilledDisplay, this.enemiesKilledCaption, 'Enemies Killed: <br>' + window.client.gameStats.enemiesKilled);
    
    //attacks used
    this.attacksUsedDisplay = document.createElement('div');
    styleStatDiv(this.attacksUsedDisplay);
    this.attacksUsedEmoji = document.createElement('div');
    styleStatImage(this.attacksUsedDisplay,'/style/graphics/stats/attacksused.png');
    this.attacksUsedCaption = document.createElement('div');
    styleStatCaption(this.attacksUsedDisplay, this.attacksUsedCaption, 'Attacks Used: <br>' + window.client.gameStats.attacksUsed);


    //deaths
    this.deathsDisplay = document.createElement('div');
    styleStatDiv(this.deathsDisplay);
    this.deathsEmoji = document.createElement('div');
    styleStatImage(this.deathsDisplay, '/style/graphics/stats/deaths.png');
    this.deathsCaption = document.createElement('div');
    styleStatCaption(this.deathsDisplay, this.deathsCaption, 'Deaths: <br>' + window.client.gameStats.deaths);

    //coins per level
    this.coinsPerLevelDisplay = document.createElement('div');
    styleStatDiv(this.coinsPerLevelDisplay);
    this.coinsPerLevelEmoji = document.createElement('div');
    styleStatImage(this.coinsPerLevelDisplay, '/style/graphics/stats/coinsperlevel.png');
    this.coinsPerLevelCaption = document.createElement('div');
    styleStatCaption(this.coinsPerLevelDisplay, this.coinsPerLevelCaption, 'Coins Per Level: <br>' + window.client.gameStats.coinsPerLevel);

    //attack efficiency
    this.attackEfficiencyDisplay = document.createElement('div');
    styleStatDiv(this.attackEfficiencyDisplay);
    this.attackEfficiencyEmoji = document.createElement('div');
    styleStatImage(this.attackEfficiencyDisplay, '/style/graphics/stats/attackefficiency.png');
    this.attackEfficiencyCaption = document.createElement('div');
    styleStatCaption(this.attackEfficiencyDisplay, this.attackEfficiencyCaption, 'Attack Efficiency: <br>' + window.client.gameStats.attackEfficiency);
    
    //kd
    this.KDDisplay = document.createElement('div');
    styleStatDiv(this.KDDisplay);
    this.KDEmoji = document.createElement('div');
    styleStatImage(this.KDDisplay,'/style/graphics/stats/kd.png');
    this.KDCaption = document.createElement('div');
    styleStatCaption(this.KDDisplay, this.KDCaption,  'KD: <br>' + window.client.gameStats.KD);

    //attacks hit
    this.attacksHitDisplay = document.createElement('div');
    styleStatDiv(this.attacksHitDisplay);
    this.attacksHitEmoji = document.createElement('div');
    styleStatImage(this.attacksHitDisplay, '/style/graphics/stats/attackshit.png');
    this.attacksHitCaption = document.createElement('div');
    styleStatCaption(this.attacksHitDisplay, this.attacksHitCaption, 'Attacks Hit: <br>' + window.client.gameStats.attacksHit);

    //levels played
    this.levelsPlayedDisplay = document.createElement('div');
    styleStatDiv(this.levelsPlayedDisplay);
    this.levelsPlayedEmoji = document.createElement('div');
    styleStatImage(this.levelsPlayedDisplay, '/style/graphics/stats/levelsplayed.png');
    this.levelsPlayedCaption = document.createElement('div');
    styleStatCaption(this.levelsPlayedDisplay, this.levelsPlayedCaption, 'Levels Played: <br>' + window.client.gameStats.levelsPlayed);

    //btc collected
    this.bitcoinCollectedDisplay = document.createElement('div');
    styleStatDiv(this.bitcoinCollectedDisplay);
    this.bitcoinCollectedEmoji = document.createElement('div');
    styleStatImage(this.bitcoinCollectedDisplay, '/style/graphics/stats/bitcoincollected.png');
    this.bitcoinCollectedCaption = document.createElement('div');
    styleStatCaption(this.bitcoinCollectedDisplay, this.bitcoinCollectedCaption, 'Bitcoin Collected: <br>' + window.client.gameStats.fruitCollected[0].bitcoin);

    //eth collected
    this.ethereumCollectedDisplay = document.createElement('div');
    styleStatDiv(this.ethereumCollectedDisplay);
    this.ethereumCollectedEmoji = document.createElement('div');
    styleStatImage(this.ethereumCollectedDisplay, '/style/graphics/stats/ethereumcollected.png');
    this.ethereumCollectedCaption = document.createElement('div');
    styleStatCaption(this.ethereumCollectedDisplay, this.ethereumCollectedCaption, 'Ethereum Collected: <br>' + window.client.gameStats.fruitCollected[0].ethereum);

    //atom collected
    this.atomCollectedDisplay = document.createElement('div');
    styleStatDiv(this.atomCollectedDisplay);
    this.atomCollectedEmoji = document.createElement('div');
    styleStatImage(this.atomCollectedDisplay, '/style/graphics/stats/atomcollected.png');
    this.atomCollectedCaption = document.createElement('div');
    styleStatCaption(this.atomCollectedDisplay, this.atomCollectedCaption, 'Atom Collected: <br>' + window.client.gameStats.fruitCollected[0].atom);

    //sol collected
    this.solanaCollectedDisplay = document.createElement('div');
    styleStatDiv(this.solanaCollectedDisplay);
    this.solanaCollectedEmoji = document.createElement('div');
    styleStatImage(this.solanaCollectedDisplay,  '/style/graphics/stats/solanacollected.png');
    this.solanaCollectedCaption = document.createElement('div');
    styleStatCaption(this.solanaCollectedDisplay, this.solanaCollectedCaption, 'Solana Collected: <br>' + window.client.gameStats.fruitCollected[0].solana);

    this.luncmanStatsParent.appendChild(statsContainer);
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
    this.hideFriendList();
    switch(window.glotag.gloPage) {
      case 'friend_list':
        this.onFriendListPage();
        break;
      case 'home':
        this.onHomePage();
        break;
      case 'friend_requests':
        this.createFriendRequestsPage();
        break;
      case 'player':
        this.onPlayerPage();
      default:
        // other
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
        this.fetchAndCreatePlayers(window.client.activePlayer.playerInfo.friends);
      } else {
        this.fetchAndCreatePlayers(window.client.gloInfo.friends);
      }
      window.client.switchingPlayers = false;
    } else {
      console.error(this.loadedFriends, 'Setting Home')
      if (!this.loadedFriends) {
        this.fetchAndCreatePlayers(window.client.gloInfo.friends);
      } else {
        this.showHomeFriends();
      }
    }
  }

  onPlayerPage() {
    console.error('setting player page')
    this.players = {};
    this.playersLoaded = false;
    this.createHomeFriendList();
    this.fetchAndCreatePlayers(window.client.activePlayer.playerInfo.friends);
    window.client.switchingPlayers = false;
    window.glotag.gloPage = 'home';
  }

  createHomeFriendList() {
    if (this.friendListHomeElement) {
      this.friendListHomeElement.style.display = 'flex';
      return;
    } else {
      this.friendListHomeElement = document.createElement('div');
      window.glotag.glotagPage.appendChild(this.friendListHomeElement);
      this.friendListHomeElement.id = 'friendList';
      this.friendListHomeElement.style.position = 'absolute';
      this.friendListHomeElement.style.alignItems = 'center';
      this.friendListHomeElement.style.display = 'flex';
      this.friendListHomeElement.style.height = '15%';
      this.friendListHomeElement.style.width = '80%';
      this.friendListHomeElement.style.borderTop = '10px double white';
      this.friendListHomeElement.style.borderBottom = '10px double white';  
      this.friendListHomeElement.style.borderLeft = '0';
      this.friendListHomeElement.style.borderRight = '0';
      this.friendListHomeElement.style.top = '35%';
      this.friendListHomeElement.style.left = '10%';
      this.friendListHomeElement.style.flexWrap = 'nowrap';
      this.friendListHomeElement.style.overflowX = 'scroll';
      this.friendListHomeElement.style.overflowY = 'hidden';
      this.friendListHomeElement.style.whiteSpace = 'nowrap'; // Prevent wrapping of children
      this.friendListHomeElement.style.justifyContent = 'flex-start'; // Align children to the start        

      
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
        console.error('friends is not an array');
        return;
      }

      const response = await fetch('/get_player_info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ friends: friendData }) // Send the friends array
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const playerDataArray = await response.json();
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

    friendsInfo.forEach(playerInfo => {
      // Check if playerInfo.walletID exists in this.players, if not create a new Player instance
      if (!this.players[playerInfo.walletID]) {
        this.players[playerInfo.walletID] = new Player('home', playerInfo);
      }
      console.log('Added', playerInfo, 'to friends', this.players);

      this.friendListHomeElement.appendChild(this.players[playerInfo.walletID].previewElement);
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
    this.container.style.border = '1px dashed white';
  
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
        top: 2%;
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
      duration: 0.5,
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

      this.friendRequestIndicator = document.createElement('div');
      window.glotag.glotagPage.appendChild(this.friendRequestIndicator)
      this.friendRequestIndicator.textContent = ':)';
      this.friendRequestIndicator.style.position = 'absolute';
      this.friendRequestIndicator.style.fontSize = '3rem';
      this.friendRequestIndicator.style.color = 'red';
      this.friendRequestIndicator.style.top = '8.5%';
      this.friendRequestIndicator.style.right = '10%'; // Position it to the right of the title
      this.friendRequestIndicator.style.cursor = 'pointer'; // Change the cursor to indicate it's clickable
      this.friendRequestIndicator.style.textShadow = "0.15rem 0.15rem 0 #000, 0.15rem 0.15rem 0 #000, 0.15rem 0.15rem 0 #000, 0.15rem 0.15rem 0 #000";
      this.friendRequestIndicator.addEventListener('click', this.handleFriendRequestClick);
    }
  }

  createFriendsListContainer() {
    if (this.friendsListContainer) {
      this.friendsListContainer.style.display = 'flex';
    } else {
      this.friendsListContainer = document.createElement('div');
      window.glotag.glotagPage.appendChild(this.friendsListContainer);
      this.friendsListContainer.style.display = 'flex';
      this.friendsListContainer.style.position = 'absolute';
      this.friendsListContainer.style.top = '20%';
      this.friendsListContainer.style.left = '10%';
      this.friendsListContainer.style.width = '80%';
      this.friendsListContainer.style.height = '70%';
      this.friendsListContainer.style.overflowY = 'scroll';
      this.friendsListContainer.style.border = '1px dashed white';
      this.friendsListContainer.style.borderRadius = '3rem';
      this.friendsListContainer.style.flexWrap = 'wrap';
      this.friendsListContainer.style.flexDirection = 'row';
      this.friendsListContainer.style.alignItems = 'flex-start';
      this.friendsListContainer.style.justifyContent = 'flex-start';
      this.friendsListContainer.style.maxHeight = '100%';
      this.friendsListContainer.style.overflowY = 'auto';
    }
  }

  handleFriendRequestClick() {
    window.glotag.gloPage = 'friend_requests';
    window.glotag.handleGloPage();
  }

  populateFriendsList() {
    // Clear the friends list container before appending the player instances
    this.friendsListContainer.innerHTML = '';
  
    // Set container styles for a grid layout with a maximum of 6 items per row
    this.friendsListContainer.style.display = 'grid';
    this.friendsListContainer.style.gridTemplateColumns = 'repeat(6, 1fr)';
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
    if (window.glotag.gloPage == 'friend_list') {
      if (this.friendListHomeElement) this.friendListHomeElement.style.display = 'none';
      if (this.container) this.container.style.display = 'none';
      return;
    } else if (!window.glotag.gloPage == 'home') {
      if (this.friendsListContainer) this.friendsListContainer.style.display = 'none';
      if (this.pageTitle) this.pageTitle.style.display = 'none';
      if (this.friendRequestIndicator) this.friendRequestIndicator.style.display = 'none';
      if (this.container) this.container.style.display = 'none';
      return;
    } else {
      if (this.friendListHomeElement) this.friendListHomeElement.style.display = 'none';
      if (this.friendsListContainer) this.friendsListContainer.style.display = 'none';
      if (this.friendRequestIndicator) this.friendRequestIndicator.style.display = 'none';
      if (this.pageTitle) this.pageTitle.style.display = 'none';
      if (this.container) this.container.style.display = 'none';
    }
  }
}

class NftList {
  constructor() {
    console.log('creating NFT List');
    this.nfts = [];
    this.handleGloPage();

    document.addEventListener('receivedPlayerNfts', this.onReceivedPlayerNfts.bind(this));
  }

  handleGloPage() {
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

  onHomePage() {
    this.hideNftList();
    this.createHomeNftList();
    
    let nfts;
    if (window.client.activePlayer) {
      nfts = window.client.playerNfts;
    } else {
      nfts = window.client.allNfts;
    }
    this.createHomeNfts(nfts);
  }

  onPlayerPage() {
    let gsapState = Flip.getState('#gloTagElement');
    this.hideNftList();
    this.createHomeNftList();
    Flip.from(gsapState, {
      duration: 0.5,
      ease: "power1.inOut",
      absolute: true,
      onComplete: () => console.log('Flip animation complete!')
    });
  }

  onLibraryPage() {
    // Create or show the NFT page and its container
    this.hideNftList();
    this.createNftPageContainer();
    this.populateNftPage();
  }

  onReceivedPlayerNfts() {
    console.log('resetting nfts', this.nfts)
    // Clear the existing NFT instances
    this.nfts.forEach(nft => {
      if (nft.previewElement) {
        nft.previewElement.removeEventListener('click', nft.handleNftClick); // Remove any event listeners if present
        nft.previewElement.remove(); // Remove the element from the DOM
      }
    });
    this.nfts = []; // Reset the nfts array
    this.existingNftsMap.clear(); // Reset the existing nfts map
    
    // Check if the event data includes NFTs and recreate them
    const playerNfts = window.client.playerNfts
    this.createHomeNfts(playerNfts);
  }

  createHomeNftList() {
    console.log('creating home nft list')
    if (!this.nftListHomeElement) {
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
        this.nftListHomeElement.style.width = '80%';
        this.nftListHomeElement.style.top = '55%';
        this.nftListHomeElement.style.left = '10%';
        this.nftListHomeElement.style.overflowX = 'scroll'; // Allow horizontal scrolling
        this.nftListHomeElement.style.overflowY = 'hidden'; // Hide vertical scrollbar
        this.nftListHomeElement.style.whiteSpace = 'nowrap'; // Prevent wrapping of children
        this.nftListHomeElement.style.justifyContent = 'flex-start'; // Align children to the start
        this.nftListHomeElement.style.borderTop = '10px double white';     /* Top border */
        this.nftListHomeElement.style.borderBottom = '10px double white';  /* Bottom border */
        this.nftListHomeElement.style.borderLeft = '0';                  /* No left border */
        this.nftListHomeElement.style.borderRight = '0';                 /* No right border */

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
        this.nftListHomeElement.addEventListener('click', this.handleNftListClick.bind(this));
    } else {
        // If the element already exists, simply ensure it's displayed
        console.log('displaying home nft list as flex')
        this.nftListHomeElement.style.display = 'flex';
    }
  }

  createHomeNfts(ownedNfts) {
    console.log('Creating home NFTs with new data:', ownedNfts);
  
    if (!ownedNfts || !Array.isArray(ownedNfts.tokens)) {
      console.error('Invalid NFT data provided to createHomeNfts');
      return;
    }
  
    this.nftListHomeElement.innerHTML = ''; // Clear the NFT list home element to repopulate it
  
    // Since nftInfo objects are strings, use them directly as IDs.
    if (!this.existingNftsMap) {
      this.existingNftsMap = new Map(this.nfts.map(nft => [nft.nftInfo, nft]));
    }
  
    // Diagnostic log to inspect the structure of the first nftInfo object
    console.log('Creating home nfts from', ownedNfts);
  
    ownedNfts.tokens.forEach(nftInfo => {
      // Use the string itself as the unique identifier
      let nft = this.existingNftsMap.get(nftInfo);
  
      if (!nft) {
        // If the NFT does not exist, create a new instance and add it to the map and list
        nft = new Nft('home', nftInfo);
        this.nfts.push(nft);
        this.existingNftsMap.set(nftInfo, nft);
        console.log('Added', nftInfo, 'to existing nfts map', this.existingNftsMap, this.nfts)
      }
  
      // Append the NFT's preview element to the list
      this.nftListHomeElement.appendChild(nft.previewElement);
    });
  }

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
      this.nftPageContainer.style.left = '10%';
      this.nftPageContainer.style.width = '80%';
      this.nftPageContainer.style.height = '70%';
      this.nftPageContainer.style.overflowY = 'scroll';
      this.nftPageContainer.style.border = '1px dashed white';
      this.nftPageContainer.style.borderRadius = '3rem';
    } else {
      this.nftPageContainer.style.display = 'flex';
    }
  }

  populateNftPage() {
    this.nftPageContainer.innerHTML = '';
    this.nfts.forEach((nft) => {
      this.nftPageContainer.appendChild(nft.previewElement);
      nft.state = 'library';
      nft.handleState();
    });
  }

  handleNftListClick() {
    let gsapState = Flip.getState('#gloTagElement');
    console.log("nft list clicked");
    window.glotag.gloPage = 'library';
    window.glotag.handleGloPage();
    Flip.from(gsapState, {
      duration: 0.5,
      ease: "power1.inOut",
      absolute: true,
      onComplete: () => console.log('Flip animation complete!')
    });
  }

  hideNftList() {
    switch (window.glotag.gloPage) {
      case 'home':
        if (this.nftPageContainer) this.nftPageContainer.style.display = 'none';
        break;
      case 'library':
        console.error('setting nft home list display to none')
        if (this.nftListHomeElement) this.nftListHomeElement.style.display = 'none';
        break;
      case 'player':
        if (this.nftPageContainer) this.nftPageContainer.style.display = 'none';
        break;
      default:
        console.error('setting nft home list display to none')
        if (this.nftListHomeElement) this.nftListHomeElement.style.display = 'none';
        break;
    }
  }
}

class Nft {
  constructor(state, nftInfo) {
    this.nftInfo = nftInfo;
    
    if (state == 'home') {
      this.createPreviewNft();
    } else if (state == 'nft_page') {
      // nft page
    }
  }

  handleState() {
    switch (this.state) {
      case 'home':
        this.createPreviewNft();
        break;
      case 'library':
        this.createLibraryElement();
        break;
      case 'nft_page':
        // nft page
        break;
      // ... any other states ...
      default:
        break;
    }
  }

  createPreviewNft() {
    if (this.previewElement) {
      this.previewElement.style.display = 'flex';
    } else {
      this.previewElement = document.createElement('div');
      this.previewElement.id = 'nftPreview';
      this.previewElement.style.display = 'flex';
      this.previewElement.style.flex = '0 0 auto';
      this.previewElement.style.justifyContent = 'center';
      this.previewElement.style.alignItems = 'center';
      this.previewElement.style.borderRadius = '50%'; // Rounded corners for a circle
      this.previewElement.style.backgroundColor = 'skyblue';
      this.previewElement.style.margin = '0 20px';
      this.previewElement.style.height = '80px'; // Fixed height
      this.previewElement.style.width = '80px'; // Fixed width
      this.previewElement.style.minWidth = '80px'; // Prevent width from scaling
      this.previewElement.style.minHeight = '80px'; // Prevent height from scaling
      // Set the font size to ensure text fits inside the circle
      this.previewElement.style.fontSize = '12px'; // Adjust as needed
      this.previewElement.style.overflow = 'hidden'; // Prevent text from overflowing
      this.previewElement.innerText = this.nftInfo;
      // More styling and logic can be added here as needed
      
      // Add mouseover and mouseout event listeners
      this.previewElement.addEventListener('mouseover', this.handleMouseOver.bind(this));
      this.previewElement.addEventListener('mouseout', this.handleMouseOut.bind(this));
    }
  }

  createLibraryElement() {
    // Apply styles for the NFT page
    this.previewElement.style.display = 'flex';
    this.previewElement.style.margin = '20px 20px';
    this.previewElement.style.height = '90px';
    this.previewElement.style.width = '90px';
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
      default:
        this.previewElement.style.height = '80px';
        this.previewElement.style.width = '80px';
        this.previewElement.style.margin = '0px 20px';
        break;
    }
  }
}

class Player {
  constructor(state, playerInfo) {
    this.state = state;
    this.playerInfo = playerInfo;
    this.gloInfo = {
      username: playerInfo.nickname,
      walletID: playerInfo.walletID
    }
    
    this.handleState();
  }

  handleState() {
    switch (this.state) {
      case 'home':
        this.createPreviewPlayer();
        break;
      case 'player_page':
        this.createPlayerPage();
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
      this.previewElement.style.borderRadius = '50%'; // Rounded corners for a circle
      this.previewElement.style.backgroundColor = 'skyblue';
      this.previewElement.style.margin = '0 20px';
      this.previewElement.style.height = '80px'; // Fixed height
      this.previewElement.style.width = '80px'; // Fixed width
      this.previewElement.style.minWidth = '80px'; // Prevent width from scaling
      this.previewElement.style.minHeight = '80px'; // Prevent height from scaling
      // Set the font size to ensure text fits inside the circle
      this.previewElement.style.fontSize = '12px'; // Adjust as needed
      this.previewElement.style.overflow = 'hidden'; // Prevent text from overflowing
      this.previewElement.innerText = this.playerInfo.nickname;
      
      // Add event listeners to change size on hover
      this.previewElement.addEventListener('mouseover', this.handleMouseOver.bind(this));

      this.previewElement.addEventListener('mouseout', this.handleMouseOut.bind(this));

      this.previewElement.addEventListener('click', (event) => {
        event.stopPropagation(); // This stops the event from propagating further
        this.handlePreviewClick();
      });
    }
  }

  createFriendListPlayer() {
    this.previewElement.style.display = 'flex';
    this.previewElement.style.height = '90px';
    this.previewElement.style.width = '90px';
    this.previewElement.style.margin = '20px 20px';
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
      case 'player_page':
        this.previewElement.style.height = '90px';
        this.previewElement.style.width = '90px';
        this.previewElement.style.margin = '0px 10px';
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
      case 'player_page':
        this.previewElement.style.height = '80px';
        this.previewElement.style.width = '80px';
        this.previewElement.style.margin = '0px 20px';
        break;
      default:
        this.previewElement.style.height = '80px';
        this.previewElement.style.width = '80px';
        this.previewElement.style.margin = '0px 20px';
        console.error('invalid friend state');
        break;
    }
  }

  handlePreviewClick() {
    console.log('walletid', this.playerInfo.walletID, 'walletID', window.client.gloInfo.walletID)
    window.client.switchingPlayers = true;
    if (this.playerInfo.walletID == window.client.gloInfo.walletID) {
      window.glotag.backToClientPage()
      return;
    }
    window.client.storeActivePlayer(this);

    this.state = 'player_page';
    this.handleState();

    window.glotag.gloPage = 'player';
    window.glotag.glotagMode = 'player';
    window.glotag.handleGlotagMode();
  }

  createPlayerPage() {
    this.createPlayerCallingCard();

  }

  createPlayerCallingCard() {
    console.log('creating player calling card')
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
      this.walletsContainer.style.height = '78%';
      this.walletsContainer.style.width = '90%';
      this.walletsContainer.style.top = '20%';
      this.walletsContainer.style.left = '50%';
      this.walletsContainer.style.transform = 'translate(-50%, 0%)';

      //wallet display
      this.activeWallet = document.createElement('div');
      this.walletsContainer.appendChild(this.activeWallet);
      this.activeWallet.style.position = 'absolute';
      this.activeWallet.style.fontSize = '2rem';
      this.activeWallet.style.left = '50%';
      this.activeWallet.style.top = '15%';
      this.activeWallet.style.transform = 'translate(-50%, 0%)';
      this.activeWallet.style.color = 'white';
      this.activeWallet.style.fontFamily = 'Gabarito';

      this.activeWallet.textContent = 'Connected Wallet: ' + window.client.gloInfo.walletID;

      //wallet type
      this.walletType = document.createElement('div');
      this.walletsContainer.appendChild(this.walletType);
      this.walletType.style.position = 'absolute';
      this.walletType.style.fontSize = '2rem';
      this.walletType.style.left = '50%';
      this.walletType.style.top = '20%';
      this.walletType.style.transform = 'translate(-50%, 0%)';
      this.walletType.textContent = 'Wallet Type: Terra Station';
      this.walletType.style.color = 'white';
      this.walletType.style.fontFamily = 'Gabarito';

      //account age
      this.accountAge = document.createElement('div');
      this.walletsContainer.appendChild(this.accountAge);
      this.accountAge.style.position = 'absolute';
      this.accountAge.style.fontSize = '2rem';
      this.accountAge.style.left = '50%';
      this.accountAge.style.top = '25%';
      this.accountAge.style.transform = 'translate(-50%, 0%)';
      this.accountAge.textContent = 'Account Age: 2 Days';
      this.accountAge.style.color = 'white';
      this.accountAge.style.fontFamily = 'Gabarito';

      //hardlogout button
      this.hardLogout = document.createElement('button');
      this.walletsContainer.appendChild(this.hardLogout);
      this.hardLogout.style.position = 'absolute';
      this.hardLogout.style.backgroundColor = 'red';
      this.hardLogout.style.pointer
      this.hardLogout.style.left = '50%';
      this.hardLogout.style.top = '50%';
      this.hardLogout.style.transform = 'translate(-50%, 0%)';
      this.hardLogout.textContent = 'Logout';
      this.hardLogout.style.fontFamily = 'Gabarito';
      this.hardLogout.style.fontSize = '2rem';
      this.hardLogout.style.color = 'white';

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
    if (!this.nftSelectionPage){
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
    }
    this.nftSelectionPage.style.display = 'flex';
  }

  hideNftSelectionPage() {
    this.nftSelectionPage.style.display = 'none';
  }
}