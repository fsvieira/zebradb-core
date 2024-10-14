import { promises as fsPromises } from 'fs';
import path from 'path';
import {dependencyParser} from '../../../src/api.mjs'
import chalk from 'chalk'; 

function resolveFilePath(requesterFile, requestedFile) {
    const requesterDir = requesterFile ? path.dirname(requesterFile) : process.cwd();
    return path.isAbsolute(requestedFile) 
        ? requestedFile 
        : path.join(requesterDir, requestedFile);
}

export async function solveDep(requesterFile, requestedFile, files) {
    const resolvedPath = resolveFilePath(requesterFile, requestedFile);

    let text;
    if (!files.has(resolvedPath)) {
        try {
            const fileContent = await fsPromises.readFile(resolvedPath, 'utf8');
            text = fileContent;
            files.add(resolveFilePath);

            console.log(chalk.green(`✔ Resolved dependency: ${chalk.bold(requestedFile)}`));
        } catch (err) {
            console.error(chalk.red(`✖ Error resolving dependency ${requestedFile}:`, err));
            throw err; // Re-throw to signal failure in dependency resolution
        }
    }

    return {file: resolvedPath, text};
}

export async function packageRun (file) {
    try {
        console.log(chalk.yellow(`== Checking file ${chalk.bold(file)} ==`));
        
        const filePath = resolveFilePath(null, file);
        const data = await fsPromises.readFile(filePath, 'utf8');
        const parsedResult = await dependencyParser(filePath, data, solveDep);

        console.log(parsedResult);
        

        console.log(chalk.green(`✔ ${chalk.bold(file)} local defintions sent.`));
        console.log(chalk.green(`✔ ${chalk.bold(file)} query ${'my query'} - ${'link!'} sent to process.`));
    } catch (err) {
        console.error('Error reading file:', err);
    }
}
