var Http = {};

Http.UNSENT = 0;
Http.OPENED = 1;
Http.HEADERS_RECIEVED = 2;
Http.LOADING = 3;
Http.DONE = 4;

Http.encode = function(x) {
    var a = [];
    for (var i in x) {
        if(!x.hasOwnProperty(i)) {
            continue;
        }
        if(typeof x[i] == "function") {
            continue;
        }
        a.push(encodeURIComponent(i.replace(/ /g, "+")) + "=" + encodeURIComponent(x[i].toString().replace(/ /g, "+")));
    }
    return a.join("&");
};

Http.objMerge = function(x, y) {
    var o = y;
    for (var i in x) {
        if(!o.hasOwnProperty(i)) {
            o[i] = x[i];
        }
    }
    return o;
};

Http.request = function(x) {
    var onStart = x.onStart ? x.onStart : Http.options.onStart;
    if(onStart) {
        onStart();
    } 
    var r = new XMLHttpRequest();
    var c = 0;
    var t;
    var p1;
    var url = x.url ? x.url : Http.options.url;
    var async = x.async === undefined ? x.async : Http.options.async;
    var pL = x.paramLocation ? x.paramLocatioin : Http.options.paramLocation;
    var params;
    if(Http.options.params) {
        params = Http.options.params;
    }
    if(x.params) {
        params = Http.objMerge((params ? params : {}), x.params);
    }
    if(params) {
        params = Http.encode(params);
    }
    var headers;
    if(Http.options.headers) {
        headers = Http.options.headers;
    }
    if(x.headers) {
        headers = Http.objMerge((headers ? headers : {}), x.headers);
    }
    var method = x.method ? x.method : Http.options.method;
    if(params && (pL == "url" || pL == "both")) {
        url += "?" + params;
    }
    r.open(method, url, async);
    var onOpen = x.onOpen ? x.onOpen : Http.options.onOpen;
    if(onOpen) {
        onOpen(method, url, async);
    }
    if(headers) {
        for (var i in headers) {
            r.setRequestHeader(i, headers[i]);
        }
    }
    var props;
    if(Http.options.properties) {
        props = Http.options.properties;
    }
    if(x.properties) {
        props = Http.objMerge((props ? props : {}), x.properties);
    }
    if(props) {
        for (var j in props) {
            r[j] = props[j];
        }
    }
    var onSuccess = x.onSuccess ? x.onSuccess : Http.options.onSuccess;
    var onFailure = x.onFailure ? x.onFailure : Http.options.onFailure;
    if(async) {
        var timeout = x.timeout ? x.timeout : Http.options.timeout;
        var onTimeout = x.onTimeout ? x.onTimeout : Http.options.onTimeout;
        if(timeout) {
            t = setTimeout(function() {
                r.abort();
                if(onTimeout) {
                    onTimeout(timeout);
                }
            }, timeout);
        }
        var onSC = x.onStateChange ? x.onStateChange : Http.options.onStateChange;
        r.onreadystatechange = function() {
            if(r.readyState == 4) {
                if(t) {
                    clearTimeout(t);
                }
                if(r.status == 200) {
                    p1 = true;
                    onComplete(r);
                } else {
                    p1 = false;
                    if(onFailure) {
                        onFailure(r.status, r.statusText, r);
                    }
                }
            } else if(onSC) {
                onSC(++c);
            }
        };
    }
    var toSend = null;
    if(params && (pL == "send" || pL == "both")) {
        toSend = params;
    }
    if(Http.options.toSend != null) {
        toSend = Http.options.toSend;
    }
    if(x.toSend !== undefined) {
        toSend = x.toSend;
    }
    r.send(toSend);
    var onSend = x.onSend ? x.onSend : Http.options.onSend;
    if(onSend) {
        onSend(toSend);
    }
    if(!async) {
        if(r.status == 200) {
            p1 = true;
            onSuccess(r);
        } else {
            p1 = false;
            if(onFailure) {
                onFailure(r.status, r.statusText, r);
            }
        }
    }
    var onComplete = x.onComplete ? x.onComplete : Http.options.onComplete;
    if(onComplete) {
        onComplete(url, p1);
    }
};

Http.options = {
    method: "GET",
    async: true,
    params: null,
    paramLocation: "url",
    toSend: null,
    properties: null,
    headers: null,
    url: null,
    timeout: null,
    onSuccess: null,
    onFailure: null,
    onStart: null,
    onComplete: null,
    onOpen: null,
    onSend: null,
    onTimeout: null,
    onStateChange: null
};

