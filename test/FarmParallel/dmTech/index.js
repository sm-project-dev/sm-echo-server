const connectConfigList = require('./connectConfigList');
const SocketClient = require('./SocketClient');

// 설정에서 정의한 만큼 순회하면서 Socket Server 로 접속
connectConfigList.forEach(connectConfig => {
  const socketClient = new SocketClient(connectConfig.connectInfo);
  socketClient.setEchoServerFP(connectConfig.fp.protocolInfo, connectConfig.fp.deviceMap);
  socketClient.setEchoServerInverter(connectConfig.inverter.protocolList);
});
