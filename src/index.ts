import { writeFileSync } from 'fs';
import { resolve } from 'path';
import edi from './lib';
import baplie, { GROUP_TRANSPORT, GROUP_RELATED_MESSAGE, GROUP_CONTACTS, GROUP_PARTY, GROUP_CONTAINERS } from './lib/structure/baplie';
import { BuildRules } from './lib/types/databuilder';
import { composites } from './lib/parser';

const rules: BuildRules = [
    api => ({
        label: api.getLabel(),
        conditions: [
            api.wrapOr(
                api.hasLabel(GROUP_RELATED_MESSAGE),
                api.hasLabel(GROUP_CONTACTS),
                api.hasLabel(GROUP_PARTY),
                api.hasLabel(GROUP_TRANSPORT),
                api.hasLabel(GROUP_CONTAINERS)
            ),
            api.isGroup()
        ]
    }),
    api => ({
        conditions: [
            api.wrapOr(
                api.isSegment()
            )
        ],
        label: () => api.formatSegment().label,
        selector: () => api.formatSegment().data
    })
];


start();

async function start() {
    const result = await edi({ structure: baplie, buildRules: rules }).file(resolve(__dirname, '../data/baplie.EDI')).build();
    writeFileSync('cool_test_file.json', JSON.stringify(result, undefined, 2));

    console.log(composites("TDT+20+560957+1+11+UFE:172:20+++CQYU:103::ANINA").map(c => c.getElements().map(e => e.getData())))
}