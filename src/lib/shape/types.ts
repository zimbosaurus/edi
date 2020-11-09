import { StructureGroup, StructureItem } from "../structure/types";
import { EdiFormatEventMap } from "../structure/events";
import { makeSelectorApi } from "../shape/api";
import { Segment } from "../parser";

/**
 * State held while processing an edistructure stream.
 */
export type EdiGroupState = {

    /**
     * 
     */
    structure: StructureGroup;

    /**
     * The data.
     */
    state: {};
}

/**
 * 
 */
export type ShapeRuleSet = (ShapeRule | ShapeRuleFactory)[]

/**
 * 
 */
export type ShapeRuleFactory = (api: SelectorApi) => ShapeRule;

/**
 * 
 */
export type ShapeRule = {
    label: string | RuleSelector<string>;
    conditions: RuleSelector<boolean>[];
}

/**
 * 
 */
export type RuleSelector<T> = (props: RuleProps) => T;

/**
 * 
 */
export type RuleProps = {
    stack: EdiGroupState[],
    group: EdiGroupState,
    shape: EdiShape | EdiGroupState
}

/**
 * 
 */
export type SelectorApi = ReturnType<typeof makeSelectorApi>;

/**
 * An item which is produced by processing edi segments using a structure.
 */
export type EdiShape<T = unknown> = {
    event: keyof EdiFormatEventMap;
    structure: StructureItem;
    data: T;
}

/**
 * Transforms a structurestream into a shapestream.
 */
export type EdiShapeCollector<T> = {
    collect: (stream: EdiStructureStream) => Promise<T>;
}

/**
 * The resulting stream of a StructureTransform.
 */
export type EdiStructureStream = ReadableStream<EdiShape>;