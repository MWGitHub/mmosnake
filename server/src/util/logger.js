var bunyan = require('bunyan');
var logger = bunyan.createLogger({
    name: 'msnake-server'
});

module.exports = logger;