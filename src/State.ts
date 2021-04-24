import { LogOpMove } from "./LogOpMove";
import { OpMove } from "./OpMove";
import { Tree } from "./Tree";
import { TreeNode } from "./TreeNode";

export class State {
  operationLog: LogOpMove[] = [];
  tree: Tree = new Tree();

  log(entry: LogOpMove) {
    this.operationLog.unshift(entry);
  }

  /** Apply a move operation. */
  doOperation(op: OpMove): LogOpMove {
    // When a replica applies a `Move` op to its tree, it also records
    // a corresponding `LogMove` op in its log.  The t, p, m, and c
    // fields are taken directly from the `Move` record, while the `oldParent`
    // field is filled in based on the state of the tree before the move.
    // If c did not exist in the tree, `oldParent` is set to None.  Otherwise
    // `oldParent` records the previous parent and metadata of c.
    const oldParent = this.tree.get(op.id);

    // ensures no cycles are introduced.  If the node c
    // is being moved, and c is an ancestor of the new parent
    // newp, then the tree is returned unmodified, ie the operation
    // is ignored.
    // Similarly, the operation is also ignored if c == newp
    if (op.id === op.parentId || this.tree.isAncestor(op.id, op.parentId)) {
      return { op, oldParent };
    }

    // Otherwise, the tree is updated by removing c from
    // its existing parent, if any, and adding the new
    // parent-child relationship (newp, m, c) to the tree.
    this.tree.remove(op.id);
    let node = new TreeNode(op.parentId, op.metadata);
    this.tree.add(op.id, node);
    return { op, oldParent };
  }

  undoOp(log: LogOpMove): void {
    this.tree.remove(log.op.id);
    if (!log.oldParent) return;

    let node = new TreeNode(log.oldParent.parentId, log.oldParent.metadata);
    this.tree.add(log.op.id, node);
  }

  redoOp(log: LogOpMove): void {
    let op = log.op;
    let redoLog = this.doOperation(op);
    this.log(redoLog);
  }

  // The apply_op func takes two arguments:
  // a `Move` operation to apply and the current replica
  // state; and it returns the new replica state.
  // The constrains `t::{linorder} in the type signature
  // indicates that timestamps `t are instance if linorder
  // type class, and they can therefore be compared with the
  // < operator during a linear (or total) order.
  applyOp(op: OpMove) {
    if (this.operationLog.length === 0) {
      let logEntry = this.doOperation(op);
      this.log(logEntry);
    } else {
      const lastOp = this.operationLog[0].op;
      if (op.timestamp === lastOp.timestamp) {
        // This case should never happen in normal operation
        // because it is requirement/invariant that all
        // timestamps are unique.  However, uniqueness is not
        // strictly enforced in this impl.
        // The crdt paper does not even check for this case.
        // We just treat it as a no-op.
        console.log(
          "op with timestamp equal to previous op ignored. (not applied).  Every op must have a unique timestamp."
        );
      }
      if (op.timestamp < lastOp.timestamp) {
        const logEntry = this.operationLog.shift()!;
        this.undoOp(logEntry);
        this.applyOp(op);
        this.redoOp(logEntry);
      }
      if (op.timestamp > lastOp.timestamp) {
        let logEntry = this.doOperation(op);
        this.log(logEntry);
      }
    }
  }

  applyOps(ops: OpMove[]) {
    for (const op of ops) {
      this.applyOp(op);
    }
  }
}
