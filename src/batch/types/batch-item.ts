export interface BatchItem {
  /** Zero-based index of the item among the emitted inputs. */
  index: number;
  /** The resolved input (URL or query) for this item. */
  input: string;
}
