require('dotenv').config();
const path = require('path');

const { BU } = require('base-util-jh');

const Control = require('./src/Control');
const Main = require('./src/Main');
const config = require('./config');

module.exports = Control;

// if __main process
if (require !== undefined && require.main === module) {
  const serverConfig = config;

  // if (process.env.NODE_ENV === 'production') {
  //   const serverPath = path.join(process.cwd(), 'server.config');
  //   serverConfig = require(serverPath);
  // } else {
  // serverConfig = config;
  // }

  // console.log(process.env);

  console.log('__main__');

  const main = new Main();

  // console.dir(serverConfig);
  main.init(serverConfig);

  // const controlList = main.createServer(config.fp);
  // const controlList = main.createServer([config.fp[0]]);

  // const control = main.getEchoServer('001')

  process.on('uncaughtException', err => {
    // BU.debugConsole();
    console.error(err);
    console.log('Node NOT Exiting...');
  });

  process.on('unhandledRejection', err => {
    // BU.debugConsole();
    console.error(err);
    console.log('Node NOT Exiting...');
  });
}
