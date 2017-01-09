var voiceCommands = window.SpeechRecognition || window.webkitSpeechRecognition || window.mozSpeechRecognition || window.msSpeechRecognition || window.oSpeechRecognition;

var commands = [];
var recognition,takingCommands,responseHandler,triggerStart = 'start listening',triggerStop = 'stop listening',startedAI = false;

window.speechSynthesis.onvoiceschanged = function(){
    var voices = window.speechSynthesis.getVoices();
    voiceCommands.selectedVoice = voices[2];
};

//calculating closest match based on Levenshtein distance
var minimum = function(a,b,c){
    return a<b?a<c?a:c:b<c?b:c;
};
var detailedMatch = function(a,b){
    a = a.toLowerCase();
    b = b.toLowerCase();
    var x = a.replace(/\s/g,'').split('');
    var y = b.replace(/\s/g,'').split('');
    var diff = 0,arr = [],m = x.length+1, n=y.length+1,sub;
    if(a==b || a.replace(/\s/g,'')==b.replace(/\s/g,'')){
        return true;
    }
    else {
        for(var i=0;i<m;i++){
            arr[i] = [];
            for(var j=0;j<n;j++){
                arr[i][j] = -1;
            }
        }
        arr[0][0] = 0;
        for(var i=0;i<m-1;i++){
            arr[i+1][0] = i+1;
        }
        for(var j=0;j<n-1;j++){
            arr[0][j+1] = j+1;
        }
        for(var j=1;j<n;j++){
            for(var i=1;i<m;i++){
                if(x[i-1]==y[j-1]) sub = 0;
                else sub = 1; 
                arr[i][j] = minimum(arr[i-1][j]+1, arr[i][j-1]+1, arr[i-1][j-1]+sub);
            }
        }
        diff = arr[m-1][n-1];
        var minLength = minimum(m-1,n-1,10000000);
        return (diff/minLength<=0.1);
    }
};

var handleCommand = function(c){
    console.log('Command - ' + c.name);
    if(c.response.indexOf('ask for text')>-1){
        takingCommands = false;
        recognition.stop(); 
        voiceCommands.speak('please say something for the ' + c.name);
        setTimeout(function(){
            var recognitionInner = new (window.SpeechRecognition || window.webkitSpeechRecognition || window.mozSpeechRecognition                       || window.msSpeechRecognition || window.oSpeechRecognition)();
            recognitionInner.lang = 'en-US';
            recognitionInner.interimResults = false;
            recognitionInner.maxAlternatives = 5;    
            recognitionInner.start();
            recognitionInner.onresult = function(e){
                responseHandler.apply(null,[c.name,e.results[0][0].transcript]);
            };
            recognitionInner.onend = function(e){
                recognition.start();
                takingCommands = true;  
            };
        },1000);
    }
    else{
        voiceCommands.speak(c.response);
        responseHandler.apply(null,[c.name,c.response]); 
    }    
};

var addNewCommand = function(cmdName){
    console.log('Unrecognized Command - ' + cmdName);
    voiceCommands.speak('Command not recognized, please tell me what to respond');
    setTimeout(function(){
        voiceCommands.getUserInput(function(input){
            if(input != 'cancel'){
                var obj = {};
                obj.name = cmdName;
                obj.response = input;
                console.log('Response - ' + input);
                responseHandler.apply(null,['new command',obj]);
                voiceCommands.speak('new command added');
            }
            else voiceCommands.speak('new command cancelled');
        });
    },2250);
};

var performSearch = function(text){
    var pos = text.indexOf('search for');
    var searchText = text.substring(pos+11,text.length);
    console.log('Searching in Google for - ' + searchText);
    //window.open('https://www.google.com/search?q=' + searchText, '_blank');
    $.ajax({
        type: 'GET',
        url: 'https://www.googleapis.com/customsearch/v1?key=AIzaSyDRoMTMNKWy59X-8NELgZn2Y883tgl43C8&cx=014918255508942225227:m3yrvj0uyhg&q=' + searchText,
    }).done(function(res){
        window.open(res.items[0].link,'google search'
        /*use this to make it open in new window ,'location=yes,height=570,width=520,scrollbars=yes,status=yes'*/);
    });
};

