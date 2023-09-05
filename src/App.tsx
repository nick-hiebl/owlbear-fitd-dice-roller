import { useCallback, useEffect, useState } from 'react';

import OBR, { buildCurve, buildPath, buildShape, buildText, Curve, isShape, Item, Shape, Text, Vector2 } from '@owlbear-rodeo/sdk';

import './App.css';

const METADATA_PREFIX = 'jumpoy-extension-clocks';
const TAGGED_KEY = `${METADATA_PREFIX}/clock`;
const CHILD_TAG = `${METADATA_PREFIX}/child`;
const MAX_TAG = `${METADATA_PREFIX}/max`;
const CURR_TAG = `${METADATA_PREFIX}/current`;
const LABEL_TAG = `${METADATA_PREFIX}/label`;
const SHAPE_TAG = `${METADATA_PREFIX}/shape`;

const DICE_COUNTS = [0, 1, 2, 3, 4, 5, 6];

// const incrementClockBy = (item: Item, increment: number, itemList: Item[]) => {
//   const child = itemList.find(i => i.id === item.metadata[CHILD_TAG]);
//   const numerator = item.metadata[CURR_TAG] as number;
//   const denominator = item.metadata[MAX_TAG] as number;

//   const nextNumerator = Math.min(Math.max(numerator + increment, 0), denominator);

//   if (!child) {
//     return;
//   }

//   const text = child as Text;

//   const shapeId: string | undefined = item.metadata[SHAPE_TAG] as string;
//   const shape = shapeId ? itemList.find(i => i.id === shapeId) : undefined;

//   if (!shape) {
//     const shape = buildCurve()
//       .attachedTo(item.id)
//       .points(shapePoints(130, nextNumerator, denominator, item.position))
//       .fillColor('blue')
//       .fillOpacity(1)
//       .strokeOpacity(0)
//       .tension(0)
//       .locked(true)
//       .disableHit(true)
//       .build();
    
//     item.metadata[SHAPE_TAG] = shape.id;

//     OBR.scene.items.addItems([shape]);
//   }

//   const itemsToUpdate = [item, text];
//   if (shape) itemsToUpdate.push(shape);

//   return OBR.scene.items.updateItems(itemsToUpdate, nodes => {
//     const [itemNode, textNode, shapeNode] = nodes;

//     itemNode.metadata[CURR_TAG] = nextNumerator;
//     itemNode.metadata[MAX_TAG] = denominator;
//     (textNode as Text).text.plainText = `${nextNumerator} / ${denominator}`;

//     if (shapeNode) {
//       (shapeNode as Curve).points = shapePoints(130, nextNumerator, denominator, item.position);
//     }
//   });
// };

// OBR.onReady(() => {
//   OBR.contextMenu.create({
//     id: `${METADATA_PREFIX}/context-menu/plus`,
//     icons: [
//       {
//         icon: '/icon.svg',
//         label: 'Increment',
//         filter: {
//           every: [{ key: `metadata.${TAGGED_KEY}`, value: 'clock' }],
//         },
//       }
//     ],
//     onClick: async (context) => {
//       const allItems = await OBR.scene.items.getItems();

//       await Promise.all(context.items.map(async item => {
//         return incrementClockBy(item, 1, allItems);
//       }));
//     },
//   });

//   OBR.contextMenu.create({
//     id: `${METADATA_PREFIX}/context-menu/minus`,
//     icons: [
//       {
//         icon: '/icon.svg',
//         label: 'Decrement',
//         filter: {
//           every: [{ key: `metadata.${TAGGED_KEY}`, value: 'clock' }],
//         },
//       }
//     ],
//     onClick: async (context) => {
//       const allItems = await OBR.scene.items.getItems();

//       await Promise.all(context.items.map(async item => {
//         return incrementClockBy(item, -1, allItems);
//       }));
//     },
//   });
// });

const shapePoints = (radius: number, current: number, max: number, parentPosition: Vector2): Vector2[] => {
  if (current === 0) {
    return [];
  }

  const points = [{ x: 0, y: 0 }, { x: 0, y: -radius }];

  for (let i = 0.125; i <= current; i += 0.125) {
    const angle = 2 * Math.PI * i / max;
    points.push({ x: Math.sin(angle) * radius, y: -Math.cos(angle) * radius });
  }

  points.push({ x: 0, y: 0 });

  return points.map(({ x, y }) => ({ x: x + parentPosition.x, y: y + parentPosition.y }));
};

