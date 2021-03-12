const _ = require('lodash');
const net = require('net');
const Promise = require('bluebird');

const { expect } = require('chai');

const { BU } = require('base-util-jh');

const Converter = require('../../../sm-protocol-manager/src/STP/JungHan/Converter');
// const TempConverter = require('../../src/ETC/BatSm/Converter');

const {
  decodingProtocolTable: DPT,
} = require('../../../sm-protocol-manager/src/STP/JungHan/protocol');

const {
  di: {
    dcmConfigModel: { reqDeviceControlType: reqDCT },
  },
} = require('../../src/module');

async function startTest() {
  const client = net.createConnection(9000);

  client.on('data', data => {
    BU.CLI(data.toString());
  });

  /** @type {xbeeApi_0x10} */
  const writeMsg = {
    destination64: '0013A20040F7ACC8',
    data: '@cgo',
  };

  // Socket SErver 접속 기다림
  await Promise.delay(10);

  // 수문 개방 요청
  client.write(JSON.stringify(writeMsg));

  await Promise.delay(1000);

  writeMsg.data = '@sts';
  // 개방 상태 확인
  client.write(JSON.stringify(writeMsg));
}

describe('↓↓↓↓ JungHan ↓↓↓↓', () => {
  const protocolInfo = {
    mainCategory: 'STP',
    subCategory: 'JungHan',
    deviceId: 1,
  };

  const converter = new Converter(protocolInfo);

  /** @type {modbusReadFormat[]} */
  const modbusReadFormats = converter.model.device.DEFAULT.COMMAND.STATUS;

  // BU.CLI(modbusReadFormats);

  const decodingProtocolInfo = DPT(protocolInfo);

  it('encoding', async () => {
    await Promise.delay(3000);

    const client = net.createConnection(15300);

    const reqCmd = converter.generationCommand();

    let receiveData = await client.write(reqCmd[0].data);

    console.log(receiveData);

    // reqCmd.forEach(({ data }) => {
    //   client.write(data);
    // });

    // // console.log(reqCmd);

    // _.forEach(modbusReadFormats, (reqCmdInfo, index) => {
    //   /** @type {modbusReadFormat} */
    //   const modbusReadFormat = reqCmdInfo;

    //   /** @type {Buffer} */
    //   const reqCmdBuf = reqCmd[index].data;

    //   const fnCode = reqCmdBuf.readInt8(1);

    //   const startingAddr = reqCmdBuf.readUInt16BE(2);
    //   const quantity = reqCmdBuf.readUInt16BE(4);
    //   const crc = reqCmdBuf.slice(6);

    //   const calcCrc = converter.protocolConverter.getModbusChecksum(
    //     reqCmdBuf.slice(0, reqCmdBuf.length - 2),
    //   );

    //   expect(modbusReadFormat.fnCode).to.eq(fnCode);
    //   expect(modbusReadFormat.address).to.eq(startingAddr);
    //   expect(modbusReadFormat.dataLength).to.eq(quantity);
    //   expect(calcCrc).to.deep.eq(crc);
    // });
  });

  it.skip('decoding', done => {
    /**
     *
     * @param {*} str
     * @param {*} length
     * @return {string[]}
     */
    function chunkString(str, length) {
      return str.match(new RegExp(`.{1,${length}}`, 'g'));
    }

    /**
     *
     * @param {number[]} numArr
     */
    function convertArrToBinary(numArr) {
      return _.chain(numArr)
        .join('')
        .thru(strNum => {
          const splitLength = 8;
          // 문자 개수로 짜름
          const chunkArr = chunkString(strNum, splitLength);

          const refineNumArr = chunkArr.map(chunkStr => {
            // 8자리로 맞춤
            const refineChunkStr = _.padEnd(chunkStr, splitLength, '0');
            // 문자 역순(LE)
            const binValue = refineChunkStr.split('').reverse().join('');
            return parseInt(binValue, 2);
          });

          return Buffer.from(refineNumArr);
        })
        .value();
    }

    const dataStorage = {
      BASE: [
        // Valve FeedBack
        99,
        88,
        77,
        66,
        // Amp
        12.9,
        34.002233,
        // sgPressure
        11.11,
        888.888,
        22.22,
        33.33,
        333.333,
        444.123,
        // outsideTemp
        10,
        20.01,
        42,
      ],
      OPERATION: convertArrToBinary([0, 1, 1, 1, 1, 0, 0, 0]),
    };

    BU.CLI(dataStorage);

    // 프로토콜 테이블 전체를 순회
    const resDataStorage = _.reduce(
      decodingProtocolInfo,
      (storage, reqCmdInfo, decodingKey) => {
        // 프로토콜 테이블 Key와 일치하는 데이터 테이블 추출
        const dataList = dataStorage[decodingKey];
        // BU.CLI(dataList);

        // 데이터가 존재하지 않을 경우
        if (dataList === undefined) {
          return storage;
        }
        // Buffer 일 경우 이미 정제 처리 완료
        if (Buffer.isBuffer(dataList)) {
          storage[decodingKey] = dataList;
          return storage;
        }

        // 프로토콜 테이블의 decodingTable의 데이터를 순회
        storage[decodingKey] = reqCmdInfo.decodingDataList.map((decodingInfo, index) => {
          // index와 일치하는 데이터 테이블 데이터 추출
          /** @type {number} */
          const userData = dataList[index];
          const { byte = 1 } = decodingInfo;

          let bufData = Buffer.alloc(0);

          // decoding 정보의 내용 중 2byte일 경우 정수 부분만 취합
          if (byte === 2) {
            bufData = Buffer.alloc(2);
            bufData.writeInt16BE(userData);
          }

          // decoding 정보의 내용 중 4byte일 경우 2byte씩 정수부 실수부 Buffer 계산 후 붙임
          if (byte === 4) {
            // 자연수, 소수부 분리
            bufData = Buffer.alloc(4);
            bufData.writeFloatBE(userData);
          }

          return bufData;
        });

        return storage;
      },
      {},
    );

    // BU.CLIN(resDataStorage);

    // FC: 03, Base (10 ~ 35)
    _.forEach(resDataStorage, (bufList, decodingKey) => {
      // BU.CLI(decodingKey, bufList);

      /** @type {modbusReadFormat} */
      const modbusReadFormat = _.find(modbusReadFormats, { type: decodingKey });
      BU.CLI(modbusReadFormat);

      const { address, dataLength, fnCode, unitId } = modbusReadFormat;

      const realBufData = Buffer.isBuffer(bufList) ? bufList : Buffer.concat(bufList);

      // Frame 생성
      const resFrame = Buffer.concat([
        converter.protocolConverter.convertNumToWriteInt(unitId),
        converter.protocolConverter.convertNumToWriteInt(fnCode),
        converter.protocolConverter.convertNumToWriteInt(dataLength),
        // Buffer.from([realBufData.length]),
        realBufData,
      ]);

      const parsingData = converter.concreteParsingData(
        Buffer.concat([
          resFrame,
          converter.protocolConverter.getModbusChecksum(resFrame),
        ]),
        converter.generationModbusCommand(modbusReadFormat),
      );

      BU.CLI(parsingData);
    });

    // Flow (100 ~ 103)

    // Add Steam Generator Sensor (600 ~ 615)

    // FC: 01, Feedback Err (64 ~ 69)

    // Operation (70 ~ 75)

    // System Err (80 ~ 121)

    // Mode (122 ~ 126)

    // Steam Generator Err (163)

    done();
  });
});
