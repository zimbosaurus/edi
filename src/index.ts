import { GROUP_CONTACTS, GROUP_CONTAINERS, GROUP_PARTY, GROUP_RELATED_MESSAGE, GROUP_TRANSPORT } from './lib/structure/specs/BAPLIE';
import { resolve } from 'path';
import { writeFileSync } from 'fs';
import edi from './lib';
import { ShapeRuleSet } from './lib/shape';
import { BAPLIE } from './lib/structure';

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
    const result = await edi({ spec: BAPLIE, shapeRules: rules }).file(resolve(__dirname, '../data/baplie.EDI')).build<{}>();
    writeFileSync('cool_test_file.json', JSON.stringify(result, undefined, 2));
}