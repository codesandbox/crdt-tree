import { State } from "../State";

let id = 100;
const newId = () => ++id;
let timestamp = 0;
const newTimestamp = () => ++timestamp;

test("isAncestor", () => {
  const state = new State();

  const ids = {
    forest: String(newId()),
    trash: String(newId()),
    root: String(newId()),
    home: String(newId()),
    bob: String(newId()),
    project: String(newId()),
  };

  state.applyOp({
    timestamp: newTimestamp(),
    parentId: ids.root,
    metadata: {},
    id: ids.home,
  });

  state.applyOp({
    timestamp: newTimestamp(),
    parentId: ids.home,
    metadata: {},
    id: ids.bob,
  });

  state.applyOp({
    timestamp: newTimestamp(),
    parentId: ids.bob,
    metadata: {},
    id: ids.project,
  });

  const ops = [
    (ids.forest, "root", ids.root),
    (ids.forest, "trash", ids.trash),
    (ids.root, "home", ids.home),
    (ids.home, "bob", ids.bob),
    (ids.bob, "project", ids.project),
  ];

  console.log(state)
});
