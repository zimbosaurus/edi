import { StructureItem, StructureSegment } from '../structure/types';
import { RuleSelector, RuleProps } from './types';

export function makeSelectorApi() {
    return {
        wrapOr,
        hasLabel,
        getLabel: (props: RuleProps) => getLabel(props.shape.structure),
        isGroup: (props: RuleProps) => props.shape.structure.type != 'segment',
        isSegment: (props: RuleProps) => props.shape.structure.type == 'segment'
    }
}

/**
 * 
 * @param conditions 
 */
export function wrapOr(...conditions: RuleSelector<boolean>[]): RuleSelector<boolean> {
    return props => conditions.map(c => c(props)).reduce((prev, b) => prev || b, false);
}

/**
 * 
 * @param label 
 */
export function hasLabel(label: string): RuleSelector<boolean> {
    return props => {
        return getLabel(props.shape.structure) == label;
    }
}

/**
 * 
 * @param label 
 */
export function labelOnStack(label: string): RuleSelector<boolean> {
    return props => {
        return props.stack.some(g => getLabel(g.structure) == label);
    }
}

/**
 * 
 * @param id 
 */
export function matchId(id: string | RegExp): RuleSelector<boolean> {
    return props => {
        return props.shape.structure.type == 'segment' && props.shape.structure.id.search(id) != -1;
    }
}

/**
 * Make a default label for a datashape.
 * @param shape the shape
 * @returns the label
 */
export function getLabel(structure: StructureItem) {
    return structure?.label?.name || (structure as StructureSegment)?.id  || 'NO_LABEL';
}