import { ParamsParser } from './params-parser';
import { StringTableParser } from './string-table-parser';

class Main {
  constructor(
    private stringTableParser: StringTableParser,
    private paramsParser: ParamsParser,
  ) { }

  public buildTable() {
    this.extractParams();
  }

  private extractParams() {
    this.paramsParser.stringTable = this.stringTableParser.parse();
    const params = this.paramsParser.parse();
    console.log(params);
  }
}

const main = new Main(
  new StringTableParser('uncompiled/co40_domination_4_64_blufor.altis/stringtable.xml'),
  new ParamsParser('uncompiled/co40_domination_4_64_blufor.altis/description.ext'),
);
main.buildTable();
