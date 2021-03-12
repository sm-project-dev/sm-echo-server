const _ = require('lodash');

const { BU } = require('base-util-jh');

const Model = require('../Model');

/** @type {{id: Buffer, instance: EchoServer}[]} */
const instanceList = [];
class EchoServer extends Model {
  /**
   * protocol_info.option --> true: 3.3kW, any: 600W
   * @param {protocol_info} protocolInfo
   */
  constructor(protocolInfo) {
    super(protocolInfo);

    const { deviceId, option: { isKwUnit = true } = {} } = protocolInfo;

    // kW 단위를 사용할 것인지 여부(default kW)
    this.isKwUnit = isKwUnit;

    // 기존에 객체에 생성되어 있는지 체크
    const foundInstance = _.find(instanceList, insInfo =>
      _.isEqual(insInfo.id, deviceId),
    );

    // 없다면 신규로 생성
    if (_.isEmpty(foundInstance)) {
      instanceList.push({ id: deviceId, instance: this });
    } else {
      return foundInstance.instance;
    }

    this.ACK = this.protocolConverter.ACK;
    this.ENQ = this.protocolConverter.ENQ;
    this.EOT = this.protocolConverter.EOT;

    this.SOP = Buffer.from('^');
    this.DELIMETER = Buffer.from(',');
    this.REQ_CODE = Buffer.from('P');
    this.RES_CODE = Buffer.from('D');

    this.RES_HEAD = [this.SOP, this.RES_CODE];

    this.HEADER_INFO = {
      BYTE: {
        SOP: 1,
        CODE: 1,
        ADDR: 1,
        LENGTH: 2,
        ID: 3,
        CHECKSUM: 2,
        CMD: 3,
      },
    };

    // 요청받은 명령 정보를 저장할 Buffer
    this.receiveBuffer = Buffer.alloc(0);
  }

  /**
   *
   * @param {Buffer} onBufferData
   */
  parsingData(onBufferData) {
    // BU.CLI(onBufferData.toString());

    const ENQ = onBufferData.slice(0, 1);
    const dialing = onBufferData.slice(1, 3);
    const CMD = onBufferData.slice(3, 4);
    const addr = onBufferData.slice(4, 8);
    const dataLength = onBufferData.slice(8, 10);
    const checkSum = onBufferData.slice(10, 14);
    const EOT = onBufferData.slice(14, 15);

    return {
      ENQ,
      dialing,
      CMD,
      addr,
      dataLength,
      checkSum,
      EOT,
    };
  }

  /**
   * 반환 데이터 프레임 생성
   * @param {Buffer} dataBody DATA + Checksum
   * @param {Buffer} receiveBuffer 요청받은 명령 Buffer
   */
  makeResponseFrame(dataBody, receiveBuffer) {
    const { CMD, addr, dialing } = this.parsingData(receiveBuffer);
    // 체크섬 계산에 필요한 데이터만 추림
    const realBody = Buffer.concat([dialing, CMD, addr, dataBody]);
    // 체크섬 계산
    const expectChecksum = this.protocolConverter.getBufferCheckSum(realBody);
    // 완전한 응답 프레임 생성
    return Buffer.concat([
      this.ACK,
      dialing,
      CMD,
      addr,
      dataBody,
      expectChecksum,
      this.EOT,
    ]);
  }

  /**
   * 체크섬 구해서 반환
   * @param {Buffer} receiveBuffer
   */
  calcChecksum(receiveBuffer) {
    return this.protocolConverter.getBufferCheckSum(
      receiveBuffer.slice(1, receiveBuffer.length - 5),
    );
  }

  convertDecToBuf(dsData, dataLength = 4, scale = 1, fixed = 0) {
    return this.protocolConverter.convertNumToHexToBuf(
      _.round(dsData * scale, fixed),
      dataLength,
    );
  }

  // 시스템 메시지 반환
  makeOperationInfo() {
    return Buffer.from('66666666666666663030303166666666', 'hex');
  }

  makePv() {
    return Buffer.concat([
      this.convertDecToBuf(this.ds.pvVol),
      this.convertDecToBuf(this.ds.pvAmp),
    ]);
  }

  makeGrid() {
    // BU.CLI(this.ds);
    return Buffer.concat([
      this.convertDecToBuf(this.ds.gridRsVol),
      this.convertDecToBuf(this.ds.gridStVol),
      this.convertDecToBuf(this.ds.gridTrVol),
      this.convertDecToBuf(this.ds.gridRAmp),
      this.convertDecToBuf(this.ds.gridSAmp),
      this.convertDecToBuf(this.ds.gridTAmp),
      this.convertDecToBuf(this.ds.gridLf * 10),
    ]);
  }

