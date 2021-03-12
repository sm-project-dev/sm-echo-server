const { BU } = require('base-util-jh');
const defaultMap = require('../../maps/solar2way/grapeFarm/defaultMap');

const protocolKdxInv = {
  mainCategory: 'Inverter',
  subCategory: 'KDX_300',
  wrapperCategory: 'default',
  deviceId: '\u0001',
  option: {
    amount: 3,
  },
};

const protocolEsp3k5Inv = {
  mainCategory: 'Inverter',
  subCategory: 'ESP3K5',
  wrapperCategory: 'default',
  deviceId: '\u0001',
  option: {
    amount: 3,
  },
};

const protocolSensorSer = {
  mainCategory: 'S2W',
  subCategory: 'dmTech',
  wrapperCategory: 'default',
  cmdExecTimeoutMs: 1000 * 2,
};

const protocolSensorSm = {
  mainCategory: 'S2W',
  subCategory: 'sm',
  wrapperCategory: 'default',
  cmdExecTimeoutMs: 1000 * 2,
};

/** @type {desConfig} */
module.exports = {
  dbcConnConfig: {
    port: 15300,
  },
  echoConfigList: [
    {
      siteId: '102',
      siteName: '나주 포도밭',
      serverPort: 9001,
      echoServerList: [
        {
          map: defaultMap,
          protocolConfig: [protocolSensorSer, protocolSensorSm],
          mapConfig: {
            projectId: 'S2W',
            mapId: 'grapeFarm',
            simulatorPort: 10001,
          },
        },
        // {
        //   protocolConfig: convertProtocolConfig(protocolEsp3k5Inv, Buffer.alloc(1, 58)),
        // },
        // {
        //   protocolConfig: convertProtocolConfig(protocolEsp3k5Inv, Buffer.alloc(1, 57)),
        // },
        // {
        //   protocolConfig: convertProtocolConfig(protocolKdxInv, Buffer.alloc(1, 1)),
        // },
        // {
        //   protocolConfig: convertProtocolConfig(protocolKdxInv, Buffer.alloc(1, 2)),
        // },
        // {
        //   protocolConfig: convertProtocolConfig(protocolKdxInv, Buffer.alloc(1, 3)),
        // },
        // {
        //   protocolConfig: convertProtocolConfig(protocolKdxInv, Buffer.alloc(1, 4)),
        // },
        // {
        //   protocolConfig: convertProtocolConfig(protocolKdxInv, Buffer.alloc(1, 5)),
        // },
        // {
        //   protocolConfig: convertProtocolConfig(protocolKdxInv, Buffer.alloc(1, 6)),
        // },
      ],
    },
  ],
};
