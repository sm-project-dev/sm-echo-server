const _ = require('lodash');
const EventEmitter = require('events');

const { BU } = require('base-util-jh');

const AbstModel = require('../AbstModel');

module.exports = class extends EventEmitter {
  /**
   *
   * @param {AbstModel} model
   */
  init(model) {
    const {
      isExistCrc = true,
      dataLoggerList,
      deviceMap,
      nodeList,
      protocolConverter,
      protocolInfo,
      emitReload,
      peelFrameMsg,
      findDataLogger,
      reload,
      wrapFrameMsg,
    } = model;

    this.deviceMap = deviceMap;
    this.isExistCrc = isExistCrc;
    /** @type {detailDataloggerInfo[]} */
    this.dataLoggerList = dataLoggerList;
    /** @type {detailNodeInfo[]} */
    this.nodeList = nodeList;
    this.protocolConverter = protocolConverter;
    this.protocolInfo = protocolInfo;
    // Method
    this.emitReload = emitReload;
    this.peelFrameMsg = peelFrameMsg;
    this.findDataLogger = findDataLogger;
    this.reload = reload;
    this.wrapFrameMsg = wrapFrameMsg;

    this.setModbus();

    model.on('reload', () => {
      this.emit('reload');
    });
  }

  setModbus() {
    // BU.CLIN(this.dataLoggerList);
    this.dataLoggerList.forEach(dlInfo => {
      const { nodeList } = dlInfo;
      // 모드 버스 레지스터 범위가 FC=03 기준 49999
      const modbusStorage = Array(50000).fill(0);

      dlInfo.modbusStorage = modbusStorage;

      // console.dir(this.nodeList);
      nodeList.forEach(nodeId => {
        // console.log(nodeId);
        const nodeInfo = _.find(this.nodeList, { nodeId });

        if (nodeInfo) {
          const { modbusInfo } = nodeInfo;
          if (modbusInfo) {
            const { address, fnCode, dataLength } = modbusInfo;
            // console.log(fnCode);
            let realAddr = 1;

            switch (fnCode) {
              case 1:
                realAddr += address;
                modbusStorage[realAddr] = nodeInfo;
                break;
              case 3:
                realAddr += address + 40000;
                modbusStorage[realAddr] = nodeInfo;
                break;
              case 4:
                realAddr += address + 30000;
                modbusStorage[realAddr] = nodeInfo;
                break;

              default:
                break;
            }
          }
        }
      });
    });
  }

  /**
   * 장치 상태 변경 데이터가 들어왔을 경우
   * @param {detailNodeInfo} nodeInfo
   * @param {*} newData
   */
  controlDevice(nodeInfo, newData) {
    nodeInfo.data = newData;
    this.emitReload();
  }

  /**
   * DBS에서 요청한 명령
   * @param {Buffer} bufData
   */
  onData(bufData) {
    BU.log(bufData);
  }
};
