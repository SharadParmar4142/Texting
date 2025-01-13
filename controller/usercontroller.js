const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const { PrismaClient, TransactionStatus } = require('@prisma/client');
const Redis = require('ioredis');
const prisma = new PrismaClient();
const redis = new Redis();
const secretKey = process.env.ACCESS_TOKEN_SECRET; // Secret key for JWT
const io = require('../socket'); // Assuming you have a socket.js file to initialize Socket.io
const constants = require('../constant');
const admin = require('../config/firebase');
const { Sex } = require('@prisma/client');

redis.on('error', (err) => {
    console.error('Redis error:', err);
});


// Function to subscribe listener to FCM topic
const subscribeToTopic = async (deviceToken, topic) => {
    try {
        await admin.messaging().subscribeToTopic([deviceToken], topic);
        console.log(`Successfully subscribed to topic: ${topic}`);
    } catch (error) {
        console.error(`Error subscribing to topic: ${topic}`, error);
    }
};


// @desc Register a User
// @route POST /user/register
// @access Public
const registerUser = asyncHandler(async (req, res) => {
    console.log("Register User Endpoint Hit");

    const { name, email, device_token, age, sex } = req.body;

    // Validate required fields
    if (!name || !email || !device_token || !age || !sex) {
        console.log("Validation Error: Missing required fields");
        res.status(constants.VALIDATION_ERROR);
        throw new Error("All required fields must be filled");
    }

    try {
        console.log("Checking if user already exists");
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            console.log("Validation Error: User already exists");
            res.status(constants.VALIDATION_ERROR);
            throw new Error("User already exists");
        }

        console.log("Creating new user");
        // Create new user with starting ID 30001
        const user = await prisma.user.create({
            data: { id: 30001, name, email, device_token, age, sex }
        });

        console.log("Generating JWT token");
        // Generate JWT token
        const token = jwt.sign({ id: user.id, role: 'user' }, secretKey, { expiresIn: '1h' });

        console.log("Sending notification to listeners");
        // Send notification to listeners
        const title = "New User Registered";
        const message = `A new user with email ${email} has registered.`;
        const link = null; // Add any relevant link if needed
        const imageUrl = null; // Add any relevant image URL if needed

        await prisma.generalNotification.create({
            data: {
                title,
                message,
                link,
                image_URL: imageUrl,
                type: 'LISTENER'
            }
        });

        const notificationMessage = {
            notification: { title, body: message },
            topic: 'listeners',
            ...(imageUrl && { image: imageUrl }),
        };

        await admin.messaging().send(notificationMessage);

        console.log("Sending response to client");
        res.status(201).json({ message: "New user registered and logged in", type: "user", token });
    } catch (error) {
        console.error("Error registering user:", error);
        res.status(500).json({ message: error.message });
    }
});

