const _ = require('lodash');
const net = require('net');

const { BU } = require('base-util-jh');
// require('../../../src/inverter/s5500k/EchoServer');
const Control = require('../../../src/Control');

const { di, dpc } = require('../../../src/module');

function operationServer() {
  /**
   * @type {protocol_info}
   */
  const protocolInfo = {
    deviceId: '\u0001',
    mainCategory: 'Inverter',
    subCategory: 's5500k',
    wrapperCategory: 'default',
    protocolOptionInfo: {
      hasTrackingData: true,
    },
    option: {
      amount: 5.5,
    },
  };

  const control = new Control(9006);

  const protocolList = [];
  for (let index = 0; index < 3; index += 1) {
    const cloneProtocolInfo = _.clone(protocolInfo);

    const buf = Buffer.allocUnsafe(1);
    buf.writeIntLE(index, 0, 1);
    cloneProtocolInfo.deviceId = buf.toString();

    protocolList.push(cloneProtocolInfo);
  }

  // BU.CLI(protocolList);

  control.attachEchoServer(protocolList);
}

function startTest() {
  const client = net.createConnection(9002);

  client.on('data', data => {
    BU.CLI(data.toString());
  });
  // Sytem
  setTimeout(() => {
    client.write(Buffer.from([0x0a, 0x96, 0x01, 0x54, 0x18, 0x05, 0x6d]));
  }, 100);
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
