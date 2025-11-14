const { spawn } = require('child_process');
const path = require('path');

function startPython() {
  const scriptPath = path.resolve(__dirname, '../faceapi/app.py');

  const pyProcess = spawn('python', [scriptPath]);

  pyProcess.stdout.on('data', (data) => {
    console.log(`[PYTHON]: ${data.toString()}`);
  });

  pyProcess.stderr.on('data', (data) => {
    console.error(`[PYTHON ERROR]: ${data.toString()}`);
  });

  pyProcess.on('close', (code) => {
    console.log(`[PYTHON] app.py finalizado com código ${code}`);
  });

  return pyProcess;
}

module.exports = { startPython };
