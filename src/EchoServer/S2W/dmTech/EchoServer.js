const _ = require('lodash');

const { BU } = require('base-util-jh');

const Model = require('../Model');

const { dpc } = require('../../../module');

const protocol = require('./protocol');

class EchoServer extends Model {
  /**
   * protocol_info.option --> true: 3.3kW, any: 600W
   * @param {protocol_info} protocolInfo
   * @param {mDeviceMap} deviceMap
   */
  constructor(protocolInfo, deviceMap) {
    super(protocolInfo, deviceMap);

    this.decodingTable = protocol(this.protocolInfo);

    this.initModel();
  }

  /**
   *
   * @param {dataLoggerInfo} dataLogger
   * @param {Buffer} bufData
   */
  readInputRegister(dataLogger, bufData) {
    // BU.CLI('readInputRegister');
    const slaveAddr = bufData.readIntBE(0, 1);
    const registerAddr = bufData.readInt16BE(2);
    const dataLength = bufData.readInt16BE(4);

    /** @type {detailNodeInfo[]} */
    const foundNodeList = dataLogger.nodeList.map(nodeId =>
      _.find(this.nodeList, { nodeId }),
    );

    let decodingTable;
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

    let calcData;
    const dataLoggerData = decodingTable.decodingDataList.map(decodingInfo => {
      const nodeInfo = _.find(foundNodeList, { defId: decodingInfo.key });
      if (_.isUndefined(nodeInfo)) {
        return 0;
      }
      calcData = nodeInfo.data;
      if (_.isNumber(decodingInfo.scale)) {
        calcData = _.round(_.divide(calcData, decodingInfo.scale));
      } else {
        calcData = _.round(calcData);
      }

      return calcData;
    });
    return dataLoggerData.slice(registerAddr, _.sum([registerAddr, dataLength]));
  }

  /**
   *
   * @param {Buffer} bufData
   */
  onData(bufData) {
    // Frame을 쓴다면 벗겨냄
    const convertedBufData = this.peelFrameMsg(bufData);
    const slaveAddr = convertedBufData.readIntBE(0, 1);
    const fnCode = convertedBufData.readIntBE(1, 1);

    try {
      let dataList;

      // slaveAddr를 기준으로 dataLogger 찾음
      const foundDataLogger = this.findDataLogger(slaveAddr);

      if (_.isUndefined(foundDataLogger)) {
        return;
      }

      switch (fnCode) {
        case 4:
          dataList = this.readInputRegister(foundDataLogger, convertedBufData);
          break;

        default:
          break;
      }

      // 데이터가 없으면 반환
      if (_.isEmpty(dataList)) return undefined;

      // Modbus Header 구성
      const mbapHeader = Buffer.concat([
        Buffer.from([slaveAddr, fnCode]),
        this.protocolConverter.convertNumToStrToBuf(dataList.length * 2, {
          byteLength: 1,
        }),
      ]);

      // 장치 데이터 Hi-Lo 형태로 변환
      const bufferDataList = dataList.map(data =>
        this.protocolConverter.convertNumToStrToBuf(data, {
          byteLength: 2,
        }),
      );

      // MBAP Header 붙임
      bufferDataList.unshift(mbapHeader);

      // Wrapping 처리
      const returnBuffer = this.wrapFrameMsg(Buffer.concat(bufferDataList));
      return returnBuffer;
    } catch (error) {
      BU.CLI(slaveAddr, convertedBufData);
      throw error;
    }
  }
}
module.exports = EchoServer;
