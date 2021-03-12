const net = require('net');

const { BU } = require('base-util-jh');
// require('../../../src/inverter/das_1.3/EchoServer');
const Control = require('../../../src/Control');

const { di, dpc } = require('../../../src/module');

function operationServer() {
  /**
   * @type {protocol_info[]}
   */
  const deviceList = [
    {
      deviceId: '001',
      mainCategory: 'Sensor',
      subCategory: 'EanPV',
      option: {
        amount: 0.2,
      },
    },
  ];
  const control = new Control(9001);

  control.attachEchoServer(deviceList);
}

operationServer();
// startTest();

process.on('uncaughtException', err => {
  // BU.debugConsole();
  console.error(err.stack);
  console.log(err.message);
  console.log('Node NOT Exiting...');
});

process.on('unhandledRejection', err => {
  // BU.debugConsole();
  console.error(err.stack);
  console.log(err.message);
  console.log('Node NOT Exiting...');
});
