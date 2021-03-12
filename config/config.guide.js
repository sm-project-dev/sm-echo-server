/**
 * @typedef {Object} desConfig
 * @property {dbcConnConfig=} dbcConnConfig Passive Server 사용 시 작성
 * @property {echoConfig[]} echoConfigList Site 별 EchoServer 를 생성할 정보
 */

/**
 * @typedef {Object} dbcConnConfig
 * @property {string=} host dbc host
 * @property {string} port dbc port
 */

/**
 * @typedef {Object} echoConfig
 * @property {string} siteId Site 고유 ID
 * @property {string=} siteName Site 이름 (나주, 강진, 보성 ...)
 * @property {number} serverPort Echo Server Listening Port
 * @property {echoServerConfig[]} echoServerList Site 이름 (나주, 강진, 보성 ...)
 */

/**
 * @typedef {Object} echoServerConfig
 * @property {mDeviceMap} map
 * @property {protocol_info} protocolConfig
 * @property {mapConfig=} mapConfig
 */

/**
 * @typedef {Object} mapConfig
 * @property {string} projectId Map Main ID
 * @property {string} mapId Map Sub ID
 * @property {number=} simulatorPort 시뮬래이터 웹을 열 port. 없을 경우 echoConfig.serverPort + 500 처리
 */

module;
