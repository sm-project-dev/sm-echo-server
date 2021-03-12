const _ = require('lodash');
const { BU } = require('base-util-jh');

const AbstModel = require('../Default/AbstModel');

class Model extends AbstModel {
  /**
   * 장치들의 초기값을 설정
   */
  initModel() {
    const {
      BASE_KEY: {
        ampOp,
        fdValveOt,
        fdValvePtc,
        fdValveSg,
        frCumPipe,
        frCumSg,
        frInsPipe,
        frInsPipeOper,
        frInsSg,
        frequencyPipe,
        infoSky,
        infoSysMode,
        infoSysOper,
        infoUseOp,
        irradianceEnv,
        modeOt,
        modeSteam,
        pressureGaugePipe,
        pressureGaugeSg,
        ptc,
        pumpOil,
        pumpSw,
        solarEnv,
        tempEnv,
        tempOil,
        tempSteam,
        tempUnit,
      },
    } = this.dpcModel.STP;

    const { device } = new this.dpcModel.STP();

    this.device = device;

    this.nodeList.forEach(nodeInfo => {
      switch (nodeInfo.defId) {
        case ampOp:
          nodeInfo.data = _.random(10, 30, true);
          break;
        case fdValveOt:
        case fdValvePtc:
        case fdValveSg:
          nodeInfo.data = _.sample([0, 99]);
          break;
        case frCumPipe:
        case frCumSg:
          nodeInfo.data = _.random(1000, 3000, true);
          break;
        case frInsPipe:
        case frInsPipeOper:
        case frInsSg:
          nodeInfo.data = _.random(10, 100, true);
          break;
        case frequencyPipe:
          nodeInfo.data = _.random(58, 65, true);
          break;
        case irradianceEnv:
          nodeInfo.data = _.random(5, 30, true);
          break;
        case infoSysMode:
          nodeInfo.data = _.sample(['0', '1', '2']);
          break;
        case infoSky:
        case infoSysOper:
        case infoUseOp:
        case modeOt:
        case modeSteam:
        case ptc:
        case pumpOil:
        case pumpSw:
          nodeInfo.data = _.sample(['0', '1']);
          break;
        case pressureGaugePipe:
        case pressureGaugeSg:
          nodeInfo.data = _.random(5, 20, true);
          break;
        case solarEnv:
          nodeInfo.data = _.random(100, 1200, true);
          break;
        case tempEnv:
          nodeInfo.data = _.random(5, 35, true);
          break;
        case tempOil:
        case tempSteam:
        case tempUnit:
          nodeInfo.data = _.random(30, 250, true);
          break;
        default:
          break;
      }
    });
  }
}
module.exports = Model;
