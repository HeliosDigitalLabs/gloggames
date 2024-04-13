class Leaderboard {
    constructor() {
        console.log('Leaderboard constructor called');
        this.loading = false;
        this.hasMore = true;
        this.showHighscore = true; // Initially set to true for highscore
        this.isMyRankView = false;
        this.previousScrollTop = 0
        this.lastScrollTop = 0;
        this.isAttemptingScrollUp = false;
        this.originalHeading = '';
        this.isSearchActive = false;
        this.animateRows = true;
        this._lbHeadingText = '';
        this.originalHeading = 'HIGHEST SCORE';
        this.init();
        this.handleState();
    }

    init() {
        this.contentContainer = document.getElementById('content-container');
        this.retroCover = document.getElementById('retro-cover');
        window.addEventListener('WindowStateChanged', this.handleState.bind(this));

        this.playersMap = new Map();
        this.playersArray = [];
    }

    handleState() {
        switch (window.windowState) {
            case 'home':
                console.log('Setting website to home state for Leaderboard');
                this.createHomeElements();
                this.hideLeaderboard();
                break;
            
            case 'leaderboard':
                this.setLeaderboard();
                this.hideHomeElements();
                break;

            case 'luncman':
                this.hideHomeElements();
                this.hideLeaderboard();
                break;

            case 'nft':
                this.hideHomeElements();
                this.hideLeaderboard();
                break;

            default:
                this.hideLeaderboard();
                console.log("No leaderboard state found");
                break;
        }
    }

    createHomeElements() {
        // Check if the rectangle with the ID 'leaderboardElement' already exists
        const existingElement = document.getElementById('leaderboardElement');
        if (existingElement) {
            existingElement.style.display = 'flex';
            return; // If it exists, exit fthe function
        }

        // Create the rectangle
        this.rectangle = document.createElement('div');
        document.body.appendChild(this.rectangle);
        this.rectangle.id = 'leaderboardElement';

        // Apply styles to the rectangle
        this.rectangle.style.position = 'absolute';
        this.rectangle.style.backgroundColor = 'transparent';  // Make the inside of the rectangle transparent
        this.rectangle.style.cursor = 'pointer';
        window.videoBackground.addSetElement('leaderboardElement', 651.13, 739.50, 172.47, 17.19);
        // this.rectangle.style.border = '2px solid blue';  // Add a blue border

        // Add event listener for click event
        this.rectangle.addEventListener('click', this.switchState.bind(this));

        // Create the image
        this.hoverImage = document.createElement('img');
        this.hoverImage.src = '/style/graphics/hover/hover_LEADERBOARD.svg';
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
        console.log('Hiding home elements for Leaderboard');
        if (this.rectangle) this.rectangle.style.display = 'none';
    }

    switchState() {
        console.log('Switching state for Leaderboard');
        window.windowState = 'leaderboard';

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

    setLeaderboard() {
        this.setupRowObserver();
        if (this.container) {
            window.videoBackground.transitionTo('home_leaderboard', () => {
                this.container.style.display = 'block';
                this.navbarContainer.style.display = 'block';
                this.lbHeading.style.display = 'block';
                this.masterContainer.style.display = 'block';
                // handle fade in
                console.log('existing masterc fadein');
                gsap.to(this.masterContainer, {
                    opacity: 1,
                    duration: 1,
                });
            });
            return;
        }

        //create master container div for leaderboard content
        this.masterContainer = document.createElement('div');
        this.masterContainer.id = 'masterContainer';
        this.masterContainer.style.position = 'absolute';
        this.masterContainer.style.display = 'block'; 
        this.masterContainer.style.opacity = '0';
        document.body.appendChild(this.masterContainer);
        window.videoBackground.addSetElement('masterContainer', 720.63, 921.89, 58, 603);

        // handle fade in
        console.log('og masterc fadein');
        gsap.to(this.masterContainer, {
            opacity: 1,
            duration: 1,
            delay: 1
        });

        // Create container div
        this.container = document.createElement('div');
        this.container.id = 'leaderboardcontainer';
        this.container.classList.add('leaderboardcontainer');
        this.container.style.position = 'absolute';
        this.container.style.top = '7%';
        this.container.style.left = '50%';
        this.container.style.transform = 'translate(-49%, 0%)';
        this.container.style.fontSize = '1.5rem';
        this.container.style.overflowY = 'auto';
        this.container.style.height = '74.25vh';
        this.container.style.width = '68.5vh';
        this.container.style.display = 'none';
        this.container.style.flexDirection = 'column';
        this.container.style.opacity = '0.8';
        this.container.addEventListener('wheel', this.handleWheelEvent.bind(this));

        // Append custom CSS for scrollbar in the head of the document
        const styleSheet = document.createElement("style");
        styleSheet.type = "text/css";
        styleSheet.innerText = `
        #leaderboardcontainer::-webkit-scrollbar {
            width: 6px !important;
        }
        #leaderboardcontainer::-webkit-scrollbar-track {
            background: transparent !important;
        }
        #leaderboardcontainer::-webkit-scrollbar-thumb {
            background: #ffffff;
            border-radius: 10px !important;
        }
        @media screen and (max-width: 768px) {
            #leaderboardcontainer::-webkit-scrollbar {
            width: 6px !important;
            }
        }
        `;
        document.head.appendChild(styleSheet);

        // create navbar for leaderboard
        this.navbarContainer = document.createElement('div');
        this.navbarContainer.id = 'navbarContainer';
        this.navbarContainer.style.position = 'fixed'; // Fixed position
        this.navbarContainer.style.bottom = '10%';
        this.navbarContainer.style.left = '50%';
        this.navbarContainer.style.width = '68vh'; // Full width
        this.navbarContainer.style.height = '50px'; // Adjust as needed
        this.navbarContainer.style.left = '50%';
        this.navbarContainer.style.transform = 'translate(-50%, 0%)';   
        this.navbarContainer.style.display = 'none';
        this.navbarContainer.style.zIndex = '1';
        this.navbarContainer.style.opacity = '0.8';
        this.masterContainer.appendChild(this.navbarContainer);

        //create a search icon
        this.searchIcon = document.createElement('div');
        this.searchIcon.id = 'lbSearch';
        this.searchIcon.style.position = 'absolute';
        this.searchIcon.style.bottom = '3%';
        this.searchIcon.style.left = '3%';
        this.searchIcon.style.backgroundImage = 'url(./style/graphics/whitesearch.png)';
        this.searchIcon.style.backgroundSize = '100%';
        this.searchIcon.style.height = '1.75vw';
        this.searchIcon.style.width = '1.75vw';
        this.searchIcon.style.cursor = 'pointer';
        this.navbarContainer.appendChild(this.searchIcon);
        // Hover event listener for the search icon
        this.searchIcon.addEventListener('mouseover', () => {
            if (this.searchInput.style.display === 'block') {
                gsap.to(this.searchIcon, {
                    duration: 0.1,
                    opacity: 0,
                    onComplete: () => {
                        this.searchIcon.style.backgroundImage = 'url(./style/graphics/xicon.png)';
                        gsap.to(this.searchIcon, { opacity: 0.8, duration: 0.1 });
                    }
                });
            }
        });

        this.searchIcon.addEventListener('mouseout', () => {
            if (this.searchInput.style.display === 'block') {
                gsap.to(this.searchIcon, {
                    duration: 0.1,
                    opacity: 0,
                    onComplete: () => {
                        this.searchIcon.style.backgroundImage = 'url(./style/graphics/whitesearch.png)';
                        gsap.to(this.searchIcon, { opacity: 0.8, duration: 0.1 });
                    }
                });
            }
        });

        // Create the search input
        this.searchInput = document.createElement('input');
        this.searchInput.id = 'lbSearchInput';
        this.searchInput.type = 'text';
        this.searchInput.placeholder = 'Search...';
        this.searchInput.style.position = 'absolute';
        this.searchInput.style.bottom = '20%';
        this.searchInput.style.left = '11%';
        this.searchInput.style.width = '0'; // Start with a width of 0
        this.searchInput.style.display = 'none'; // Initially hidden
        this.searchInput.autocomplete = 'off';
        this.navbarContainer.appendChild(this.searchInput);
        this.searchInput.addEventListener('input', this.handleSearchInput.bind(this));

     // This method was previously missing the closing '}' for the `else` block
     this.searchIcon.addEventListener('click', () => {
        const isSearchActive = this.searchInput.style.display === 'block';
    
        // Start the click animation with GSAP
        gsap.to(this.searchIcon, {
            scale: 0.8,
            duration: 0.1,
            repeat: 1,
            yoyo: true,
            onComplete: () => {
                // After the scale animation, proceed with the search toggle
                if (isSearchActive) {
                    // Close the search input and animate
                    gsap.to(this.searchInput, {
                        duration: 0.5,
                        width: 0,
                        onComplete: () => {
                            this.searchInput.style.display = 'none';
                            this.searchInput.value = ''; // Clear the search input
            
                            // Update heading text
                            if (this.isMyRankView) {
                                this.lbHeadingText = this.showHighscore ? 'HIGHEST SCORE' : 'HIGHEST LEVEL';
                            } else {
                                this.lbHeadingText = this.originalHeading;
                            }
            
                            // Change icon to search icon only after the search input is fully closed
                            this.searchIcon.style.backgroundImage = 'url(./style/graphics/whitesearch.png)';
                            
                            // Update UI elements after closing the search
                            // this.toggleLabel.style.display = 'block';
                            this.myRank.style.display = 'block';
            
                            // Fetch all players to refresh the leaderboard
                            this.fetchAllPlayers();
                            this.resetSearchState();
                        }
                    });
                } else {
                    // Open the search input and animate
                    this.searchInput.style.display = 'block';
                    gsap.to(this.searchInput, {
                        duration: 0.5,
                        width: '85%', // Animate to full width
                    });
                    this.originalHeading = this.lbHeading.innerText; // Store the current heading
                    this.lbHeadingText = 'Search...';
                    this.searchInput.focus();
            
                    // Change icon to x icon
                    this.searchIcon.style.backgroundImage = 'url(./style/graphics/xicon.png)';
                    
                    // Hide toggleLabel and myRank as the search is now active
                    // this.toggleLabel.style.display = 'none';
                    this.myRank.style.display = 'none';
                }
            } // This closing bracket ends the onComplete function
        }); // This closing bracket ends the gsap.to call
    }); // This closing bracket ends the event listener block



//TEMP FOR DEMO
        // Create or update the checkbox input
        // this.toggleInput = document.getElementById('toggleInput') || document.createElement('input');
        // this.toggleInput.id = 'toggleInput';
        // this.toggleInput.type = 'checkbox';
        // this.toggleInput.style.height = '0';
        // this.toggleInput.style.width = '0';
        // this.toggleInput.style.visibility = 'hidden';

        // // Create or update the label
        // this.toggleLabel = document.getElementById('toggleLabel') || document.createElement('label');
        // this.toggleLabel.htmlFor = 'toggleInput';
        // this.toggleLabel.style.cursor = 'pointer';
        // this.toggleLabel.style.textIndent = '-9999px';
        // this.toggleLabel.style.width = '6rem';
        // this.toggleLabel.style.height = '3rem';
        // this.toggleLabel.style.background = '#bada55'; // Active state color for highscore
        // this.toggleLabel.style.display = 'block';
        // this.toggleLabel.style.borderRadius = '3rem';
        // this.toggleLabel.style.position = 'absolute';
        // this.toggleLabel.style.left = '50%';
        // this.toggleLabel.style.bottom = '3%';
        // this.toggleLabel.style.transform = 'translate(-50%, 0%)';

        // // Create or update the inner circle
        // this.innerCircle = this.toggleLabel.querySelector('.inner-circle') || document.createElement('span');
        // this.innerCircle.classList.add('inner-circle');
        // this.innerCircle.style.content = '';
        // this.innerCircle.style.position = 'absolute';
        // this.innerCircle.style.top = '5px';
        // this.innerCircle.style.left = 'calc(100% - 5px)'; // Position inner circle to the right
        // this.innerCircle.style.transform = 'translateX(-100%)'; // Adjust transform for positioning
        // this.innerCircle.style.width = '2.4rem';
        // this.innerCircle.style.height = '2.4rem';
        // this.innerCircle.style.background = '#fff';
        // this.innerCircle.style.borderRadius = '90px';
        // this.innerCircle.style.transition = '0.3s';

        // this.toggleLabel.appendChild(this.innerCircle);
        // this.navbarContainer.appendChild(this.toggleInput);
        // this.navbarContainer.appendChild(this.toggleLabel);

        // // Bind the toggleDisplay method to the change event of the checkbox
        // this.toggleInput.addEventListener('change', this.toggleDisplay.bind(this));

        //create myrank button
        this.myRank = document.createElement('div');
        this.myRank.id = 'myRank';
        this.myRank.style.position = 'absolute';
        this.myRank.style.bottom = '3%';
        this.myRank.style.right = '3.5%';
        this.myRank.style.backgroundImage = 'url(./style/graphics/youicon.png)';
        this.myRank.style.backgroundSize = '100%';
        this.myRank.style.height = '1.75vw';
        this.myRank.style.width = '1.75vw';
        this.myRank.style.cursor = 'pointer';
        this.navbarContainer.appendChild(this.myRank);
        this.myRank.addEventListener('click', () => {
            // Trigger the fetchMyRankData and update the heading text
            this.fetchMyRankData();
            this.lbHeadingText = 'My Rank';
        
            // Start GSAP animation
            gsap.fromTo(this.myRank, 
                { scale: 1 }, // from scale
                { scale: 0.8, // to scale
                  duration: 0.1, // animation duration
                  repeat: 1, // repeat the animation once
                  yoyo: true, // make the animation go back to the original state
                  ease: 'power1.out', // easing function for the animation
                  onComplete: () => {
                      // Optional callback after animation completes
                  }
            });
        });
        

        //create a leaderboard heading
        this.lbHeading = document.createElement('div');
        this.lbHeading.id = 'lbHeading';
        this.lbHeading.style.position = 'absolute';
        this.lbHeading.style.left = '50%';
        this.lbHeading.style.transform = 'translate(-50%, 0%)';
        this.lbHeading.style.top = '1%';
        this.lbHeading.style.fontFamily = '"Gabarito", sans-serif'; // Using a fallback font
        this.lbHeading.style.fontSize = '2.55vw';
        this.lbHeading.style.fontWeight = '1000';
        this.lbHeading.style.color = 'white';
        this.lbHeading.style.textShadow = '0px 4px 8px rgba(0, 0, 0, 0.5)'; // Soft shadow for 3D effect
        this.lbHeading.style.letterSpacing = '0.05em'; // Slight letter spacing for elegance
        this.lbHeading.style.textAlign = 'center'; // Ensure text is centered
        this.lbHeading.style.userSelect = 'none'; // Prevent text selection for a cleaner look
        this.lbHeading.style.webkitFontSmoothing = 'antialiased'; // Enhance text rendering on WebKit browsers
        this.lbHeading.style.mozOsxFontSmoothing = 'grayscale'; // Enhance text rendering on Firefox
        this.lbHeading.style.margin = '0'; // Reset default margin
        this.lbHeading.style.padding = '0'; // Reset default padding
        this.lbHeading.style.lineHeight = '1.2'; // Adjust line height for better readability 
        this.lbHeading.style.display = 'none';     
        this.lbHeading.style.opacity = '0.8';  
        this.lbHeading.style.width = '95%';
        this.masterContainer.appendChild(this.lbHeading);

        // Ensure the checkbox is initially checked
        // this.toggleInput.checked = true;

        // Update the heading text initially
        this.lbHeadingText = 'HIGHEST SCORE';
    
        // Create table content
        this.table = document.createElement('table');
        this.table.style.width = '100%';
        this.container.appendChild(this.table);

        
        // Fill table with entries, apply glowing effect, spacing, and column widths
        this.tbody = document.createElement('tbody');
        this.table.appendChild(this.tbody);

        // Append container to the body
        this.masterContainer.appendChild(this.container);
    
        this.fetchLeaderboardData(0, 21); // Fetch the first 10 entries

         // Debounce the scroll event on the container
        let timeout;
        this.container.addEventListener('scroll', () => {
            console.log('Scroll event handling in leaderboard container');
            if (!this.isSearchActive && this.lbHeadingText !== this.originalHeading) {
                this.lbHeadingText = this.originalHeading;
            }
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                this.handleContainerScroll();
            }, 100);
        });

        
        window.videoBackground.transitionTo('home_leaderboard', () => {
            this.container.style.display = 'flex';
            this.lbHeading.style.display = 'block';
            this.navbarContainer.style.display = 'flex';
        });
    }

    toggleDisplay() {


        // Update the showHighscore flag based on the checkbox state
        // this.showHighscore = this.toggleInput.checked;

        // Update the styling of the toggle button based on the state
        // if (this.toggleInput.checked) {
            // this.toggleLabel.style.background = '#bada55';
            // this.innerCircle.style.left = 'calc(100% - 5px)';
            // this.innerCircle.style.transform = 'translateX(-100%)';
            this.lbHeadingText = 'HIGHEST SCORE';
        // } else {
        //     this.toggleLabel.style.background = 'grey';
        //     this.innerCircle.style.left = '5px';
        //     this.innerCircle.style.transform = 'translateX(0)';
        //     this.lbHeadingText = 'HIGHEST LEVEL';
        // }

        // Set animateRows to true to enable animation for repopulation
        this.animateRows = true;

        // Refresh the leaderboard to reflect the new state
        this.refreshLeaderboard();
    }  

    async fetchAllPlayers() {
        // Fetch all players from the server
        try {
            const response = await fetch(`/api/leaderboard?offset=0&limit=50`); // Adjust the limit as needed
            const data = await response.json();
            this.clearLeaderboardData();
            this.createPlayers(data);
        } catch (err) {
            console.error('Error fetching all players:', err);
        }
    }

    handleSearchInput() {
        const searchTerm = this.searchInput.value;
        this.lbHeadingText = `Search for ${searchTerm}`; // Directly set the text without animation
        this.fetchSearchResults(searchTerm);
        this.isSearchActive = true;
    }
    
    resetSearchState() {
        this.isSearchActive = false; // Reset search flag
    }

    async fetchSearchResults(searchTerm) {
        try {
            // Encode the searchTerm for URL safety
            const encodedSearchTerm = encodeURIComponent(searchTerm);
            const response = await fetch(`/api/searchLeaderboard?startsWith=${encodedSearchTerm}`);
            const data = await response.json();
            this.clearLeaderboardData();
            this.createPlayers(data);
        } catch (err) {
            console.error('Error fetching search results:', err);
        }
    }
    

    handleWheelEvent(event) {
        if (this.container.scrollTop === 0 && event.deltaY < 0) {
            this.isAttemptingScrollUp = true;
            this.handleContainerScroll();
        }
    }

    handleContainerScroll() {
        if (this.isSearchActive) {
            return;
        }
        console.log('handleContainerScroll called');
        const atBottom = this.container.scrollTop + this.container.clientHeight >= this.container.scrollHeight;
        const atTop = this.container.scrollTop === 0;
    
        if (this.loading || !this.hasMore) {
            console.log(`Exiting scroll handling - Loading: ${this.loading}, Has More: ${this.hasMore}`);
            return;
        }
    
        if (this.isAttemptingScrollUp && atTop) {
            console.log('Attempting to scroll up at the top');
            this.handleScrollingUp();
            this.isAttemptingScrollUp = false; // Reset the flag
        } else if (atBottom) {
            console.log('At bottom, loading more content');
            this.handleScrollingDown();
        }
    }
    
    handleScrollingDown() {
        this.loading = true;
        const endpoint = this.isMyRankView ? 
            `/api/leaderboard?offset=${this.calculateNewOffsetBasedOnRank()}&limit=10` :
            `/api/leaderboard?offset=${this.playersArray.length}&limit=10`;
        this.fetchLeaderboardDataFromEndpoint(endpoint);
    }
    
    handleScrollingUp() {
        if (this.loading || !this.hasMore || this.playersArray.length === 0) {
            console.log('Cannot load more data.');
            return;
        }
    
        this.loading = true;
        const firstPlayerId = this.playersArray[0];
        const firstPlayer = this.playersMap.get(firstPlayerId);
    
        if (!firstPlayer || !firstPlayer.playerInfo || !firstPlayer.playerInfo.ranks) {
            console.error('Rank information is not available for the first player.');
            this.loading = false;
            return;
        }
    
        const rankType = this.showHighscore ? 'luncRank' : 'levelRank';
        const firstPlayerRank = firstPlayer.playerInfo.ranks[rankType];
    
        if (typeof firstPlayerRank === 'undefined') {
            console.error('Specific rank type is not available in player ranks.');
            this.loading = false;
            return;
        }
    
        // Calculate the new offset. Here, you might want to adjust this logic based on your specific needs.
        const newOffset = Math.max(0, firstPlayerRank - 3); // Adjust this value as needed
    
        console.log('newOffset:', newOffset);
    
        this.fetchLeaderboardDataFromEndpoint(`/api/leaderboard?offset=${newOffset}&limit=10`, true)
    }
    

    
 
