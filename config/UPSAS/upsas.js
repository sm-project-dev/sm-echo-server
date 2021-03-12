require('../config.guide');

/** @type {protocol_info} */
const protocolHexInv = {
  mainCategory: 'Inverter',
  subCategory: 'hexTriple',
  deviceId: '',
  option: {
    amount: 25,
  },
};

/** @type {protocol_info} */
const protocolDkCnt = {
  mainCategory: 'Sensor',
  subCategory: 'CNT_DK_v2.2',
  deviceId: '',
  option: {
    amount: 25,
    chCount: 6,
  },
};

/** @type {protocol_info} */
const protocolSensor = {
  mainCategory: 'UPSAS',
  subCategory: 'muan100kW',
};

/**
 *
 * @param {protocol_info} protocol
 * @param {*} deviceId 바꾸고자 하는 Device ID
 */
function convertProtocolConfig(protocol, deviceId) {
  const conProtocolInfo = { ...protocol };
  conProtocolInfo.deviceId = deviceId;
  return conProtocolInfo;
}

/** @type {desConfig} */
module.exports = {
  dbcConnConfig: {},
  echoConfigList: [
    {
      siteId: 'upsas100kW',
      siteName: '무안 100kW 실증부지 염전',
      serverPort: 9001,
      parserInfo: {
        parser: 'delimiterParser',
        option: '}',
      },
      echoServerList: [
        {
          protocolConfig: protocolSensor,
          mapConfig: {
            projectId: 'UPSAS',
            mapId: 'muan100kW',
            simulatorPort: 10001,
          },
        },
      ],
    },
    {
      siteId: 'upsas100kW',
      siteName: '무안 100kW 실증부지 인버터',
      serverPort: 9002,
      echoServerList: [
        {
          protocolConfig: convertProtocolConfig(protocolHexInv, Buffer.from('01')),
        },
        {
          protocolConfig: convertProtocolConfig(protocolHexInv, Buffer.from('02')),
        },
        {
          protocolConfig: convertProtocolConfig(protocolHexInv, Buffer.from('03')),
        },
        {
          protocolConfig: convertProtocolConfig(protocolHexInv, Buffer.from('04')),
        },
      ],
    },
    {
      siteId: 'upsas100kW',
      siteName: '무안 100kW 실증부지 접속반',
      serverPort: 9003,
      parserInfo: {
        parser: 'delimiterParser',
        option: '}',
      },
      echoServerList: [
        {
          protocolConfig: convertProtocolConfig(protocolDkCnt, 1),
        },
        {
          protocolConfig: convertProtocolConfig(protocolDkCnt, 2),
        },
        {
          protocolConfig: convertProtocolConfig(protocolDkCnt, 3),
        },
        {
          protocolConfig: convertProtocolConfig(protocolDkCnt, 4),
        },
      ],
    },
  ],
};
