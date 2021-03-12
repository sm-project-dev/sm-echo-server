const Promise = require('bluebird');
const net = require('net');
const { BU } = require('base-util-jh');
// require('../../../src/inverter/das_1.3/EchoServer');
const Control = require('../../../src/Control');

const { di, dpc } = require('../../../src/module');

const SimulatorWeb = require('../../../src/SimulatorWeb');

function operationServer() {
  /**
   * @type {protocol_info[]}
   */
  const deviceList = [
    {
      mainCategory: 'UPSAS',
      subCategory: 'xbee',
      parserOption: {
        parser: 'delimiterParser',
        option: '}',
      },
    },
    {
      mainCategory: 'UPSAS',
      subCategory: 'xbee',
      parserOption: {
        parser: 'delimiterParser',
        option: '}',
      },
    },
    {
      mainCategory: 'UPSAS',
      subCategory: 'xbee',
      parserOption: {
        parser: 'delimiterParser',
        option: '}',
      },
    },
  ];
  const control = new Control(9000, {
    parser: 'delimiterParser',
    option: '}',
  });

  // 생성된 에코서버
  const echoServer = control.attachEchoServer(deviceList, deviceMap.UPSAS.muan6kW);

  // 시뮬레이터 웹 서버 구동
  const simulWeb = new SimulatorWeb(9100, echoServer);
  simulWeb.init();

  // 2개 장치 구동
  if (control.echoServerList.length !== 1) {
    throw new Error(`expect ${1}\t res: ${control.echoServerList.length}`);
  }
}

async function startTest() {
  const client = net.createConnection(9000);

  client.on('data', data => {
    BU.CLI(data.toString());
  });

  /** @type {xbeeApi_0x10} */
  const writeMsg = {
    destination64: '0013A20040F7ACC8',
    data: '@cgo',
  };

  // Socket SErver 접속 기다림
  await Promise.delay(10);

  // 수문 개방 요청
  client.write(JSON.stringify(writeMsg));

  await Promise.delay(1000);

  writeMsg.data = '@sts';
  // 개방 상태 확인
  client.write(JSON.stringify(writeMsg));
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
