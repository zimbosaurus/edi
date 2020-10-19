import { resolvePath as path, resolvePath } from '../lib/util';
import { baplie } from '../lib/formats/baplie';
import { DataShape, SegmentShape, Shape } from '../lib/types/databuilder';
import edi from '../lib';
import { makeLabel } from '../lib/databuilder';
import { writeFileSync } from 'fs';

(async () => {
    const baplieFile = path('data/baplie.EDI');

    const shape: Shape = {
        selectLabel: (groupStack, shape) => {
            const label = makeLabel(shape);
            if (label == 'SG5') {
                return 'containers';
            }
            return label;
        },
        selectShape: {
            '*': (groupStack, shape) => {
                if (shape.item.type == 'segment') {
                    return (shape as SegmentShape).data.getData();
                }
                else {
                    return shape.data;
                }
            },
        }
    }

    try {
        const result = await edi({ shape, structure: baplie, file: baplieFile }).build();
        writeFileSync(path('data/results.json'), JSON.stringify(result, undefined, 2));
    }
    catch (err) {
        console.error(err);
    }
})()