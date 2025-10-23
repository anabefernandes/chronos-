import { useState } from 'react';
import { PacienteData } from '../components/admin/PacienteModal';
import { EXPO_PUBLIC_API_URL } from '@env';

const ML_API_URL = `${EXPO_PUBLIC_API_URL}/ml`;

export function useML() {
  const [loading, setLoading] = useState(false);

  const calcularPrioridade = async (paciente: PacienteData) => {
    if (!paciente.idade || !paciente.temperatura || !paciente.saturacao || !paciente.sintomas) {
      return null;
    }

    setLoading(true);
    try {
      const idadeNum = parseFloat(paciente.idade.replace(',', '.'));
      const temperaturaNum = parseFloat(paciente.temperatura.replace(',', '.'));
      const saturacaoNum = parseFloat(paciente.saturacao.replace(',', '.'));

      const response = await fetch(`${ML_API_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idade: idadeNum,
          temperatura: temperaturaNum,
          saturacao: saturacaoNum,
          queixa: paciente.sintomas
        })
      });

      if (!response.ok) throw new Error('Erro na requisição ML');

      const data = await response.json();
      return data.prioridade?.toLowerCase() as 'baixa' | 'media' | 'alta' | null;
    } catch (err) {
      console.error('Erro ML:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { calcularPrioridade, loading };
}
