const _ = require('lodash');

const { BU } = require('base-util-jh');

const Model = require('../Model');

class EchoServer extends Model {
  /**
   * protocol_info.option --> true: 3.3kW, any: 600W
   * @param {protocol_info} protocolInfo
   * @param {mDeviceMap} deviceMap
   */
  constructor(protocolInfo, deviceMap) {
    super(protocolInfo, deviceMap);

    this.initSetNode();
    // BU.CLI(this.nodeList);

    this.bufDataBattery = Buffer.from([0x31, 0x30, 0x2e, 0x32]);

    this.normalDeviceOperTime = 30;
    this.pumpDeviceOperTime = 40;
  }

  /**
   * 장치들의 초기값을 설정
   */
  initSetNode() {
    this.nodeList.forEach(nodeInfo => {
      switch (nodeInfo.defId) {
        case this.device.WATER_DOOR.KEY:
          nodeInfo.data = this.device.WATER_DOOR.STATUS.CLOSE;
          break;
        case this.device.VALVE.KEY:
        case this.device.GATE_VALVE.KEY:
          nodeInfo.data = this.device.VALVE.STATUS.CLOSE;
          break;
        case this.device.PUMP.KEY:
          nodeInfo.data = this.device.PUMP.STATUS.OFF;
          break;
        case this.device.BRINE_TEMPERATURE.KEY:
          nodeInfo.data = _.random(35.1, 39.9);
          break;
        case this.device.MODULE_FRONT_TEMPERATURE.KEY:
        case this.device.MODULE_REAR_TEMPERATURE.KEY:
          nodeInfo.data = _.random(30.1, 35.9);
          break;
        case this.device.WATER_LEVEL.KEY:
          nodeInfo.data = _.random(0, 10, true);
          break;
        case this.device.SALINITY.KEY:
          nodeInfo.data = _.random(0, 10, true);
          break;
        case this.device.CONNECTOR_GROUND_RELAY.KEY:
          nodeInfo.data = _.random(0, 1);
          break;
        default:
          break;
      }
    });
  }

  /**
   * 수문 제어 요청이 들어왔을 경우
   * @param {string} cmd
   * @param {detailNodeInfo} nodeInfo
   */
  controlWaterDoor(cmd, nodeInfo) {
    // BU.CLI('controlWaterDoor');
    const DEVICE = this.device.WATER_DOOR;
    const CLOSE = _.get(_.head(DEVICE.COMMAND.CLOSE), 'cmd');
    const OPEN = _.get(_.head(DEVICE.COMMAND.OPEN), 'cmd');

    // 요청 명령이 닫는 명령이라면
    if (cmd === CLOSE) {
      // 현재 상태가 열려있는 상태라면
      if (nodeInfo.data === DEVICE.STATUS.OPEN) {
        // 닫는 상태로 변경
        nodeInfo.data = DEVICE.STATUS.CLOSING;
        setTimeout(() => {
          nodeInfo.data = DEVICE.STATUS.CLOSE;
        }, this.normalDeviceOperTime);
      }
    } else if (cmd === OPEN) {
      // 현재 상태가 닫혀있다면
      if (nodeInfo.data === DEVICE.STATUS.CLOSE) {
        // 여는 상태로 변경
        // BU.CLI('여는 상태로 변경');
        // BU.CLI(nodeInfo.data);
        nodeInfo.data = DEVICE.STATUS.OPENING;
        setTimeout(() => {
          // BU.CLI('열림');
          nodeInfo.data = DEVICE.STATUS.OPEN;
        }, this.normalDeviceOperTime);
      }
    }
  }

  /**
   * 밸브 제어 요청이 들어왔을 경우
   * @param {string} cmd
   * @param {detailNodeInfo} nodeInfo
   */
  controlValve(cmd, nodeInfo) {
    // BU.CLI(cmd, nodeInfo)
    const DEVICE = this.device.VALVE;
    const CLOSE = _.get(_.head(DEVICE.COMMAND.CLOSE), 'cmd');
    const OPEN = _.get(_.head(DEVICE.COMMAND.OPEN), 'cmd');

    // 요청 명령이 닫는 명령이라면
    if (cmd === CLOSE) {
      // 현재 상태가 열려있는 상태라면
      if (nodeInfo.data === DEVICE.STATUS.OPEN) {
        // 닫는 상태로 변경
        nodeInfo.data = DEVICE.STATUS.CLOSING;
        setTimeout(() => {
          nodeInfo.data = DEVICE.STATUS.CLOSE;
        }, this.normalDeviceOperTime);
      }
    } else if (cmd === OPEN) {
      // 현재 상태가 닫혀있다면
      if (nodeInfo.data === DEVICE.STATUS.CLOSE) {
        // 여는 상태로 변경
        nodeInfo.data = DEVICE.STATUS.OPENING;
        // BU.CLI(nodeInfo);
        setTimeout(() => {
          nodeInfo.data = DEVICE.STATUS.OPEN;
          // BU.CLI(nodeInfo);
        }, this.normalDeviceOperTime);
      }
    }
  }

