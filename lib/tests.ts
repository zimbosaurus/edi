import { EdiFormat, makeStructureGroup as group, makeStructureSegment as segment } from '../lib/format';
import { EdiStructure } from '../lib/types';
import edi from "./parser";
import { resolvePath } from "./util";

export default async function tests() {
    const segmentsOnly = resolvePath('data/segments_only.edi');
    const coprarAnina = resolvePath('data/coprar_anina_1.edi');
    const format = new EdiFormat(edi());

    let r;

    // Sequence of mandatory segments.
    r = await format.structure([
        segment('UNB'),
        segment('UNH'),
        segment('BGM'),
        segment('DTM'),
        segment('RFF'),
    ])
    .read("UNB'UNH'BGM'DTM'RFF");
    console.log("result: " + r);

    // Sequence of mandatory and conditional segments. 
    await format.structure([
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