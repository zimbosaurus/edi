import { writeFile, writeFileSync } from 'fs';
import { resolve } from 'path';
import { EdiFormat, makeStructureGroup as group, makeStructureSegment as segment } from '../lib/format';
import edi from '../lib/parser';
import { EdiStructure, Segment } from '../lib/types';

function path(file: string) {
    return resolve(__dirname, '../../', file);
}

const parser = edi(path('data/baplie.EDI'));

parser.once('end', () => console.log("SEGMENTS: " + (parser.segments() as Segment[]).length));

const format = new EdiFormat(parser);

const structure: EdiStructure = [
    segment('UNH'),
    segment('BGM'),
    segment('DTM'),
    group([
        segment('RFF'),
        segment('DTM'),
    ], true, 9)
]
const shape = {}

const result = format.structure(structure).outShape(shape).read();

writeFileSync(path('data/baplie_structure.esf'), JSON.stringify(structure));