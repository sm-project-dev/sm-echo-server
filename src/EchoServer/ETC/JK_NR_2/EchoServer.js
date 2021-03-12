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

    // FIXME: index에 맞는 장치가 정확히 세팅되어 있다고 가정함
    const relayDataList = dlNodeList
      .filter(node => node.classId === 'relay')
      // .sort((prevNode, nextNode) => prevNode.dIdx - nextNode.dIdx)
      .reduce((results, nodeInfo) => {
        const { dIdx, dlIdx, data } = nodeInfo;

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

        results.write(deviceStatus, dlIdx);

        return results;
      }, Buffer.alloc(8, '0'));

    return relayDataList;
  }

  /**
   *
   * @param {string} data 제어 명령
   * @param {detailDataloggerInfo} dlInfo
   */
  controlRelay(data, dlInfo) {
    const {
      STATUS: { OFF, ON },
    } = this.device.RELAY;

    const cmd = data.slice(0, 1);
    const ch = Number(data.slice(1, 2));

    const nodeInfo = this.nodeList
      .filter(node => dlInfo.nodeList.includes(node.nodeId))
      .find(node => node.dIdx === ch);

    // 요청 명령이 닫는 명령이라면
    if (cmd === '1') {
      this.controlDevice(nodeInfo, ON);
    } else if (cmd === '2') {
      this.controlDevice(nodeInfo, OFF);
    }

    return this.getRelay(dlInfo);
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
      // 에코 서버는
      if (deviceData.length !== 2) {
        throw new Error('길이가 맞지 않습니다.');
      }

      const strDeviceData = deviceData.toString();

      const cmd = strDeviceData.slice(0, 1);

      let dlInfo;

      if (controller.siteId === 'relay_1') {
        dlInfo = _.find(this.dataLoggerList, { dataLoggerId: 'D_JK_001' });
      } else if (controller.siteId === 'relay_2') {
        dlInfo = _.find(this.dataLoggerList, { dataLoggerId: 'D_JK_002' });
      }

      if (dlInfo === undefined) {
        throw new Error('데이터로거 정보 없음');
      }

      let returnValue;
      switch (cmd) {
        case '0':
          returnValue = this.getRelay(dlInfo);
          break;
        case '1':
        case '2':
          returnValue = this.controlRelay(strDeviceData, dlInfo);
          break;
        default:
          throw new Error(`cmd: ${cmd}은 Parsing 대상이 아닙니다.`);
      }

      returnValue = this.wrapFrameMsg(returnValue);
      // BU.CLI(returnValue);

      return returnValue;
    } catch (error) {
      // BU.error(error);
    }
  }
}
module.exports = EchoServer;
