const { BU } = require('base-util-jh');
// require('../../../src/inverter/das_1.3/EchoServer');

function testConstruct() {
  const Control = require('../../../src/Control');
  /**
   * @type {Array.<protocol_info>}
   */
  const deviceList = [
    {
      deviceId: '000',
      mainCategory: 'ess',
      subCategory: 'das_pv_led',
      protocolOptionInfo: {
        hasTrackingData: true,
      },
      option: {
        isUseKw: false,
      },
    },
    {
      deviceId: '002',
      mainCategory: 'ess',
      subCategory: 'das_pv_led',
      protocolOptionInfo: {
        hasTrackingData: true,
      },
      option: {
        isUseKw: true,
      },
    },
    {
      deviceId: '002',
      mainCategory: 'ess',
      subCategory: 'das_pv_led',
      protocolOptionInfo: {
        hasTrackingData: true,
      },
      option: {
        isUseKw: true,
      },
    },
  ];
  const control = new Control(9000);

  control.attachEchoServer(deviceList);

  // 2개 장치 구동
  if (control.echoServerList.length !== 2) {
    throw new Error(`expect ${2}\t res: ${control.echoServerList.length}`);
  }
}

function startTest() {
  const socketClient = require('net');

  const client = socketClient.createConnection(9000);

  client.on('data', data => {
    BU.CLI(data.toString());
  });
  // Sytem
  setTimeout(() => {
    client.write('^P000MOD');
  }, 300);

  // PV
  setTimeout(() => {
    client.write('^P002ST1');
  }, 600);

  // GRID VOL
  setTimeout(() => {
    client.write('^P002ST2');
  }, 900);

  // GRID AMP
  setTimeout(() => {
    client.write('^P000ST3');
  }, 1200);

  // POWER
  setTimeout(() => {
    client.write('^P000ST4');
  }, 1500);

  // OPERATION
  setTimeout(() => {
    client.write('^P002ST6');
  }, 1800);

  // OPERATION
  setTimeout(() => {
    client.write('^P002ST7');
  }, 2100);

  // OPERATION
  setTimeout(() => {
    client.write('^P002ST8');
  }, 2400);

  // OPERATION
  setTimeout(() => {
    client.write('^P002ST9');
  }, 2700);
}

testConstruct();
startTest();

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
