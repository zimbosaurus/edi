import edi from '../lib/parser';
import { EdiFormat, makeStructureGroup as group, makeStructureSegment as segment } from '../lib/format';
import { EdiStructure } from '../lib/types';
import { resolvePath as path } from '../lib/util';
import tests from '../lib/tests';

const baplie: EdiStructure = [
    segment('UNB'),
    segment('UNH'),
    segment('BGM'),
    segment('DTM'),
    group([
        segment('RFF'),
        segment('DTM'),
    ], true, 9)
]

tests();