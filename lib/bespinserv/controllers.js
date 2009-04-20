var json = require("json");

var expose = require("./framework").expose;
var BadRequest = require("./framework").expose;
var model = require("./model");

var _respondJSON = function(response, data) {
    response.setHeader("Content-Type", "application/json");
    response.write(json.encode(data));
    return response.finish();
}

expose(/^\/register\/new\/(.*)$/, 'POST', false,
function(request, response) {
    return _respondJSON(response, {});
});

expose(/^\/register\/userinfo\/$/, 'GET', true,
function(request, response) {
    response.status = 200;
    var data = {};
    data.quota = 15000000;
    data.amountUsed = 1000;
    data.username = request.username;
    return _respondJSON(response, data);
});

expose(/^\/register\/login\/(.+)$/, 'POST', false,
function(request, response) {
    return _respondJSON(response, {});
});

expose(/^\/register\/logout\/$/, '', true,
function(request, response) {
    response.body = "Logged out.";
    return response.finish();
});

var _split_path = function(request) {
    var path = request.relayMatch[1];
    var firstslash = path.indexOf("/");
    if (firstslash == -1) {
        throw new BadRequest("Project and path are both required.");
    }
    var result = {
        project: path.substring(0, firstslash),
        path: path.substring(firstslash+1)
    };
    
    var parts = result.project.split('+');
    if (parts[1] === undefined) {
        result.owner = request.user;
    } else {
        result.owner = request.userManager.getUser(parts[0]);
        result.project = parts[2];
    }
    return result
}

expose(/^\/file\/listopen\/$/, 'GET', true,
function(request, response) {
    var result = request.user.files;
    return _respondJSON(response, result);
});

expose(/^\/file\/at\/(.*)$/, 'PUT', true,
function(request, response) {
    var user = request.user;

    var sp = _split_path(request)
    
    var project = model.getProject(user, sp.owner, sp.project, true, 
                    request.userManager);

    if (sp.path) {
        project.saveFile(sp.path, request.body());
    }
    return response.finish()
});

expose(/^\/file\/at\/(.*)$/, 'GET', true,
function(request, response) {
    var user = request.user;

    var sp = _split_path(request);

    var project = model.getProject(user, sp.owner, sp.project,
                    false, request.userManager);

    var mode = request.GET().mode || "rw";
    var contents = project.getFile(sp.path, mode)
    response.body = contents;
    return response.finish()
});

expose(/^\/file\/close\/(.*)$/, 'POST', true,
function(request, response) {
    var user = request.user;

    var sp = _split_path(request);
    
    var project = model.getProject(user, sp.owner, sp.project,
                false, request.userManager);

    project.close(path);
    return response.finish();
});

expose(/^\/file\/at\/(.*)$/, 'DELETE', true,
function(request, response) {
    var user = request.user;

    var sp = _split_path(request);
    var project = model.getProject(user, sp.owner, sp.project,
                false, request.userManager);

    project.deleteFile(path);
    return response.finish();
});

expose(/^\/file\/list\/(.*)$/, 'GET', true,
function(request, response) {
    var user = request.user;
    var path = request.relayMatch[1];
    var result = [];
    var sp, project;

    if (!path) {
        var projects = request.userManager.getUserProjects(user, true);
        
        projects.forEach(function (project) {
            if (project.owner == user) {
                result.push({ 'name':project.shortName });
            } else {
                result.push({ 'name':project.owner.username 
                        + "+" + project.shortName });
            }
        })
    } else {
        try {
            sp = _split_path(request);
        } catch (e) {
            if (e instanceof BadRequest) {
                project = path;
                path = '';
            } else {
                throw e;
            }
        }
        
        project = model.getProject(user, sp.owner, sp.project,
                        false, request.userManager);

        var files = project.listFiles(path);
        
        files.forEach(function(item) {
            reply = { 'name':item.shortName };
            // _populate_stats(item, reply)
            result.push(reply);
        });
    }

    return _respondJSON(response, result);
})
