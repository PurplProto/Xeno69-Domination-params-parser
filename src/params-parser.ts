import { readFileSync } from 'fs';
import { resolve } from 'path';
import { throwIfNaN } from './helpers';

type ParsedParam = {
  id?: string;
  title?: string;
  values?: number[];
  default?: number;
  valueText?: string[];
  disabled?: boolean;
};

export class ParamsParser {
  public stringTable: Map<string, string> = new Map();

  private readonly fileData: string[];

  constructor(filePath: string) {
    const resolvedPath = resolve(filePath);
    const data = readFileSync(resolvedPath, { encoding: 'utf8', flag: 'r' });
    const dataLines = data.split('\n');
    const paramsStartLine = dataLines.findIndex(v => v.startsWith('class Params'));
    const paramsEndLine = dataLines.findIndex((v, i) => i <= paramsStartLine ? false : v.startsWith('};'));
    this.fileData = dataLines.slice(paramsStartLine + 1, paramsEndLine);
  }

  /**
   * parse
   */
  public parse(): ParsedParam[] {
    let paramCount = 0;
    let isIfBlock = false;
    let processIfBlock = false;

    return this.fileData.reduce<ParsedParam[]>(
      (acc, next) => {
        if (next === '') {
          return acc;
        } else if (next.startsWith('#') || isIfBlock) {
          if (next === '#endif') {
            isIfBlock = false;
            processIfBlock = false;
            return acc;
          }

          isIfBlock = true;
          if (next === '#ifdef __ALTIS__') {
            processIfBlock = true;
            return acc;
          }

          if (!processIfBlock) {
            return acc;
          }
        }

        const param: ParsedParam = acc[paramCount] ?? {};

        if (!acc[paramCount]) {
          acc[paramCount] = param;
        }

        if (next === '\t};') {
          paramCount++;
        } else if (next.startsWith('\tclass')) {
          param.id = this.parseClass(next);
        } else if (next.startsWith('\t\ttitle')) {
          param.title = this.parseTitle(next);
        } else if (next.startsWith('\t\tvalues[]')) {
          param.values = this.parseValues(next, param);
        } else if (next.startsWith('\t\tdefault')) {
          param.default = this.parseDefault(next, param);
        } else if (next.startsWith('\t\ttexts[]')) {
          param.valueText = this.parseTexts(next, param);
        }
        return acc;
      },
      [],
    );
  }

  private parseClass(value: string): string {
    return value.replace(/\tclass (.*) \{/, '$1');
  }

  private parseTitle(value: string): string {
    const stringVar = value.replace(/\t\ttitle = \"\$(.*)\"\;/, '$1');
    const realValue = this.stringTable.get(stringVar);
    if (!realValue) {
      throw new Error(`Couldn't find "${stringVar}" in the stringtable!`);
    }
    return realValue;
  }

  private parseValues(value: string, param: Readonly<ParsedParam>): number[] {
    const values = value.replace(/\t\tvalues\[\] = \{(.*)\}\;/, '$1')
      .split(',')
      .map(v => parseInt(v, 10));
    throwIfNaN(values, `Some "values" for "${param.id}" could not be parsed as a number`);
    return values;
  }

  private parseDefault(value: string, param: ParsedParam): number {
    const defaultValue = parseInt(value.replace(/\t\tdefault = (.*)\;/, '$1'), 10);
    throwIfNaN([defaultValue], `The "default" for "${param.id}" could not be parsed as a number`);
    return defaultValue;
  }

  private parseTexts(value: string, param: ParsedParam): string[] {
    const textsGroup = value.replace(/\t\ttexts\[\] = \{(.*)\}\;/, '$1').replaceAll('"', '');
    if (textsGroup === '') {
      param.disabled = true;
      return [];
    }
    const texts = textsGroup.split(',')
      .map(s => {
        if (s.startsWith('$')) {
          const stringVar = s.replace('$', '');
          const realValue = this.stringTable.get(stringVar);
          if (!realValue) {
            throw new Error(`Couldn't find "${stringVar}" in the stringtable!`);
          }
          return realValue;
        }
        return s;
      });
    param.disabled = false;
    return texts;
  }
}
