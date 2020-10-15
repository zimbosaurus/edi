import makeFormat, { EdiFormat } from "./format";
import edi from './parser';
import { IEdiFormat, StructureGroup, StructureItem, StructureSegment } from "./types";

type DataContainer = StructureGroup & {
    data: {
        shape?: {}
    }
}

export function databuilder(format: IEdiFormat) {

    const groupStack: DataContainer[] = []

    format.any(({args, event}) => {
        switch (event) {
            case 'group_enter':
                groupStack.unshift(args as DataContainer);
                break;
            case 'group_exit':
                const g: DataContainer = groupStack.shift();
                const p: DataContainer = groupStack[0];
                const gLabel = g.label.name;

                if (!p.data.shape[gLabel]) {
                    p.data.shape[gLabel] = g.repeat > 1 ? [g] : g;
                }
                else if (typeof p.data.shape[gLabel] == typeof []) {
                    p.data.shape[gLabel].push(g);
                }
                break;
            case 'end':
                break;
            case 'segment_done':
                const item = args as StructureItem;
                const label = item.label.name;
                const c: DataContainer = groupStack[0];
                
                if (!c.data.shape[label]) {
                    c.data.shape[label] = item.repeat > 1 ? [item] : item;
                }
                else if (typeof c.data.shape[label] == typeof []) {
                    c.data.shape[label].push(item);
                }
                break;
        }
    })
}