const makeTextNode = (text: string, parentId: string, width: number) => {
  return buildText()
    .attachedTo(parentId)
    .plainText(text)
    // .zIndex(newItem.zIndex + 1)
    .textAlign('CENTER')
    .textAlignVertical('MIDDLE')
    .strokeColor('black')
    .strokeWidth(2)
    .strokeOpacity(1)
    .fillColor('white')
    .fontWeight(1000)
    .textType('PLAIN')
    .fontSize(48)
    .locked(true)
    .disableHit(true)
    .width(width)
    .height(60)
    .position({ x: -width / 2, y: -30 })
};

function App() {
  const [diceCount, setDiceCount] = useState(0);
  const [result, setResult] = useState<number[]>([]);
  const [score, setScore] = useState('');

  const [shaking, setShaking] = useState(false);

  const numberOfDice = diceCount === 0 ? 2 : diceCount;

  useEffect(() => {
    setResult(new Array(numberOfDice).fill(0));
    setScore('');
  }, [diceCount, numberOfDice]);

  const roll = useCallback(async () => {
    const newResult = new Array(numberOfDice)
      .fill(0)
      .map(() => Math.floor(Math.random() * 6) + 1);

    let score = Math.max(...newResult).toString();

    if (diceCount <= 0) {
      score = Math.min(...newResult).toString();
    } else if (newResult.filter(n => n === 6).length >= 2) {
      score = '6, 6';
    }

    setScore(score);
    setResult(newResult);
    setShaking(true);

    if (OBR.isReady) {
      OBR.notification.show(`${await OBR.player.getName()} just rolled: ${score} on ${diceCount}d (${newResult.join(', ')})`, 'INFO');
    }
  }, [diceCount, numberOfDice]);

  // const addItem = useCallback(async () => {
  //   if (OBR.isReady) {
  //     const newItem = buildShape()
  //       .width(300)
  //       .height(300)
  //       .shapeType('CIRCLE')
  //       .strokeColor('black')
  //       .strokeWidth(3)
  //       .fillColor('white')
  //       .build();

  //     newItem.metadata[TAGGED_KEY] = 'clock';
  //     newItem.metadata[CURR_TAG] = 0;
  //     newItem.metadata[MAX_TAG] = 6;

  //     console.log('New item', newItem.metadata, newItem.metadata[MAX_TAG]);

  //     const newText = makeTextNode('0 / 6', newItem.id, 200)
  //       .fontSize(40)
  //       .position({ x: -100, y: 160 })
  //       .build();

  //     newItem.metadata[CHILD_TAG] = newText.id;

  //     const headerText = makeTextNode('Clock for my 3 thing', newItem.id, 600)
  //       .fontSize(40)
  //       .position({ x: -300, y: -220 })
  //       .build();

  //     console.log(headerText.text.style, headerText.position);

  //     newItem.metadata[LABEL_TAG] = headerText.id;

  //     OBR.scene.items.addItems([newItem, newText, headerText]);

  //     console.log((await OBR.scene.items.getItems()).length);

  //     // OBR.scene.items.deleteItems((await OBR.scene.items.getItems()).map(i => i.id))
  //   }
  // }, []);

  return (
    <div className="App">
      <header className="App-header">
        <div className="diceOptions">
          {DICE_COUNTS.map(num => (
            <button
              className={`diceCount ${num === diceCount ? 'selected' : ''}`}
              key={num}
              onClick={() => setDiceCount(num)}
            >
              {num}
            </button>
          ))}
        </div>
        <div className="diceRow">
          {result.map((num, index) => (
            <div className={`die ${shaking ? 'jitter' : ''}`} key={index}>
              {num || ''}
            </div>
          ))}
        </div>
        <button className="rollButton" onClick={roll}>Roll</button>
        {/* <button className="rollButton" onClick={addItem}>Make item</button> */}
        <h2 className={shaking ? 'jitter' : ''} onAnimationEnd={() => setShaking(false)}>
          {score || 'Not rolled yet'}
        </h2>
      </header>
    </div>
  );
}

export default App;
