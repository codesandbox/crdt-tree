// Implements `OpMove`, the only way to manipulate tree data.
//
// `OpMove` are applied via `State`::apply_op() or at a higher
// level via `TreeReplica`::apply_op()
//
// From the paper[1]:
// ----
// We allow the tree to be updated in three ways: by creating
// a new child of any parent node, by deleting a node, or by
// moving a node to be a child of a new parent.  However all
// three types of update can be represented by a move operation.
// To create a node, we generate a fresh ID for that node, and
// issue an operation to move this new ID to be created.  We
// also designate as "trash" some node ID that does not exist
// in the tree; then we can delete a node by moving it to be
// a child of the trash.
//
// Thus, we define one kind of operation: Move t p m c.  A move
// operation is a 4-tuple consisting of a timestamp t of type 't,
// a parent node ID p of type 'n, a metadata field m of type 'm,
// and a child node ID c of type 'n.  Here, 't, 'n, and 'm are
// type variables that can be replaced with arbitrary types;
// we only require that node identifiers 'n are globally unique
// (eg UUIDs); timestamps 't need to be globally unique and
// totally ordered (eg Lamport timestamps [11]).
//
// The meaning of an operation Move t p m c is that at time t,
// the node with ID c is moved to be a child of the parent node
// with ID p.  The operation does not specify the old location
// of c; the algorithm simply removes c from wherever it is
// currently located in the tree, and moves it to p.  If c
// does not currently exist in the tree, it is created as a child
// of p.
//
// The metadata field m in a move operation allows additional
// information to be associated with the parent-child relationship
// of p and c.  For example, in a filesystem, the parent and
// child are the inodes of a directory and a file within it
// respectively, and the metadata contains the filename of the
// child.  Thus, a file with inode c can be renamed by performing
// a Move t p m c, where the new parent directory p is the inode
// of the existing parent (unchanged), but the metadata m contains
// the new filename.
//
// When users want to make changes to the tree on their local
// replica they generate new Move t p m c operations for these
// changes, and apply these operations using the algorithm
// described...
// ----
// [1] https://martin.kleppmann.com/papers/move-op.pdf

import { Clock } from "./Clock";

export interface OpMove<Id, Metadata> {
  id: Id;
  timestamp: Clock;
  metadata: Metadata;
  parentId: Id;
}
