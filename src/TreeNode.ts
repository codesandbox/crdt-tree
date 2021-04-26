import { Cuid } from "./Tree";

export type Metadata = string

/** A node that is stored in a `Tree` */
// Logically, each `TreeNode` consists of a triple `(parent_id, metadata, child_id)`.
// However, in this implementation, the `child_id` is stored as the
// keys in `Tree.children`
export class TreeNode {
  parentId: Cuid;
  metadata: Metadata;

  constructor(parentId: Cuid, metadata: Metadata) {
    this.parentId = parentId;
    this.metadata = metadata;
  }
}
