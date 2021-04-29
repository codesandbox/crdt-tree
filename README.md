<h3 align="center">crdt-tree</h3>
<p align="center">An implementation of a tree Conflict-Free Replicated Data Type (CRDT).</p>

---

This crate aims to be an accurate implementation of the tree crdt algorithm described in the paper: 

[A highly-available move operation for replicated trees and distributed filesystems](https://martin.kleppmann.com/papers/move-op.pdf) by M. Kleppmann, et al.

Please refer to the paper for a description of the algorithm's properties.

For clarity, data structures in this implementation are named the same as in the paper (State, Tree) or close to (OpMove --> Move, LogOpMove --> LogOp). Some are not explicitly named in the paper, such as TreeId,TreeMeta, TreeNode, Clock.

### Additional References

- [CRDT: The Hard Parts](https://martin.kleppmann.com/2020/07/06/crdt-hard-parts-hydra.html)
- [Youtube Video: CRDT: The Hard Parts](https://youtu.be/x7drE24geUw)

## Usage

See [test/tree.test.ts](test/tree.test.ts).
