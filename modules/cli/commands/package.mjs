import { promises as fsPromises } from 'fs';
import path from 'path';
import {dependencyParser} from '../../../src/api.mjs'


export async function packageRun (file) {
    try {
        const filePath = path.join(process.cwd(), file);

        console.log(filePath);
        const data = await fsPromises.readFile(filePath, 'utf8');
        console.log('File content:', data);

        await dependencyParser(data);
        
    } catch (err) {
        console.error('Error reading file:', err);
    }
}
