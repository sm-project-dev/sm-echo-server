const { dpc } = require('../../../module');

const {
  BaseModel: { FarmParallel: Model },
} = dpc;

module.exports = dialing => {
  // 국번은 숫자
  /** @type {decodingProtocolInfo} */
  const INSIDE_SITE = {
    dialing,
    address: 0,
    bodyLength: 19,
    decodingDataList: [
      {
        key: Model.BASE_KEY.lux,
      },
      {
        key: Model.BASE_KEY.pvUnderlyingSolar,
      },
      {
        key: Model.BASE_KEY.soilTemperature,
        scale: 0.1,
        fixed: 1,
      },
      {
        key: Model.BASE_KEY.soilReh,
        scale: 0.1,
        fixed: 1,
      },
      {
        key: Model.BASE_KEY.co2,
      },
      {
        key: Model.BASE_KEY.soilWaterValue,
        scale: 0.1,
        fixed: 1,
      },
      {
        key: Model.BASE_KEY.outsideAirTemperature,
        scale: 0.1,
        fixed: 1,
      },
      {
        key: Model.BASE_KEY.outsideAirReh,
        scale: 0.1,
        fixed: 1,
      },
      {
        key: Model.BASE_KEY.windDirection,
      },
      {
        key: Model.BASE_KEY.windSpeed,
        scale: 0.1,
        fixed: 1,
      },
      {
        key: Model.BASE_KEY.r1,
        scale: 0.1,
        fixed: 1,
      },
      {
        key: Model.BASE_KEY.isRain,
      },
    ],
  };

  /** @type {decodingProtocolInfo} */
  const MICRO_SITE = {
    dialing,
    address: 0,
    bodyLength: 19,
    decodingDataList: [
      {
        key: Model.BASE_KEY.r1,
      },
      {
        key: Model.BASE_KEY.pvUnderlyingSolar,
      },
      {
        key: Model.BASE_KEY.soilTemperature,
        scale: 0.1,
        fixed: 1,
      },
      {
        key: Model.BASE_KEY.soilReh,
        scale: 0.1,
        fixed: 1,
      },
      {
        key: Model.BASE_KEY.lux,
        byte: 4,
      },
      {
        key: Model.BASE_KEY.soilWaterValue,
        scale: 0.1,
        fixed: 1,
      },
      {
        key: Model.BASE_KEY.outsideAirTemperature,
        scale: 0.1,
        fixed: 1,
      },
    ],
  };

  /** @type {decodingProtocolInfo} */
  const OUTSIDE_SITE = {
    dialing,
    address: 0,
    bodyLength: 19,
    decodingDataList: [
      {
        key: Model.BASE_KEY.lux,
      },
      {
        key: Model.BASE_KEY.horizontalSolar,
      },
      {
        key: Model.BASE_KEY.soilTemperature,
        scale: 0.1,
        fixed: 1,
      },
      {
        key: Model.BASE_KEY.soilReh,
        scale: 0.1,
        fixed: 1,
      },
      {
        key: Model.BASE_KEY.co2,
      },
      {
        key: Model.BASE_KEY.soilWaterValue,
        scale: 0.1,
        fixed: 1,
      },
      {
        key: Model.BASE_KEY.outsideAirTemperature,
        scale: 0.1,
        fixed: 1,
      },
      {
        key: Model.BASE_KEY.outsideAirReh,
        scale: 0.1,
        fixed: 1,
      },
      {
        key: Model.BASE_KEY.windDirection,
      },
      {
        key: Model.BASE_KEY.windSpeed,
        scale: 0.1,
        fixed: 1,
      },
      {
        key: Model.BASE_KEY.r1,
        scale: 0.1,
        fixed: 1,
      },
      {
        key: Model.BASE_KEY.isRain,
      },
    ],
  };

  // byte는 명시되지 않을 경우 기본 2byte로함, 기본 파서는 convertBufToReadInt
  [INSIDE_SITE, MICRO_SITE, OUTSIDE_SITE].forEach(decodingTable => {
    decodingTable.decodingDataList.forEach(decodingInfo => {
      const { byte, callMethod } = decodingInfo;
      if (byte === undefined) {
        decodingInfo.byte = 2;
      }

      if (callMethod === undefined) {
        decodingInfo.callMethod = 'convertBufToReadInt';
      }
    });
  });

  return {
    INSIDE_SITE,
    MICRO_SITE,
    OUTSIDE_SITE,
  };
};
