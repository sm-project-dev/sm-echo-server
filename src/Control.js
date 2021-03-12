const _ = require('lodash');
const split = require('split');
const { BU } = require('base-util-jh');
const net = require('net');

/** @type {{id: number, instance: Control}[]} */
const instanceList = [];
/** 사이트 단위로 딸려있는 Echo Server 목록을 관리하기 위한 Controller */
class Control {
  /**
   * @param {number} port
   * @param {Object=} parserInfo
   * @param {string} parserInfo.parser
   * @param {string|number} parserInfo.option
   * @param {echoConfig} echoConfig
   */
  constructor(port, parserInfo = {}, echoConfig = {}) {
    this.msgLength = 0;
    this.parserInfo = parserInfo;
    const { siteId = '', siteName = '', serverPort } = echoConfig;

    this.port = _.isNumber(serverPort) ? serverPort : port;

    this.siteId = siteId;
    this.siteName = siteName;

    this.returnData;

    /** @type {net.Socket} */
    this.socketServer;

    // 싱글톤 패턴으로 생성
    const foundInstance = _.find(instanceList, instanceInfo =>
      _.isEqual(instanceInfo.id, this.port),
    );

    if (_.isEmpty(foundInstance)) {
      instanceList.push({ id: this.port, instance: this });
      this.echoServerList = [];
      this.createServer(parserInfo);
    } else {
      return foundInstance.instance;
    }
  }

  /**
   *
   * @param {Object=} parserInfo
   * @param {string} parserInfo.parser
   * @param {string|number} parserInfo.option
   */
  createServer(parserInfo = {}) {
    this.socketServer = net
      .createServer(socket => {
        // BU.log(`${this.getServerName()}client is Connected ${this.port}`);
        // socket.end('goodbye\n');
        if (!_.isEmpty(parserInfo)) {
          let stream = null;
          switch (this.parserInfo.parser) {
            case 'delimiterParser':
              stream = socket.pipe(split(this.parserInfo.option));
              stream.on('data', data => {
                data += this.parserInfo.option;
                this.writeMsg(socket, this.spreadMsg(data));
              });
              break;
            case 'readLineParser':
              stream = socket.pipe(split(this.parserInfo.option));
              stream.on('data', data => {
                this.writeMsg(socket, this.spreadMsg(data));
              });
              break;
            default:
              break;
          }
        } else {
          socket.on('data', data => {
            // BU.CLI(data);
            // parseData.data = Buffer.from(parseData.data);
            // BU.CLI(`${this.getServerName()}P: ${this.port}\t onData: `, data.toString());

            this.writeMsg(socket, this.spreadMsg(data));
          });
        }
      })
      .on('error', err => {
        // handle errors here
        BU.error('@@@@', err, this.socketServer.address());
        // throw err;
      });

    // grab an arbitrary unused port.
    this.socketServer.listen(this.port, () => {
      BU.log(
        `${this.getServerName()} opened this.socketServer on`,
        this.socketServer.address(),
      );
    });

    this.socketServer.on('close', () => {
      console.log('clonse');
    });

    this.socketServer.on('error', err => {
      console.error(err);
    });
  }

  /**
   * 사이트 하부에 딸려 있는 에코서버를 붙임
   * @param {protocol_info} protocolInfo
   * @param {mDeviceMap=} deviceMap SITE 단위를 사용할 경우 해당 프로토콜에서 사용될 MapImg ID
   */
  attachEchoServer(protocolInfo, deviceMap) {
    // 프로토콜을 배열로 보낼 경우
    if (_.isArray(protocolInfo)) {
      return protocolInfo.map(currentItem => {
        return this.attachEchoServer(currentItem, deviceMap);
      });
    }
    const { mainCategory, subCategory } = protocolInfo;
    // 프로토콜 정보에 포함되어 있는 Main 및 Sub Category에 따라 에코서버 호출
    const path = `./EchoServer/${mainCategory}/${subCategory}/EchoServer`;
    // 동적 모듈 선언
    const EchoServer = require(path);
    // 에코서버 객체화
    const echoServer = new EchoServer(protocolInfo, deviceMap);
    // echoServer.init;

    // 동일한 에코서버가 생성되었을 경우에는 추가하지 않음
    const existEchoServer = _.find(this.echoServerList, eServer =>
      _.isEqual(echoServer, eServer),
    );
    _.isEmpty(existEchoServer) && this.echoServerList.push(echoServer);

    return echoServer;
  }

  /** Site Server Name 을 호출 */
  getServerName() {
    const siteName = this.siteName.length ? this.siteName : '';
    return `${this.siteId} ${siteName}`;
  }

  /**
   * Site 하부에 물려있는 Echo Server 목록에 요청 명령을 뿌림
   * 요청 명령에 부합하는 데이터가 반환되었을 경우 반환
   * @param {Buffer} msg
   */
  spreadMsg(msg) {
    // BU.CLI(data);
    const logPath = `./log/echo/${this.siteId}/${BU.convertDateToText(
      new Date(),
      '',
      2,
    )}.log`;
    BU.appendFile(logPath, `onData : ${msg}`);

    // 응답 받을 데이터 배열
    /** @type {echoDataInfo} */
    let echoDataInfo = {};

    // BU.CLIN(this.echoServerList);
    // Echo Server 중 요청한 명령에 대한 응답은 1개이어야만 함.
    this.echoServerList.forEach(echoServer => {
      // Observer 패턴으로 요청한 데이터 리스트를 모두 삽입
      const echoData = echoServer.onData(msg, this);
      if (_.isEmpty(echoData)) return false;

      // 데이터를 정상적으로 생성한 Echo Server의 생성 정보를 가져옴
      const {
        protocolInfo: { mainCategory = '', subCategory = '', deviceId = '' },
      } = echoServer;

      // Log 정보를 남길 Echo Server의 이름을 지정
      echoDataInfo = {
        echoData: _.isBuffer(echoData) ? echoData : JSON.stringify(echoData),
        echoName: `echoServer: ${mainCategory} ${subCategory} ${deviceId}`,
      };
    });

    return echoDataInfo;
  }

  /**
   * 요청한 대상에게 Echo Server 응답 데이터를 전송
   * @param {Socket} socket
   * @param {echoDataInfo} echoDataInfo
   */
  writeMsg(socket, echoDataInfo) {
    setTimeout(() => {
      const { echoData, echoName } = echoDataInfo;
      if (_.isEmpty(echoData) || _.isBoolean(echoData)) return;

      const logPath = `./log/echo/${this.siteId}/${BU.convertDateToText(
        new Date(),
        '',
        2,
      )}.log`;
      BU.appendFile(logPath, `${echoName} - echoData: ${echoData}`);
      socket.write(echoData);
    }, 0);
  }
}
module.exports = Control;

/**
 * @typedef {Object} echoDataInfo
 * @property {Buffer} echoData
 * @property {string} echoName
 */