// @desc Login a User
// @route POST /user/login
// @access Public
const loginUser = asyncHandler(async (req, res) => {
    console.log("Login User Endpoint Hit");

    const { email, device_token, device_token2 } = req.body;

    // Validate required fields
    if (!email || !device_token || !device_token2) {
        console.log("Validation Error: Missing required fields");
        res.status(constants.VALIDATION_ERROR);
        throw new Error("All required fields must be filled");
    }

    try {
        console.log("Checking if user or listener already exists");

        // Check if user exists
        let user = await prisma.user.findUnique({ where: { email } });
        if (user) {
            console.log("User exists, updating device token");
            await prisma.user.update({
                where: { email },
                data: { device_token }
            });
            const token = jwt.sign({ id: user.id, email: user.email, role: 'user' }, secretKey, { expiresIn: '1h' });
            await subscribeToTopic(device_token2, 'users'); // Subscribe to users topic
            res.status(200).json({ message: "User logged in", type: "user", token });
            return;
        }

        // Check if listener exists
        let listener = await prisma.listener.findUnique({ where: { email } });
        if (listener) {
            console.log("Listener exists, updating device token");
            await prisma.listener.update({
                where: { email },
                data: { device_token }
            });
            const token = jwt.sign({ id: listener.id, email: listener.email, role: 'listener' }, secretKey, { expiresIn: '1h' });
            await subscribeToTopic(device_token2, 'listeners'); // Subscribe to listeners topic
            res.status(200).json({ message: "Listener logged in", type: "listener", token });
            return;
        }

        // Register a new user if no existing user or listener
        console.log("Creating new user");
        const newUser = await prisma.user.create({
            data: { email, device_token,device_token2 }
        });
        const token = jwt.sign({ id: newUser.id, email: newUser.email, role: 'user' }, secretKey, { expiresIn: '1h' });
        await subscribeToTopic(device_token2, 'users'); // Subscribe to users topic
        res.status(200).json({ message: "User logged in", type: "user", token });

        // Logic to send inbox notification to listeners that a new user is registered
        const title = "New User Registered";
        const message = `A new user with email ${email} has registered.`;
        const link = null; // Add any relevant link if needed
        const imageUrl = null; // Set imageUrl to null if not provided

        await prisma.generalNotification.create({
            data: {
                title,
                message,
                link,
                image_URL: imageUrl,
                type: 'LISTENER'
            }
        });

        const notificationMessage = {
            notification: { title, body: message },
            topic: 'listeners',
            ...(imageUrl && { image: imageUrl }),
        };

        await admin.messaging().send(notificationMessage);

    } catch (error) {
        console.error("Error logging in user:", error);
        res.status(500).json({ message: error.message });
    }
});

