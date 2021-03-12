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

    // 배터리 고정(중요하지 않음)
    this.bufDataBattery = Buffer.from([0x31, 0x30, 0x2e, 0x32]);
  }

  /**
   * @param {detailDataloggerInfo} dlInfo
   */
  getShutter(dlInfo) {
    const bufHeader = Buffer.from([0x23, 0x30, 0x30, 0x30, 0x31, 0x30, 0x30, 0x31, 0x32]);
    const {
      STATUS: { CLOSE, OPEN },
    } = this.device.SHUTTER;

    const dlNodeList = this.nodeList.filter(node => {
      return dlInfo.nodeList.includes(node.nodeId);
    });

    // dlNodeList.find(nodeInfo => nodeInfo)

    // FIXME: index에 맞는 장치가 정확히 세팅되어 있다고 가정함
    const shutterDataList = dlNodeList
      .filter(node => node.classId === 'shutter')
      .sort((prevNode, nextNode) => prevNode.dIdx - nextNode.dIdx)
      .reduce((results, node, index) => {
        let deviceStatus;
        switch (node.data) {
          case CLOSE:
            deviceStatus = '0';
            break;
          case OPEN:
            deviceStatus = '1';
            break;
          default:
            deviceStatus = '0';
            break;
        }

        results.write(deviceStatus, index);

        return results;
      }, Buffer.alloc(16, '0'));

    return Buffer.concat([
      bufHeader,
      this.bufDataBattery,
      Buffer.from('A'),
      shutterDataList,
    ]);
  }

  /**
   * @param {detailDataloggerInfo} dlInfo
   */
  getPump(dlInfo) {
    // BU.CLIN(dlInfo);
    const bufHeader = Buffer.from([0x23, 0x30, 0x30, 0x30, 0x31, 0x30, 0x30, 0x31, 0x31]);
    const {
      PUMP: {
        STATUS: { OFF, ON },
      },
      VALVE: {
        STATUS: { CLOSE, OPEN },
      },
    } = this.device;

    // FIXME: index에 맞는 장치가 정확히 세팅되어 있다고 가정함
    const pumpDataList = this.nodeList
      .filter(node => {
        const { nodeId, classId } = node;
        return dlInfo.nodeList.includes(nodeId) && ['pump', 'valve'].includes(classId);
      })
      .sort((prevNode, nextNode) => prevNode.dIdx - nextNode.dIdx)
      .reduce((results, node, index) => {
        let deviceStatus;
        switch (node.data) {
          case OFF:
          case CLOSE:
            deviceStatus = '0';
            break;
          case ON:
          case OPEN:
            deviceStatus = '1';
            break;
          default:
            deviceStatus = '0';
            break;
        }

        results.write(deviceStatus, index);

        return results;
      }, Buffer.alloc(5, '0'));

    return Buffer.concat([
      bufHeader,
      this.bufDataBattery,
      Buffer.from('A'),
      pumpDataList,
    ]);
  }

  /**
   *
   * @param {string} rfData 제어 명령
   * @param {detailDataloggerInfo} dlInfo
   */
  controlShutter(rfData, dlInfo) {
    const {
      STATUS: { CLOSE, OPEN },
    } = this.device.SHUTTER;

    const realCmd = rfData.slice(0, 4);
    const nodeIndex = Number(rfData.slice(4, 6));

    const nodeInfo = this.nodeList
      .filter(node => dlInfo.nodeList.includes(node.nodeId))
      .sort((prevNode, nextNode) => prevNode.dIdx - nextNode.dIdx)
      .find(node => node.dIdx === nodeIndex);

    // 요청 명령이 닫는 명령이라면
    if (realCmd === '@crc') {
      this.controlDevice(nodeInfo, CLOSE);
    } else if (realCmd === '@cro') {
      this.controlDevice(nodeInfo, OPEN);
    }

    return this.getShutter(dlInfo);
  }

  /**
   *
   * @param {string} rfData 제어 명령
   * @param {detailDataloggerInfo} dlInfo
   */
  controlPump(rfData, dlInfo) {
    // BU.CLIN(this.device);
    const {
      STATUS: { OFF, ON },
    } = this.device.PUMP;

    const realCmd = rfData.slice(0, 4);
    const nodeIndex = Number(rfData.slice(4, 6));

    const nodeInfo = this.nodeList
      .filter(node => dlInfo.nodeList.includes(node.nodeId))
      .sort((prevNode, nextNode) => prevNode.dIdx - nextNode.dIdx)
      .find(node => node.dIdx === nodeIndex);

    // 요청 명령이 닫는 명령이라면
    if (realCmd === '@cpc') {
      this.controlDevice(nodeInfo, OFF);
    } else if (realCmd === '@cpo') {
      this.controlDevice(nodeInfo, ON);
    }

    return this.getPump(dlInfo);
  }

  /**
   * DBS에서 요청한 명령
   * @param {Buffer} bufData
   */
  onData(bufData) {
    // WrappingFrame 제거 (없으면 제거하지 않고 그대로 반환)
    const deviceData = this.peelFrameMsg(bufData);

    try {
      const STX = _.nth(deviceData, 0);

      if (STX !== 0x40) {
        throw new Error('STX가 일치하지 않습니다.');
      }

      const strDeviceData = deviceData.toString();

      const cmd = strDeviceData.slice(0, 4);

      let dlInfo;

      switch (cmd) {
        case '@srs':
        case '@cro':
        case '@crc':
          dlInfo = _.find(this.dataLoggerList, { serialNumber: '0013A2004190ED67' });
          break;
        case '@sts':
        case '@cpo':
        case '@cpc':
          dlInfo = _.find(this.dataLoggerList, { serialNumber: '0013A2004190EDB7' });
          break;
        default:
          break;
      }

      if (dlInfo === undefined) {
        throw new Error('데이터로거 정보 없음');
      }

      let returnValue;
      switch (cmd) {
        case '@srs':
          returnValue = this.getShutter(dlInfo);
          break;
        case '@cro':
        case '@crc':
          returnValue = this.controlShutter(strDeviceData, dlInfo);
          break;
        case '@sts':
          returnValue = this.getPump(dlInfo);
          break;
        case '@cpo':
        case '@cpc':
          returnValue = this.controlPump(strDeviceData, dlInfo);
          break;
        default:
          throw new Error(`cmd: ${cmd}은 Parsing 대상이 아닙니다.`);
      }

      returnValue = this.wrapFrameMsg(returnValue);

      return returnValue;
    } catch (error) {
      // BU.error(error.message);
    }
  }
}
module.exports = EchoServer;
