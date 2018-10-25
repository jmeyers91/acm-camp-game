const colyseus = require('colyseus');
const http = require('http');
const express = require('express');
const config = require('../config');

const app = express();
const gameServer = new colyseus.Server({
  server: http.createServer(app)
});

gameServer.register('camp', require('./Camp'));
gameServer.listen(config.gamePort);

console.log(`Listening on port ${config.gamePort}`);

process.once('SIGUSR2', () => process.kill(process.pid, 'SIGUSR2'));
