var voiceCommands = window.SpeechRecognition || window.webkitSpeechRecognition || window.mozSpeechRecognition || window.msSpeechRecognition || window.oSpeechRecognition;

var commands = [];
var recognition,takingCommands,responseHandler;

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
        arr[0] = [];
        arr[0][0] = 0;
        for(var i=0;i<m;i++){
            arr[0][i+1] = i+1;
        }
        for(var j=0;j<n;j++){
            arr[j+1] = [];
            arr[j+1][0] = j+1;
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
        return (diff/minLength<=0.25);
    }
};

var handleCommand = function(c){
    if(c.response.indexOf('ask for text')>-1){
        takingCommands = false;
        recognition.stop(); 
        voiceCommands.speak('please say something for the ' + c.name);
        var recognitionInner = new (window.SpeechRecognition || window.webkitSpeechRecognition || window.mozSpeechRecognition || window.msSpeechRecognition || window.oSpeechRecognition)();
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
    }
    else{
        voiceCommands.speak(c.response);
        responseHandler.apply(null,[c.name,c.response]); 
    }    
};

var addNewCommand = function(cmdName){
    voiceCommands.speak('I did not recognize that command');
    voiceCommands.speak('please tell me what should I respond');
    setTimeout(function(){
        voiceCommands.getUserInput(function(input){
            if(input != 'cancel'){
                var obj = {};
                obj.name = cmdName;
                obj.response = input;
                responseHandler.apply(null,['new command',obj]);
                voiceCommands.speak('new command added');
            }
            else voiceCommands.speak('new command cancelled');
        });
    },4000);
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
        var flag = true;
        for(key in e.results[0]){
            console.log(e.results[0][key].transcript);
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
            addNewCommand(e.results[0][0].transcript);
        }
    };
};

voiceCommands.stop = function(){
    takingCommands = false;
    recognition.stop();
};