/** A node that is stored in a `Tree` */
// Logically, each `TreeNode` consists of a triple `(parentId, metadata, childId)`.
// However, in this implementation, the `childId` is stored as the
// keys in `Tree.children`
export class TreeNode<Id, Metadata> {
  parentId: Id;
  metadata: Metadata;

  constructor(parentId: Id, metadata: Metadata) {
    this.parentId = parentId;
    this.metadata = metadata;
  }
}
