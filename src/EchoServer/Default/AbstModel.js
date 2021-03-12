const _ = require('lodash');
const EventEmitter = require('events');
const { BU } = require('base-util-jh');

const { dpc } = require('../../module');

const { BaseModel } = dpc;

const { ETC, FarmParallel, UPSAS, Sensor, STP, NI } = BaseModel;

const commonUtils = require('../../util/common');

/** @type {Array.<{id: mDeviceMap, instance: EchoServer}>} */
const instanceList = [];
class AbstModel extends EventEmitter {
  /**
   * @param {protocol_info} protocolInfo
   * @param {mDeviceMap} deviceMap
   */
  constructor(protocolInfo, deviceMap) {
    super();
    // 기존에 객체에 생성되어 있는지 체크
    const foundInstance = _.find(instanceList, instanceInfo =>
      _.isEqual(instanceInfo.id, deviceMap),
    );

    // 없다면 신규로 생성
    if (_.isEmpty(foundInstance)) {
      instanceList.push({ id: deviceMap, instance: this });
    } else {
      return foundInstance.instance;
    }

    this.dpcModel = BaseModel;

    // Strategy Pattern
    switch (protocolInfo.mainCategory) {
      case 'ETC':
        this.projectModel = new ETC(protocolInfo);
        this.nodeDefKeyInfo = ETC.BASE_KEY;
        break;
      case 'UPSAS':
        this.projectModel = new UPSAS(protocolInfo);
        this.nodeDefKeyInfo = UPSAS.BASE_KEY;
        break;
      case 'FarmParallel':
        this.projectModel = new FarmParallel(protocolInfo);
        this.nodeDefKeyInfo = FarmParallel.BASE_KEY;
        break;
      case 'Sensor':
        this.projectModel = new Sensor(protocolInfo);
        this.nodeDefKeyInfo = Sensor.BASE_KEY;
        break;
      case 'STP':
        console.log(protocolInfo);
        this.projectModel = new STP(protocolInfo);
        this.nodeDefKeyInfo = STP.BASE_KEY;
        break;
      case 'NI':
        this.projectModel = new NI(protocolInfo);
        this.nodeDefKeyInfo = NI.BASE_KEY;
        break;
      default:
        _.set(
          this,
          'projectModel',
          new BaseModel[protocolInfo.mainCategory](protocolInfo),
        );
        _.set(this, 'nodeDefKeyInfo', BaseModel[protocolInfo.mainCategory].BASE_KEY);
        break;
    }

    // DPC 모델
    this.protocolConverter = this.projectModel.protocolConverter;

    // 프로토콜 정보 정의
    this.protocolInfo = protocolInfo;

    // 현재 쓰이는 맵 정보 정의(instance Id로 사용)
    // this.deviceMap = deviceMap;
    this.deviceMap = commonUtils.setRepeatNode(deviceMap);

    // 실제 장치 데이터
    this.nodeList = commonUtils.makeNodeList(deviceMap);
    // 장치들의 데이터를 취합하는 데이터 로거
    this.dataLoggerList = commonUtils.makeDataLoggerList(deviceMap);

    // console.log(this.dataLoggerList);

    this.initModel();
    // BU.CLIN(this);
    this.reload();
    setInterval(() => {
      this.reload();
    }, 1000 * 10);
  }

  /**
   * @interface
   * 장치들의 초기값을 설정
   */
  initModel() {}

  /** 장치가 수치를 측정하는 센서이고  */
  reload() {
    // BU.log(this.nodeList.length);
    try {
      this.nodeList.forEach(nodeInfo => {
        // 센서이고 현재 데이터가 숫자이면서 float형인 경우만 랜덤 수치를 적용
        // if (nodeInfo.isSensor && _.isNumber(nodeInfo.data) && nodeInfo.data % 1 !== 0) {
        if (nodeInfo.isSensor === 1 && _.isNumber(nodeInfo.data)) {
          // 현재 값을 기준으로 95% ~ 105% 사이의 랜덤 값을 사용
          nodeInfo.data = _.multiply(nodeInfo.data, _.random(0.99, 1.01, true));
        }
      });

      // console.log(this.nodeList);

      this.emitReload();
    } catch (error) {
      // BU.CLIN(this);
      BU.error(error.message);
      // BU.debugConsole(20);
    }
  }

  /** SimulApp의 노드에게 전파 */
  emitReload() {
    this.emit('reload');
  }

  /**
   *
   * @param {string|number} dlSn Data Logger Serial Number
   */
  findDataLogger(dlSn) {
    // BU.CLIN(this.dataLoggerList);
    // BU.CLI(dlSn);
    dlSn = Buffer.isBuffer(dlSn) ? dlSn.toString() : dlSn;
    // return _.find(this.dataLoggerList, dlInfo => {
    //   return _.isEqual(dlInfo.serialNumber, dlSn);
    // });
    return _.find(this.dataLoggerList, { serialNumber: dlSn });
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

  /**
   * DBS에서 요청한 명령
   * @param {Buffer} bufData
   */
  onData(bufData) {}
}
module.exports = AbstModel;
