const Model = require('../Model');

const ModbusRtuConverter = require('../../Default/Converter/ModbusRtuConverter');

class EchoServer extends ModbusRtuConverter {
  /**
   * @param {protocol_info} protocolInfo
   * @param {mDeviceMap} deviceMap
   */
  constructor(protocolInfo, deviceMap) {
    super(protocolInfo);

    this.model = new Model(protocolInfo, deviceMap);

    this.init(this.model);
  }
}
module.exports = EchoServer;
