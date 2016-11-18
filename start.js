const inMainProcess = (process && process.type === 'browser');
module.exports = inMainProcess ? require('./server/server') : require('./dist/hft');



