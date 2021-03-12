import Control from './src/Control';
import AbstModel from './src/EchoServer/Default/AbstModel';

declare global {
  const Control: Control;
  const AbstModel: AbstModel;
}
