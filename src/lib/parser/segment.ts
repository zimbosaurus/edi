import { EdiComposite, EdiElement } from "./types";

/**
 * 
 */
export const SEGMENT_DELIMITER = "'";

/**
 * 
 */
export const COMPOSITE_DELIMITER = "+";

/**
 * 
 */
export const ELEMENT_DELIMITER = ":";

/**
 * Defines an edifact segment.
 */
export default class Segment {

    private data: string;
    private id: string;
    private composites: EdiComposite[];

    /**
     * 
     * @param str 
     */
    constructor(str: string, compositeDelimiter: string | RegExp = COMPOSITE_DELIMITER, elementDelimiter: string | RegExp = ELEMENT_DELIMITER) {
        this.data = str;
        this.id = segmentId(str);
        this.composites = segmentComposites(str, compositeDelimiter, elementDelimiter);
    }

    /**
     * Get the entire segment.
     * @returns the segment data
     */
    getData(): string {
        return this.data;
    }

    /**
     * Extract the id of the segment.
     * @returns the id
     */
    getId(): string {
        return this.id;
    }

    /**
     * 
     */
    getComposites(): EdiComposite[] {
        return this.composites;
    }

}

/**
 * 
 * @param str 
 * @param compositeDelimiter 
 * @param elementDelimiter 
 */
export function segmentComposites(str: string, compositeDelimiter: string | RegExp = COMPOSITE_DELIMITER, elementDelimiter: string | RegExp = ELEMENT_DELIMITER) {
    return str.split(compositeDelimiter).slice(1).map<EdiComposite>(c => ({
        getData: () => c,
        getElements: () => segmentElements(c, elementDelimiter)
    }));
}

/**
 * 
 * @param str 
 * @param elementDelimiter 
 */
export function segmentElements(str: string, elementDelimiter: string | RegExp = ELEMENT_DELIMITER): EdiElement[] {
    return str?.split(elementDelimiter).map<EdiElement>(el => ({getData: () => el}));
}

/**
 * 
 * @param segment 
 */
export function segmentId(segment: string): string {
    return segment.slice(0, 3);
}