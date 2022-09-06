export function throwIfNaN(arr: number[], msg: string) {
  if (arr.some(n => Number.isNaN(n))) {
    throw new Error(msg);
  }
}

export function removeWhiteSpaceAndQuotes(s: string): string {
  return s.replaceAll('"', '').replaceAll(' ', '');
}