var playYoutube = function(text){
    var pos = text.indexOf('play on youtube');
    var searchText = text.substring(pos+16,text.length);
    console.log('Playing on Youtube - ' + searchText);
    $.ajax({
        type: 'GET',
        url: 'https://www.googleapis.com/youtube/v3/search?part=snippet&key=AIzaSyDRoMTMNKWy59X-8NELgZn2Y883tgl43C8&q=' + searchText,
    }).done(function(res){
        window.open('https://www.youtube.com/watch?v=' + res.items[0].id.videoId,'youtube');
    });
};

voiceCommands.getUserInput = function(cb){
    takingCommands = false;
    recognition.stop(); 
    var recognitionInner = new (window.SpeechRecognition || window.webkitSpeechRecognition || window.mozSpeechRecognition || window.msSpeechRecognition || window.oSpeechRecognition)();
    recognitionInner.lang = 'en-US';
    recognitionInner.interimResults = false;
    recognitionInner.maxAlternatives = 5;    
    recognitionInner.start();
    recognitionInner.onresult = function(e){
        cb.apply(null,[e.results[0][0].transcript]);
    };
    recognitionInner.onend = function(e){
        recognition.start();
        takingCommands = true;
    };
};

voiceCommands.speak = function(text){
    var msg = new SpeechSynthesisUtterance();
    msg.voice = voiceCommands.selectedVoice;
    msg.voiceURI = voiceCommands.selectedVoice.voiceURI;
    msg.volume = 1; // 0 to 1
    msg.rate = 1; // 0.1 to 10
    msg.pitch = 1; //0 to 2
    msg.text = text;
    msg.lang = 'en-US';
    window.speechSynthesis.speak(msg); 
    console.log('Speaking - ' + text);
};

voiceCommands.setCommands = function(cmdList){
    commands.length = 0;
    cmdList.forEach(function(c){
        commands.push(c);
    });
};

voiceCommands.setResponseHandler = function(handler){
    responseHandler = handler;
};

voiceCommands.start = function(){
    takingCommands = true;
    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition || window.mozSpeechRecognition || window.msSpeechRecognition || window.oSpeechRecognition)();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 5;
    
    recognition.start();
    
    /*[
     'onaudiostart',
     'onaudioend',
     'onend',
     'onerror',
     'onnomatch',
     'onresult',
     'onsoundstart',
     'onsoundend',
     'onspeechend',
     'onstart'
    ].forEach(function(eventName) {
        recognition[eventName] = function(e) {
            console.log(eventName, e);
        };
    });*/
    
    recognition.onend = function(e){
        if(takingCommands){
            recognition.start();   
        }  
    };    
    recognition.onresult = function(e){
        if(detailedMatch(e.results[0][0].transcript,triggerStart)||detailedMatch(e.results[0][0].transcript,triggerStop)) {
            if(detailedMatch(e.results[0][0].transcript.toLowerCase(),triggerStart)){
                voiceCommands.speak('I am listening');
                startedAI = true;    
            } 
            else {
                voiceCommands.speak('I won\'t listen anymore');
                startedAI = false;
            }
        }
        else if(startedAI){
            var flag = true;
            for(key in e.results[0]){
                if(flag && e.results[0][key].transcript !== undefined){
                    commands.forEach(function(c){
                        if(flag && detailedMatch(e.results[0][key].transcript,c.name)){
                            handleCommand(c);
                            flag = false;
                        }
                    });
                }
            }
            if(flag){
                if(e.results[0][0].transcript.toLowerCase().indexOf('search for')==0) {
                    performSearch(e.results[0][0].transcript.toLowerCase());
                }
                else if(e.results[0][0].transcript.toLowerCase().indexOf('play on youtube')==0) {
                    playYoutube(e.results[0][0].transcript.toLowerCase());
                }
                else addNewCommand(e.results[0][0].transcript);
            }    
        }                   
    };
};

voiceCommands.stop = function(){
    takingCommands = false;
    recognition.stop();
};