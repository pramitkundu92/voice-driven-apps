var http = require('http');
var fs = require('fs');
var express = require('express');
var bodyParser = require('body-parser');
var socket = require('socket.io');

var app = express();
app.use(express.static(__dirname));
app.use(bodyParser.json());

var server = http.createServer(app);
var io = socket(server);
var PORT = 3000;

app.get('/index.html',function(req,res){
    res.sendFile(__dirname + '/index.html');
});
app.get('/commands',function(req,res){
    fs.readFile(__dirname + '/commands.json', function(err,data){
        if(!err){
            res.header('Access-Control-Allow-Origin', '*');
            res.json(JSON.parse(data));
        }
    });
});
app.get('/updatecomm',function(req,res){
    fs.readFile(__dirname + '/commands.json', function(err,data){
        if(!err){
            var cmd = JSON.parse(data);
            cmd.push({name: req.query.name, response: req.query.response});
            fs.writeFile(__dirname + '/commands.json', JSON.stringify(cmd), 'utf-8', function(err){
                if(!err){
                    fs.readFile(__dirname + '/commands.json', function(err,data){
                        if(!err){
                            res.header('Access-Control-Allow-Origin', '*');
                            res.json(JSON.parse(data));
                        }
                    });
                }
            });
        }
    });
});

//socket code 
var connectedSockets = {}; //track sockets
io.on('connection',function(socket){
    console.log('Socket with id - ' + socket.id + ' connected');
    connectedSockets[socket.id] = {time: new Date()};
    socket.on('orientation',function(data){
        var s = connectedSockets[socket.id];
        if(s.alpha === undefined || s.beta === undefined || s.gamma === undefined){
            s.alpha = data.alpha;
            s.beta = data.beta;
            s.gamma = data.gamma;
        }
        else {
            diffX = s.alpha - data.alpha;
            diffY = s.beta - data.beta;
            diffZ = s.gamma - data.gamma;
            if(diffX > 20 || diffY > 20 || diffZ > 20){
                console.log(data);
            }
        }
    });
    socket.on('motion',function(data){
        if(data.x > 2 || data.y > 2 || data.z > 2){
            console.log(data);
        }
    });    
    socket.on('disconnect',function(){
        console.log('disconnecting...' + socket.id);
        delete connectedSockets[socket.id];
    });
});

function displayConnectedSockets(map){
    for(key in map){
        console.log('Socket ' + key + ' connected at ' + map[key].time);
    }
};

server.listen(PORT);
console.log('Started server at http://localhost:' + PORT);