  /**
   * 펌프 제어 요청이 들어왔을 경우
   * @param {string} cmd
   * @param {detailNodeInfo} nodeInfo
   */
  controlPump(cmd, nodeInfo) {
    const DEVICE = this.device.PUMP;
    const OFF = _.get(_.head(DEVICE.COMMAND.OFF), 'cmd');
    const ON = _.get(_.head(DEVICE.COMMAND.ON), 'cmd');

    // 요청 명령이 닫는 명령이라면
    if (cmd === OFF) {
      // 현재 상태가 열려있는 상태라면
      // if (nodeInfo.data === DEVICE.STATUS.ON) {
      // 닫는 상태로 변경
      setTimeout(() => {
        nodeInfo.data = DEVICE.STATUS.OFF;
      }, this.pumpDeviceOperTime);
      // }
    } else if (cmd === ON) {
      // 현재 상태가 닫혀있다면
      // if (nodeInfo.data === DEVICE.STATUS.OFF) {
      // 여는 상태로 변경
      setTimeout(() => {
        nodeInfo.data = DEVICE.STATUS.ON;
      }, this.pumpDeviceOperTime);
      // }
    }
  }

  /**
   * @param {detailNodeInfo} nodeInfo
   * @param {detailNodeInfo[]} nodeList
   */
  getWaterDoor(nodeInfo, nodeList) {
    // BU.CLIS(nodeInfo);
    const bufHeader = Buffer.from([0x23, 0x30, 0x30, 0x30, 0x31, 0x30, 0x30, 0x30, 0x31]);

    const DEVICE = this.device.WATER_DOOR;
    let deviceHex;
    switch (nodeInfo.data) {
      case DEVICE.STATUS.STOP:
        deviceHex = [0x30, 0x30];
        break;
      case DEVICE.STATUS.OPEN:
        deviceHex = [0x30, 0x32];
        break;
      case DEVICE.STATUS.CLOSING:
        deviceHex = [0x30, 0x33];
        break;
      case DEVICE.STATUS.CLOSE:
        deviceHex = [0x30, 0x34];
        break;
      case DEVICE.STATUS.OPENING:
        deviceHex = [0x30, 0x35];
        break;
      default:
        break;
    }
    // BU.CLI(deviceHex);

    // 염도 센서 값
    const nodeWL = _.find(nodeList, { defId: this.device.WATER_LEVEL.KEY });
    const nodeS = _.find(nodeList, { defId: this.device.SALINITY.KEY });

    let tempData;

    tempData = _.isEmpty(nodeWL) ? 0 : _.round(nodeWL.data * 10);
    const bufDataWL = this.protocolConverter.convertNumToBuf(tempData, 2);

    tempData = _.isEmpty(nodeS) ? 0 : _.round(nodeS.data * 10);
    const bufDataS = this.protocolConverter.convertNumToBuf(tempData, 4);

    // Level: 2, Salinity: 4, Batter: 4
    return Buffer.concat([
      bufHeader,
      Buffer.from(deviceHex),
      bufDataWL,
      bufDataS,
      this.bufDataBattery,
    ]);
  }

  /**
   * @param {detailNodeInfo} nodeInfo
   * @param {detailNodeInfo[]} nodeList
   */
  getValve(nodeInfo, nodeList) {
    // BU.CLI('getValve', nodeInfo)
    const bufHeader = Buffer.from([0x23, 0x30, 0x30, 0x30, 0x31, 0x30, 0x30, 0x30, 0x32]);
    const DEVICE = this.device.VALVE;
    let deviceHex;
    switch (nodeInfo.data) {
      case DEVICE.STATUS.UNDEF:
        deviceHex = [0x30, 0x30];
        break;
      case DEVICE.STATUS.CLOSE:
        deviceHex = [0x30, 0x31];
        break;
      case DEVICE.STATUS.OPEN:
        deviceHex = [0x30, 0x32];
        break;
      case DEVICE.STATUS.OPENING:
        deviceHex = [0x30, 0x34];
        break;
      case DEVICE.STATUS.CLOSING:
        deviceHex = [0x30, 0x35];
        break;
      default:
        break;
    }

    const nodeWL = _.find(nodeList, { defId: this.device.WATER_LEVEL.KEY });
    const nodeBT = _.find(nodeList, { defId: this.device.BRINE_TEMPERATURE.KEY });
    const nodeMRT = _.find(nodeList, { defId: this.device.MODULE_REAR_TEMPERATURE.KEY });

    let tempData;

    tempData = _.isEmpty(nodeWL) ? 0 : _.round(nodeWL.data * 10);
    const bufDataWL = this.protocolConverter.convertNumToBuf(tempData, 2);

    // 모듈 염수 온도
    tempData = _.isEmpty(nodeBT) ? 0 : _.round(nodeBT.data, 1);
    const bufDataBT = this.protocolConverter.convertNumToBuf(tempData, 6);

    // 모듈 후면 온도
    tempData = _.isEmpty(nodeMRT) ? 0 : _.round(nodeMRT.data, 1);
    const bufDataMRT = this.protocolConverter.convertNumToBuf(tempData, 6);

    return Buffer.concat([
      bufHeader,
      Buffer.from(deviceHex),
      bufDataWL,
      bufDataBT,
      bufDataMRT,
      this.bufDataBattery,
    ]);
  }

