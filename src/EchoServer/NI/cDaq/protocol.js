const { dpc } = require('../../../module');

const {
  BaseModel: { NI: Model },
} = dpc;

const { BASE_KEY: BK } = Model;

const onDeviceOperationStatus = {
  // VOLTAGE
  PXM309: (absPressure, toFixed) => {
    // 현재 Voltage가 장치 구간에서 위치하는
    return Model.cRangeRateToNum(
      Model.cNumToRangeRate(absPressure, 0.35, 20),
      0,
      10,
      toFixed,
    );
  },
  // RELAY
  [BK.valve]: {
    CLOSE: 0,
    OPEN: 1,
  },
  [BK.compressor]: {
    OFF: 0,
    ON: 1,
  },
};
exports.onDeviceOperationStatus = onDeviceOperationStatus;
