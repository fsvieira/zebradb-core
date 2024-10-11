import { parse } from "./parsing/zparser.mjs";


export async function dependencyParser (text, solveDep) {
    const parsed = parse(text);

    console.log(parsed);
}

