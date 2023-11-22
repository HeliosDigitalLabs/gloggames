// Import Node Modules
const express = require('express');
const ejs = require('ejs');
const session = require('express-session');
const jwt = require('jsonwebtoken');
const cookie = require('cookie');
const fs = require('fs');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const ChannelModel = require('./models/channel');
const http = require('http'); //socket
const socketIO = require('socket.io'); //socket
const redis = require('redis');
const { LCDClient } = require('@terra-money/feather.js');



const chatRedisClient = redis.createClient({
  host: 'localhost',
  port: 6379
});
const gameStateRedisClient = redis.createClient({
  host: 'localhost',
  port: 6379,
  db: 1,  // Database 1 for game state
});
chatRedisClient.connect().then(() => {
  console.log('client connected to chat')
})
gameStateRedisClient.connect().then(() => {
  console.log('client connected to game state')
})

// Error handling for chatRedisClient
chatRedisClient.on('error', function(err) {
  console.log('Could not establish a connection with chat Redis. ' + err);
});
chatRedisClient.on('connect', function() {
  console.log('Connected to chat Redis successfully');
});

// Error handling for gameStateRedisClient
gameStateRedisClient.on('error', function(err) {
  console.log('Could not establish a connection with game state Redis. ' + err);
});
gameStateRedisClient.on('connect', function() {
  console.log('Connected to game state Redis successfully');
});

// Utility functions for Redis
const getAsync = (key, callback) => {
  gameStateRedisClient.get(key, function(err, response) {
    if(err) {
      callback(err, null);
    } else {
      callback(null, response);
    }
  });
};

const setAsync = (key, value, expiry) => {
  if (expiry) {
    console.log('Setting with expiry');
    gameStateRedisClient.set(key, value, 'EX', expiry);
  } else {
    console.log('Setting without expiry');
    gameStateRedisClient.set(key, value);
    console.log('set data to', value)
  }
};

// Modify the setGameState function to use callback style, remove the async keyword and try/catch block
const setGameState = (userId, state) => {
  setAsync(`game:${userId}`, JSON.stringify(state), null);
};

const deleteGameState = (userId, callback) => {
  gameStateRedisClient.del(`game:${userId}`, function(err, response) {
    if (err) {
      console.error('Error deleting game state data:', err);
      if (callback) {
        callback(err);
      }
      return;
    }
    console.log('Deleted user game state data:', response);
    if (callback) {
      callback(null, response);
    }
  });
};

// active players helper functions
const addActivePlayer = async (walletId) => {
  try {
    const response = await gameStateRedisClient.sAdd('activePlayers', walletId);
    console.log(`Added player with walletId ${walletId} to active list.`);
    return response; // This will be the count of added members
  } catch (err) {
    console.error(`Error adding active player with walletId ${walletId}:`, err);
    throw err; // Rethrow the error to handle it in the calling context
  }
};

const removeActivePlayer = async (walletId) => {
  try {
    const response = await gameStateRedisClient.sRem('activePlayers', walletId);
    console.log(`Removed player with walletId ${walletId} from active list.`);
    return response; // This will be the count of removed members
  } catch (err) {
    console.error(`Error removing active player with walletId ${walletId}:`, err);
    throw err; // Rethrow the error to handle it in the calling context
  }
};

const getActivePlayers = async () => {
  try {
    const players = await gameStateRedisClient.sMembers('activePlayers');
    console.log('Retrieved active players list:', players);
    return players;
  } catch (err) {
    console.error('Error retrieving active players:', err);
    throw err; // Rethrow the error to handle it in the calling context
  }
};


// Initialize Express App and HTTP Server
const app = express();
const server = http.createServer(app); // Wrap the Express app with Node's HTTP server
const io = socketIO(server); // Attach Socket.io to the HTTP server

// App Configuration
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true
}));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Cache-Control");
  next();
});

// MongoDB Configuration and Connection
const dbUrl = "mongodb+srv://LUNCADMIN:CartiOverUzi1748!@luncman.f9p03ba.mongodb.net/?retryWrites=true&w=majority";
const connectionParams = { useNewUrlParser: true, useUnifiedTopology: true };

