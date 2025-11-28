const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

function chamarPython(inputData) {
  return new Promise((resolve, reject) => {
    // Caminhos possíveis do Python
    const venvPythonWindows = path.join(__dirname, '../ml/ml.venv/Scripts/python.exe');
    const venvPythonUnix = path.join(__dirname, '../ml/ml.venv/bin/python');
    const pythonPath = fs.existsSync(venvPythonWindows)
      ? venvPythonWindows
      : fs.existsSync(venvPythonUnix)
      ? venvPythonUnix
      : 'python'; // fallback: Python global

    // Caminho para o script app.py
    const appPath = path.join(__dirname, '../ml/app.py');

    const python = spawn(pythonPath, [appPath, JSON.stringify(inputData)], {
      cwd: path.join(__dirname, '../ml') // garante acesso ao modelo.pkl e CSV
    });

    let output = '';
    let error = '';

    python.stdout.on('data', data => {
      output += data.toString();
    });
    python.stderr.on('data', data => {
      error += data.toString();
    });

    python.on('close', code => {
      if (code !== 0) return reject(error || `Python exited with code ${code}`);
      try {
        const result = JSON.parse(output);
        resolve(result);
      } catch (e) {
        reject('Erro ao processar resposta do Python');
      }
    });

    python.on('error', err => reject(err));
  });
}

exports.predictPrioridade = async (req, res, next) => {
  try {
    const { idade, temperatura, saturacao, queixa } = req.body;

    if (idade === undefined || temperatura === undefined || saturacao === undefined || !queixa) {
      return res.status(400).json({ msg: 'Campos obrigatórios faltando' });
    }

    const inputData = { idade, temperatura, saturacao, queixa };
    const prioridade = await chamarPython(inputData);

    res.json({ prioridade });
  } catch (err) {
    console.error('🔥 ERRO NO PYTHON:', err);
    res.status(500).json({ erro: 'Erro ao processar ML', detalhe: err.toString() });
    next(err);
  }
};

exports.todasPredicoes = async (req, res, next) => {
  try {
    res.json([]);
  } catch (err) {
    next(err);
  }
};
