const _ = require('lodash');
const { BU } = require('base-util-jh');

const AbstModel = require('../Default/AbstModel');

class Model extends AbstModel {
  /**
   * 장치들의 초기값을 설정
   */
  initModel() {
    const { percentBattery, relay } = this.dpcModel.ETC.BASE_KEY;

    const { device } = new this.dpcModel.ETC();

    const { RELAY } = device;

    this.device = device;

    this.nodeList.forEach(nodeInfo => {
      switch (nodeInfo.defId) {
        case percentBattery:
          nodeInfo.data = _.random(10, 100, true);
          break;
        case relay:
          nodeInfo.data = _.sample([RELAY.STATUS.OFF, RELAY.STATUS.ON]);
          break;
        default:
          break;
      }
    });
  }
}
module.exports = Model;
