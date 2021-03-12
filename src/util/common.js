const _ = require('lodash');

const { BU } = require('base-util-jh');

module.exports = {
  /**
   * @param {mDeviceMap} deviceMap
   * @return {mDeviceMap}
   */
  setRepeatNode(deviceMap = {}) {
    // BU.CLIN(deviceMap)
    const { setInfo = {}, relationInfo: { placeRelationList = [] } = {} } = deviceMap;

    const {
      dataLoggerStructureList = [],
      nodeStructureList = [],
      repeatNodeList = [],
    } = setInfo;

    // 노드 목록 repeatNodeList 반영
    nodeStructureList.forEach(nodeClassInfo => {
      nodeClassInfo.defList.forEach(nodeDefInfo => {
        const { repeatId = '' } = nodeDefInfo;
        // repeatId가 있을 경우
        if (repeatId.length) {
          const fountDefInfo = _.find(repeatNodeList, {
            repeatId,
            repeatCategory: 'node',
          });
          if (fountDefInfo !== undefined) {
            nodeDefInfo.nodeList = fountDefInfo.nodeList;
          }
          // delete nodeDefInfo.repeatId;
        }
      });
    });

    // 데이터 로거 재구성
    dataLoggerStructureList.forEach(dataLoggerDefInfo => {
      dataLoggerDefInfo.dataLoggerDeviceList.forEach(dataLoggerInfo => {
        const { repeatId = '', target_code: uniqNumber = '' } = dataLoggerInfo;
        // repeatId가 있을 경우
        if (repeatId.length) {
          const prefixNodeList = _.find(repeatNodeList, {
            repeatId,
            repeatCategory: 'prefix',
          }).nodeList;

          dataLoggerInfo.nodeList = prefixNodeList.map(
            prefix => `${prefix}_${uniqNumber}`,
          );

          // delete dataLoggerInfo.repeatId;
        }
      });
    });

    // 장소 재구성
    placeRelationList.forEach(placeClassInfo => {
      placeClassInfo.defList.forEach(placeDefInfo => {
        const { placeList = [] } = placeDefInfo;
        placeList.forEach(placeInfo => {
          const {
            repeatId = '',
            target_code: uniqNumber = '',
            nodeList = [],
          } = placeInfo;
          // repeatId가 있을 경우
          if (repeatId.length) {
            const prefixNodeList = _.find(repeatNodeList, {
              repeatId,
              repeatCategory: 'prefix',
            }).nodeList;

            // 반복해서 추가할 node 구성
            const addNodeList = prefixNodeList.map(prefix => `${prefix}_${uniqNumber}`);

            // 설정한 nodeList 에 동적으로 생성된 nodeList를 붙임
            placeInfo.nodeList = _.concat(nodeList, addNodeList);

            // delete placeInfo.repeatId;
          }
        });
      });
    });

    return deviceMap;
  },

  /**
   * @param {mDeviceMap} deviceMap
   * @return {detailNodeInfo[]}
   */
  makeNodeList: deviceMap => {
    const returnList = [];

    const { setInfo, relationInfo: { placeRelationList = [] } = {} } = deviceMap;

    const {
      dataLoggerStructureList = [],
      nodeStructureList = [],
      repeatNodeList = [],
    } = setInfo;

    nodeStructureList.forEach(nClassInfo => {
      const {
        defList: nodeDefList = [],
        is_sensor: isSensor = 1,
        target_id: ncId,
        target_name: ncName,
        data_unit: dataUnit,
        operationStatusList = [],
      } = nClassInfo;

      // 단순 표기를 위한 node는 제외
      if (isSensor < 0) return false;
      // 노드 개요 목록 순회
      nodeDefList.forEach(nDefInfo => {
        const {
          nodeList = [],
          target_id: ndId,
          target_prefix: ndPrefix,
          target_name: ndName = ncName,
          repeatId,
        } = nDefInfo;

        // repeatId가 있을 경우에는 무시
        if (repeatId) return false;
        // 노드 목록 순회
        nodeList.forEach(nodeInfo => {
          const {
            target_code: nCode,
            target_name: nName,
            data_logger_index: dlIdx = 0,
            data_index: dIdx = 0,
            node_type: nType,
            modbusInfo,
          } = nodeInfo;

          // 노드 ID 정의
          const nodeId = `${ndPrefix}${nCode ? `_${nCode}` : ''}`;

          /** @type {detailNodeInfo} */
          const detailNodeInfo = {
            classId: ncId,
            className: ncName,
            defId: ndId,
            defName: ndName,
            isSensor,
            targetCode: nCode,
            dlIdx,
            dIdx,
            nodeType: nType,
            nodeId,
            data: null,
            modbusInfo,
          };

          returnList.push(detailNodeInfo);
        });
      });
    });
    return returnList;
  },
  /**
   * @param {mDeviceMap} deviceMap
   * @return {detailDataloggerInfo[]}
   */
  makeDataLoggerList: (deviceMap = {}) => {
    const { setInfo, relationInfo: { placeRelationList = [] } = {} } = deviceMap;

    const {
      dataLoggerStructureList,
      nodeStructureList = [],
      repeatNodeList = [],
    } = setInfo;

    /** @type {detailDataloggerInfo[]} */
    const returnList = [];
    // 데이터 로거 대분류 구조 순회
    dataLoggerStructureList.forEach(dLClassInfo => {
      const {
        dataLoggerDeviceList = [],
        target_name: className,
        target_prefix: prefix,
      } = dLClassInfo;
      // 데이터 로거 장치 목록 순회
      dataLoggerDeviceList.forEach(dlDeviceInfo => {
        const {
          repeatId,
          target_code: dlDeviceCode,
          serial_number: serialNumber,
          nodeList = [],
        } = dlDeviceInfo;
        // repeatId가 있을 경우에는 무시
        if (repeatId) return false;

        let dataLoggerId = prefix;
        if (dlDeviceCode.length) {
          dataLoggerId += `_${dlDeviceCode}`;
        }

        const detailDataloggerInfo = {
          className,
          prefix,
          dataLoggerId,
          serialNumber,
          nodeList,
        };
        returnList.push(detailDataloggerInfo);
      });
    });
    return returnList;
  },
};
