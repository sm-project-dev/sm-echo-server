const host = 'localhost';
// const host = 'fp.smsoft.co.kr';
const port = 8001;

module.exports = [
  {
    connectInfo: {
      host,
      port,
      uuid: '001',
    },
    fp: {
      protocolInfo: {
        mainCategory: 'FarmParallel',
        subCategory: 'dmTech',
        wrapperCategory: 'default',
        deviceId: 1,
      },
      deviceMap: deviceMap.FP.Naju,
    },
    inverter: {
      protocolList: [
        {
          mainCategory: 'Inverter',
          subCategory: 'das_1.3',
          wrapperCategory: 'default',
          deviceId: '001',
          option: {
            amount: 33.3,
          },
        },
        {
          mainCategory: 'Inverter',
          subCategory: 'das_1.3',
          wrapperCategory: 'default',
          deviceId: '002',
          option: {
            amount: 33.3,
          },
        },
        {
          mainCategory: 'Inverter',
          subCategory: 'das_1.3',
          wrapperCategory: 'default',
          deviceId: '003',
          option: {
            amount: 33.3,
          },
        },
      ],
    },
  },
  {
    connectInfo: {
      host,
      port,
      uuid: '002',
    },
    fp: {
      protocolInfo: {
        mainCategory: 'FarmParallel',
        subCategory: 'dmTech',
        wrapperCategory: 'default',
        deviceId: 2,
      },
      deviceMap: deviceMap.FP.Gangjin,
    },
    inverter: {
      protocolList: [
        {
          mainCategory: 'Inverter',
          subCategory: 's5500k',
          wrapperCategory: 'default',
          deviceId: '\u0001',
          option: {
            amount: 5,
          },
        },
        {
          mainCategory: 'Inverter',
          subCategory: 's5500k',
          wrapperCategory: 'default',
          deviceId: '\u0002',
          option: {
            amount: 5,
          },
        },
      ],
    },
  },
  {
    connectInfo: {
      host,
      port,
      uuid: '003',
    },
    fp: {
      protocolInfo: {
        mainCategory: 'FarmParallel',
        subCategory: 'dmTech',
        wrapperCategory: 'default',
        deviceId: 3,
      },
      deviceMap: deviceMap.FP.Boseong,
    },
    inverter: {
      protocolList: [
        {
          mainCategory: 'Inverter',
          subCategory: 's5500k',
          wrapperCategory: 'default',
          deviceId: '\u0001',
          option: {
            amount: 5,
          },
        },
        {
          mainCategory: 'Inverter',
          subCategory: 's5500k',
          wrapperCategory: 'default',
          deviceId: '\u0002',
          option: {
            amount: 5,
          },
        },
      ],
    },
  },
  {
    connectInfo: {
      host,
      port,
      uuid: '004',
    },
    fp: {
      protocolInfo: {
        mainCategory: 'FarmParallel',
        subCategory: 'dmTech',
        wrapperCategory: 'default',
        deviceId: 4,
      },
      deviceMap: deviceMap.FP.Ochang,
    },
    inverter: {
      protocolList: [
        {
          mainCategory: 'Inverter',
          subCategory: 'das_1.3',
          wrapperCategory: 'default',
          deviceId: '001',
          option: {
            amount: 33.3,
          },
        },
        {
          mainCategory: 'Inverter',
          subCategory: 'das_1.3',
          wrapperCategory: 'default',
          deviceId: '002',
          option: {
            amount: 33.3,
          },
        },
        {
          mainCategory: 'Inverter',
          subCategory: 'das_1.3',
          wrapperCategory: 'default',
          deviceId: '003',
          option: {
            amount: 33.3,
          },
        },
      ],
    },
  },
  {
    connectInfo: {
      host,
      port,
      uuid: '005',
    },
    fp: {
      protocolInfo: {
        mainCategory: 'FarmParallel',
        subCategory: 'dmTech',
        wrapperCategory: 'default',
        deviceId: 5,
      },
      deviceMap: deviceMap.FP.Yeongheung,
    },
    inverter: {
      protocolList: [
        {
          mainCategory: 'Inverter',
          subCategory: 'das_1.3',
          wrapperCategory: 'default',
          deviceId: '001',
          option: {
            amount: 33.3,
          },
        },
        {
          mainCategory: 'Inverter',
          subCategory: 'das_1.3',
          wrapperCategory: 'default',
          deviceId: '002',
          option: {
            amount: 33.3,
          },
        },
        {
          mainCategory: 'Inverter',
          subCategory: 'das_1.3',
          wrapperCategory: 'default',
          deviceId: '003',
          option: {
            amount: 33.3,
          },
        },
      ],
    },
  },
];
