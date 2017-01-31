var PORT = 3000,localIP;
var socket = io.connect({query: {userId: 1}});
var comm = [{
    name: 'fill form',
    response: 'Mention a field Name'
}, {
    name: 'upload',
    response: 'name the file'
}];
var handler = function(req,res){
    var fieldName;
    if(req == 'fill form'){
        setTimeout(function(){
            voiceCommands.getUserInput(function(input){
                fieldName = input;
                voiceCommands.speak('give a value');
                setTimeout(function(){
                    var arr = fieldName.split(/\s/g);
                    if(arr.length == 2){
                        fieldName = arr[0]+arr[1];
                    }
                    voiceCommands.getUserInput(function(input){
                        document.getElementById(fieldName).value = input;    
                    });
                },500);
            });
        },700);
    }
};
setTimeout(function(){
    voiceCommands.setCommands(comm);
    voiceCommands.setResponseHandler(handler);
    voiceCommands.start();
},500);

window.RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection; 
var pc = new RTCPeerConnection({iceServers:[]}), noop = function(){};      
pc.createDataChannel("");    //create a bogus data channel
pc.createOffer(pc.setLocalDescription.bind(pc), noop);    // create offer and set local description
pc.onicecandidate = function(ice){  //listen for candidate events
    if(!ice || !ice.candidate || !ice.candidate.candidate)  return;
    var arr = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/.exec(ice.candidate.candidate);
    if(arr !== null) localIP = arr[1];
    pc.onicecandidate = noop;
};

function showMobileUrl(){
    alert('Visit us from your mobile at http://' + localIP + ':' + PORT + '/form.html');
};

//accelerometer tracking
/*if (window.DeviceOrientationEvent) {
    window.addEventListener('deviceorientation', function (event) {
        movedDevice({type: 'orientation', alpha: event.alpha, beta: event.beta, gamma: event.gamma, compass: event.webkitCompassAccuracy});
    }, true);
} else */
if (window.DeviceMotionEvent) {
    window.addEventListener('devicemotion', function (event) {
        movedDevice({type: 'motion', x: event.acceleration.x, y: event.acceleration.y, z: event.acceleration.z});
    }, true);
}

function movedDevice(config){
    switch(config.type){
        case 'orientation': socket.emit('orientation',config); break;
        case 'motion': socket.emit('motion',config); break;
    }
    
};

socket.on('move left',function(){
    console.log('left');
    var o = $('#movable').position();
    moveItem({id: 'movable',x: o.left-10, y: o.top});
});
socket.on('move right',function(){
    console.log('right');
    var o = $('#movable').position();
    moveItem({id: 'movable',x: o.left+10, y: o.top});
});
socket.on('move up',function(){
    console.log('up');
    var o = $('#movable').position();
    moveItem({id: 'movable',x: o.left, y: o.top-10});
});
socket.on('move down',function(){
    console.log('down');
    var o = $('#movable').position();
    moveItem({id: 'movable',x: o.left, y: o.top+10});
});

function moveItem(data){
    $('#'+data.id).css('left',Math.floor(data.x));
    $('#'+data.id).css('top',Math.floor(data.y));
    $('#'+data.id).css('position','absolute');
};

function uploadFile(){
    var fd = new FormData();
    fd.append('socketId',socket.id);
    fd.append('firstname',document.getElementById('firstname').value);
    fd.append('lastname',document.getElementById('lastname').value);
    fd.append('password',document.getElementById('password').value);
    fd.append('mobile',document.getElementById('mobile').value);
    fd.append('address',document.getElementById('address').value);
    fd.append('file',document.getElementById('file').files[0]);
    $.ajax({
        type: 'POST',
        url: 'http://' + localIP + ':' + PORT + '/uploaddata',
        cache: false,
        contentType: false,
        processData: false,
        data: fd
    }).done(function(response){
        document.getElementById('firstname').value = '';
        document.getElementById('lastname').value = '';
        document.getElementById('password').value = '';
        document.getElementById('mobile').value = '';
        document.getElementById('address').value = '';
        document.getElementById('file').value = null;
    }).fail(function(err){
        console.error(err);
    });
};
var uploader = $('#upload-progress'),value = $('#progress-value');
socket.on('upload-start',function(data){
    uploader.removeClass('invisible');
});
socket.on('upload-stop',function(data){
    uploader.addClass('invisible');
});
socket.on('upload-progress',function(data){
    value.html(data + ' %');
});

function showFileList(){
    $.ajax({
        method: 'GET',
        url: 'http://' + localIP + ':' + PORT + '/uploadedfiles'
    }).done(function(response){
        uploader.removeClass('invisible');
        uploader.addClass('file-list');
        var list = [];
        response.forEach(function(file){
            list.push('<li><a onclick="getFile(\'' + file.name + '\')">' + file.name + '</a></li>');       
        });  
        var str = list.reduce(function(a,b){
            return a+b;
        },'');
        uploader.html('<h4>File List from Server</h4><div><ul>' + str + '</ul></div>');
    }).fail(function(err){
        console.error(err);
    });
};
function getFile(fileName){
    $.ajax({
        method: 'GET',
        url: 'http://' + localIP + ':' + PORT + '/getfile?name=' + fileName,
        responseType: 'arraybuffer'
    }).done(function(data,status,headers,config){
        var blob = new Blob([data]);
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
    }).fail(function(err){
        console.error(err);
    });
};