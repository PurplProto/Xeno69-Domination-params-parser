export function throwIfNaN(arr: number[], msg: string) {
  if (arr.some(n => Number.isNaN(n))) {
    throw new Error(msg);
  }
}
