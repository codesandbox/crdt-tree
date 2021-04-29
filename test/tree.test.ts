import { TreeReplica } from "../src";

let id = 1;
const newId = () => String(++id);

test("concurrent moves converge to a common location", () => {
  const r1 = new TreeReplica<string, string>("a");
  const r2 = new TreeReplica<string, string>("b");

  const ids = {
    root: newId(),
    a: newId(),
    b: newId(),
    c: newId(),
  };

  const ops = r1.opMoves([
    [ids.root, "root", "0"],
    [ids.a, "a", ids.root],
    [ids.b, "b", ids.root],
    [ids.c, "c", ids.root],
  ]);

  r1.applyOps(ops);
  r2.applyOps(ops);

  // Replica 1 moves /root/a to /root/b
  let repl1Ops = [r1.opMove(ids.a, "a", ids.b)];
  // Replica 2 moves /root/a to /root/c
  let repl2Ops = [r2.opMove(ids.a, "a", ids.c)];

  r1.applyOps(repl1Ops);
  r1.applyOps(repl2Ops);

  r2.applyOps(repl2Ops);
  r2.applyOps(repl1Ops);

  // The state is the same on both replicas, converging to /root/c/a
  // because last-write-wins and replica2's op has a later timestamp
  expect(r1.state).toEqual(r2.state);
  expect(r1.state.tree.nodes.get(ids.a)?.parentId).toBe(ids.c);
});

test("concurrent moves avoid cycles, converging to a common location", () => {
  const r1 = new TreeReplica("a");
  const r2 = new TreeReplica("b");

  const ids = {
    root: newId(),
    a: newId(),
    b: newId(),
    c: newId(),
  };

  const ops = r1.opMoves([
    [ids.root, "root", "0"],
    [ids.a, "a", ids.root],
    [ids.b, "b", ids.root],
    [ids.c, "c", ids.a],
  ]);

  r1.applyOps(ops);
  r2.applyOps(ops);

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
  expect(r1.state).toEqual(r2.state);
  expect(r1.state.tree.nodes.get(ids.b)?.parentId).toBe(ids.a);
  expect(r1.state.tree.nodes.get(ids.a)?.parentId).toBe(ids.root);
});
