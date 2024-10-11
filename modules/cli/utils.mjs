import fs, {promises as fsPromises} from 'fs'
import path from 'path'

/**
 * Recursively searches for 'ladder-package.json' from the current directory upwards.
 * @param {string} currentDir - The directory to start searching in.
 * @param {string} fileName - The name of the file to search for.
 * @returns {string|null} - The full path of the found file or null if not found.
 */
export function findLadderPackage(currentDir = process.cwd(), fileName = 'ladder-package.json') {
    const filePath = path.join(currentDir, fileName);

    if (fs.existsSync(filePath)) {
        // return filePath; // Found the file, return its path
        return {rootDir: currentDir, ladderPackagePath: filePath};
    }

    const parentDir = path.dirname(currentDir);

    // If we're at the root of the filesystem, stop the search
    if (parentDir === currentDir) {
        return null;
    }

    // Recursively search in the parent directory
    return findLadderPackage(parentDir, fileName);
}

export async function readLadderPackage() {
    const {ladderPackagePath} = findLadderPackage();
    const ladderPackage = JSON.parse(await fsPromises.readFile(ladderPackagePath, 'utf8'));

    return ladderPackage;
}