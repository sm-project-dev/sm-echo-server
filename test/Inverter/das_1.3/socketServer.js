const _ = require('lodash');
const net = require('net');

const { BU } = require('base-util-jh');
// require('../../../src/inverter/das_1.3/EchoServer');
const Control = require('../../../src/Control');

const { di, dpc } = require('../../../src/module');

function operationServer() {
  /**
   * @type {protocol_info}
   */
  const protocolInfo = {
    deviceId: '001',
    mainCategory: 'Inverter',
    subCategory: 'das_1.3',
    // wrapperCategory: 'default',
    protocolOptionInfo: {
      hasTrackingData: true,
    },
    option: {
      amount: 33.3,
    },
  };
  const control = new Control(15301);

  const protocolList = [];
  for (let index = 1; index < 2; index += 1) {
    const cloneProtocolInfo = _.clone(protocolInfo);
    cloneProtocolInfo.deviceId = _.padStart(_.toString(index), 3, '00');

    protocolList.push(cloneProtocolInfo);
  }
  control.attachEchoServer(protocolList);
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
