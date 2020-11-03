import { Segment } from '../types/parser';

export type SegmentFormatter = (segment: Segment) => { label: string, data: any }
export type FormattedSegment<T> = {
    label: string;
    data: T
}

type LOC = FormattedSegment<{
    cell?: string;
    name?: string;
}>

function LOC(segment: Segment) {
    const composites = segment.getComposites();
    const ATTR_CODE = composites[0].getData();

    let label: string, data: any;

    data = {
        cell: composites[1].getElements()[0].getData(),
    }

    switch (ATTR_CODE) {
        default:
            label = 'location'
            break;
        case '9':
            label = 'POL'
            break;
        case '11':
            label = 'POD'
            break;
        case '83':
            label = 'FPOD'
            break;
        case '147':
            label = 'cell'
            break;
    }

    return { label, data };
}

function RFF(segment: Segment) {
    const composites = segment.getComposites();
    const ATTR_CODE = composites[0].getData();

    let label: string, data: any;

    data = composites[0].getElements()[1].getData();
    switch (ATTR_CODE) {
        default:
        case 'BM':
            label = 'reference'
            break;
    }

    return { label, data };
}

function MEA(segment: Segment) {
    const composites = segment.getComposites();
    const ATTR_CODE = composites[0].getData();

    let label: string, data: any;

    data = composites[2].getElements()[1].getData() + "KG";
    switch (ATTR_CODE) {
        default:
        case 'WT':
            label = 'weight'
            break;
    }

    return { label, data };
}

type TDT = FormattedSegment<{
    carrier: {
        name: string;
    }
}>

function TDT(segment: Segment): TDT {
    const composites = segment.getComposites();

    let label: string, data: any;

    data = {
        carrier: {
            name: segment.getData()
        }
    }
    label = 'details'

    return { label, data };
}

type DTM = FormattedSegment<{
    time?: string;
    format?: string;
}>

function DTM(segment: Segment): DTM {
    const composites = segment.getComposites();
    const ATTR_CODE = composites[0].getData();

    let label: string, data: any;

    data = {
        time: composites[0].getElements()[1]?.getData(),
        format: composites[0].getElements()[2]?.getData(),
    }

    switch (ATTR_CODE) {
        default:
            label = 'date'
            break;
        case '132':
            label = 'arrival'
            break;
        case '133':
            label = 'departure'
            break;
        case '137':
            label = 'time'
            break;
    }

    return { label, data };
}

export const SEGMENTS: {[id: string]: SegmentFormatter} = {
    LOC,
    RFF,
    MEA,
    TDT,
    DTM
}

export default function formatSegment(segment: Segment, segments = SEGMENTS) {
    return segments[segment.getId()]?.(segment);
}