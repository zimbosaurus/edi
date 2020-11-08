
/**
 * 
 */
export type StructureLabel = {
    name?: string;
    description?: string;
}

/**
 * 
 */
export type StructureMeta = {
    repetitions: number;
    entryPointer: number;
}

/**
 * 
 */
export type StructureSegment = {
    type: 'segment';
    conditional: boolean;
    repeat: number;
    id: string;

    meta: StructureMeta;
    label: StructureLabel;
}

/**
 * 
 */
export type StructureGroup = {
    type: 'group' | 'root';
    conditional: boolean;
    repeat: number;
    entries: EdiStructureSpec;

    meta?: StructureMeta;
    label?: StructureLabel;
}

/**
 * 
 */
export type StructureItem = StructureSegment | StructureGroup;

/**
 * 
 */
export type EdiStructureSpec = StructureItem[];