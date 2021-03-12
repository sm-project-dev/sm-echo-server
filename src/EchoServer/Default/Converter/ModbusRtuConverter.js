const _ = require('lodash');
const { BU } = require('base-util-jh');

const DefaultConverter = require('./DefaultConverter');

module.exports = class extends DefaultConverter {
  /**
   * @param {protocol_info} protocolInfo
   */
  constructor(protocolInfo) {
    super();
    // 국번은 숫자로 변환하여 저장함.
    const { deviceId } = protocolInfo;
    if (Buffer.isBuffer(deviceId)) {
      protocolInfo.deviceId = deviceId.readInt8();
    } else if (_.isNumber(deviceId)) {
      protocolInfo.deviceId = deviceId;
    } else if (_.isString(deviceId)) {
      protocolInfo.deviceId = Buffer.from(deviceId).readInt8();
    }
  }

  /**
   * FnCode 01, Read Coil. 순수 Spec Data 반환
   * @param {dataLoggerInfo} dataLogger
   * @param {Buffer} bufData
   */
  readCoil(dataLogger, bufData) {
    const slaveAddr = bufData.readIntBE(0, 1);
    const fnCode = bufData.readIntBE(1, 1);
    const registerAddr = bufData.readInt16BE(2);
    const dataLength = bufData.readInt16BE(4);

    // Modbus Header
    const header = Buffer.concat([
      this.protocolConverter.convertNumToWriteInt(slaveAddr),
      this.protocolConverter.convertNumToWriteInt(fnCode),
    ]);

    // 요청한 데이터 길이만큼 배열 생성
    const dataList = Array(dataLength).fill(0);

    const { modbusStorage } = dataLogger;
    // 정의한 배열을 순회하면서 모드버스 저장소에 있는 coil 데이터를 추출하여 정의
    dataList.forEach((v, index) => {
      const targetIndex = 1 + registerAddr + index;
      const { data } = modbusStorage[targetIndex];

      dataList[index] = Number(data) ? 1 : 0;
    });

    const dataBuffer = Buffer.from(
      this.protocolConverter.convertBitArrayToData(dataList, 8),
    );

    let command = Buffer.concat([header, Buffer.alloc(1, dataBuffer.length), dataBuffer]);

    // CRC 생성
    if (this.isExistCrc) {
      const crcBuf = this.protocolConverter.getModbusChecksum(command);
      command = Buffer.concat([command, crcBuf]);
    }

    return command;
  }

  /**
   * FnCode 4
   * @param {detailDataloggerInfo} dataLogger
   * @param {Buffer} bufData
   */
  readInputRegister(dataLogger, bufData) {
    const slaveAddr = bufData.readIntBE(0, 1);
    const fnCode = bufData.readIntBE(1, 1);
    const registerAddr = bufData.readInt16BE(2);
    const dataLength = bufData.readInt16BE(4);

    // FC: 03 > 40001, FC: 04 > 30001
    const startRegisterAddr = fnCode === 3 ? 40001 : 30001;

    let currIndex = 0;

    // Modbus Header
    const header = Buffer.concat([
      this.protocolConverter.convertNumToWriteInt(slaveAddr),
      this.protocolConverter.convertNumToWriteInt(fnCode),
    ]);
    // 데이터 길이는 요청 길이의 2배
    const dataBuffer = Buffer.alloc(dataLength * 2, 0);

    const { modbusStorage } = dataLogger;

    // 시작주소로부터 길이만큼의 데이터를 추출
    while (currIndex < dataLength) {
      const targetIndex = startRegisterAddr + registerAddr + currIndex;
      const { data, modbusInfo: { dataLength: dLength = 1 } = {} } = modbusStorage[
        targetIndex
      ];

      // console.log(nodeId, data, targetIndex);
      // FIXME: modbusStorage 추가 속성에 따라서 분기할 수 있는 로직 필요시 수정
      if (dLength === 1) {
        dataBuffer.writeInt16BE(data, currIndex * 2);
        currIndex += 1;
      } else if (dLength === 2) {
        dataBuffer.writeFloatBE(data, currIndex * 2);
        currIndex += 2;
      }
    }

    let command = Buffer.concat([header, Buffer.alloc(1, dataBuffer.length), dataBuffer]);

    // CRC 생성
    if (this.isExistCrc) {
      const crcBuf = this.protocolConverter.getModbusChecksum(command);
      command = Buffer.concat([command, crcBuf]);
    }

    return command;
  }

  /**
   *
   * @param {Buffer} bufData
   */
  onData(bufData) {
    // Frame을 쓴다면 벗겨냄
    const originalBufData = this.peelFrameMsg(bufData);
    const slaveAddr = originalBufData.readIntBE(0, 1);
    const fnCode = originalBufData.readIntBE(1, 1);

    /** @type {Buffer} */
    let deviceData;

    // slaveAddr를 기준으로 dataLogger 찾음
    const foundDataLogger = this.findDataLogger(slaveAddr);

    if (_.isUndefined(foundDataLogger)) {
      return;
    }

    switch (fnCode) {
      case 1: // Read Coil Status (FC=01)
        deviceData = this.readCoil(foundDataLogger, originalBufData);
        break;
      case 3: // Read Holding Registers (FC=03)
      case 4: // Read Input Registers (FC=04)
        deviceData = this.readInputRegister(foundDataLogger, originalBufData);
        break;
      default:
        break;
    }

    // 데이터가 없으면 반환
    if (_.isEmpty(deviceData)) return undefined;

    // Wrapping 처리
    const returnBuffer = this.wrapFrameMsg(deviceData);

    return returnBuffer;
  }
};
