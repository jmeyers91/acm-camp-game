import * as PIXI from 'pixi.js';
import config from './config';
import flattenArray from './utils/flattenArray';
import syncSpriteCollection from './utils/syncSpriteCollection';
import Background from './sprites/Background';
import Moon from './sprites/Moon';
import SmallFire from './sprites/SmallFire';
import LargeFire from './sprites/LargeFire';
import Log from './sprites/Log';
import Trees from './sprites/Trees';
import Stick from './sprites/Stick';
import Fox from './sprites/Fox';
import * as Colyseus from 'colyseus.js';

const width = 800;
const height = 600;

export default class Game {
  width = width;
  height = height;
  app = new PIXI.Application({ width, height, antialias: true });
  assetPaths = flattenArray([
    Background.sources,
    Moon.sources,
    SmallFire.sources,
    LargeFire.sources,
    Log.sources,
    Trees.sources,
    Stick.sources,
    Fox.sources,
  ]);

  async load() {
    await new Promise(resolve => {
      for(let asset of this.assetPaths) {
        PIXI.loader.add(asset);
      }
      PIXI.loader.load(resolve);
    });
  }

  async connect() {
    return new Promise((resolve, reject) => {
      const client = new Colyseus.Client(config.gameServer);
      const room = client.join('camp');
      room.onJoin.addOnce(() => {
        if(room.state.ready) {
          resolve({ client, room });
        } else {
          room.listen('ready', change => {
            if(change.value === true) {
              resolve({ client, room });
            }
          });
        }
      });
      room.onError.addOnce(reject);
    });
  }

  showLargeFire() {
    this.smallFire.visible = false;
    this.largeFire.visible = true;
  }

  showSmallFire() {
    this.smallFire.visible = true;
    this.largeFire.visible = false;
  }

  async start() {
    await this.load();
    const { room } = await this.connect();
    const { app } = this;
    const { stage } = app;
    
    const send = (type, data) => room.send({ type, data });
    const addSprite = sprite => Array.isArray(sprite)
      ? sprite.forEach(addSprite)
      : app.stage.addChild(sprite);

    const removeSprite = sprite => Array.isArray(sprite)
      ? sprite.forEach(removeSprite)
      : app.stage.removeChild(sprite);

    Background({
      stage,
      width,
      height,
    });

    Moon({
      ...room.state.moon,
      stage,
      events: {
        click() {
          console.log('tap moon');
        },
      },
      sync: { room, path: 'moon' },
    });

    Fox({
      ...room.state.fox,
      stage,
      sync: { room, path: 'fox' },
    });

    SmallFire({
      ...room.state.smallFire,
      stage,
      sync: { room, path: 'smallFire' },
    });
  
    LargeFire({
      ...room.state.largeFire,
      stage,
      sync: { room, path: 'largeFire' },
    });

    // Static logs around the fire
    Log({ stage, x: room.state.smallFire.x - 100, y: room.state.smallFire.y - 50, scale: 0.6, variant: 0 });
    Log({ stage, x: room.state.smallFire.x - 50, y: room.state.smallFire.y - 50, scale: 0.6, variant: 1 });
    Log({ stage, x: room.state.smallFire.x, y: room.state.smallFire.y - 30, scale: 0.6, variant: 2 });

    // syncSpriteCollection(room, app.stage, 'players', Player);
    syncSpriteCollection(room, app.stage, 'logs', log => {
      const sprite = Log({
        ...log,
        events: {
          mousedown(event) {
            const { x, y } = event.data.global;
            const logId = log.id;
            const dragOffset = {
              x: sprite.x - x,
              y: sprite.y - y,
            };
            const dragOrigin = {
              x: sprite.x,
              y: sprite.y,
            };
            send('dragLog', { logId, dragOffset, dragOrigin });
          }
        }
      });
      return sprite;
    });

    syncSpriteCollection(room, app.stage, 'sticks', stick => {
      const sprite = Stick({
        ...stick,
        events: {
          mousedown(event) {
            const { x, y } = event.data.global;
            const stickId = stick.id;
            const dragOffset = {
              x: sprite.x - x,
              y: sprite.y - y,
            };
            const dragOrigin = {
              x: sprite.x,
              y: sprite.y,
            };
            send('dragStick', { stickId, dragOffset, dragOrigin });
          }
        },
      });

      Trees({
        stage,
        x: width * 0.8,
        y: height * 0.2,
        scale: 0.4,
      });

      return sprite;
    });

    stage.interactive = true;
    stage.on('mousemove', event => {
      const { x, y } = event.data.global;
      send('moveCursor', { x, y });
    });

    stage.on('mouseup', event => {
      const { x, y } = event.data.global;
      send('releaseCursor', { x, y });
    });

    return app.view;
  }
}

