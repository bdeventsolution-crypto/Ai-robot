const { spawn } = require('child_process');

console.log('Connecting to free mobile tunnel...');
const child = spawn('ssh', [
    '-o', 'StrictHostKeyChecking=no',
    '-o', 'ServerAliveInterval=30',
    '-p', '443',
    '-R0:localhost:7777',
    'a.pinggy.io'
], { stdio: ['pipe', 'pipe', 'pipe'] });

child.stdout.on('data', data => {
    const text = data.toString();
    console.log(text);
});

child.stderr.on('data', data => {
    const text = data.toString();
    console.log('[Tunnel stderr]:', text);
});

child.on('close', code => {
    console.log('Tunnel exited with code:', code);
});
