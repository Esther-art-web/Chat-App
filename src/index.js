const express = require('express');
const http = require('http');
const path = require('path');
const {Server} = require('socket.io');
const Filter = require('bad-words');
const { generateMessage, generateLocationMessage } = require('./utils/messages');
const {addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const port = process.env.PORT || 3000;
const publicDir = path.join(__dirname, '../public');

app.use(express.static(publicDir));

io.on('connection', (socket) => {
    console.log('New WebSocket conection!')
   
   
    socket.on('join', (data, callback) => {
        const { error, user } = addUser({id: socket.id, ...data});

        if (error) {
            return callback(error)
        }
         

        socket.join(user.room);
        socket.emit('message',generateMessage("Admin", 'Welcome'));
        socket.broadcast.to(user.room).emit('message',generateMessage("Admin", `${user.username} joined the chat room!`) );
        io.to(user.room).emit("roomData", {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
         
        callback();
    })
    socket.on('sendMessage', (mssg, callback) => {
        const user = getUser(socket.id)
        const filter = new Filter()
        if (filter.isProfane(mssg)){
            return callback('Profanity is not allowed')
        }
        io.to(user.room).emit('message', generateMessage(user.username, mssg));
        callback();
    })  
    socket.on('sendLocation', ({latitude, longitude}, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${latitude},${longitude}`))
        callback();
    })
    socket.on('disconnect', () => {
        const user = removeUser(socket.id);

        if (user) {
            io.to(user.room).emit('message', generateMessage("Admin", `${user.username} has left`));
            io.to(user.room).emit("roomData", {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
            
        }
        
    })
})




server.listen(port, () => {
console.log("Server is up on port ", port)
}) 