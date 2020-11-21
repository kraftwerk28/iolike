import { EntityType, Food, Player } from './entities';
import { Vec2 } from './';
import { serialize, parse } from './parser';
import { MessageType } from './types';

const player = new Player(
  10,
  Vec2.zero(),
  'Kiddie',
  Vec2.zero(),
  Vec2.zero(),
  0xff00ff,
  16
);
const food = new Food(Vec2.zero(), 10, 0xff00ff);

// test('Pack/unpack player', () => {
//   const unpacked = JSON.parse(JSON.stringify(player.pack()));
//   expect(unpacked).toEqual({
//     type: EntityType.Player,
//     pos: { x: 0, y: 0 },
//     size: 10,
//     username: 'Kiddie',
//     color: 0xff00ff,
//     vel: { x: 0, y: 0 },
//   });
// });

// test('Pack/unpack food', () => {
//   const unpacked = JSON.parse(JSON.stringify(food.pack()));
//   expect(unpacked).toEqual({
//     type: EntityType.Food,
//     pos: { x: 0, y: 0 },
//     size: 10,
//     color: 0xff00ff,
//   });
// });

test('serializing', () => {
  const serialized = serialize({
    type: MessageType.SyncEntities,
    data: [food, player],
  });
  expect(serialized.length).toBe(1 + 4 + 17 + 45);
  // serialize(MessageType.AuthReq)
  const parsed = parse(serialized);
  console.log(serialized);
  console.log(parsed);

  // expect(type).toBe(MessageType.SyncEntities);
  // expect(data[0]).toEqual(player);
  // expect(data[1]).toEqual(food);
});
