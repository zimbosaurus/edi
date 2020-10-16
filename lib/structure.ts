import { StructureGroup, StructureItem, StructureLabel, StructureSegment } from "./types/format"

type MakeStructureGroupOptions = {
    conditional?: boolean,
    repeat?: number,
    label?: StructureLabel
}
const defaultGroupOptions: MakeStructureGroupOptions = {
    conditional: false,
    repeat: 1
}

/**
 * 
 * @param id 
 * @param conditional 
 * @param repeat 
 */
export function makeStructureSegment(id: string, conditional = false, repeat = 1) {
    return {
        type: 'segment',
        id, conditional, repeat
    } as StructureSegment
}

/**
 * 
 * @param entries 
 * @param conditional 
 * @param repeat 
 */
export function makeStructureGroup(entries: StructureItem[], options = defaultGroupOptions) {
    options = {...defaultGroupOptions, ...options}
    return {
        type: 'group',
        entries,
        ...options
    } as StructureGroup
}

/**
 * 
 * @param item 
 */
export function applyLabel(item: StructureItem, name?: string, desc?: string, info?: any): StructureItem {
    return {...item, label: {name, description: desc, info} }
}
