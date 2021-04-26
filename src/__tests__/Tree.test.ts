import { State } from "../State";
import { Cuid } from "../Tree";

let id = 100;
const newId = () => ++id;
let timestamp = 0;
const newTimestamp = () => ++timestamp;

test("isAncestor", () => {
  const state = new State();

  const ids = {
    forest: String(newId()) as Cuid,
    trash: String(newId()) as Cuid,
    root: String(newId()) as Cuid,
    home: String(newId()) as Cuid,
    bob: String(newId()) as Cuid,
    project: String(newId()) as Cuid,
  };

  state.applyOp({
    timestamp: newTimestamp(),
    parentId: ids.root,
    metadata: { name: "root" },
    id: ids.home,
  });

  state.applyOp({
    timestamp: newTimestamp(),
    parentId: ids.home,
    metadata: { name: "home" },
    id: ids.bob,
  });

  state.applyOp({
    timestamp: newTimestamp(),
    parentId: ids.bob,
    metadata: { name: "bob" },
    id: ids.project,
  });

  const ops = [
    (ids.forest, "root", ids.root),
    (ids.forest, "trash", ids.trash),
    (ids.root, "home", ids.home),
    (ids.home, "bob", ids.bob),
    (ids.bob, "project", ids.project),
  ];

  console.log(state);
  state.tree.printNode(ids.root);
});
