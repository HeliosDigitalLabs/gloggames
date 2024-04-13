// Import Node Modules
const express = require('express');
const ejs = require('ejs');
const session = require('express-session');
const jwt = require('jsonwebtoken');
const cookie = require('cookie');
const fs = require('fs');
const util = require('util');
const readFile = util.promisify(fs.readFile);
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const ChannelModel = require('./models/channel');
const http = require('http'); //socket
const https = require('https');
const socketIO = require('socket.io'); //socket
const Redis = require('ioredis');
const { LCDClient, MnemonicKey, MsgExecuteContract } = require('@terra-money/feather.js');
const cron = require('node-cron');
const path = require('path');
const axios = require('axios');
const filePath = path.join(__dirname, 'lookbook_json/season_pre_demo.json');
const rateLimit = require('express-rate-limit');
const Joi = require('joi');

require('dotenv').config({path: __dirname + '/glo.env'});

const privateKey = fs.readFileSync('/home/luncman/app_ssl/privkey.pem', 'utf8');
const certificate = fs.readFileSync('/home/luncman/app_ssl/cert.pem', 'utf8');
const ca = fs.readFileSync('/home/luncman/app_ssl/chain.pem', 'utf8');

const credentials = {
  key: privateKey,
  cert: certificate,
  ca: ca
};

let clients = [];

setInterval(() => {
  const { rss, heapTotal, heapUsed, external } = process.memoryUsage();
  console.log(`Memory Usage - RSS: ${rss}, Heap Total: ${heapTotal}, Heap Used: ${heapUsed}, External: ${external}`);
}, 10000); // Log every 10 seconds

const chatRedisClient = new Redis({
  host: 'localhost',
  port: 6379,
  db: 1,
});

const gameStateRedisClient = new Redis({
  host: 'localhost',
  port: 6379,
  db: 2,  // Database 1 for game state
});

const marketplaceRedisClient = new Redis({
  host: 'localhost',
  port: 6379,
  db: 3,
});

const lookbookRedisClient = new Redis({
  host: 'localhost',
  port: 6379,
  db: 4,
});

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

// Error handling for marketplaceRedisClient
marketplaceRedisClient.on('error', function(err) {
  console.log('Could not establish a connection with marketplace Redis. ' + err);
});
marketplaceRedisClient.on('error', function(err) {
  console.log('Could not establish a connection with marketplace Redis. ' + err);
});
marketplaceRedisClient.on('connect', function() {
  console.log('Connected to marketplace Redis successfully');
});

// Error handling for lookbookRedisClient
lookbookRedisClient.on('error', function(err) {
  console.log('Could not establish a connection with lookbook Redis. ' + err);
});
lookbookRedisClient.on('connect', function() {
  console.log('Connected to lookbook Redis successfully');

  fs.readFile(filePath, 'utf8', async (err, data) => {
    if (err) {
      console.error('Error reading file:', err);
      return;
    }

    const nftEntries = JSON.parse(data);

    const setPromises = [];

    for (const nftEntry of nftEntries) {
      const setPromise = new Promise((resolve, reject) => {
        console.log('trying to lookbook write');
        // Use the entry's name as the key and the rest of the properties as a hash
        lookbookRedisClient.hmset(nftEntry.name.toLowerCase(), 'type', nftEntry.type, 'rarity', nftEntry.rarity, 'season', nftEntry.season, 'imageLink', nftEntry.imageLink, 'previewImageLink', nftEntry.previewImageLink, (err, reply) => {
          if (err) {
            console.error('Error adding entry to Redis:', err);
            reject(err);
          } else {
            console.log('Added entry to Redis:', reply);
            resolve();
          }
        });
      });
      setPromises.push(setPromise);
    }

    // Wait for all set operations to complete
    await Promise.all(setPromises);

    // Print all keys and their values
    for (const nftEntry of nftEntries) {
      lookbookRedisClient.hgetall(nftEntry.name.toLowerCase(), (err, value) => {
        if (err) {
          console.error('Error retrieving value for key:', nftEntry.name.toLowerCase(), err);
        } else {
          console.log('Value for key', nftEntry.name.toLowerCase(), ':', value);
        }
      });
    }
  });
});

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
    const response = await gameStateRedisClient.sadd('activePlayers', walletId);
    console.log(`Added player with walletId ${walletId} to active list.`);

    if (walletId.startsWith("terra") && walletId.length > 15) {
      console.log(`Updating NFTs for player with walletId ${walletId}`);
      try {
        await getNFT(walletId);
      } catch (error) {
        console.error(`Error updating NFTs for player with walletId ${walletId}:`, error);
      }
    }

    return response; // This will be the count of added members
  } catch (err) {
    console.error(`Error adding active player with walletId ${walletId}:`, err);
    throw err; // Rethrow the error to handle it in the calling context
  }
};

const removeActivePlayer = async (walletId) => {
  try {
    const response = await gameStateRedisClient.srem('activePlayers', walletId);
    console.log(`Removed player with walletId ${walletId} from active list.`);
    return response; // This will be the count of removed members
  } catch (err) {
    console.error(`Error removing active player with walletId ${walletId}:`, err);
    throw err; // Rethrow the error to handle it in the calling context
  }
};

const getActivePlayers = async () => {
  try {
    const players = await gameStateRedisClient.smembers('activePlayers');
    console.log('Retrieved active players list:', players);
    return players;
  } catch (err) {
    console.error('Error retrieving active players:', err);
    throw err; // Rethrow the error to handle it in the calling context
  }
};

// Initialize Express App and HTTP Server
const app = express();

const server = http.createServer(app);
// const server = https.createServer(credentials, app);
const io = socketIO(server, {
  cors: {
    origin: "https://glo.games",
    methods: ["GET", "POST"],
    // allowedHeaders: ["my-custom-header"],
    credentials: true
  }
}); // Attach Socket.io to the HTTP server

// HTTP redirect to HTTPS
// const httpApp = express(); // Separate express instance for HTTP
// httpApp.use((req, res, next) => {
//     res.redirect(`https://${req.headers.host}${req.url}`);
// });
// const httpServer = http.createServer(httpApp);

// App Configuration
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true, httpOnly: true }
}));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin); // allow the origin making the request
  res.header("Access-Control-Allow-Credentials", "true"); // allow credentials
  res.header("Access-Control-Allow-Methods", "GET,HEAD,PUT,PATCH,POST,DELETE"); // allow all HTTP methods
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Cache-Control");
  next();
});

//rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use(limiter);

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
  let accessToken = cookies.token;
  const refreshToken = cookies.refreshToken;

  // Directly allow connection if no access token is present
  if (!accessToken) {
    console.log('No access token provided. Proceeding without user data.');
    return next();
  }

  // Function to verify and process the access token
  const verifyAccessToken = (token, attempt = 1) => {
    jwt.verify(token, process.env.JWT_SECRET_KEY, async (err, decoded) => {
      if (!err) {
        // Access token is valid
        socket.decoded = decoded;
        try {
          await addActivePlayer(decoded.walletID);
          console.log(`Added player with walletId ${decoded.walletID} to active list.`);
          next();
        } catch (error) {
          console.error(`Error adding active player with walletId ${decoded.walletID}:`, error);
          next(new Error('Authentication error'));
        }
      } else if (attempt <= 5) {
        // Access token is invalid, check if we should try again
        setTimeout(() => {
          // Parse cookies again in case they have been updated
          const updatedCookies = cookie.parse(socket.request.headers.cookie || '');
          verifyAccessToken(updatedCookies.token, attempt + 1);
        }, 50);
      } else {
        // After several attempts, if the token is still invalid, do not block the connection
        // but log the error for further investigation.
        console.log('Invalid access token. Proceeding without user data.');
        next();
      }
    });
  };

  verifyAccessToken(accessToken);
});

