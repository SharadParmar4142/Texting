const asyncHandler = require('express-async-handler');
const { PrismaClient } = require('@prisma/client');
const Redis = require('ioredis');
const prisma = new PrismaClient();
const redis = new Redis();
const admin = require('../config/firebase');
const uploadImageToS3 = require('../utils/uploadImage');
redis.on('error', (err) => {
    console.error('Redis error:', err);
});

// @desc Count total number of listeners
// @route GET /dashboard/countListeners
// @access Private
const countListeners = asyncHandler(async (req, res) => {
    const cacheKey = 'countListeners';
    const cachedData = await redis.get(cacheKey);

    if (cachedData) {
        return res.status(200).json(JSON.parse(cachedData));
    }

    try {
        const count = await prisma.listener.count();
        await redis.set(cacheKey, JSON.stringify({ totalListeners: count }), 'EX', 86400); // Cache for 1 day
        res.status(200).json({ totalListeners: count });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc Count number of new listeners registered this month
// @route GET /dashboard/countNewListeners
// @access Private
const countNewListeners = asyncHandler(async (req, res) => {
    const cacheKey = 'countNewListeners';
    const cachedData = await redis.get(cacheKey);

    if (cachedData) {
        return res.status(200).json(JSON.parse(cachedData));
    }

    try {
        const count = await prisma.listener.count({
            where: {
                created_at: {
                    gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                }
            }
        });
        await redis.set(cacheKey, JSON.stringify({ newListenersThisMonth: count }), 'EX', 86400); // Cache for 1 day
        res.status(200).json({ newListenersThisMonth: count });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc Count the listeners who are busy
// @route GET /dashboard/listBusyListeners
// @access Private
const listBusyListeners = asyncHandler(async (req, res) => {
    const cacheKey = 'listBusyListeners';
    const cachedData = await redis.get(cacheKey);

    if (cachedData) {
        return res.status(200).json(JSON.parse(cachedData));
    }

    try {
        const listeners = await prisma.listener.count({
            where: { busy_status: true },
        });
        await redis.set(cacheKey, JSON.stringify(listeners), 'EX', 86400); // Cache for 1 day
        res.status(200).json(listeners);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc Count number of new users registered this month
// @route GET /dashboard/countNewUsers
// @access Private
const countNewUsers = asyncHandler(async (req, res) => {
    const cacheKey = 'countNewUsers';
    const cachedData = await redis.get(cacheKey);

    if (cachedData) {
        return res.status(200).json(JSON.parse(cachedData));
    }

    try {
        const count = await prisma.user.count({
            where: {
                created_at: {
                    gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                }
            }
        });
        await redis.set(cacheKey, JSON.stringify({ newUsersThisMonth: count }), 'EX', 86400); // Cache for 1 day
        res.status(200).json({ newUsersThisMonth: count });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc Sum total recharge amount today
// @route GET /dashboard/rechargeToday
// @access Private
const rechargeToday = asyncHandler(async (req, res) => {
    const cacheKey = 'rechargeToday';
    const cachedData = await redis.get(cacheKey);

    if (cachedData) {
        return res.status(200).json(JSON.parse(cachedData));
    }

    try {
        const totalAmount = await prisma.deposit.aggregate({
            _sum: {
                amount: true
            },
            where: {
                created_at: {
                    gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    lt: new Date(new Date().setHours(23, 59, 59, 999))
                },
                status: "SUCCESS"
            }
        });
        await redis.set(cacheKey, JSON.stringify({ rechargeToday: totalAmount._sum.amount || 0 }), 'EX', 86400); // Cache for 1 day
        res.status(200).json({ rechargeToday: totalAmount._sum.amount || 0 });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

    // @desc Sum total recharge amount in this month
// @route GET /dashboard/totalRechargeThisMonth
// @access Private
const totalRechargeThisMonth = asyncHandler(async (req, res) => {
    const cacheKey = 'totalRechargeThisMonth';
    const cachedData = await redis.get(cacheKey);

    if (cachedData) {
        return res.status(200).json(JSON.parse(cachedData));
    }

    try {
        const totalAmount = await prisma.deposit.aggregate({
            _sum: {
                amount: true
            },
            where: {
                created_at: {
                    gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                },
                status: "SUCCESS"
            }
        });
        await redis.set(cacheKey, JSON.stringify({ totalRechargeThisMonth: totalAmount._sum.amount || 0 }), 'EX', 86400); // Cache for 1 day
        res.status(200).json({ totalRechargeThisMonth: totalAmount._sum.amount || 0 });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc Count total calls today
// @route GET /dashboard/totalCallsToday
// @access Private
const totalCallsToday = asyncHandler(async (req, res) => {
    const cacheKey = 'totalCallsToday';
    const cachedData = await redis.get(cacheKey);

    if (cachedData) {
        return res.status(200).json(JSON.parse(cachedData));
    }

    try {
        const count = await prisma.transaction.count({
            where: {
                created_at: {
                    gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    lt: new Date(new Date().setHours(23, 59, 59, 999))
                },
                mode: 'VOICE_CALL',
                status: 'SUCCESS'
            }
        });
        await redis.set(cacheKey, JSON.stringify({ totalCallsToday: count }), 'EX', 86400); // Cache for 1 day
        res.status(200).json({ totalCallsToday: count });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc Count total chats today
// @route GET /dashboard/totalChatsToday
// @access Private
const totalChatsToday = asyncHandler(async (req, res) => {
    const cacheKey = 'totalChatsToday';
    const cachedData = await redis.get(cacheKey);

    if (cachedData) {
        return res.status(200).json(JSON.parse(cachedData));
    }

    try {
        const count = await prisma.transaction.count({
            where: {
                created_at: {
                    gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    lt: new Date(new Date().setHours(23, 59, 59, 999))
                },
                mode: 'CHAT',
                status: 'SUCCESS'
            }
        });
        await redis.set(cacheKey, JSON.stringify({ totalChatsToday: count }), 'EX', 86400); // Cache for 1 day
        res.status(200).json({ totalChatsToday: count });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc Count total video calls today
// @route GET /dashboard/totalVideoCallsToday
// @access Private
const totalVideoCallsToday = asyncHandler(async (req, res) => {
    const cacheKey = 'totalVideoCallsToday';
    const cachedData = await redis.get(cacheKey);

    if (cachedData) {
        return res.status(200).json(JSON.parse(cachedData));
    }

    try {
        const count = await prisma.transaction.count({
            where: {
                created_at: {
                    gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    lt: new Date(new Date().setHours(23, 59, 59, 999))
                },
                mode: 'VIDEO_CALL',
                status: 'SUCCESS'
            }
        });
        await redis.set(cacheKey, JSON.stringify({ totalVideoCallsToday: count }), 'EX', 86400); // Cache for 1 day
        res.status(200).json({ totalVideoCallsToday: count });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// @desc Get number of users registered for all months
// @route GET /dashboard/usersRegisteredByMonth
// @access Private
const usersRegisteredByMonth = asyncHandler(async (req, res) => {
    const cacheKey = 'usersRegisteredByMonth';
    const cachedData = await redis.get(cacheKey);

    if (cachedData) {
        return res.status(200).json(JSON.parse(cachedData));
    }

    try {
        const usersByMonth = await prisma.user.groupBy({
            by: ['created_at'],
            _count: {
                _all: true
            },
            orderBy: {
                created_at: 'asc'
            }
        });

        const result = usersByMonth.map(item => ({
            month: item.created_at.toLocaleString('default', { month: 'long' }),
            count: item._count._all
        }));

        await redis.set(cacheKey, JSON.stringify(result), 'EX', 86400); // Cache for 1 day
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc Get number of users registered on a particular date
// @route GET /dashboard/usersRegisteredOnDate
// @access Private
const usersRegisteredOnDate = asyncHandler(async (req, res) => {
    const { date } = req.query; // Date in YYYY-MM-DD format
    const cacheKey = `usersRegisteredOnDate:${date}`;
    const cachedData = await redis.get(cacheKey);

    if (cachedData) {
        return res.status(200).json(JSON.parse(cachedData));
    }

    try {
        const count = await prisma.user.count({
            where: {
                created_at: {
                    gte: new Date(date),
                    lt: new Date(new Date(date).setDate(new Date(date).getDate() + 1))
                }
            }
        });
        await redis.set(cacheKey, JSON.stringify({ date, count }), 'EX', 86400); // Cache for 1 day
        res.status(200).json({ date, count });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc Get total recharge amount for all months
// @route GET /dashboard/totalRechargeByMonth
// @access Private
const totalRechargeByMonth = asyncHandler(async (req, res) => {
    const cacheKey = 'totalRechargeByMonth';
    const cachedData = await redis.get(cacheKey);

    if (cachedData) {
        return res.status(200).json(JSON.parse(cachedData));
    }

    try {
        const rechargeByMonth = await prisma.deposit.groupBy({
            by: ['created_at'],
            _sum: {
                amount: true
            },
            where: {
                status: 'SUCCESS'
            },
            orderBy: {
                created_at: 'asc'
            }
        });

        const result = rechargeByMonth.map(item => ({
            month: item.created_at.toLocaleString('default', { month: 'long' }),
            totalAmount: item._sum.amount
        }));

        await redis.set(cacheKey, JSON.stringify(result), 'EX', 86400); // Cache for 1 day
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc Get total recharge amount for all days in a particular month
// @route GET /dashboard/totalRechargeByDayInMonth/:month
// @access Private
const totalRechargeByDayInMonth = asyncHandler(async (req, res) => {
    const { month } = req.params; // Month in YYYY-MM format
    const cacheKey = `totalRechargeByDayInMonth:${month}`;
    const cachedData = await redis.get(cacheKey);

    if (cachedData) {
        return res.status(200).json(JSON.parse(cachedData));
    }

    try {
        const rechargeByDay = await prisma.deposit.groupBy({
            by: ['created_at'],
            _sum: {
                amount: true
            },
            where: {
                status: 'SUCCESS',
                created_at: {
                    gte: new Date(`${month}-01`),
                    lt: new Date(new Date(`${month}-01`).setMonth(new Date(`${month}-01`).getMonth() + 1))
                }
            },
            orderBy: {
                created_at: 'asc'
            }
        });

        const result = rechargeByDay.map(item => ({
            date: item.created_at.toISOString().split('T')[0],
            totalAmount: item._sum.amount
        }));

        await redis.set(cacheKey, JSON.stringify(result), 'EX', 86400); // Cache for 1 day
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc Get total number of missed calls, video calls, and chats for today
// @route GET /dashboard/missedCallsToday
// @access Private
const getMissedCallsToday = asyncHandler(async (req, res) => {
    const cacheKey = 'missedCallsToday';
    const cachedData = await redis.get(cacheKey);

    if (cachedData) {
        return res.status(200).json(JSON.parse(cachedData));
    }

    try {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const missedCalls = await prisma.missedCall.count({
            where: {
                createdAt: {
                    gte: startOfDay,
                    lt: endOfDay
                },
                mode: 'VOICE_CALL'
            }
        }) || 0;

        const videoCalls = await prisma.missedCall.count({
            where: {
                createdAt: {
                    gte: startOfDay,
                    lt: endOfDay
                },
                mode: 'VIDEO_CALL'
            }
        }) || 0;

        const chats = await prisma.missedCall.count({
            where: {
                createdAt: {
                    gte: startOfDay,
                    lt: endOfDay
                },
                mode: 'CHAT'
            }
        }) || 0;

        const result = { missedCalls, videoCalls, chats };
        await redis.set(cacheKey, JSON.stringify(result), 'EX', 86400); // Cache for 1 day
        res.status(200).json(result);
    } 
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc List all failed calls of the current month date-wise
// @route GET /dashboard/failedCalls
// @access Private
const listFailedCallsByMonth = asyncHandler(async (req, res) => {
    const cacheKey = 'failedCallsByMonth';
    const cachedData = await redis.get(cacheKey);

    if (cachedData) {
        return res.status(200).json(JSON.parse(cachedData));
    }

    try {
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59, 999);

        const failedCalls = await prisma.missedCall.groupBy({
            by: ['createdAt'],
            _count: {
                id: true
            },
            where: {
                createdAt: {
                    gte: startOfMonth,
                    lt: endOfMonth
                }
            },
            orderBy: {
                createdAt: 'asc'
            }
        });

        const result = failedCalls.map(item => ({
            date: item.createdAt.toISOString().split('T')[0],
            count: item._count.id
        }));


        await redis.set(cacheKey, JSON.stringify(result), 'EX', 86400); // Cache for 1 day
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc Get details of a specific failed date
// @route GET /dashboard/failedCallDetails/:date
// @access Private
const getFailedCallDetails = asyncHandler(async (req, res) => {
    const { date } = req.params; // Date in YYYY-MM-DD format
    const cacheKey = `failedCallDetails:${date}`;
    const cachedData = await redis.get(cacheKey);

    if (cachedData) {
        return res.status(200).json(JSON.parse(cachedData));
    }

    try {
        const failedCalls = await prisma.missedCall.findMany({
            where: {
                createdAt: {
                    gte: new Date(date),
                    lt: new Date(new Date(date).setDate(new Date(date).getDate() + 1))
                }
            },
            select: {
                userId: true,
                listenerId: true,
                mode: true,
                createdAt: true,
                user: {
                    select: {
                        name: true
                    }
                },
                listener: {
                    select: {
                        name: true
                    }
                }
            },
            orderBy: {
                createdAt: 'asc'
            }
        });

        const result = failedCalls.map(call => ({
            userId: call.userId,
            userName: call.user.name,
            listenerId: call.listenerId,
            listenerName: call.listener.name,
            mode: call.mode,
            dateTime: call.createdAt
        }));

        await redis.set(cacheKey, JSON.stringify(result), 'EX', 86400); // Cache for 1 day
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc Send notification to all users and listeners
// @route POST /dashboard/notify/all
// @access Private
const notifyAll = asyncHandler(async (req, res) => {
    try {
        const { title, body, imageFile } = req.body;

        if (!title || typeof title !== 'string') {
            return res.status(400).json({ message: "Invalid or missing 'title'" });
        }

        if (!body || typeof body !== 'string') {
            return res.status(400).json({ message: "Invalid or missing 'body'" });
        }

        let imageUrl = null;

        // If image is provided, upload to S3
        if (imageFile && imageFile.data && imageFile.mimeType) {
            const fileBuffer = Buffer.from(imageFile.data, 'base64');
            imageUrl = await uploadImageToS3(fileBuffer, imageFile.name, imageFile.mimeType);
        }

        const message = {
            notification: { title, body },
            topic: 'all',
            ...(imageUrl && { image: imageUrl }), // Add image if available
        };

        await admin.messaging().send(message);
        res.status(200).send('Notification sent successfully');
    } catch (error) {
        console.error('Error sending notification:', error);
        res.status(500).send('Error sending notification: ' + error.message);
    }
});

// @desc Send notification to either users or listeners
// @route POST /dashboard/notify/type
// @access Private
const notifyByType = asyncHandler(async (req, res) => {
    try {
        const { type, title, body, imageFile } = req.body;

        if (!['user', 'listener'].includes(type)) {
            return res.status(400).json({ message: "Invalid 'type'. Must be 'user' or 'listener'." });
        }

        if (!title || typeof title !== 'string') {
            return res.status(400).json({ message: "Invalid or missing 'title'" });
        }

        if (!body || typeof body !== 'string') {
            return res.status(400).json({ message: "Invalid or missing 'body'" });
        }

        let imageUrl = null;

        // If image is provided, upload to S3
        if (imageFile && imageFile.data && imageFile.mimeType) {
            const fileBuffer = Buffer.from(imageFile.data, 'base64');
            imageUrl = await uploadImageToS3(fileBuffer, imageFile.name, imageFile.mimeType);
        }

        const topic = type === 'user' ? 'users' : 'listeners';

        const message = {
            notification: { title, body },
            topic,
            ...(imageUrl && { image: imageUrl }), // Add image if available
        };

        await admin.messaging().send(message);
        res.status(200).send('Notification sent successfully');
    } catch (error) {
        console.error('Error sending notification:', error);
        res.status(500).send('Error sending notification: ' + error.message);
    }
});

// @desc Send notification to a specific user or listener by ID
// @route POST /dashboard/notify/specific
// @access Private
const notifyById = asyncHandler(async (req, res) => {
    try {
        const { id, title, body, role, imageFile } = req.body;
  
        if (!id || typeof id !== 'number') {
            return res.status(400).json({ message: "Invalid or missing 'id'" });
        }
  
        if (!['user', 'listener'].includes(role)) {
            return res.status(400).json({ message: "Invalid 'role'. Must be 'user' or 'listener'." });
        }
  
        if (!title || typeof title !== 'string') {
            return res.status(400).json({ message: "Invalid or missing 'title'" });
        }
  
        if (!body || typeof body !== 'string') {
            return res.status(400).json({ message: "Invalid or missing 'body'" });
        }
  
        const tokenData = role === 'user' 
            ? await prisma.user.findUnique({ where: { id }, select: { device_token2: true } })
            : await prisma.listener.findUnique({ where: { id }, select: { device_token2: true } });
  
        if (!tokenData || !tokenData.device_token2) {
            return res.status(404).json({ message: `${role} not found or device token missing` });
        }
  
        const fcmToken = tokenData.device_token2;
  
        // Validate FCM token
        if (!/^([a-zA-Z0-9_-]){140,}$/.test(fcmToken)) {
            return res.status(400).json({ message: "Invalid FCM registration token" });
        }
  
        let imageUrl = null;
  
        // If image is provided, upload to S3
        if (imageFile && imageFile.data && imageFile.mimeType) {
            const fileBuffer = Buffer.from(imageFile.data, 'base64');
            imageUrl = await uploadImageToS3(fileBuffer, imageFile.name, imageFile.mimeType);
        }
  
        const message = {
            notification: { title, body },
            token: fcmToken,
            ...(imageUrl && { image: imageUrl }), // Add image if available
        };
  
        await admin.messaging().send(message);
        res.status(200).send('Notification sent successfully');
    } catch (error) {
        console.error('Error sending notification:', error);
        res.status(500).send('Error sending notification: ' + error.message);
    }
  });

// @desc Send inbox notification to all users and listeners
// @route POST /dashboard/inbox/all
// @access Private
const notifyAllInbox = asyncHandler(async (req, res) => {
    try {
        const { title, message, link, imageFile } = req.body;

        if (!title || typeof title !== 'string') {
            return res.status(400).json({ message: "Invalid or missing 'title'" });
        }

        if (!message || typeof message !== 'string') {
            return res.status(400).json({ message: "Invalid or missing 'message'" });
        }

        let imageUrl = null;

        if (imageFile && imageFile.data && imageFile.mimeType) {
            const fileBuffer = Buffer.from(imageFile.data, 'base64');
            imageUrl = await uploadImageToS3(fileBuffer, imageFile.name, imageFile.mimeType);
        }

        await prisma.generalNotification.create({
            data: {
                title,
                message,
                link,
                image_URL: imageUrl,
                type: 'ALL'
            }
        });

        const notificationMessage = {
            notification: { title, body: message },
            topic: 'all',
            ...(imageUrl && { image: imageUrl }),
        };

        await admin.messaging().send(notificationMessage);
        res.status(200).send('Inbox notification stored and sent successfully');
    } catch (error) {
        console.error('Error storing and sending inbox notification:', error);
        res.status(500).send('Error storing and sending inbox notification: ' + error.message);
    }
});

// @desc Send inbox notification to either users or listeners
// @route POST /dashboard/inbox/type
// @access Private
const notifyByTypeInbox = asyncHandler(async (req, res) => {
    try {
        const { type, title, message, link, imageFile } = req.body;

        if (!['USER', 'LISTENER'].includes(type)) {
            return res.status(400).json({ message: "Invalid 'type'. Must be 'USER' or 'LISTENER'." });
        }

        if (!title || typeof title !== 'string') {
            return res.status(400).json({ message: "Invalid or missing 'title'" });
        }

        if (!message || typeof message !== 'string') {
            return res.status(400).json({ message: "Invalid or missing 'message'" });
        }

        let imageUrl = null;

        if (imageFile && imageFile.data && imageFile.mimeType) {
            const fileBuffer = Buffer.from(imageFile.data, 'base64');
            imageUrl = await uploadImageToS3(fileBuffer, imageFile.name, imageFile.mimeType);
        }

        await prisma.generalNotification.create({
            data: {
                title,
                message,
                link,
                image_URL: imageUrl,
                type
            }
        });

        const topic = type === 'USER' ? 'users' : 'listeners';

        const notificationMessage = {
            notification: { title, body: message },
            topic,
            ...(imageUrl && { image: imageUrl }),
        };

        await admin.messaging().send(notificationMessage);
        res.status(200).send('Inbox notification stored and sent successfully');
    } catch (error) {
        console.error('Error storing and sending inbox notification:', error);
        res.status(500).send('Error storing and sending inbox notification: ' + error.message);
    }
});

// @desc Send inbox notification to a specific user or listener by ID
// @route POST /dashboard/inbox/specific
// @access Private
const notifyByIdInbox = asyncHandler(async (req, res) => {
    try {
        const { id, title, message, role, link, imageFile } = req.body;

        if (!id || typeof id !== 'number') {
            return res.status(400).json({ message: "Invalid or missing 'id'" });
        }

        if (!['USER', 'LISTENER'].includes(role)) {
            return res.status(400).json({ message: "Invalid 'role'. Must be 'USER' or 'LISTENER'." });
        }

        if (!title || typeof title !== 'string') {
            return res.status(400).json({ message: "Invalid or missing 'title'" });
        }

        if (!message || typeof message !== 'string') {
            return res.status(400).json({ message: "Invalid or missing 'message'" });
        }

        let imageUrl = null;

        if (imageFile && imageFile.data && imageFile.mimeType) {
            const fileBuffer = Buffer.from(imageFile.data, 'base64');
            imageUrl = await uploadImageToS3(fileBuffer, imageFile.name, imageFile.mimeType);
        }

        const data = {
            title,
            message,
            link,
            image_URL: imageUrl || '',
            type: role,
            ...(role === 'USER' ? { userId: id } : { listenerId: id })
        };

        await prisma.specificNotification.create({ data });

        const tokenData = role === 'USER' 
            ? await prisma.user.findUnique({ where: { id }, select: { device_token2: true } })
            : await prisma.listener.findUnique({ where: { id }, select: { device_token2: true } });

        if (!tokenData || !tokenData.device_token2) {
            return res.status(404).json({ message: `${role} not found or device token missing` });
        }

        const notificationMessage = {
            notification: { title, body: message },
            token: tokenData.device_token2,
            ...(imageUrl && { image: imageUrl }),
        };

        await admin.messaging().send(notificationMessage);
        res.status(200).send('Inbox notification stored and sent successfully');
    } catch (error) {
        console.error('Error storing and sending inbox notification:', error);
        res.status(500).send('Error storing and sending inbox notification: ' + error.message);
    }
});

// @desc List all pending listener profiles
// @route GET /dashboard/pendingListeners
// @access Private
const listPendingListeners = asyncHandler(async (req, res) => {
    try {
        const pendingListeners = await prisma.pendingListener.findMany();
        res.status(200).json(pendingListeners);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc Approve a listener profile
// @route POST /dashboard/approveListener/:id
// @access Private
const approveListener = asyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
        const pendingListener = await prisma.pendingListener.findUnique({
            where: { id: parseInt(id) }
        });

        if (!pendingListener) {
            return res.status(404).json({ message: "Pending listener not found" });
        }

        const listener = await prisma.listener.create({
            data: {
                name: pendingListener.name,
                email: pendingListener.email,
                image: pendingListener.image,
                age: pendingListener.age,
                language: pendingListener.language,
                favoriteFood: pendingListener.favoriteFood,
                hobbies: pendingListener.hobbies,
                idols: pendingListener.idols,
                sex: pendingListener.sex,
                about: pendingListener.about,
                device_token: pendingListener.device_token,
                device_token2: pendingListener.device_token2
            }
        });

        await prisma.pendingListener.delete({
            where: { id: parseInt(id) }
        });

        res.status(201).json({ message: "Listener profile approved", listener });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc Reject a listener profile
// @route DELETE /dashboard/rejectListener/:id
// @access Private
const rejectListener = asyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
        const pendingListener = await prisma.pendingListener.findUnique({
            where: { id: parseInt(id) }
        });

        if (!pendingListener) {
            return res.status(404).json({ message: "Pending listener not found" });
        }

        await prisma.pendingListener.delete({
            where: { id: parseInt(id) }
        });

        res.status(200).json({ message: "Listener profile rejected and temporary data deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = {
    countListeners,
    countNewListeners,
    listBusyListeners,
    countNewUsers,
    rechargeToday,
    totalRechargeThisMonth,
    totalCallsToday,
    totalChatsToday,
    totalVideoCallsToday,
    usersRegisteredByMonth,
    usersRegisteredOnDate,
    totalRechargeByMonth,
    totalRechargeByDayInMonth,
    getMissedCallsToday,
    listFailedCallsByMonth,
    getFailedCallDetails,
    notifyAll,
    notifyByType,
    notifyById,
    notifyAllInbox,
    notifyByTypeInbox,
    notifyByIdInbox,
    listPendingListeners,
    approveListener,
    rejectListener
};
