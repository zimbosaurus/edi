import { StructureGroup, StructureSegment } from './format';
import { Segment } from './parser';
import { makeSelectorApi } from '../databuilder';

/**
 * 
 */
export type BuildRules = (BuildRule | BuildRuleFactory)[]

/**
 * 
 */
export type BuildRuleFactory = (api: SelectorApi) => BuildRule;

/**
 * 
 */
export type BuildRule = {
    label: string | ((props: SelectorProps) => string);
    conditions: ((props: SelectorProps) => boolean)[];
    selector?: (props: SelectorProps) => any;
}

/**
 * 
 */
export type ConditionSelector = (props: SelectorProps) => boolean;

/**
 * 
 */
export type SelectorApi = ReturnType<typeof makeSelectorApi>;

/**
 * 
 */
export type SelectorProps = {
    stack: GroupShape[];
    shape: DataShape;
}

/**
 * 
 */
export type GroupShape = {
    data: { [key: string]: (Segment | { [key: string]: (GroupShape['data']) }) }
    item: StructureGroup
}

/**
 * 
 */
export type SegmentShape = {
    data: Segment,
    item: StructureSegment
}

/**
 * Defines a structural item as forwarded by the databuilder.
 */
export type DataShape = GroupShape | SegmentShape;