const express = require ('express');
const http = require('http');
const {Server} = require ('socket.io');
const cors = require ('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST']
    
    }
});

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('disconect', () => {
    console.log('A user disconnected:', socket.id);
});
});

const PORT = 3001;
server.listen(PORT,() => {
    console.log(`Server running on port ${PORT}`);
});
