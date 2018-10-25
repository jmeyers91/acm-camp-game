import { Sprite, Container, Texture, loader, extras } from 'pixi.js';
import directionAnchor from './directionAnchor';

const { AnimatedSprite } = extras;

const spriteSetter = key => (sprite, value) => { sprite[key] = value; };

// Handlers for individual sprite fields that can be changed through `sprite.updateState`
// example.
// `sprite.updateState({ x: 10, hidden: true })` will call the `x` and `hidden` handlers on the sprite
const spriteOptionHandlers = {
  id: spriteSetter('modelId'),
  width: spriteSetter('width'),
  height: spriteSetter('height'),
  x: spriteSetter('x'),
  y: spriteSetter('y'),
  visible: spriteSetter('visible'),
  interactive: spriteSetter('interactive'),
  rotation: spriteSetter('rotation'),

  stage(sprite, stage) {
    stage.addChild(sprite);
  },

  scale(sprite, value) {
    if(typeof value === 'number') value = { x: value, y: value };
    sprite.scale.x = value.x;
    sprite.scale.y = value.y;
  },

  hidden(sprite, value) {
    sprite.visible = !value;
  },

  events(sprite, events) {
    sprite.interactive = true;
    for(let [ eventId, callback ] of Object.entries(events)) {
      sprite.on(eventId, callback);
    }
  },

  anchor(sprite, anchor) {
    anchor = directionAnchor(anchor);
    sprite.anchor.x = anchor.x;
    sprite.anchor.y = anchor.y;
  },

  texture(sprite, textureId) {
    const texture = sprite.textureMap[textureId];
    sprite.texture = texture;
  },

  sync(sprite, { room, path }) {
    // Listen for attribute changes
    room.listen(`${path}/:key`, change => {
      const { value } = change;
      const { key } = change.path;
      sprite.updateState({
        [key]: value,
      });
    });
  },
};

// Handlers for animated sprites
const animatedSpriteOptionHandlers = {
  ...spriteOptionHandlers,
  animationSpeed: spriteSetter('animationSpeed'),
};

// Handlers for sprite groups
const spriteGroupOptionHandlers = {
  ...spriteOptionHandlers,
  sync(sprite, { room, path }, { sprites }) {
    // Listen for attribute changes
    room.listen(`${path}/:key`, change => {
      const { value } = change;
      const { key } = change.path;
      sprite.updateState({
        [key]: value,
      });
    });

    // Listen for child sprite state changes
    room.listen(`${path}/children/:childId/:key`, change => {
      const { value } = change;
      const { key, childId } = change.path;
      const sprite = sprites[childId];
      if(sprite) {
        sprite.updateState({ [key]: value });
      }
    });
  },
};

function applyOptions(sprite, options, handlers) {
  for(let key in options) {
    const handler = handlers[key];
    if(handler) {
      handler(sprite, options[key], options);
    }
  }
  return sprite;
}

function resolveTextures(sources) {
  if(!sources) return sources;
  const textures = {};
  for(let [ key, source ] of Object.entries(sources)) {
    textures[key] = Texture.fromImage(source);
  }
  return textures;
}

function sprite(source, options) {
  if(!loader.resources[source]) throw new Error(`${source} resource not found. Did you load it?`);
  const spriteInstance = new Sprite(loader.resources[source].texture);
  spriteInstance.textureMap = resolveTextures(options.textures);
  applyOptions(
    spriteInstance,  
    options,
    spriteOptionHandlers,
  );

  spriteInstance.updateState = options => applyOptions(spriteInstance, options, spriteOptionHandlers);
  return spriteInstance;
}

function animatedSprite(sources, options) {
  const { autoplay=true } = options;
  const spriteInstance = new AnimatedSprite.fromFrames(sources);
  spriteInstance.textureMap = resolveTextures(options.textures);
  applyOptions(
    spriteInstance,
    options,
    animatedSpriteOptionHandlers,
  );

  spriteInstance.updateState = options => applyOptions(spriteInstance, options, animatedSpriteOptionHandlers);
  if(autoplay) spriteInstance.play();
  return spriteInstance;
};

function spriteGroup(sprites, options) {
  const container = new Container();
  container.textureMap = resolveTextures(options.textures);
  options = {...options, sprites};

  for(let sprite of Object.values(sprites)) {
    container.addChild(sprite);
  }
  const instance = applyOptions(
    container,
    options,
    spriteGroupOptionHandlers,
  );
  instance.updateState = options => applyOptions(container, options, spriteGroupOptionHandlers);
  return instance;
}

sprite.animated = animatedSprite;
sprite.group = spriteGroup;

export default sprite;
