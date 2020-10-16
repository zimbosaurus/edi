import makeFormat, { EdiFormat } from "./format";
import edi from './parser';
import { FORMAT_EVENT_DONE, IEdiFormat, StructureGroup, StructureItem, StructureSegment } from "./types/format";
import { PARSER_EVENT_END_DATA } from "./types/parser";

type DataShape = {
    shape: {[key: string]: {}[]}
    group: StructureGroup
}

export function databuilder(format: IEdiFormat): Promise<any> {
    return new Promise((resolve, reject) => {

        const groupStack: DataShape[] = []

        const handle = format.any(({ args, event }) => {
            const segment = args as StructureSegment;
            const group = args as StructureGroup;

            switch (event) {
                case 'group_enter': {
                    groupStack.unshift(
                        { group: args as StructureGroup, shape: {} }
                    );
                    break;
                }

                case 'group_exit': {
                    if (group.type == 'root') {
                        return;
                    }
                    const popped = groupStack.shift();
                    const label = popped.group.label.name || 'NO_LABEL';
                    appendShape(groupStack[0], popped.shape, label);
                    break;
                }
                
                case 'repeat': {
                    const repeat = {...groupStack[0]};
                    const label = repeat.group.label.name || 'NO_LABEL';
                    groupStack[0].shape = {};
                    appendShape(groupStack[1], repeat.shape, label);
                    break;
                }

                case 'segment_done': {
                    const label = segment?.label?.name || segment.id;
                    appendShape(groupStack[0], segment, label);
                    break;
                }

                case FORMAT_EVENT_DONE: {
                    format.removeListener(undefined, handle);
                    resolve(groupStack[0]);
                    break;
                }
            }
        })

        format.read();
    })
}

function appendShape(data: DataShape, item: {}, label: string) {
    const shape = data.shape;

    if (Object.keys(item).length == 0) {
        return;
    }

    if (shape[label]) {
        shape[label] = [...shape[label], item];
    }
    else {
        shape[label] = [item];
    }
}

/* const item = args as StructureItem;
const label = item.label.name;
const c: Data = groupStack[0];

if (!c.data.shape[label]) {
    c.data.shape[label] = item.repeat > 1 ? [item] : item;
}
else if (typeof c.data.shape[label] == typeof []) {
    c.data.shape[label].push(item);
}
break; */