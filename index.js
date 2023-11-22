const { spawn } = require('child_process');
const WebSocket = require('ws');
const express = require('express');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

var sessions = {};

wss.getUniqueID = function () {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }
    return s4() + s4() + '-' + s4();
};

async function executeCommand(command, wsID) {
    if(sessions.hasOwnProperty(wsID)) {
        await sessions[wsID].stdin.write(`${command}\n`);
        return true;
    } else {
        executeCommand(command, wsID);
    }
}

wss.on('connection', (ws) => {
    ws.id = wss.getUniqueID();

    wss.clients.forEach(function each(client) {
        console.log('Client.ID: ' + client.id);
    });

    console.log('Client connected');

    sessions[ws.id] = spawn("cmd");
    sessions[ws.id].stdout.on("data", (data) => {
        console.log(`stdout: ${data}`);
    });
    sessions[ws.id].stderr.on("data", (data) => {
        console.log(`stderr: ${data}`);
    });
    sessions[ws.id].on("code", (code) => {
        console.log(`child exited with code: ${code}`);
    });

    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);
            if (data.method === 'command') {
                // Process the command and send back a response
                const response = await executeCommand(data.command, ws.id);
                ws.send(JSON.stringify({ data: response }));
            }
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
