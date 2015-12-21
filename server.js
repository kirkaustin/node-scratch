// server.js
// author: Kirk Austin
// Here's an HTTP server more in the style of a C++ app.
// It demonstrates use of a "main" function and rotating-file logging.
// Our configuration information is based on the NODE_ENV environment variable.
// Possible values are "localdev", "development", and "production", with "development" being the default.
// The "localdev" config is only used on a developer's laptop.
// The environment variable refers to the .js file in the config directory with the same name.
var config = require('config');
// other packages
var fs = require('fs');
var bunyan = require('bunyan');
var restify = require('restify');

(function main() {
   /* log levels in bunyan
		"fatal": The service/app is going to stop or become unusable now. An operator should definitely look into this soon.
		"error": Fatal for a particular request, but the service/app continues servicing other requests. An operator should look at this soon(ish).
		"warn": A note on something that should probably be looked at by an operator eventually.
		"info": Detail on regular operation.
		"debug": Anything else, i.e. too verbose to be included in "info" level.
		"trace": Logging from external libraries used by your app or very detailed application logging.
	*/
    // Logging
    var logName = 'node-scratch';
    if (config.log && config.log.name) {
        logName = config.log.name;
    }
    var logPath = logName + '.log';
    if (config.log && config.log.path) {
        logPath = config.log.path;
    }
    var logDir = logPath.substring(0, logPath.lastIndexOf('/'));
    if (logDir && !fs.existsSync(logDir)) {
        fs.mkdirSync(logDir); // create the log directory if it doesn't exist
    }
    var bunyanLog = bunyan.createLogger({
        name: logName,
        streams: [{
            type: 'rotating-file',
            path: logPath,
            period: '1d', // daily rotation
            count: 3 // keep 3 back copies
        }],
        serializers: restify.bunyan.serializers
    });

    // spin up an http REST server
    var serverName = 'Node Scratch'; // default
    if (config.server && config.server.name) {
        serverName = config.server.name;
    }
    var serverOptions = {
        "name": serverName,
        "log": bunyanLog
    };
    var server = restify.createServer(serverOptions);
    // determine which port
    var serverPort = 8080; // default
    if (config.server && config.server.port) {
        serverPort = config.server.port;
    }
    // start accepting requests
    server.listen(serverPort, function onListening() {
        // log something
        console.log(server.name + " started on port " + serverPort + "!  " + "config: " + JSON.stringify(config));
        bunyanLog.info(server.name + " started on port " + serverPort + "!  " + "config: " + JSON.stringify(config));
    });

    // Begin serving static files from the "public" directory
    server.get(/\//, restify.serveStatic({
        directory: './public',
        default: 'index.html'
    }));

    // Fatal situation, write error immediately to file and exit to let forever restart
    process.on('uncaughtException', function (err) {
        fs.appendFileSync('fatal.log', '\n' + (new Date).toUTCString() + ' uncaughtException!' + '\n');
        fs.appendFileSync('fatal.log', err.stack);
        process.exit(1);
    });

})();