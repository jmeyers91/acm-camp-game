// Allow direction strings like 'top left', 'right', 'center' to be used as anchor values

const anchors = {
  'top left': { x: 0, y: 0 },
  'top': { x: 0.5, y: 0 },
  'top right': { x: 1, y: 0 },
  'right': { x: 1, y: 0.5 },
  'bottom right': { x: 1, y: 1 },
  'bottom': { x: 0.5, y: 1 },
  'bottom left': { x: 0, y: 1 },
  'left': { x: 0, y: 0.5 },
  'center': { x: 0.5, y: 0.5 },
};

export default function directionAnchor(anchor) {
  if(typeof anchor === 'object') return anchor;
  if(anchors[anchor]) return anchors[anchor];
  throw new Error('Invalid anchor value ' + anchor);
}