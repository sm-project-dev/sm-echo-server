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
    this.deviceId = deviceId;
    // kW 단위를 사용할 것인지 여부(default kW)
    this.isKwUnit = isKwUnit;

    // 기존에 객체에 생성되어 있는지 체크
    const foundInstance = _.find(instanceList, insInfo => _.isEqual(insInfo.id, deviceId));

    // 없다면 신규로 생성
    if (_.isEmpty(foundInstance)) {
      BU.CLI('신규');
      instanceList.push({ id: deviceId, instance: this });
    } else {
      return foundInstance.instance;
    }

    // BU.CLI(this.deviceId);

    this.RES_HEAD = [this.SOP, this.RES_CODE];
  }

  /**
   *
   * @param {number} dataLength
   */
  makePv(dataLength) {
    const returnValueList = [];
    // BU.CLI(this.ds);
    for (let index = 1; index <= dataLength / 2; index += 1) {
      const amp = _.get(this.ds, `ampCh${index}`, 0);
      const vol = _.get(this.ds, `volCh${index}`, 0);
      returnValueList.push(_.round(amp * 100));
      returnValueList.push(_.round(vol * 10));
    }
    return returnValueList;
  }

  /**
   * 요청 명령 체크
   * @param {Buffer} receiveBuffer 요청한 명령 정보
   */
  onData(receiveBuffer) {
    try {
      // BU.CLI(receiveBuffer);
      // if (!_.isBuffer(receiveBuffer)) return;

      // receiveBuffer = this.peelFrameMsg(receiveBuffer);

      /** @type {modbusReadFormat} */
      const receiveJson = JSON.parse(receiveBuffer);

      // BU.CLI(this.deviceId, receiveJson);

      const { address: registerAddr, dataLength, fnCode, unitId: slaveAddr } = receiveJson;

      // 인버터 국번 비교
      if (!_.isEqual(this.deviceId, slaveAddr)) {
        throw new Error(`Not Matching onAddr: ${slaveAddr}, expected: ${this.deviceId}`);
      }
      // 체크섬 계산

      const dataBody = this.makePv(dataLength);

      // BU.CLIN(this.ds);

      // BU.CLI(this.deviceId, dataBody);
      // 생성한 데이터 반환
      return dataBody;
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
    deviceId: Buffer.from([1]),
    // deviceId: 1,
    mainCategory: 'Sensor',
    subCategory: 'CNT_DK_v2.2',
    option: {
      amount: 25,
      chCount: 6,
    },
  });

  echoServer.reload();

  const responeFrame = echoServer.onData({ unitId: 1, fnCode: 4, address: 8, dataLength: 12 });

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
