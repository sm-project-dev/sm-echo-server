const _ = require('lodash');

const { BU } = require('base-util-jh');

const Model = require('../Model');

const protocol = require('./protocol');

const ModbusRtuConverter = require('../../Default/ModbusRtuConverter');

class EchoServer extends Model {
  /**
   * protocol_info.option --> true: 3.3kW, any: 600W
   * @param {protocol_info} protocolInfo
   * @param {mDeviceMap} deviceMap
   */
  constructor(protocolInfo, deviceMap) {
    super(protocolInfo, deviceMap);

    this.decodingTable = protocol(this.protocolInfo);

    this.init();

    this.isExistCrc = false;
    this.name = 2;
    this.modbusRtuConverter = new ModbusRtuConverter(this);
  }

  /**
   *
   * @param {dataLoggerInfo} dataLogger
   * @param {Buffer} bufData
   */
  readInputRegister(dataLogger, bufData) {
    // BU.CLI('readInputRegister');
    /** @type {decodingProtocolInfo} */
    let decodingTable;
    // NOTE: 모듈 후면 온도, 경사 일사량이 붙어 있는 로거
    const outsideTableList = [9, 24];
    // NOTE: 모듈 하부 일사량이 붙어 있는 로거
    const insideTableList = [1, 2, 3, 4];
    // NOTE: 마이크로 인버터 센서군
    const microTableList = [5, 6, 7, 8];
    // 장치 addr
    const numDeviceId = bufData.readIntBE(0, 1);

    if (_.includes(outsideTableList, numDeviceId)) {
      decodingTable = this.decodingTable.OUTSIDE_SITE;
    } else if (_.includes(insideTableList, numDeviceId)) {
      decodingTable = this.decodingTable.INSIDE_SITE;
    } else if (_.includes(microTableList, numDeviceId)) {
      decodingTable = this.decodingTable.MICRO_SITE;
    } else {
      decodingTable = this.decodingTable.INSIDE_SITE;
    }

    return this.modbusRtuConverter.readInputRegister(dataLogger, bufData, decodingTable);
  }

  /**
   * DBS에서 요청한 명령
   * @param {Buffer} bufData
   */
  onData(bufData) {
    return this.modbusRtuConverter.onData(bufData);
  }
}
module.exports = EchoServer;
