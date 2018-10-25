import sprite from '../utils/sprite';

export default function Fox(options) {
  return sprite(source, options);
}

const sources = Fox.sources = [ require('../assets/fawkes_side.png') ];
const [ source ] = sources;
