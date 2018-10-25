import sprite from '../utils/sprite';

export default function Moon(options) {
  return sprite(source, options);
}

const sources = Moon.sources = [ require('../assets/moon.png') ];
const [ source ] = sources;
