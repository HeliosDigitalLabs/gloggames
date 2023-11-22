// Add event listener to create dashboard on react render
function activateHome() {
    window.windowState = 'home';
    window.luncMobile = new LuncMobile();
    if (window.luncMobile.isMobile()) {
      console.log('Mobile detected');
      window.luncMobile.loadJSON('./js/mobile/json/gaiaboy.json');
      
      const pageBackground = document.getElementById('canvas');
  
      const videoElement = document.createElement('img');
      videoElement.loop = true;
      videoElement.muted = true; // Added muted attribute
      videoElement.autoplay = true;
      videoElement.style.objectFit = 'cover';
      videoElement.style.overflow = 'hidden';
      videoElement.style.width = '100%';
      videoElement.style.height = '100%';
      videoElement.src = '/js/background/page_backgrounds/OGLUNCBGMobile.gif';
      
      pageBackground.appendChild(videoElement);
    } else {
      const backGround = document.body;
  
      const backgroundVideo = document.createElement('video');
      backgroundVideo.id = 'background-video';
      backgroundVideo.loop = true;
      backgroundVideo.autoplay = true;
      backgroundVideo.muted = true; 
      backgroundVideo.playsInline = true; // Note: use "playsInline" for JavaScript
      backgroundVideo.style.objectFit = 'cover';
      backgroundVideo.style.width = '100%';
      backgroundVideo.style.height = '100%';
      backgroundVideo.style.objectPosition = 'center';
      backgroundVideo.style.overflow = 'hidden';
      backgroundVideo.style.visibility = 'visible';
      backGround.appendChild(backgroundVideo);
  
      const backgroundVideo2 = document.createElement('video');
      backgroundVideo2.id = 'background-video2';
      backgroundVideo2.loop = true;
      backgroundVideo2.autoplay = true;
      backgroundVideo2.muted = true;
      backgroundVideo2.playsInline = true; // Note: use "playsInline" for JavaScript
      backgroundVideo2.style.objectFit = 'cover';
      backgroundVideo2.style.width = '100%';
      backgroundVideo2.style.height = '100%';
      backgroundVideo2.style.objectPosition = 'center';
      backgroundVideo2.style.overflow = 'hidden';
      backgroundVideo2.style.visibility = 'visible';
      backGround.appendChild(backgroundVideo2);
  
      const backgrounds = [backgroundVideo, backgroundVideo2];
  
      window.videoBackground = new VideoBackground('./js/background/load_static', backgrounds);
      window.videoBackground.loadSpecificVideo('./js/background/main_nft');
      window.videoBackground.loadJSON('./js/json/placeholder_vids.json');
  
      // Assuming you have buttons or other interactive elements to trigger transitions
      const nftsButton = document.getElementById('nfts');
      const pageBackground = document.getElementById('canvas');
  
      const videoElement = document.createElement('video');
      videoElement.loop = true;
      videoElement.muted = true; // Added muted attribute
      videoElement.autoplay = true;
      videoElement.style.objectFit = 'cover';
      videoElement.style.width = '100%';
      videoElement.style.height = '100%';
      videoElement.src = '/js/background/page_backgrounds/OGLUNCBG.mp4';
      
      pageBackground.appendChild(videoElement);
    }
}

function activateLeaderboard() {
    window.windowState = 'leaderboard';
    window.luncMobile = new LuncMobile();
    if (window.luncMobile.isMobile()) {
        console.log('Mobile detected');
        window.luncMobile.loadJSON('./js/mobile/json/gaiaboy.json');
        
        const pageBackground = document.getElementById('canvas');

        const videoElement = document.createElement('img');
        videoElement.loop = true;
        videoElement.muted = true; // Added muted attribute
        videoElement.autoplay = true;
        videoElement.style.objectFit = 'cover';
        videoElement.style.overflow = 'hidden';
        videoElement.style.width = '100%';
        videoElement.style.height = '100%';
        videoElement.src = '/js/background/page_backgrounds/OGLUNCBGMobile.gif';
        
        pageBackground.appendChild(videoElement);
    } else {
        const backGround = document.body;

        const backgroundVideo = document.createElement('video');
        backgroundVideo.id = 'background-video';
        backgroundVideo.loop = true;
        backgroundVideo.autoplay = true;
        backgroundVideo.muted = true; 
        backgroundVideo.playsInline = true; // Note: use "playsInline" for JavaScript
        backgroundVideo.style.objectFit = 'cover';
        backgroundVideo.style.width = '100%';
        backgroundVideo.style.height = '100%';
        backgroundVideo.style.objectPosition = 'center';
        backgroundVideo.style.overflow = 'hidden';
        backgroundVideo.style.visibility = 'visible';
        backGround.appendChild(backgroundVideo);

        const backgroundVideo2 = document.createElement('video');
        backgroundVideo2.id = 'background-video2';
        backgroundVideo2.loop = true;
        backgroundVideo2.autoplay = true;
        backgroundVideo2.muted = true;
        backgroundVideo2.playsInline = true; // Note: use "playsInline" for JavaScript
        backgroundVideo2.style.objectFit = 'cover';
        backgroundVideo2.style.width = '100%';
        backgroundVideo2.style.height = '100%';
        backgroundVideo2.style.objectPosition = 'center';
        backgroundVideo2.style.overflow = 'hidden';
        backgroundVideo2.style.visibility = 'visible';
        backGround.appendChild(backgroundVideo2);

        const backgrounds = [backgroundVideo, backgroundVideo2];

        window.videoBackground = new VideoBackground('./js/background/load_static', backgrounds);
        window.videoBackground.loadSpecificVideo('./js/background/main_nft');
        window.videoBackground.loadJSON('./js/json/placeholder_vids.json');

        // Assuming you have buttons or other interactive elements to trigger transitions
        const pageBackground = document.getElementById('canvas');

        const videoElement = document.createElement('video');
        videoElement.loop = true;
        videoElement.muted = true; // Added muted attribute
        videoElement.autoplay = true;
        videoElement.style.objectFit = 'cover';
        videoElement.style.width = '100%';
        videoElement.style.height = '100%';
        videoElement.src = '/js/background/page_backgrounds/OGLUNCBG.mp4';
        
        pageBackground.appendChild(videoElement);
    }
}

