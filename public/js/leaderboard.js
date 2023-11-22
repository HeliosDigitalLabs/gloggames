class Leaderboard {
    constructor() {
        console.log('Leaderboard constructor called');
        this.loading = false;
        this.hasMore = true; // To check if more data is available
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
                console.log("No leaderboard state found");
                break;
        }
    }

    createHomeElements() {
        // Check if the rectangle with the ID 'leaderboardElement' already exists
        const existingElement = document.getElementById('leaderboardElement');
        if (existingElement) {
            existingElement.style.display = 'flex';
            window.videoBackground.transitionTo('home', () => {
            });
            return; // If it exists, exit the function
        }
        //set home bg
        window.videoBackground.transitionTo('home', () => {
        });

        // Create the rectangle
        this.rectangle = document.createElement('div');
        this.rectangle.id = 'leaderboardElement';

        // Apply styles to the rectangle
        this.rectangle.style.position = 'absolute';
        this.rectangle.style.bottom = '0';  // Place it on the bottom edge
        this.rectangle.style.left = '10%';  // Start from the left, 10% from the edge
        this.rectangle.style.width = '20vw';  // Width of the rectangle, adjust as needed
        this.rectangle.style.height = '50vh';  // Height of the rectangle, adjust as needed
        this.rectangle.style.backgroundColor = '#333';  // Color of the rectangle, adjust as needed

        // Add event listener for click event
        this.rectangle.addEventListener('click', this.switchState.bind(this));

        // Append the rectangle to the body
        document.body.appendChild(this.rectangle);
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
    }

    setLeaderboard() {
        if (this.container) {
            this.container.style.display = 'flex';
            window.videoBackground.transitionTo('main_lb', () => {
            });
            return;
        }
        window.videoBackground.transitionTo('main_lb', () => {
        });
        // Create container div
        this.container = document.createElement('div');
        this.container.id = 'leaderboardcontainer';
        this.container.classList.add('leaderboardcontainer');
        this.container.style.position = 'absolute';
        this.container.style.top = '3.5%';
        this.container.style.left = '50%';
        this.container.style.transform = 'translate(-47%, 0%)';
        this.container.style.fontSize = '1.5rem';
        this.container.style.overflowY = 'auto';
        this.container.style.height = '74vh';
        this.container.style.width = '63vh';

        //create a search icon
        this.searchIcon = document.createElement('div');
        this.searchIcon.id = 'lbSearch';
        this.searchIcon.style.position = 'absolute';
        this.searchIcon.style.top = '3%';
        this.searchIcon.style.left = '3%';
        this.searchIcon.style.backgroundImage = 'url(./style/graphics/searchicon.png)';
        this.searchIcon.style.backgroundSize = '100%';
        this.searchIcon.style.height = '2.5rem';
        this.searchIcon.style.width = '2.5rem';

        this.container.appendChild(this.searchIcon);

        // Create or update the checkbox input
        this.toggleInput = document.getElementById('toggleInput') || document.createElement('input');
        this.toggleInput.id = 'toggleInput';
        this.toggleInput.type = 'checkbox';
        this.toggleInput.style.height = '0';
        this.toggleInput.style.width = '0';
        this.toggleInput.style.visibility = 'hidden';

        // Create or update the label
        this.toggleLabel = document.getElementById('toggleLabel') || document.createElement('label');
        this.toggleLabel.htmlFor = 'toggleInput';
        this.toggleLabel.style.cursor = 'pointer';
        this.toggleLabel.style.textIndent = '-9999px';
        this.toggleLabel.style.width = '6rem';
        this.toggleLabel.style.height = '3rem';
        this.toggleLabel.style.background = 'grey';
        this.toggleLabel.style.display = 'block';
        this.toggleLabel.style.borderRadius = '3rem';
        this.toggleLabel.style.position = 'absolute';
        this.toggleLabel.style.left = '50%';
        this.toggleLabel.style.transform = 'translate(-50%, 0%)';

        // Create or update the inner circle
        this.innerCircle = this.toggleLabel.querySelector('.inner-circle') || document.createElement('span');
        this.innerCircle.classList.add('inner-circle');
        this.innerCircle.style.content = '';
        this.innerCircle.style.position = 'absolute';
        this.innerCircle.style.top = '5px';
        this.innerCircle.style.left = '5px';
        this.innerCircle.style.width = '2.4rem';
        this.innerCircle.style.height = '2.4rem';
        this.innerCircle.style.background = '#fff';
        this.innerCircle.style.borderRadius = '90px';
        this.innerCircle.style.transition = '0.3s';

        this.toggleLabel.appendChild(this.innerCircle);
        this.container.appendChild(this.toggleInput);
        this.container.appendChild(this.toggleLabel);

        // Bind the toggleDisplay method to the change event of the checkbox
        this.toggleInput.addEventListener('change', this.toggleDisplay.bind(this));
    
        // Create table
        this.table = document.createElement('table');
        this.table.style.marginTop = '10%';
        this.container.appendChild(this.table);

        
        // Fill table with entries, apply glowing effect, spacing, and column widths
        this.tbody = document.createElement('tbody');
        this.table.appendChild(this.tbody);

        // Append container to the body
        document.body.appendChild(this.container);
    
        this.fetchLeaderboardData(0, 11); // Fetch the first 10 entries

         // Debounce the scroll event on the container
        let timeout;
        this.container.addEventListener('scroll', () => {
            console.log('Scroll event handling in leaderboard container');
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                this.handleContainerScroll();
            }, 100);
        });
    }

    toggleDisplay() {
        // Update the showHighscore flag based on the checkbox state
        this.showHighscore = this.toggleInput.checked;

        // Update the styling of the toggle button based on the state
        if (this.toggleInput.checked) {
            this.toggleLabel.style.background = '#bada55';
            this.innerCircle.style.left = 'calc(100% - 5px)';
            this.innerCircle.style.transform = 'translateX(-100%)';
        } else {
            this.toggleLabel.style.background = 'grey';
            this.innerCircle.style.left = '5px';
            this.innerCircle.style.transform = 'translateX(0)';
        }

        // Refresh the leaderboard to reflect the new state
        this.refreshLeaderboard();
    }  

    handleContainerScroll() {
        console.log('handling leaderboard container scroll!');
        const container = document.getElementById('leaderboardcontainer');
        if (container && !this.loading && this.hasMore && container.scrollHeight - container.scrollTop === container.clientHeight) {
            this.fetchLeaderboardData(this.tbody.children.length, 11); // Fetch next 10 entries
        }
    }

    async fetchLeaderboardData(offset, limit) {
        if (this.loading) return;
        this.loading = true;
        // Show loading indicator here
        try {
            const response = await fetch(`/api/leaderboard?offset=${offset}&limit=${limit}`);
            const leaderboardData = await response.json();
            if (leaderboardData.length < limit) {
                this.hasMore = false; // No more data to fetch
            }
            this.createPlayers(leaderboardData);
        } catch (err) {
            console.error('Error fetching leaderboard data:', err);
        } finally {
            this.loading = false;
            // Hide loading indicator here
        }
    }

    createPlayers(data) {
        // Loop through array of players to create player objects for each
        data.forEach(playerData => {
            if (!this.playersMap.has(playerData.walletID)) {
                // Create a new Player only if it doesn't exist
                const player = new Player('leaderboard', playerData);
                this.playersMap.set(playerData.walletID, player);
                this.playersArray.push(playerData.walletID);
            }
        });

        // Populate leaderboard with players
        this.sortAndDisplayLeaderboard();
    }

    sortAndDisplayLeaderboard() {
        // Sort the array based on the criteria (using data from the map)
        this.playersArray.sort((aId, bId) => {
            const playerA = this.playersMap.get(aId);
            const playerB = this.playersMap.get(bId);
            const scoreA = this.showHighscore ? playerA.playerInfo.highscore : playerA.playerInfo.gloLvl;
            const scoreB = this.showHighscore ? playerB.playerInfo.highscore : playerB.playerInfo.gloLvl;
            return scoreB - scoreA;
        });

        this.populateLeaderboard();
    }
    
    populateLeaderboard() {
        // Clear existing rows in the table body
        this.tbody.innerHTML = '';
    
        // Check if the header row is already created
        if (!this.tbody.querySelector('tr')) {
            // Create and populate the header row
            const headerRow = document.createElement('tr');
            this.tbody.appendChild(headerRow);
    
            // Add header cells for rank, glotag, and highscore/level
            ['Rank', 'GloTag', this.showHighscore ? 'Highscore' : 'Level'].forEach(header => {
                const headerCell = document.createElement('th');
                headerCell.textContent = header;
                headerCell.classList.add('header-cell');
                headerRow.appendChild(headerCell);
            });
        }
    
        // Iterate over the playersArray to populate the table
        this.playersArray.forEach((walletID, index) => {
            const player = this.playersMap.get(walletID);
            const playerInfo = player.playerInfo; // Assuming playerInfo contains necessary details
    
            const row = document.createElement('tr');
            row.classList.add('spaced-row');
    
            // Rank cell
            const rankCell = document.createElement('td');
            rankCell.textContent = index + 1;  // Numerical rank
            rankCell.classList.add('glowing-white-text', 'spaced-cell', 'rank-cell');
            row.appendChild(rankCell);
    
            // Nickname cell
            const nicknameCell = document.createElement('td');
            let nicknameText = playerInfo.nickname;
            // Truncate nickname if too long
            if (nicknameText && nicknameText.length > 10) {
                nicknameText = nicknameText.substring(0, 7) + '...'; // Truncate and add '...'
            }
            nicknameCell.textContent = nicknameText;
            nicknameCell.classList.add('glowing-white-text', 'spaced-cell');
            row.appendChild(nicknameCell);
    
            // Score cell (highscore or level)
            const scoreKey = this.showHighscore ? 'highscore' : 'gloLvl';
            const scoreCell = document.createElement('td');
            scoreCell.textContent = playerInfo[scoreKey];
            scoreCell.classList.add('glowing-white-text', 'spaced-cell');
            row.appendChild(scoreCell);
    
            // Append the row to the table body
            this.tbody.appendChild(row);
        });
    } 
    
    refreshLeaderboard() {
        this.tbody.innerHTML = ''; // Clear existing rows
        this.fetchLeaderboardData(0, 11); // Re-fetch data
    }
    

    hideLeaderboard() {
        if (!this.container) return;
        this.container.style.display = 'none';
    }
}