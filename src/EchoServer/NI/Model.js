const _ = require('lodash');
const { BU } = require('base-util-jh');

const AbstModel = require('../Default/AbstModel');

class Model extends AbstModel {
  /**
   * 장치들의 초기값을 설정
   */
  initModel() {
    const {
      absPressure,
      compressor,
      gaugePressure,
      pressure,
      relay,
      valve,
      voltage,
    } = this.dpcModel.NI.BASE_KEY;

    const { device } = new this.dpcModel.NI();

    const { RELAY, VOLTAGE } = device;

    this.device = device;

    this.nodeList.forEach(nodeInfo => {
      switch (nodeInfo.defId) {
        case valve:
        case compressor:
          nodeInfo.data = _.sample([RELAY.STATUS.OFF, RELAY.STATUS.ON]);
          break;
        case absPressure:
          nodeInfo.data = _.random(0, 20, true);
          break;
        default:
          break;
      }
    });
  }
}
module.exports = Model;