  /**
   * @param {detailNodeInfo} nodeInfo
   * @param {detailNodeInfo[]} nodeList
   */
  getGateValve(nodeInfo, nodeList) {
    // BU.CLI('getValve', nodeInfo)
    const bufHeader = Buffer.from([0x23, 0x30, 0x30, 0x30, 0x31, 0x30, 0x30, 0x30, 0x32]);
    const DEVICE = this.device.VALVE;
    let deviceHex;
    switch (nodeInfo.data) {
      case DEVICE.STATUS.UNDEF:
        deviceHex = [0x30, 0x30];
        break;
      case DEVICE.STATUS.CLOSE:
        deviceHex = [0x30, 0x31];
        break;
      case DEVICE.STATUS.OPEN:
        deviceHex = [0x30, 0x32];
        break;
      case DEVICE.STATUS.OPENING:
        deviceHex = [0x30, 0x34];
        break;
      case DEVICE.STATUS.CLOSING:
        deviceHex = [0x30, 0x35];
        break;
      default:
        break;
    }

    const nodeWL = _.find(nodeList, { defId: this.device.WATER_LEVEL.KEY });
    const nodeBT = _.find(nodeList, { defId: this.device.BRINE_TEMPERATURE.KEY });
    const nodeMRT = _.find(nodeList, { defId: this.device.MODULE_REAR_TEMPERATURE.KEY });

    let tempData;
    // 수위 : 200 - 현재 수위
    tempData = _.isEmpty(nodeWL) ? 200 : _.round(_.subtract(20, nodeWL.data) * 10);
    const bufDataWL = this.protocolConverter.convertNumToBuf(tempData, 3);

    // 모듈 염수 온도
    tempData = _.isEmpty(nodeBT) ? 0 : _.round(nodeBT.data, 1);
    const bufDataBT = this.protocolConverter.convertNumToBuf(tempData, 6);

    // 모듈 후면 온도
    tempData = _.isEmpty(nodeMRT) ? 0 : _.round(nodeMRT.data, 1);
    const bufDataMRT = this.protocolConverter.convertNumToBuf(tempData, 6);

    return Buffer.concat([
      bufHeader,
      Buffer.from(deviceHex),
      bufDataWL,
      bufDataBT,
      bufDataMRT,
      this.bufDataBattery,
    ]);
  }

  /**
   * @param {detailNodeInfo} nodeInfo
   * @param {detailNodeInfo[]} nodeList
   */
  getPump(nodeInfo, nodeList) {
    // BU.CLI('getValve', nodeInfo)
    const bufHeader = Buffer.from([0x23, 0x30, 0x30, 0x30, 0x31, 0x30, 0x30, 0x30, 0x33]);
    const DEVICE = this.device.PUMP;
    let deviceHex;
    switch (nodeInfo.data) {
      case DEVICE.STATUS.OFF:
        deviceHex = [0x30, 0x30];
        break;
      case DEVICE.STATUS.ON:
        deviceHex = [0x30, 0x31];
        break;
      default:
        break;
    }

    return Buffer.concat([bufHeader, Buffer.from(deviceHex), this.bufDataBattery]);
  }

