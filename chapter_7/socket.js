/* jshint esversion:6, node:true */

'use strict';

const express  = require('express'),
      app      = express(),
      http     = require('http').Server(app),
      path     = require('path'),
      socketIo = require('socket.io'),
      io       = socketIo.listen(http),
      port     = process.env.PORT || 3000;

var countIdx = 0;


// UTILITY METHODS ============================================================

function countUp() {
    countIdx += 1;
    console.log(countIdx);
    io.sockets.send(countIdx);
}


// SERVER CONFIG ==============================================================

// set static files location
app.use(express.static(__dirname + '/'));

// one route
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
