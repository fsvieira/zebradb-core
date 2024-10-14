import { parse } from "./parsing/zparser.mjs";
import constants from "./branch/operations/constants.mjs";

export async function dependencyParser (file, text, solveDep) {
    
    const files = new Set([file]);
    const stack = [{file, text}];

    const result = new Set();

    do {
        // TODO consider parallel parsing with promise.all ? 
        const {file: currentFile, text} = stack.pop();

        const parsed = parse(text);
        for (let i=0; i<parsed.length; i++) {
            const p = parsed[i];

            if (p.type === constants.type.CONSIDER) {
                const {file, text} = await solveDep(currentFile, p.filepath, files); 

                if (text) {
                    stack.push({file, text});
                }
            }
            else {
                result.add(p);
            }
        }
    }
    while (stack.length)

    return result;
}

