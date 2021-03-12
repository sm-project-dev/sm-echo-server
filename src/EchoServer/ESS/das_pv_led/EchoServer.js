const _ = require('lodash');

const { BU } = require('base-util-jh');

const Model = require('../Model');

/** @type {Array.<{id: Buffer, instance: EchoServer}>} */
const instanceList = [];
class EchoServer extends Model {
  /**
   * protocol_info.option --> true: 3.3kW, any: 600W
   * @param {protocol_info} protocol_info
   */
  constructor(protocol_info) {
    super(protocol_info);

    this.isKwGnd = _.get(protocol_info, 'option.isUseKw') === true;

    // 기존에 객체에 생성되어 있는지 체크
    const foundInstance = _.find(instanceList, instanceInfo =>
      _.isEqual(instanceInfo.id, this.dialing),
    );

    // 없다면 신규로 생성
    if (_.isEmpty(foundInstance)) {
      instanceList.push({ id: this.dialing, instance: this });
    } else {
      return foundInstance.instance;
    }

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
  }

  /**
   * 체크섬 구해서 반환
   * @param {Array.<Buffer>} dataBodyBufList
   * @return
   */
  calcChecksum(dataBodyBufList) {
    const bodyBuf = Buffer.concat(dataBodyBufList);
    const strChecksum = this.protocolConverter
      .returnBufferExceptDelimiter(bodyBuf, this.DELIMETER.toString())
      .toString();

    let calcChecksum = 0;
    _.forEach(strChecksum, str => {
      let num = _.toNumber(str);
      // 문자라면 A~Z --> 10~35로 변환
      num = isNaN(num) ? _.head(Buffer.from(str)) - 55 : num;
      calcChecksum += num;
    });

    return this.protocolConverter.convertNumToBuf(calcChecksum, 2);
  }

  // 시스템 메시지 반환
  makeSystem() {
    const dataBody = [
      Buffer.from('017'),
      this.dialing,
      this.DELIMETER,
      this.protocolConverter.convertNumToBuf(this.ds.sysIsSingle ? 1 : 3, 1),
      this.DELIMETER,
      this.protocolConverter.convertNumToBuf(_.round(this.ds.sysCapaKw * 10), 4),
      this.DELIMETER,
      this.protocolConverter.convertNumToBuf(_.round(this.ds.sysLineVoltage), 3),
      this.DELIMETER,
    ];

    const resBuf = Buffer.concat(_.concat(this.RES_HEAD, dataBody));
    return Buffer.concat([resBuf, this.calcChecksum(dataBody)]);
  }

  makePv() {
    const currentScale = this.isKwGnd ? 10 : 1000;
    const dataBody = [
      Buffer.from('120'),
      this.dialing,
      this.DELIMETER,
      this.protocolConverter.convertNumToBuf(_.round(this.ds.pvVol), 3),
      this.DELIMETER,
      this.protocolConverter.convertNumToBuf(_.round(this.ds.pvAmp * 10), 4),
      this.DELIMETER,
      this.protocolConverter.convertNumToBuf(_.round(this.ds.pvKw * currentScale), 4),
      this.DELIMETER,
    ];

    const resBuf = Buffer.concat(_.concat(this.RES_HEAD, dataBody));
    return Buffer.concat([resBuf, this.calcChecksum(dataBody)]);
  }

  makeGridVol() {
    const dataBody = [
      Buffer.from('222'),
      this.dialing,
      this.DELIMETER,
      this.protocolConverter.convertNumToBuf(_.round(this.ds.gridRsVol), 3),
      this.DELIMETER,
      this.protocolConverter.convertNumToBuf(_.round(this.ds.gridStVol), 3),
      this.DELIMETER,
      this.protocolConverter.convertNumToBuf(_.round(this.ds.gridTrVol), 3),
      this.DELIMETER,
      this.protocolConverter.convertNumToBuf(_.round(this.ds.gridLf * 10), 3),
      this.DELIMETER,
    ];

    const resBuf = Buffer.concat(_.concat(this.RES_HEAD, dataBody));
    return Buffer.concat([resBuf, this.calcChecksum(dataBody)]);
  }

  makeGridAmp() {
    const dataBody = [
      Buffer.from('321'),
      this.dialing,
      this.DELIMETER,
      this.protocolConverter.convertNumToBuf(_.round(this.ds.gridRAmp * 10), 4),
      this.DELIMETER,
      this.protocolConverter.convertNumToBuf(_.round(this.ds.gridSAmp * 10), 4),
      this.DELIMETER,
      this.protocolConverter.convertNumToBuf(_.round(this.ds.gridTAmp * 10), 4),
      this.DELIMETER,
    ];

    const resBuf = Buffer.concat(_.concat(this.RES_HEAD, dataBody));
    return Buffer.concat([resBuf, this.calcChecksum(dataBody)]);
  }

  makePower() {
    const currentScale = this.isKwGnd ? 10 : 1000;
    const dataBody = [
      Buffer.from('419'),
      this.dialing,
      this.DELIMETER,
      this.protocolConverter.convertNumToBuf(_.round(this.ds.powerGridKw * currentScale), 4),
      this.DELIMETER,
      this.protocolConverter.convertNumToBuf(_.round(this.ds.powerCpKwh), 7),
      this.DELIMETER,
    ];

    const resBuf = Buffer.concat(_.concat(this.RES_HEAD, dataBody));
    return Buffer.concat([resBuf, this.calcChecksum(dataBody)]);
  }

