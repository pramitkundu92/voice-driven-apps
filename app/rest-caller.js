class RestCaller {
    constructor(method,url,headers,responseType) {
        this.method = method;
        this.url = url;
        this.headers = headers;
        this.responseType = responseType;
    }
    setConfig(method,url,headers,responseType) {
        this.method = method;
        this.url = url;
        this.headers = headers;
        this.responseType = responseType;
    }
    onProgress(cb) {
        this.onProgressFn = cb;
    }
    call(data){
        var obj = this,args = arguments;
        return new Promise(function(resolve,reject){
            var xhr = new XMLHttpRequest(),method = obj.method;
            xhr.open(obj.method,obj.url,true); //async set to true default
            if(obj.headers !== undefined) {
                for(header in obj.headers){
                    xhr.setRequestHeader(header, obj.headers[header]);
                }
            }
            if(obj.responseType !== undefined) {
                xhr.responseType = obj.responseType;
            }
            xhr.onreadystatechange = function(e){
                if(xhr.readyState === XMLHttpRequest.LOADING && RestCaller.isFunction(obj.onProgressFn)) {
                    obj.onProgressFn.apply();
                }
                else if(xhr.readyState === XMLHttpRequest.DONE) {
                    if(xhr.status == 200){
                        resolve({data: JSON.parse(xhr.response),status: RestCaller.getStatus(xhr.status), headers: RestCaller.getHeaders(xhr)});
                    } 
                    else {
                        reject({status: RestCaller.getStatus(xhr.status), headers: RestCaller.getHeaders(xhr)});
                    }
                }
            }
            if(obj.data !== undefined)xhr.send(data);
            else xhr.send();
        });
    }
    static isFunction(fn){
        return (fn !== undefined && typeof fn.constructor == 'function');
    }
    static getHeaders(xhr){
        var headers = {},t;
        xhr.getAllResponseHeaders().split(/\n/g).forEach(function(headerStr){
            if(headerStr.trim().length > 0) {
                t = headerStr.split(/:/g);
                headers[t[0]] = t[1];
            }
        });
        return headers;
    }
    static getStatus(status){
        switch(status) {
            case 200: return {code: status, text: 'success'}; break;
            case 400: return {code: status, text: 'bad request'}; break;    
            case 401: return {code: status, text: 'unauthorized'}; break;
            case 403: return {code: status, text: 'forbidden'}; break;
            case 404: return {code: status, text: 'not found'}; break;
            case 500: return {code: status, text: 'internal server error'}; break;
            case 503: return {code: status, text: 'service unavailable'}; break;
            default: return {code: status, text: 'not recognized by RestCaller'}; break;
        };
    }
}