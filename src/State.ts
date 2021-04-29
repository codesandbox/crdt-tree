// Holds Tree CRDT state and implements the core algorithm.
//
// `State` is not tied to any actor/peer and should be equal on any
// two replicas where each has applied the same operations.
//
// `State` may be instantiated to manipulate a CRDT Tree or
// alternatively the higher level `TreeReplica` may be used.
//
// This code aims to be an accurate implementation of the
// tree crdt algorithm described in:
//
// "A highly-available move operation for replicated trees
// and distributed filesystems" [1] by Martin Klepmann, et al.
//
// [1] https://martin.kleppmann.com/papers/move-op.pdf

import { LogOpMove } from "./LogOpMove";
import { OpMove } from "./OpMove";
import { Tree } from "./Tree";
import { TreeNode } from "./TreeNode";

export class State {
  /** A list of `LogOpMove` in descending timestamp order */
  readonly operationLog: LogOpMove[] = [];
  /** A tree structure that represents the current state of the tree */
  tree: Tree = new Tree();

  /** Insert a log entry to the top of the log */
  addLogEntry(entry: LogOpMove) {
    this.operationLog.unshift(entry);
  }

  /**
   * Applies the given operation at the correct point in the order of events,
   * determined by the operation's logical timestamp.
   */
  applyOp(op: OpMove) {
    if (this.operationLog.length === 0) {
      let logEntry = this.doOperation(op);
      this.addLogEntry(logEntry);
    } else {
      const lastOp = this.operationLog[0].op;
      if (op.timestamp === lastOp.timestamp) {
        // This case should never happen in normal operation
        // because it is a requirement that all timestamps are unique.
        // However, uniqueness is not strictly enforced in this impl.
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
        this.addLogEntry(logEntry);
      }
    }
  }

  /** Apply a list of operations */
  applyOps(ops: OpMove[]) {
    for (const op of ops) {
      this.applyOp(op);
    }
  }

  /** Perform the provided move operation, outputting the operation's log entry */
  private doOperation(op: OpMove): LogOpMove {
    // When a replica applies a `Move` op to its tree, it also records
    // a corresponding `LogMove` op in its log.  The t, p, m, and c
    // fields are taken directly from the `Move` record, while the `oldNode`
    // field is filled in based on the state of the tree before the move.
    // If c did not exist in the tree, `oldNode` is set to None.  Otherwise
    // `oldNode` records the previous parent and metadata of c.
    const oldNode = this.tree.get(op.id);

    // ensures no cycles are introduced.  If the node c
    // is being moved, and c is an ancestor of the new parent
    // newp, then the tree is returned unmodified, ie the operation
    // is ignored.
    // Similarly, the operation is also ignored if c == newp
    if (op.id === op.parentId || this.tree.isAncestor(op.parentId, op.id)) {
      return { op, oldNode };
    }

    // Otherwise, the tree is updated by removing c from
    // its existing parent, if any, and adding the new
    // parent-child relationship (newp, m, c) to the tree.
    this.tree.remove(op.id);
    let node = new TreeNode(op.parentId, op.metadata);
    this.tree.addNode(op.id, node);
    return { op, oldNode };
  }

  /** Undo a previously made operation */
  private undoOp(log: LogOpMove): void {
    this.tree.remove(log.op.id);
    if (!log.oldNode) return;

    let node = new TreeNode(log.oldNode.parentId, log.oldNode.metadata);
    this.tree.addNode(log.op.id, node);
  }

  /**
   * Reperforms an operation, recomputing the `LogOpMove` record due to the
   * effect of the new operation
   */
  private redoOp(log: LogOpMove): void {
    let op = log.op;
    let redoLog = this.doOperation(op);
    this.addLogEntry(redoLog);
  }
}
