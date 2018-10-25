import sprite from '../utils/sprite';

export default function SmallFire(options) {
  return sprite.animated(sources, options);
}

const sources = SmallFire.sources = [
  require('../assets/fire/small/1.png'),
  require('../assets/fire/small/2.png'),
  require('../assets/fire/small/3.png'),
];
