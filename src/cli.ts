import { edi, format } from '../build/index';
import { makeStructureSegment } from '../lib/structure';

const args = process.argv.splice(2, 2);

(async () => {
    const f = format(edi()).structure([makeStructureSegment('EQD'), makeStructureSegment('UNH')]);
    f.read();
})()