import { EdiFormat, makeStructureGroup as group, makeStructureSegment as segment } from '../lib/format';
import { EdiStructure } from '../lib/types';
import edi from "./parser";
import { resolvePath } from "./util";

export default async function tests() {
    const format = new EdiFormat(edi());

    let r;

    console.log("Sequence of mandatory segments");
    r = await format.structure([
        segment('UNB'),
        segment('UNH'),
        segment('BGM'),
        segment('DTM'),
        segment('RFF'),
    ])
    .read("UNB'UNH'BGM'DTM'RFF");
    console.log("result: " + r);

    console.log("Sequence of mandatory and conditional segments");
    r = await format.structure([
        segment('UNB'),
        segment('UNH'),
        segment('BGM'),
        segment('DTM', true),
        segment('RFF'),
        segment('TDT', true),
        segment('LOC', true),
        segment('NAD'),
        segment('TDT'),
        segment('RFF'),
    ])
    .read("UNB'UNH'BGM'RFF'NAD'TDT'RFF");
    console.log("result: " + r);

    console.log("Repeating segments");
    r = await format.structure([
        segment('UNB'),
        segment('UNH'),
        segment('BGM', true, 9),
        segment('RFF'),
        segment('NAD', false, 3),
        segment('TDT'),
        segment('RFF'),
    ])
    .read("UNB'UNH'BGM'BGM'BGM'RFF'NAD'NAD'NAD'TDT'RFF");
    console.log("result: " + r);

    console.log("Repeating group");
    r = await format.structure([
        segment('UNB'),
        segment('UNH'),
        segment('BGM'),
        group([
            segment('LOC'),
            segment('NAD'),
            segment('TDT')
        ], true, 9),
        segment('RFF')
    ])
    .read([
        'UNB',
        'UNH',
        'BGM',
            'LOC',
            'NAD',
            'TDT',
            'LOC',
            'NAD',
            'TDT',
        'RFF'
    ].join("'"));
    console.log("result: " + r);

    console.log("Nested groups");
    r = await format.structure([
        segment('UNA'),
        segment('UNH'),
        segment('BGM', true),
        group([
            segment('TDT'),
            segment('FTX', true, 2),
            group([
                segment('LOC'),
                segment('NDA', false, 3),
            ], false, 2)
        ], false, 3),
        segment('UNT')
    ])
    .read([
        'UNA',
        'UNH',
            'TDT',
            'FTX',
            'FTX',
                'LOC',
                'NDA',
                'NDA',
            'TDT',
                'LOC',
                'NDA',
        'UNT'
    ].join("'"));
    console.log("result: " + r);
}

function e(fn: () => any) {
    try {
        fn();
        console.log(true);
    }
    catch (e) {
        console.error(e);
    }
}