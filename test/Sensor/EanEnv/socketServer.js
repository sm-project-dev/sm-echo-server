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
      subCategory: 'EanEnv',
      option: {
        amount: 0.2,
      },
    },
  ];
  const control = new Control(9000);

  control.attachEchoServer(deviceList);
}

function startTest() {
  const client = net.createConnection(9000);

  client.on('data', data => {
    BU.CLI(data.toString());
  });
  // Sytem
  setTimeout(() => {
    client.write('^P000MOD');
  }, 100);

  // PV
  setTimeout(() => {
    client.write('^P002ST1');
  }, 200);

  // GRID VOL
  setTimeout(() => {
    client.write('^P002ST2');
  }, 300);

  // GRID AMP
  setTimeout(() => {
    client.write('^P000ST3');
  }, 400);

  // POWER
  setTimeout(() => {
    client.write('^P000ST4');
  }, 500);

  // OPERATION
  setTimeout(() => {
    client.write('^P002ST6');
  }, 600);
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
