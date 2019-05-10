require('dotenv').config();
var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var moment = require('moment');
const axios = require('axios');

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    res.header("Access-Control-Allow-Methods", "PUT, GET, POST, DELETE, OPTIONS");
    next();
});

io.on('connection', function(socket){
    console.log('User Connected.');
    socket.on('disconnect', function () {
        console.log('User Disconnected.');
    });

    socket.on('joinRoom',function(room){
        socket.join(room);
    });

    socket.on('send_chat', function(room,data) {
        data.sent_at = moment().format('YYYY-MM-DD HH:mm:ss');
        data.room_key = room;
        console.log('Message['+data.room_key+']('+data.sent_at+'): ', data.content);
        // io.sockets.in(room).emit('chat', data);
        let token = socket.handshake.query.token;
        var headers = {
            // 'Content-Type': 'application/json',
            'Accept': 'application/json',
        };
        if(token){
            headers['Authorization'] = 'Bearer '+token;
        }
        axios.post(process.env.CMS_API_PATH + '/chat-store', data,{headers: headers})
            .then(function (response) {
                io.sockets.in(room).emit('chat', response.data.data);
            })
            .catch(function (error) {
                console.log('error',error);
            });

    });
});

http.listen(parseInt(process.env.RUN_PORT), function(){
    console.log('listening on *:3000');
});
