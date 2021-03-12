/* eslint-disable no-nested-ternary */
const _ = require('lodash');

const { BU } = require('base-util-jh');

const Model = require('../Model');

const {
  di: {
    dcmConfigModel: { reqDeviceControlType: reqDCT },
  },
} = require('../../../module');

class EchoServer extends Model {
  /**
   * protocol_info.option --> true: 3.3kW, any: 600W
   * @param {protocol_info} protocolInfo
   * @param {mDeviceMap} deviceMap
   */
  constructor(protocolInfo, deviceMap) {
    super(protocolInfo, deviceMap);

    this.initSetNode();

    this.bufDataBattery = Buffer.from([0x31, 0x30, 0x2e, 0x32]);

    this.normalDeviceOperTime = 30;
    this.pumpValveOperTime = 0;
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
        default:
          break;
      }
    });
  }

  /**
   * 수문 제어 요청이 들어왔을 경우
   * @param {detailNodeInfo} nodeInfo
   * @param {*} newData
   */
  controlDevice(nodeInfo, newData) {
    nodeInfo.data = newData;
    this.emitReload();
  }

  /**
   * 수문 제어 요청이 들어왔을 경우
   * @param {string} execCmd
   * @param {detailNodeInfo} nodeInfo
   */
  controlWaterDoor(execCmd, nodeInfo) {
    const { COMMAND, STATUS } = this.device.WATER_DOOR;

    // 여는 명령과 닫는 명령은 1번째에 있음
    const { cmd: cmdClose } = COMMAND[reqDCT.FALSE][0];
    const { cmd: cmdOpen } = COMMAND[reqDCT.TRUE][0];

    const {
      STATUS: { CLOSE, CLOSING, OPEN, OPENING },
    } = this.device.WATER_DOOR;

    // 요청 명령이 닫는 명령이라면
    if (execCmd === cmdClose) {
      // 현재 상태가 열려있는 상태라면
      if (nodeInfo.data === OPEN) {
        // 닫는 상태로 변경
        this.controlDevice(nodeInfo, CLOSING);
        setTimeout(() => {
          this.controlDevice(nodeInfo, CLOSE);
        }, this.normalDeviceOperTime);
      }
    } else if (execCmd === cmdOpen) {
      // 현재 상태가 닫혀있다면
      if (nodeInfo.data === STATUS.CLOSE) {
        // 여는 상태로 변경
        // BU.CLI('여는 상태로 변경');
        this.controlDevice(nodeInfo, OPENING);
        setTimeout(() => {
          // BU.CLI('열림');
          this.controlDevice(nodeInfo, OPEN);
        }, this.normalDeviceOperTime);
      }
    }
  }

  /**
   * 게이트 밸브 제어 요청이 들어왔을 경우
   * @param {string} execCmd
   * @param {detailNodeInfo} nodeInfo
   */
  controlGateValve(execCmd, nodeInfo) {
    const {
      COMMAND,
      STATUS: { OPEN, CLOSE },
    } = this.device.VALVE;

    // 여는 명령과 닫는 명령은 1번째에 있음
    const { cmd: cmdClose } = COMMAND[reqDCT.FALSE][0];
    const { cmd: cmdOpen } = COMMAND[reqDCT.TRUE][0];

    // 요청 명령이 닫는 명령이라면
    if (execCmd === cmdClose) {
      this.controlDevice(nodeInfo, CLOSE);
    } else if (execCmd === cmdOpen) {
      this.controlDevice(nodeInfo, OPEN);
    }
  }

  /**
   * 펌프 제어 요청이 들어왔을 경우
   * @param {string} execCmd
   * @param {detailNodeInfo} nodeInfo
   */
  controlPump(execCmd, nodeInfo) {
    const {
      COMMAND,
      STATUS: { OFF, ON },
    } = this.device.PUMP;

    // 여는 명령과 닫는 명령은 1번째에 있음
    const { cmd: cmdOff } = COMMAND[reqDCT.FALSE][0];
    const { cmd: cmdOn } = COMMAND[reqDCT.TRUE][0];

    // 요청 명령이 닫는 명령이라면
    if (execCmd === cmdOff) {
      this.controlDevice(nodeInfo, OFF);
    } else if (execCmd === cmdOn) {
      this.controlDevice(nodeInfo, ON);
    }
  }

  /**
   * 수문 데이터 로거 정보 추출
   * @param {detailNodeInfo} nodeInfo
   */
  getWaterDoor(nodeInfo) {
    const bufHeader = Buffer.from('#00010001');

    const DEVICE = this.device.WATER_DOOR;
    let deviceHex;
    switch (nodeInfo.data) {
      case DEVICE.STATUS.OPEN:
        deviceHex = '02';
        break;
      case DEVICE.STATUS.CLOSING:
        deviceHex = '03';
        break;
      case DEVICE.STATUS.CLOSE:
        deviceHex = '04';
        break;
      case DEVICE.STATUS.OPENING:
        deviceHex = '05';
        break;
      default:
        break;
    }

    return Buffer.concat([bufHeader, Buffer.from(deviceHex), this.bufDataBattery]);
  }

  /**
   * 수문형 밸브 데이터 로거 데이터 추출
   * @param {detailNodeInfo} nodeInfo
   */
  getGateValve(nodeInfo) {
    const bufHeader = Buffer.from('#00010002');
    const {
      STATUS: { OPEN, CLOSE },
    } = this.device.VALVE;

    let deviceHex;
    switch (nodeInfo.data) {
      case CLOSE:
        deviceHex = '00';
        break;
      case OPEN:
        deviceHex = '01';
        break;
      default:
        break;
    }

    return Buffer.concat([bufHeader, Buffer.from(deviceHex), this.bufDataBattery]);
  }

  /**
   * 펌프 데이터 로거 데이터 추출
   * @param {detailNodeInfo} nodeInfo
   */
  getPump(nodeInfo) {
    const bufHeader = Buffer.from('#00010003');
    const {
      STATUS: { OFF, ON },
    } = this.device.PUMP;

    let deviceHex;
    switch (nodeInfo.data) {
      case OFF:
        deviceHex = '00';
        break;
      case ON:
        deviceHex = '01';
        break;
      default:
        break;
    }

    return Buffer.concat([bufHeader, Buffer.from(deviceHex), this.bufDataBattery]);
  }

  /**
   * DBS에서 요청한 명령
   * @param {xbeeApi_0x10} xbeeApi0x10
   */
  onData(xbeeApi0x10) {
    const strData = xbeeApi0x10.toString();
    // Socket으로 데이터가 전송되면 Buffer type === 'Buffer' 로 변환되어 전송되므로 변환
    if (BU.IsJsonString(strData)) {
      const jsonData = JSON.parse(strData);
      _.forEach(jsonData, (v, k) => {
        if (_.get(v, 'type') === 'Buffer') {
          jsonData[k] = Buffer.from(v);
        }
      });
      xbeeApi0x10 = jsonData;
    }

    // WrappingFrame 제거 (없으면 제거하지 않고 그대로 반환)
    /** @type {xbeeApi_0x10} */
    const { data: execCmd, destination64 } = this.peelFrameMsg(xbeeApi0x10);
    // 데이터 로거 찾음
    const dataLoggerInfo = this.findDataLogger(destination64);

    // 못 찾으면 undefined 반환
    if (_.isEmpty(dataLoggerInfo)) {
      return;
    }

    // 데이터로거에 물려있는 노드 목록 추출
    const dlNodeList = dataLoggerInfo.nodeList.map(nodeId =>
      _.find(this.nodeList, { nodeId }),
    );

    let nodeInfo;
    let dataLoggerData;
    // 찾은 데이터로거 접두사로 판별
    switch (dataLoggerInfo.prefix) {
      case 'D_G':
        // 데이터로거 노드 목록 중 DefId와 일치하는 노드 추출
        nodeInfo = _.find(dlNodeList, { defId: this.device.WATER_DOOR.KEY });
        // 제어 요청. 계측 명령일 경우에 처리되지 않음
        this.controlWaterDoor(execCmd, nodeInfo);
        // 데이터 계측 정보 반환
        dataLoggerData = this.getWaterDoor(nodeInfo);
        break;
      case 'D_GV':
        // 데이터로거 노드 목록 중 DefId와 일치하는 노드 추출
        nodeInfo = _.find(dlNodeList, { defId: this.device.GATE_VALVE.KEY });
        // 제어 요청. 계측 명령일 경우에 처리되지 않음
        this.controlGateValve(execCmd, nodeInfo);
        // 데이터 계측 정보 반환
        dataLoggerData = this.getGateValve(nodeInfo);
        break;
      case 'D_P':
        // 데이터로거 노드 목록 중 DefId와 일치하는 노드 추출
        nodeInfo = _.find(dlNodeList, { defId: this.device.PUMP.KEY });
        // 제어 요청. 계측 명령일 경우에 처리되지 않음
        this.controlPump(execCmd, nodeInfo);
        // 데이터 계측 정보 반환
        dataLoggerData = this.getPump(nodeInfo);
        break;
      default:
        break;
    }

    // BU.CLI('dataLoggerData', dataLoggerData);
    dataLoggerData = this.wrapFrameMsg(dataLoggerData);
    // BU.CLI('dataLoggerData', dataLoggerData)

    /** @type {xbeeApi_0x8B} */
    const returnValue = {
      remote64: destination64,
      type: 0x90,
      data: dataLoggerData,
    };

    // BU.CLI(returnValue);

    return returnValue;
  }
}
module.exports = EchoServer;
