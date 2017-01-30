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
    localIP = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/.exec(ice.candidate.candidate)[1];
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