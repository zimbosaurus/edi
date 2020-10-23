import { StructureGroup, StructureSegment } from './format';
import { Segment } from './parser';

/**
 * 
 */
export type Shape = {
    selectLabel: ShapeSelector<string>,
    selectShape: {[label: string]: ShapeSelector<any>}
}

/**
 * 
 */
export type ShapeSelector<T> = (groupStack: GroupShape[], dataShape: DataShape) => T;

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
 * 
 */
export type DataShape = GroupShape | SegmentShape;