function activateLuncman() {
    window.windowState = 'luncman';
    window.luncMobile = new LuncMobile();
    if (window.luncMobile.isMobile()) {
        console.log('Mobile detected');
        window.luncMobile.loadJSON('./js/mobile/json/gaiaboy.json');
        
        const pageBackground = document.getElementById('canvas');

        const videoElement = document.createElement('img');
        videoElement.loop = true;
        videoElement.muted = true; // Added muted attribute
        videoElement.autoplay = true;
        videoElement.style.objectFit = 'cover';
        videoElement.style.overflow = 'hidden';
        videoElement.style.width = '100%';
        videoElement.style.height = '100%';
        videoElement.src = '/js/background/page_backgrounds/OGLUNCBGMobile.gif';
        
        pageBackground.appendChild(videoElement);
    } else {
        const backGround = document.body;

        const backgroundVideo = document.createElement('video');
        backgroundVideo.id = 'background-video';
        backgroundVideo.loop = true;
        backgroundVideo.autoplay = true;
        backgroundVideo.muted = true; 
        backgroundVideo.playsInline = true; // Note: use "playsInline" for JavaScript
        backgroundVideo.style.objectFit = 'cover';
        backgroundVideo.style.width = '100%';
        backgroundVideo.style.height = '100%';
        backgroundVideo.style.objectPosition = 'center';
        backgroundVideo.style.overflow = 'hidden';
        backgroundVideo.style.visibility = 'visible';
        backGround.appendChild(backgroundVideo);

        const backgroundVideo2 = document.createElement('video');
        backgroundVideo2.id = 'background-video2';
        backgroundVideo2.loop = true;
        backgroundVideo2.autoplay = true;
        backgroundVideo2.muted = true;
        backgroundVideo2.playsInline = true; // Note: use "playsInline" for JavaScript
        backgroundVideo2.style.objectFit = 'cover';
        backgroundVideo2.style.width = '100%';
        backgroundVideo2.style.height = '100%';
        backgroundVideo2.style.objectPosition = 'center';
        backgroundVideo2.style.overflow = 'hidden';
        backgroundVideo2.style.visibility = 'visible';
        backGround.appendChild(backgroundVideo2);

        const backgrounds = [backgroundVideo, backgroundVideo2];

        window.videoBackground = new VideoBackground('./js/background/load_static', backgrounds);
        window.videoBackground.loadSpecificVideo('./js/background/main_nft');
        window.videoBackground.loadJSON('./js/json/placeholder_vids.json');

        // Assuming you have buttons or other interactive elements to trigger transitions
        const pageBackground = document.getElementById('canvas');

        const videoElement = document.createElement('video');
        videoElement.loop = true;
        videoElement.muted = true; // Added muted attribute
        videoElement.autoplay = true;
        videoElement.style.objectFit = 'cover';
        videoElement.style.width = '100%';
        videoElement.style.height = '100%';
        videoElement.src = '/js/background/page_backgrounds/OGLUNCBG.mp4';
        
        pageBackground.appendChild(videoElement);
    }
}