io.on('connection', (socket) => {
  console.log('User connected');
  clients.push(socket);

  socket.on('get_nfts', async () => {
    try {
      if (!socket.decoded) {
        return socket.emit('error', 'Authentication error: You must be logged in to do that');
      }
      console.log('getting nft uris');
      const walletID = socket.decoded.walletID;

      // Get all keys from Redis that start with "id="
      const keys = await marketplaceRedisClient.keys('id=*');

      // Retrieve all listings from Redis
      const listings = [];
      for (let key of keys) {
        const listing = await marketplaceRedisClient.get(key);
        listings.push(JSON.parse(listing));
      }

      // Filter listings to only include those owned by the wallet
      const walletListings = listings.filter(listing => listing.owner === walletID);

      // Map walletListings to only include id and uri
      const mappedWalletListings = walletListings.map(listing => {
        const tokenId = listing.id.split(':')[1]; // Extract the id after the colon
        return {
          token_id: tokenId,
          token_uri: listing.uri,
          isListing: true
        };
      });

      // Get NFTs from getNFT function
      const nfts = await getNFT(walletID);

      // Map nfts to only include token_id and token_uri
      const mappedNfts = nfts.map(nft => ({
        token_id: nft.token_id,
        token_uri: nft.token_uri,
        isListing: false
      }));

      // Combine the two arrays
      const combinedNFTs = [...mappedWalletListings, ...mappedNfts];

      console.log('got nfts', combinedNFTs);
      socket.emit('return_nfts', { tokens: combinedNFTs });

      // Call serveClientNfts and emit the result
      const clientNfts = await serveClientNfts(walletID);
      socket.emit('return_client_nfts', { tokens: clientNfts });
    } catch (error) {
      console.error('Error getting NFTs:', error);
      socket.emit('error', { message: 'Error getting NFTs.' });
    }
  });

  socket.on('get_client_nfts', async (data) => {
    console.log('fetching client nfts')
    try {
      if (!socket.decoded) {
        console.log('couldnt fetch client nfts, no socket.decoded')
        return socket.emit('error', 'Authentication error: You must be logged in to do that');
      }
      const walletID = socket.decoded.walletID;
      // Get NFTs from getNFT function
      const clientNfts = await serveClientNfts(walletID);
      socket.emit('return_client_nfts', { tokens: clientNfts });
    } catch (error) {
      console.error('Error getting client NFTs:', error);
      socket.emit('error', { message: 'Error getting client NFTs.' });
    }
  });

  socket.on('get_player_nfts', async (data) => {
    try {
      const walletID = data;

      // Call serveClientNfts and emit the result
      const clientNfts = await serveClientNfts(walletID);
      socket.emit('return_client_nfts', { tokens: clientNfts });
    } catch (error) {
      console.error('Error getting NFTs:', error);
      socket.emit('error', { message: 'Error getting NFTs.' });
    }
  });

  socket.on('get_nft_metadata', async (data) => {
    try {
      const tokenId = data;
      const metadata = await getNftMetadata(tokenId);
      if (metadata) {
        socket.emit('return_metadata', metadata);
      } else {
        socket.emit('error', { message: 'No metadata found for the given token id.' });
      }
    } catch (error) {
      console.error('Error getting NFT metadata:', error);
      socket.emit('error', { message: 'Error getting NFT metadata.' });
    }
  });

  socket.on('get_pfp_metadata', async (data) => {
    console.log('fetching metadata for', data)
    try {
      const tokenId = data;
      const metadata = await getNftMetadata(tokenId);
      if (metadata) {
        socket.emit('return_pfp_metadata', metadata);
      } else {
        socket.emit('error', { message: 'No metadata found for the given token id.' });
      }
    } catch (error) {
      console.error('Error getting NFT metadata:', error);
      socket.emit('error', { message: 'Error getting NFT metadata.' });
    }
  });

  socket.on('get_glotag_metadata', async (data) => {
    console.log('fetching glotag metadata for', data)
    try {
      const tokenId = data;
      const metadata = await getNftMetadata(tokenId);
      if (metadata) {
        console.log('returning glotag metadata', metadata)
        socket.emit('return_glotag_metadata', metadata);
      } else {
        socket.emit('error', { message: 'No metadata found for the given token id.' });
      }
    } catch (error) {
      console.error('Error getting NFT metadata:', error);
      socket.emit('error', { message: 'Error getting NFT metadata.' });
    }
  });

  socket.on('load_chat_history', async () => {
    try {
      // Retrieve all message IDs from the 'chat_message_ids' sorted set in ascending order
      const messageIds = await chatRedisClient.zrange('chat_message_ids', 0, -1);

      let parsedMessages = await Promise.all(messageIds.map(async messageId => {
        // Retrieve the message data from the 'chat_messages' hash
        const message = await chatRedisClient.hget('chat_messages', messageId);
        if (message !== null) {
          const parsedMessage = JSON.parse(message);
          // Retrieve the player info from the 'chatters' hash
          const playerInfo = JSON.parse(await chatRedisClient.hget('chatters', parsedMessage.walletID));
          // Add the player info to the message
          parsedMessage.playerInfo = playerInfo;
          return parsedMessage;
        }
      }));

      // Filter out null values (in case a message was deleted while loading the chat history)
      parsedMessages = parsedMessages.filter(message => message !== undefined);

      // Retrieve the pinned message ID
      const pinnedMessageId = await chatRedisClient.get('pinned_message_id');
      let pinnedMessage = null;
      if (pinnedMessageId) {
        // Retrieve the pinned message data from the 'chat_messages' hash
        const message = await chatRedisClient.hget('chat_messages', pinnedMessageId);
        if (message !== null) {
          pinnedMessage = JSON.parse(message);
          // Retrieve the player info from the 'chatters' hash
          const playerInfo = JSON.parse(await chatRedisClient.hget('chatters', pinnedMessage.walletID));
          // Add the player info to the message
          pinnedMessage.playerInfo = playerInfo;
        }
      }

      socket.emit('chat_history', { messages: parsedMessages, pinnedMessage: pinnedMessage });
    } catch (err) {
      console.error('Error loading chat history from Redis:', err);
      socket.emit('error', { message: 'Error loading chat history.' });
    }
  });

  socket.on('send_message', async (data) => {
    console.log('chatter:', socket.decoded);
    try {
      if (!socket.decoded) {
        return socket.emit('error', 'Authentication error: You must be logged in to do that');
      }
      // Assign a unique ID to each message
      const messageId = `chat_message_${new Date().getTime()}`;
      data.id = messageId;
      data.timestamp = new Date().toISOString();

      // Store the message data in a Redis hash
      await chatRedisClient.hset('chat_messages', messageId, JSON.stringify(data));

      // Add the message ID to a Redis Sorted Set with the timestamp as the score
      const timestamp = new Date(data.timestamp).getTime();
      await chatRedisClient.zadd('chat_message_ids', timestamp, messageId);

      // Check if the 'chat_messages' hash will exceed 1000 elements
      const chatMessagesLength = await chatRedisClient.hlen('chat_messages');
      if (chatMessagesLength > 10) {
        // Get the ID of the oldest message
        const oldestMessageId = await chatRedisClient.zrange('chat_message_ids', 0, 0);

        // If the oldest message is the pinned message, find the next top reacted message
        if (oldestMessageId[0] === await chatRedisClient.get('pinned_message_id')) {
          const allMessageIds = await chatRedisClient.zrange('chat_message_ids', 0, -1);
          let maxReactions = 0;
          let newPinnedMessageId = null;

          for (const messageId of allMessageIds) {
            if (messageId !== oldestMessageId[0]) {
              const messageData = JSON.parse(await chatRedisClient.hget('chat_messages', messageId));
              const totalReactions = Object.values(messageData.reactions).reduce((total, reaction) => total + reaction.count, 0);
              if (totalReactions > maxReactions) {
                maxReactions = totalReactions;
                newPinnedMessageId = messageId;
              }
            }
          }

          // Update the pinned message
          if (newPinnedMessageId) {
            await chatRedisClient.set('pinned_message_id', newPinnedMessageId);
          } else {
            await chatRedisClient.del('pinned_message_id');
          }
        }

        // Remove the oldest message from the 'chat_messages' hash and the 'chat_message_ids' sorted set
        await chatRedisClient.hdel('chat_messages', oldestMessageId[0]);
        await chatRedisClient.zrem('chat_message_ids', oldestMessageId[0]);
      }

      // Check if the sender's name is already in the 'chatters' hash
      const playerInfoInRedis = await chatRedisClient.hget('chatters', socket.decoded.walletID);

      // If the sender's name is not in the 'chatters' hash, fetch the player info from the MongoDB database and store it in the 'chatters' hash
      if (!playerInfoInRedis) {
        const playerInfo = await ChannelModel.findOne({ walletID: socket.decoded.walletID });
        if (playerInfo) {
          await chatRedisClient.hset('chatters', socket.decoded.walletID, JSON.stringify(playerInfo));
        }
      }

      // Emit the message to all clients, including the sender
      console.log('sending new message', data)
      io.emit('new_message', data);
    } catch (err) {
      console.error('Error storing message in Redis:', err);
      socket.emit('error', { message: 'Error sending message.' });
    }
  });
  
  socket.on('delete_message', async (data) => {
    try {
      if (!socket.decoded) {
        return socket.emit('error', 'Authentication error: You must be logged in to do that');
      }

      // Fetch the message with the matching ID from the Redis hash
      const messageData = JSON.parse(await chatRedisClient.hget('chat_messages', data.id.toString()));

      // Check if the username matches
      if (messageData && messageData.username === data.username) {
        // Remove the message from the 'chat_messages' hash and the 'chat_message_ids' sorted set
        await chatRedisClient.hdel('chat_messages', data.id.toString());
        await chatRedisClient.zrem('chat_message_ids', data.id.toString());

        // Broadcast a delete confirmation event to all clients
        io.emit('delete_confirmation', data);

        // Check if the message being deleted is the current pinned message
        const pinnedMessageId = await chatRedisClient.get('pinned_message_id');
        if (data.id.toString() === pinnedMessageId) {
          // If so, find a new message to pin
          const messageIds = await chatRedisClient.zrange('chat_message_ids', 0, -1);
          for (let i = messageIds.length - 1; i >= 0; i--) {
            const messageId = messageIds[i];
            const message = JSON.parse(await chatRedisClient.hget('chat_messages', messageId));
            if (message && message.totalReactionCount > 0) {
              // Pin the first message with reactions that we find
              await chatRedisClient.set('pinned_message_id', messageId);

              // Retrieve the player info from the 'chatters' hash
              const playerInfo = JSON.parse(await chatRedisClient.hget('chatters', message.walletID));
              // Add the player info to the message
              message.playerInfo = playerInfo;

              io.emit('new_pinned_message', { id: messageId, message: message });
              break;
            }
          }
        }
      } else {
        console.error('Error: User attempting to delete message not owned by them');
      }
    } catch (err) {
      console.error('Error deleting message from Redis:', err);
    }
  });

  socket.on('react_message', async (data) => {
    console.info('reacting to message', data)
    try {
      if (!socket.decoded) {
        return socket.emit('error', 'Authentication error: You must be logged in to do that');
      }
      const walletID = data.walletID; // Assuming you're sending walletID with the reaction data
      console.log('reacting to message', data)

      // Fetch the message with the matching ID from the 'chat_messages' hash
      const messageData = JSON.parse(await chatRedisClient.hget('chat_messages', data.id.toString()));

      if (messageData) {
        // If the user hasn't reacted with this type, add their reaction
        if (!messageData.reactions[data.reaction]) {
          // If this is the first reaction of this type, initialize the reaction data
          messageData.reactions[data.reaction] = { count: 0, users: [], name: data.nftName };
        }

        // Check if the user has already reacted with any type
        if (!Object.values(messageData.reactions).some(reaction => reaction.users.includes(walletID))) {
          // If not, increment the total reaction count
          messageData.totalReactionCount = (messageData.totalReactionCount || 0) + 1;
        }

        // Add the user's walletID to the list
        if (!messageData.reactions[data.reaction].users.includes(walletID)) {
          messageData.reactions[data.reaction].users.push(walletID);
          // Increment the reaction count
          messageData.reactions[data.reaction].count += 1;
        }

        // Save the updated message back to Redis
        await chatRedisClient.hset('chat_messages', data.id.toString(), JSON.stringify(messageData));

        // Broadcast the reaction update to all clients
        const updatedReaction = { [data.reaction]: messageData.reactions[data.reaction] };
        io.emit('message_reacted', { id: data.id, reactions: updatedReaction });

        // Check if this message has more reactions than the current pinned message
        const pinnedMessageId = await chatRedisClient.get('pinned_message_id');
        const pinnedMessageData = JSON.parse(await chatRedisClient.hget('chat_messages', pinnedMessageId));
        if (!pinnedMessageData || messageData.totalReactionCount > pinnedMessageData.totalReactionCount) {
          // If so, update the pinned message
          await chatRedisClient.set('pinned_message_id', data.id.toString());

          // Retrieve the player info from the 'chatters' hash
          const playerInfo = JSON.parse(await chatRedisClient.hget('chatters', messageData.walletID));
          // Add the player info to the message
          messageData.playerInfo = playerInfo;

          // Emit a new WebSocket message to notify all clients about the new pinned message
          io.emit('new_pinned_message', { id: data.id, message: messageData });
        }
      } else {
        console.error('Error: Message not found');
      }
    } catch (err) {
      console.error('Error handling react_message event:', err);
    }
  });

  socket.on('disconnect', () => {
    clients = clients.filter(client => client !== socket);
    try {
      // Get the user ID (assuming it's stored in socket.handshake.query.userId)
      const userId = socket.handshake.query.userId;
      console.log('user id', userId, socket.handshake)
  
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

    // Send marketplace data to the newly connected client when needed
    socket.on('get_marketplace_data', async (data) => {
      try {
        let listings;
        if (data.filter && (data.filter.name || data.filter.type)) {
          listings = await emitMarketplaceData(data.filter);
        } else {
          listings = await emitAllMarketplaceData();
        }
        socket.emit('marketplace_data', listings);
      } catch (err) {
        console.error('Error fetching marketplace data:', err);
        socket.emit('error', { message: 'Error fetching marketplace data.' });
      }
    });

    socket.on('search', (searchTerm) => {
      lookbookRedisClient.zrangebylex('autocomplete', `[${searchTerm.toLowerCase()}*`, `[${searchTerm.toLowerCase()}\xff`, 'LIMIT', 0, 10)
        .then(matchingKeys => {
          socket.emit('autocomplete', matchingKeys);
        })
        .catch(err => {
          console.error('Error retrieving keys:', err);
        });
    });

  socket.on('paging_lookbook', async () => {
    console.log('Received paging_lookbook event');

    try {
      const lookbookEntries = await getAllLookbookEntries();
      console.log('All lookbook entries:', lookbookEntries);

      // Send the lookbookEntries back to the client
      socket.emit('lookbook_entries', lookbookEntries);
    } catch (err) {
      console.error('Error retrieving lookbook entries:', err);
    } 
  }); 
}); 

const getAllLookbookEntries = () => {
  return new Promise((resolve, reject) => {
    lookbookRedisClient.keys('*', (err, keys) => {
      if (err) {
        console.error('Error retrieving keys:', err);
        reject(err);
      } else {
        const entries = [];
        keys.forEach((key, i) => {
          lookbookRedisClient.hgetall(key, (err, object) => {
            if (err) {
              console.error('Error retrieving object for key:', key, err);
            } else {
              entries.push({ name: key, ...object });
              if (i === keys.length - 1) {
                resolve(entries);
              }
            }
          });
        });
      }
    });
  });
};

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

const nftsRedisClient = new Redis({
  host: 'localhost',
  port: 6379,
  db: 5,
});

const mk = new MnemonicKey({
  mnemonic: 'disease grab render salmon device slogan letter genre bicycle dwarf large frozen random bean bus wage topic income way crystal rude mixture gauge square',
});
const wallet = lcd.wallet(mk);

const minterAddress = 'terra1cu85teyaaxyxpv4evjgqcayxgqcvgac2lg2fc4lv345r0ylw5dzscc5uqp';

const marketplaceAddress = 'terra1zsr4tv79lnuqc22qvw6d6mky8yvukv9qqrhdmzcz2w359sn0dnnsxnjch6';

const pool = 'terra1cu85teyaaxyxpv4evjgqcayxgqcvgac2lg2fc4lv345r0ylw5dzscc5uqp'; // A terraswap contract address on pisco.

async function getNFT(walletID) {
  // Check walletID starts with "terra" & has more than 15 characters
  if (!walletID.startsWith("terra") || walletID.length <= 15) {
    console.error(`Invalid walletID: ${walletID}`);
    return [];
  }

  let start_after = null;
  const limit = 30; // Set the limit to the maximum allowed value
  let allTokens = [];

  // Query tokens owned by player
  try {
    while (true) {
      const tokensQuery = {
        tokens_info: {
          owner: walletID,
          start_after: start_after,
          limit: limit
        }
      };
      console.log('Attempting to query for token info using:', tokensQuery);
      const tokensResponse = await lcd.wasm.contractQuery(minterAddress, tokensQuery);

      // If no tokens are returned, break the loop
      if (!tokensResponse.tokens || tokensResponse.tokens.length === 0) {
        break;
      }

      // Add the fetched tokens to the allTokens array
      allTokens.push(...tokensResponse.tokens);

      // Set start_after to the last token_id fetched
      start_after = tokensResponse.tokens[tokensResponse.tokens.length - 1].token_id;
    }

    // Create an object to store the count and token ids of each token id
    let tokenCounts = {};

    // Iterate over the allTokens array
    for (let token of allTokens) {
      // Remove the last part from the token_id after the underscore
      let tokenId = token.token_id.slice(0, token.token_id.lastIndexOf('_'));

      // If this token_id is already a key in the object, increment its count and add the token_id to its array, otherwise set its count to 1 and its array to contain the token_id
      if (tokenCounts[tokenId]) {
        tokenCounts[tokenId].count++;
        tokenCounts[tokenId].tokenIds.push(token.token_id);
      } else {
        tokenCounts[tokenId] = { count: 1, tokenIds: [token.token_id] };
      }
    }

      // Convert tokenCounts to an array of field-value pairs
      let tokenCountsArray = [];
      for (let tokenId in tokenCounts) {
        tokenCountsArray.push(tokenId, JSON.stringify(tokenCounts[tokenId]));
      }

      // Check if tokenCountsArray is not empty
      if (tokenCountsArray.length === 0) {
        console.log('No tokens to store');
        return allTokens; // Return early if there are no tokens to store
      }

      // Store the tokenCountsArray in a Redis hash using the walletID as the key
      nftsRedisClient.hmset(walletID, tokenCountsArray);
      console.log('storing tokens');

      // Get the current entries for the user from the Redis hash
      const currentTokens = await nftsRedisClient.hgetall(walletID);
      console.log('got current token entries', currentTokens)

      // Convert currentTokens to an object and parse JSON only once
      let currentTokensObj = {};
      for (let key in currentTokens) {
        currentTokensObj[key] = JSON.parse(currentTokens[key]);
      }
      console.log('converted token entries to object', currentTokensObj);

      // Iterate over the currentTokensObj
      for (let tokenId in currentTokensObj) {
        console.log(`Processing tokenId: ${tokenId}`);
        // If this token is not in tokenCounts, remove it from the Redis hash
        if (!tokenCounts[tokenId]) {
          console.log(`TokenId ${tokenId} not found in tokenCounts. Removing from Redis.`);
          nftsRedisClient.hdel(walletID, tokenId);
        } else {
          // Convert tokenIds to a Set for efficient lookup
          let tokenIdsSet = new Set(tokenCounts[tokenId].tokenIds);

          // If this token is in tokenCounts, check if any token_ids need to be removed
          for (let i = 0; i < currentTokensObj[tokenId].tokenIds.length; i++) {
            let individualTokenId = currentTokensObj[tokenId].tokenIds[i];
            if (!tokenIdsSet.has(individualTokenId)) {
              console.log(`individualTokenId ${individualTokenId} not found in tokenCounts. Removing.`);
              // Remove the token_id from the array
              currentTokensObj[tokenId].tokenIds.splice(i, 1);
              currentTokensObj[tokenId].count--; // Decrement the count
              i--; // Decrement i since we removed an element from the array

              // If the array is now empty, remove the token from the Redis hash
              if (currentTokensObj[tokenId].tokenIds.length === 0) {
                console.log(`No more tokenIds for ${tokenId}. Removing from Redis.`);
                nftsRedisClient.hdel(walletID, tokenId);
              } else {
                // Otherwise, update the token in the Redis hash
                console.log(`Updating tokenId ${tokenId} in Redis.`);
                nftsRedisClient.hset(walletID, tokenId, JSON.stringify(currentTokensObj[tokenId]));
              }
            }
          }
        }
      }

      // After collecting all URIs, return the array
      return allTokens;
    } catch (error) {
    // console.error(`Error during tokens query for player ${walletID}:`, error);
    return []; // Return an empty array to indicate failure
  }
}

async function serveClientNfts(walletID) {
  return new Promise((resolve, reject) => {
    nftsRedisClient.hgetall(walletID, async function(err, object) {
      if(err) {
        reject(err);
      } else {
        // Iterate over the keys of the object
        for (let tokenId in object) {
          let originalTokenId = tokenId;
          // Split the token_id into parts
          let parts = tokenId.split('_');
          // Get the last part and the token_id without the last part
          let type = parts.pop();
          if (type === 'luncman') {
            type = 'luncmen';
          } else if (type === 'victory') {
            type = 'victories';
          } else if (type === 'key') {
            type = 'holokeys';
          } else {
            type += 's';
          }
          let tokenIdWithoutType;
          if (tokenId.includes('predemo')) {
            if (type === 'holokeys') {
              tokenId = tokenId.replace('_key', '_holokey');
            }
            tokenIdWithoutType = tokenId;
          } else {
            tokenIdWithoutType = parts.join('_');
          }
          // Construct the URL
          let url = path.join(__dirname, 'public', 'tokens', 'uri', type, `${tokenIdWithoutType}.json`);
          try {
            // Read the metadata from the file
            let metadata = JSON.parse(await readFile(url, 'utf8'));
            object[originalTokenId] = JSON.parse(object[originalTokenId]);
            object[originalTokenId].metadata = metadata;
          } catch (error) {
            console.error(`Error reading metadata for token_id ${tokenId}:`, error);
          }
        }
        resolve(object);
      }
    });
  });
}

async function getNftMetadata(tokenId) {
  // Split the token_id into parts
  let parts = tokenId.split('_');
  // Get the last part and the token_id without the last part
  let type = parts.pop();
  if (type === 'luncman') {
    type = 'luncmen';
  } else if (type === 'victory') {
    type = 'victories';
  } else if (type === 'key') {
    type = 'holokeys';
  } else {
    type += 's';
  }
  let tokenIdWithoutType;
  if (tokenId.includes('predemo')) {
    if (type === 'holokeys') {
      tokenId = tokenId.replace('_key', '_holokey');
    }
    tokenIdWithoutType = tokenId;
  } else {
    tokenIdWithoutType = parts.join('_');
  }
  // Construct the URL
  let url = path.join(__dirname, 'public', 'tokens', 'uri', type, `${tokenIdWithoutType}.json`);
  try {
    // Read the metadata from the file
    let metadata = JSON.parse(await readFile(url, 'utf8'));
    return metadata;
  } catch (error) {
    console.error(`Error reading metadata for token_id ${tokenId}:`, error);
    return null;
  }
}

async function getAllActivePlayersNfts() {
  try {
    // Get the list of active players
    const activePlayers = await gameStateRedisClient.smembers('activePlayers');

    // For each active player, get their NFTs
    for (const walletId of activePlayers) {
      // Check if the walletId starts with "terra" and has more than 15 characters
      if (walletId.startsWith("terra") && walletId.length > 15) {
        console.log(`Updating NFTs for player with walletId ${walletId}`);
        await getNFT(walletId);
      }
    }
  } catch (err) {
    console.error(`Error updating NFTs for active players:`, err);
  }
};

// functions for marketplace state
async function updateMarketplace() {
  console.log('getting marketplace data')
  try {
    const listingsQuery = {
      get_listings: {}
    };
    const listingsResponse = await lcd.wasm.contractQuery(marketplaceAddress, listingsQuery);

    // Get all keys from Redis
    const keys = await marketplaceRedisClient.keys('*');

    // Delete all keys
    for (let key of keys) {
      await marketplaceRedisClient.del(key);
    }

    for (let listing of listingsResponse.listings) {
      const id = listing.id.split(':')[1];
      const metadataResponse = await axios.get(listing.uri, {
        auth: {
          username: 'guest', // The username you've configured
          password: 'dokwonski' // The actual password
        }
      }); // Use listing.uri to get the metadata
      const metadata = metadataResponse.data;

      // Append metadata to listing
      listing.data = metadata;

      // Store the full listing as a hash
      await marketplaceRedisClient.hmset(id, 'listing', JSON.stringify(listing));

      // Add the listing id to the set for its 'name' and 'type'
      await marketplaceRedisClient.sadd(`name:${metadata.name}`, id);
      await marketplaceRedisClient.sadd(`type:${metadata.type}`, id);
    }

    // After storing the response, you can also return it if needed
    console.log('Finished updating marketplace.');

    // After updating the marketplace, send a message to all connected clients
    listings = await emitAllMarketplaceData();

    return listingsResponse;
  } catch (error) {
    console.error(`Error during listings query:`, error);
    return; // Return an empty array or null to indicate failure
  }
}

async function emitMarketplaceData(filter) {
  try {
    // Convert the first letter of each word in the name filter to uppercase
    if (filter.name) {
      filter.name = filter.name.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }

    // Get the ids of the listings that match the filter
    const ids = filter.name ? await marketplaceRedisClient.smembers(`name:${filter.name}`) :
      filter.type ? await marketplaceRedisClient.smembers(`type:${filter.type}`) : [];

    // Retrieve the listings from Redis
    const listings = [];
    for (let id of ids) {
      // Get the 'listing' field from the hash stored at the id
      const listing = await marketplaceRedisClient.hget(id, 'listing');

      // Parse the listing data
      const parsedListing = JSON.parse(listing);

      // Add the listing to the listings array
      listings.push(parsedListing);
    }

    return listings;
  } catch (err) {
    console.error('Error retrieving marketplace data:', err);
  }
}

async function emitAllMarketplaceData() {
  try {
    // Get all keys from Redis
    const keys = await marketplaceRedisClient.keys('*');

    // Retrieve all listings from Redis
    const listings = [];
    for (let key of keys) {
      // Check the type of data stored at the key
      const type = await marketplaceRedisClient.type(key);

      // If the key holds a hash, perform the hget operations
      if (type === 'hash') {
        // Get the 'listing' field from the hash stored at the key
        const listing = await marketplaceRedisClient.hget(key, 'listing');

        // Parse the listing data
        const parsedListing = JSON.parse(listing);

        // Add the listing to the listings array
        listings.push(parsedListing);
      }
    }

    return listings;
  } catch (err) {
    console.error('Error retrieving all marketplace data:', err);
  }
}

async function checkNFTOwnership(baseTokenIds, walletID) {

  // Check if walletID is valid
  if (!walletID.startsWith("terra") || walletID.length <= 15) {
    console.error(`Invalid walletID: ${walletID}`);
    return [];
  }

  // Construct the check ownership query
  const checkOwnershipQuery = {
    check_ownership: {
      base_ids: baseTokenIds,
      owner: walletID
    }
  };
  console.log('checking user nft ownership', checkOwnershipQuery, baseTokenIds)

  // Query the minter address
  try {
    const ownershipResponse = await lcd.wasm.contractQuery(minterAddress, checkOwnershipQuery);
    console.log('Ownership:', ownershipResponse);

    // Return the response
    return ownershipResponse;
  } catch (error) {
    //console.error(`Error during ownership query for player ${walletID}:`, error);
    return []; // Return an empty array to indicate failure
  }
}


// Schedule the task to run every minute
cron.schedule('*/30 * * * * *', async () => {
  console.log('scheduling marketplace update');
  console.log('getting marketplace data')
  await updateMarketplace();
  // await getAllActivePlayersNfts();
});

// Set an interval to execute the query function every 5 seconds
// setInterval(queryNFTs, 5000);


///////////////////////////////////////////////////////////////////////////////////////////////////
// Routes
const basicAuth = require('express-basic-auth');
function tryGloAccess(req, res, next) {
  // Check if the session is already authenticated
  if (req.session.authenticated) {
    return next(); // Proceed if already authenticated
  }

  // Apply basic authentication if not authenticated
  const basicAuthMiddleware = basicAuth({
    users: { 'guest': 'dokwonski' }, // Replace with your actual credentials
    challenge: true,
    realm: 'Imb4T3st4pp',
  });

  // Use the basicAuthMiddleware, and set session as authenticated upon success
  basicAuthMiddleware(req, res, () => {
    req.session.authenticated = true; // Set session flag as authenticated
    next();
  });
}

app.get('/', tryGloAccess, (req, res) => {
  res.render('pages/index');
});

//handle maison

// Basic auth configuration
const authMiddleware = basicAuth({
    users: { 'admin': 'password' }, // Replace 'admin' and 'password' with your desired credentials
    challenge: true, // This will cause most browsers to show a popup to enter credentials
    realm: 'djklw83u5',
});

// Apply basic auth middleware to your /maison route
app.use('/maison', authMiddleware);
app.get('/maison', (req, res) => {
  res.render('pages/maison');
});

app.get('/leaderboard', tryGloAccess, (req, res) => {
  res.render('pages/index');
});

app.get('/luncman', tryGloAccess, (req, res) => {
  res.render('pages/index');
});

app.get('/gloprint', tryGloAccess, (req, res) => {
  res.render('pages/index');
});

app.get('/glomint', tryGloAccess, (req, res) => {
  res.render('pages/index');
});

app.get('/glomint/glazer', tryGloAccess, (req, res) => {
  res.redirect('/glomint');
});

app.get('/glomart', tryGloAccess, (req, res) => {
  res.render('pages/index');
});

app.get('/glomart/:subdomain', tryGloAccess, (req, res) => {
  console.log('/glomart/subdomain');
  const subdomain = req.params.subdomain;
  // Now you can use the subdomain variable in your handler function
  res.render('pages/index');
});

// MarketPool route
app.get('/glomart/market/:pools', tryGloAccess, async (req, res) => {
  try {
    res.render('pages/index');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// MarketPool route
app.get('/glomart/market/:pools/:listings', tryGloAccess, async (req, res) => {
  try {
    res.render('pages/index');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

app.get('/glomart/market/:pools/:listings/:token_id', tryGloAccess, async (req, res) => {
  try {
    // Get the token_id from the URL parameters
    const { token_id } = req.params;

    // Retrieve the listing from Redis using the token_id
    const listing = await marketplaceRedisClient.hget(`${token_id}`, 'listing');

    // Parse the listing from JSON to a JavaScript object
    const parsedListing = JSON.parse(listing);

    // Render the listing
    res.render('pages/index', { data: parsedListing });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Helper function to extract the wallet ID from the cookie
const getWalletIdFromToken = (req) => {
  try {
    const token = req.cookies.token;
    // Replace 'your-secret-key' with the actual secret key used for signing the JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY); 
    return { walletID: decoded.walletID, error: null };
  } catch (error) {
    // Handle the error based on its type
    if (error instanceof jwt.TokenExpiredError) {
      // Handle expired token error
      console.error('Token has expired');
      return { walletID: null, error: 'Token has expired' };
    } else {
      // Handle other possible errors (e.g., token invalid, verification error)
      console.error('Error verifying token:', error);
      return { walletID: null, error: 'Error verifying token' };
    }
  }
};

//api/chatters/username schema validation
app.get('/api/chatters/:username', async (req, res) => {
  const username = req.params.username;
  const userInfo = await chatRedisClient.hget('chatters', username);
  res.json(JSON.parse(userInfo));
});

//update schema validation
app.post("/updateLogin", async (req, res) => {
  const address = req.body.walletID;
  req.session.walletID = address; // store user information in session
  console.log(address);

  ChannelModel.findOne({ walletID: address }, async (err, existingUser) => {
    if (err) {
      console.log('Error checking for existing user:', err);
      return res.status(500).json({ error: 'Error checking for existing user' });
    }

    if (existingUser) {
      console.log('WalletID already exists, updating last login.');

      // // Check ownership of each active NFT
      // const activeNfts = existingUser.activeNfts;
      // let baseTokenIds = [];

      // // Ensure activeNfts is an object and not null
      // if (activeNfts && typeof activeNfts === 'object') {
      //   baseTokenIds = Object.values(activeNfts);
      // }

      // console.log('checking nft ownership', baseTokenIds)
      // const ownershipResponses = await checkNFTOwnership(baseTokenIds, address);
      // console.log('nft ownership response', ownershipResponses)

      // // If the ownership check fails for any NFT, set it to an empty string in activeNfts
      // let nftsRemoved = false;
      // if (baseTokenIds.length > 0) {
      //   Object.keys(activeNfts).forEach((key, index) => {
      //     if (!ownershipResponses[index]) {
      //       activeNfts[key] = '';
      //       nftsRemoved = true;
      //     }
      //   });
      // }

      // // Update the user's activeNfts in the database only if any NFTs were updated
      // if (nftsRemoved) {
      //   existingUser.activeNfts = activeNfts;
      //   await existingUser.save();
      // }

      // Continue with the existing login process
      existingUser.updateOne({ lastLogin: Date.now() }, (err, updateResult) => {
        if (err) {
          console.log('Error updating last login:', err);
          return res.status(500).json({ error: 'Error updating last login' });
        } else {
          // Update the player info in Redis
          chatRedisClient.hget('chatters', address, (err, result) => {
            if (err) {
              console.log('Error getting player from Redis:', err);
            } else if (result) {
              // If the walletID exists, update the player info in Redis
              chatRedisClient.hset('chatters', address, JSON.stringify(existingUser));
            }
          });

          const token = jwt.sign({ walletID: address }, process.env.JWT_SECRET_KEY, { expiresIn: '1d' });
          const refreshToken = jwt.sign({ walletID: address }, process.env.REFRESH_TOKEN_SECRET);
          existingUser.refreshToken = refreshToken;
          existingUser.save();
          res.cookie('token', token, {
            httpOnly: true,
            secure: true,  // Ensure this is set to true before launching in a production environment and configure HTTPS.
            sameSite: 'Strict'
          });
          res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: true,  // Ensure this is set to true before launching in a production environment and configure HTTPS.
            sameSite: 'Strict'
          });
          return res.json(existingUser);
        }
      });
      return;
    }

    // If walletID doesn't exist, return false
    return res.json(false);
  });
});

//new player schema validation
app.post("/newplayer", (req, res) => {
  const { walletID, nickname } = req.body;

  // Create and save the new user
  var channelModel = new ChannelModel();
  channelModel.walletID = walletID;
  channelModel.highscore = 0;
  channelModel.nickname = nickname; // Set nickname to the input value
  channelModel.registrationDate = Date.now();
  channelModel.lastLogin = Date.now();
  channelModel.gloLvl = 1;
  channelModel.friends = [];
  channelModel.friendRequestsSent = [];
  channelModel.friendRequestsReceieved = [];
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
  channelModel.ranks = {
    luncRank: null,
    levelRank: null
  };
  channelModel.achievements = [];
  channelModel.activeNfts = {
    pfp: '',
    glotag: '',
    arcade: '',
    luncman: '',
    victory: '',
    reactions: []
  };

  channelModel.save((err, data) => {
    if (err) {
      if (err.code === 11000) {
        console.log('Error: User already exists');
        return res.status(409).json({ error: 'User already exists' });
      } else {
        console.log('Error saving new player:', err);
        return res.status(500).json({ error: 'Error saving new player' });
      }
    } else {
      console.log({ 'msg': 'Inserted Player in the Leaderboard' });
      const token = jwt.sign({ walletID: walletID }, process.env.JWT_SECRET_KEY, { expiresIn: '1d' });
      const refreshToken = jwt.sign({ walletID: walletID }, process.env.REFRESH_TOKEN_SECRET);
      channelModel.refreshToken = refreshToken;
      channelModel.save();
      res.cookie('token', token, {
          httpOnly: true,
          secure: true,  // Ensure this is set to true before launching in a production environment and configure HTTPS.
          sameSite: 'Strict'
      });
      res.cookie('refreshToken', refreshToken, {
          httpOnly: true,
          secure: true,  // Ensure this is set to true before launching in a production environment and configure HTTPS.
          sameSite: 'Strict'
      });
      console.log('token: ', token);
      return res.json(channelModel); // return the newly created player model as JSON
    }
  });
});

//update active nft category schema validation
app.post("/updateActiveNftCategory", async (req, res) => {
  const {label, baseTokenId } = req.body;
  const { walletID, error } = getWalletIdFromToken(req);
  console.log('walletID', walletID, 'label', label, 'baseTokenId', baseTokenId);

  // Find the user with the given walletID and update their activeNfts
  ChannelModel.findOne({ walletID: walletID }, (err, channelModel) => {
    if (err) {
      console.log('Error finding player:', err);
      return res.status(500).json({ error: 'Error finding player' });
    } else {
      // Update the specific category of activeNfts
      channelModel.activeNfts[label] = baseTokenId;

      // Save the updated user
      channelModel.save((err, data) => {
        if (err) {
          console.log('Error saving updated player:', err);
          return res.status(500).json({ error: 'Error saving updated player' });
        } else {
          console.log('Updated activeNfts successfully');

          // Update the player info in Redis
          chatRedisClient.hget('chatters', walletID, (err, result) => {
            if (err) {
              console.log('Error getting player from Redis:', err);
            } else if (result) {
              // If the walletID exists, update the player info in Redis
              chatRedisClient.hset('chatters', walletID, JSON.stringify(data));
            }
          });

          return res.json(data); // return the updated player model as JSON
        }
      });
    }
  });
});

//refresh schema validation
app.post('/refresh', (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  const accessToken = req.cookies.token;
  console.log('refreshing for user', refreshToken, accessToken)

  if (!refreshToken && !accessToken) {
    console.log('User had no tokens')
    return res.status(403).json({ error: 'No tokens provided' });
  }

  if (refreshToken) {
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
      if (err) {
        console.log('User had invalid refresh token')
        return res.status(403).json({ error: 'Invalid refresh token' });
      }

      console.log('User has valid refresh token, generating new tokens for', user.walletID)
      return generateTokensAndRespond(user.walletID, res);
    });
  } else if (accessToken) {
    jwt.verify(accessToken, process.env.JWT_SECRET_KEY, (err, user) => {
      if (err) {
        console.log('User had invalid access token')
        return res.status(403).json({ error: 'Invalid access token' });
      }

      console.log('User has valid access token, generating new tokens for', user.walletID)
      return generateTokensAndRespond(user.walletID, res);
    });
  }
});

function generateTokensAndRespond(walletID, res) {
  ChannelModel.findOne({ walletID: walletID }, (err, existingUser) => {
    if (err || !existingUser) {
      return res.status(403).json({ error: 'User not found' });
    }

    const newToken = jwt.sign({ walletID: walletID }, process.env.JWT_SECRET_KEY, { expiresIn: '1d' });
    const newRefreshToken = jwt.sign({ walletID: walletID }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '1y' });

    res.cookie('token', newToken, {
      httpOnly: true,
      secure: true,  // Ensure this is set to true before launching in a production environment and configure HTTPS.
      sameSite: 'Strict'
    });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: true,  // Ensure this is set to true before launching in a production environment and configure HTTPS.
      sameSite: 'Strict'
    });

    // Send the new tokens and the user's data
    console.log('Successfully refreshed token for', walletID);
    return res.json({ token: newToken, refreshToken: newRefreshToken, userInfo: existingUser });
  });
}

app.get("/logout", (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0)
  });
  res.cookie('refreshToken', '', {
    httpOnly: true,
    expires: new Date(0)
  });
  res.send('Logged out');
});

//accept friend schema validation
app.post("/acceptfriend", (req, res) => {
  const { userAddress, error } = getWalletIdFromToken(req);
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


//request friend schema validation
app.post("/requestfriend", (req, res) => {
  const { userAddress, error } = getWalletIdFromToken(req);
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
 
//read schema validation
app.get("/read", async (req, res) => {
  console.log('cookie:', req.cookies.token);
  try {
    // 1. Extract the JWT from the secured cookie
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    // 2. Verify the JWT using your secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY); // Note: 'your-secret-key' should be stored securely

    const wallet = decoded.walletID;

    // 3. Use the walletID to fetch the user's data
    const channel = await ChannelModel.findOne({ walletID: wallet });

    if (!channel) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if the walletID exists in Redis
    chatRedisClient.hget('chatters', wallet, (err, result) => {
      if (err) {
        console.log('Error getting player from Redis:', err);
      } else if (result) {
        // If the walletID exists, update the player info in Redis
        chatRedisClient.hset('chatters', wallet, JSON.stringify(channel));
      }
    });

    // Check ownership of each active NFT

    // If the ownership check fails for any NFT, set it to an empty string in activeNfts

    // Update the user's activeNfts in the database only if any NFTs were updated

    // Return the entire channel document as JSON
    res.json(channel);

  } catch (error) {
    // 4. If the JWT is invalid or any other error occurs
    if (error.name === 'TokenExpiredError') {
      // If the token is expired, try to refresh it
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) {
        return res.status(401).json({ error: "No refresh token provided" });
      }

      try {
        const newToken = jwt.sign({ walletID: wallet }, process.env.JWT_SECRET_KEY, { expiresIn: '1d' });
        channel.refreshToken = refreshToken;
        await channel.save();
        res.cookie('token', newToken, { httpOnly: true }); // Set the new token in a secure HTTP-only cookie
        return res.status(200).json({ message: "Token refreshed" });
      } catch (refreshError) {
        return res.status(401).json({ error: "Unable to refresh token" });
      }
    }
    return res.status(401).json({ error: "Unauthorized" });
  }
});

//get player info schema validation
app.post("/get_player_info", async (req, res) => {
  // Extract the token from the request headers or cookies
  const token = req.cookies.token;
  
  try {
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    // Verify the JWT using your secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY); // Use your actual secret key
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

//get player schema validation
app.post("/get_player", async (req, res) => {
  // Extract the walletID from the request body
  const walletID = req.body.walletID;

  try {
    if (!walletID) {
      return res.status(400).json({ error: "No walletID provided" });
    }

    // Use the walletID to fetch the user's data from the database
    const player = await ChannelModel.findOne({ walletID: walletID });

    // If no player is found, return an error
    if (!player) {
      return res.status(404).json({ error: "Player not found" });
    }

    // Return the found player document as JSON
    res.json(player);

  } catch (error) {
    // If any error occurs
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

//update player schema validation
app.post("/updateplayer", async (req, res) => {
  const { walletID, newUsername } = req.body;

  try {
    const updatedPlayer = await ChannelModel.findOneAndUpdate(
      { walletID },
      { $set: { nickname: newUsername } },
      { new: true, useFindAndModify: false }
    );

    console.log("Username updated:", updatedPlayer);

    // After updating MongoDB, also update Redis if there's a related entry
    const playerInfoInRedis = await chatRedisClient.hget('chatters', walletID);
    if (playerInfoInRedis) {
      const playerInfo = JSON.parse(playerInfoInRedis);
      playerInfo.nickname = newUsername; // Update nickname in the cached info
      await chatRedisClient.hset('chatters', walletID, JSON.stringify(playerInfo));
      console.log("Updated nickname in Redis for", walletID);
    }

    res.status(200).send({ message: "Username updated successfully" });
  } catch (err) {
    console.error("Error updating username:", err);
    if (err.code === 11000) {
      res.status(409).send({ message: "Username already taken" });
    } else {
      res.status(500).send({ message: "Error updating username" });
    }
  }
});

 //highscore schema validation
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
  

 //update schema validation
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
  'tier1': 0.10,
  'tier2': 0.15,
  'tier3': 0.20,
  'tier4': 0.25,
  'tier5': 0.35,
  'tier6': 0.50
};

const minScore = 1000; 

function getPercentile(score, maxScore) {
  if (maxScore === minScore) {
    return 0; // Avoid division by zero
  }
  return ((score - minScore) / (maxScore - minScore)) * 100;
}

async function getWinningChance(score, maxScore) {
  try {
    if (score < minScore) {
      return 0; // Return 0 if the score is below the minimum
    }

    if (score >= 1000 && score <= 1500) {
      return winningChances['tier1'];
    } else if (score > 1500 && score <= 2000) {
      return winningChances['tier2'];
    } else if (score > 2000 && score <= 2500) {
      return winningChances['tier3'];
    } else if (score > 2500 && score <= 3000) {
      return winningChances['tier4'];
    } else if (score > 3000 && score <= 4000) {
      return winningChances['tier5'];
    } else if (score > 4000) {
      return winningChances['tier6'];
    }

    // const percentile = getPercentile(score, maxScore);

    // if (percentile <= 25) {
    //   return winningChances['tier1'];
    // } else if (percentile <= 50) {
    //   return winningChances['tier2'];
    // } else if (percentile <= 75) {
    //   return winningChances['tier3'];
    // } else {
    //   return winningChances['tier4'];
    // }
  } catch (error) {
    console.error('Error in calculating winning chance:', error);
    // Log the error and do not throw to avoid crashing
  }
} 

async function mintRewardGlochip(userWalletAddress, performanceCategory) {
  try {
    console.log('User', userWalletAddress, 'won with the performance category', performanceCategory);

    const mintMessage = {
      mint: {
        extension: {},
        token_type: {
          "GloChip": {
            "performance_category": performanceCategory,
            "season_id": "predemo",
            "special": false
          }
        },
        owner: userWalletAddress
      }
    };

    const executeMsg = new MsgExecuteContract(
      wallet.key.accAddress('terra'), // sender address
      minterAddress,       // minter contract address
      mintMessage            // execute message
    );

    console.log('Attempting to mint glochip', executeMsg)

    // Sign and send the transaction
    const tx = await wallet.createAndSignTx({ msgs: [executeMsg], chainID: 'pisco-1' });
    const result = await lcd.tx.broadcast(tx, 'pisco-1');
    const rawLog = JSON.parse(result.raw_log);
    const tokenId = rawLog[0].events.find(event => event.type === 'wasm').attributes.find(attr => attr.key === 'token_id').value;

    console.log('Token ID:', tokenId);
    return tokenId; // return the tokenId
  } catch (error) {
    console.error('Error in minting GloChip:', error);
    // Log the error and do not throw to avoid crashing
  }
}

 //simulate win schema validation
app.post('/simulateWin', async (req, res) => {
  try {
    const score = req.body.score;
    const { walletID, error } = getWalletIdFromToken(req);
    console.log('Checking if', walletID, 'won');
    if (error) {
      return res.status(400).json({ error: "Invalid token" });
    }
    if (!walletID.startsWith('terra')) {
      return res.status(400).json({ error: "Invalid wallet address" });
    }

    const winningChance = await getWinningChance(score); // Await the resolution of the promise
    console.log('Winning chance:', winningChance)
  
    const randomValue = Math.random();
    console.log('Random value:', randomValue)
    const result = (randomValue < winningChance) ? 'win' : 'loss';
    console.log('Result:', result)
    
    let tokenId = null; // Initialize tokenId as null 
    let performanceCategory;
  
    if (result == 'win') {
      // Determine the performance category based on the score
      if (score >= 1000 && score <= 1500) {
        performanceCategory = 'Tier1';
      } else if (score > 1500 && score <= 2000) {
        performanceCategory = 'Tier2';
      } else if (score > 2000 && score <= 2500) {
        performanceCategory = 'Tier3';
      } else if (score > 2500 && score <= 3500) {
        performanceCategory = 'Tier4';
      } else if (score > 3500 && score <= 4500) {
        performanceCategory = 'Tier5';
      } else if (score > 4500) {
        performanceCategory = 'Tier6';
      }
  
      // Call function to mint a reward and get the tokenId
      tokenId = await mintRewardGlochip(walletID, performanceCategory); // Ensure correct variable use: walletID
    }
  
    res.json({
      result,
      winningChance,
      randomValue,
      tokenId // Include the tokenId in the response
    });
  } catch (error) {
    console.error('Error in calculating win:', error);
    res.status(500).json({ error: "Error in calculating win" });
  }
});

app.post('/fakeWin', async (req, res) => {
  try {
    const { walletID, error } = getWalletIdFromToken(req);
    console.log('Faking win for', walletID);
    if (error) {
      return res.status(400).json({ error: "Invalid token" });
    }
    if (!walletID.startsWith('terra')) {
      return res.status(400).json({ error: "Invalid wallet address" });
    }

    // Define the performance categories
    const performanceCategories = ['Tier1', 'Tier2', 'Tier3', 'Tier4', 'Tier5', 'Tier6'];

    // Randomly select a performance category
    const performanceCategory = performanceCategories[Math.floor(Math.random() * performanceCategories.length)];

    // Call function to mint a reward and get the tokenId
    const tokenId = await mintRewardGlochip(walletID, performanceCategory);

    res.json({
      result: 'win',
      performanceCategory,
      percentile: 1,
      tokenId
    });
  } catch (error) {
    console.error('Error in faking win:', error);
    res.status(500).json({ error: "Error in faking win" });
  }
});
   
async function getTopHighScore() {
  try {
    // Fetch the top player based on luncRank sorting
    const topPlayer = await ChannelModel.findOne()
      .sort({ 'ranks.luncRank': 1 })
      .select('highscore');

    // Return the top player's highscore
    return topPlayer.highscore;
  } catch (err) {
    console.error("Error retrieving top luncRank highscore:", err);
    throw err;
  }
}

// leaderboard 
 //leaderboard schema validation
app.get("/api/leaderboard", async (req, res) => {
  const offset = parseInt(req.query.offset) || 0;
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);
  const rankType = req.query.rankType || 'luncRank'; // Default to 'scoreRank' if not specified

  try {
      // Adjusting sort and select based on rankType
      const sortCriteria = rankType === 'levelRank' ? { 'ranks.levelRank': 1 } : { 'ranks.luncRank': 1 };

      // Fetching players with precalculated ranks
      const playersSorted = await ChannelModel.find()
          .sort(sortCriteria)
          .select(`walletID nickname highscore gloLvl ranks.luncRank ranks.levelRank friends, activeNfts`)
          .skip(offset)
          .limit(limit);

      return res.status(200).json(playersSorted);
  } catch (err) {
      console.error("Error retrieving leaderboard:", err);
      return res.status(500).json({ error: "Error retrieving leaderboard" });
  }
});

// New endpoint to fetch player's rank and surrounding players
 //my rank schema validation
app.get("/api/myrank", async (req, res) => {
  const walletID = req.query.walletID; // Changed from req.params to req.query
  const range = 6;

  try {
    const data = await findPlayerRankAndSurrounding(walletID, range);
    res.status(200).json(data);
  } catch (err) {
    console.error("Error retrieving player rank:", err);
    res.status(500).json({ error: "Error retrieving player rank" });
  }
});

async function findPlayerRankAndSurrounding(walletID, range) {
  // Example logic, adjust based on your actual data and database
  // Find the rank of the player
  const playerRank = await ChannelModel.findOne({ walletID: walletID }, 'ranks.luncRank ranks.levelRank');
  if (!playerRank) {
    throw new Error('Player not found');
  }

  const rankType = 'luncRank'; // or 'levelRank'
  const playerRankValue = playerRank.ranks[rankType];

  // Adjust the range to fetch more players below the player's rank
  const minRank = Math.max(1, playerRankValue - Math.floor(range / 2));
  const maxRank = playerRankValue + Math.floor(range / 2);

  // Fetch players within the range
  return await ChannelModel.find({
    [`ranks.${rankType}`]: { $gte: minRank, $lte: maxRank }
  }, 'walletID nickname highscore gloLvl ranks.luncRank ranks.levelRank')
  .sort({ [`ranks.${rankType}`]: 1 });
}

 //search leaderboard schema validation
app.get("/api/searchLeaderboard", async (req, res) => {
  const startsWith = req.query.startsWith || '';

  try {
      // Adjust the search logic to match names starting with the query
      const searchResults = await ChannelModel.find({
          nickname: { $regex: '^' + startsWith, $options: 'i' } // Starts with, case-insensitive
      }).select('walletID nickname highscore gloLvl ranks.luncRank ranks.levelRank');

      res.status(200).json(searchResults);
  } catch (err) {
      console.error("Error retrieving search results:", err);
      res.status(500).json({ error: "Error retrieving search results" });
  }
});

cron.schedule('* * * * *', () => {
    console.log('updating ranks');
    updatePlayerRanks(); // This function will now be called every minute
});


async function updatePlayerRanks() {
  try {
      // Sort by highscore and update levelRank
      let players = await ChannelModel.find().sort({ highscore: -1 });
      for (let i = 0; i < players.length; i++) {
          await ChannelModel.updateOne({ _id: players[i]._id }, { $set: { 'ranks.luncRank': i + 1 } });
      }

      // Sort by gloLvl and update luncRank
      players = await ChannelModel.find().sort({ gloLvl: -1 });
      for (let i = 0; i < players.length; i++) {
          await ChannelModel.updateOne({ _id: players[i]._id }, { $set: { 'ranks.levelRank': i + 1 } });
      }

      console.log("Ranks updated successfully.");
  } catch (error) {
      console.error("Error updating player ranks:", error);
  }
}

app.post('/reportbug', (req, res) => {
  const input = req.body.input;
  fs.appendFile('bugs.csv', input + '\n', (err) => {
    if (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'an error occurred' });
      return;
    }
    res.json({ success: true, message: 'bug reported successfully' });
  });
});

app.post('/givefeedback', (req, res) => {
  console.log("UPDATING UPDATING UPDATING UPDATING UPDATING UPDATING UPDATING UPDATING UPDATING");
  const input = req.body.input;
  console.log('req.body:', req.body);
  console.log('input:', input); // log the input to see if it's defined
  fs.appendFile('feedback.csv', input + '\n', (err) => {
    if (err) {
      console.error('Error writing to file:', err); // log the error if there is one
      res.status(500).json({ success: false, message: 'an error occurred' });
      return;
    }
    res.json({ success: true, message: 'feedback given successfully' });
  });
});

// Start the App
server.listen(8014, () => { // Note: Using `server.listen` instead of `app.listen`
  console.log('Server running on http://localhost:8014');
});
// httpServer.listen(8012, () => {
//     console.log('HTTP Server running on port 8012');
// });

app.use('/levels', express.static('levels'));