// Implements `Tree`, a map of nodes representing the current tree structure.
//
// Normally `Tree` should not be instantiated directly.
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

import { TreeNode } from "./TreeNode";

/** Create a new Tree instance */
export class Tree<Id, Metadata> {
  /** Tree nodes indexed by id */
  nodes: Map<Id, TreeNode<Id, Metadata>> = new Map();
  /** Parent id to child id index */
  children: Map<Id, Set<Id>> = new Map();

  size = this.nodes.size;

  /** Remove a node based on its id */
  remove(id: Id): void {
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
  addNode(id: Id, node: TreeNode<Id, Metadata>): void {
    let childrenSet = this.children.get(node.parentId);
    if (!childrenSet) {
      childrenSet = new Set();
      this.children.set(node.parentId, childrenSet);
    }

    childrenSet.add(id);
    this.nodes.set(id, node);
  }

  /** Get a node by its id */
  get(id: Id): TreeNode<Id, Metadata> | undefined {
    return this.nodes.get(id);
  }

  /** Returns true if the given `ancestorId` is an ancestor of `id` in the tree */
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
  isAncestor(id: Id, ancestorId: Id): boolean {
    let targetId = id;

    let node;
    while ((node = this.get(targetId))) {
      if (node.parentId === ancestorId) return true;
      targetId = node.parentId;
    }

    return false;
  }

  /** Print a tree node recursively */
  printNode(id: Id, depth: number = 0) {
    const node = this.get(id);
    const line = `${id} ${node ? `${JSON.stringify(node.metadata)}` : ""}`;
    const indentation = " ".repeat(depth * 2);
    console.log(indentation + line);

    let children = Array.from(this.children.get(id) ?? []);
    for (let childId of children) {
      this.printNode(childId, depth + 1);
    }
  }
}
