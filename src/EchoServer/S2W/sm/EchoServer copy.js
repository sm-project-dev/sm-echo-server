const _ = require('lodash');

const { BU } = require('base-util-jh');

const Model = require('../Model');

const protocol = require('./protocol');

const DefaultConverter = require('../../Default/Converter/DefaultConverter');
// const XbeeConverter = require('../../Default/Converter/XbeeConverter');

class EchoServer extends DefaultConverter {
  /**
   * protocol_info.option --> true: 3.3kW, any: 600W
   * @param {protocol_info} protocolInfo
   * @param {mDeviceMap} deviceMap
   */
  constructor(protocolInfo, deviceMap) {
    super(protocolInfo, deviceMap);

    this.model = new Model(protocolInfo, deviceMap);

    this.decodingTable = protocol(this.protocolInfo);

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
      .sort((prevNode, nextNode) => prevNode.dlIdx - nextNode.dlIdx)
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
      Buffer.from('M'),
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
    const nodeIndex = Number(rfData.slice(4, 6)) - 1;

    const nodeInfo = this.nodeList
      .filter(node => dlInfo.nodeList.includes(node.nodeId))
      .sort((prevNode, nextNode) => prevNode.dlIdx - nextNode.dlIdx)
      .find(node => node.dlIdx === nodeIndex);

    // 요청 명령이 닫는 명령이라면
    if (realCmd === '@crc') {
      this.controlDevice(nodeInfo, CLOSE);
    } else if (realCmd === '@cro') {
      this.controlDevice(nodeInfo, OPEN);
    }
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
    const nodeIndex = Number(rfData.slice(4, 6)) - 1;

    const nodeInfo = this.nodeList
      .filter(node => dlInfo.nodeList.includes(node.nodeId))
      .sort((prevNode, nextNode) => prevNode.dIdx - nextNode.dIdx)
      .find(node => node.dIdx === nodeIndex);

    // 요청 명령이 닫는 명령이라면
    if (realCmd === '@crc') {
      this.controlDevice(nodeInfo, OFF);
    } else if (realCmd === '@cro') {
      this.controlDevice(nodeInfo, ON);
    }
  }

  /**
   * Zigbee Receive Packet
   * @param {dataLoggerInfo} dataLogger
   * @param {Buffer} xbeeFrame
   */
  processTransmitRequest(dataLogger, xbeeFrame) {
    const SPEC_DATA_IDX = 17;
    const CRC_IDX = xbeeFrame.length - 1;

    const rfData = xbeeFrame.slice(SPEC_DATA_IDX, CRC_IDX).toString();

    const { prefix } = dataLogger;

    switch (prefix) {
      // 개폐기
      case 'D_ST':
        this.controlShutter(rfData, dataLogger);
        return this.getShutter(dataLogger);
      // 펌프
      case 'D_P':
        this.controlPump(rfData, dataLogger);
        return this.getPump(dataLogger);
      default:
        break;
    }
  }
}
module.exports = EchoServer;
