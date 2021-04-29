// Implements `LogOpMove`, a log entry used by `State`.
//
// From the paper[1]:
// ----
// In order to correctly apply move operations, a replica needs
// to maintain not only the current state of the tree, but also
// an operation log.  The log is a list of `LogMove` records in
// descending timestamp order.  `LogMove` t oldp p m c is similar
// to Move t p m c; the difference is that `LogMove` has an additional
// field oldp of type ('n x 'm) option.  This option type means
// the field can either take the value None or a pair of a node ID
// and a metadata field.
//
// When a replica applies a `Move` operation to its tree it
// also records a corresponding LogMove operation in its log.
// The t, p, m, and c fields are taken directly from the Move
// record while the oldp field is filled in based on the
// state of the tree before the move.  If c did not exist
// in the tree, oldp is set to None. Else oldp records the
// previous parent metadata of c: if there exist p' and m'
// such that (p', m', c') E tree, then `oldp` is set to `Some(p', m')`.
// The `get_parent()` function implements this.
// ----
// [1] <https://martin.kleppmann.com/papers/move-op.pdf>

import { OpMove } from "./OpMove";
import { TreeNode } from "./TreeNode";

export interface LogOpMove {
  /** The operation being logged */
  op: OpMove;
  /**
   * Parent and metadata prior to the application of the operation.
   * Is `undefined` if the node previously didn't exist in the tree.
   * */
  oldNode?: TreeNode;
}
