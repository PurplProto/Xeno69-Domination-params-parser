import { readFileSync } from 'fs';
import { resolve } from 'path';
import { removeWhiteSpaceAndQuotes, throwIfNaN } from './helpers.js';
import type { Param, ParamValue } from './models.js';

type ParsedParam = {
  id: string;
  title: string;
  values: number[];
  defaultValue: number;
  valueText: string[];
  disabled: boolean;
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
   * Parse params from the file path provided at construction
   * @returns {Param[]} Parsed params with hidden params removed
   */
  public parse(): Param[] {
    let paramCount = 0;
    let isIfBlock = false;
    let processIfBlock = false;

    const parsedParams = this.fileData.reduce<Partial<ParsedParam[]>>(
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

        const param: Partial<ParsedParam> = acc[paramCount] ?? {};

        if (!acc[paramCount]) {
          acc[paramCount] = param as ParsedParam;
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
          param.defaultValue = this.parseDefault(next, param);
        } else if (next.startsWith('\t\ttexts[]')) {
          param.valueText = this.parseTexts(next, param);
        }

        return acc;
      },
      [],
    );

    return (parsedParams.filter(p => p && !p.disabled) as ParsedParam[])
      .map<Param>(({ defaultValue, id, title, valueText, values }: ParsedParam) => ({
        id,
        title,
        defaultValue,
        values: values.map<ParamValue>((value, i) => ({
          name: valueText[i] ?? '<Unknown Value>',
          value
        })),
      }));
  }

  private parseClass(value: string): string {
    return removeWhiteSpaceAndQuotes(value.replace(/\tclass (.*) \{/, '$1'));
  }

  private parseTitle(value: string): string {
    const stringVar = removeWhiteSpaceAndQuotes(value.replace(/\t\ttitle = \"\$(.*)\"\;/, '$1'));
    const realValue = this.stringTable.get(stringVar);
    if (!realValue) {
      throw new Error(`Couldn't find "${stringVar}" in the stringtable!`);
    }
    return realValue;
  }

  private parseValues(value: string, param: Readonly<Partial<ParsedParam>>): number[] {
    const values = removeWhiteSpaceAndQuotes(value.replace(/\t\tvalues\[\] = \{(.*)\}\;/, '$1'))
      .split(',')
      .map(v => parseInt(v, 10));
    throwIfNaN(values, `Some "values" for "${param.id}" could not be parsed as a number`);
    return values;
  }

  private parseDefault(value: string, param: Partial<ParsedParam>): number {
    const defaultValue = parseInt(
      removeWhiteSpaceAndQuotes(value.replace(/\t\tdefault = (.*)\;/, '$1')),
      10,
    );
    throwIfNaN([defaultValue], `The "default" for "${param.id}" could not be parsed as a number`);
    return defaultValue;
  }

  private parseTexts(value: string, param: Partial<ParsedParam>): string[] {
    const textsGroup = removeWhiteSpaceAndQuotes(value.replace(/\t\ttexts\[\] = \{(.*)\}\;/, '$1'));

    if (textsGroup === '') {
      param.disabled = true;
      return [];
    }

    const texts = textsGroup.split(',').map(
      (s) => this.stringTable.get(s.replace('$', '')) ?? s,
    );

    param.disabled = false;
    return texts;
  }
}
