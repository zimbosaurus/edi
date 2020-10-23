import { EdiFormat, EdiParser } from ".";
import { EdiStructure } from "./types/format";
import "web-streams-polyfill";
import { io } from ".";
import databuilder from "./databuilder";
import { Shape } from "./types/databuilder";

//TODO comment

type EdiOptions = {
    structure: EdiStructure;
    shape?: Shape;
    file?: string;
    text?: string;
    stream?: ReadableStream<string>;
}

class Edi {

    constructor(public options?: EdiOptions) {}

    shape(shape: Shape): Edi {
        this.options.shape = shape;
        return this;
    }

    structure(structure: EdiStructure): Edi {
        this.options = {...this.options, structure }
        return this;
    }
    
    file(path: string): Edi {
        this.options = {...this.options, file: path }
        delete this.options.text;
        return this;
    }
    
    text(text: string): Edi {
        this.options = {...this.options, text }
        delete this.options.file;
        return this;
    }
    
    build() {
        const parser = new EdiParser();
        const format = new EdiFormat(this.options.structure);

        return databuilder(format, this.options.shape, parser.parse(this.makeStream()));
    }

    private makeStream(): ReadableStream<string> {
        if (this.options.file) {
            return io.streamFile(this.options.file);
        }
        else if (this.options.text) {
            return io.streamString(this.options.text);

        }
        else if (this.options.stream) {
            return this.options.stream;
        }
    }
}

function edi(options?: EdiOptions) {
    return new Edi(options);
}

export default edi;
export { EdiOptions, Edi }