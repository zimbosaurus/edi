import { EdiFormat, makeStructureGroup as group, makeStructureSegment as segment } from '../lib/format';
import { EdiStructure, StructureGroup } from '../lib/types';
import edi from "./parser";

export default async function tests() {
    const format = new EdiFormat(edi());
    format.on('group_enter', (group: StructureGroup) => console.log("enter: " + group.label?.name));
    format.on('group_exit', (group: StructureGroup) => console.log("exit: " + group.label?.name));

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
        ], {conditional: true, repeat: 9}),
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
            ], {conditional: false, repeat: 2, label: {name: 'inner'}})
        ], {conditional: false, repeat: 3, label: {name: 'outer'}}),
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