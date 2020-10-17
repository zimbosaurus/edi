import edi from '../lib/parser';
import { resolvePath as path } from '../lib/util';
import { databuilder } from '../lib/databuilder';
import baplie from '../lib/formats/baplie';
import { EdiFormat } from '../lib/format';
import { writeFileSync } from 'fs';

const baplieFile = path('data/baplie.EDI');
const format = new EdiFormat(edi(baplieFile)).structure(baplie);

(async () => {
    const shape = await format.build();
    writeFileSync('data/result.min.json', JSON.stringify(shape.shape['SG5']));
})()


//tests();