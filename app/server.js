var http = require('http');
var fs = require('fs');
var express = require('express');
var bodyParser = require('body-parser');
var socket = require('socket.io');
var formidable = require('formidable');
var mimeTypes = require('mime-types');

var app = express();
app.use(express.static(__dirname));
app.use(bodyParser.json());

var server = http.createServer(app);
var io = socket(server);
var PORT = 3000;
var uploadPath = './uploads';
var fileMode = 'r';

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
app.post('/uploaddata',function(req,res){
    var form = new formidable.IncomingForm(),userData = {},socketId;
    form.keepExtensions = true;
    form.uploadDir = uploadPath;
    form.on('file',function(field, file){
        fs.rename(file.path,form.uploadDir + '/' + file.name);  
    });
    form.on('field',function(name,value){
        if(name == 'socketId') {
            socketId = value;
            io.to(socketId).emit('upload-start');
        }
        else userData[name] = value;
    }); 
    form.on('progress',function(recd,exp){
        io.to(socketId).emit('upload-progress',((recd/exp)*100).toFixed());    
    });
    form.on('end',function(){
        io.to(socketId).emit('upload-stop');
    });
    form.on('error', function(err) {
        console.error(err);
    }); 
    form.parse(req, function(err, fields, files) {
        console.log(userData);
        res.header('Content-Type', 'application/json');
        res.header('Access-control-allow-origin', '*');
        res.json({uploaded: true}); 
    });
});
app.get('/uploadedfiles',function(req,res){
    fs.readdir(uploadPath,function(err,files){
        if(!err){
            res.header('Content-Type', 'application/json');
            res.header('Access-control-allow-origin', '*');
            res.json(files.map(function(f){
                return {name: f};
            })); 
        }    
    });
});
app.get('/getfile',function(req,res){
    var filePath = uploadPath + '/' + req.query.name, buff;
    fs.open(filePath, fileMode, function(err,fd){
        if(!err){
            fs.stat(filePath, function(err,stats){
                if(!err) {
                    buff = new Buffer(stats.size);
                    fs.read(fd, buff, 0, buff.length, 0, function(err, bytes){
                        if(!err){
                            res.setHeader('Content-disposition', 'attachment; filename=' + filePath);
                            res.setHeader('Content-Type', mimeTypes.lookup(filePath));
                            res.setHeader('FileName', req.query.name);
                            res.setHeader('Access-control-allow-origin', '*');
                            res.send(buff); 
                        }    
                    });
                }                
            });
        } 
        else {
            res.json({error: 'File not found on server'});
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
            if(diffX > 20 /*|| diffY > 20 || diffZ > 20*/){
                console.log(data);
            }
        }
    });
    socket.on('motion',function(data){
        if(data.x>2){
            io.sockets.emit('move left');
        }
        else if(data.x<-2){
            io.sockets.emit('move right');
        }
        else if(data.y<-2){
            io.sockets.emit('move up');
        }
        else if(data.y>2){
            io.sockets.emit('move down');
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