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

    this.modelTypeInfo = {
      voltage: ['9201'],
      relay: ['9482'],
    };
  }

  /**
   *
   * @param {Buffer} deviceData
   * @param {Buffer} originalBufData
   */
  encodingData(deviceData, originalBufData) {
    deviceData = _.isString(deviceData) ? Buffer.from(deviceData) : deviceData;

    const { cDaqSerial, cDaqSlotSerial, cDaqSlotType } = this.decodingData(
      originalBufData,
    );

    const header = Buffer.from(`#${cDaqSerial}${cDaqSlotType}${cDaqSlotSerial}`);

    // checksum 제외한 요청 데이터 Packet
    let dataBody = Buffer.concat([header, deviceData]);

    const checksum = this.protocolConverter.getSumBuffer(dataBody);
    dataBody = Buffer.concat([dataBody, checksum, this.protocolConverter.EOT]);

    return dataBody;
  }

  /**
   *
   * @param {Buffer} originalBufData
   */
  decodingData(originalBufData) {
    const deviceData = originalBufData.toString();
    // 최소 길이 만족 여부 확인(Socket Parser의 Delimiter가 EOT이므로 만족 길이전에 자를 수 있음)
    const minFrameLength = 26;

    if (originalBufData.length < minFrameLength) {
      throw new RangeError(
        `minFrameLength is ${minFrameLength} but deviceDatalength: ${originalBufData.length}`,
      );
    }

    const stx = deviceData.slice(0, 1);
    const cDaqSerial = deviceData.slice(1, 9);
    const cDaqSlotType = deviceData.slice(9, 13);
    const cDaqSlotSerial = deviceData.slice(13, 21);
    const dataBody = deviceData.slice(0, deviceData.length - 2);
    const realData = deviceData.slice(21, deviceData.length - 2);
    const fnCode = deviceData.slice(21, 22);
    const cmd = deviceData.slice(22, 24);
    const checksum = deviceData.slice(deviceData.length - 2, deviceData.length - 1);
    const eot = deviceData.slice(deviceData.length - 1);

    // BU.CLIS(
    //   stx,
    //   cDaqSerial,
    //   cDaqSlotType,
    //   cDaqSlotSerial,
    //   dataBody,
    //   realData,
    //   checksum,
    //   eot,
    // );

    const expectedChecksum = this.protocolConverter.getSumBuffer(dataBody);

    // STX 일치 여부 확인
    if (stx !== '#') {
      throw new Error('STX가 일치하지 않습니다.');
    }
    // EOT 일치 여부 확인
    if (eot !== '') {
      throw new Error('EOT가 일치하지 않습니다.');
    }

    // checksum 일치 여부 확인
    if (checksum !== expectedChecksum.toString()) {
      throw new Error(
        `checksum does not match. expect: ${expectedChecksum.toString()}, receive: ${checksum}`,
      );
    }

    return {
      stx,
      cDaqSerial,
      cDaqSlotType,
      cDaqSlotSerial,
      dataBody,
      realData,
      fnCode,
      cmd,
      checksum,
    };
  }

  /**
   *
   * @param {detailDataloggerInfo} dlInfo
   * @param {Buffer} bufData
   */
  getVoltage(dlInfo, bufData) {
    // BU.CLI(dlInfo);

    const voltageList = [0, 0, 0, 0, 0, 0, 0, 0];

    // Voltage 값 정의
    this.nodeList
      .filter(nodeInfo => {
        return dlInfo.nodeList.includes(nodeInfo.nodeId);
      })
      .forEach(nodeInfo => {
        const { dlIdx, nodeType, data } = nodeInfo;

        voltageList[dlIdx] = this.onDeviceOperationStatus[nodeType](data, 3);
      });

    // voltage 인코딩
    const result = voltageList.map(vol => {
      return _.chain(vol)
        .multiply(100)
        .round(0)
        .thru(num => {
          const addSign = num < 0 ? '' : '+';
          const strNum = num.toLocaleString(undefined, {
            minimumIntegerDigits: 4,
            useGrouping: false,
          });
          return `${addSign}${strNum.slice(0, 2)}.${strNum.slice(2)}`;
        })
        .value();
    });

    // BU.CLI(result);

    return result.join('');
  }

  /**
   *
   * @param {detailDataloggerInfo} dlInfo
   * @param {Buffer} bufData
   */
  getRelay(dlInfo, bufData) {
    // 1 ~ 4 Ch
    const relayList = [0, 0, 0, 0];

    // Voltage 값 정의
    this.nodeList
      .filter(nodeInfo => {
        return dlInfo.nodeList.includes(nodeInfo.nodeId);
      })
      .forEach(nodeInfo => {
        const { classId, dlIdx, data } = nodeInfo;

        relayList[dlIdx] = this.onDeviceOperationStatus[classId][data];
      });

    // 0 ~ 15
    const relayStatus = relayList.reduce((statusNum, relayData, index) => {
      return relayData === 1 ? 2 ** index + statusNum : statusNum;
    }, 0);

    return _.padStart(relayStatus.toString(), 2, '0');
  }

  /**
   *
   * @param {detailDataloggerInfo} dlInfo
   * @param {string} strCmd '00' ~ '15'
   */
  controlRelay(dlInfo, strCmd) {
    // BU.CLI('controlRelay', strCmd);
    const relayList = this.protocolConverter
      .converter()
      // '12' >> '1100'
      .dec2bin(Number(strCmd))
      // 8이하의 수일 경우 4자리가 안되므로 앞자리부터 0 채움
      .padStart(4, '0')
      // '1100' >> [1, 1, 0, 0]
      .split('')
      // MSB >> LSB 변환, [1, 1, 0, 0] >> [0, 0, 1, 1]
      .reverse()
      .map(Number);

    // BU.CLIN(this.onDeviceOperationStatus);

    // 릴레이 값 정의
    this.nodeList
      .filter(nodeInfo => {
        return dlInfo.nodeList.includes(nodeInfo.nodeId);
      })
      .forEach(nodeInfo => {
        const { classId, dlIdx, dIdx, data } = nodeInfo;

        // 바꾸고자 하는 데이터
        const changeData = relayList[dIdx];
        // 바꾸고자 하는 데이터와 일치할 경우 KEY로 데이터 교체
        _.some(this.onDeviceOperationStatus[classId], (value, key) => {
          if (value === changeData) {
            nodeInfo.data = key;
          }
        });
      });

    return this.getRelay(dlInfo);
  }

  /**
   *
   * @param {Buffer} bufData
   */
  onData(bufData) {
    try {
      // BU.CLIS(this.protocolInfo, bufData);
      // Frame을 쓴다면 벗겨냄
      const originalBufData = this.peelFrameMsg(bufData);

      const { cDaqSlotSerial, cDaqSlotType, cmd, fnCode } = this.decodingData(
        originalBufData,
      );

      /** @type {Buffer} */
      let deviceData;

      // slaveAddr를 기준으로 dlInfo 찾음
      const dlInfo = this.findDataLogger(cDaqSlotSerial);

      if (_.isUndefined(dlInfo)) {
        return;
      }

      // 슬롯 타입에 따라 데이터 분류 Key 정의
      const slotDataType = _.findKey(this.modelTypeInfo, slotTypeList => {
        return slotTypeList.includes(cDaqSlotType);
      });

      let callMethod;

      const FN_CODE = {
        MEASURE: '1',
        SET: '2',
      };

      // BU.CLI(slotDataType, fnCode);
      switch (slotDataType) {
        case 'voltage':
          switch (fnCode) {
            case FN_CODE.MEASURE:
              callMethod = this.getVoltage;
              break;
            default:
              break;
          }
          break;
        case 'relay':
          switch (fnCode) {
            case FN_CODE.MEASURE:
              callMethod = this.getRelay;
              break;
            case FN_CODE.SET:
              callMethod = this.controlRelay;
              break;
            default:
              break;
          }
          break;
        default:
          break;
      }

      // 실행할 메소드가 없다면 종료
      if (callMethod === undefined) return;

      // 메소드에 명령 전달
      deviceData = callMethod.call(this, dlInfo, cmd);

      // 데이터가 없으면 반환
      if (_.isEmpty(deviceData)) return undefined;

      // Wrapping 처리
      const returnBuffer = this.wrapFrameMsg(
        this.encodingData(deviceData, originalBufData),
      );

      // BU.CLIN(returnBuffer);

      return returnBuffer;
    } catch (error) {
      BU.CLI(error);
    }
  }
};
