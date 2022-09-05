import { markdownTable } from 'markdown-table';
import type { Param } from './models';
import { ParamsParser } from './params-parser';
import { StringTableParser } from './string-table-parser';

class Main {
  constructor(
    private stringTableParser: StringTableParser,
    private paramsParser: ParamsParser,
  ) { }

  public printTable() {
    const params = this.extractParams();

    const headers = [
      'Param',
      'Title',
      'Default',
      'Description: Value'
    ];
    const rows = params.map(({ id, title, defaultValue, values }) => [
      id,
      title,
      `\`${defaultValue}\``,
      values.map(({ name, value }) => `${name}: \`${value}\``).join('\n'),
    ]);

    const mdTable = markdownTable(
      [headers, ...rows],
      {
        alignDelimiters: true,
        delimiterEnd: true,
        delimiterStart: true,
        padding: true
      },
    );
    console.log(mdTable);
  }

  private extractParams(): Param[] {
    this.paramsParser.stringTable = this.stringTableParser.parse();
    return this.paramsParser.parse();
  }
}

const main = new Main(
  new StringTableParser('uncompiled/co40_domination_4_64_blufor.altis/stringtable.xml'),
  new ParamsParser('uncompiled/co40_domination_4_64_blufor.altis/description.ext'),
);
main.printTable();
