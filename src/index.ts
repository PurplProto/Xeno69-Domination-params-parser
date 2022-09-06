import { writeFileSync } from 'fs';
import { markdownTable } from 'markdown-table';
import { resolve } from 'path';
import type { Param } from './models.js';
import { ParamsParser } from './params-parser.js';
import { StringTableParser } from './string-table-parser.js';

class Main {
  constructor(
    private stringTableParser: StringTableParser,
    private paramsParser: ParamsParser,
  ) { }

  public writeMarkdownTable() {
    const mdTable = this.buildTable();

    const exportPath = 'exported-params-table.md';
    const resolvedExportPath = resolve(exportPath);
    const fileHeader = '# Domination Params\n\n';
    writeFileSync(resolvedExportPath, fileHeader + mdTable, { encoding: 'utf8' });
  }

  private buildTable(): string {
    const params = this.extractParams();

    const headers = [
      'Param',
      'Title',
      'Default',
      'Value: Description'
    ];
    const rows = params.map(({ id, title, defaultValue, values }) => [
      id,
      title,
      `\`${defaultValue}\``,
      values.map(({ name, value }) => `\`${value}\`: ${name}`).join(' <br /> '),
    ]);

    return markdownTable(
      [headers, ...rows],
      {
        alignDelimiters: true,
        delimiterEnd: false,
        delimiterStart: false,
        padding: true
      },
    );
  }

  private extractParams(): Param[] {
    this.paramsParser.stringTable = this.stringTableParser.parse();
    return this.paramsParser.parse();
  }
}

const main = new Main(
  new StringTableParser('domination/co30_Domination.Altis/stringtable.xml'),
  new ParamsParser('domination/co30_Domination.Altis/description.ext'),
);
main.writeMarkdownTable();
