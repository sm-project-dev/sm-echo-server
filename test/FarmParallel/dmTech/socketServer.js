const Promise = require('bluebird');
const net = require('net');
const _ = require('lodash');
const { BU } = require('base-util-jh');
// require('../../../src/inverter/das_1.3/EchoServer');
const Control = require('../../../src/Control');
const { di, dpc } = require('../../../src/module');

const { MainConverter } = dpc;

const EchoServer = require('../../../src/EchoServer/FarmParallel/dmTech/EchoServer');

/** @type {MainConverter} */
let mainConverter;
/** @type {Control} */
let control;
/** @type {EchoServer} */
let echoServer;

const protocolInfo = {
  mainCategory: 'FarmParallel',
  subCategory: 'dmTech',
  wrapperCategory: 'default',
  deviceId: 16,
};

/**
 *
 * @param {{deviceMap: mDeviceMap, socketPort: number, protocolInfo: protocol_info}} serverInfo
 */
function operationServer(serverInfo) {
  echoServer = new EchoServer(serverInfo.protocolInfo, serverInfo.deviceMap);
  mainConverter = new MainConverter(serverInfo.protocolInfo);
  mainConverter.setProtocolConverter();

  control = new Control(serverInfo.socketPort);
  control.attachEchoServer(serverInfo.protocolInfo, serverInfo.deviceMap);
}

async function startTest() {
  const client = net.createConnection(9000);

  client.on('data', data => {
    BU.CLI(data);
  });

  // BU.CLI(mainConverter);
  // BU.CLI(echoServer);
  // BU.CLI(echoServer.device);
  let cmdList = mainConverter.generationCommand({
    key: echoServer.device.DEFAULT.KEY,
    value: 2,
  });
  let writeMsg = _.head(cmdList).data;
  BU.CLI(writeMsg);

  // Socket Server 접속 기다림
  await Promise.delay(10);

  client.write(writeMsg);

  await Promise.delay(1000);
  cmdList = mainConverter.generationCommand({ key: echoServer.device.LUX.KEY, value: 2 });
  writeMsg = _.head(cmdList).data;
  BU.CLI(writeMsg);
  client.write(writeMsg);
}

// operationServer({ deviceMap: deviceMap.FP.YeongSanPo, socketPort: 9000, protocolInfo });

// setTimeout(() => {
//   startTest();
// }, 1000);

// MultiTest

const fpdeviceMap = [
  deviceMap.FP.Naju,
  deviceMap.FP.Gangjin,
  deviceMap.FP.Boseong,
  deviceMap.FP.Ochang,
  deviceMap.FP.Yeongheung,
];

for (let index = 9000; index < 9005; index += 1) {
  // operationServer({ deviceMap: deviceMap.FP.Naju, socketPort: index, protocolInfo });
  operationServer({
    deviceMap: fpdeviceMap[_.subtract(index, 9000)],
    socketPort: index,
    protocolInfo,
  });
}

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
