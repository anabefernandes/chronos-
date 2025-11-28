import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface PontoBatido {
  entrada: boolean;
  almoco: boolean;
  retorno: boolean;
  saida: boolean;
}

interface CronometroProps {
  // horário de escala (pode vir como "08:00" ou ISO string ou Date)
  horaEntrada?: string | Date | null;
  // duração do almoço em minutos (ex: 60)
  duracaoAlmocoMinutos: number;
  // horário real em que bateou almoço (ISO string ou Date) — inicia contagem do almoço a partir daqui
  horaAlmocoReal?: string | Date | null;
  // horário real em que bateou retorno (ISO string ou Date)
  horaRetornoReal?: string | Date | null;
  // horário real em que bateou entrada (ISO string ou Date)
  horaEntradaReal?: string | Date | null;
  // horário real em que bateou saída (ISO string ou Date)
  horaSaidaReal?: string | Date | null;
  // horário de saída da escala (pode vir como "17:00" ou ISO string ou Date)
  horaSaida?: string | Date | null;
  pontoBatido: PontoBatido;
}

const Cronometro: React.FC<CronometroProps> = ({
  horaEntrada,
  duracaoAlmocoMinutos,
  horaAlmocoReal,
  horaRetornoReal,
  horaEntradaReal,
  horaSaidaReal,
  horaSaida,
  pontoBatido
}) => {
  const [segundos, setSegundos] = useState(0);
  const [label, setLabel] = useState('');
  const [cor, setCor] = useState('black');

  // --- helpers de parsing robusto ---
  const parsePossivelHorario = (h?: string | Date | null) => {
    if (!h) return null;
    if (h instanceof Date) return isNaN(h.getTime()) ? null : h;
    // se for string
    if (typeof h === 'string') {
      // se formato "HH:MM" -> monta data de hoje com essa hora
      if (/^\d{1,2}:\d{2}$/.test(h)) {
        const [hh, mm] = h.split(':').map(Number);
        const d = new Date();
        d.setHours(hh, mm, 0, 0);
        return d;
      }
      // tenta ISO
      const d = new Date(h);
      return isNaN(d.getTime()) ? null : d;
    }
    return null;
  };

  // calcula segundos e label conforme regras
  const atualizar = () => {
    const agora = new Date();

    // escalados (horários esperados da escala)
    const esperadoEntrada = parsePossivelHorario(horaEntrada);
    const esperadoSaida = parsePossivelHorario(horaSaida);

    // horários reais (batidas)
    const entradaReal = parsePossivelHorario(horaEntradaReal);
    const almocoReal = parsePossivelHorario(horaAlmocoReal);
    const retornoReal = parsePossivelHorario(horaRetornoReal);
    const saidaReal = parsePossivelHorario(horaSaidaReal);

    // ---------- 1) ENTRADA ----------
    // se não bateu entrada ainda
    if (!pontoBatido.entrada) {
      // precisa do horário esperado da escala
      if (!esperadoEntrada) {
        setSegundos(0);
        setLabel('Horário de entrada não definido');
        setCor('red');
        return;
      }

      const diff = Math.floor((esperadoEntrada.getTime() - agora.getTime()) / 1000);

      if (diff > 0) {
        // antes do horário: mostra tempo restante para começar a contar atraso (preto)
        setSegundos(diff);
        setLabel('Faltando para a entrada');
        setCor('black');
      } else {
        // já passou o horário e não bateu -> atraso em vermelho
        setSegundos(Math.abs(diff));
        setLabel('Atraso na entrada');
        setCor('red');
      }
      return;
    }

    // se bateu entrada real -> se bateu no tempo certo/antes, zera
    if (pontoBatido.entrada && entradaReal) {
      // se temos horário esperado, comparar
      if (esperadoEntrada) {
        if (entradaReal.getTime() <= esperadoEntrada.getTime()) {
          // bateu no horário/antes -> cronometro zera e passamos ao próximo estágio (almoco)
          setSegundos(0);
          setLabel('Entrada dentro do horário');
          setCor('black');
        } else {
          // bateu em atraso: mostrar atraso até o momento (opcional) — aqui zera conforme regra pedida
          setSegundos(0);
          setLabel('Entrada registrada (atraso registrado)');
          setCor('red');
        }
      } else {
        setSegundos(0);
        setLabel('Entrada registrada');
        setCor('black');
      }
      // deixar seguir para próximo bloco (almoco) — não retorna aqui, pois já definimos estado porém queremos que o cronômetro passe a gerenciar almoço/saida
    }

    // ---------- 2) ALMOÇO / RETORNO ----------
    // regra: o cronometro do almoço inicia assim que o ponto de almoço foi batido
    // - Se almoco já foi batido e retorno NÃO: mostra tempo restante do almoço (duracao - decorrido) ou excedendo em laranja
    if (pontoBatido.entrada && !pontoBatido.retorno) {
      if (!almocoReal) {
        // ainda não bateu almoco -> aguardando
        setSegundos(0);
        setLabel('Aguardando almoço');
        setCor('black');
        return;
      }

      // almoco foi batido, calcular desde almocoReal até agora
      const diffDecorrido = Math.floor((agora.getTime() - almocoReal.getTime()) / 1000);
      const limite = (duracaoAlmocoMinutos || 60) * 60;

      if (diffDecorrido <= limite) {
        // ainda dentro do intervalo do almoço -> mostrar tempo restante (preto)
        setSegundos(limite - diffDecorrido);
        setLabel('Tempo restante do almoço');
        setCor('orange');
      } else {
        // excedeu o horário de almoço
        setSegundos(diffDecorrido - limite);
        setLabel('Excedendo horário de almoço');
        setCor('red');
      }
      return;
    }

    // se já bateu retorno (pontoBatido.retorno = true) e retornoReal disponível,
    // então zera o cronômetro (user voltou)
    if (pontoBatido.retorno && retornoReal) {
      setSegundos(0);
      setLabel('Retorno registrado');
      setCor('black');
      // seguir para saída abaixo
    }

    // ---------- 3) SAÍDA ----------
    // Se não bateu saída ainda: comparar com horário esperado da escala
    if (!pontoBatido.saida) {
      if (!esperadoSaida) {
        setSegundos(0);
        setLabel('Horário de saída não definido');
        setCor('red');
        return;
      }

      const diffSaida = Math.floor((esperadoSaida.getTime() - agora.getTime()) / 1000);

      if (diffSaida > 0) {
        // ainda falta para o fim do expediente
        setSegundos(diffSaida);
        setLabel('Tempo restante para o fim do expediente');
        setCor('black');
      } else {
        // passou do horário e não bateu -> hora extra (azul)
        setSegundos(Math.abs(diffSaida));
        setLabel('Hora extra');
        setCor('blue');
      }
      return;
    }

    // se bateu saídaReal e dentro do horário: zerar
    if (pontoBatido.saida && saidaReal && esperadoSaida) {
      if (saidaReal.getTime() <= esperadoSaida.getTime()) {
        setSegundos(0);
        setLabel('Saída no horário');
        setCor('black');
      } else {
        setSegundos(0);
        setLabel('Saída registrada (hora extra)');
        setCor('blue');
      }
      return;
    }

    // tudo feito
    setSegundos(0);
    setLabel('Jornada finalizada');
    setCor('black');
  };

  useEffect(() => {
    // atualiza imediatamente e a cada segundo
    atualizar();
    const interval = setInterval(atualizar, 1000);
    return () => clearInterval(interval);
    // dependências: qualquer mudança nas props deve reiniciar lógica
  }, [
    horaEntrada,
    duracaoAlmocoMinutos,
    horaAlmocoReal,
    horaRetornoReal,
    horaEntradaReal,
    horaSaidaReal,
    horaSaida,
    pontoBatido.entrada,
    pontoBatido.almoco,
    pontoBatido.retorno,
    pontoBatido.saida
  ]);

  const formatar = (s: number) => {
    if (isNaN(s) || s < 0) return '00:00:00';
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.tempo, { color: cor }]}>{formatar(segundos)}</Text>
      <Text style={[styles.label, { color: cor }]}>{label}</Text>
    </View>
  );
};

export default Cronometro;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 8
  },
  tempo: {
    fontSize: 34,
    fontWeight: 'bold'
  },
  label: {
    fontSize: 16,
    marginTop: 4
  }
});
