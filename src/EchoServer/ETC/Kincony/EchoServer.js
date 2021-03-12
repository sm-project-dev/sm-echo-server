const _ = require('lodash');

const { BU } = require('base-util-jh');

const Model = require('../Model');

const DefaultConverter = require('../../Default/Converter/DefaultConverter');

class EchoServer extends DefaultConverter {
  /**
   * protocol_info.option --> true: 3.3kW, any: 600W
   * @param {protocol_info} protocolInfo
   * @param {mDeviceMap} deviceMap
   */
  constructor(protocolInfo, deviceMap) {
    super(protocolInfo, deviceMap);

    this.model = new Model(protocolInfo, deviceMap);
    this.init(this.model);

    this.device = this.model.device;
  }

  /**
   * @param {detailDataloggerInfo} dlInfo
   */
  getRelay(dlInfo) {
    const {
      STATUS: { OFF, ON },
    } = this.device.RELAY;

    const dlNodeList = this.nodeList.filter(node => {
      return dlInfo.nodeList.includes(node.nodeId);
    });

    const relayDataList = dlNodeList
      .filter(node => node.classId === 'relay')
      .reduce((results, nodeInfo) => {
        const { dlIdx, data } = nodeInfo;

        let deviceStatus;
        switch (data) {
          case OFF:
            deviceStatus = '0';
            break;
          case ON:
            deviceStatus = '1';
            break;
          default:
            deviceStatus = '0';
            break;
        }

        results[dlIdx] = deviceStatus;

        return results;
      }, []);

    return this.protocolConverter.convertBitArrayToData(relayDataList);
  }

  /**
   *
   * @param {string} dataBody 제어 명령
   * @param {detailDataloggerInfo} dlInfo
   */
  controlRelay(dataBody, dlInfo) {
    const {
      STATUS: { OFF, ON },
    } = this.device.RELAY;

    const [protocolId, ch, cmd] = dataBody.split(',');

    const nodeInfo = this.nodeList
      .filter(node => dlInfo.nodeList.includes(node.nodeId))
      .find(node => node.dIdx === Number(ch));

    // 요청 명령이 닫는 명령이라면
    if (cmd === '1') {
      this.controlDevice(nodeInfo, ON);
    } else if (cmd === '0') {
      this.controlDevice(nodeInfo, OFF);
    } else {
      throw new Error(`does not found cmd: ${cmd}`);
    }
  }

  /**
   * DBS에서 요청한 명령
   * @param {Buffer} bufData
   * @param {Control} controller
   */
  onData(bufData, controller) {
    // BU.log(bufData);
    const deviceData = this.peelFrameMsg(bufData);
    // BU.log(deviceData.toString());

    try {
      const strDeviceData = deviceData.toString();

      const [stx, cmdCode, body] = strDeviceData.split('-');

      const dlInfo = _.find(this.dataLoggerList, { dataLoggerId: 'D_KIN_001' });

      if (dlInfo === undefined) {
        throw new Error('데이터로거 정보 없음');
      }

      let reqResult = '';
      let returnValue = bufData;

      switch (cmdCode) {
        // 전체 제어
        case 'SET_ALL':
          break;
        // 개별 제어
        case 'SET':
          this.controlRelay(body, dlInfo);
          break;
        // 계측
        case 'STATE':
          [reqResult] = this.getRelay(dlInfo);
          break;

        default:
          throw new Error(`cmdCode does not match. ${cmdCode}`);
      }

      // 반환할 데이터가 있다면 붙임
      if (typeof reqResult === 'number') {
        returnValue = Buffer.concat([returnValue, Buffer.from(`,${reqResult}`)]);
      }
      // Delimeter 삽입
      returnValue = Buffer.concat([returnValue, Buffer.from(',OK\u0000')]);

      returnValue = this.wrapFrameMsg(returnValue);

      return returnValue;
    } catch (error) {
      // BU.error(error);
    }
  }
}
module.exports = EchoServer;
