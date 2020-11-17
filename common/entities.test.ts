import { EntityType, Food, Player } from './entities';
import { Vec2 } from './utils';
import { serialize, parse } from './parser';
import { MessageType } from './types';

const player = new Player(Vec2.zero(), 10, 'Kiddie', 0xff00ff, Vec2.zero());
const food = new Food(Vec2.zero(), 10, 0xff00ff);

test('Pack/unpack player', () => {
  const unpacked = JSON.parse(JSON.stringify(player.pack()));
  expect(unpacked).toEqual({
    type: EntityType.Player,
    pos: { x: 0, y: 0 },
    size: 10,
    username: 'Kiddie',
    color: 0xff00ff,
    vel: { x: 0, y: 0 },
  });
});

test('Pack/unpack food', () => {
  const unpacked = JSON.parse(JSON.stringify(food.pack()));
  expect(unpacked).toEqual({
    type: EntityType.Food,
    pos: { x: 0, y: 0 },
    size: 10,
    color: 0xff00ff,
  });
});

test('serializing', () => {
  const serialized = serialize({
    type: MessageType.EntityMap,
    data: [player, food],
  });
  // serialize(MessageType.AuthReq)
  const { type, data } = parse(serialized);
  expect(type).toBe(MessageType.EntityMap);
  expect(data[0]).toEqual(player);
  expect(data[1]).toEqual(food);
});
