import { writeFileSync } from 'fs';
import { markdownTable } from 'markdown-table';
import { resolve } from 'path';
import { MdHelpers } from './helpers.js';
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

  public writeMarkdownWikiPage() {
    const mdWikiPage = this.buildWikiPage();

    const exportPath = 'Wiki_cfgparams.txt';
    const resolvedExportPath = resolve(exportPath);
    writeFileSync(resolvedExportPath, mdWikiPage, { encoding: 'utf8' });
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

  private buildWikiPage(): string {
    const params = this.extractParams();

    const description = [
      MdHelpers.bold('Domination'),
      ' has quite a lot of params a logged in admin can change. If a database is used those params can also be changed',
      ' in the dom_params2 database table (_using a database always overrides changes an admin may have made_). Or if ',
      'someone wants to modify the mission they can also be changed in description.ext inside the mission root folder ',
      '(again, if a database is used the database params values will override description.ext values).',
    ];
    const headers = [
      description.join(''),
      MdHelpers.theamaticBreak(),
      MdHelpers.bold('Available params (first description.ext/database, second server lobby):'),
      '',
    ];
    const rows = params.flatMap(({ id, title, defaultValue, values }) => [
      `${MdHelpers.h4(MdHelpers.bold(`${id} / ${title}`))}`,
      `${MdHelpers.codeBlock(MdHelpers.lineBreak(
        `Default: ${defaultValue} - ${values.find(v => v.value === defaultValue)?.name}`,
      ))}`,
      MdHelpers.lineBreak(MdHelpers.codeBlock('Available options:')),
      ...MdHelpers.list(values.map(
        ({ name, value }) => MdHelpers.lineBreak(`${name} (${value})`),
      )).map(v => MdHelpers.codeBlock(v)),
      '',
    ]);

    return headers.concat(rows).join('\n');
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
main.writeMarkdownWikiPage();