mongoose.connect(dbUrl, connectionParams)
  .then(() => console.info("Connected to Player Leaderboard"))
  .catch(e => console.error("Error:", e));

let messages = [];
  
// Verify JWT before establishing socket connection
io.use((socket, next) => {
  // Parse the cookie from the request headers
  const cookies = cookie.parse(socket.request.headers.cookie || '');
  const token = cookies.token;

  // Check if the token exists
  if (!token) {
    return next(new Error('Authentication error: Token not found'));
  }

  // Verify the token
  jwt.verify(token, 'your-secret-key', async (err, decoded) => {
    if (err) {
      return next(new Error('Authentication error: Invalid token'));
    }

    // Add the decoded payload to the socket object
    socket.decoded = decoded;

    try {
      // Add the player to the active list
      await addActivePlayer(decoded.walletID);
      console.log(`Added player with walletId ${decoded.walletID} to active list.`);
      next();
    } catch (error) {
      console.error(`Error adding active player with walletId ${decoded.walletID}:`, error);
      return next(new Error('Error adding player to active list'));
    }
  });
});

io.on('connection', (socket) => {
  console.log('User connected');

  // Load existing messages from Redis and send them to the newly connected client
  chatRedisClient.keys('*', (err, keys) => {
    if (err) return console.log(err);

    keys.forEach((key) => {
      chatRedisClient.get(key, (err, message) => {
        if (err) return console.log(err);
        socket.emit('new_message', JSON.parse(message));
      });
    });
  });

  socket.on('get_nfts', async () => {
    try {
      console.log('getting nft uris')
      const walletID = socket.decoded.walletID;
      const nfts = await getNFT(walletID); // Call the getNFT function
      console.log('got nfts', nfts)
      socket.emit('return_nfts', nfts);
    } catch (error) {
      console.error('Error getting NFTs:', error);
      socket.emit('error', { message: 'Error getting NFTs.' });
    }
  });

  socket.on('get_player_nfts', async (data) => {
    try {
      const walletID = data.walletID;
      const nftUris = await getNFT(walletID); // Call the getNFT function
      socket.emit('return_nfts', nftUris);
    } catch (error) {
      console.error('Error getting NFTs:', error);
      socket.emit('error', { message: 'Error getting NFTs.' });
    }
  });

  socket.on('load_chat_history', async () => {
    try {
      const keys = await chatRedisClient.keys('chat_message_*'); // Only fetch keys that are chat messages
      if (keys.length > 0) {
        const messages = await chatRedisClient.mGet(keys); // Fetch all messages in one go
        const parsedMessages = messages
          .filter(message => message !== null) // Filter out null values
          .map(message => JSON.parse(message))
          .sort((a, b) => a.id - b.id); // Sort messages by id (assuming id is a timestamp or sequential)
        socket.emit('chat_history', parsedMessages);
      } else {
        socket.emit('chat_history', []); // If no keys found, send an empty array
      }
    } catch (err) {
      console.error('Error loading chat history from Redis:', err);
      socket.emit('error', { message: 'Error loading chat history.' });
    }
  });

  socket.on('send_message', async (data) => {
    try {
      // Assign a unique ID to each message
      const messageId = `chat_message_${new Date().getTime()}`;
      data.id = messageId;
    
      // Store the message in Redis
      await chatRedisClient.set(messageId, JSON.stringify(data), 'EX', 86400);
    
      // Emit the message to all clients
      io.emit('new_message', data);
    } catch (err) {
      console.error('Error storing message in Redis:', err);
      socket.emit('error', { message: 'Error sending message.' });
    }
  });
  
  socket.on('delete_message', async (data) => {
    try {
      // Fetch the message from Redis
      const messageData = JSON.parse(await chatRedisClient.get(data.id.toString()));
  
      // Check if the username matches
      if (messageData && messageData.username === data.username) {
        // Find the message with the given ID and remove it from Redis
        await chatRedisClient.del(data.id.toString());
  
        // Find the message with the given ID and remove it from the messages array
        messages = messages.filter(message => message.id !== data.id); 
        
        // Broadcast a delete confirmation event to all clients
        io.emit('delete_confirmation', data);
      } else {
        console.error('Error: User attempting to delete message not owned by them');
      }
    } catch (err) {
      console.error('Error deleting message from Redis:', err);
    }
  });

  socket.on('react_message', async (data) => {
    try {
      const walletID = data.walletID; // Assuming you're sending walletID with the reaction data
      const messageData = JSON.parse(await chatRedisClient.get(data.id.toString()));
      console.log('reacting with', messageData.reactions) 
  
      if (messageData) {
        if (!messageData.reactions[data.reaction].users.includes(walletID)) {
          // Increment the reaction count
          messageData.reactions[data.reaction].count += 1;
          
          // Add the user's walletID to the list
          messageData.reactions[data.reaction].users.push(walletID);
  
          // Save the updated message back to Redis
          await chatRedisClient.set(data.id.toString(), JSON.stringify(messageData), 'EX', 86400);
          console.log('reaction added', messageData.reactions)
  
          // Broadcast the reaction update to all clients
          const updatedReaction = { [data.reaction]: messageData.reactions[data.reaction] };
          io.emit('message_reacted', { id: data.id, reactions: updatedReaction });
        } else {
          // Optionally send feedback to the user that they've already reacted
          console.log('already reacted')
          socket.emit('reaction_feedback', { message: 'You have already reacted with this type.' });
        }
      } else {
        console.error('Error: Message not found');
      }
    } catch (err) {
      console.error('Error handling react_message event:', err);
    }
  }); 

  socket.on('disconnect', () => {
    try {
      // Get the user ID (assuming it's stored in socket.handshake.query.userId)
      const userId = socket.handshake.query.userId;
      console.log('user id', userId)
  
      removeActivePlayer(socket.decoded.walletID);

      if (userId) {
        // Delete the game state from Redis
        deleteGameState(userId);
        console.log(`Game state for user ${userId} deleted from Redis.`);
      } else {
        console.error('User ID not found. Unable to delete game state from Redis.');
      }
    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  });

  socket.on('update_game_state', (data) => {
    try {
      // First, let's try extracting the userId from the data payload (if it's not available in the handshake query)
      const userId = data.userId || socket.handshake.query.userId;
  
      if (!userId) {
        throw new Error('User ID not found.');
      }
  
      // Next, we use the setGameState utility function to save the game state in Redis
      setGameState(userId, data, (err, result) => {
        if (err) {
          console.error('Error updating game state:', err);
          socket.emit('error', { message: 'Error updating game state.' });
        } else {
          // After saving, let's emit a success message (or you might want to do other operations)
          socket.emit('game_state_updated', { message: 'Game state updated successfully', data });
        }
      });
    } catch (err) {
      console.error('Error updating game state:', err);
      socket.emit('error', { message: 'Error updating game state.' });
    }
  });
  
  socket.on('initialize_game', (data) => {
    try {
      const { userId } = data;
  
      const initialState = {
        userId: {userId},
        luncmanInfo: { position: null, attackCount: 0 },
        fudderInfo: [
          { name: 'fudder1', position: null, health: 150 },
          { name: 'fudder2', position: null, health: 100 },
          { name: 'fudder3', position: null, health: 100 },
          { name: 'fudder4', position: null, health: 100 }
        ],
        scoreInfo: { points: 0, luncEaten: 0, fruitEaten: 0, lives: 2, level: 1 },
        startTime: null
      };
      console.log(`Initializing game for user ${userId} with state:`, initialState); // Log the initialization
      setGameState(userId, initialState, (err, result) => {
        if (err) {
          console.error('Error initializing game:', err);
          socket.emit('error', { message: 'Error initializing the game.' });
        } else {
          socket.emit('game_initialized', initialState);
        }
      });
    } catch (err) {
      console.error('Error initializing game:', err);
      socket.emit('error', { message: 'Error initializing the game.' });
    }
  });
});

const lcd = new LCDClient({
  // key must be the chainID
  'pisco-1': {
    lcd: 'https://pisco-lcd.terra.dev',
    chainID: 'pisco-1',
    gasAdjustment: 1.75,
    gasPrices: { uluna: 0.015 },
    prefix: 'terra', // bech32 prefix, used by the LCD to understand which is the right chain to query
  },
});

const pool = 'terra18yev5ejf7y68u929f9rxl37mv8pfnnfl774y0ttulwt74ryqeevq6m0nzf'; // A terraswap contract address on pisco.

async function getNFT(walletID) {
  // Array to hold all token URIs
  const nftUris = [];
  
  // Check walletID starts with "terra" & has more than 15 characters
  if (!walletID.startsWith("terra") || walletID.length <= 15) {
    console.error(`Invalid walletID: ${walletID}`);
    return;
  }

  // Query tokens owned by player
  try {
    const tokensQuery = {
      tokens: {
        owner: walletID
      }
    };
    const tokensResponse = await lcd.wasm.contractQuery(pool, tokensQuery);
    console.log('Player:', walletID, 'tokens:', tokensResponse);

    // After collecting all URIs, return the array
    return tokensResponse;
  } catch (error) {
    console.error(`Error during tokens query for player ${walletID}:`, error);
    return; // Return an empty array or null to indicate failure
  }
}

// Query NFTs
async function queryNFTs() {
  // Your query logic here
  console.log('querying nfts');

  try {
    const allPlayers = await getActivePlayers();
    const activePlayers = allPlayers.filter(player => 
      player.startsWith('terra') && player.length > 15
    );

    if (activePlayers.length === 0) {
      console.error('No active players found');
      return; // Exit early if there are no active players
    }

    for (const player of activePlayers) {
      const query = {
        tokens: {
          owner: player // The current player's wallet ID
        }
      };

      try {
        const assets = await lcd.wasm.contractQuery(pool, query);
        console.log('Player:', player, 'Assets:', assets);
      } catch (error) {
        console.error(`Error during contractQuery for player ${player}:`, error);
      }
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

// Set an interval to execute the query function every 5 seconds
setInterval(queryNFTs, 5000);


///////////////////////////////////////////////////////////////////////////////////////////////////
// Routes
app.get('/', (req, res) => {
  res.render('pages/index');
});

app.get('/leaderboard', (req, res) => {
  res.render('pages/index');
});

app.get('/luncman', (req, res) => {
  res.render('pages/index');
});

app.get('/gloprint', (req, res) => {
  res.render('pages/index');
});

app.get('/glomint', (req, res) => {
  res.render('pages/index');
});

app.get('/glomart', (req, res) => {
  res.render('pages/index');
});

// Helper function to extract the wallet ID from the cookie
const getWalletIdFromToken = (req) => {
  const token = req.cookies.token;
  const decoded = jwt.verify(token, 'your-secret-key'); // Replace 'your-secret-key' with the actual secret key used for signing the JWT
  return decoded.walletID;
};

app.post("/newplayer", (req, res) => {
  const address = req.body.walletID;
  req.session.walletID = address; // store user information in session
  console.log(address);

  ChannelModel.findOne({ walletID: address }, (err, existingUser) => {
      if (err) {
          console.log('Error checking for existing user:', err);
          return res.status(500).json({ error: 'Error checking for existing user' });
      }

      if (existingUser) {
          console.log('WalletID already exists, updating last login.');
          existingUser.updateOne({ lastLogin: Date.now() }, (err, updateResult) => {
              if (err) {
                  console.log('Error updating last login:', err);
                  return res.status(500).json({ error: 'Error updating last login' });
              } else {
                  const token = jwt.sign({ walletID: address }, 'your-secret-key', { expiresIn: '1h' });
                  res.cookie('token', token, {
                      httpOnly: true,
                      secure: false,  // Ensure this is set to true before launching in a production environment and configure HTTPS.
                      sameSite: 'Strict'
                  });
                  return res.json(existingUser);
              }
          });
          return;
      }
  
      // If walletID doesn't exist, create and save the new user
      var channelModel = new ChannelModel();
      channelModel.walletID = address;
      channelModel.highscore = 0;
      channelModel.nickname = address;
      channelModel.registrationDate = Date.now();
      channelModel.lastLogin = Date.now();
      channelModel.gloLvl = 1;
      channelModel.tickets = 0;
      channelModel.friends = [];
      channelModel.friendRequestsSent = [];
      channelModel.friendRequestsReceieved = [];
      channelModel.pfp = '/style/graphics/pfp.png';
      channelModel.settings = [];
      channelModel.gameStats = {
        highestLevelReached: 0,
        totalPlayTime: 0,
        coinsCollected: 0,
        fruitCollected: {
          bitcoin: 0,
          ethereum: 0,
          solana: 0,
          atom: 0
        },
        enemiesKilled: 0,
        attacksUsed: 0,
        deaths: 0,
        coinsPerLevel: 0,
        attackEfficiency: 0,
        KD: 0,
        attacksHit: 0,
        levelsPlayed: 0
      };
      channelModel.achievements = [];
  
      channelModel.save((err, data) => {
        if (err) {
            console.log('Error saving new player:', err);
            return res.status(500).json({ error: 'Error saving new player' });
        } else {
            console.log({ 'msg': 'Inserted Player in the Leaderboard' });
            const token = jwt.sign({ walletID: address }, 'your-secret-key', { expiresIn: '24h' });
            res.cookie('token', token, {
                httpOnly: true,
                secure: false,  // Ensure this is set to true before launching in a production environment and configure HTTPS.
                sameSite: 'Strict'
            });
            console.log('token: ', token);
            return res.json(channelModel); // return the newly created player model as JSON
        }
    });
});
});

app.get("/logout", (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0)
  });
  res.send('Logged out');
});

app.post("/acceptfriend", (req, res) => {
  const userAddress = getWalletIdFromToken(req);
  const friendAddress = req.body.friendWalletID;
  const userResponse = req.body.response; // 'yes' or 'no'

  if (!["yes", "no"].includes(userResponse)) {
    return res.status(400).json({ error: "Invalid response value." });
  }

  ChannelModel.findOne({ walletID: userAddress }, (err, user) => {
    if (err) return res.status(500).json({ error: 'Error finding user' });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!user.friendRequestsReceived.includes(friendAddress)) {
      return res.status(400).json({ error: "No friend request from this user." });
    }

    // Remove the friend request in both 'yes' and 'no' scenarios
    user.friendRequestsReceived = user.friendRequestsReceived.filter(address => address !== friendAddress);

    ChannelModel.findOne({ walletID: friendAddress }, (err, friend) => {
      if (err) return res.status(500).json({ error: 'Error finding friend' });
      if (!friend) return res.status(404).json({ error: 'Friend not found' });

      // Always remove the user from the friend's friendRequestsSent array, regardless of 'yes' or 'no' response
      friend.friendRequestsSent = friend.friendRequestsSent.filter(address => address !== userAddress);

      if (userResponse === "yes") {
        user.friends.push(friendAddress);
        friend.friends.push(userAddress);
        user.save();
        friend.save();
        return res.json({ message: 'Friend added successfully' });
      } else {
        // If the response is 'no', just save both user and friend data with the removed request
        user.save();
        friend.save();
        return res.json({ message: 'Friend request declined' });
      }
    });
  });
});



