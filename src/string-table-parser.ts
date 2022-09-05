import { XMLParser } from 'fast-xml-parser';
import { readFileSync } from 'fs';
import { resolve } from 'path';

type ParamXmlKey = {
  '@_ID': string;
  English: string;
};

type StringTableStructure = {
  Project: {
    Package: {
      Container: {
        Key: ParamXmlKey[];
      };
    };
  };
};

export class StringTableParser {
  private readonly fileData: string;
  private readonly xmlParser: XMLParser;
  private stringTable: Map<string, string> = new Map();

  constructor(filePath: string) {
    const resolvedPath = resolve(filePath);
    this.fileData = readFileSync(resolvedPath, { encoding: 'utf8', flag: 'r' });
    this.xmlParser = new XMLParser({ ignoreAttributes: false });
  }

  /**
   * parse
   */
  public parse() {
    if (this.stringTable.size > 0) {
      return this.stringTable;
    }

    this.stringTable = new Map<string, string>();
    const stringXmlObject: StringTableStructure = this.xmlParser.parse(this.fileData);

    stringXmlObject.Project.Package.Container.Key
      .forEach(v => this.stringTable.set(v['@_ID'], v.English));

    return this.stringTable;
  }
}
