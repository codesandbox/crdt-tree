import { cuid } from "./Tree";

export interface Metadata {}

export class TreeNode {
  parentId: cuid;
  metadata: Metadata;

  constructor(parentId: cuid, metadata: Metadata) {
    this.parentId = parentId;
    this.metadata = metadata;
  }
}
