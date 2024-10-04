// commands/package.js

// import { createPackage, runPackage, publishPackage, listPackages } from '../lib/package.js';

export default function packageCommands(action, options) {
    console.log("PACKAGE ", action, options);
    /*switch (action) {
        case 'create':
            createPackage(options);
            break;
        case 'run':
            runPackage(options);
            break;
        case 'publish':
            publishPackage(options);
            break;
        case 'list':
            listPackages();
            break;
        default:
            console.log('Invalid action. Use --help for a list of available commands.');
    }*/
}
