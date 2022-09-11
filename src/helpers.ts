export function throwIfNaN(arr: number[], msg: string) {
  if (arr.some(n => Number.isNaN(n))) {
    throw new Error(msg);
  }
}

export function removeWhiteSpaceAndQuotes(s: string): string {
  return s.replaceAll('"', '').replaceAll(' ', '');
}

export class MdHelpers {
  public static theamaticBreak(): string {
    return '\n***\n';
  }

  public static h4(s: string): string {
    return `#### ${s}`;
  }

  public static bold(s: string): string {
    return `**${s}**`;
  }

  public static codeBlock(s: string): string {
    return `> ${s}`;
  }

  public static inlineCode(s: string): string {
    return `\`${s}\``;
  }

  public static lineBreak(s: string): string {
    return `${s} <br />`;
  }

  public static list(listItems: string[], listIndentLevel: number = 1): string[] {
    const indent = Array(listIndentLevel).fill('  ').join('');
    return listItems.map(s => `${indent} - ${s}`);
  }
}
