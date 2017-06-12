/* jshint esversion:6, node:true */

'use strict';

const express  = require('express'),
      app      = express(),
      http     = require('http').Server(app),
      fsHandle = require('fs'),
      path     = require('path'),
      socketIo = require('socket.io'),
      io       = socketIo.listen(http),
      port     = process.env.PORT || 3000;

var watchMap = {},
    countIdx = 0;


// UTILITY METHODS ============================================================

// watch public files for updates
function setWatch(url_path, file_type) {
    console.log(`setWatch called on ${url_path}`);

    if (!watchMap[url_path]) {
        console.log(`setting watch on ${url_path}`);

        fsHandle.watchFile(     // instruct 'fs' to watch file for changes
            url_path.slice(1),  // trim the '/' from the path
            function (current, previous) {
                console.log(`file accessed`);

                // compare modified timestampes, `mtime`
                if (current.mtime !== previous.mtime) {
                    console.log(`file changed`);

                    // emit a script of stylesheet event to client
                    io.sockets.emit(file_type, url_path);
                }
            }
        );
        watchMap[url_path] = true;
    }
}

// increment a counter, emit Socket.io event
function countUp() {
    countIdx += 1;
    console.log(countIdx);
    io.sockets.send(countIdx);
}


// SERVER CONFIG ==============================================================

// middleware to set a watch for any statically served files
app.use( (req, res, next) => {

    // if the requested file is in the js folder, consider it a script
    if (req.url.indexOf('/js/') >= 0) {
        setWatch(req.url, 'script');
    }
    // if the requested file is in the css folder, consider it css
    else if (req.url.indexOf('/css/') >= 0) {
        setWatch(req.url, 'stylesheet');
    }
    next();
});

// set static files location
app.use(express.static(__dirname + '/'));

// the one true route!
app.get('/', (req, res) => {
    res
        .status(200)
        .sendFile(path.join(__dirname, './socket.html'));
});


// START SERVER ===============================================================

http.listen(port, function () {
    console.log(
        'Server listening on port %d in %s mode',
        port, app.settings.env
    );
});

setInterval(countUp, 1000);
