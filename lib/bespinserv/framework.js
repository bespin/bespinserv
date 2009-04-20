var Request = require("jack/request").Request;
var Response = require("jack/response").Response;
var model = require("./model");

var Jack_File = require("jack/file").File;
var file = require("file");

var fourOhFour = function(env) {
    var path  = env["PATH_INFO"] ? env["PATH_INFO"].squeeze("/") : "";
    var response = new Response(404, {"Content-Type" : "text/plain"}, 
                                "Not Found: "+path);
    return response.finish();
}

var URLRelay = function(defaultApp) {
    var that = this;
    this.patterns = [];
    
    if (defaultApp) {
        this.defaultApp = defaultApp;
    } else {
        this.defaultApp = fourOhFour;
    }
    this.application = function(env) {
        return that._application(env);
    }
}

URLRelay.prototype = {
    _application: function(env) {
        var path  = env["PATH_INFO"] ? env["PATH_INFO"].squeeze("/") : "";
        var method = env["REQUEST_METHOD"].toUpperCase();
        
        for (var i = 0; i < this.patterns.length; i++) {
            var item = this.patterns[i];
            
            if (method != item[1]) {
                continue;
            }
            
            var result = item[0].exec(path);
            
            if (result) {
                env.relayMatch = result;
                return item[2](env);
            }
        }
        return this.defaultApp(env);
    }
}

var staticDir = new file.Path(file.cwd()).join("frontend").absolute();

var staticApp = Jack_File(staticDir);

var relay = exports.relay = new URLRelay(staticApp);

var bespinRequest = function(env) {
    var result = new Request(env);
    result.relayMatch = env.relayMatch;
    result.user = new model.User("bespin");
    result.username = "bespin";
    result.userManager = new model.UserManager();
    return result;
}

exports.expose = function(regex, method, auth, func) {
    newfunc = function(env) {
        var request = bespinRequest(env);
        var response = new Response();
        try {
            return func(request, response);
        } catch (e) {
            if (e instanceof exports.BadRequest) {
                response.status = 400;
                response.body = e.message;
                return response.finish();
            }
            throw e;
        }
    }
    // XXX This should actually be a method on the URLRelay object
    // and, more importantly, it should only perform a regex comparison
    // once even if there are multiple HTTP methods that could
    // match.
    relay.patterns.unshift([regex, method.toUpperCase(), newfunc]);
}

exports.BadRequest = function(message) {
    this.message = message;
}

exports.BadRequest.prototype = new Error("Bad request");
