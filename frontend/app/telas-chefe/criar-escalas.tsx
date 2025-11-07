import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Button,
  Alert,
  Platform,
} from 'react-native';
import Navbar from '../../components/public/Navbar';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  listarFuncionarios,
  criarOuEditarEscala,
} from '../../services/userService';

// Tipo da semana
type DiaSemana = {
  dia: string;
  entrada: Date | null;
  saida: Date | null;
  folga: boolean;
};

type EscalaRequest = {
  funcionario: string;
  data: string;
  horaEntrada?: string;
  horaSaida?: string;
  folga?: boolean;
};

export default function CriarEscalas() {
  const [funcionarios, setFuncionarios] = useState<any[]>([]);
  const [selectedFuncionario, setSelectedFuncionario] = useState('');
  const [semanaInicio, setSemanaInicio] = useState<Date | null>(null);
  const [semanaFim, setSemanaFim] = useState<Date | null>(null);

  const [mostrarPickerInicio, setMostrarPickerInicio] = useState(false);
  const [mostrarPickerFim, setMostrarPickerFim] = useState(false);

  const [semana, setSemana] = useState<DiaSemana[]>([
    { dia: 'Domingo', entrada: null, saida: null, folga: false },
    { dia: 'Segunda', entrada: null, saida: null, folga: false },
    { dia: 'Terça', entrada: null, saida: null, folga: false },
    { dia: 'Quarta', entrada: null, saida: null, folga: false },
    { dia: 'Quinta', entrada: null, saida: null, folga: false },
    { dia: 'Sexta', entrada: null, saida: null, folga: false },
    { dia: 'Sábado', entrada: null, saida: null, folga: false },
  ]);

  const [mostrarPickerHora, setMostrarPickerHora] = useState<{
    index: number;
    tipo: 'entrada' | 'saida' | null;
  }>({ index: -1, tipo: null });

  useEffect(() => {
    carregarFuncionarios();
  }, []);

  useEffect(() => {
    if (!selectedFuncionario) return;

    const funcionario = funcionarios.find(f => f._id === selectedFuncionario);
    if (funcionario && funcionario.horaEntradaPadrao && funcionario.horaSaidaPadrao) {
      const [horaEntradaH, horaEntradaM] = funcionario.horaEntradaPadrao.split(':').map(Number);
      const [horaSaidaH, horaSaidaM] = funcionario.horaSaidaPadrao.split(':').map(Number);

      const novaSemana = semana.map(dia => ({
        ...dia,
        entrada: new Date(new Date().setHours(horaEntradaH, horaEntradaM, 0, 0)),
        saida: new Date(new Date().setHours(horaSaidaH, horaSaidaM, 0, 0)),
      }));

      setSemana(novaSemana);
    }
  }, [selectedFuncionario]);

  const carregarFuncionarios = async () => {
    try {
      const data = await listarFuncionarios();
      setFuncionarios(data);
    } catch (err) {
      console.error('Erro ao carregar funcionários:', err);
    }
  };

  const handleHoraChange = (index: number, tipo: 'entrada' | 'saida', hora: Date) => {
    const novaSemana = [...semana];
    if (novaSemana[index].folga) novaSemana[index].folga = false;
    novaSemana[index][tipo] = hora;
    setSemana(novaSemana);
  };

  const alternarFolga = (index: number) => {
    const novaSemana = [...semana];
    const dia = novaSemana[index];
    dia.folga = !dia.folga;
    if (dia.folga) {
      dia.entrada = null;
      dia.saida = null;
    }
    setSemana(novaSemana);
  };

  const salvarEscala = async () => {
    if (!selectedFuncionario || !semanaInicio || !semanaFim) {
      Alert.alert('Atenção', 'Preencha todos os campos antes de salvar.');
      return;
    }

    const invalido = semana.some((d) => !d.folga && (!d.entrada || !d.saida));
    if (invalido) {
      Alert.alert('Atenção', 'Preencha todos os dias com horários ou marque como folga.');
      return;
    }

    try {
      for (let i = 0; i < semana.length; i++) {
        const dia = semana[i];
        const data = new Date(semanaInicio);
        data.setDate(data.getDate() + i);

        const dados: EscalaRequest = {
          funcionario: selectedFuncionario,
          data: data.toISOString(),
        };

        if (dia.folga) {
          dados.folga = true;
        } else {
          const formatarHora = (d: Date) =>
            d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false });
          dados.horaEntrada = formatarHora(dia.entrada!);
          dados.horaSaida = formatarHora(dia.saida!);
          dados.folga = false;
        }

        await criarOuEditarEscala(dados);
      }

      Alert.alert('Sucesso', 'Escala criada com sucesso!');
    } catch (err) {
      console.error('Erro ao criar escala:', err);
      Alert.alert('Erro', 'Não foi possível criar a escala.');
    }
  };

  return (
    <View style={styles.container}>
      <Navbar />
      <ScrollView style={styles.content}>
        <Text style={styles.title}>📅 Criar Escala</Text>

        <Text>Funcionário:</Text>
        <ScrollView horizontal style={{ flexDirection: 'row', marginVertical: 10 }}>
          {funcionarios.map(f => (
            <TouchableOpacity
              key={f._id}
              style={[styles.funcButton, selectedFuncionario === f._id && styles.funcButtonActive]}
              onPress={() => setSelectedFuncionario(f._id)}
            >
              <Text>{f.nome}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {selectedFuncionario && (
          <Text style={{ fontWeight: 'bold', marginBottom: 10 }}>
            Carga horária diária: {funcionarios.find(f => f._id === selectedFuncionario)?.cargaHorariaDiaria || 'Não informada'}
          </Text>
        )}

        <Text>Semana (início = Domingo):</Text>
        <TouchableOpacity style={styles.input} onPress={() => setMostrarPickerInicio(true)}>
          <Text>{semanaInicio ? semanaInicio.toLocaleDateString('pt-BR') : 'Selecionar data início'}</Text>
        </TouchableOpacity>
        {mostrarPickerInicio && (
          <DateTimePicker
            value={semanaInicio || new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(_, date) => { setMostrarPickerInicio(false); if (date) setSemanaInicio(date); }}
          />
        )}

        <Text>Semana (fim = Sábado):</Text>
        <TouchableOpacity style={styles.input} onPress={() => setMostrarPickerFim(true)}>
          <Text>{semanaFim ? semanaFim.toLocaleDateString('pt-BR') : 'Selecionar data fim'}</Text>
        </TouchableOpacity>
        {mostrarPickerFim && (
          <DateTimePicker
            value={semanaFim || new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(_, date) => { setMostrarPickerFim(false); if (date) setSemanaFim(date); }}
          />
        )}

        <Text>Horários/Folga:</Text>
        {semana.map((dia, i) => (
          <View key={i} style={styles.row}>
            <Text style={{ width: 80 }}>{dia.dia}</Text>

            <TouchableOpacity
              style={[styles.horaBtn, dia.folga && { backgroundColor: '#eee', opacity: 0.5 }]}
              disabled={dia.folga}
              onPress={() => setMostrarPickerHora({ index: i, tipo: 'entrada' })}
            >
              <Text>{dia.entrada ? dia.entrada.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Entrada'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.horaBtn, dia.folga && { backgroundColor: '#eee', opacity: 0.5 }]}
              disabled={dia.folga}
              onPress={() => setMostrarPickerHora({ index: i, tipo: 'saida' })}
            >
              <Text>{dia.saida ? dia.saida.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Saída'}</Text>
            </TouchableOpacity>

            {mostrarPickerHora.tipo && (
              <DateTimePicker
                value={new Date()}
                mode="time"
                is24Hour={true}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(_, hora) => {
                  if (hora) handleHoraChange(mostrarPickerHora.index, mostrarPickerHora.tipo!, hora);
                  setMostrarPickerHora({ index: -1, tipo: null });
                }}
              />
            )}

            <TouchableOpacity style={styles.folgaBtn} onPress={() => alternarFolga(i)}>
              <Text style={{ color: dia.folga ? 'red' : 'gray' }}>{dia.folga ? 'Folga ✅' : 'Marcar folga'}</Text>
            </TouchableOpacity>
          </View>
        ))}

        <Button title="Salvar Escala" onPress={salvarEscala} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 15 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  funcButton: { padding: 8, backgroundColor: '#eee', borderRadius: 8, marginRight: 5 },
  funcButtonActive: { backgroundColor: '#cde' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginVertical: 5 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  horaBtn: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, marginHorizontal: 4, minWidth: 70, alignItems: 'center' },
  folgaBtn: { marginLeft: 10 },
});
