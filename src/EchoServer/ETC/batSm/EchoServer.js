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
  getBattery(dlInfo) {
    // BU.CLI('getBattery');
    const dlNodeList = this.nodeList.filter(node => {
      return dlInfo.nodeList.includes(node.nodeId);
    });

    const nodeInfo = dlNodeList.find(node => node.classId === 'battery');

    /** @type {number} */
    const nData = nodeInfo.data;

    let exp = 3;
    // const exp = nData >= 100 ? 1 : nData >= 10 ? 2 : 3;

    if (nData >= 100) {
      exp = 1;
    } else if (nData >= 10) {
      exp = 2;
    } else {
      exp = 3;
    }

    let battery = _.chain(nData)
      .multiply(10 ** exp)
      .round()
      .thru(cData => {
        const arrData = cData.toString().split('');
        arrData.splice(4 - exp, 0, '.');
        return arrData;
      })
      .join('')
      .value();

    if (_.toNumber(battery) <= 0) {
      BU.logFile(nData);
      BU.CLI(battery, nData);
      battery = '0.000';
    }

    return Buffer.concat([
      this.protocolConverter.STX,
      Buffer.from(battery),
      this.protocolConverter.ETX,
    ]);
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
      if (deviceData.length !== 3) {
        throw new Error('길이가 맞지 않습니다.');
      }

      const strDeviceData = deviceData.toString();

      const cmd = strDeviceData.slice(1, 2);

      const dlInfo = _.find(this.dataLoggerList, { prefix: 'D_B_P' });

      if (dlInfo === undefined) {
        throw new Error('데이터로거 정보 없음');
      }

      let returnValue;
      switch (cmd) {
        case 'M':
          returnValue = this.getBattery(dlInfo);
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
