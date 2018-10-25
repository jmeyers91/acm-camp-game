import sprite from '../utils/sprite';

export default function Background(options) {
  return sprite(source, options);
}

const sources = Background.sources = [ require('../assets/background.png') ];
const [ source ] = sources;