Http.get = function(url, opt) {
    var r = new XMLHttpRequest();
    var c = 0;
    var t;
    var p1;
    if(opt.params) {
        url += "?" + Http.encode(opt.params);
    }
    if(opt.async === undefined) {
        opt.async = true;
    }
    if(typeof opt.type != "string") {
        opt.type = "text";
    }
    r.open("GET", url, opt.async);
    if(opt.headers) {
        for (var i in opt.headers) {
            r.setRequestHeader(i, opt.headers[i]);
        }
    }
    if(opt.onStart) {
        opt.onStart();
    }
    if(opt.async) {
        if(opt.timeout) {
            t = setTimeout(function() {
                r.abort();
                if(opt.onTimeout) {
                    opt.onTimeout();
                }
            }, opt.timeout);
        }
        r.onreadystatechange = function() {
            if(r.readyState == 4) {
                if(t) {
                    clearTimeout(t);
                }
                if(r.status == 200) {
                    p1 = true;
                    switch (opt.type) {
                    case "xml":
                        opt.onSuccess(r.responseXML);
                        break;
                    case "json":
                        if(JSON && JSON.parse) {
                            opt.onSuccess(JSON.parse(r.responseText));
                        } else {
                            opt.onSuccess(eval("(" + r.responseText + ")"));
                        }
                        break;
                    case "object":
                        opt.onSuccess(r);
                        break;
                    default:
                        opt.onSuccess(r.responseText);
                    }
                } else {
                    p1 = false;
                    if(opt.onFailure) {
                        opt.onFailure(r.status, r.statusText);
                    }
                }
            } else if(opt.onStateChange) {
                opt.onStateChange(++c);
            }
        };
    }
    r.send(null);
    if(!opt.async) {
        if(r.status == 200) {
            p1 = true;
            switch (opt.type) {
            case "xml":
                opt.onSuccess(r.responseXML);
                break;
            case "json":
                if(JSON && JSON.parse) {
                    opt.onSuccess(JSON.parse(r.responseText));
                } else {
                    opt.onSuccess(eval("(" + r.responseText + ")"));
                }
                break;
            case "object":
                opt.onSuccess(r);
                break;
            default:
                opt.onSuccess(r.responseText);
            }
        } else {
            p1 = false;
            if(opt.onFailure) {
                opt.onFailure(r.status, r.statusText);
            }
        }
    }
    if(opt.onComplete) {
        opt.onComplete(p1);
    }
};

Http.post = function(url, opt) {
    var r = new XMLHttpRequest();
    var c = 0;
    var t;
    var p1;
    if(opt.async === undefined) {
        opt.async = true;
    }
    if(typeof opt.type != "string") {
        opt.type = "text";
    }
    r.open("POST", url, opt.async);
    r.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    if(opt.headers) {
        for (var i in opt.headers) {
            r.setRequestHeader(i, opt.headers[i]);
        }
    }
    if(opt.onStart) {
        opt.onStart();
    }
    if(opt.async) {
        if(opt.timeout) {
            t = setTimeout(function() {
                r.abort();
                if(opt.onTimeout) {
                    opt.onTimeout();
                }
            }, opt.timeout);
        }
        r.onreadystatechange = function() {
            if(r.readyState == 4) {
                if(t) {
                    clearTimeout(t);
                }
                if(r.status == 200) {
                    p1 = true;
                    switch (opt.type) {
                    case "xml":
                        opt.onSuccess(r.responseXML);
                        break;
                    case "json":
                        if(JSON && JSON.parse) {
                            opt.onSuccess(JSON.parse(r.responseText));
                        } else {
                            opt.onSuccess(eval("(" + r.responseText + ")"));
                        }
                        break;
                    case "object":
                        opt.onSuccess(r);
                        break;
                    default:
                        opt.onSuccess(r.responseText);
                    }
                } else {
                    p1 = false;
                    if(opt.onFailure) {
                        opt.onFailure(r.status, r.statusText);
                    }
                }
            } else if(opt.onStateChange) {
                opt.onStateChange(++c);
            }
        };
    }
    r.send(Http.encode(opt.params));
    if(!opt.async) {
        if(r.status == 200) {
            p1 = true;
            switch (opt.type) {
            case "xml":
                opt.onSuccess(r.responseXML);
                break;
            case "json":
                if(JSON && JSON.parse) {
                    opt.onSuccess(JSON.parse(r.responseText));
                } else {
                    opt.onSuccess(eval("(" + r.responseText + ")"));
                }
                break;
            case "object":
                 opt.onSuccess(r);
                 break;
            default:
                 opt.onSuccess(r.responseText);
            }
        } else {
            p1 = false;
            if(opt.onFailure) {
                opt.onFailure(r.status, r.statusText);
            }
        }
    }
    if(opt.onComplete) {
        opt.onComplete(p1);
    }
};

