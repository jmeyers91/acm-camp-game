import sprite from '../utils/sprite';

export default function Log(options) {
  const source = (options.variant != null && sources[options.variant]) || sources[0];
  return sprite(source, options);
}

const sources = Log.sources = [ 
  require('../assets/log_a.png'),
  require('../assets/log_b.png'),
  require('../assets/log_c.png'),
];
