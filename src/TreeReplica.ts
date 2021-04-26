// `TreeReplica` holds tree `State` plus lamport timestamp (actor + counter)
//
// It can optionally keep track of the latest timestamp for each
// replica which is needed for calculating the causally stable threshold which
// is in turn needed for log truncation.
//
// `TreeReplica` is a higher-level interface to the Tree CRDT and is tied to a
// particular actor/peer.
//
// `State` is a lower-level interface to the Tree CRDT and is not tied to any
// actor/peer.

import { Clock } from "./Clock";
import { OpMove } from "./OpMove";
import { State } from "./State";
import { Cuid } from "./Tree";
import { Metadata } from "./TreeNode";

export type OpMoveTuple = [id: Cuid, metadata: Metadata, parentId: Cuid];

export class TreeReplica {
  /** The Tree state */
  state: State = new State();
  /** The logical clock for this replica/tree  */
  time: Clock;
  /** Mapping of replicas and their latest time */
  latestTimeByReplica: Map<string, Clock> = new Map();

  constructor(authorId: string) {
    this.time = new Clock(authorId);
  }

  get tree() {
    return this.state.tree;
  }

  /**
   * Generates an OpMove
   * Note that `this.time` is not updated until `applyOp` is called.
   *
   * Therefore, multiple ops generate3d with this method may share the same
   * timestamp, and only one can be successfully applied.
   *
   * To generate multiple ops before calling ::apply_op(), use ::opmoves() instead.
   */
  opMove(id: Cuid, metadata: Metadata, parentId: Cuid): OpMove {
    return { timestamp: this.time.inc(), metadata, id, parentId };
  }

  /**
   * Generates a list of OpMove from a list of tuples (id, metadata, parent_id)
   *
   * Each timestamp will be greater than the previous op in the returned list.
   * Therefore, these operations can be successfully applied via `apply_op()` without
   * timestamp collision.
   */
  opMoves(ops: Array<OpMoveTuple>): OpMove[] {
    const opMoves: OpMove[] = [];
    for (const op of ops) {
      opMoves.push({
        timestamp: this.time.tick(),
        id: op[0],
        metadata: op[1],
        parentId: op[2],
      });
    }
    return opMoves;
  }

  applyOp(op: OpMove) {
    this.time = this.time.merge(op.timestamp);

    const id = op.timestamp.actorId;
    const latestTimeOfActor = this.latestTimeByReplica.get(id) ?? 0;
    if (op.timestamp <= latestTimeOfActor) {
      console.log(
        `Clock not increased, current timestamp ${latestTimeOfActor}, provided is ${op.timestamp}.`
      );
      console.log("Dropping operation.");
    } else {
      this.latestTimeByReplica.set(id, op.timestamp);
    }

    this.state.applyOp(op);
  }

  applyOps(ops: OpMove[]) {
    for (const op of ops) {
      this.applyOp(op);
    }
  }
}
