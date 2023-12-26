'use strict';

const express = require('express');

const DeezerConnection = require('./deezer.js');
const waiter = require('./waiter.js');

const app = express();
const port = 3000;

var d = new DeezerConnection();
d.auth().then(_ => waiter.update());

// Serve static files from the "public" directory
app.use(express.static(__dirname + '/static/public'));

app
    .get('/', (req, res) => {
        res.sendFile(__dirname + '/static/app.html');
    })
    .get('/dz/playlist/:token', (req, res) => {
        d.playlist(req.params.token).then(data => res.json({status: 1, data: data})).catch(() => res.json({status: 0, error: 'wrong link'}));
    })

waiter.onready = () => {
    console.log('All services authenticated!');
    app.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`);
    });
}