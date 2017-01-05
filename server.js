var http = require('http');
var fs = require('fs');
var express = require('express');

var app = express();
app.use(express.static(__dirname));

var server = http.createServer(app);

app.get('/index.html',function(req,res){
    res.sendFile(__dirname + '/index.html');
});
app.get('/commands',function(req,res){
    fs.readFile(__dirname + '/commands.json', function(err,data){
        if(!err){
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
                            res.json(JSON.parse(data));
                        }
                    });
                }
            });
        }
    });
});

server.listen(1000);
console.log('Started server');