const { spawn } = require("child_process");

function chamarPython(inputData) {
  return new Promise((resolve, reject) => {
    const pythonPath = "C:\\Users\\Micro\\Downloads\\chronos-\\ml.venv\\Scripts\\python.exe";

    const python = spawn(pythonPath, ["./ml/app.py", JSON.stringify(inputData)]);

    let output = "";
    let error = "";

    python.stdout.on("data", (data) => {
      output += data.toString();
    });

    python.stderr.on("data", (data) => {
      error += data.toString();
    });

    python.on("close", (code) => {
      if (code !== 0) {
        return reject(error || "Erro no script Python");
      }
      try {
        const result = JSON.parse(output); 
        resolve(result);
      } catch (e) {
        reject("Erro ao processar resposta do Python");
      }
    });
  });
}


exports.predictPrioridade = async (req, res, next) => {
  try {
    const { idade, temperatura, saturacao, queixa } = req.body;

    if (idade === undefined || temperatura === undefined || saturacao === undefined || !queixa) {
      return res.status(400).json({ msg: "Campos obrigatórios faltando" });
    }

    const inputData = { idade, temperatura, saturacao, queixa };

    const prioridade = await chamarPython(inputData);

    res.json({ prioridade });
  } catch (err) {
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
