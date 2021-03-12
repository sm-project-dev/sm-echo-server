const _ = require('lodash');

const { BU } = require('base-util-jh');

const Model = require('../Model');

const { dpc } = require('../../../module');

const { MainConverter } = dpc;

class EchoServer {
  /**
   * protocol_info.option --> true: 3.3kW, any: 600W
   * @param {protocol_info} protocolInfo
   * @param {mDeviceMap} deviceMap
   */
  constructor(protocolInfo, deviceMap) {
    // super(protocolInfo, deviceMap);
    // this.init();

    this.rtd0 = 1;
    this.rtd1 = 10;
    this.rtd2 = 100;

    this.counting = 0;
  }

  /**
   *
   * @param {Buffer} bufData
   */
  onData(bufData) {
    const strData = bufData.toString();

    let returnBuffer;
    if (strData === '21 get rtd\r') {
      this.counting += 1;
      if (this.counting > 3) {
        this.rtd0 = 100;
        this.rtd1 = 200;
        this.rtd2 = 300;
      }
      // this.rtd0 += 0.1;
      // this.rtd1 += 1;
      // this.rtd2 += 10;
      returnBuffer = Buffer.from(
        `: 21 rtd0 ${this.rtd0} rtd1 ${this.rtd1} rtd2 ${this.rtd2} rtd3 1000.0 \r`,
      );
    }

    // Wrapping 처리
    return returnBuffer;
  }
}
module.exports = EchoServer;
