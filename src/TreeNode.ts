/** A node that is stored in a `Tree` */
// Logically, each `TreeNode` consists of a triple `(parent_id, metadata, child_id)`.
// However, in this implementation, the `child_id` is stored as the
// keys in `Tree.children`
export class TreeNode<Id, Metadata> {
  parentId: Id;
  metadata: Metadata;

  constructor(parentId: Id, metadata: Metadata) {
    this.parentId = parentId;
    this.metadata = metadata;
  }
}