app.post("/requestfriend", (req, res) => {
  const userAddress = getWalletIdFromToken(req);
  const friendAddress = req.body.friendWalletID;  // the walletID of the friend receiving the request

  // First, find the user in the database using their walletID
  ChannelModel.findOne({ walletID: userAddress }, (err, user) => {
      if (err) {
          console.log('Error finding user:', err);
          return res.status(500).json({ error: 'Error finding user' });
      }

      if (!user) {
          console.log('User not found.');
          return res.status(404).json({ error: 'User not found' });
      }
      
      // Check if they are already friends
      if (user.friends.includes(friendAddress)) {
        console.log('You are already friends.');
        return res.status(400).json({ error: 'You are already friends' });
    }

      // Check if the friend request has already been sent
      if (user.friendRequestsSent.includes(friendAddress)) {
          console.log('Friend request already sent.');
          return res.status(400).json({ error: 'Friend request already sent' });
      }

      // Add the friend's walletID to the user's friendRequestsSent array
      user.friendRequestsSent.push(friendAddress);

      // Now, update the friend's data to include the received request
      ChannelModel.findOne({ walletID: friendAddress }, (err, friend) => {
          if (err) {
              console.log('Error finding friend:', err);
              return res.status(500).json({ error: 'Error finding friend' });
          }

          if (!friend) {
              console.log('Friend not found.');
              return res.status(404).json({ error: 'Friend not found' });
          }

          // Add the user's walletID to the friend's friendRequestsReceived array
          friend.friendRequestsReceived.push(userAddress);

          // Save both documents
          user.save();
          friend.save();

          console.log('Friend request sent successfully.');
          return res.json({ message: 'Friend request sent successfully' });
      });
  });
});
 
