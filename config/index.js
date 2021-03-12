// eslint-disable-next-line import/no-dynamic-require
let dynamicModule = {};
// const dynamicModule = require(`./${process.env.P_MAIN_ID}/${process.env.P_SUB_ID}.js`);

// 태양광 최적화
const solarIot = require('./ETC/solarIot');
// 농업병행태양광
const fp = require('./fp/fp');
// NI 컴프레셔
const compressor = require('./ni/compressor');
// 태양광 이모작
const grapeFarm = require('./S2W/grapeFarm');
// 태양열 제천
const first = require('./STP/first');
// 수중 태양광
const upsas = require('./UPSAS/upsas');
const smRooftop = require('./UPSAS/smRooftop');

switch (process.env.P_MAIN_ID) {
  case 'ETC':
    dynamicModule = solarIot;
    break;
  case 'FP':
    dynamicModule = fp;
    break;
  case 'ni':
    dynamicModule = compressor;
    break;
  case 'S2W':
    dynamicModule = grapeFarm;
    break;
  case 'STP':
    dynamicModule = first;
    break;
  case 'UPSAS':
    switch (process.env.P_SUB_ID) {
      case 'smRooftop':
        dynamicModule = smRooftop;
        break;
      default:
        dynamicModule = upsas;
        break;
    }
    break;

  default:
    break;
}

module.exports = dynamicModule;
