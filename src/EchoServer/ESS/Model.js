const _ = require('lodash');

const { dpc } = require('../../module');

const { BaseModel } = dpc;

class Model extends BaseModel.Inverter {
  /**
   * @param {protocol_info} protocolInfo
   */
  constructor(protocolInfo) {
    super();

    // 국번 세팅
    const dialing = _.get(protocolInfo, 'deviceId');

    this.dialing = this.protocolConverter.makeMsg2Buffer(dialing);
    // Data Storage
    this.ds = BaseModel.ESS.BASE_MODEL;
    this.ds.powerCpKwh = 100; // 100 kWh 부터 시작
    this.index = 0;

    this.reload();
    setInterval(() => {
      this.reload();
    }, 10000);
  }

  reload() {
    this.ds.pvAmp = _.random(0.3, 7.7);
    this.ds.pvVol = _.random(160.1, 190.1);
    this.ds.pvKw = _.multiply(_.multiply(this.ds.pvAmp, this.ds.pvVol), 0.001);
    this.ds.pvKwh = _.multiply(_.multiply(this.ds.pvAmp, this.ds.pvVol), 0.001) * _.random(10, 15);
    this.ds.gridLf = _.random(59.7, 60.5);
    this.ds.gridRAmp = _.multiply(this.ds.pvAmp, _.random(0.8, 0.99));
    this.ds.gridRsVol = _.multiply(this.ds.pvVol, _.random(0.9, 1.0));
    this.ds.gridSAmp = _.multiply(this.ds.pvAmp, _.random(0.8, 0.99));
    this.ds.gridStVol = _.multiply(this.ds.pvVol, _.random(0.9, 1.0));
    this.ds.gridTAmp = _.multiply(this.ds.pvAmp, _.random(0.8, 0.99));
    this.ds.gridTrVol = _.multiply(this.ds.pvVol, _.random(0.9, 1.0));
    this.ds.operIsError = _.random(0, 1);
    this.ds.operIsRun = _.random(0, 1);
    this.ds.operTemperature = _.random(15.1, 36.2);
    this.ds.operTroubleList = [];
    this.ds.operWarningList = [];
    this.ds.sysCapaKw = _.random(0.5, 20);
    this.ds.sysIsSingle = _.random(0, 1);
    this.ds.sysLineVoltage = this.ds.sysIsSingle ? 220 : 380;
    this.ds.sysProductYear = _.random(2015, 2018);
    this.ds.sysSn = _.random(1, 9);
    this.ds.powerCpKwh += _.random(0.1, 1);
    this.ds.powerDailyKwh = _.sum([10, this.index]);
    this.ds.powerPvKw = this.ds.pvKw;
    this.ds.powerGridKw = _.divide(_.multiply(this.ds.gridRAmp, this.ds.gridRsVol), 1000);
    this.ds.powerPf = _.multiply(_.divide(this.ds.powerGridKw, this.ds.powerPvKw), 100);
    this.ds.batteryVol = _.random(160.1, 190.1);
    this.ds.batteryAmp = _.random(0.3, 7.7);
    this.ds.batteryChargingKw = _.round(
      _.multiply(_.multiply(this.ds.batteryVol, this.ds.batteryAmp), 0.001),
      4,
    );
    this.ds.batteryDischargingKw = _.round(
      _.multiply(_.multiply(this.ds.batteryVol, this.ds.batteryAmp), 0.001),
      4,
    );
    this.ds.batteryTotalChargingKw = _.round(
      _.multiply(this.ds.powerCpKwh, _.random(0.8, 0.99)),
      3,
    );
    this.ds.totalPVGeneratingPowerKwh = _.round(
      _.multiply(this.ds.powerCpKwh, _.random(0.8, 0.99)),
      3,
    );
    this.ds.ledDcVol = _.random(160.1, 190.1);
    this.ds.ledDcAmp = _.random(0.3, 7.7);
    this.ds.ledUsingKw = _.round(
      _.multiply(_.multiply(this.ds.ledDcVol, this.ds.ledDcAmp), 0.001),
      4,
    );
    this.ds.ledTotalUsingKwh = _.round(_.multiply(this.ds.powerCpKwh, _.random(0.3, 0.56)), 3);
    this.ds.inputLineKw = this.ds.pvKw;
    this.ds.inputLineTotalKwh = _.round(_.multiply(this.ds.powerCpKwh, _.random(0.7, 0.87), 3));

    this.index++;
  }
}
module.exports = Model;
