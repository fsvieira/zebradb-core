import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Function to get the config file path
const getNodeDir = name => path.join(
    os.homedir(), '.ladder', 'nodes', name
);

const getConfigFilePath = name => path.join(
    getNodeDir(name), 'config.json'
);

// Function to load the configuration file if it exists
const loadConfig = name => {
    const configPath = getConfigFilePath(name);

    console.log(configPath);

    if (fs.existsSync(configPath)) {
        return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }
    return null;
};

// Function to save configuration
const saveConfig = config => {
    const configPath = getConfigFilePath(config.name);
    const configDir = path.dirname(configPath);

    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
    }

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log('Configuration saved to:', configPath);
};

// Function to start the server
export function startServer (name, options) {
    // Load existing config if present

    console.log(name, options);
    const config = loadConfig(name);

    const {port: optPort, dataDir: optDataDir} = options;
    const {
        port: cfgPort=(optPort || 8080), 
        dataDir: cfgDataDir=(
            optDataDir || 
            path.join(getNodeDir(name), 'dbs')
        )
    } = config || {};

    if (cfgDataDir && optDataDir && cfgDataDir !== optDataDir) {
        throw 'Move server databases to other dir!!'
    }

    const port = optPort || cfgPort;
    const dataDir = optDataDir || cfgDataDir;

    if (!config) {
        // If no config, save the provided options as the default configuration
        saveConfig({ 
            name, 
            port, 
            dataDir,
            pid: serverProcess.pid,
            status: 'running',
            createdAt: new Date().toISOString()
        });
    }

    console.log("Start Server : ", port, dataDir);

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);

    const serverFilePath = path.join(__dirname, 'modules', 'server.mjs');

    const serverProcess = spawn('node', [serverFilePath,
        '-n', name, 
        '-p', port, 
        '-d', dataDir
    ], {
        detached: true,
        stdio: 'ignore'
    });

    // Start the LadderServer with loaded or default config
    // new LadderServer(port, dataDir);
};

// Example usage of serverStart
// serverStart({ port: 3000, dbsPath: '/path/to/databases' });

