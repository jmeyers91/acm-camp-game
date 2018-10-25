import sprite from '../utils/sprite';

export default function Stick(options) {
  const stickSource = stickSources[0];
  const marshmallowSource = marshmallowSources[0];

  return sprite.group({
    stick: sprite(stickSource, options.children.stick),
    marshmallow: sprite(marshmallowSource, {
      ...options.children.marshmallow,
      x: 13,
      y: -5,
      anchor: 'center',
      texture: 'uncooked',
      textures: {
        uncooked: marshmallowSources[0],
        cooked: marshmallowSources[1],
        burned: marshmallowSources[2],
      },
    }),
  }, options);
}

const stickSources = [
  require('../assets/stick_a.png'),
  require('../assets/stick_b.png'),
];

const marshmallowSources = [
  require('../assets/marsh/cooking/1.png'),
  require('../assets/marsh/cooking/2.png'),
  require('../assets/marsh/cooking/3.png'),
];

Stick.sources = [ 
  ...stickSources,
  ...marshmallowSources,
];
