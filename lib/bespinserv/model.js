
var User = exports.User = function(username) {
    this.username = username;
    this.files = [];
}

exports.UserManager = function() {
    
}

exports.UserManager.prototype = {
    getUser: function(username) {
        return new User("bespin");
    },
    
    getUserProjects: function(user, includeShared) {
        return [new Project("BespinSettings"), new Project("Bespin")];
    }
}

var File = exports.File = function(name) {
    this.name = name;
    this.shortName = name;
}

var Project = exports.Project = function(name) {
    this.name = name;
    this.shortName = name;
    this.owner = new User("bespin");
}

exports.Project.prototype = {
    saveFile: function(path, body) {
        
    },
    
    getFile: function(path, mode) {
        return "My Lovely File";
    },
    
    close: function(path) {
        
    },
    
    deleteFile: function(path) {
        
    },
    
    listFiles: function(path) {
        return [new File("HelloWorld")];
    }
}

exports.getProject = function(user, owner, project, create, userManager) {
    return new Project("Bespin");
}
