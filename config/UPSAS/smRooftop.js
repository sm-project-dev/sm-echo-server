const defaultMap = require('../../maps/UPSAS/smRoofTop/defaultMap');

require('../config.guide');

const protocolEsp3k5Inv = {
  mainCategory: 'Inverter',
  subCategory: 'ESP3K5',
  wrapperCategory: 'default',
  deviceId: '\u0001',
  option: {
    amount: 3,
  },
};

const protocolInfo = {
  mainCategory: 'UPSAS',
  subCategory: 'smRooftop',
  cmdExecTimeoutMs: 1000 * 2,
};

/** @type {desConfig} */
module.exports = {
  echoConfigList: [
    {
      siteId: 'smDevice',
      siteName: '옥상형 태양광 통합관리시스템',
      serverPort: process.env.ECHO_PORT_1 || 15301,
      echoServerList: [
        {
          map: defaultMap,
          protocolConfig: [protocolInfo],
          mapConfig: {
            projectId: 'upsas',
            mapId: 'smRoofTop',
            simulatorPort: process.env.SIMUL_PORT || 10001,
          },
        },
      ],
    },
    // {
    //   siteId: 'inv',
    //   siteName: '옥상형 태양광 통합관리시스템 인버터',
    //   serverPort: process.env.ECHO_PORT_2 || 15302,
    //   echoServerList: [
    //     {
    //       map: defaultMap,
    //       protocolConfig: [protocolEsp3k5Inv],
    //       mapConfig: {
    //         projectId: 'upsas',
    //         mapId: 'smRoofTop',
    //       },
    //     },
    //   ],
    // },
  ],
};
