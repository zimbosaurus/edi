import makeFormat, { EdiFormat } from "./format";
import edi from './parser';
import { FORMAT_EVENT_DONE, IEdiFormat, StructureGroup, StructureItem, StructureSegment } from "./types/format";
import { PARSER_EVENT_END_DATA, Segment } from "./types/parser";

type DataShape = {
    shape: {[key: string]: any[]}
    group: StructureGroup
}

/**
 * 
 * @param format 
 */
export function databuilder(format: IEdiFormat, data?: string): Promise<any> { // TODO better function name
    return new Promise((resolve, reject) => {

        const groupStack: DataShape[] = []

        const handle = format.any(({ args, event }) => {
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
                    const {segment, item} = args as {segment: Segment, item: StructureSegment};
                    const label = item?.label?.name || item.id;
                    appendShape(groupStack[0], {data: segment.getData(), components: segment.getComponents().map(c => c.getData())}, label);
                    break;
                }

                case FORMAT_EVENT_DONE: {
                    format.removeListener(undefined, handle);
                    resolve(groupStack[0]);
                    break;
                }
            }
        })

        format.read(data);
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