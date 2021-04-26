import { Cuid } from "../Tree";
import { TreeReplica } from "../TreeReplica";

let id = 1;
const newId = () => String(++id) as Cuid;

test("concurrent moves converge to a common location", () => {
  const r1 = new TreeReplica("a");
  const r2 = new TreeReplica("b");

  const ids = {
    root: newId(),
    a: newId(),
    b: newId(),
    c: newId(),
  };

  const ops = r1.opMoves([
    [ids.root, "root", "0" as Cuid],
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

  expect(r1.state).toEqual(r2.state);
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
    [ids.root, "root", "0" as Cuid],
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

  expect(r1.state).toEqual(r2.state);
});
