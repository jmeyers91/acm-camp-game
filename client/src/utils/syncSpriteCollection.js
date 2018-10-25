import removeFromArray from './removeFromArray';

export default function syncSpriteCollection(room, stage, collectionKey, render) {
  const initialValues = room.state[collectionKey]
    ? Object.entries(room.state[collectionKey])
    : [];
  const sprites = [];

  const add = (id, model) => {
    const sprite = render({
      id,
      ...model,
      sync: { room, path: `${collectionKey}/${id}` }
    });
    sprites.push(sprite);
    stage.addChild(sprite);
  };

  const remove = modelId => {
    const sprite = sprites.find(sprite => sprite.modelId === modelId);
    if(!sprite) return;
    sprite.removeAllListeners();
    removeFromArray(sprites, sprite);
    stage.removeChild(sprite);
  };

  room.listen(`${collectionKey}/:modelId`, change => {
    const { modelId } = change.path;
    if(change.operation === 'add') {
      add(modelId, change.value);
    } else if(change.operation === 'remove') {
      remove(modelId);
    }
  });

  initialValues.forEach(([id, model]) => add(id, model));

  return { sprites, add, remove };
};