Http.head = function(url, opt) {
    var r = new XMLHttpRequest();
    var c = 0;
    var t;
    var p1;
    if(opt.params) {
        x += "?" + Http.encode(opt.params);
    }
    if(opt.async === undefined) {
        opt.async = true;
    }
    r.open("HEAD", url, opt.async);
    if(opt.headers) {
        for (var i in opt.headers) {
            r.setRequestHeader(i, opt.headers[i]);
        }
    }
    if(opt.onStart) {
        opt.onStart();
    }
    if(opt.async) {
        if(opt.timeout) {
            t = setTimeout(function() {
                r.abort();
                if(opt.onTimeout) {
                    opt.onTimeout();
                }
            }, opt.timeout);
        }
        r.onreadystatechange = function() {
            if(r.readyState == 4) {
                if(t) {
                    clearTimeout(t);
                }
                if(r.status == 200) {
                    p1 = true;
                    opt.onSuccess(Http.head.parse(r.getAllResponseHeaders()));
                } else {
                    p1 = false;
                    if(opt.onFailure) {
                        opt.onFailure(r.status, r.statusText);
                    }
                }
            } else if(opt.onStateChange) {
                opt.onStateChange(++c);
            }
        };
    }
    r.send(null);
    if(!opt.async) {
        if(r.status == 200) {
            p1 = true;
            opt.onSuccess(Http.head.parse(r.getAllResponseHeaders()));
        } else {
            p1 = false;
            if(opt.onFailure) {
                opt.onFailure(r.status, r.statusText);
            }
        }
    }
    if(opt.onComplete) {
        opt.onComplete(p1);
    }
};

Http.head.parse = function(x) {
    var o = {};
    var h1 = x.split("\n");
    for (var i = 0; i < h1.length; i++) {
        var h2 = h1[i];
        if(h2.length == 0) {
            continue;
        }
        var h3 = h2.indexOf(":");
        var hh1 = h2.substring(0, h3).replace(/^\s*/, "").replace(/\s*$/, "");
        var hh2 = h2.substring(h3 + 1).replace(/^\s*/, "").replace(/\s*$/, "");
        o[hh1] = hh2;
    }
    return o;
};

Http.jsonp = function(url, opt) {
    var num = "jsonp" + Http.jsonp.id++;
    var name = "Http.jsonp." + num;
    var param = opt.param ? opt.param : Http.jsonp.paramName;
    url += (url.indexOf("?") == -1 ? "?" : "&") + param + "=" + name;
    var doc = opt.document ? opt.document : document;
    var s = doc.createElement("script");
    Http.jsonp[num] = function(json) {
        try {
            opt.onSuccess(json);
        } catch (ex) {
            if(opt.onFailure) {
                opt.onFailure(ex);
            }
        } finally {
            delete Htto.jsonp[num];
            s.parentNode.removeChild(s);
        }
    };
    s.src = url;
    doc.body.appendChild(s);
};

Http.jsonp.id = 0;
Http.jsonp.paramName = "jsonp";

Http.loadInto = function(elem, url, def) {
    Http.get(url, {onSuccess: function(r) {
        elem.innerHTML = r;}, onFailure: function() {
        if(def) { elem.innerHTML = def;}}});
};

Http.loadIntoSync = function(elem, url, def) {
    Http.get(url, {async: false, onSuccess: function(r) {
        elem.innerHTML = r;}, onFailure: function() {
        if(def) { elem.innerHTML = def;}}});
};

Http.loadJS = function(url, opt) {
    if((opt && opt.check !== false) || !opt) {
        if(Http.loadedJS.indexOf(url) != -1) {
            return;
        }
    }
    var doc = (opt && opt.document) ? opt.document : document;
    var s = d.createElement("script");
    s.type = "text/javascript";
    s.src = url;
    if(opt && opt.attributes) {
        for (var i in opt.attributes) {
            s.setAttribute(i, opt.attributes[i]);
        }
    }
    if(opt && opt.location == "head") {
        doc.getElementsByTagName("head")[0].appendChild(s);
    } else {
        doc.body.appendChild(s);
    }
    Http.loadedJS.push(url);
};

Http.loadedJS = [];

Http.postData = function(url, data, opt) {
    var r = new XMLHttpRequest();
    var async = true;
    if(opt && opt.async === false) {
        async = false;
    }
    var parseData = true;
    if(opt && opt.parseData === false) {
        parseData = true;
    }
    r.open("POST", url, async);
    if(parseData) {
        r.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    }
    if(opt && opt.headers) {
        for (var i in opt.headers) {
            r.setRequestHeader(i, opt.headers[i]);
        }
    }
    r.send(parseData ? Http.encode(data) : data);
};

Http.returnContents = function(url, opt) {
    var r = new XMLHttpRequest();
    if(opt && opt.params) {
        url += "?" + Http.encode(opt.params);
    }
    var type = (opt && typeof opt.type == "string") ? opt.type : "text";
    r.open("GET", url, false);
    if(opt && opt.headers) {
        for (var i in opt.headers) {
            r.setRequestHeader(i, opt.headers[i]);
        }
    }
    r.send(null);
    if(r.status == 200) {
        switch (type) {
        case "xml":
            return r.responseXML;
        case "json":
            if(JSON && JSON.parse) {
                return JSON.parse(r.responseText);
            } else {
                return eval("(" + r.responseText + ")");
            }
        case "object":
            return r;
        default:
            return r.responseText;
        }
    } else {
        throw new Error("Could not get file: " + r.status + " " + r.statusText);
    }
};