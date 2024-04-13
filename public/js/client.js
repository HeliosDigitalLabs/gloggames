class Client { 
    constructor() {
        this.init();
    } 

    async init() {
        this.username = null;
        this.walletID = null;
        this.gloSession = false;
        this.deviceInfo = {};
        this.gloInfo = {};
        this.gameStats = {};
        this.sessionCreated = false;
        this.socketConnected = false;
        this.activePlayer = null;
        this.switchingPlayers = false;
        this.lastGetSessionTime = 0;
        this.returningPlayer = false;
        
        this.loadedSources = new Set();
        
        this.nftList = new Map();

        this.allNfts = {};

        window.addEventListener('WalletConnected', this.handleWalletConnected.bind(this));
        window.addEventListener('WrongNetwork', this.handleWrongNetwork.bind(this));
      
        window.addEventListener('execTxResponse', (e) => {
          this.handleExecTxResponse(e);
        });
      
        window.addEventListener('execTxError', (e) => {
          this.handleExecTxError(e);
        });

        this.getDeviceInfo();

        // Initialize the Socket.io connection
        this.initSocketConnection();

        // Check if there's a session and get user details
        await this.getSession(this.onSessionLoaded.bind(this));
    }

    getDeviceInfo() {
        this.deviceInfo.mobile = this.isMobile();
    }

    // Modify initSocketConnection to accept a callback function
    initSocketConnection() {
        console.log('initializing socket connection');
        if (window.chat) {
            window.chat.resetSocketListeners();
        }
        // establish connection to socket
        // this.socket = io.connect('http://localhost:8014');
        this.socket = io.connect('https://glo.games');
        // Emit event when connection is established
        this.socket.on('connect', () => {
            console.log('Successfully connected to the server.');
            this.socketConnected = true;
            this.attachSocketListeners();
            if (this.gloInfo.walletID && this.gloInfo.walletID !== 'guest') this.getClientNFTs();
            const successEvent = new CustomEvent('socketConnectionSuccess');
            document.dispatchEvent(successEvent);
        });

        // Handle connection errors (optional but recommended)
        this.socket.on('connect_error', (err) => {
            console.error('Connection error:', err.message);
            setTimeout(() => {
                console.error('Error connecting to socket', err);
            }, 50);
        });
    }

    awaitSocketConnection() {
        return new Promise((resolve, reject) => {
            const checkConnection = setInterval(() => {
                if (this.socketConnected) {
                    resolve();
                    clearInterval(checkConnection);
                }
            }, 100); // Check every 100ms
        });
    }

    attachSocketListeners() {
            // Remove existing listener
            window.client.socket.off('return_nfts');

            // Add socket
            window.client.socket.on('return_nfts', (data) => {
                this.handleNFTURIs(data);
            });
            
            window.client.socket.on('return_client_nfts', (data) => {
                this.handleNftData(data);
            });
    }

    handleWalletConnected() {
        setTimeout(() => {
            if (this.wrongNetwork) return;
            // check 
            console.log('checking if wallet connected', window.connectedWallet)
            if (!window.connectedWallet) {
                setTimeout(this.handleWalletConnected.bind(this), 50);
                return;
            }
            console.log('wallet connected')

            this.gloInfo.walletID = window.connectedWallet.addresses['pisco-1'];
            this.sendWalletConnectRequest();
        }, 250);
    }

    handleWrongNetwork() {
        this.wrongNetwork = true;
        setTimeout(() => {
            this.wrongNetwork = false;
        }, 1500);

        window.glotag.handleWrongNetwork();
    }

    isMobile() {
        return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    }

    onSessionLoaded() {
        console.log('Session loaded:', this);
    }

    sendWalletConnectRequest(callback) {
        const Http = new XMLHttpRequest();

        const params = JSON.stringify({ walletID: this.gloInfo.walletID });

        Http.open("POST", "/updateLogin");
        Http.setRequestHeader("Content-Type", "application/json");

        Http.onreadystatechange = (e) => {
            if (Http.readyState === XMLHttpRequest.DONE) {
                if (Http.status === 200) {
                    const response = JSON.parse(Http.response);

                    if (response === false) {
                        console.log('newplayer', response);
                        const newPlayer = new CustomEvent('newPlayer');
                        window.dispatchEvent(newPlayer);
                    } else {
                        console.log('oldplayer', response);
                        this.returningPlayer = true;
                        this.createGloSession(response);

                        this.initSocketConnection();

                        const newPlayer = new CustomEvent('oldPlayer');
                        window.dispatchEvent(newPlayer);
                        

                        // The token is now securely stored as an HTTP cookie
                        if (callback) {
                            callback();
                        }
                    }
                }
            }
        };
        console.log('CookieStorage:', params);
        Http.send(params);
    }

      async getSession(callback) {
        const Http = new XMLHttpRequest();
        const url = `/read`; // Directly call /read endpoint
      
        Http.open("GET", url);
        Http.setRequestHeader("Content-Type", "application/json");
      
        Http.onreadystatechange = (e) => {
            if (Http.readyState === XMLHttpRequest.DONE) {
                if (Http.status === 200) {
                    const response = JSON.parse(Http.response);
                    this.createGloSession(response);
                    this.sessionCreated = true;

                    if (!this.socketConnected) this.initSocketConnection();

                    if (window.glotag) window.glotag.updateUI();

                    // Check if the refresh token cookie exists
                    const refreshTokenExists = document.cookie.split(';').some((item) => item.trim().startsWith('refreshToken='));
                    if (!refreshTokenExists) {
                        this.refreshToken();
                        return;
                    }
                    
                    // Call the provided callback function after updating the properties
                    if (callback) {
                        callback();
                    }
                } else if (Http.status === 401) { // Handle Unauthorized response
                    console.error("Unauthorized. JWT might be missing, invalid, or expired.");
                    this.refreshToken();
                } else {
                    console.error(`Error: ${Http.statusText}`);
                    this.createGuestSession();

                    // Get local storage with the key "__wallet_kit_connected_wallet"
                    const connectedWallet = localStorage.getItem("__wallet_kit_connected_wallet");

                    // Remove the local storage if it exists
                    if (connectedWallet) {
                        localStorage.removeItem("__wallet_kit_connected_wallet");
                    }
                }
            }
        };
      
        Http.send();
    }

    refreshToken() {
        const Http = new XMLHttpRequest();
        const url = `/refresh`; // Call /refresh endpoint
    
        Http.open("POST", url);
        Http.setRequestHeader("Content-Type", "application/json");
    
        Http.onreadystatechange = (e) => {
            if (Http.readyState === XMLHttpRequest.DONE) {
                if (Http.status === 200) {
                    const response = JSON.parse(Http.response);
                    // console.log('New token received', response);
                    this.createGloSession(response.userInfo);
                    this.sessionCreated = true;

                    if (!this.socketConnected) this.initSocketConnection();

                    // if (window.glotag) window.glotag.handleGlotagMode();
                    let checkInterval = setInterval(() => {
                        if (window.glotag) {
                            window.glotag.updateUI();
                            clearInterval(checkInterval); // stop checking once window.glotag exists and updateUI has been called
                        }
                    }, 50);
                } else {
                    console.error(`Error refreshing token: ${Http.statusText}`);
                    if (!this.socketConnected) this.initSocketConnection();
                    this.createGuestSession();

                    // Get local storage with the key "__wallet_kit_connected_wallet"
                    const connectedWallet = localStorage.getItem("__wallet_kit_connected_wallet");

                    // Remove the local storage if it exists
                    if (connectedWallet) {
                        localStorage.removeItem("__wallet_kit_connected_wallet");
                    }
                }
            }
        };
    
        Http.send();
    }

    softLogout() {
        this.createGuestSession();
    }

    hardLogout() {
        // Disconnect wallet
        // console.log('trying to disconnect wallet', window.wallet)
        window.wallet.disconnect();
        localStorage.removeItem("__wallet_kit_connected_wallet");
        localStorage.setItem("isChatVisible", false);

        // Delete the JWT cookie
        fetch('/logout')
        .then(response => {
            // Refresh the page
            window.location.reload();
        })
        .catch(error => console.error('Error:', error));
    }

    createGuestSession() {
        this.gloSession = false;
        this.deviceInfo = {};
        this.sessionCreated = false;
        this.switchingPlayers = false;
        const guest = 'guest';
        this.gloInfo = {};
        this.playerNfts = {};
        this.allNfts = {};
        this.gloInfo = {
            username: guest,
            walletID: guest,
        }
        this.gameStats = {};
        if (!localStorage.getItem('isChatVisible')) localStorage.setItem("isChatVisible", false);
        if (localStorage.getItem('activeArcade')) localStorage.removeItem('activeArcade');
        // console.log('set gloInfo', this.gloInfo)

        if (!window.videoBackground) {
            this.awaitVideoBackground();
        } else if (!window.welcomed && !window.videoBackground.allPreloaded) {
            window.videoBackground.handleGuestPreload();
        };
        this.setAnalytics();
    }

    awaitVideoBackground() {
        if (!window.videoBackground) {
            setTimeout(() => {
                this.awaitVideoBackground();
            }, 25);
            return;
        }
        if (!window.welcomed && !window.videoBackground.allPreloaded) {
            window.videoBackground.handleGuestPreload();
        }
    }

    createGloSession(playerInfo) {
        console.log('creating glo session', playerInfo)
        this.gloSession = true;
        this.gloPlayerInfo = playerInfo;
        // Store the player's glo info from response
        this.storeGloInfo(playerInfo)

        console.log('checking for wallet local storage', this.gloInfo.walletID)
        if (this.gloInfo.walletID.startsWith("terra") && this.gloInfo.walletID.length > 15) {
            const walletKit = localStorage.getItem('__wallet_kit_connected_wallet');
            if (!walletKit) {
                const id = 'station-extension';
                console.log('reconnect on wallet', window.wallet)
                localStorage.setItem('__wallet_kit_connected_wallet', id);
            }
        }

        // Store the game stats from the response
        this.storeGameStats(playerInfo.gameStats);
        this.sessionCreated = true;

        this.getClientNFTs();

        const gloSessionCreatedEvent = new CustomEvent('sessionCreated');
        window.dispatchEvent(gloSessionCreatedEvent);

        this.setAnalytics();
        if (typeof sa_event === 'function') {
            if (this.returningPlayer) sa_event("player_returned");
        }
    } 

    storeGloInfo(response) {
        if (response) {
            this.gloInfo = {
                username: response.nickname,
                walletID: response.walletID,
                activeNfts: response.activeNfts,
                friends: response.friends,
                friendRequestsSent: response.friendRequestsSent,
                friendRequestsReceived: response.friendRequestsReceived,
                gloLvl: response.gloLvl,
                highscore: response.highscore,
                achievements: response.achievements,
                luncRank: response.ranks.luncRank,
                levelRank: response.ranks.levelRank
            };

            // console.log('set gloLvl to', this.gloInfo.gloLvl)
        } else {
            console.error('Error setting gloInfo:', response);
        }
    }

    // Method to store game stats from the response
    storeGameStats(gameStats) {
        if (gameStats) {
            this.gameStats = gameStats;
            // console.log('stored gamestats', gameStats)
        } else {
            // console.error('Error setting game stats:', gameStats);
        }
    }

    setAnalytics() {
        window.sa_metadata = window.sa_metadata || {};
        sa_metadata.returningPlayer = this.returningPlayer;
        sa_metadata.time = new Date();

        if (this.gloInfo) {
            sa_metadata.highscore = this.gloInfo.highscore;
            sa_metadata.friends = this.gloInfo.friends ? true : false;
            sa_metadata.guest = false;
            // ADD MORE METADATA HERE e.g. opened chat, won glochip, time spent in game, etc.
        } else {
            sa_metadata.guest = true;
        }
    }

    getClientNFTs() {
        // console.log('getting client nfts for', this.gloInfo.walletID)
        if (!this.socketConnected) {
            console.error('Socket connection not established.');
            return;
        }
        
        // Check walletID starts with "terra" & has more than 15 characters
        if (!this.gloInfo.walletID || !this.gloInfo.walletID.startsWith("terra") || this.gloInfo.walletID.length <= 15) {
            this.clientNfts = [];
            this.clientNftsMap = new Map();
            this.receivedNfts = true;
            return;
        }

        this.clientNfts = [];
        this.clientNftsMap = new Map();
        console.error('getting client nfts', this.socket)
        this.receivedNfts = false;
        // Emit the get_nfts event to request NFTs
        this.socket.emit('get_client_nfts');
    }

    
    getPlayerNFTs(walletID) {
        console.error('getting player nfts')

        this.retrievedPlayerNfts = [];
        this.retrievedPlayerNftsMap = new Map();
        // Emit the get_nfts event to request NFTs
        this.socket.emit('get_player_nfts', walletID);
    }

    handleNftData(data) {
        // console.log('Retrieved Client Nfts:', data);
        
        if (data.tokens) {
            let nftsArray;
            if (!this.activePlayer) {
                this.clientNfts = Object.entries(data.tokens).map(([tokenId, value]) => {
                    return {
                        tokenId,
                        count: parseInt(value.count),
                        metadata: value.metadata,
                        tokenIds: value.tokenIds
                    };
                });

                // Sort this.clientNfts by count in descending order
                this.clientNfts.sort((a, b) => b.count - a.count);
                console.log('Client Nfts:', this.clientNfts);

                // Calculate the total count of all NFTs
                this.totalNfts = this.clientNfts.reduce((total, nft) => total + nft.count, 0);

                this.clientNftsMap = new Map(this.clientNfts.map(nft => [nft.tokenId, nft]));
                // console.log('Client Nfts Map:', this.clientNftsMap);
                
                this.updateUserActiveNfts();

                nftsArray = this.clientNfts;
            } else {
                this.retrievedPlayerNfts = Object.entries(data.tokens).map(([tokenId, value]) => {
                    return {
                        tokenId,
                        count: parseInt(value.count),
                        metadata: value.metadata,
                        tokenIds: value.tokenIds
                    };
                });

                // Sort this.clientNfts by count in descending order
                this.retrievedPlayerNfts.sort((a, b) => b.count - a.count);
                // console.log('Retrieved Player Nfts:', this.retrievedPlayerNfts);

                this.totalPlayerNfts = this.retrievedPlayerNfts.reduce((total, nft) => total + nft.count, 0);

                this.retrievedPlayerNftsMap = new Map(this.retrievedPlayerNfts.map(nft => [nft.tokenId, nft]));
                // console.log('Retrieved Player Nfts Map:', this.retrievedPlayerNftsMap);

                this.updatePlayerActiveNfts();

                nftsArray = this.retrievedPlayerNfts;
            }
            this.receivedNfts = true;

            const successEvent = new CustomEvent('receivedPlayerNfts');
            document.dispatchEvent(successEvent);

            console.error('adding nfts to loaded nfts', nftsArray)
            this.addToLoadedNfts(nftsArray);
        }
    }

    addClientNft(tokenId, uri, callback) {
        return new Promise((resolve, reject) => {
            const baseTokenId = tokenId.substring(0, tokenId.lastIndexOf('_'));
            let metadata;
        
            const processMetadata = (metadata) => {
                console.log('received metadata for nft', metadata);
        
                // Find the NFT in the clientNfts array
                let nft = this.clientNfts.find(nft => nft.tokenId === baseTokenId);
        
                // If the NFT is not found in the array, create a new one
                if (!nft) {
                    nft = {
                        tokenId: baseTokenId,
                        count: 1,
                        metadata: metadata,
                        tokenIds: [tokenId]
                    };
        
                    // Add the new NFT to the clientNfts array
                    this.clientNfts.push(nft);
        
                    // Add the new NFT to the clientNftsMap
                    this.clientNftsMap.set(baseTokenId, nft);
                } else {
                    // Check if tokenId already exists in tokenIds array to avoid duplicates
                    if (!nft.tokenIds.includes(tokenId)) {
                        // Increment the count of the NFT
                        nft.count++;
        
                        // Add the tokenId to the tokenIds array
                        nft.tokenIds.push(tokenId);
                    } else {
                        console.warn(`Duplicate tokenId ${tokenId} not added.`);
                    }
                }
        
                // Increment the total count of all NFTs
                this.totalNfts++;
        
                // Call the callback function if it's provided
                if (callback && typeof callback === 'function') {
                    callback = callback.bind(this);
                    callback(metadata);
                }
                resolve(metadata);
            };
        
            // Check if the baseTokenId exists in loadedNfts
            if (this.loadedNfts.has(baseTokenId)) {
                // If it does, use the metadata from loadedNfts
                metadata = this.loadedNfts.get(baseTokenId).metadata;
                console.log('already had nft loaded', metadata);
                processMetadata(metadata);
            } else if (uri) {
                // If it doesn't, proceed as it currently does
                this.socket.emit('get_nft_metadata', baseTokenId);
                this.socket.once('return_metadata', (receivedMetadata) => {
                    processMetadata(receivedMetadata);
                });
            } else {
                // Reject the Promise if there's no way to get the metadata
                reject(new Error('No URI provided and NFT not loaded'));
            }
        });
    }
    
    removeClientNft(tokenId) {
        console.log('Removing', tokenId, 'from clientNfts')
        const baseTokenId = tokenId.substring(0, tokenId.lastIndexOf('_'));

        // Find the NFT in the clientNfts array
        let nft = this.clientNfts.find(nft => nft.tokenId === baseTokenId);

        if (nft) {
            // If there's more than one tokenId in the tokenIds array, remove the tokenId
            if (nft.tokenIds.length > 1) {
                const index = nft.tokenIds.indexOf(tokenId);
                if (index > -1) {
                    nft.tokenIds.splice(index, 1);
                    nft.count--;
                }
            } else {
                // If there's only one tokenId, remove the NFT from the clientNfts array
                const index = this.clientNfts.indexOf(nft);
                if (index > -1) {
                    this.clientNfts.splice(index, 1);
                }

                // Remove the NFT from the clientNftsMap
                this.clientNftsMap.delete(baseTokenId);
            }

            // Decrement the total count of all NFTs
            this.totalNfts--;
        }
    }

    addToLoadedNfts(nftsArray) {
        console.log('adding', nftsArray, 'to loadedNfts')
        if (!this.loadedNfts) {
            this.loadedNfts = new Map();
        }

        nftsArray.forEach(nft => {
            this.loadedNfts.set(nft.tokenId, nft);
        });
        // console.log('added', nftsArray, 'to loadedNfts', this.loadedNfts)
    }

    async handleNFTURIs(allNfts) {
        if (!allNfts) return;
        if (this.activePlayer) {
            // console.log('received nft uris:', allNfts, 'for', this.activePlayer);
        } else {
            // console.log('received nft uris:', allNfts, 'for', this.gloInfo);
        }
    
        // Fetch metadata for each NFT
        const nfts = await this.fetchAllNftMetadata(allNfts);
    
        // Process the NFT URIs as needed
        if (this.activePlayer) {
            this.playerNfts = allNfts;
            // console.log('set player nfts', this.playerNfts)
        } else {
            this.allNfts = allNfts;
            this.receivedNfts = true;
            // console.log('set client nfts', this.allNfts)
        }
    
        const successEvent = new CustomEvent('receivedPlayerNfts');
        document.dispatchEvent(successEvent);
    
        this.gettingPlayerNfts = false;
    
        this.connectLCD();
    }

    async fetchAllNftMetadata({ tokens }) {
        return new Promise(async (resolve, reject) => {
            try {
                // Initialize the map of fetched URIs and their metadata
                this.fetchedUris = this.fetchedUris || new Map();
    
                const allNfts = await Promise.all(tokens.map(async (nft) => {
                    // If the URI has already been fetched, return the nft with the fetched metadata
                    if (this.fetchedUris.has(nft.token_uri)) {
                        return { ...nft, metadata: this.fetchedUris.get(nft.token_uri) };
                    }
    
                    const response = await fetch(nft.token_uri);
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    const metadata = await response.json();
    
                    // Add the URI and its metadata to the map of fetched URIs
                    this.fetchedUris.set(nft.token_uri, metadata);
    
                    return { ...nft, metadata };
                }));
    
                // console.log('All NFT metadata fetched:', allNfts);
                resolve(allNfts);
            } catch (error) {
                console.error('Error fetching NFT metadata:', error);
                reject(error);
            }
        });
    }

    // async updateActiveNfts(allNfts) {
    //     try {
    //         // Fetch all NFT metadata

    //         // Call setActiveNftMetadata after all metadata has been fetched
    //         // await this.setActiveNftMetadata();

    //         console.log('Active NFTs updated with fetched metadata:', this.gloInfo.activeNfts);
    //         return nfts;
    //     } catch (error) {
    //         console.error('Error updating active NFTs:', error);
    //     }
    // }

    updateUserActiveNfts() {
        if (this.activePlayer) {
            // console.log('Updating active NFTs for player with fetched data:', this.retrievedPlayerNfts, this.gloInfo.activeNfts);
        } else {
            this.gloInfo.activePfp = null;
            this.gloInfo.activeGlotag = null;
            this.gloInfo.activeArcade = null;
            this.gloInfo.activeVictory = null;
            this.gloInfo.activeLuncman = null;
            
            console.log('Updating active NFTs for client with fetched data:', this.clientNfts, this.gloInfo.activeNfts);
            if (this.gloInfo.activeNfts.pfp) {
                this.gloInfo.activePfp = this.clientNftsMap.get(this.gloInfo.activeNfts.pfp);
                // if (window.glotag.pfpElement) window.glotag.pfpElement.style.backgroundImage = `url('/style/graphics/token_images${window.client.activePfp.metadata.mainImg}.webp')`;
                // console.log('set active pfp', this.gloInfo.activePfp)
            }
            if (this.gloInfo.activeNfts.glotag) {
                this.gloInfo.activeGlotag = this.clientNftsMap.get(this.gloInfo.activeNfts.glotag);
                // console.log('set active glotag', this.gloInfo.activeGlotag)
            }
            if (this.gloInfo.activeNfts.arcade) {
                this.gloInfo.activeArcade = this.clientNftsMap.get(this.gloInfo.activeNfts.arcade);
                localStorage.setItem('activeArcade', this.gloInfo.activeNfts.arcade);
                // console.log('set active arcade', this.gloInfo.activeArcade)
            }
            if (this.gloInfo.activeNfts.victory) {
                this.gloInfo.activeVictory = this.clientNftsMap.get(this.gloInfo.activeNfts.victory);
                // console.log('set active victory', this.gloInfo.activeVictory)
            }
            if (this.gloInfo.activeNfts.luncman) {
                this.gloInfo.activeLuncman = this.clientNftsMap.get(this.gloInfo.activeNfts.luncman);

                // Preload luncman images
                const gameImages = this.gloInfo.activeLuncman.metadata.gameImages;
                let sources = [];
                const baseUrl = "/style/graphics/";

                for (let asset in gameImages) {
                        for (let direction in gameImages[asset]) {
                            sources.push(baseUrl + gameImages[asset][direction]);
                        }
                }

                this.preloadAssets(sources, 'img');
                console.log('set active luncman', this.gloInfo.activeLuncman)
            }

            // Update reactions
            const reactionNfts = this.clientNfts.filter(nft => nft.metadata.type === 'reactions');
            if (reactionNfts) this.gloInfo.activeReactions = reactionNfts;
        }
    }

    updatePlayerActiveNfts() {
        if (this.activePlayer) {
            this.activePlayer.playerInfo.activePfp = null;
            this.activePlayer.playerInfo.activeGlotag = null;
            this.activePlayer.playerInfo.activeArcade = null;
            this.activePlayer.playerInfo.activeVictory = null;
            this.activePlayer.playerInfo.activeLuncman = null;

            console.log('Updating active NFTs for player with fetched data:', this.playerNfts, this.activePlayer.playerInfo.activeNfts);
            if (this.activePlayer.playerInfo.activeNfts.pfp) {
                this.activePlayer.playerInfo.activePfp = this.retrievedPlayerNftsMap.get(this.activePlayer.playerInfo.activeNfts.pfp);
            }
            if (this.activePlayer.playerInfo.activeNfts.glotag) {
                this.activePlayer.playerInfo.activeGlotag = this.retrievedPlayerNftsMap.get(this.activePlayer.playerInfo.activeNfts.glotag);
            }
            if (this.activePlayer.playerInfo.activeNfts.arcade) {
                this.activePlayer.playerInfo.activeArcade = this.retrievedPlayerNftsMap.get(this.activePlayer.playerInfo.activeNfts.arcade);
            }
            if (this.activePlayer.playerInfo.activeNfts.victory) {
                this.activePlayer.playerInfo.activeVictory = this.retrievedPlayerNftsMap.get(this.activePlayer.playerInfo.activeNfts.victory);
            }
            if (this.activePlayer.playerInfo.activeNfts.luncman) {
                this.activePlayer.playerInfo.activeLuncman = this.retrievedPlayerNftsMap.get(this.activePlayer.playerInfo.activeNfts.luncman);

                // Preload luncman images
                const gameImages = this.activePlayer.playerInfo.activeLuncman.metadata.gameImages;
                let sources = [];
                const baseUrl = "/style/graphics/";

                for (let asset in gameImages) {
                    for (let direction in gameImages[asset]) {
                        sources.push(baseUrl + gameImages[asset][direction]);
                    }
                }

                this.preloadAssets(sources, 'img');
                console.log('set active luncman', this.activePlayer.playerInfo.activeLuncman)
            }
        // After updating the active NFTs, create and dispatch the custom event
        const event = new CustomEvent('playerActiveNftsUpdated');
        window.dispatchEvent(event);
    }
}

    async addClientNfts(newNfts) {
        // Fetch metadata for each new NFT
        newNfts = await this.updateActiveNfts({ tokens: newNfts });

        // Add newNfts to this.allNfts
        this.allNfts = [...this.allNfts, ...newNfts];

        // console.log('Updated allNfts:', this.allNfts, 'to add', newNfts);
    }

    storeActivePlayer(activePlayer) {
        this.activePlayer = activePlayer;
        // console.log('stored active player: ', this.activePlayer);
        this.playerNfts = {};

        // Check walletID starts with "terra" & has more than 15 characters
        if (!activePlayer.playerInfo.walletID.startsWith("terra") || activePlayer.playerInfo.walletID.length <= 15) {
            this.retrievedPlayerNfts = [];
            this.retrievedPlayerNftsMap = new Map();
            this.receivedNfts = true;
            this.totalPlayerNfts = 0;
            // console.log('set player nfts')

            const successEvent = new CustomEvent('receivedPlayerNfts');
            document.dispatchEvent(successEvent);
            return;
        }
        this.getPlayerNFTs(activePlayer.gloInfo.walletID);
    }

    preloadAssets(sources, type) {
        console.log('preloading assets', sources)
        return new Promise((resolve, reject) => {
          let loadedSources = 0;
          let loadedElements = [];
    
          sources.forEach((source) => {
            if (this.loadedSources.has(source)) {
              console.log(`Source already loaded: ${source}`);
              return;
            }

            let element;
            if (type === 'img') {
              element = new Image();
            } else if (type === 'audio') {
              element = new Audio();
            } else if (type === 'video') {
              element = document.createElement('video');
              console.log('set up video element')
            }
    
            const preloadDiv = document.getElementById('preload-div');
            preloadDiv.appendChild(element);
            console.error('readying elements')
    
            const elementReady = () => {
              console.log('calling elementReady')
              loadedSources += 1;
              console.log(`Loaded ${type}:`, source);
    
              loadedElements.push(element);
              this.loadedSources.add(source);
    
              if (loadedSources === sources.length) {
                console.log('returning loaded video')
                resolve(type === 'video' ? loadedElements[0] : loadedElements);
              }
            };
            console.log('random shit fuck it')
    
            if (type === 'img') {
              element.onload = elementReady;
              element.onerror = reject;
            } else if (type === 'video') {
              element.onloadeddata = elementReady;
              element.onerror = reject;
            } else if (type === 'audio') {
              element.addEventListener('canplaythrough', elementReady);
              element.onerror = reject;
            }
    
            element.src = source;
    
            if (type === 'audio') {
              element.load();
            }
          });
        });
      }

    connectLCD() {
        // console.log('Connecting LCDClient')
        this.lcd = new Feather.LCDClient({
            // key must be the chainID
            'pisco-1': {
              lcd: 'https://pisco-lcd.terra.dev',
              chainID: 'pisco-1',
              gasAdjustment: 1.75,
              gasPrices: { uluna: 0.015 },
              prefix: 'terra', // bech32 prefix, used by the LCD to understand which is the right chain to query
            },
          });
        // console.log('Connected LCDClient', this.lcd)
    }
 
    getTypeNfts(type) {
        // Check if the specified type exists in the map
        if (this.nftList.has(type)) {
            // Return the array of NFTs for the specified type
            return this.nftList.get(type);
        } else {
            // Return an empty array or null if the type is not found
            // Depending on your design, you may choose to return an empty array or null
            return [];
            // return null; // Alternate approach
        }
    }

    handleExecTxResponse(e) {
        console.log('heard the exectx result!', e.detail);
        if (e.detail.logs.length === 0) {
            this.handleExecTxError(e);
            return;
        }
        
        let action = e?.detail?.logs[0]?.eventsByType?.wasm?.action?.[0] ?? null;
        if (!action || action === 'transfer_nft') {
            action = e?.detail?.tx?.body?.messages[0]?.execute_msg 
                ? Object.keys(e.detail.tx.body.messages[0].execute_msg)[0] 
                : undefined;

            switch (action) {
                case 'delist_token':
                    console.log('delisting token', action)
                    window.dispatchEvent(new CustomEvent('cancelListingResponse', { detail: { status: 'success', result: e } }));
                    break;
                case 'accept_bid':
                    console.log('accepting bid', action)
                    window.dispatchEvent(new CustomEvent('acceptBidResponse', { detail: { status: 'success', result: e } }));
                    break;
                case 'place_bid':
                    console.log('placing bid', action)
                    window.dispatchEvent(new CustomEvent('placeBidResponse', { detail: { status: 'success', result: e } }));
                    break;
                case 'edit_listing':
                    console.log('updating listing', action)
                    window.dispatchEvent(new CustomEvent('updateListingResponse', { detail: { status: 'success', result: e } }));
                    break;
                case 'buy_now':
                    console.log('buying now', action)
                    window.dispatchEvent(new CustomEvent('buyNowResponse', { detail: { status: 'success', result: e } }));
                    break;
                case 'send_nft':
                    console.log('listing token', action)
                    this.removeClientNft(e?.detail?.tx?.body?.messages[0]?.execute_msg?.token_id)
                    window.dispatchEvent(new CustomEvent('listNftResponse', { detail: { status: 'success', result: e } }));
                    break;
                default:
                    console.log('Unknown action', action);
                    break;
            }
        }

        if (action === 'mint') {
            const tokenType = Object.keys(e?.detail?.tx?.body?.messages[0]?.execute_msg?.mint?.token_type ?? {})[0];
            console.log('mint', action, 'token type', tokenType)
            switch (tokenType) {
                case 'GloNFT':
                    window.dispatchEvent(new CustomEvent('openGlochipResult', { detail: { status: 'success', result: e } }));
                    break;
                case 'Key':
                    window.dispatchEvent(new CustomEvent('mintKeyResult', { detail: { status: 'success', result: e } }));
                    break;
                default:
                    break;
            }
        } else {
            switch (action) {
                case 'delist_token':
                    console.log('delisting token', action)
                    window.dispatchEvent(new CustomEvent('cancelListingResponse', { detail: { status: 'success', result: e } }));
                    break;
                case 'accept_bid':
                    console.log('accepting bid', action)
                    window.dispatchEvent(new CustomEvent('acceptBidResponse', { detail: { status: 'success', result: e } }));
                    break;
                case 'place_bid':
                    console.log('placing bid', action)
                    window.dispatchEvent(new CustomEvent('placeBidResponse', { detail: { status: 'success', result: e } }));
                    break;
                case 'edit_listing':
                    console.log('updating listing', action)
                    window.dispatchEvent(new CustomEvent('updateListingResponse', { detail: { status: 'success', result: e } }));
                    break;
                case 'buy_now':
                    console.log('buying now', action)
                    window.dispatchEvent(new CustomEvent('buyNowResponse', { detail: { status: 'success', result: e } }));
                    break;
                case 'send_nft':
                    console.log('listing token', action)
                    window.dispatchEvent(new CustomEvent('listNftResponse', { detail: { status: 'success', result: e } }));
                    break;
                default:
                    console.log('Unknown action', action);
                    break;
            }
        }
    }

    handleExecTxError(e) {
        console.log('There was an error in executing the transaction', e);
        let errorDetail;
        let errorObject = JSON.parse(e.detail.message);
        console.log('got error object', errorObject)
        let errorMessage = errorObject.error.message || errorObject.error;
        if (!errorMessage || errorMessage.toLowerCase().includes("user denied")) {
            window.dispatchEvent(new CustomEvent('txCancel', { detail: { status: 'failure', result: e } }));
            console.log('user denied tx', errorMessage)
            return;
        } else {
            try {
                errorDetail = JSON.parse(e.detail.message) ?? undefined;
            } catch (error) {
                console.error('Error parsing error message:', error);
                errorDetail = e?.detail?.tx?.body?.messages[0]?.execute_msg 
                ? Object.keys(e.detail.tx.body.messages[0].execute_msg)[0] 
                : undefined;
            }
        }
        
        // Handle the error from the marketplace contract
        switch (errorDetail) {
            case 'delist_token':
                console.log('error while delisting token', errorDetail)
                window.dispatchEvent(new CustomEvent('cancelListingResponse', { detail: { status: 'failure', result: e } }));
                break;
            case 'accept_bid':
                console.log('error while accepting bid', errorDetail)
                window.dispatchEvent(new CustomEvent('acceptBidResponse', { detail: { status: 'failure', result: e } }));
                break;
            case 'place_bid':
                console.log('error while placing bid', errorDetail)
                window.dispatchEvent(new CustomEvent('placeBidResponse', { detail: { status: 'failure', result: e } }));
                break;
            case 'update_listing':
                console.log('error while updating listing', errorDetail)
                window.dispatchEvent(new CustomEvent('updateListingResponse', { detail: { status: 'failure', result: e } }));
                break;
            case 'buy_now':
                console.log('error while buying now', errorDetail)
                window.dispatchEvent(new CustomEvent('buyNowResponse', { detail: { status: 'failure', result: e } }));
                break;
            case 'list_token':
                console.log('error while listing token', errorDetail)
                window.dispatchEvent(new CustomEvent('listNftResponse', { detail: { status: 'failure', result: e } }));
                break;
            default:
                // Error came from minter contract
                // Check if msgs is defined and is an array
                if (errorDetail.msgs && Array.isArray(errorDetail.msgs)) {
                    // Parse the message from the error detail
                    const msg = JSON.parse(errorDetail.msgs[0]);
                    
                    // Extract the token type and message
                    const tokenType = Object.keys(msg.msg.mint.token_type)[0];
                    const action = msg.msg.mint;
                    
                    // Handle the error based on the token type
                    switch (tokenType) {
                        case 'GloNFT':
                            console.log('Error while minting GloNFT', action);
                            window.dispatchEvent(new CustomEvent('openGlochipResult', { detail: { status: 'failure', result: e } }));
                            break;
                        case 'Key':
                            console.log('Error while minting Key', action);
                            window.dispatchEvent(new CustomEvent('mintKeyResult', { detail: { status: 'failure', result: e } }));
                            break;
                        default:
                            console.log('Unknown token type', action);
                            // Handle the error for unknown token type
                            break;
                    }
                } else {
                    console.log('error while Unknown action', errorDetail);
                }
                break;
        }
    }

    async setActiveNftMetadata() {
        console.log('Augmenting active NFTs with metadata', this.gloInfo.activeNfts);

        // Initialize this.activeNftMetadata as an empty object
        this.activeNftMetadata = {};

        // Iterate over the properties of activeNfts
        for (const type in this.gloInfo.activeNfts) {
            // Get the NFT for this type
            const nft = this.gloInfo.activeNfts[type];
            console.log('iterate', nft)
            let id;
            if (!nft.id) {
                id = nft;
            } else {
                id = nft.id;
            }

            // Find the matching metadata based on the NFT's token_uri or id
            const metadata = Array.from(this.fetchedUris.values()).find(meta => meta.type === type) || {};

            // Assign the NFT ID and its metadata
            this.gloInfo.activeNfts[type] = { id: id, metadata: { ...metadata } };
        }

        console.log('Active NFTs augmented with metadata:', this.gloInfo.activeNfts);
    }
}

