const _ = require('lodash');
const moment = require('moment');
const { BU } = require('base-util-jh');

const { dpc } = require('../../module');

const { BaseModel } = dpc;

class Model extends BaseModel.Inverter {
  /**
   * protocol_info.option --> true: 3.3kW, any: 600W
   * @param {protocol_info} protocolInfo
   */
  constructor(protocolInfo) {
    super();
    const { mainCategory = '', subCategory = '', deviceId } = protocolInfo;
    console.log(`${mainCategory} ${subCategory} (${deviceId}) EchoServer Created`);

    // 국번 세팅
    const dialing = deviceId;

    this.protocolInfo = protocolInfo;
    this.dialing = this.protocolConverter.makeMsg2Buffer(dialing);

    // 인버터 용량 불러옴. default: 30 kW
    this.amount = _.get(protocolInfo.option, 'amount', 25);
    // 단상, 삼상 여부
    this.isSingle = this.amount <= 3 ? 1 : 0;

    // 전압 200을 기본으로 두고. 용량 30kW * 5 = 150kW, 150 A * 200 V = 30000 W -> 30 kW
    this.basePvA = this.isSingle ? this.amount * 5 : this.amount * 2;

    // Data Storage
    this.ds = BaseModel.Inverter.BASE_MODEL;
    // TEST
    this.ds.powerCpKwh = this.amount * _.random(10, 10.5, true); // 100 kWh 부터 시작
    this.index = 0;

    this.intervalMinute = 1;
    // 누적 발전량에 곱할 가중치
    this.cumulativeScale = this.intervalMinute / 60;

    this.reload();
    setInterval(() => {
      this.reload();
    }, 1000 * 60 * this.intervalMinute);
  }

  reload() {
    const hour = moment().hour();
    const minute = moment().minute();

    const hourSolarList = [
      0, // 0시
      0, // 1시
      0, // 2시
      0, // 3시
      0, // 4시
      0, // 5시
      0, // 6시
      41, // 7시
      82, // 8시
      524, // 9시
      762, // 10시
      866, // 11시
      899, // 12시
      841, // 13시
      689, // 14시
      //
      // 866, // 11시
      // 899, // 12시
      // 841, // 13시
      // 689, // 14시
      //
      444, // 15시
      162, // 16시
      39, // 17시
      1, // 18시
      0, // 19시
      0, // 20시
      0, // 21시
      0, // 22시
      0, // 23시
      0, // 24시
    ];

    const currSolar = _.nth(hourSolarList, hour);
    const nextSolar = _.nth(hourSolarList, hour + 1);
    const subtractSolar = _.subtract(nextSolar, currSolar);

    const minuteSolarList = [];

    // 분단위 일사량
    const unitSolar = subtractSolar / 60;
    for (let index = 0; index < 60; index += 1) {
      minuteSolarList.push(_.multiply(unitSolar, index));
    }
    // 시간, 분을 적용한 현재 일사량을 구함
    const currRealSolar = _.sum([currSolar, _.nth(minuteSolarList, minute)]);

    const ROOT_THREE = 1.732;

    // 일사량 1000일 경우 100% 달성한다고 가정
    const BASE_SOLAR = 1000;
    //
    const currHourScale = _.divide(currRealSolar, BASE_SOLAR);

    this.ds.pvAmp = _.multiply(this.basePvA, currHourScale);
    this.ds.pvVol = this.isSingle ? _.random(180, 220, true) : _.random(460, 540, true);
    this.ds.pvKw = _.multiply(_.multiply(this.ds.pvAmp, this.ds.pvVol), 0.001);
    this.ds.gridLf = _.random(59.7, 60.5);

    const basePvVol = this.isSingle ? this.ds.pvVol : _.random(380, 420, true);
    const basePvAmp = this.isSingle
      ? this.ds.pvAmp
      : // 삼상 계산식 루트3을 위한 전류 감산. 전압 수치가 낮아지기때문에 낮아진 만큼 보존
        (this.ds.pvAmp / ROOT_THREE) * (this.ds.pvVol / basePvVol);

    this.ds.gridRAmp = _.multiply(basePvAmp, _.random(0.95, 1, true));
    this.ds.gridRsVol = _.multiply(basePvVol, _.random(0.95, 1, true));
    this.ds.gridSAmp = _.multiply(basePvAmp, _.random(0.95, 1, true));
    this.ds.gridStVol = _.multiply(basePvVol, _.random(0.95, 1, true));
    this.ds.gridTAmp = _.multiply(basePvAmp, _.random(0.95, 1, true));
    this.ds.gridTrVol = _.multiply(basePvVol, _.random(0.95, 1, true));
    this.ds.operIsError = _.random(0, 1);
    this.ds.operIsRun = _.random(0, 1);
    this.ds.operTemperature = _.random(15.1, 36.2);
    this.ds.operTroubleList = [];
    this.ds.operWarningList = [];
    this.ds.sysCapaKw = this.amount;
    this.ds.sysIsSingle = this.isSingle;
    this.ds.sysLineVoltage = this.isSingle ? 220 : 380;
    this.ds.sysProductYear = moment().year();
    this.ds.sysSn = _.random(1, 9);
    this.ds.powerPvKw = this.ds.pvKw;
    this.ds.powerGridKw = _.divide(_.multiply(this.ds.gridRAmp, this.ds.gridRsVol), 1000);
    this.ds.powerGridKw = this.isSingle
      ? this.ds.powerGridKw
      : this.ds.powerGridKw * ROOT_THREE;
    this.ds.powerDailyKwh = _.sum([10, this.index]);
    this.ds.powerCpKwh += _.multiply(this.cumulativeScale, this.ds.powerGridKw);
    this.ds.powerPf = _.multiply(_.divide(this.ds.powerGridKw, this.ds.powerPvKw), 100);
    this.ds.powerPf = _.isNaN(this.ds.powerPf) ? 0 : this.ds.powerPf;

    // BU.CLI(this.ds);

    this.index += 1;
  }

  /**
   * passiveClient를 사용할 경우 전송 Frame을 씌워서 보내야하므로 DPC에 frame을 씌워줄 것을 요청
   * passiveClient를 사용하지 않을 경우 원본 데이터 반환
   * @param {Buffer} msg 인버터 프로토콜에 따른 실제 데이터
   */
  wrapFrameMsg(msg) {
    return BaseModel.defaultWrapper.wrapFrameMsg(this.protocolInfo, msg);
  }

  /**
   * passiveClient를 사용할 경우 전송 Frame을 씌워서 보내므로 해당 Frame을 해제하고 실제 데이터 추출하여 반환
   * passiveClient를 사용하지 않을 경우 원본 데이터 반환
   * @param {Buffer} msg 인버터 프로토콜에 따른 실제 데이터
   */
  peelFrameMsg(msg) {
    return BaseModel.defaultWrapper.peelFrameMsg(this.protocolInfo, msg);
  }
}
module.exports = Model;
