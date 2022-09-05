import { XMLParser } from 'fast-xml-parser';
import { readFileSync } from 'fs';
import { resolve } from 'path';

type Param = {
  id?: string;
  title?: string;
  values?: number[];
  default?: number;
  valueText?: string[];
  disabled?: boolean;
};

function throwIfNaN(arr: number[], msg: string) {
  if (arr.some(n => Number.isNaN(n))) {
    throw new Error(msg);
  }
}

function parseStringTable(): Map<string, string> {
  const stringXmlPath = resolve('uncompiled/co40_domination_4_64_blufor.altis/stringtable.xml');
  const stringXmlData = readFileSync(stringXmlPath, { encoding: 'utf8', flag: 'r' });
  const xmlParser = new XMLParser({ ignoreAttributes: false });
  const stringXmlObject = xmlParser.parse(stringXmlData);

  const stringTable = new Map<string, string>();
  (stringXmlObject.Project.Package.Container.Key as { '@_ID': string, English: string; }[])
    .forEach(v => stringTable.set(v['@_ID'], v.English));
  return stringTable;
}

function parseParams(stringTable: Map<string, string>): Param[] {
  const extFilePath = resolve('uncompiled/co40_domination_4_64_blufor.altis/description.ext');
  const extData = readFileSync(extFilePath, { encoding: 'utf8', flag: 'r' }).split('\n');
  const paramsStartLine = extData.findIndex(v => v.startsWith('class Params'));
  const paramsEndLine = extData.findIndex((v, i) => i <= paramsStartLine ? false : v.startsWith('};'));
  const extDataSelection = extData.slice(paramsStartLine + 1, paramsEndLine);

  const parseClass = (value: string): string => value.replace(/\tclass (.*) \{/, '$1');
  const parseTitle = (value: string): string => {
    const stringVar = value.replace(/\t\ttitle = \"\$(.*)\"\;/, '$1');
    const realValue = stringTable.get(stringVar);
    if (!realValue) {
      throw new Error(`Couldn't find "${stringVar}" in the stringtable!`);
    }
    return realValue;
  };
  const parseValues = (value: string, param: Readonly<Param>): number[] => {
    const values = value.replace(/\t\tvalues\[\] = \{(.*)\}\;/, '$1')
      .split(',')
      .map(v => parseInt(v, 10));
    throwIfNaN(values, `Some "values" for "${param.id}" could not be parsed as a number`);
    return values;
  };
  const parseDefault = (value: string, param: Param): number => {
    const defaultValue = parseInt(value.replace(/\t\tdefault = (.*)\;/, '$1'), 10);
    throwIfNaN([defaultValue], `The "default" for "${param.id}" could not be parsed as a number`);
    return defaultValue;
  };
  const parseTexts = (value: string, param: Param): string[] => {
    const textsGroup = value.replace(/\t\ttexts\[\] = \{(.*)\}\;/, '$1').replaceAll('"', '');
    if (textsGroup === '') {
      param.disabled = true;
      return [];
    }
    const texts = textsGroup.split(',')
      .map(s => {
        if (s.startsWith('$')) {
          const stringVar = s.replace('$', '');
          const realValue = stringTable.get(stringVar);
          if (!realValue) {
            throw new Error(`Couldn't find "${stringVar}" in the stringtable!`);
          }
          return realValue;
        }
        return s;
      });
    param.disabled = false;
    return texts;
  };

  let paramCount = 0;
  let isIfBlock = false;
  let processIfBlock = false;
  return extDataSelection.reduce<Param[]>(
    (acc, next) => {
      extDataSelection;
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

      const param: Param = acc[paramCount] ?? {};

      if (!acc[paramCount]) {
        acc[paramCount] = param;
      }

      if (next === '\t};') {
        paramCount++;
      } else if (next.startsWith('\tclass')) {
        param.id = parseClass(next);
      } else if (next.startsWith('\t\ttitle')) {
        param.title = parseTitle(next);
      } else if (next.startsWith('\t\tvalues[]')) {
        param.values = parseValues(next, param);
      } else if (next.startsWith('\t\tdefault')) {
        param.default = parseDefault(next, param);
      } else if (next.startsWith('\t\ttexts[]')) {
        param.valueText = parseTexts(next, param);
      }
      return acc;
    },
    [],
  );
}

const stringTable = parseStringTable();
const params = parseParams(stringTable);

console.log(params);
