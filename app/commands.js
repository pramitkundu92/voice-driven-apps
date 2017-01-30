var voiceCommands = window.SpeechRecognition || window.webkitSpeechRecognition || window.mozSpeechRecognition || window.msSpeechRecognition || window.oSpeechRecognition;

var commands = [];
var recognition,takingCommands,responseHandler,triggerStart = 'start',triggerStop = 'stop',
    startedAI = false,searchTab,youtubeTab,lang = 'en-US';

var DEVELOPER_KEY = 'AIzaSyDRoMTMNKWy59X-8NELgZn2Y883tgl43C8', //personal key in Google API Console
    CSE_ID = '014918255508942225227:m3yrvj0uyhg'; //personal Google custom search engine ID

var search = /search (.*)/g;
var play = /play (.*)/g;
var mid = /\:\w+/g;
var end = /(\*[^/]+)$/g;

window.speechSynthesis.onvoiceschanged = function(){
    var voices = window.speechSynthesis.getVoices();
    for(i in voices){
        if(voices[i].lang == lang){
            voiceCommands.selectedVoice = voices[i];
            break;
        }
    }
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
//end of calculating closest match based on Levenshtein distance

var handleCommand = function(c,text){
    console.log('Command - ' + c.name);
    if(c.response.indexOf('ask for text')>-1){
        takingCommands = false;
        recognition.stop(); 
        voiceCommands.speak('please say something for the ' + c.name);
        setTimeout(function(){
            var recognitionInner = new (window.SpeechRecognition || window.webkitSpeechRecognition || window.mozSpeechRecognition                       || window.msSpeechRecognition || window.oSpeechRecognition)();
            recognitionInner.lang = lang;
            recognitionInner.interimResults = false;
            recognitionInner.maxAlternatives = 5;    
            recognitionInner.start();
            recognitionInner.onresult = function(e){
                responseHandler.apply(c,[c.name,e.results[0][0].transcript]);
            };
            recognitionInner.onend = function(e){
                recognition.start();
                takingCommands = true;  
            };
        },1000);
    }
    else if(c.special){
        c.value = c.regexp.exec(text)[1];
        responseHandler.apply(c,[c.name,c.response]);
    }
    else{
        voiceCommands.speak(c.response);
        responseHandler.apply(c,[c.name,c.response]); 
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
                responseHandler.apply(obj,['new command',obj]);
                voiceCommands.speak('new command added');
            }
            else voiceCommands.speak('new command cancelled');
        });
    },2250);
};

var performSearch = function(text){
    var searchText = search.exec(text)[1];
    console.log('Searching in Google for - ' + searchText);
    $.ajax({
        type: 'GET',
        url: 'https://www.googleapis.com/customsearch/v1?key=' + DEVELOPER_KEY + '&cx=' + CSE_ID + '&q=' + searchText,
    }).done(function(res){
        searchTab = window.open(res.items[0].link,'google search'
        /*use this to make it open in a new window ,'location=yes,height=570,width=520,scrollbars=yes,status=yes'*/);
    });
};

var getVideoId = function(item){
    return new Promise(function(resolve,reject){
        var type = item.id.kind.split('#')[1];
        if(type == 'video'){
            resolve(item.id.videoId);
        }
        else {
            playlistId = item.id.playlistId;
            $.ajax({
                type: 'GET',
                url: 'https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=' + playlistId + '&key=' + DEVELOPER_KEY,
            }).done(function(response){
                if(response.items[0].snippet.resourceId.videoId){
                    resolve(response.items[0].snippet.resourceId.videoId);
                }
            }).fail(function(err){
                reject(err);
            });
        }    
    });
};

var playYoutube = function(text){
    var searchText = play.exec(text)[1];
    console.log('Playing on Youtube - ' + searchText);
    $.ajax({
        type: 'GET',
        url: 'https://www.googleapis.com/youtube/v3/search?part=snippet&key=' + DEVELOPER_KEY + '&q=' + searchText,
    }).done(function(response){
        getVideoId(response.items[0]).then(function(result){
            youtubeTab = window.open('https://www.youtube.com/watch?v=' + result ,'youtube');    
        });
    });
};

var closeYoutube = function(){
    if(youtubeTab){
        youtubeTab.close();
    }
    else voiceCommands.speak('am not playing anything');
};

voiceCommands.getUserInput = function(cb){
    takingCommands = false;
    recognition.stop(); 
    var recognitionInner = new (window.SpeechRecognition || window.webkitSpeechRecognition || window.mozSpeechRecognition || window.msSpeechRecognition || window.oSpeechRecognition)();
    recognitionInner.lang = lang;
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
    takingCommands = false;
    recognition.stop();
    var msg = new SpeechSynthesisUtterance();
    msg.voice = voiceCommands.selectedVoice;
    msg.voiceURI = voiceCommands.selectedVoice.voiceURI;
    msg.volume = 1; // 0 to 1
    msg.rate = 1; // 0.1 to 10
    msg.pitch = 1; //0 to 2
    msg.text = text;
    msg.lang = lang;
    window.speechSynthesis.speak(msg); 
    console.log('Speaking - ' + text);
    setTimeout(function(){
        recognition.start();
        takingCommands = true;
    },1000);
};

voiceCommands.setCommands = function(cmdList){
    var exp;
    commands.length = 0;
    cmdList.forEach(function(c){
        if(c.special){
            if(c.name.indexOf(':')>-1){
                exp = new RegExp('^' + c.name.replace(mid,'([^\s]+)') + '$','i');                
            }   
            else if(c.name.indexOf('*')>-1){
                exp = new RegExp('^' + c.name.replace(end,'(.*?)') + '$','i');
            }
        }
        else {
            exp = new RegExp('^' + c.name + '$','i');
        }
        commands.push({
            regexp: exp,
            special: c.special,
            name: c.name,
            response: c.response
        });
    });
};

voiceCommands.setResponseHandler = function(handler){
    responseHandler = handler;
};

voiceCommands.start = function(){
    takingCommands = true;
    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition || window.mozSpeechRecognition || window.msSpeechRecognition || window.oSpeechRecognition)();
    recognition.lang = lang;
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
        if(e.results[0][0].transcript == triggerStart || e.results[0][0].transcript == triggerStop) {
            if(e.results[0][0].transcript == triggerStart){
                voiceCommands.speak('Voice assist on');
                startedAI = true;    
            } 
            else {
                voiceCommands.speak('Voice assist off');
                startedAI = false;
            }
        }
        else if(startedAI){
            if(e.results[0][0].transcript.toLowerCase().indexOf('search')==0) {
                performSearch(e.results[0][0].transcript.toLowerCase());
            }
            else if(e.results[0][0].transcript.toLowerCase().indexOf('play')==0) {
                playYoutube(e.results[0][0].transcript.toLowerCase());
            }
            else if(e.results[0][0].transcript.toLowerCase().indexOf('stop playing')==0) {
                closeYoutube();
            }
            else {
                var flag = true;
                for(key in e.results[0]){
                    if(flag && e.results[0][key].transcript !== undefined){
                        commands.forEach(function(c){
                            if(flag && c.regexp.exec(e.results[0][key].transcript.toLowerCase()) !== null){
                                handleCommand(c,e.results[0][key].transcript.toLowerCase());
                                flag = false;
                            }
                        });
                    }
                }
                if(flag) addNewCommand(e.results[0][0].transcript.toLowerCase());
            }  
        }                   
    };
};

voiceCommands.stop = function(){
    takingCommands = false;
    recognition.stop();
};