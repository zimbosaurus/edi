import { makeStructureGroup as group, makeStructureSegment as segment } from './structure';
import { EdiStructure } from './types/format';

export const GROUP_CONTAINERS = 'containers';
export const GROUP_EQUIPMENT = 'equipment';
export const GROUP_DANGEROUS_CARGO = 'dangerous_cargo';

/**
 * Baplie EDIFACT format.
*/
export const baplie: EdiStructure = [
    segment('UNB'),
    segment('UNH'),
    segment('BGM'),
    segment('DTM'),
    group([ // SG1
        segment('RFF'),
        segment('DTM', true, 9),
    ], {conditional: true, repeat: 9, label: {name: 'SG1'}}),
    group([ // SG2
        segment('NAD'),
        group([ // SG3
            segment('CTA'),
            segment('COM', true, 9),
        ], {conditional: true, repeat: 9, label: {name: 'SG2'}}),
    ], {conditional: true, repeat: 9, label: {name: 'SG3'}}),
    group([ // SG4
        segment('TDT'),
        segment('LOC', false, 2),
        segment('DTM', false, 99),
        segment('RFF', true),
        segment('FTX', true),
    ], {conditional: false, repeat: 3, label: {name: 'SG4'}}),
    group([ // SG5
        segment('LOC'),
        segment('GID', true),
        segment('GDS', true),
        segment('FTX', true, 9),
        {...segment('MEA', false, 9), label: {
            name: 'weight',
            description: "A segment specifying physical weights related to an equipment detail or a goods item detail."
        }},
        segment('DIM', true, 9),
        segment('TMP', true),
        segment('RNG', true),
        segment('LOC', true, 9),
        segment('RFF', false),
        group([ // SG6
            {...segment('EQD'), label:{
                name: 'equipment_details',
            }},
            segment('EQA', true, 9),
            segment('NAD', true, 9),
            segment('RFF', true, 9),
        ], {conditional: true, repeat: 3, label: {name: GROUP_EQUIPMENT}}),
        group([ // SG7
            segment('DGS'),
            segment('FTX', true),
        ], {conditional: true, repeat: 999, label: {name: GROUP_DANGEROUS_CARGO}}),
    ], {conditional: true, repeat: 9999, label: {name: GROUP_CONTAINERS}}),
    segment('UNT')
]

export default baplie;