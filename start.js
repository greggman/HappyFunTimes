
function getAPIForSituation() {
  const isBrowserProcess = (process && process.type === 'browser');
  const isMain = (require && require.main === module);

  if (isBrowserProcess) {
    // For the browser process in electron
    return require('./server/server');
  }

  if (isMain) {
    // If run from node directly
    return require('./server/standalone');
  }

  // For a webpage in electron or other
  return require('./dist/hft');
}

module.exports = getAPIForSituation();




