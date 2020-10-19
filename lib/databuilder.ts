import { FORMAT_EVENT_DONE, FORMAT_EVENT_GROUP_ENTER, FORMAT_EVENT_GROUP_EXIT, FORMAT_EVENT_REPEAT, FORMAT_EVENT_SEGMENT_DONE, IEdiFormat, StructureGroup, StructureItem, StructureSegment } from "./types/format";
import { Segment } from "./types/parser";
import { GroupShape, Shape, DataShape, SegmentShape, ShapeSelector } from "./types/databuilder";

const DATABUILDER_ERROR_NO_SHAPE = 'Databuilder received invalid shape.'; // TODO better

/**
 * 
 * @param format 
 * @param stream
 * @returns
 */
export default function databuilder(format: IEdiFormat, shape: Shape, stream: ReadableStream<Segment>): Promise<any> { // TODO better function name
    return new Promise((resolve, reject) => {
        const groupStack: GroupShape[] = []

        const handle = format.any(({ args, event }) => {
            const group = args as StructureGroup;

            switch (event) {
                case FORMAT_EVENT_GROUP_ENTER: {
                    groupStack.unshift(
                        { item: args as StructureGroup, data: {} }
                    );
                    break;
                }

                case FORMAT_EVENT_GROUP_EXIT: {
                    if (group.type == 'root') {
                        return;
                    }
                    const popped = groupStack.shift();
                    appendShape(groupStack, popped);
                    break;
                }
                
                case FORMAT_EVENT_REPEAT: {
                    const repeat: GroupShape = {...groupStack[0]};
                    groupStack[0].data = {};
                    appendShape(groupStack.slice(1), repeat);
                    break;
                }

                case FORMAT_EVENT_SEGMENT_DONE: {
                    appendShape(groupStack, args as SegmentShape);
                    break;
                }

                case FORMAT_EVENT_DONE: {
                    format.removeListener(undefined, handle);
                    resolve(groupStack[0].data);
                    break;
                }
            }
        })

        format.read(stream);
    })

    /**
     * 
     * @param group 
     * @param data 
     */
    function appendShape(groupStack: GroupShape[], data: DataShape) {
        // Check if item really is there
        if (Object.keys(data).length == 0) {
            return;
        }

        const head = groupStack[0];
        let label: string;
        let append: any;

        const shapeHasLabel = () => Object.keys(shape.selectShape).includes((label = shape.selectLabel(groupStack, data)));
        const appendIsNotEmpty = () => Object.keys(append).length > 0;
        const appendIsDefined = () => (append = shape.selectShape[shapeHasLabel() ? label : '*'](groupStack, data)) && appendIsNotEmpty();

        if (shape) {
            if (appendIsDefined()) {
                appendAny(head.data, append, label);
            }
        } else {
            appendAny(head.data, data.item.type == 'segment' ? (data.data as Segment).getData() : data.data, makeLabel(data));
        }
    }
}

function appendAny(parent: {}, obj: any, label: string) {
    if (parent[label]) {
        parent[label] = [...parent[label], obj];
    }
    else {
        parent[label] = [obj];
    }
}

/**
 * 
 * @param shape 
 */
export function makeLabel(shape: DataShape) {
    const { item } = shape;
    return item?.label?.name || (shape as SegmentShape).item?.id  || 'NO_LABEL';
}