  makeOperation() {
    const dataBody = [
      Buffer.from('612'),
      this.dialing,
      this.DELIMETER,
      this.protocolConverter.convertNumToBuf(this.ds.operIsError, 1),
      this.DELIMETER,
      this.protocolConverter.convertNumToBuf(_.random(0, 6), 1),
      this.DELIMETER,
      // this.protocolConverter.convertNumToBuf(2, 1),
      this.protocolConverter.convertNumToBuf(_.random(0, 9), 1),
      this.DELIMETER,
    ];

    const resBuf = Buffer.concat(_.concat(this.RES_HEAD, dataBody));
    return Buffer.concat([resBuf, this.calcChecksum(dataBody)]);
  }

  makeBattery() {
    const currentScale = this.isKwGnd ? 10 : 1000;
    const dataBody = [
      Buffer.from('741'),
      this.dialing,
      this.DELIMETER,
      this.protocolConverter.convertNumToBuf(this.ds.batteryVol, 3),
      this.DELIMETER,
      this.protocolConverter.convertNumToBuf(_.round(this.ds.batteryAmp * 10), 4),
      this.DELIMETER,
      this.protocolConverter.convertNumToBuf(_.round(this.ds.batteryChargingKw * currentScale), 4),
      this.DELIMETER,
      this.protocolConverter.convertNumToBuf(
        _.round(this.ds.batteryDischargingKw * currentScale),
        4,
      ),
      this.DELIMETER,
      this.protocolConverter.convertNumToBuf(_.round(this.ds.batteryTotalChargingKw), 7),
      this.DELIMETER,
      this.protocolConverter.convertNumToBuf(_.round(this.ds.totalPVGeneratingPowerKwh), 7),
      this.DELIMETER,
    ];

    const resBuf = Buffer.concat(_.concat(this.RES_HEAD, dataBody));
    return Buffer.concat([resBuf, this.calcChecksum(dataBody)]);
  }

  makeLed() {
    // BU.CLI('makeLed');
    const currentScale = this.isKwGnd ? 10 : 1000;
    const dataBody = [
      Buffer.from('828'),
      this.dialing,
      this.DELIMETER,
      this.protocolConverter.convertNumToBuf(_.round(this.ds.ledDcVol), 3),
      this.DELIMETER,
      this.protocolConverter.convertNumToBuf(_.round(this.ds.ledDcAmp * 10), 4),
      this.DELIMETER,
      this.protocolConverter.convertNumToBuf(_.round(this.ds.ledUsingKw * currentScale), 4),
      this.DELIMETER,
      this.protocolConverter.convertNumToBuf(_.round(this.ds.ledTotalUsingKwh), 7),
      this.DELIMETER,
    ];

    BU.CLI(this.ds);
    const resBuf = Buffer.concat(_.concat(this.RES_HEAD, dataBody));
    return Buffer.concat([resBuf, this.calcChecksum(dataBody)]);
  }

  makeInput() {
    const currentScale = this.isKwGnd ? 10 : 1000;
    const dataBody = [
      Buffer.from('919'),
      this.dialing,
      this.DELIMETER,
      this.protocolConverter.convertNumToBuf(_.round(this.ds.inputLineKw * currentScale), 4),
      this.DELIMETER,
      this.protocolConverter.convertNumToBuf(_.round(this.ds.inputLineTotalKwh), 7),
      this.DELIMETER,
    ];

    const resBuf = Buffer.concat(_.concat(this.RES_HEAD, dataBody));
    return Buffer.concat([resBuf, this.calcChecksum(dataBody)]);
  }

  /**
   *
   * @param {Buffer} bufData
   */
  onData(bufData) {
    const SOP = Buffer.from([_.head(bufData)]);

    // SOP 일치 여부 체크
    if (!_.isEqual(SOP, Buffer.from('^'))) {
      throw new Error(`Not Matching SOP\n expect: ${this.SOP}\t res: ${SOP}`);
    }

    // check Length (SOP, CODE, ADDRESS 제외)
    const dialing = bufData.slice(
      _.sum([this.HEADER_INFO.BYTE.SOP, this.HEADER_INFO.BYTE.CODE]),
      _.subtract(bufData.length, this.HEADER_INFO.BYTE.CMD),
    );

    // 국번 일치 여부 체크(다르다면 응답하지 않음)
    if (!_.isEqual(dialing, this.dialing)) {
      return;
    }

    const cmd = bufData.slice(
      _.sum([this.HEADER_INFO.BYTE.SOP, this.HEADER_INFO.BYTE.CODE, this.HEADER_INFO.BYTE.ID]),
    );

    // 모델 데이터 변화
    switch (cmd.toString()) {
      case 'MOD':
        return this.makeSystem();
      case 'ST1':
        return this.makePv();
      case 'ST2':
        return this.makeGridVol();
      case 'ST3':
        return this.makeGridAmp();
      case 'ST4':
        return this.makePower();
      case 'ST6':
        return this.makeOperation();
      case 'ST7':
        return this.makeBattery();
      case 'ST8':
        return this.makeLed();
      case 'ST9':
        return this.makeInput();
      default:
        break;
    }
  }
}
module.exports = EchoServer;

// if __main process
if (require !== undefined && require.main === module) {
  console.log('__main__');

  const echoServer = new EchoServer({ deviceId: '001', subCategory: 'das_1.3', option: true });

  echoServer.reload();
  let msg = echoServer.makeSystem();
  BU.CLI(msg.toString());

  msg = echoServer.makePv();
  BU.CLI(msg.toString());

  msg = echoServer.makeGridVol();
  BU.CLI(msg.toString());

  msg = echoServer.makeGridAmp();
  BU.CLI(msg.toString());

  msg = echoServer.makePower();
  BU.CLI(msg.toString());

  msg = echoServer.makeOperation();
  BU.CLI(msg.toString());
}
