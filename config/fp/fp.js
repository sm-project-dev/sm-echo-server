const protocolDasInv = {
  mainCategory: 'Inverter',
  subCategory: 'das_1.3',
  wrapperCategory: 'default',
  deviceId: '001',
  option: {
    amount: 33.3,
  },
};

const protocolDyInv = {
  mainCategory: 'Inverter',
  subCategory: 's5500k',
  wrapperCategory: 'default',
  deviceId: '\u0001',
  option: {
    amount: 5,
  },
};

const protocolSensor = {
  mainCategory: 'FarmParallel',
  subCategory: 'dmTech',
  wrapperCategory: 'default',
};

/**
 *
 * @param {protocol_info} protocol
 * @param {*} deviceId 바꾸고자 하는 Device ID
 */
function convertProtocolConfig(protocol, deviceId) {
  return { ...protocol, deviceId };
}

/** @type {desConfig} */
module.exports = {
  dbcConnConfig: {
    port: 15300,
  },
  echoConfigList: [
    {
      siteId: '001',
      siteName: '나주',
      serverPort: 9001,
      echoServerList: [
        {
          protocolConfig: protocolSensor,
          mapConfig: {
            projectId: 'FP',
            mapId: 'Naju',
            simulatorPort: 10001,
          },
        },
        {
          protocolConfig: convertProtocolConfig(protocolDasInv, Buffer.from('001')),
        },
        {
          protocolConfig: convertProtocolConfig(protocolDasInv, Buffer.from('002')),
        },
        {
          protocolConfig: convertProtocolConfig(protocolDasInv, Buffer.from('003')),
        },
      ],
    },
    {
      siteId: '002',
      siteName: '강진',
      serverPort: 9002,
      echoServerList: [
        {
          protocolConfig: protocolSensor,
          mapConfig: {
            projectId: 'FP',
            mapId: 'Gangjin',
            simulatorPort: 10002,
          },
        },
        {
          protocolConfig: convertProtocolConfig(protocolDyInv, Buffer.from([64])),
        },
        {
          protocolConfig: convertProtocolConfig(protocolDyInv, Buffer.from([65])),
        },
      ],
    },
    {
      siteId: '003',
      siteName: '보성',
      serverPort: 9003,
      echoServerList: [
        {
          protocolConfig: protocolSensor,
          mapConfig: {
            projectId: 'FP',
            mapId: 'Boseong',
          },
        },
        {
          protocolConfig: convertProtocolConfig(protocolDyInv, Buffer.from([16])),
        },
        {
          protocolConfig: convertProtocolConfig(protocolDyInv, Buffer.from([17])),
        },
      ],
    },
    // {
    //   siteId: '004',
    //   siteName: '오창',
    //   serverPort: 9004,
    //   echoServerList: [
    //     {
    //       protocolConfig: protocolSensor,
    //       mapConfig: {
    //         projectId: 'FP',
    //         mapId: 'Ochang',
    //       },
    //     },
    //     {
    //       protocolConfig: convertProtocolConfig(protocolDasInv, '001'),
    //     },
    //     {
    //       protocolConfig: convertProtocolConfig(protocolDasInv, '002'),
    //     },
    //     {
    //       protocolConfig: convertProtocolConfig(protocolDasInv, '003'),
    //     },
    //   ],
    // },
    {
      siteId: '005',
      siteName: '영흥',
      serverPort: 9005,
      echoServerList: [
        {
          protocolConfig: protocolSensor,
          mapConfig: {
            projectId: 'FP',
            mapId: 'Yeongheung',
          },
        },
        {
          protocolConfig: convertProtocolConfig(protocolDasInv, '001'),
        },
        {
          protocolConfig: convertProtocolConfig(protocolDasInv, '002'),
        },
        {
          protocolConfig: convertProtocolConfig(protocolDasInv, '003'),
        },
      ],
    },
  ],
};
