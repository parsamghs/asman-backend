const sendLogToEita = require("./sendLogToEita");

function activateLogSender() {
  const originalError = console.error;
  const originalWarn = console.warn;

  console.error = function (...args) {
    const message = args.join(" ");
    sendLogToEita("error", message);
    originalError.apply(console, args);
  };

  console.warn = function (...args) {
    const message = args.join(" ");
    sendLogToEita("warn", message);
    originalWarn.apply(console, args);
  };

  console.log('\x1b[32m%s\x1b[0m','Eita log sender activated.');
}

module.exports = activateLogSender;
