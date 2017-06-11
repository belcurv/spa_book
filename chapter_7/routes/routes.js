/* jshint esversion:6, node: true */

'use strict';

const routes = require('express').Router(),
      path   = require('path');

    
routes.get('/', (req, res) => {
    res
        .status(200)
        .sendFile(path.join(__dirname, '../public/spa.html'));
});

// Express 4 got rid of 'basicAuth' methods
// The following sort of approximates what's missing
// This is insecure as hell!
routes.all('/:obj_type/*?', (req, res, next) => {

    const auth = {
        login: 'test',
        password: 'password'
    };
    const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
    const [login, password] = new Buffer(b64auth, 'base64').toString().split(':');
    
    // Verify login and password are set and correct
    if (!login || !password || login !== auth.login || password !== auth.password) {
        res.set('WWW-Authenticate', 'Basic realm="Web"');
        res.status(401).send('You shall not pass.');
        return;
    }
    
    next();
});

routes.get('/:obj_type/list', (req, res) => {
    res
        .status(200)
        .json({title: `${req.params.obj_type} list`});
});

routes.post('/:obj_type/create', (req, res) => {
    res
        .status(200)
        .json({title: `${req.params.obj_type} created`});
});

routes.get('/:obj_type/read/:id([0-9]+)', (req, res) => {
    res
        .status(200)
        .json({title: `${req.params.obj_type} with id ${req.params.id} found`});
});

routes.post('/:obj_type/update/:id([0-9]+)', (req, res) => {
    res
        .status(200)
        .json({title: `${req.params.obj_type} with id ${req.params.id} updated`});
});

routes.get('/:obj_type/delete/:id([0-9]+)', (req, res) => {
    res
        .status(200)
        .json({title: `${req.params.obj_type} with id ${req.params.id} deleted`});
});

module.exports = routes;