function activateGloprint() {
    window.windowState = 'nft';
    window.luncMobile = new LuncMobile();
    if (window.luncMobile.isMobile()) {
        console.log('Mobile detected');
        window.luncMobile.loadJSON('./js/mobile/json/gaiaboy.json');
        
        const pageBackground = document.getElementById('canvas');

        const videoElement = document.createElement('img');
        videoElement.loop = true;
        videoElement.muted = true; // Added muted attribute
        videoElement.autoplay = true;
        videoElement.style.objectFit = 'cover';
        videoElement.style.overflow = 'hidden';
        videoElement.style.width = '100%';
        videoElement.style.height = '100%';
        videoElement.src = '/js/background/page_backgrounds/OGLUNCBGMobile.gif';
        
        pageBackground.appendChild(videoElement);
    } else {
        const backGround = document.body;

        const backgroundVideo = document.createElement('video');
        backgroundVideo.id = 'background-video';
        backgroundVideo.loop = true;
        backgroundVideo.autoplay = true;
        backgroundVideo.muted = true; 
        backgroundVideo.playsInline = true; // Note: use "playsInline" for JavaScript
        backgroundVideo.style.objectFit = 'cover';
        backgroundVideo.style.width = '100%';
        backgroundVideo.style.height = '100%';
        backgroundVideo.style.objectPosition = 'center';
        backgroundVideo.style.overflow = 'hidden';
        backgroundVideo.style.visibility = 'visible';
        backGround.appendChild(backgroundVideo);

        const backgroundVideo2 = document.createElement('video');
        backgroundVideo2.id = 'background-video2';
        backgroundVideo2.loop = true;
        backgroundVideo2.autoplay = true;
        backgroundVideo2.muted = true;
        backgroundVideo2.playsInline = true; // Note: use "playsInline" for JavaScript
        backgroundVideo2.style.objectFit = 'cover';
        backgroundVideo2.style.width = '100%';
        backgroundVideo2.style.height = '100%';
        backgroundVideo2.style.objectPosition = 'center';
        backgroundVideo2.style.overflow = 'hidden';
        backgroundVideo2.style.visibility = 'visible';
        backGround.appendChild(backgroundVideo2);

        const backgrounds = [backgroundVideo, backgroundVideo2];

        window.videoBackground = new VideoBackground('./js/background/load_static', backgrounds);
        window.videoBackground.loadSpecificVideo('./js/background/main_nft');
        window.videoBackground.loadJSON('./js/json/placeholder_vids.json');

        // Assuming you have buttons or other interactive elements to trigger transitions
        const pageBackground = document.getElementById('canvas');

        const videoElement = document.createElement('video');
        videoElement.loop = true;
        videoElement.muted = true; // Added muted attribute
        videoElement.autoplay = true;
        videoElement.style.objectFit = 'cover';
        videoElement.style.width = '100%';
        videoElement.style.height = '100%';
        videoElement.src = '/js/background/page_backgrounds/OGLUNCBG.mp4';
        
        pageBackground.appendChild(videoElement);
    }
}

function activateGlomint() {
    window.windowState = 'mint';
    window.nftMachine = new NftMachine();
    window.luncMobile = new LuncMobile();
    if (window.luncMobile.isMobile()) {
        console.log('Mobile detected');
        window.luncMobile.loadJSON('./js/mobile/json/gaiaboy.json');
        
        const pageBackground = document.getElementById('canvas');

        const videoElement = document.createElement('img');
        videoElement.loop = true;
        videoElement.muted = true; // Added muted attribute
        videoElement.autoplay = true;
        videoElement.style.objectFit = 'cover';
        videoElement.style.overflow = 'hidden';
        videoElement.style.width = '100%';
        videoElement.style.height = '100%';
        videoElement.src = '/js/background/page_backgrounds/OGLUNCBGMobile.gif';
        
        pageBackground.appendChild(videoElement);
    } else {
        const backGround = document.body;

        const backgroundVideo = document.createElement('video');
        backgroundVideo.id = 'background-video';
        backgroundVideo.loop = true;
        backgroundVideo.autoplay = true;
        backgroundVideo.muted = true; 
        backgroundVideo.playsInline = true; // Note: use "playsInline" for JavaScript
        backgroundVideo.style.objectFit = 'cover';
        backgroundVideo.style.width = '100%';
        backgroundVideo.style.height = '100%';
        backgroundVideo.style.objectPosition = 'center';
        backgroundVideo.style.overflow = 'hidden';
        backgroundVideo.style.visibility = 'visible';
        backGround.appendChild(backgroundVideo);

        const backgroundVideo2 = document.createElement('video');
        backgroundVideo2.id = 'background-video2';
        backgroundVideo2.loop = true;
        backgroundVideo2.autoplay = true;
        backgroundVideo2.muted = true;
        backgroundVideo2.playsInline = true; // Note: use "playsInline" for JavaScript
        backgroundVideo2.style.objectFit = 'cover';
        backgroundVideo2.style.width = '100%';
        backgroundVideo2.style.height = '100%';
        backgroundVideo2.style.objectPosition = 'center';
        backgroundVideo2.style.overflow = 'hidden';
        backgroundVideo2.style.visibility = 'visible';
        backGround.appendChild(backgroundVideo2);

        const backgrounds = [backgroundVideo, backgroundVideo2];

        window.videoBackground = new VideoBackground('./js/background/load_static', backgrounds);
        window.videoBackground.loadSpecificVideo('./js/background/main_nft');
        window.videoBackground.loadJSON('./js/json/placeholder_vids.json');

        // Assuming you have buttons or other interactive elements to trigger transitions
        const pageBackground = document.getElementById('canvas');

        const videoElement = document.createElement('video');
        videoElement.loop = true;
        videoElement.muted = true; // Added muted attribute
        videoElement.autoplay = true;
        videoElement.style.objectFit = 'cover';
        videoElement.style.width = '100%';
        videoElement.style.height = '100%';
        videoElement.src = '/js/background/page_backgrounds/OGLUNCBG.mp4';
        
        pageBackground.appendChild(videoElement);
    }
}

