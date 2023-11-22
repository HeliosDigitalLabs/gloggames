class Client {
    constructor() {
        this.init();

        this.getDeviceInfo();

        // Initialize the Socket.io connection
        this.initSocketConnection();

        // Check if there's a session and get user details
        this.getSession(this.onSessionLoaded.bind(this));
    }

    init() {
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

        this.allNfts = {
            tokens: ['aint', 'got', 'no', 'nfts']
        }

        window.addEventListener('WalletConnected', this.handleWalletConnected.bind(this));
    }

    getDeviceInfo() {
        this.deviceInfo.mobile = this.isMobile();
    }

    initSocketConnection() {
        if (!this.sessionCreated) return;
        console.log('initializing socket connection')
        // establish connection to socket
        this.socket = io.connect('http://localhost:8014');
    
        // Emit event when connection is established
        this.socket.on('connect', () => {
            console.log('Successfully connected to the server.');
            this.socketConnected = true;
            this.attachSocketListeners();
            this.getClientNFTs();
            const successEvent = new CustomEvent('socketConnectionSuccess');
            document.dispatchEvent(successEvent);
        });
    
        // Handle connection errors (optional but recommended)
        this.socket.on('connect_error', (err) => {
            console.error('Connection error:', err.message);
            setTimeout(() => {
                // this.initSocketConnection();  // Recall the loop after getSession is called
                console.error('Error connecting to socket')
            }, 50);
        });
    }

    attachSocketListeners() {
        // Add socket
        window.client.socket.on('return_nfts', (data) => {
          this.handleNFTURIs(data);
        });
    }

    handleWalletConnected() {
        // check 
        console.log('checking if wallet connected')
        if (!window.connectedWallet) {
            setTimeout(this.handleWalletConnected.bind(this), 50);
            return;
        }
        console.log('wallet connected')

        this.gloInfo.username = window.connectedWallet.addresses['pisco-1'];
        this.sendWalletConnectRequest();
    }

    isMobile() {
        return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    }

    onSessionLoaded() {
        console.log('Session loaded:', this);
    }

    sendWalletConnectRequest(callback) {
        const Http = new XMLHttpRequest();
      
        const params = JSON.stringify({ walletID: this.gloInfo.username });
      
        Http.open("POST", "/newplayer");
        Http.setRequestHeader("Content-Type", "application/json");
      
        Http.onreadystatechange = (e) => {
          if (Http.readyState === XMLHttpRequest.DONE) {
              if (Http.status === 200) {
                  const response = JSON.parse(Http.response);
                  this.createGloSession(response);
                  this.initSocketConnection();
                  console.log('newplayer', response);

                  if (window.glotag) {
                    window.glotag.glotagMode = 'glotag';
                    window.glotag.handleGlotagMode();
                  }
                  // The token is now securely stored as an HTTP cookie
                if (callback) {
                    callback();
                }
              }
          }
      };
        console.log('CookieStorage:', params);
        Http.send(params);
      }

      getSession(callback) {
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
                
                    console.log('response', response)
                    this.getSessionLoop();

                    if (!this.socketConnected) this.initSocketConnection();

                    if (window.glotag) window.glotag.updateUI();
                    
                    // Call the provided callback function after updating the properties
                    if (callback) {
                        callback();
                    }
                } else if (Http.status === 401) { // Handle Unauthorized response
                    console.error("Unauthorized. JWT might be missing, invalid, or expired.");
                    this.createGuestSession();
                    this.getSessionLoop();
                } else {
                    console.error(`Error: ${Http.statusText}`);
                    this.createGuestSession();
                    this.getSessionLoop();
                }
            }
        };
      
        Http.send();
    }

    getSessionLoop() {
        setTimeout(() => {
            this.getSession();  // Recall the loop after getSession is called
        }, 30000);
    }

    softLogout() {
        this.createGuestSession();
    }

    hardLogout() {
        // Delete the JWT cookie
        fetch('/logout')
        .then(response => {
            console.log('Logged out');
            window.client.createGuestSession();

            window.glotag.glotagMode = 'guest';
            window.glotag.handleGlotagMode();

            window.glotag.pfpElement.style.display = 'none';
            window.glotag.levelDisplay.style.display = 'none';
        })
        .catch(error => console.error('Error:', error));
    }

    createGuestSession() {
        this.gloSession = false;
        this.activePlayer = false;
        this.deviceInfo = {};
        this.sessionCreated = false;
        this.switchingPlayers = false;
        const guest = 'guest';
        this.gloInfo = {};
        this.playerNfts = {};
        this.allNfts = {};
        this.gloInfo = {
            username: guest,
            walletID: guest
        }
        this.gameStats = {};
        console.log('set gloInfo', this.gloInfo)
    }

    createGloSession(playerInfo) {
        this.gloSession = true;
        // Store the player's glo info from response
        this.storeGloInfo(playerInfo)

        // Store the game stats from the response
        this.storeGameStats(playerInfo.gameStats);
        this.sessionCreated = true;
    }

    storeGloInfo(response) {
        if (response) {
            this.gloInfo = {
                username: response.nickname,
                walletID: response.walletID,
                pfp: response.pfp,
                callingCard: "callingCard", //TEMP
                friends: response.friends,
                friendRequestsSent: response.friendRequestsSent,
                friendRequestsReceived: response.friendRequestsReceived,
                gloLvl: response.gloLvl,
                highscore: response.highscore,
                achievements: response.achievements
            };

            console.log('set gloLvl to', this.gloInfo.gloLvl)
        } else {
            console.error('Error setting gloInfo:', response);
        }
    }

    // Method to store game stats from the response
    storeGameStats(gameStats) {
        if (gameStats) {
            this.gameStats = gameStats;
        } else {
            console.error('Error setting game stats:', gameStats);
        }
    }

    getClientNFTs() {
        console.log('getting client nfts')
        if (!this.socketConnected) {
            console.error('Socket connection not established.');
            return;
        }
        
        // Check walletID starts with "terra" & has more than 15 characters
        if (!this.gloInfo.walletID || !this.gloInfo.walletID.startsWith("terra") || this.gloInfo.walletID.length <= 15) {
            this.allNfts = {
                tokens: ['aint', 'got', 'no', 'nfts']
            }
            return;
        }

        console.log('emitting get_nfts messge')
        // Emit the get_nfts event to request NFTs
        this.socket.emit('get_nfts');
    }

    
    getPlayerNFTs(walletID) {
        // Emit the get_nfts event to request NFTs
        this.socket.emit('get_player_nfts', walletID);
    }

    handleNFTURIs(allNfts) {
        if (!allNfts) return;
        console.log('received nft uris:', allNfts);

        // Process the NFT URIs as needed
        if (this.activePlayer) {
            this.playerNfts = allNfts;
        } else {
            this.allNfts = allNfts;
        }

        const successEvent = new CustomEvent('receivedPlayerNfts');
        document.dispatchEvent(successEvent);
        // For example, update the UI, store the data, or dispatch a custom event
    }

    storeActivePlayer(activePlayer) {
        console.log('storing active player')
        this.activePlayer = activePlayer;

        // Check walletID starts with "terra" & has more than 15 characters
        if (!activePlayer.playerInfo.walletID.startsWith("terra") || activePlayer.playerInfo.walletID.length <= 15) {
            this.playerNfts = {
                tokens: ['glo', 'will', 'conquer', 'the', 'cosmos']
            }
            console.log('set player nfts')

            const successEvent = new CustomEvent('receivedPlayerNfts');
            document.dispatchEvent(successEvent);
            return;
        }
        this.getPlayerNFTs(activePlayer.walletID);
    }
}

