import { resolve } from "path";

/**
 * Resolve a path in the workspace root relative to ./build/lib
 * @param file the file
 */
export function resolvePath(file: string) {
    return resolve(__dirname, '../', file);
}