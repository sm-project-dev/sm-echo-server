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
  }

  /**
   * 체크섬 구해서 반환
   * @param {Buffer} dataBodyBufList
   * @return
   */
  calcChecksum(dataBodyBufList) {
    return this.protocolConverter.getSumBuffer(dataBodyBufList);
  }

  /**
   * 체크섬 구해서 반환
   * @param {Buffer} dataBodyBufList
   * @return
   */
  calcXorChecksum(dataBodyBufList) {
    return this.protocolConverter.getXorBuffer(dataBodyBufList);
  }

  /**
   *
   * @param {number} data 변환하고자 하는 데이터
   * @param {number=} scale 배율
   * @param {number=} allocSize 반환하는 Buffer Size
   */
  convert16UIntLE(data, scale = 1, allocSize = 2) {
    // 버퍼 2 자리 생성
    const buf = Buffer.alloc(allocSize);

    // 배율이 존재할 경우 곱셈
    if (scale !== 1) {
      data = _.round(_.multiply(data, scale));
    }
    // BE 형식으로 반환
    buf.writeUInt16LE(data);

    return buf;
  }

  /**
   * 동양 E&P 데이터 반환
   */
  makeDefault() {
    const dataBody = [
      // PROTOCOL_HEADER
      Buffer.from([0xb1, 0xb5]),
      // Station ID (Dialing)
      this.dialing,
      this.convert16UIntLE(this.ds.pvVol, 10),
      this.convert16UIntLE(this.ds.pvAmp, 100),
      this.convert16UIntLE(this.ds.pvKw, 1000),
      this.convert16UIntLE(this.ds.pvVol, 10),
      this.convert16UIntLE(this.ds.pvAmp, 100),
      this.convert16UIntLE(this.ds.pvKw, 1000),
      this.convert16UIntLE(this.ds.gridRsVol, 10),
      this.convert16UIntLE(this.ds.gridRAmp, 100),
      this.convert16UIntLE(this.ds.powerGridKw, 1000),
      this.convert16UIntLE(this.ds.gridLf, 10),
      this.convert16UIntLE(this.ds.powerCpKwh, 1, 3),
      this.convert16UIntLE(this.ds.powerDailyKwh, 100),
      // Temperature (2 Byte), Reserved (1 Byte), Time (3 Byte)
      Buffer.from([0x60, 0x01, 0x00, 0x8e, 0x89, 0x00]),
      // INV Status, Grid Fault, Falut1, Fault2, Warnings
      Buffer.from([0x40, 0x80, 0x10, 0x20, 0x08]),
    ];

    // BU.CLI(dataBody);

    const resBuf = Buffer.concat(dataBody);
    // Check Sum (XOR) 붙임
    return this.wrapFrameMsg(Buffer.concat([resBuf, this.calcXorChecksum(resBuf)]));
  }

  /**
   *
   * @param {Buffer} receiveBuffer
   */
  onData(receiveBuffer) {
    // BU.CLI(this.dialing, bufData);
    // BU.CLI(this.ds);
    receiveBuffer = this.peelFrameMsg(receiveBuffer);

    const PROTOCOL_SOP = Buffer.from([0x0a, 0x96]);
    const PROTOCOL_CMD = Buffer.from([0x54]);

    const SOP = receiveBuffer.slice(0, 2);
    const dialing = receiveBuffer.slice(2, 3);
    const bodyBuffer = receiveBuffer.slice(2, 5);
    const cmd = receiveBuffer.slice(3, 4);
    const checkSum = receiveBuffer.slice(6);
    // 체크섬 체크
    const calcCheckSum = this.calcChecksum(bodyBuffer);

    // SOP 일치 여부 체크
    if (!_.isEqual(SOP, PROTOCOL_SOP)) {
      // BU.CLI(`Not Matching SOP expect: ${PROTOCOL_SOP} res: ${SOP}`);
      return;
    }

    // 국번 일치 여부 체크(다르다면 응답하지 않음)
    if (!_.isEqual(dialing, this.dialing)) {
      // BU.CLI(`Not Matching dialing expect: ${this.dialing} res: ${dialing}`);
      return;
    }

    if (!_.isEqual(checkSum, calcCheckSum)) {
      // BU.CLI(`Not Matching checkSum expect: ${calcCheckSum} res: ${checkSum}`);
      return;
    }

    // BU.CLI('bufData', bufData);

    // 명령 체크
    if (_.isEqual(PROTOCOL_CMD, cmd)) {
      return this.makeDefault();
    }
  }
}
module.exports = EchoServer;

// if __main process
if (require !== undefined && require.main === module) {
  console.log('__main__');

  const echoServer = new EchoServer({
    deviceId: '\u0001',
    mainCategory: 'Inverter',
    subCategory: 's5500k',
  });

  echoServer.reload();
  const msg = echoServer.makeDefault();
  BU.CLI(msg.length, msg);
  // BU.CLI(msg.toString());
}