function activateGlomart() {
    window.windowState = 'marketplace';
    window.nftMachine = new NftMachine();
    window.luncMobile = new LuncMobile();
    if (window.luncMobile.isMobile()) {
        console.log('Mobile detected');
        window.luncMobile.loadJSON('./js/mobile/json/gaiaboy.json');
        
        const pageBackground = document.getElementById('canvas');

        const videoElement = document.createElement('img');
        videoElement.loop = true;
        videoElement.muted = true; // Added muted attribute
        videoElement.autoplay = true;
        videoElement.style.objectFit = 'cover';
        videoElement.style.overflow = 'hidden';
        videoElement.style.width = '100%';
        videoElement.style.height = '100%';
        videoElement.src = '/js/background/page_backgrounds/OGLUNCBGMobile.gif';
        
        pageBackground.appendChild(videoElement);
    } else {
        const backGround = document.body;

        const backgroundVideo = document.createElement('video');
        backgroundVideo.id = 'background-video';
        backgroundVideo.loop = true;
        backgroundVideo.autoplay = true;
        backgroundVideo.muted = true; 
        backgroundVideo.playsInline = true; // Note: use "playsInline" for JavaScript
        backgroundVideo.style.objectFit = 'cover';
        backgroundVideo.style.width = '100%';
        backgroundVideo.style.height = '100%';
        backgroundVideo.style.objectPosition = 'center';
        backgroundVideo.style.overflow = 'hidden';
        backgroundVideo.style.visibility = 'visible';
        backGround.appendChild(backgroundVideo);

        const backgroundVideo2 = document.createElement('video');
        backgroundVideo2.id = 'background-video2';
        backgroundVideo2.loop = true;
        backgroundVideo2.autoplay = true;
        backgroundVideo2.muted = true;
        backgroundVideo2.playsInline = true; // Note: use "playsInline" for JavaScript
        backgroundVideo2.style.objectFit = 'cover';
        backgroundVideo2.style.width = '100%';
        backgroundVideo2.style.height = '100%';
        backgroundVideo2.style.objectPosition = 'center';
        backgroundVideo2.style.overflow = 'hidden';
        backgroundVideo2.style.visibility = 'visible';
        backGround.appendChild(backgroundVideo2);

        const backgrounds = [backgroundVideo, backgroundVideo2];

        window.videoBackground = new VideoBackground('./js/background/load_static', backgrounds);
        window.videoBackground.loadSpecificVideo('./js/background/main_nft');
        window.videoBackground.loadJSON('./js/json/placeholder_vids.json');

        // Assuming you have buttons or other interactive elements to trigger transitions
        const pageBackground = document.getElementById('canvas');

        const videoElement = document.createElement('video');
        videoElement.loop = true;
        videoElement.muted = true; // Added muted attribute
        videoElement.autoplay = true;
        videoElement.style.objectFit = 'cover';
        videoElement.style.width = '100%';
        videoElement.style.height = '100%';
        videoElement.src = '/js/background/page_backgrounds/OGLUNCBG.mp4';
        
        pageBackground.appendChild(videoElement);
    }
}


  
  function router() {
    const path = window.location.pathname;
  
    // Deactivate everything first
    // deactivateAll();
  
    // Activate based on path
    switch(path) {
        case '/':
            // If home route, do nothing (since you have other code to handle it)
            activateHome();
            break;
        case '/leaderboard':
            activateLeaderboard();
            break;
        case '/luncman':
            activateLuncman();
            break;
        case '/gloprint':
            activateGloprint();
            break;
        case '/glomint':
            activateGlomint();
            break;
        case '/glomart':
            activateGlomart();
            break;
        default:
            activateDefault();
            break;
    } 
  }
  
  window.addEventListener('DOMContentLoaded', router);

  window.addEventListener('popstate', function(event) {
    // Reload the current page.
    location.reload();
});