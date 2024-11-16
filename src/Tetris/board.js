import React, { memo, useEffect, useRef, useState } from "react";
import { randomShape } from "./shapeFactory";

export const ROW_COUNT = 20;
export const COLUMN_COUNT = 10;

function createEmptyScene() {
  return Array.from(Array(ROW_COUNT), () => Array(COLUMN_COUNT).fill(0));
}
function copyScene(scene) {
  return scene.map((row) => row.slice());
}
function mergeIntoStage(stage, shape, position) {
  let res = stage;

  shape.shape.forEach((point) => {
    const x = point.x + position.x;
    const y = point.y + position.y;

    if (x < 0 || y < 0 || x >= COLUMN_COUNT || y >= ROW_COUNT) {
      return;
    }

    res = updateStage(res, x, y, shape?.color ?? 1);
  });

  return res;
}

function updateStage(stage, x, y, value) {
  if (stage[y][x] === value) {
    return stage;
  }
  const res = stage.slice();
  res[y] = stage[y].slice();
  res[y][x] = value;
  return res;
}

function Board() {
  const [scene, setScene] = useState(createEmptyScene());
  const [shape, setShape] = useState(randomShape());
  const [position, setPosition] = useState({ x: 4, y: 0 });
  const [display, setDisplay] = useState(() =>
    mergeIntoStage(scene, shape, position)
  );
  useEffect(updateDisplay, [scene, shape, position]);
  const delay = 300;

  function updateDisplay() {
    const newDisplay = mergeIntoStage(scene, shape, position);
    setDisplay(newDisplay);
  }
  const callbackRef = useRef();

  useEffect(() => {
    callbackRef.current = tick;
  }, [tick]);
  useEffect(removeFullLines, [scene]);
  useEffect(() => {
    const interval = setInterval(() => callbackRef.current(), delay);
    return () => clearInterval(interval);
  }, [delay]);

  function tick() {
    if (!movePosition(0, 1)) {
      placeShape();
    }
  }
  function placeShape() {
    setScene(mergeIntoStage(scene, shape, position));
    setShape(randomShape());
    setPosition({ x: 5, y: 0 });
  }

  function movePosition(x, y) {
    const res = { x: x + position.x, y: y + position.y };

    if (!validPosition(res, shape)) {
      return false;
    }

    setPosition(res);

    return true;
  }

  function validPosition(position, shape) {
    return shape.shape.every((point) => {
      const tX = point.x + position.x;
      const tY = point.y + position.y;

      if (tX < 0 || tX >= COLUMN_COUNT) {
        return false;
      }

      if (tY < 0 || tY >= ROW_COUNT) {
        return false;
      }

      if (scene[tY][tX] !== 0) {
        return false;
      }

      return true;
    });
  }
  function rotateShape() {
    const tX = Math.floor(shape.width / 2);
    const tY = Math.floor(shape.height / 2);

    const newPoints = shape.shape.map((point) => {
      let { x, y } = point;

      x -= tX;
      y -= tY;

      // cos 90 = 0, sin 90 = 1
      // x = x cos 90 - y sin 90 = -y
      // y = x sin 90 + y cos 90 = x
      let rX = -y;
      let rY = x;

      rX += tX;
      rY += tY;

      return { x: rX, y: rY };
    });
    const newShape = {
      shape: newPoints,
      width: shape.width,
      height: shape.height,
      color: shape.color,
    };

    if (validPosition(position, newShape)) {
      setShape(newShape);
    }
  }

  function removeFullLines() {
    const newScene = copyScene(scene);
    let touched = false;

    const removeRow = (rY) => {
      for (let y = rY; y > 0; y--) {
        for (let x = 0; x < COLUMN_COUNT - 1; x++) {
          newScene[y][x] = newScene[y - 1][x];
        }
      }
      // insert blank row at top
      for (let x = 0; x < COLUMN_COUNT - 1; x++) {
        newScene[0][x] = 0;
      }

      touched = true;
      //setScore((oldVal) => oldVal + 1000);
    };

    for (let y = 0; y < ROW_COUNT; y++) {
      let rowHasEmptySpace = false;
      for (let x = 0; x < COLUMN_COUNT - 1; x++) {
        if (newScene[y][x] === 0) {
          rowHasEmptySpace = true;
          break;
        }
      }
      if (!rowHasEmptySpace) {
        removeRow(y);
      }
    }

    if (touched) {
      setScene(newScene);
    }
  }

  function onKeyDown(event) {
    switch (event.key) {
      case "ArrowRight":
        movePosition(1, 0);
        event.preventDefault();
        break;
      case "ArrowLeft":
        movePosition(-1, 0);
        event.preventDefault();
        break;
      case "ArrowDown":
        movePosition(0, 1);
        event.preventDefault();
        break;
      case "ArrowUp":
        rotateShape();
        event.preventDefault();
        break;
      default:
        break;
    }
  }
  console.log(scene);
  const eBoard = useRef();
  useEffect(focusBoard, []);

  function focusBoard() {
    eBoard.current.focus();
  }

  return (
    <div ref={eBoard} className={"t-board"} tabIndex={0} onKeyDown={onKeyDown}>
      {display.map((row, index) => (
        <Row row={row} key={index} />
      ))}
    </div>
  );
}
const Row = memo((props) => {
  return (
    <span className="t-row">
      {props.row.map((cell, index) => (
        <Cell cell={cell} key={index} />
      ))}
    </span>
  );
});
const Cell = memo((props) => {
  const count = useRef(0);

  count.current++;

  const value = props.cell ? props.cell : 0;
  return <span className={`t-cell t-cell-${value}`}></span>;
});
export default memo(Board);
