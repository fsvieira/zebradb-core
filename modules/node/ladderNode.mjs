
import { WebSocketServer } from 'ws';
// import {getDatabase} from './database.mjs';

export default function startNode (name, port, dataDir) { 
    console.log("--->", port);
    const wss = new WebSocketServer({ port });  

    wss.on('connection', async (ws, req) => {
    console.log('Client connected');

    try {
        // const {db} = await getDatabase(req.url);
        // await db.remote.addWS(ws);
        ws.send("DOIT");

    } catch (error) {
        console.error('Error fetching database:', error);
        ws.close(1001, 'Database not found');
    }});

    console.log(`WebSocket server running on ws://localhost:${port}`);
}