  makePower() {
    const pvKw = _.round(this.ds.pvKw * 10);
    const powerGridKw = _.round(this.ds.powerGridKw * 10);
    const powerMaxKw = _.round(this.ds.powerMaxKw * 10);
    const powerPf = _.round(this.ds.powerPf * 10);
    const powerDailyKwh = _.round(this.ds.powerDailyKwh);
    const powerCpKwhHigh = _.floor(this.ds.powerCpKwh / 65536);
    const powerCpKwhLow = _.round(this.ds.powerCpKwh % 65536);

    return Buffer.concat([
      this.convertDecToBuf(pvKw),
      this.convertDecToBuf(powerCpKwhLow),
      this.convertDecToBuf(powerCpKwhHigh),
      this.convertDecToBuf(powerGridKw),
      this.convertDecToBuf(powerMaxKw),
      this.convertDecToBuf(powerDailyKwh),
      Buffer.alloc(4, 0),
      this.convertDecToBuf(powerPf),
    ]);
  }

  makeSystem() {
    return Buffer.concat([
      Buffer.from('3130'),
      Buffer.from('0510'),
      Buffer.concat([Buffer.alloc(2, 0), this.dialing]),
    ]);
  }

  /**
   * 요청 명령 체크
   * @param {Buffer} receiveBuffer 요청한 명령 정보
   */
  onData(receiveBuffer) {
    // 이상 데이터 무시
    if (!_.isBuffer(receiveBuffer)) return;

    receiveBuffer = this.peelFrameMsg(receiveBuffer);

    // 정상적인 길이의 데이터가 아닐경우 오류 볼 필요도 없음
    if (receiveBuffer.length !== 15) {
      return;
      // throw new Error(`expected 15 length. but ${receiveBuffer.length}`);
    }

    try {
      const { addr, checkSum, dialing } = this.parsingData(receiveBuffer);
      // BU.CLI(receiveBuffer);
      // 인버터 국번 비교
      if (!_.isEqual(this.dialing, dialing)) {
        // return;
        throw new Error(`Not Matching onAddr: ${dialing}, expected: ${this.dialing}`);
      }
      // 체크섬 계산

      const expectChecksum = this.protocolConverter.getBufferCheckSum(
        receiveBuffer.slice(1, 10),
      );
      if (!_.isEqual(expectChecksum, checkSum)) {
        throw new Error(
          `Not Matching onChecksum: ${checkSum}, expected: ${expectChecksum}`,
        );
      }

      // Frame제거한 데이터 저장
      this.receiveBuffer = receiveBuffer;

      let dataBody;
      // 요청한 명령에 따라 응답
      switch (addr.toString()) {
        case '0004':
          dataBody = this.makeOperationInfo();
          break;
        case '0020':
          dataBody = this.makePv();
          break;
        case '0050':
          dataBody = this.makeGrid();
          break;
        case '0060':
          dataBody = this.makePower();
          break;
        case '01e0':
          dataBody = this.makeSystem();
          break;
        default:
          throw new Error(`Can not find it Addr ${addr.toString()}`);
      }

      // BU.CLI(dataBody);
      // 생성한 데이터 반환
      const responeFrame = this.makeResponseFrame(dataBody, receiveBuffer);
      return this.wrapFrameMsg(responeFrame);
    } catch (error) {
      // BU.CLI(error.message);
      // 에러 발생 시 응답하지 않음
    }
  }
}
module.exports = EchoServer;

// if __main process
if (require !== undefined && require.main === module) {
  console.log('__main__');

  const echoServer = new EchoServer({
    deviceId: '01',
    subCategory: 'hexTriple',
    option: true,
  });

  echoServer.reload();

  const responeFrame = echoServer.onData(
    Buffer.from('053031523030353030373031646604', 'hex'),
  );

  BU.CLI(responeFrame);

  // let msg = echoServer.makeOperationInfo();
  // BU.CLI(msg);

  // msg = echoServer.makePv();
  // BU.CLI(msg);

  // msg = echoServer.makeGrid();
  // BU.CLI(msg);

  // msg = echoServer.makePower();
  // BU.CLI(msg);

  // msg = echoServer.makeSystem();
  // BU.CLI(msg);
}
