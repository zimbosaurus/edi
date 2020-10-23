import { createReadStream } from "fs";
import 'web-streams-polyfill';

export function printChunks(): WritableStream<any> {
    return new WritableStream({
        write(chunk) {
            console.log(chunk);
        }
    })
}

export function streamFile(path: string): ReadableStream<string> {
    return new ReadableStream<string>({
        start(controller) {
            const rs = createReadStream(path);
            rs.on('readable', () => {
                let c: number;
                while ((c = rs.read(1)) != undefined) {
                    controller.enqueue(c.toString());
                }
            });
            rs.on('end', () => {
                controller.close();
                rs.close();
            })
        }
    })
}

export function streamString(text: string): ReadableStream<string> {
    return new ReadableStream<string>({
        start(controller: ReadableStreamDefaultController<string>) {
            text.split('').forEach(s => {
                controller.enqueue(s);
            });
            controller.close();
        },
    });
}