  /**
   * @param {detailNodeInfo} nodeInfo
   * @param {detailNodeInfo[]} nodeList
   */
  getEarthPV(nodeInfo, nodeList) {
    // BU.CLI('getEarthPV', nodeList);
    const bufHeader = Buffer.from([0x23, 0x30, 0x30, 0x30, 0x31, 0x30, 0x30, 0x30, 0x35]);
    const deviceHex = [0x30, 0x30];

    const nodeWL = _.find(nodeList, { defId: this.device.WATER_LEVEL.KEY });
    const nodeMRTList = _.filter(nodeList, {
      defId: this.device.MODULE_REAR_TEMPERATURE.KEY,
    });

    let tempData;

    // 수위 : 200 - 현재 수위
    tempData = _.isEmpty(nodeWL) ? 200 : _.round(_.subtract(20, nodeWL.data) * 10);
    const bufDataWL = this.protocolConverter.convertNumToBuf(tempData, 3);

    // 모듈 후면 온도
    tempData = _.isEmpty(_.nth(nodeMRTList, 0))
      ? 0
      : _.round(_.nth(nodeMRTList, 0).data, 1);
    const bufDataMRT001 = this.protocolConverter.convertNumToBuf(tempData, 6);
    tempData = _.isEmpty(_.nth(nodeMRTList, 1))
      ? 0
      : _.round(_.nth(nodeMRTList, 1).data, 1);
    const bufDataMRT002 = this.protocolConverter.convertNumToBuf(tempData, 6);

    return Buffer.concat([
      bufHeader,
      Buffer.from(deviceHex),
      bufDataWL,
      bufDataMRT001,
      bufDataMRT002,
      this.bufDataBattery,
    ]);
  }

  /**
   * @param {detailNodeInfo} nodeInfo
   * @param {detailNodeInfo[]} nodeList
   */
  getGroundRelay(nodeInfo, nodeList) {
    // BU.CLI('getGroundRelay', nodeList);
    const bufHeader = Buffer.from([0x23, 0x30, 0x30, 0x30, 0x31, 0x30, 0x30, 0x30, 0x36]);

    const cgrList = ['00', '01', '10', '11'];

    return Buffer.concat([
      bufHeader,
      Buffer.from([30]),
      Buffer.from(cgrList[_.random(0, cgrList.length - 1)]),
      this.bufDataBattery,
    ]);
  }

  /**
   *
   * @param {xbeeApi_0x10} xbeeApi0x10
   */
  onData(xbeeApi0x10) {
    BU.CLI(xbeeApi0x10);
    const strData = xbeeApi0x10.toString();
    if (BU.IsJsonString(strData)) {
      const jsonData = JSON.parse(strData);
      _.forEach(jsonData, (v, k) => {
        if (_.get(v, 'type') === 'Buffer') {
          jsonData[k] = Buffer.from(v);
        }
      });
      xbeeApi0x10 = jsonData;
    }

    // this.reload();
    xbeeApi0x10 = this.peelFrameMsg(xbeeApi0x10);
    // BU.CLI(this.nodeList)

    const foundDataLogger = this.findDataLogger(xbeeApi0x10.destination64);

    if (_.isEmpty(foundDataLogger)) {
      return;
    }

    // BU.CLI(foundDataLogger.nodeList)
    const foundNodeList = foundDataLogger.nodeList.map(nodeId =>
      _.find(this.nodeList, { nodeId }),
    );
    // BU.CLI(foundNodeList);

    let findDevice;
    let dataLoggerData;
    // 찾은 데이터로거 접두사로 판별
    switch (foundDataLogger.prefix) {
      case 'D_G':
        findDevice = _.find(foundNodeList, { defId: this.device.WATER_DOOR.KEY });
        this.controlWaterDoor(xbeeApi0x10.data, findDevice);
        dataLoggerData = this.getWaterDoor(findDevice, foundNodeList);
        break;
      case 'D_V':
        findDevice = _.find(foundNodeList, { defId: this.device.VALVE.KEY });
        this.controlValve(xbeeApi0x10.data, findDevice);
        dataLoggerData = this.getValve(findDevice, foundNodeList);
        break;
      case 'D_GV':
        findDevice = _.find(foundNodeList, { defId: this.device.GATE_VALVE.KEY });
        this.controlValve(xbeeApi0x10.data, findDevice);
        dataLoggerData = this.getGateValve(findDevice, foundNodeList);
        break;
      case 'D_P':
        findDevice = _.find(foundNodeList, { defId: this.device.PUMP.KEY });
        this.controlPump(xbeeApi0x10.data, findDevice);
        dataLoggerData = this.getPump(findDevice, foundNodeList);
        break;
      case 'D_EP':
        dataLoggerData = this.getEarthPV(findDevice, foundNodeList);
        break;
      case 'D_GR':
        dataLoggerData = this.getGroundRelay(findDevice, foundNodeList);
        // BU.CLI(dataLoggerData);
        break;
      default:
        break;
    }

    // BU.CLI('dataLoggerData', dataLoggerData);
    dataLoggerData = this.wrapFrameMsg(dataLoggerData);
    // BU.CLI('dataLoggerData', dataLoggerData)

    /** @type {xbeeApi_0x8B} */
    const returnValue = {
      remote64: xbeeApi0x10.destination64,
      type: 0x90,
      data: dataLoggerData,
    };

    // BU.CLI(returnValue);

    return returnValue;
  }
}
module.exports = EchoServer;
