const _ = require('lodash');
const net = require('net');

const { BU } = require('base-util-jh');

const {
  dpc: {
    BaseModel: { defaultModule },
  },
} = require('./module');

const Control = require('./Control');
// 프로젝트 별 사이트에서 사용하고 있는 Map 정보를 동적으로 불러오기 위함

const SimulatorApp = require('./SimulatorWeb/SimulatorApp');

class Main {
  constructor() {
    /** @type {Control[]} */
    this.serverList = [];
  }

  /**
   * 프로젝트 별 에코 서버 생성. DBC 접속 정보가 있다면 접속
   * @param {desConfig} desConfig
   */
  init(desConfig) {
    const { dbcConnConfig = {}, echoConfigList } = desConfig;
    // Site 단위 서버 생성
    this.createServer(echoConfigList);

    // DBC 접속 정보가 없다면 DBC 접속하지 않음
    if (!_.isNumber(dbcConnConfig.port)) return false;

    // 생성된 사이트 목록만큼 순회하면서 DBC에 접속 시도
    this.serverList.forEach(server => {
      const client = net.createConnection(dbcConnConfig);

      // const logPath = `./log/echo/${server.siteId}/${BU.convertDateToText(new Date(), '', 2)}.log`;

      // BU.CLI(logPath);

      client.on('data', data => {
        // BU.appendFile(logPath, `onData : ${data}`);

        const returnValue = this.dataParser(server, data);

        server.writeMsg(client, returnValue);

        // FIXME: Control 단에서 로깅하는 것으로 처리함. DBC에서도 커버할 수 있도록 바꿈. 테스트가 완료되었을 경우 삭제
        // if (!_.isEmpty(returnValue)) {
        //   BU.appendFile(logPath, `writeData : ${returnValue}`);
        //   // 1 초후 반환
        //   setTimeout(() => {
        //     client.write(returnValue);
        //   }, 0);
        // }
      });

      client.on('connect', () => {
        BU.CLI(`${server.getServerName()} connect DBC on`);
        this.client = client;
      });

      client.on('close', err => {
        this.hasCertification = false;
        this.client = {};
        BU.error(`${server.getServerName()} close DBC on`);
      });

      // client.on('end', () => {
      //   BU.log(`${server.getServerName()} end DBC on`);
      // });

      client.on('error', error => {
        console.error(error.message);
      });
    });
  }

  /**
   * Echo Server 반환
   * @param {string} echoServerId
   */
  getEchoServer(echoServerId) {
    return _.find(this.serverList, { siteId: echoServerId });
  }

  /**
   * 에코서버 구동 (사이트 단위 생성)
   * @param {echoConfig[]} echoConfigList
   */
  createServer(echoConfigList) {
    const serverList = echoConfigList.map(echoOption => {
      const { serverPort, parserInfo = {}, echoServerList } = echoOption;
      const control = new Control(serverPort, parserInfo, echoOption);

      echoServerList.forEach(echoServerConfing => {
        const {
          map = {},
          protocolConfig,
          mapConfig: {
            mapId = '',
            projectId = '',
            simulatorPort = serverPort + 1000,
          } = {},
        } = echoServerConfing;

        // 프로젝트 ID와 map Id 가 존재한다면 해당 map Path 지정
        const dMap = _.isEmpty(map) ? undefined : map;
        // console.dir(dMap);
        // mapId.length && projectId.length
        //   ? _.get(deviceMap, `${projectId}.${mapId}`)
        //   : undefined;

        const echoServer = control.attachEchoServer(protocolConfig, dMap);

        // 맵 정보가 존재할 경우 에코서버와 통신할 시뮬레이터 웹 구동
        if (mapId.length && projectId.length) {
          const simulatorEchoServer = Array.isArray(echoServer)
            ? echoServer[0]
            : echoServer;

          const simulatorWeb = new SimulatorApp(simulatorPort, simulatorEchoServer);
          simulatorWeb.init();
        }
      });

      return control;
    });
    // 추가 생성된 서버를 병합 >>> 중복 서버 제거 >>> serverList 정의
    this.serverList = _(this.serverList).concat(serverList).union().value();

    return this.serverList;
  }

  /**
   * DBC와 접속을 맺고 Default Wrapper를 사용할 경우 DBC와의 인증을 Site 단위로 처리하기 위함
   * 인증만 처리하고 나머지는 각 에코서버에 위임
   * @param {Control} server
   * @param {Buffer} bufData
   */
  dataParser(server, bufData) {
    // BU.CLIN(bufData);
    const CMD = String.fromCharCode(bufData.readIntBE(1, 1));
    // BU.CLI(CMD);
    let returnValue;
    switch (CMD) {
      case 'A':
        returnValue = defaultModule.encodingSimpleMsg(
          Buffer.concat([Buffer.from(`${CMD}${server.siteId}`)]),
        );
        break;
      default:
        break;
    }
    // 인증 요청이 아니므로 사이트를 관장하는 Server에게 Echo Server로 뿌리라고 요청
    if (returnValue === undefined) {
      return server.spreadMsg(bufData);
    }
    return returnValue;
  }
}
module.exports = Main;