// @desc List Listeners
// @route GET /user/listlisteners
// @access Private
const listListners = asyncHandler(async (req, res) => {
    const cacheKey = 'listListeners';
    const cachedData = await redis.get(cacheKey);

    if (cachedData) {
        return res.status(200).json(JSON.parse(cachedData));
    }

    try {
        const listeners1 = await prisma.listener.findMany({
            where: { online_status: true, busy_status: false },
            select: { name: true, age: true, image: true, language: true }
        });

        const listeners2 = await prisma.listener.findMany({
            where: { online_status: true, busy_status: true },
            select: { name: true, age: true, image: true, language: true }
        });

        const listeners3 = await prisma.listener.findMany({
            where: { online_status: false },
            select: { name: true, age: true, image: true, language: true }
        });

        const result = { listeners1, listeners2, listeners3 };
        await redis.set(cacheKey, JSON.stringify(result), 'EX', 86400); // Cache for 1 day
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc Delete a User
// @route DELETE /user/:id
// @access Private
const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.user;
    try {
        await prisma.user.update({
            where: { id },
            data: { ac_delete: true }
        });
        res.status(200).json({ message: "User is deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc Get Wallet Balance
// @route GET /user/wallet
// @access Private
const walletBalanceUsers = asyncHandler(async (req, res) => {
    const { id } = req.user; // Get user ID from the token
    const cacheKey = `walletBalance:${id}`;
    const cachedData = await redis.get(cacheKey);

    if (cachedData) {
        return res.status(200).json(JSON.parse(cachedData));
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id },
            select: { wallet:true }
        });
        await redis.set(cacheKey, JSON.stringify({ wallet: user.wallet }), 'EX', 86400); // Cache for 1 day
        res.status(200).json({ wallet: user.wallet });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc Deposit to User Wallet
// @route POST /user/deposit
// @access Private
const depositUser = asyncHandler(async (req, res) => {
    console.log("Deposit Endpoint Hit");

    const { amount, orderId, signatureId, transactionValid } = req.body;

    // Validate required fields
    if (!amount || !orderId || !signatureId || transactionValid === undefined) {
        console.log("Validation Error: Missing required fields");
        res.status(constants.VALIDATION_ERROR);
        throw new Error("All required fields must be filled");
    }

    try {
        // Assuming user ID is available in the request (e.g., from a middleware that authenticates the user)
        const userId = req.user.id;

        // Fetch the user's wallet
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { wallet: true }
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (!transactionValid) {
            await prisma.deposit.create({
                data: {
                    userId,
                    amount,
                    orderId,
                    signatureId,
                    mode: 'recharge',
                    status: 'FAILED'
                }
            });
            return res.status(400).json({ message: "Transaction failed, please retry" });
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { wallet: user.wallet + amount }
        });

        await prisma.deposit.create({
            data: {
                userId,
                amount,
                orderId,
                signatureId,
                mode: 'recharge',
                status: 'SUCCESS'
            }
        });

        console.log("Deposit successful");
        res.status(200).json({ message: "Deposit successful", balance: updatedUser.wallet });
    } catch (error) {
        console.error("Error processing deposit:", error);
        res.status(500).json({ message: error.message });
    }
});

// @desc Transfer to Listener Wallet for talking
// @route POST /user/transaction
// @access Private
const transaction = asyncHandler(async (req, res) => {
    const { amount, listenerId, mode, duration } = req.body;
    const id = req.user.id; // Get user ID from the token

    if (!amount || !listenerId || !mode) {
        return res.status(400).json({ message: "All required fields must be filled" });
    }

    const listenerShare = amount * 0.5;
    const appShare = amount - listenerShare;

    try {
        await prisma.$transaction(async (tx) => {

            // Check if listener exists
            const listener = await tx.listener.findUnique({
                where: { id: listenerId }
            });

            if (!listener) {
                throw new Error("Listener not found");
            }

            // Check if user has enough wallet balance
            const userWallet = await tx.user.findUnique({
                where: { id },
                select: { wallet: true }
            });

            if (!userWallet || userWallet.wallet < amount) {
                throw new Error("Insufficient balance, please recharge your wallet");
            }

            // Deduct amount from user's wallet
            await tx.user.update({
                where: { id },
                data: { wallet: { decrement: amount } }
            });
            
            // Add listener's share to their wallet
            await tx.listener.update({
                where: { id: listenerId },
                data: { wallet: { increment: listenerShare } }
            });

            // Create transaction with SUCCESS status
            await tx.transaction.create({
                data: {
                    userId: id,
                    listenerId,
                    amount,
                    listenerShare,
                    appShare,
                    mode,
                    duration,
                    status: TransactionStatus.SUCCESS, // Enum value
                }
            });

            res.status(200).json({ message: "Transaction successful" });
        });
    } catch (error) {
        // Check if listener exists before creating a transaction with FAILED status
        const listenerExists = await prisma.listener.findUnique({
            where: { id: listenerId }
        });

        if (listenerExists) {
            await prisma.transaction.create({
                data: {
                    userId: id,
                    listenerId,
                    amount,
                    listenerShare,
                    appShare,
                    mode,
                    duration,
                    status: TransactionStatus.FAILED, // Enum value
                }
            });
        }

        res.status(500).json({ message: error.message || "Transaction failed" });
    }
});

// @desc Update the existing user data
// @route PUT /user/updateProfile/:id
// @access Private
const updateProfile = asyncHandler(async (req, res) => {
    try {
        const { id } = req.user; // User ID from JWT token
        const {
          name,
          sex,         // Enum: MALE or FEMALE
          drinking,    // Enum: YES or NO
          smoking,     // Enum: YES or NO
          bio,
          language,
          interests,
          relationship,
          pets,
          star_sign
        } = req.body;
    
        // Validate required inputs (optional)
        if (!id) return res.status(400).json({ error: "User ID is required" });
    
        // Update the user in the database
        const updatedUser = await prisma.user.update({
          where: { id: parseInt(id) },
          data: {
            name,
            sex: sex.toUpperCase(),         // Enum: MALE or FEMALE
            drinking,    // Enum: YES or NO
            smoking,     // Enum: YES or NO
            bio,
            language,
            interests,
            relationship,
            pets,
            star_sign,
          },
        });
    
        return res.status(200).json({
          message: "User updated successfully",
          user: updatedUser,
        });
      } catch (error) {
        console.error("Error updating user:", error);
        return res.status(500).json({ error: "Internal server error" });
      }
});

// @desc Update the existing user work data
// @route PUT /user/updateProfile/work/:id
// @access Private
const updateWork = asyncHandler(async (req, res) => {
    try {
        const { id } = req.user;
        const { work } = req.body;

        if (!id) return res.status(400).json({ error: "User ID is required" });

        // Fetch existing work entries
        const existingWork = await prisma.user_work.findMany({
            where: { userId: parseInt(id) }
        });

        // Create a map of existing work entries by name
        const existingWorkMap = new Map(existingWork.map(item => [item.name, item]));

        // Prepare upsert operations
        const upsertOperations = work.map(item => {
            if (existingWorkMap.has(item.name)) {
                // Update existing entry
                return prisma.user_work.update({
                    where: { id: existingWorkMap.get(item.name).id },
                    data: {
                        company: item.company,
                        position: item.position,
                        start_year: item.start_year,
                        end_year: item.end_year
                    }
                });
            } else {
                // Create new entry
                return prisma.user_work.create({
                    data: {
                        userId: parseInt(id),
                        name: item.name,
                        company: item.company,
                        position: item.position,
                        start_year: item.start_year,
                        end_year: item.end_year
                    }
                });
            }
        });

        // Execute upsert operations
        await prisma.$transaction(upsertOperations);

        // Fetch updated work entries
        const updatedWork = await prisma.user.findUnique({
            where: { id: parseInt(id) },
            include: { work: true }
        });

        return res.status(200).json({
            message: "User work updated successfully",
            user: updatedWork
        });
    } catch (error) {
        console.error("Error updating user work:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

// @desc Update the existing user education data
// @route PUT /user/updateProfile/education/:id
// @access Private
const updateEducation = asyncHandler(async (req, res) => {
    try {
        const { id } = req.user;
        const { education } = req.body;

        if (!id) return res.status(400).json({ error: "User ID is required" });

        // Fetch existing education entries
        const existingEducation = await prisma.user_education.findMany({
            where: { userId: parseInt(id) }
        });

        // Create a map of existing education entries by name
        const existingEducationMap = new Map(existingEducation.map(item => [item.name, item]));

        // Prepare upsert operations
        const upsertOperations = education.map(item => {
            if (existingEducationMap.has(item.name)) {
                // Update existing entry
                return prisma.user_education.update({
                    where: { id: existingEducationMap.get(item.name).id },
                    data: {
                        qualificationType: item.qualificationType,
                        institutionName: item.institutionName,
                        start_year: item.start_year,
                        end_year: item.end_year
                    }
                });
            } else {
                // Create new entry
                return prisma.user_education.create({
                    data: {
                        userId: parseInt(id),
                        name: item.name,
                        qualificationType: item.qualificationType,
                        institutionName: item.institutionName,
                        start_year: item.start_year,
                        end_year: item.end_year
                    }
                });
            }
        });

        // Execute upsert operations
        await prisma.$transaction(upsertOperations);

        // Fetch updated education entries
        const updatedEducation = await prisma.user.findUnique({
            where: { id: parseInt(id) },
            include: { education: true }
        });

        return res.status(200).json({
            message: "User education updated successfully",
            user: updatedEducation
        });
    } catch (error) {
        console.error("Error updating user education:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

// @desc Get User or Listener Details by ID
// @route GET /user/details/:id
// @access Private
const getUserOrListenerDetails = asyncHandler(async (req, res) => {
    const { id } = req.params;
    try {
        const user = await prisma.user.findUnique({
            where: { id: parseInt(id) },
            select: { 
                name: true, 
                age: true, 
                sex: true,
                language: true,
                relationship: true,
                image: true, 
                star_sign: true,
                pets: true,
                drinking: true,
                smoking: true,
                }
        });

        if (user) {
            return res.status(200).json(user);
        }
        const listener = await prisma.listener.findUnique({
            where: { id: parseInt(id) },
            select: { name: true, age: true, hobbies: true, language: true, image: true, about: true }
        });

        if (listener) {
            return res.status(200).json(listener);
        }

        res.status(404).json({ message: "User or Listener not found" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc List all transactions made by the user
// @route GET /user/transactions
// @access Private
const listUserTransactions = asyncHandler(async (req, res) => {
    const { id } = req.user; // Get user ID from the token
    const cacheKey = `userTransactions:${id}`;
    const cachedData = await redis.get(cacheKey);

    if (cachedData) {
        return res.status(200).json(JSON.parse(cachedData));
    }

    try {
        const transactions = await prisma.transaction.findMany({
            where: { userId: id },
            orderBy: { created_at: 'desc' },
            select: {
                id: true,
                amount: true,
                mode: true,
                status: true,
                created_at: true,
                listener: {
                    select: {
                        name: true,
                        image: true
                    }
                }
            }
        });
        await redis.set(cacheKey, JSON.stringify(transactions), 'EX', 86400); // Cache for 1 day
        res.status(200).json(transactions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc List all deposits made by the user
// @route GET /user/deposits
// @access Private
const listUserDeposits = asyncHandler(async (req, res) => {
    const { id } = req.user; // Get user ID from the token
    const cacheKey = `userDeposits:${id}`;
    const cachedData = await redis.get(cacheKey);

    if (cachedData) {
        return res.status(200).json(JSON.parse(cachedData));
    }

    try {
        const deposits = await prisma.deposit.findMany({
            where: { userId: id },
            orderBy: { created_at: 'desc' },
            select: {
                id: true,
                amount: true,
                orderId: true,
                signatureId: true,
                mode: true,
                status: true,
                created_at: true
            }
        });
        await redis.set(cacheKey, JSON.stringify(deposits), 'EX', 86400); // Cache for 1 day
        res.status(200).json(deposits);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc Send Connection Request
// @route POST /user/sendConnectionRequest
// @access Private
const sendConnectionRequest = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { listenerId, communicationType } = req.body;

    if (!userId || !listenerId || !communicationType) {
        return res.status(400).json({ message: "All required fields must be filled" });
    }

    try {
        // Check if listener is available
        const listener = await prisma.listener.findUnique({
            where: { id: listenerId, online_status: true, busy_status: false }
        });

        if (!listener) {
            return res.status(400).json({ message: "Listener is not available" });
        }

        const connectionRequest = await prisma.connectionRequest.create({
            data: {
                userId,
                listenerId,
                communicationType,
                status: 'PENDING'
            }
        });

        // Notify listener of the connection request
        const listenerDeviceToken = io.getListenerDeviceToken(listenerId);
        if (listenerDeviceToken) {
            io.getIo().to(listenerDeviceToken).emit('connectionRequest', connectionRequest);
        }

        // Set a timeout to handle missed calls
        setTimeout(async () => {
            const updatedRequest = await prisma.connectionRequest.findUnique({
                where: { id: connectionRequest.id }
            });

            if (updatedRequest.status === 'PENDING') {
                await prisma.missedCall.create({
                    data: {
                        userId,
                        listenerId,
                        mode: communicationType
                    }
                });

                await prisma.connectionRequest.update({
                    where: { id: connectionRequest.id },
                    data: { status: 'MISSED' }
                });
            }
        }, 30000); // 30 seconds

        res.status(201).json({ message: "Connection request sent", connectionRequest });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc Accept Connection Request
// @route POST /user/acceptConnectionRequest
// @access Private
const acceptConnectionRequest = asyncHandler(async (req, res) => {
    const { requestId } = req.body;

    if (!requestId) {
        return res.status(400).json({ message: "Request ID is required" });
    }

    try {
        // Fetch the connection request details
        const connectionRequest = await prisma.connectionRequest.findUnique({
            where: { id: requestId },
            include: { listener: true } // Include listener details for validation
        });

        if (!connectionRequest) {
            return res.status(404).json({ message: "Connection request not found" });
        }

        // Validate listener's availability
        const { listener } = connectionRequest;
        if (!listener || !listener.online_status || listener.busy_status) {
            return res.status(400).json({ message: "Listener is not available" });
        }

        // Update the request status to 'ACCEPTED'
        const updatedRequest = await prisma.connectionRequest.update({
            where: { id: requestId },
            data: { status: 'ACCEPTED' }
        });

        // Emit events for user and listener
        const userDeviceToken = io.getUserDeviceToken(connectionRequest.userId);
        if (userDeviceToken) {
            io.getIo().to(userDeviceToken).emit('connectionAccepted', {
                message: "Your request has been accepted",
                connectionRequest: updatedRequest,
            });
        }

        const listenerDeviceToken = io.getListenerDeviceToken(connectionRequest.listenerId);
        if (listenerDeviceToken) {
            io.getIo().to(listenerDeviceToken).emit('connectionReady', {
                message: "You are connected to the user",
                connectionRequest: updatedRequest,
            });
        }

        res.status(200).json({ message: "Connection request accepted", connectionRequest: updatedRequest });
    } catch (error) {
        console.error("Error accepting connection request:", error);
        res.status(500).json({ message: error.message });
    }
});

// @desc Check if user is blocked by listener
// @route GET /user/isUserBlocked/:listenerId
// @access Private
const isUserBlockedByListener = asyncHandler(async (req, res) => {
    const { id: userId } = req.user; // Get user ID from the token
    const { listenerId } = req.params;

    try {
        const listener = await prisma.listener.findUnique({
            where: { id: parseInt(listenerId) },
            include: { blocked_users: true }
        });

        if (listener.blocked_users.some(user => user.id === parseInt(userId))) {
            return res.status(200).json({ blocked: true });
        } else {
            return res.status(200).json({ blocked: false });
        }
    } 
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc Get all inbox notifications for the user
// @route GET /user/inbox/notifications
// @access Private
const getUserInboxNotifications = asyncHandler(async (req, res) => {
    const { id } = req.user; // Get user ID from the token

    try {
        const generalNotifications = await prisma.generalNotification.findMany({
            where: {
                OR: [
                    { type: 'ALL' },
                    { type: 'USER' }
                ]
            },
            orderBy: { created_at: 'desc' }
        });

        const specificNotifications = await prisma.specificNotification.findMany({
            where: { userId: id },
            orderBy: { created_at: 'desc' }
        });

        const notifications = [...generalNotifications, ...specificNotifications];
        notifications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        res.status(200).json(notifications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc Send message to listener
// @route POST /user/sendMessage
// @access Private
const sendMessageToListener = asyncHandler(async (req, res) => {
    const { listenerId, message } = req.body;
    const { id: userId } = req.user; // Get user ID from the token

    if (!listenerId || !message) {
        return res.status(400).json({ message: "Listener ID and message are required" });
    }

     // Check if listener exists
    const listener = await prisma.listener.findUnique({
        where: { id: listenerId }
    });

    if (!listener) {
        throw new Error("Listener does not exist.");
    }

    try {
        const newMessage = await prisma.messageListener.create({
            data: {
                senderId: userId,
                receiverId: listenerId,
                message
            }
        });

        // Fetch listener's device token
        const listener = await prisma.listener.findUnique({
            where: { id: listenerId },
            select: { device_token: true }
        });

        if (listener && listener.device_token2) {
            const notificationMessage = {
                notification: { title: "New Message", body: message },
                token: listener.device_token
            };

            await admin.messaging().send(notificationMessage);
        }

        res.status(201).json({ message: "Message sent to listener", newMessage });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc Get messages sent to the user from listeners
// @route GET /user/messages
// @access Private
const getUserMessages = asyncHandler(async (req, res) => {
    const { id: userId } = req.user; // Get user ID from the token

    try {
        const messages = await prisma.messageUser.findMany({
            where: { receiverId: userId },
            orderBy: { created_at: 'desc' },
            include: {
                listener: {
                    select: { name: true }
                }
            }
        });

        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = {
    registerUser,
    loginUser,
    listListners,
    deleteUser,
    walletBalanceUsers,
    depositUser,
    transaction,
    updateProfile,
    getUserOrListenerDetails,
    updateWork,
    updateEducation,
    listUserTransactions,
    listUserDeposits,
    sendConnectionRequest,
    acceptConnectionRequest,
    isUserBlockedByListener,
    getUserInboxNotifications,
    sendMessageToListener,
    getUserMessages
};


