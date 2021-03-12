const _ = require('lodash');
const { BU } = require('base-util-jh');

const { dpc } = require('../../module');

const { BaseModel } = dpc;
const AbstModel = require('../Default/AbstModel');

class Model extends AbstModel {
  /**
   * @param {protocol_info} protocolInfo
   * @param {mDeviceMap} deviceMap
   */
  constructor(protocolInfo, deviceMap) {
    super(protocolInfo, deviceMap);

    this.nodeDefKeyInfo = BaseModel.FarmParallel.BASE_KEY;

    // Intellisense를 위한 device 재정의
    this.device = new BaseModel.FarmParallel(protocolInfo).device;
  }

  /**
   * 장치들의 초기값을 설정
   */
  init() {
    const {
      co2,
      horizontalSolar,
      inclinedSolar,
      isRain,
      lux,
      outsideAirReh,
      outsideAirTemperature,
      pvRearTemperature,
      pvUnderlyingSolar,
      r1,
      soilReh,
      soilTemperature,
      soilWaterValue,
      windDirection,
      windSpeed,
      writeDate,
    } = this.nodeDefKeyInfo;

    this.nodeList.forEach(nodeInfo => {
      switch (nodeInfo.defId) {
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