app.get("/read", async (req, res) => {
  console.log('cookie:', req.cookies.token);
  try {
      // 1. Extract the JWT from the secured cookie
      const token = req.cookies.token;

      if (!token) {
          return res.status(401).json({ error: "No token provided" });
      }

      // 2. Verify the JWT using your secret key
      const decoded = jwt.verify(token, 'your-secret-key'); // Note: 'your-secret-key' should be stored securely

      const wallet = decoded.walletID;

      // 3. Use the walletID to fetch the user's data
      const channel = await ChannelModel.findOne({ walletID: wallet });

      if (!channel) {
          return res.status(404).json({ error: "User not found" });
      }

      // Return the entire channel document as JSON
      res.json(channel);

  } catch (error) {
      // 4. If the JWT is invalid or any other error occurs
      return res.status(401).json({ error: "Unauthorized" });
  }
});

app.post("/get_player_info", async (req, res) => {
  // Extract the token from the request headers or cookies
  const token = req.headers.authorization || req.cookies.token;
  
  try {
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    // Verify the JWT using your secret key
    const decoded = jwt.verify(token, 'your-secret-key'); // Use your actual secret key
    const requesterWalletID = decoded.walletID;

    // Check if the requester is allowed to fetch this information
    // Assuming you have some logic to verify if the requester has the rights to fetch the player info

    // Check if the body contains an array of wallet IDs
    let walletIDs = req.body.friends;
    if (!Array.isArray(walletIDs)) {
      // If it's not an array, check if it's a string and convert it to an array
      if (typeof walletIDs === 'string') {
        walletIDs = [walletIDs];
      } else {
        return res.status(400).json({ error: "Invalid input format" });
      }
    }

    // Use the wallet IDs to fetch the users' data from the database
    const players = await ChannelModel.find({ 
      walletID: { $in: walletIDs }
    });

    // If no players are found, return an empty array
    if (!players) {
      return res.status(404).json([]);
    }

    // Return the found player documents as JSON
    res.json(players);

  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      // If the JWT is invalid
      return res.status(401).json({ error: "Unauthorized - Invalid token" });
    } else {
      // If any other error occurs
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
});

app.post("/updateplayer", (req, res) => {
  const walletID = req.body.walletID;
  const newUsername = req.body.newUsername;

  ChannelModel.findOneAndUpdate(
    { walletID: walletID },
    { $set: { walletID: newUsername } },
    { new: true, useFindAndModify: false },
    (err, updatedPlayer) => {
      if (err) {
        if (err.code === 11000) { // Check if the error is a duplicate key error
          console.log("Duplicate key error:", err);
          res.status(409).send({ message: "Username already taken" }); // Send a 409 Conflict status
        } else {
          console.log("Error updating username:", err);
          res.status(500).send({ message: "Error updating username" });
        }
      } else {
        console.log("Username updated:", updatedPlayer);
        res.status(200).send({ message: "Username updated successfully" });
      }
    }
  );
});

 
  app.get("/highscore", async (req, res) => {
    const address = req.session.walletID; // Retrieve the address from the session
    console.log(address);
  
    const channel = await ChannelModel.findOne({ walletID: address });
  
    if (!channel) {
      return res.status(404).json({ error: "User not found" });
    }
  
    const { highscore } = channel;
  
    res.json({ highscore });
  });
  

  app.post("/update", async (req, res) => {
    try {
      console.log('updating player stats', req.body)
      const {
        username,
        address,
        highestLevel,
        endTime,
        score,
        coinsCollected,
        fruitCollected,
        fuddersKilled,
        attacksUsed,
        attacksHit,
        deaths
      } = req.body;
      console.log(fruitCollected);
      console.log('username:', `game:${username}`)
      const gameStateData = await gameStateRedisClient.get(`game:${username}`)
      console.log('retrieved game state data', gameStateData)

      const gameState = JSON.parse(gameStateData);
  
      const startTime = gameState.startTime;
      console.log('start time', startTime)
  
      // Fetch user stats in one query
      const userStats = await ChannelModel.findOne({ walletID: address }).exec();
      console.log(userStats);
      
  
      if (!userStats) {
        console.log(address, 'got clapped');
        return res.status(404).json({ 'status': 'failure', 'message': 'User not found' });
      }
      console.log('performing calculations', userStats)
  
      // Update highscore if necessary
      if (score - userStats.highscore > 0) {
        userStats.highscore = score;
        console.log('nice');
      } else {
        console.log('no luck this time');
      }
  
      // Update highestLevelReached if necessary
      if (highestLevel - userStats.highestLevelReached > 0) {
        userStats.highestLevelReached = highestLevel;
      } 
  
      // Calculate total play time
      const totalPlayTime = endTime - startTime; // Assuming startTime and endTime are timestamps
  
      // Update other stats
      userStats.gameStats.totalPlayTime += totalPlayTime;
      userStats.gameStats.coinsCollected += coinsCollected;
      userStats.gameStats.fruitCollected[0].bitcoin += fruitCollected.bitcoin;
      userStats.gameStats.fruitCollected[0].ethereum += fruitCollected.ethereum;
      userStats.gameStats.fruitCollected[0].solana += fruitCollected.solana;
      userStats.gameStats.fruitCollected[0].atom += fruitCollected.atom;
      userStats.gameStats.fuddersKilled += fuddersKilled;
      userStats.gameStats.attacksUsed += attacksUsed;
      userStats.gameStats.attacksHit += attacksHit;
      userStats.gameStats.deaths += deaths;
  
      // Assuming levelsPlayed, enemiesKilled are defined somewhere in your userStats schema
      userStats.levelsPlayed += highestLevel; 
      userStats.enemiesKilled += fuddersKilled; 
  
      userStats.coinsPerLevel = userStats.coinsCollected / userStats.levelsPlayed;
      userStats.attackEfficiency = userStats.attacksHit / userStats.attacksUsed;
      userStats.KD = userStats.enemiesKilled / userStats.deaths;
  
      console.log('saving userStats', userStats)
      // Save all updates in one go
      await userStats.save();
      res.status(200).json({ 'status': 'success', 'message': 'Stats updated' });
    } catch (error) {
      console.log(error);
      res.status(500).json({ 'status': 'failure', 'message': 'Error updating stats' });
    }
  });  
 

/////// adding  winning screen code //////
const winningChances = {
  '0-40Poor': 1 - 0.9909,
  '0-40Average': 1 - 0.9900,
  '0-40Good': 1 - 0.9850,
  '0-40Great': 1 - 0.9800,
  '0-40Legendary': 1 - 0.9750,
  '41-75Poor': 1 - 0.9700,
  '41-75Average': 1 - 0.9650,
  '41-75Good': 1 - 0.9600,
  '41-75Great': 1 - 0.9550,
  '41-75Legendary': 1 - 0.9500,
  '76-85Poor': 1 - 0.9400,
  '76-85Average': 1 - 0.9300,
  '76-85Good': 1 - 0.9200,
  '76-85Great': 1 - 0.9100,
  '76-85Legendary': 1 - 0.9000,
  '86-95Poor': 1 - 0.8900,
  '86-95Average': 1 - 0.8800,
  '86-95Good': 1 - 0.8700,
  '86-95Great': 1 - 0.8600,
  '86-95Legendary': 1 - 0.8500,
  '96-100Poor': 1 - 0.8250,
  '96-100Average': 1 - 0.8000,
  '96-100Good': 1 - 0.7750,
  '96-100Great': 1 - 0.7500,
  '96-100Legendary': 1 - 0.7000,
};

function getPercentile(score, maxScore) {
  return (score / maxScore) * 100;
}

const maxScore = 100000;

function getWinningChance(score) {
  const percentile = getPercentile(score, maxScore);
  let key = '';

  if (percentile <= 40) {
    if (percentile <= 8) {
      key = '0-40Poor';
    } else if (percentile <= 16) {
      key = '0-40Average';
    } else if (percentile <= 24) {
      key = '0-40Good';
    } else if (percentile <= 32) {
      key = '0-40Great';
    } else {
      key = '0-40Legendary';
    }
  } else if (percentile <= 75) {
    if (percentile <= 49) {
      key = '41-75Poor';
    } else if (percentile <= 57) {
      key = '41-75Average';
    } else if (percentile <= 65) {
      key = '41-75Good';
    } else if (percentile <= 73) {
      key = '41-75Great';
    } else {
      key = '41-75Legendary';
    }
  } else if (percentile <= 85) {
    if (percentile <= 79) {
      key = '76-85Poor';
    } else if (percentile <= 81) {
      key = '76-85Average';
    } else if (percentile <= 83) {
      key = '76-85Good';
    } else if (percentile <= 85) {
      key = '76-85Great';
    } else {
      key = '76-85Legendary';
    }
  } else if (percentile <= 95) {
    if (percentile <= 89) {
      key = '86-95Poor';
    } else if (percentile <= 91) {
      key = '86-95Average';
    } else if (percentile <= 93) {
      key = '86-95Good';
    } else if (percentile <= 95) {
      key = '86-95Great';
    } else {
      key = '86-95Legendary';
    }
  } else {
    if (percentile <= 97) {
      key = '96-100Poor';
    } else if (percentile <= 98) {
      key = '96-100Average';
    } else if (percentile <= 99) {
      key = '96-100Good';
    } else if (percentile <= 100) {
      key = '96-100Great';
    } else {
      key = '96-100Legendary';
    }
  }

  return winningChances[key];
}

app.post('/simulateWin', (req, res) => {
  const score = req.body.score;

  const percentile = getPercentile(score, maxScore);  // get the percentile
  const winningChance = getWinningChance(score);  
  const randomValue = Math.random();
  const result = (randomValue < winningChance) ? 'win' : 'loss';

  res.json({ 
    result,
    percentile  // include the percentile in the response
  });
});


// leaderboard 
app.get("/api/leaderboard", async (req, res) => {
  const offset = parseInt(req.query.offset) || 0;
  const limit = Math.min(parseInt(req.query.limit) || 10, 50);

  try {
    // Fetching nickname, highscore, and gloLvl (level)
    const leaderboard = await ChannelModel.find().sort({ highscore: -1 }).select('walletID nickname highscore gloLvl').skip(offset).limit(limit);
    return res.status(200).json(leaderboard);
  } catch (err) {
    console.error("Error retrieving leaderboard:", err);
    return res.status(500).json({ error: "Error retrieving leaderboard" });
  }
});




// Start the App
server.listen(8014, () => { // Note: Using `server.listen` instead of `app.listen`
  console.log('Server running on http://localhost:8014');
});

app.use('/levels', express.static('levels'));