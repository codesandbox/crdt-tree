import { OpMove, Tree, TreeReplica } from "../src";

let id = 1;
const newId = () => String(++id);

test("concurrent moves converge to a common location", () => {
  const r1 = new TreeReplica<string, string>("a");
  const r2 = new TreeReplica<string, string>("b");

  const ids = {
    root: newId(),
    a: newId(),
    b: newId(),
    c: newId()
  };

  const ops = r1.opMoves([
    [ids.root, "root", "0"],
    [ids.a, "a", ids.root],
    [ids.b, "b", ids.root],
    [ids.c, "c", ids.root]
  ]);

  r1.applyOps(ops);
  r2.applyOps(ops);

  // Replica 1 moves /root/a to /root/b
  let repl1Ops = [r1.opMove(ids.a, "a", ids.b)];
  // Replica 2 moves /root/a to /root/c
  let repl2Ops = [r2.opMove(ids.a, "a", ids.c)];

  const r1EventHandler = jest.fn();
  const r2EventHandler = jest.fn();
  r1.state.emitter.on("intermediaryOp", r1EventHandler);
  r2.state.emitter.on("intermediaryOp", r2EventHandler);

  r1.applyOps(repl1Ops);
  r1.applyOps(repl2Ops);

  r2.applyOps(repl2Ops);
  r2.applyOps(repl1Ops);

  // The state is the same on both replicas, converging to /root/c/a
  // because last-write-wins and replica2's op has a later timestamp
  expect(r1.state.toString()).toEqual(r2.state.toString());
  expect(r1.state.tree.nodes.get(ids.a)?.parentId).toBe(ids.c);

  // The events emitted can be replicated by an external form of state management
  expect(r1EventHandler.mock.calls).toEqual([
    // Move /root/a to /root/b/a
    [{ id: ids.a, metadata: "a", parentId: ids.b }],
    // Move /root/b/a to /root/c/a
    [{ id: ids.a, metadata: "a", parentId: ids.c }]
  ]);
  expect(r2EventHandler.mock.calls).toEqual([
    // Move /root/a to /root/c/a
    [{ id: ids.a, metadata: "a", parentId: ids.c }],
    // [Undo] Move /root/c/a back to /root/a
    [{ id: ids.a, metadata: "a", parentId: ids.root }],
    // Move /root/a to /root/b/a
    [{ id: ids.a, metadata: "a", parentId: ids.b }],
    // Move /root/b/a to /root/c/a
    [{ id: ids.a, metadata: "a", parentId: ids.c }]
  ]);
});

test("concurrent moves avoid cycles, converging to a common location", () => {
  const r1 = new TreeReplica("a");
  const r2 = new TreeReplica("b");

  const ids = {
    root: newId(),
    a: newId(),
    b: newId(),
    c: newId()
  };

  const ops = r1.opMoves([
    [ids.root, "root", "0"],
    [ids.a, "a", ids.root],
    [ids.b, "b", ids.root],
    [ids.c, "c", ids.a]
  ]);

  r1.applyOps(ops);
  r2.applyOps(ops);

  const r1EventHandler = jest.fn();
  const r2EventHandler = jest.fn();
  r1.state.emitter.on("intermediaryOp", r1EventHandler);
  r2.state.emitter.on("intermediaryOp", r2EventHandler);

  // Replica 1 moves /root/b to /root/a, creating /root/a/b
  let repl1Ops = [r1.opMove(ids.b, "b", ids.a)];
  // Replica 2 "simultaneously" moves /root/a to /root/b, creating /root/b/a
  let repl2Ops = [r2.opMove(ids.a, "a", ids.b)];

  r1.applyOps(repl1Ops);
  r1.applyOps(repl2Ops);

  r2.applyOps(repl2Ops);
  r2.applyOps(repl1Ops);

  // The state is the same on both replicas, converging to /root/a/b
  // because last-write-wins and replica2's op has a later timestamp
  expect(r1.state.toString()).toEqual(r2.state.toString());
  expect(r1.state.tree.nodes.get(ids.b)?.parentId).toBe(ids.a);
  expect(r1.state.tree.nodes.get(ids.a)?.parentId).toBe(ids.root);

  // The events emitted can be replicated by an external form of state management
  expect(r1EventHandler.mock.calls).toEqual([
    // Move /root/b to /root/a/b
    [{ id: ids.b, metadata: "b", parentId: ids.a }]
  ]);
  expect(r2EventHandler.mock.calls).toEqual([
    // Move /root/a to /root/b/a
    [{ id: ids.a, metadata: "a", parentId: ids.b }],
    // [Undo] Move /root/b/a back to /root/a
    [{ id: ids.a, metadata: "a", parentId: ids.root }],
    // Move /root/b to /root/a/b
    [{ id: ids.b, metadata: "b", parentId: ids.a }]
  ]);
});

test("custom conflict handler supports metadata-based custom conflicts", () => {
  type Id = string;
  type FileName = string;

  // A custom handler that rejects if a sibling exists with the same name
  function conflictHandler(op: OpMove<Id, FileName>, tree: Tree<Id, FileName>) {
    const siblings = tree.children.get(op.parentId) ?? [];
    return [...siblings].some(id => {
      const isSibling = id !== op.id;
      const hasSameName = tree.get(id)?.metadata === op.metadata;
      return isSibling && hasSameName;
    });
  }

  const r1 = new TreeReplica<Id, FileName>("a", { conflictHandler });
  const r2 = new TreeReplica<Id, FileName>("b", { conflictHandler });

  const ids = {
    root: newId(),
    a: newId(),
    b: newId()
  };

  const ops = r1.opMoves([
    [ids.root, "root", "0"],
    [ids.a, "a", ids.root],
    [ids.b, "b", ids.root]
  ]);

  r1.applyOps(ops);
  r2.applyOps(ops);

  // Replica 1 renames /root/a to /root/b, producing a conflict
  let repl1Ops = [r1.opMove(ids.a, "b", ids.root)];

  r1.applyOps(repl1Ops);
  r2.applyOps(repl1Ops);

  // The state is the same on both replicas, ignoring the operation that
  // produced conflicting metadata state
  expect(r1.state.toString()).toEqual(r2.state.toString());
  expect(r1.state.tree.nodes.get(ids.a)?.metadata).toBe("a");
});
