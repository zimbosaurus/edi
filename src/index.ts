import { resolvePath as path, resolvePath } from './lib/util';
import { baplie } from './lib/formats/baplie';
import { BuildRules, SelectorApi } from './lib/types/databuilder';
import edi, { streamFile, streamString } from './lib';
import { Segment } from './lib/types/parser';
import { writeFileSync } from 'fs';
import { EdiStructure } from './lib/types/format';
import { makeStructureGroup, makeStructureSegment } from './lib/structure';
import { Model, vesselShape } from './lib/vessel';

(async () => {
    const baplieFile = path('data/baplie.EDI');

    const baplieRules: BuildRules = [
        api => ({
            label: 'containers',
            selector: ({shape}) => ({num: shape.item.data.repetitions, ...shape.data}),
            conditions: [
                api.hasLabel('SG5')
            ]
        }),
        api => ({
            label: () => api.getLabel(),
            selector: () => api.ifSegment(s => s.data.getData()),
            conditions: [
                api.labelOnStack('SG5'),
                api.matchId(/(EQD)|(LOC)|(DIM)/)
            ]
        }),
        api => ({
            label: () => api.getLabel(),
            selector: ({shape}) => shape.data,
            conditions: [
                api.wrapOr(api.labelOnStack('SG5')),
                api.isGroup()
            ]
        })
    ]

    const testRules: BuildRules = [
        api => ({
            label: () => api.getLabel(),
            selector: ({shape}) => shape.item.type == 'segment' ? (shape.data as Segment).getData() : shape.data,
            conditions: [
                ({shape}) => shape.item.type != 'segment' || shape.item.id == 'BEB'
            ]
        })
    ]

    const testStructure: EdiStructure = [
        makeStructureSegment('UNA'),
        makeStructureSegment('UNB'),
        makeStructureSegment('UNH'),
        makeStructureGroup([
            makeStructureSegment('LOC'),
            makeStructureSegment('TDT'),
            makeStructureSegment('RFF'),
            makeStructureGroup([
                makeStructureSegment('BEB'),
                makeStructureSegment('BOB', true),
            ], {label: {name: 'g2'}, repeat: 9, conditional: true})
        ], {label: {name: 'g1'}, repeat: 99, conditional: true}),
        makeStructureSegment('END')
    ]

    const testData = [
        "UNA'UNB'UNH'",

        "LOC'TDT'RFF'",

        "LOC'TDT'RFF'",

        "LOC'TDT'RFF'",
        "BEB'",
        "BEB'",

        "LOC'TDT'RFF'",
        "BEB'BOB'",
        "BEB'",
        "BEB'BOB'",
        "BEB'",

        "END"
    ].join('');

    try {
        const model = new Model();
        //const result = await edi({ buildRules: vesselShape, structure: baplie, file: baplieFile }).build();
        const result = await model.readVessel(model.parser.parse(streamFile(baplieFile)))

        writeFileSync(path('data/results.json'), JSON.stringify(result, undefined, 2));
/*         const testR = await edi({dataRules: testRules, structure: testStructure, text: testData}).build();
        writeFileSync(path('data/testresults.json'), JSON.stringify(testR, undefined, 2)); */
    }
    catch (err) {
        console.error(err);
    }
})()