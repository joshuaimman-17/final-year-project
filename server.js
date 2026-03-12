const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    const server = createServer(async (req, res) => {
        try {
            const parsedUrl = parse(req.url, true);
            await handle(req, res, parsedUrl);
        } catch (err) {
            console.error('Error occurred handling', req.url, err);
            res.statusCode = 500;
            res.end('internal server error');
        }
    }).once('error', (err) => {
        console.error(err);
        process.exit(1);
    });

    const io = new Server(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        }
    });

    // We store sockets mapped by user ID for quick lookups
    const activeUsers = new Map();

    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        socket.on('register', (userId) => {
            activeUsers.set(userId, socket.id);
            console.log(`User ${userId} registered with socket ${socket.id}`);
        });

        // Simply relay the message payload to the receiver
        socket.on('send_message', (data) => {
            const { receiverId, messagePayload } = data;
            const receiverSocketId = activeUsers.get(receiverId);

            if (receiverSocketId) {
                // Relay the message so the receiver gets it immediately
                io.to(receiverSocketId).emit('receive_message', messagePayload);
            }
        });

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
            for (const [userId, sockId] of activeUsers.entries()) {
                if (sockId === socket.id) {
                    activeUsers.delete(userId);
                    break;
                }
            }
        });
    });

    server.listen(port, () => {
        console.log(`> Ready on http://${hostname}:${port}`);
    });
});
