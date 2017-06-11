/* jshint esversion:6, node: true */

'use strict';

// SETUP ======================================================================

const express    = require('express'),
      app        = express(),
      routes     = require('./routes/routes.js'),
      morgan     = require('morgan'),
      bodyParser = require('body-parser'),
      port       = process.env.PORT || 3000;


// CONFIG =====================================================================

app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// set static files location
app.use(express.static(__dirname + '/public'));


// ROUTING ====================================================================

app.use(routes);


// ERROR LOGGING ==============================================================

if (app.settings.env === 'development') {
    app.use((err, req, res, next) => {
        console.error(err.stack);
        res.status(500).send('Something broke!');
    });
}


// START SERVER ===============================================================

app.listen(port, function () {
    console.log(
        'Server listening on port %d in %s mode',
        port, app.settings.env
    );
});
