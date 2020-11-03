import { FORMAT_EVENT_DONE, FORMAT_EVENT_GROUP_ENTER, FORMAT_EVENT_GROUP_EXIT, FORMAT_EVENT_REPEAT, FORMAT_EVENT_SEGMENT_DONE, IEdiFormat, StructureGroup } from "./types/format";
import { GroupShape, DataShape, SegmentShape, BuildRules, SelectorProps, BuildRule, BuildRuleFactory, SelectorApi, ConditionSelector } from "./types/databuilder";
import { Segment } from "./types/parser";
import formatSegment from "./structure/segments";

/**
 * Reads a segmentstream using a format, and outputs the data in a shape specified by a set of rules.
 * @param format the formatter
 * @param rules the ruleset
 * @param stream the stream of segments
 * @returns the formatted data
 */
export default function databuilder(format: IEdiFormat, rules: BuildRules, stream: ReadableStream<Segment>): Promise<any> { // TODO better function name
    return new Promise((resolve, reject) => {
        const groupStack: GroupShape[] = []

        const handle = format.any(({ args, event }) => {
            const group = args as StructureGroup;

            switch (event) {
                case FORMAT_EVENT_GROUP_ENTER: {
                    groupStack.unshift(
                        { item: group, data: {} }
                    );
                    break;
                }

                case FORMAT_EVENT_GROUP_EXIT: {
                    if (group.type == 'root') {
                        return;
                    }
                    const popped = groupStack.shift();
                    appendShape(groupStack, popped, rules);
                    break;
                }
                
                case FORMAT_EVENT_REPEAT: {
                    const repeat: GroupShape = {...groupStack[0]};
                    appendShape(groupStack.slice(1), repeat, rules);
                    groupStack[0].data = {};
                    break;
                }

                case FORMAT_EVENT_SEGMENT_DONE: {
                    appendShape(groupStack, args as SegmentShape, rules);
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
}

/**
 * Specifically append a datashape to a group, using a ruleset.
 * @param group 
 * @param shape 
 * @param rules
 */
function appendShape(stack: GroupShape[], shape: DataShape, rules: BuildRules | BuildRuleFactory[]) {
    if (!shape || Object.keys(shape.data).length == 0) {
        return;
    }

    const head = stack[0];
    let props: SelectorProps = {stack, shape};
    let api = makeSelectorApi(props);

    for (const r of rules) {
        const rule = (r as BuildRuleFactory)?.(api) || (r as BuildRule);
        if (rule.conditions.every(condition => condition(props))) {
            const label = typeof rule.label == 'string' ? rule.label : rule.label?.(props) || 'NO_LABEL';
            const result = rule.selector?.(props) || (shape.item.type == 'segment' ? (shape.data as Segment)?.getData() || shape.data : shape.data);

            appendObj(head.data, result, label);
        }
    }
}

/**
 * Append any type of object to another parent object.
 * If multiple objects are appended the same key they will be collected in an array under that key.
 * @param parent the parent
 * @param obj the object to append
 * @param key the object accessor
 */
function appendObj(parent: {}, obj: any, key: string) {
    if (parent[key]) {
        parent[key] = [...parent[key], obj];
    }
    else {
        parent[key] = [obj];
    }
}


/**
 * 
 * @param api 
 * @param factory 
 */
export function makeRules(api: SelectorApi, factory: BuildRuleFactory[]) {
    return factory.map(fn => fn(api));
}

/**
 * 
 * @param props 
 */
export function makeSelectorApi(props: {stack: GroupShape[], shape: DataShape}) {
    const { shape } = props;
    return {
        hasLabel,
        matchId,
        labelOnStack,
        wrapOr,
        ifSegment: <T>(fn: (shape: SegmentShape) => T) => ifSegment<T>(props, fn),
        ifGroup: <T>(fn: (shape: GroupShape) => T) => ifGroup<T>(props, fn),
        isGroup: () => (() => shape.item.type != 'segment') as ConditionSelector,
        isSegment: () => (() => shape.item.type == 'segment') as ConditionSelector,
        getLabel: () => getLabel(shape),
        getProps: () => props,
        formatSegment: () => (formatSegment(shape.data as Segment) || { label: getLabel(shape), data: (shape.data as Segment).getData() })
    }
}

/**
 * 
 * @param conditions 
 */
export function wrapOr(...conditions: ConditionSelector[]): ConditionSelector {
    return props => conditions.map(c => c(props)).reduce((prev, b) => prev || b, false);
}

/**
 * 
 * @param props 
 * @param fn 
 */
export function ifSegment<T>(props: SelectorProps, fn: (shape?: SegmentShape) => T): false | T {
    const isSegment = props.shape.item.type == 'segment';
    return (isSegment && fn(props.shape as SegmentShape));
}

/**
 * 
 * @param props 
 * @param fn 
 */
export function ifGroup<T>(props: SelectorProps, fn: (shape?: GroupShape) => T): false | T {
    const isGroup = props.shape.item.type != 'segment';
    return (isGroup && fn(props.shape as GroupShape));
}

/**
 * 
 * @param label 
 */
export function hasLabel(label: string): ConditionSelector {
    return props => {
        return getLabel(props.shape) == label;
    }
}

/**
 * 
 * @param label 
 */
export function labelOnStack(label: string): ConditionSelector {
    return props => {
        return props.stack.some(g => getLabel(g) == label);
    }
}

/**
 * 
 * @param id 
 */
export function matchId(id: string | RegExp): ConditionSelector {
    return props => {
        return props.shape.item.type == 'segment' && props.shape.item.id.search(id) != -1;
    }
}

/**
 * Make a default label for a datashape.
 * @param shape the shape
 * @returns the label
 */
export function getLabel(shape: DataShape) {
    const { item } = shape;
    return item?.label?.name || (shape as SegmentShape).item?.id  || 'NO_LABEL';
}