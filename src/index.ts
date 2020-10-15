import edi from '../lib/parser';
import { EdiFormat, makeStructureGroup as group, makeStructureSegment as segment } from '../lib/format';
import { resolvePath as path } from '../lib/util';
import tests from '../lib/tests';
import { databuilder } from '../lib/databuilder';
import baplie from '../lib/formats/baplie';

const baplieFile = path('data/baplie.EDI');
const format = new EdiFormat(edi(baplieFile)).structure(baplie);

databuilder(format);
format.read();

//tests();