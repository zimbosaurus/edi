import edi from '../lib/parser';
import { EdiFormat, makeStructureGroup as group, makeStructureSegment as segment } from '../lib/format';
import { EdiStructure } from '../lib/types';
import { resolvePath as path } from '../lib/util';
import tests from '../lib/tests';

const baplieFile = path('data/baplie.EDI');

const baplie: EdiStructure = [
    segment('UNB'),
    segment('UNH'),
    segment('BGM'),
    segment('DTM'),
    group([ // SG1
        segment('RFF'),
        segment('DTM', true, 9),
    ], true, 9),
    group([ // SG2
        segment('NAD'),
        group([ // SG3
            segment('CTA'),
            segment('COM', true, 9),
        ], true, 9)
    ], true, 9),
    group([ // SG4
        segment('TDT'),
        segment('LOC', false, 2),
        segment('DTM', false, 99),
        segment('RFF', true),
        segment('FTX', true),
    ], false, 3),
    group([ // SG5
        segment('LOC'),
        segment('GID', true),
        segment('GDS', true),
        segment('FTX', true, 9),
        segment('MEA', false, 9),
        segment('DIM', true, 9),
        segment('TMP', true),
        segment('RNG', true),
        segment('LOC', true, 9),
        segment('RFF', false),
        group([ // SG6
            segment('EQD'),
            segment('EQA', true, 9),
            segment('NAD', true, 9),
            segment('RFF', true, 9),
        ], true, 3),
        group([ // SG7
            segment('DGS'),
            segment('FTX', true),
        ], true, 999),
    ], true, 9999),
    segment('UNT')
]

const format = new EdiFormat(edi(baplieFile));
format.structure(baplie).read();