fetchLeaderboardDataFromEndpoint(endpoint, isScrollingUp = false) {
    fetch(endpoint)
        .then(response => response.json())
        .then(data => {
            if (isScrollingUp) {
                this.prependPlayers(data);
            } else {
                this.createPlayers(data);
            }
            this.loading = false;
        })
        .catch(err => {
            console.error('Error fetching leaderboard data:', err);
            this.loading = false;
        });
}

    
prependPlayers(data) {
    const oldScrollTop = this.container.scrollTop;
    const oldScrollHeight = this.container.scrollHeight;
    
    // Prepend players to the array and update the map
    data.reverse().forEach(playerData => {
        if (!this.playersMap.has(playerData.walletID)) {
            const player = new Player('leaderboard', playerData);
            this.playersMap.set(playerData.walletID, player);
            this.playersArray.unshift(playerData.walletID);
        }
    });

    // Update the leaderboard display
    this.sortAndDisplayLeaderboard();

    requestAnimationFrame(() => {
        const newScrollHeight = this.container.scrollHeight;
        const scrollOffset = newScrollHeight - oldScrollHeight;
        this.container.scrollTop = oldScrollTop + scrollOffset;
    });
}  

    calculateNewOffsetBasedOnRank() {
        // Check if client, gloInfo, and ranks are defined
        if (!window.client || !window.client.gloInfo || !window.client.gloInfo.luncRank || !window.client.gloInfo.levelRank) {
            console.error('Rank information is not available.');
            return 0; // Return a default offset (e.g., 0) or handle this case as per your application's logic
        }
    
        // Determine the rank based on the current sorting criteria
        const playerRank = this.showHighscore ? window.client.gloInfo.luncRank : window.client.gloInfo.levelRank;
    
        // Check if playerRank is a valid number
        if (typeof playerRank !== 'number') {
            console.error('Invalid player rank:', playerRank);
            return 0; // Return a default offset or handle this case appropriately
        }
    
        // Range defines how many records around the player's rank should be loaded
        const range = 5;
    
        // Calculate the next offset based on the player's rank and the range
        const nextOffset = Math.max(0, playerRank + range - 10);
    
        return nextOffset;
    }
    

    calculateNewOffsetForScrollingUp() {
        console.log(`Calculating new offset for scrolling up. First player rank: ${this.playersArray.length > 0 ? this.playersMap.get(this.playersArray[0]).playerInfo.rank : 'N/A'}`);
        if (this.playersArray.length === 0) {
            return 0;
        }
        const firstPlayerRank = this.playersMap.get(this.playersArray[0]).playerInfo.rank;
        // Adjust the calculation logic if necessary
        return Math.max(0, firstPlayerRank - 11); // Example logic
    }
    
    

    async fetchLeaderboardData(offset, limit) {
        if (this.loading) return;
        this.loading = true;
        
        const endpoint = `/api/leaderboard?offset=${offset}&limit=${limit}`;
        try {
            const response = await fetch(endpoint);
            const newPlayers = await response.json();
            if (newPlayers.length < limit) {
                this.hasMore = false;
            }
            this.createPlayers(newPlayers, offset);
        } catch (err) {
            console.error('Error fetching leaderboard data:', err);
        } finally {
            this.loading = false;
        }
    }

    createPlayers(data, offset = 0) {
        if (!Array.isArray(data)) {
            console.error('Data is not an array:', data);
            return;
        }
        data.forEach(playerData => {
            if (!this.playersMap.has(playerData.walletID) && playerData.ranks) {
                // Ensure ranks are available
                const player = new Player('leaderboard', playerData);
                this.playersMap.set(playerData.walletID, player);
                this.playersArray.unshift(playerData.walletID);
            }
        });
    
        this.sortAndDisplayLeaderboard();
    }
    

    sortAndDisplayLeaderboard() {
        // Sort based on the selected rank type (luncRank or levelRank)
        const rankType = this.showHighscore ? 'luncRank' : 'levelRank';
    
        this.playersArray.sort((aId, bId) => {
            const playerA = this.playersMap.get(aId);
            const playerB = this.playersMap.get(bId);
            return playerA.playerInfo.ranks[rankType] - playerB.playerInfo.ranks[rankType];
        });
    
        this.populateLeaderboard();
    }
    
    populateLeaderboard() {
        // Clear existing rows in the table body
        this.tbody.innerHTML = '';
    
        // Ensure playersArray and playersMap are defined and not empty
        if (!Array.isArray(this.playersArray) || this.playersArray.length === 0 || !this.playersMap) {
            console.error('No players data available for leaderboard population.');
            return;
        }
    
        // Iterate over the playersArray to populate the table
        this.playersArray.forEach((walletID, index) => {
            const player = this.playersMap.get(walletID);
            if (!player) {
                console.error(`Player data not found for walletID: ${walletID}`);
                return;
            }
            if (!player.playerInfo) {
                console.error(`Player info not found for walletID: ${walletID}`);
                return;
            }
            const playerInfo = player.playerInfo;
            
            // Determine the rank to display based on the leaderboard sorting
            const rankToDisplay = this.showHighscore ? playerInfo.ranks.luncRank : playerInfo.ranks.levelRank;


            // Log playerInfo to debug
            console.log(`Player info for ${walletID}:`, playerInfo);

            // row element
            const row = document.createElement('tr');
            this.tbody.appendChild(row);

            // Animate the row if animateRows is true
            if (this.animateRows) {
                this.animateRow(row, index);
            }

            // Observe each row
            this.rowObserver.observe(row);

            // Rank cell
            const rankCell = document.createElement('td');
            rankCell.textContent = `#${rankToDisplay}`; // Use rank from playerInfo
            rankCell.style.fontSize = '1.5vw';
            rankCell.style.position = 'relative';
            rankCell.style.fontFamily = 'Press Start 2P';
            rankCell.style.left = '5%';
            rankCell.classList.add('glowing-white-text', 'spaced-cell', 'rank-cell');
            row.appendChild(rankCell);
    
            // GloTag cell
            const gloTagCell = document.createElement('td');
            gloTagCell.classList.add('spaced-cell');
            gloTagCell.style.display = 'flex';
            gloTagCell.style.justifyContent = 'center';
            gloTagCell.style.width = '11.11vw';
            gloTagCell.style.height = '2.75vw';
            gloTagCell.style.position = 'relative';
            gloTagCell.style.left = '63%';
            gloTagCell.style.transform = 'translate(-50%, 0%)';
            const gloTagDiv = document.createElement('div');
            gloTagDiv.style.position = 'relative';
            console.log('setting glotag for', player)
            gloTagDiv.style.background = player.glotagSrc;
            gloTagDiv.style.backgroundSize = 'cover';
            gloTagDiv.style.borderRadius = '1rem';
            gloTagDiv.style.alignItems = 'center';
            gloTagDiv.style.cursor = 'pointer';
            gloTagDiv.style.boxShadow = player.glotagBoxShadowSrc;
            gloTagDiv.style.width = '15vw';
            gloTagDiv.style.display = 'flex';
            gloTagDiv.style.height = '100%';
            gloTagDiv.addEventListener('click', () => this.handleLbPlayerClick(player));
            const circleDiv = document.createElement('div');
            circleDiv.style.background = player.pfpSrc;
            circleDiv.style.backgroundSize = 'cover';
            circleDiv.style.borderRadius = '50%';
            circleDiv.style.width = 'auto';
            circleDiv.style.aspectRatio = '1';
            circleDiv.style.height = '50%';
            circleDiv.style.position = 'relative';
            circleDiv.style.left = '5%';
            gloTagDiv.appendChild(circleDiv);
            // Nickname div with cropped text if longer than 10 characters
            const nicknameDiv = document.createElement('div');
            let nicknameText = playerInfo.nickname.length > 9 
                               ? playerInfo.nickname.substring(0, 5) + '...' + playerInfo.nickname.substring(playerInfo.nickname.length - 3) 
                               : playerInfo.nickname;
            nicknameDiv.textContent = nicknameText;
            nicknameDiv.style.fontSize = '1.5vw';
            nicknameDiv.style.fontFamily = 'Gabarito';
            nicknameDiv.style.color = player.glotagTextColorSrc;
            nicknameDiv.style.fontWeight = 'bold';
            nicknameDiv.style.position = 'absolute';
            nicknameDiv.style.left = '27.5%';
            gloTagDiv.appendChild(nicknameDiv);
            const levelDiv = document.createElement('div');
            levelDiv.textContent = playerInfo.gloLvl;
            levelDiv.style.fontSize = '1.25rem';
            levelDiv.style.color = 'white';
            levelDiv.style.position = 'absolute';
            levelDiv.style.right = '7%';
            levelDiv.style.top = '10%';
            levelDiv.style.fontFamily = 'Gabarito';
            levelDiv.style.display = 'none' //TEMPORARY FOR DEMO
            gloTagDiv.appendChild(levelDiv);
            gloTagCell.appendChild(gloTagDiv);
            row.appendChild(gloTagCell);
    
            // Highscore cell
            const highscoreCell = document.createElement('td');
            highscoreCell.textContent = playerInfo.highscore;
            highscoreCell.classList.add('glowing-white-text', 'spaced-cell');
            highscoreCell.style.padding = '10px';
            highscoreCell.style.fontSize = '1.5vw';
            highscoreCell.style.textAlign = 'center';
            highscoreCell.style.alignItems = 'center';
            highscoreCell.style.fontFamily = 'Gabarito';
            highscoreCell.style.width = '30%';
            row.appendChild(highscoreCell);
        });

        // Set animateRows to false after animation
        this.animateRows = false;
    }

    async handleLbPlayerClick(player){
        if (!window.client.gloSession) return;
        console.log("hanling lb player:", player);
        console.log("players map:", this.playersMap);
        player.updatePlayerInfo();
    }

    animateRow(row, index) {
        row.dataset.isAnimating = 'true';
    
        gsap.from(row, {
            autoAlpha: 0,
            y: 20,
            duration: 0.5,
            delay: index * 0.05,
            ease: 'power1.out',
            onComplete: () => {
                delete row.dataset.isAnimating;
            }
        });
    }
    
    
    refreshLeaderboard() {
        this.isMyRankView = false;
        this.tbody.innerHTML = ''; // Clear existing rows
        this.fetchLeaderboardData(0, 11); // Re-fetch data
    }
    

    hideLeaderboard() {
        if (!this.container) return;
        if (window.windowState !== 'leaderboard') this.container.style.display = 'none';
        if (window.windowState !== 'leaderboard' && this.masterContainer) this.masterContainer.style.display = 'none';
        gsap.to(this.masterContainer, {
            opacity: 0,
            duration: .15,
            onComplete: () => {
                this.container.style.display = 'none';
                this.masterContainer.style.display = 'none';
                this.lbHeading.style.display = 'none';
                this.navbarContainer.style.display = 'none';
            }
        });
    }
    
    clearLeaderboardData() {
        this.playersMap.clear();
        this.playersArray = [];
        this.tbody.innerHTML = ''; // Clear the leaderboard display

        // Set animateRows to true to enable animation for the next population
        this.animateRows = true;

        // Unobserve each row before clearing
        this.tbody.querySelectorAll('tr').forEach(row => {
            this.rowObserver.unobserve(row);
        });


    }

    // Function to fetch player's rank and surrounding players
    fetchMyRankData() {
        // Check if the user is signed in
        if (window.client.gloInfo.walletID === 'guest') {
            console.log('Not signed in');
            return; // Exit the function if not signed in
        }
        const rankType = this.showHighscore ? 'luncRank' : 'levelRank';
        const endpoint = `/api/myrank?rankType=${rankType}&walletID=${window.client.gloInfo.walletID}`;
    
        fetch(endpoint)
        .then(response => {
            console.log('Raw response:', response);
            return response.json();
        })
            .then(data => {
                this.clearLeaderboardData(); 
                this.isMyRankView = true;
                this.createPlayers(data, 0); 
                this.scrollToPlayerRank(); 
            })
            .catch(err => console.error('Error fetching my rank data:', err));
    }
    

    scrollToPlayerRank() {
        const playerRankElement = this.tbody.querySelector(`#player-${window.client.gloInfo.walletID}`);
        if (playerRankElement) {
          // Scroll the container so that the player's rank element is at the top
          this.container.scrollTop = playerRankElement.offsetTop;
        }
      } 

      setupRowObserver() {
        const options = {
            root: this.container, // use the leaderboard container as root
            rootMargin: '0px',
            threshold: 0.1 // trigger callback when 10% of the row is visible
        };
    
        this.rowObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const isAnimating = entry.target.dataset.isAnimating;
        
                if (entry.isIntersecting && !isAnimating) {
                    gsap.to(entry.target, {
                        autoAlpha: 1, // fade in
                        y: 0,
                        duration: 0.5,
                        ease: 'power1.out'
                    });
                } else if (!isAnimating) {
                    gsap.to(entry.target, {
                        autoAlpha: 0, // fade out
                        y: -20,
                        duration: 0.5,
                        ease: 'power1.out'
                    });
                }
            });
        }, options);        
    }
      

    set lbHeadingText(newText) {
        if (newText !== this._lbHeadingText) {
            this._lbHeadingText = newText;
            this.animateTextChange(newText);
        }
    }
    
    get lbHeadingText() {
        return this._lbHeadingText;
    }
    
    animateTextChange(newText, animate = true) {
        const lbHeading = this.lbHeading;
    
        if (animate) {
            gsap.to(lbHeading, {
                duration: 0.5,
                autoAlpha: 0,
                onComplete: () => {
                    lbHeading.innerText = newText;
                    gsap.to(lbHeading, {
                        duration: 0.5,
                        autoAlpha: 0.8
                    });
                }
            });
        } else {
            lbHeading.innerText = newText;
        }
    }
}