const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

function startPython() {
  const scriptPath = path.resolve(__dirname, "../faceapi/app-face.py");

  // Detecta automaticamente o Python do venv
  const venvPython = path.resolve(__dirname, "../faceapi/venv311/Scripts/python.exe");

  const pythonExecutable = fs.existsSync(venvPython) ? venvPython : "python";

  console.log("Usando Python:", pythonExecutable);

  const pyProcess = spawn(pythonExecutable, [scriptPath]);

  pyProcess.stdout.on("data", (data) => {
    console.log(`[PYTHON]: ${data.toString()}`);
  });

  pyProcess.stderr.on("data", (data) => {
    console.error(`[PYTHON ERROR]: ${data.toString()}`);
  });

  pyProcess.on("close", (code) => {
    console.log(`[PYTHON] app-face.py finalizado com código ${code}`);
  });

  return pyProcess;
}

module.exports = { startPython };
