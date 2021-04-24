import { TreeNode } from "./TreeNode";

// Implements `Tree`, a set of triples representing current tree structure.
//
// Normally this `Tree` struct should not be instantiated directly.
// Instead instantiate `State` (lower-level) or `TreeReplica` (higher-level)
// and invoke operations on them.
//
// From the paper[1]:
// ----
// We can represent the tree as a set of (parent, meta, child)
// triples, denoted in Isabelle/HOL as (’n × ’m × ’n) set. When
// we have (p, m, c) ∈ tree, that means c is a child of p in the tree,
// with associated metadata m. Given a tree, we can construct
// a new tree’ in which the child c is moved to a new parent p,
// with associated metadata m, as follows:
//
// tree’ = {(p’, m’, c’) ∈ tree. c’ != c} ∪ {(p, m, c)}
//
// That is, we remove any existing parent-child relationship
// for c from the set tree, and then add {(p, m, c)} to represent
// the new parent-child relationship.
// ----
// [1] https://martin.kleppmann.com/papers/move-op.pdf

export type cuid = string;

/** Create a new Tree instance */
export class Tree {
  nodes: Map<cuid, TreeNode> = new Map();
  children: Map<cuid, Set<cuid>> = new Map();

  /** Remove a node based on its ID */
  remove(id: cuid): void {
    const entry = this.nodes.get(id);
    if (!entry) return;

    let parent = this.children.get(entry.parentId);
    if (!parent) return;
    parent.delete(id);
    // Clean up parent entry if empty
    if (parent.size === 0) this.children.delete(entry.parentId);

    this.nodes.delete(id);
  }

  /** Add a node to the tree */
  add(id: cuid, node: TreeNode): void {
    let parent = this.children.get(node.parentId);
    if (!parent) {
      parent = new Set();
      this.children.set(node.parentId, parent);
    }

    parent.add(id);
    this.nodes.set(id, node);
  }

  /** Get a node by its id */
  get(id: cuid): TreeNode | undefined {
    return this.nodes.get(id);
  }

  // returns true if ancestor_id is an ancestor of child_id in tree.
  //
  // parent | child
  // --------------
  // 1        2
  // 1        3
  // 3        5
  // 2        6
  // 6        8
  //
  //                  1
  //               2     3
  //             6         5
  //           8
  //
  // is 2 ancestor of 8?  yes.
  // is 2 ancestor of 5?   no.
  isAncestor(childId: cuid, ancestorId: cuid): boolean {
    let targetId = childId;

    let node;
    while (node = this.get(targetId)) {
      if (node.parentId === ancestorId) return true;
      targetId = node.parentId;
    }

    return false;
  }

  numNodes(): number {
    return this.nodes.size;
  }
}
