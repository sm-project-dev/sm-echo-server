const { dpc } = require('../../../module');

const { BaseModel } = dpc;

const Model = BaseModel.FarmParallel;

module.exports = dialing => {
  /** @type {decodingProtocolInfo} */
  const INCLINED_SITE = {
    dialing,
    address: 0,
    bodyLength: 19,
    decodingDataList: [
      {
        key: Model.BASE_KEY.lux,
      },
      {
        key: Model.BASE_KEY.inclinedSolar,
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
      {
        key: Model.BASE_KEY.pvUnderlyingSolar,
      },
      {
        key: Model.BASE_KEY.pvUnderlyingSolar,
      },
    ],
  };

  /** @type {decodingProtocolInfo} */
  const HORIZONTAL_SITE = {
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
      {
        key: Model.BASE_KEY.pvUnderlyingSolar,
      },
      {
        key: Model.BASE_KEY.pvUnderlyingSolar,
      },
    ],
  };

  /**
   * @desc PV [농병 1, 4]
   * 경사 일사량이 붙어 있는 로거
   * @type {decodingProtocolInfo}
   */
  const PRT_SITE = {
    dialing,
    address: 0,
    bodyLength: 19,
    decodingDataList: [
      {
        key: Model.BASE_KEY.lux,
      },
      {
        key: Model.BASE_KEY.inclinedSolar,
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
        key: Model.BASE_KEY.pvRearTemperature,
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
      {
        key: Model.BASE_KEY.pvUnderlyingSolar,
      },
      {
        key: Model.BASE_KEY.pvUnderlyingSolar,
      },
    ],
  };
  /**
   * @desc Pv Under Soloar [2, 5]
   * 농병 경사 일사량과 모듈 하부 온도 센서가 붙어 있는 로거
   * @type {decodingProtocolInfo}
   */
  const PUS_SITE = {
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
      {
        key: Model.BASE_KEY.pvUnderlyingSolar,
      },
      {
        key: Model.BASE_KEY.pvUnderlyingSolar,
      },
    ],
  };

  /**
   * @desc Pv Under Soloar [32,35]
   * 농병 경사 일사량과 모듈 하부 온도 센서가 붙어 있는 로거
   * @type {decodingProtocolInfo}
   */
  const FOUR_SOLAR_SITE = {
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
        key: Model.BASE_KEY.pvUnderlyingSolar,
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
      {
        key: Model.BASE_KEY.pvUnderlyingSolar,
      },
      {
        key: Model.BASE_KEY.pvUnderlyingSolar,
      },
    ],
  };

  return {
    INCLINED_SITE,
    HORIZONTAL_SITE,
    PRT_SITE,
    PUS_SITE,
    FOUR_SOLAR_SITE,
  };
};
