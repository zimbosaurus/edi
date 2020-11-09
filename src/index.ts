import { GROUP_CONTACTS, GROUP_CONTAINERS, GROUP_PARTY, GROUP_RELATED_MESSAGE, GROUP_TRANSPORT } from './lib/structure/specs/BAPLIE';
import { resolve } from 'path';
import { writeFileSync } from 'fs';
import edi, { EdiParser, streamFile } from './lib';
import JsonBuilder, { EdiShape, ShapeRuleSet } from './lib/shape';
import EdiStructureTransform, { BAPLIE } from './lib/structure';
import ShapeTransform from './lib/shape/shapetransform';
import formatSegment from './lib/structure/segments';
import { Segment } from './lib/parser';

const rules: ShapeRuleSet = [
    api => ({
        label: api.getLabel,
        conditions: [
            api.wrapOr(
                api.hasLabel(GROUP_RELATED_MESSAGE),
                api.hasLabel(GROUP_CONTACTS),
                api.hasLabel(GROUP_PARTY),
                api.hasLabel(GROUP_TRANSPORT),
                api.hasLabel(GROUP_CONTAINERS)
            ),
            api.isGroup
        ]
    }),
    api => ({
        label: api.getLabel,
        conditions: [
            api.wrapOr(
                api.isSegment
            )
        ]
    })
];

start();

async function start() {
    const file = streamFile(resolve(__dirname, '../data/baplie.EDI'));
    const parser = new EdiParser();
    const structureTransform = new TransformStream(new EdiStructureTransform(BAPLIE));
    const jsonBuilder = new JsonBuilder(rules);
    const transform = new TransformStream(new ShapeTransform((shape: EdiShape<Segment>) => ({...shape, data: formatSegment(shape.data)})));

    const result = await jsonBuilder.collect(parser.parse(file).pipeThrough(structureTransform).pipeThrough(transform));

    writeFileSync('cool_test_file.json', JSON.stringify(result, undefined, 2));
}