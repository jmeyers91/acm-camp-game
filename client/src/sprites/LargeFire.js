import sprite from '../utils/sprite';

export default function LargeFire(options) {
  return sprite.animated(sources, options);
}

const sources = LargeFire.sources = [
  require('../assets/fire/large/1.png'),
  require('../assets/fire/large/2.png'),
  require('../assets/fire/large/3.png'),
];
