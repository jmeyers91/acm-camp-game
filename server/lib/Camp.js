const { Room } = require('colyseus');

const getClientId = client => `${client.id}_${client.sessionId}`;

const width = 800;
const height = 600;

const second = 1000;
const minute = second * 60;

const clamp = (value, min, max) => Math.max(Math.min(value, max), min);
const getDistance = (p1, p2) => {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt((dx * dx) + (dy * dy));
};
const stickRotation = () => Math.random() * Math.PI * 0.03 * (Math.random() > 0.5 ? -1 : 1);

const messageMethods = new Set([
  'moveCursor',
  'releaseCursor',
  'dragLog',
  'dragStick',
]);

module.exports = class Camp extends Room {
  onInit() {
    const fireProps = {
      x: width * 0.5,
      y: height * 0.95,
      animationSpeed: 0.1,
      anchor: 'bottom',
      scale: 1,
    };
    const sticksX = 220;
    const sticksY = 390;

    this.setState({
      width,
      height,
      ready: true,
      logDrags: {},
      stickDrags: {},
      players: {},
      moon: {
        width: width / 10,
        height: width / 10,
        x: width * 0.1,
        y: width * 0.1,
        rotation: 0,
        anchor: 'center'
      },
      fox: {
        x: 0,
        y: height * 0.81,
        anchor: {
          x: 0.92,
          y: 0.258,
        },
        scale: 0.4,
        out: true,
        outX: width * 0.15,
        inX: width * -0.05,
        speed: 200,
      },
      fireValue: 0,
      fireDecay: 8,
      fireTheshold: 200,
      showingLargeFire: false,
      smallFire: fireProps,
      logCooldown: 5 * second,
      largeFire: { ...fireProps, hidden: true },
      logs: {
        '1': {id: 1, cooldown: 0, initialX: 580, initialY: 475, x: 580, y: 475, scale: 0.5},
        '2': {id: 2, cooldown: 0, initialX: 580, initialY: 500, x: 580, y: 500, scale: 0.5, variant: 1},
        '3': {id: 3, cooldown: 0, initialX: 600, initialY: 550, x: 600, y: 550, scale: 0.5, variant: 2},
      },
      sticks: {
        '1': {
          id: 1,
          initialX: sticksX + 30,
          cookTime: 0,
          initialY: sticksY,
          x: sticksX + 30,
          y: sticksY,
          scale: 0.4,
          rotation: stickRotation(),
          marshmallowCooldown: 0,
          children: {
            stick: {
              rotation: 0
            },
            marshmallow: {
              scale: 0.7,
            }
          },
        },
        '2': {
          id: 2,
          initialX: sticksX + 50,
          cookTime: 0,
          initialY: sticksY,
          x: sticksX + 50,
          y: sticksY,
          scale: 0.4,
          rotation: stickRotation(),
          marshmallowCooldown: 0,
          children: {
            stick: {
              rotation: 0
            },
            marshmallow: {
              scale: 0.7,
            }
          },
        },
        '3': {
          id: 3,
          initialX: sticksX + 70,
          cookTime: 0,
          initialY: sticksY,
          x: sticksX + 70,
          y: sticksY,
          scale: 0.4,
          rotation: stickRotation(),
          marshmallowCooldown: 0,
          children: {
            stick: {
              rotation: 0
            },
            marshmallow: {
              scale: 0.7,
            }
          },
        },
      },
    });

    this.setSimulationInterval(this.loop.bind(this));
  }

  loop(dt) {
    const { moon, logs, sticks, smallFire, fireValue, fireDecay, logDrags, stickDrags, fox } = this.state;
    const now = Date.now();
    const speed = 1;
    const seconds = dt / 1000;

    if(moon.reversed) {
      moon.x -= speed * seconds;
      moon.rotation -= Math.PI / 100 * seconds;
      if(moon.x < -moon.width) moon.reversed = false;
    } else {
      moon.x += speed * seconds;
      moon.rotation += Math.PI / 100 * seconds;
      if(moon.x > (width + moon.width)) moon.reversed = true;
    }

    // Handle log dragging
    for(let [playerId, drag] of Object.entries(logDrags)) {
      if(now - drag.startTime > (1000 * 5)) {
        const log = this.getLogById(drag.logId);
        delete logDrags[playerId];
        this.resetSprite(log);
      }
    }

    // Handle stick dragging
    for(let [playerId, drag] of Object.entries(stickDrags)) {
      const stick = this.getStickById(drag.stickId);

      if(getDistance(stick, smallFire) < 100) {
        stick.cookTime += dt;
        if(stick.cookTime > 5000) {
          stick.children.marshmallow.texture = 'burned';
        } else if(stick.cookTime > 3000) {
          stick.children.marshmallow.texture = 'cooked';
        }
      } else if(fox.out && getDistance(stick, fox) < 20) {
        fox.out = false;
        stick.children.marshmallow.hidden = true;
        stick.marshmallowCooldown = 3000;
      }
    }

    // Handle log respawn timer after being burned
    for(let log of Object.values(logs)) {
      if(log.cooldown > 0) {
        log.cooldown = Math.max(0, log.cooldown - dt);
        if(log.cooldown === 0) {
          this.respawnLog(log);
        }
      }
    }

    // Handle marshmallow respawning after eaten by fox
    for(let stick of Object.values(sticks)) {
      if(stick.marshmallowCooldown > 0) {
        stick.marshmallowCooldown = Math.max(0, stick.marshmallowCooldown - dt);
        if(stick.marshmallowCooldown === 0) {
          stick.children.marshmallow.hidden = false;
        }
      } else if(stick.children.marshmallow.texture === 'cooked') {
        fox.out = true;
      }
    }

    // Handle fire dwindling when not fed wood
    if(fireValue > 0) {
      this.state.fireValue = Math.max(0, fireValue - (fireDecay * seconds));
      const { fireTheshold, showingLargeFire } = this.state;
      if(this.state.fireValue < fireTheshold && showingLargeFire) {
        this.showSmallFire();
      }
      
      this.state.smallFire.scale = 1 + (fireValue / fireTheshold) * 0.5;
    }

    // Handle fox tweening
    if(fox.out && fox.x < fox.outX) {
      fox.x = Math.min(fox.outX, fox.x + (fox.speed * seconds));
    } else if(!fox.out && fox.x > fox.inX) {
      fox.x = Math.max(fox.inX, fox.x - (fox.speed * seconds));
    }
  }

  moveCursor(player, { x, y }) {
    x = clamp(x, 0, width);
    y = clamp(y, 0, height);
    player.x = x;
    player.y = y;
    const logDrag = this.state.logDrags[player.id];
    const stickDrag = this.state.stickDrags[player.id];

    if(logDrag) {
      const log = this.state.logs[logDrag.logId];
      if(log) {
        log.x = logDrag.dragOffset.x + x;
        log.y = logDrag.dragOffset.y + y;
      }
    } else if(stickDrag) {
      const stick = this.state.sticks[stickDrag.stickId];
      if(stick) {
        stick.x = stickDrag.dragOffset.x + x;
        stick.y = stickDrag.dragOffset.y + y;
      }
    }
  }

  releaseCursor(player, { x, y }) {
    x = clamp(x, 0, width);
    y = clamp(y, 0, height);
    player.x = x;
    player.y = y;
    const logDrag = this.state.logDrags[player.id];
    const stickDrag = this.state.stickDrags[player.id];

    if(logDrag) {
      const { logId } = logDrag;
      const { smallFire } = this.state;
      const log = this.state.logs[logId];
      delete this.state.logDrags[player.id];

      const distance = getDistance(log, smallFire);
      if(distance < 100) {
        this.burnLog(log);
      }
      this.resetSprite(log);
    } else if(stickDrag) {
      const { sticks } = this.state;
      const { stickId } = stickDrag;
      const stick = sticks[stickId];
      this.resetSprite(stick);
      delete this.state.stickDrags[player.id];
    }
  }

  dragLog(player, { logId, dragOffset, dragOrigin }) {
    const log = this.state.logs[logId];
    if(!log) return;
    const playerId = player.id;
    const position = { ...dragOrigin };
    this.state.logDrags[playerId] = {
      logId,
      playerId,
      position,
      dragOffset,
      dragOrigin,
      startTime: Date.now(),
    };
  }

  dragStick(player, { stickId, dragOffset, dragOrigin }) {
    const stick = this.state.sticks[stickId];
    if(!stick) return;
    const playerId = player.id;
    const position = { ...dragOrigin };
    this.state.stickDrags[playerId] = {
      stickId,
      playerId,
      position,
      dragOffset,
      dragOrigin,
      startTime: Date.now(),
    };
  }

  showLargeFire() {
    this.state.showingLargeFire = true;
    this.state.smallFire.hidden = true;
    this.state.largeFire.hidden = false;
  }

  showSmallFire() {
    this.state.showingLargeFire = false;
    this.state.smallFire.hidden = false;
    this.state.largeFire.hidden = true;
  }

  burnLog(log) {
    this.state.fireValue += 100;

    log.cooldown = this.state.logCooldown;
    log.hidden = true;
    this.resetSprite(log);

    const { fireValue, fireTheshold, smallFire } = this.state;
    if(fireValue >= fireTheshold) {
      this.showLargeFire();
    } else {
      this.showSmallFire();
    }
  }

  respawnLog(log) {
    log.hidden = false;
  }

  resetSprite(sprite) {
    sprite.x = sprite.initialX;
    sprite.y = sprite.initialY;
  }

  // When client successfully join the room
  onJoin(client) {
    this.addPlayer(client);
  }

  onLeave(client) {
    this.removePlayer(client);
  }

  onMessage(client, message) {
    const player = this.getPlayer(client);
    const { type, data } = message;
    if(messageMethods.has(type)) {
      this[type](player, data);
    } else {
      console.log(`Unknown message type "${type}"`, message);
    }
  }

  addPlayer(client) {
    const id = getClientId(client);
    const player = {
      id,
      x: 0,
      y: 0,
    };
    this.state.players[id] = player;
    return player;
  }

  removePlayer(client) {
    const id = getClientId(client);
    delete this.state.players[id];
  }

  getPlayer(client) {
    const id = getClientId(client);
    const player = this.state.players[id];
    return player || this.addPlayer(client);
  }

  getLogById(logId) {
    return this.state.logs[logId];
  }

  getStickById(stickId) {
    return this.state.sticks[stickId];
  }
}