const _ = require('lodash');
const { BU } = require('base-util-jh');

const AbstModel = require('../Default/AbstModel');

class Model extends AbstModel {
  /**
   * 장치들의 초기값을 설정
   */
  initModel() {
    const {
      pump,
      nutrientValve,
      wateringValve,
      shutter,
      outsideAirReh,
      soilReh,
      outsideAirTemperature,
      soilTemperature,
      horizontalSolar,
      pvUnderlyingSolar,
      co2,
      pumpControlType,
      shutterControlType,
      inclinedSolar,
      isRain,
      lux,
      pvRearTemperature,
      r1,
      soilWaterValue,
      windDirection,
      windSpeed,
      writeDate,
    } = this.dpcModel.S2W.BASE_KEY;

    const { device } = new this.dpcModel.S2W();

    const { PUMP, VALVE, SHUTTER } = device;

    this.device = device;

    this.nodeList.forEach(nodeInfo => {
      switch (nodeInfo.defId) {
        case pump:
          nodeInfo.data = _.sample([PUMP.STATUS.OFF, PUMP.STATUS.ON]);
          break;
        case nutrientValve:
        case wateringValve:
          nodeInfo.data = _.sample([VALVE.STATUS.CLOSE, VALVE.STATUS.OPEN]);
          break;
        case shutter:
          nodeInfo.data = _.sample([SHUTTER.STATUS.CLOSE, SHUTTER.STATUS.OPEN]);
          break;
        case pumpControlType:
        case shutterControlType:
          nodeInfo.data = _.sample(['M', 'A']);
          break;
        case co2:
          nodeInfo.data = _.random(300, 500, true);
          break;
        case isRain:
          nodeInfo.data = _.random(0, 1);
          break;
        case lux:
          nodeInfo.data = _.random(0, 3800, true);
          break;
        case outsideAirReh:
        case soilReh:
          nodeInfo.data = _.random(30, 85, true);
          break;
        // 40 도를 올림
        case outsideAirTemperature:
        case soilTemperature:
        case pvRearTemperature:
          nodeInfo.data = _.random(55, 75, true);
          break;
        case r1:
          nodeInfo.data = _.random(0, 10, true);
          break;
        case soilWaterValue:
          nodeInfo.data = _.random(40, 50, true);
          break;
        case horizontalSolar:
        case inclinedSolar:
        case pvUnderlyingSolar:
          nodeInfo.data = _.random(700, 1000, true);
          break;
        case windDirection:
          nodeInfo.data = _.random(0, 360);
          break;
        case windSpeed:
          nodeInfo.data = _.random(20, 30, true);
          break;
        case writeDate:
          nodeInfo.data = new Date();
          break;
        default:
          break;
      }
    });
  }
}
module.exports = Model;
