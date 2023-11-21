const exec = require('child_process').exec;
const WebSocket = require('ws');
const express = require('express');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

function executeCommand(command) {
    return new Promise((resolve, reject) => {
        const shell = exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(stderr || error.message);
            } else {
                resolve(stdout);
            }
        });

        shell.on('exit', (code) => {
            console.log('child process exited with code ' + code);
        });
    });
}

wss.on('connection', (ws) => {
    console.log('Client connected');

    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);
            if (data.method === 'command') {
                // Process the command and send back a response
                const response = await executeCommand(data.command);
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
