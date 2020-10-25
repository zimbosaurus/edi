import { EdiFormat, EdiParser } from '.';
import baplie, { GROUP_CONTAINERS, GROUP_EQUIPMENT } from './baplie';
import databuilder from './databuilder';
import { BuildRules } from './types/databuilder';
import { IEdiFormat } from './types/format';
import { IEdiParser, Segment } from './types/parser';

export type Container = {
    id: string;
    bay: number;
    slot: number;
    size?: number
    weight?: number;
    carrier?: string;

    LOC?: string[] | string;
    GID?: string[] | string;
    GDS?: string[] | string;
    FTX?: string[] | string;
    DIM?: string[] | string;
    TMP?: string[] | string;
    RNG?: string[] | string;
    RFF?: string[] | string;
    
    [GROUP_EQUIPMENT]?: {
        equipment_details?: string[] | string;
        EQA?: string[] | string;
        NAD?: string[] | string;
        RFF?: string[] | string;
    }
}

export type Vessel = {
    containers: Container[];
}

export const vesselShape: BuildRules = [
    api => ({
        label: api.getLabel(),
        conditions: [
            api.hasLabel(GROUP_CONTAINERS),
            api.isGroup()
        ]
    }),
    api => ({
        label: api.getLabel(),
        conditions: [
            api.labelOnStack(GROUP_CONTAINERS),
            api.hasLabel(GROUP_EQUIPMENT),
            api.isGroup()
        ]
    }),
    api => ({
        label: api.getLabel(),
        selector: () => api.ifSegment(shape => shape.data.getComponents().map(c => c.getData())),
        conditions: [
            api.labelOnStack(GROUP_CONTAINERS),
            api.isSegment()
        ]
    }),
]

interface IModel {
    readVessel: (stream: ReadableStream<Segment>) => Promise<Vessel>;
}

export class Model implements IModel {
    parser: IEdiParser;
    format: IEdiFormat;

    constructor() {
        this.parser = new EdiParser();
        this.format = new EdiFormat(baplie);
    }

    async readVessel(stream: ReadableStream<Segment>): Promise<Vessel> {
        return databuilder(this.format, vesselShape, stream);
    }

    makeTestVessel(): Vessel {
        return {
            containers: [...Array(50)].map<Container>((v, i) => ({
                bay: 46,
                slot: 405803,
                id: 'CAXU5783911',
                size: 40,
                weight: 13700,
                carrier: 'MSK'
            }))
        }
    }
}