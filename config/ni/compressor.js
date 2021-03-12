/** @type {protocol_info} */
const protocolCompressor = {
  mainCategory: 'NI',
  subCategory: 'cDaq',
};

const protocol9482 = {
  mainCategory: 'NI',
  subCategory: '9482',
};

/** @type {desConfig} */
module.exports = {
  echoConfigList: [
    {
      siteId: 'sector_001',
      siteName: '컴프레셔',
      serverPort: 9999,
      echoServerList: [
        {
          protocolConfig: [protocolCompressor],
          mapConfig: {
            projectId: 'NI',
            mapId: 'compressor',
            simulatorPort: 10001,
          },
        },
      ],
    },
  ],
};
