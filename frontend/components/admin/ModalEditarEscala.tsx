import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  Platform,
  Alert
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { AuthContext, Funcionario } from '../../contexts/AuthContext';
import LottieView from 'lottie-react-native';

interface DiaSemana {
  dia: string;
  data: Date | null;
  entrada: Date | null;
  saida: Date | null;
  folga: boolean;
  modo: 'nenhum' | 'horario' | 'folga';
}

interface MostrarPickerHora {
  index: number;
  tipo: 'entrada' | 'saida' | null;
}

interface ModalEditarEscalaProps {
  visible: boolean;
  onClose: () => void;
  escala: any;
  onSave?: () => void;
}

export default function ModalEditarEscala({ visible, onClose, escala, onSave }: ModalEditarEscalaProps) {
  const { usuarios } = useContext(AuthContext);
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState<Funcionario | null>(null);
  const [semana, setSemana] = useState<DiaSemana[]>([]);
  const [mostrarPickerHora, setMostrarPickerHora] = useState<MostrarPickerHora>({ index: -1, tipo: null });
  const [ultimaEntrada, setUltimaEntrada] = useState<Date | null>(null);
  const [animacao, setAnimacao] = useState(false);

  useEffect(() => {
    if (!escala) return;
    setFuncionarioSelecionado(escala.funcionario);

    const datasEscala = escala.dias.map((d: any) => new Date(d.data));
    if (datasEscala.length === 0) return;

    const minData = new Date(Math.min(...datasEscala.map((d: { getTime: () => number }) => d.getTime())));
    const domingo = new Date(minData);
    domingo.setDate(minData.getDate() - minData.getDay());

    const diasSemana: DiaSemana[] = Array.from({ length: 7 }).map((_, i) => {
      const diaStr = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'][i];
      return { dia: diaStr, data: new Date(domingo.getTime() + i * 24 * 60 * 60 * 1000), entrada: null, saida: null, folga: false, modo: 'nenhum' };
    });

    escala.dias.forEach((d: any) => {
      const idx = Math.floor((new Date(d.data).getTime() - domingo.getTime()) / (24 * 60 * 60 * 1000));
      if (idx >= 0 && idx <= 6) {
        diasSemana[idx] = {
          ...diasSemana[idx],
          entrada: d.horaEntrada ? new Date(d.data + 'T' + d.horaEntrada) : null,
          saida: d.horaSaida ? new Date(d.data + 'T' + d.horaSaida) : null,
          folga: !!d.folga,
          modo: d.folga ? 'folga' : d.horaEntrada && d.horaSaida ? 'horario' : 'nenhum'
        };
        if (d.horaEntrada) setUltimaEntrada(new Date(d.data + 'T' + d.horaEntrada));
      }
    });

    setSemana(diasSemana);
  }, [escala]);

  const handleHoraChange = (index: number, tipo: 'entrada' | 'saida', hora: Date) => {
    const novaSemana = [...semana];
    novaSemana[index][tipo] = hora;
    if (tipo === 'entrada') setUltimaEntrada(hora);
    setSemana(novaSemana);
  };

  const definirModo = (index: number, modo: 'horario' | 'folga') => {
    const novaSemana = [...semana];
    novaSemana[index].modo = modo;
    if (modo === 'folga') {
      novaSemana[index].entrada = null;
      novaSemana[index].saida = null;
      novaSemana[index].folga = true;
    } else if (modo === 'horario' && ultimaEntrada) {
      novaSemana[index].entrada = new Date(ultimaEntrada);
      novaSemana[index].folga = false;
    }
    setSemana(novaSemana);
  };

  const redefinirModo = (index: number) => {
    const novaSemana = [...semana];
    novaSemana[index] = { ...novaSemana[index], modo: 'nenhum', entrada: null, saida: null, folga: false };
    setSemana(novaSemana);
  };

  const salvarEscalaEditada = async () => {
    if (!funcionarioSelecionado) {
      Alert.alert('Atenção', 'Selecione o funcionário.');
      return;
    }

    try {
      setAnimacao(true);
      setTimeout(() => {
        setAnimacao(false);
        onClose();
        if (onSave) onSave();
      }, 2000);
    } catch (error: any) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível editar a escala. Tente novamente.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>
          <Text style={styles.modalTitle}>Editar Escala</Text>
          <ScrollView style={{ padding: 12 }}>
            {/* Funcionário */}
            <Text style={styles.inputLabel}>Funcionário</Text>
            <View style={styles.selectFuncionario}>
              <Text style={styles.selectText}>{funcionarioSelecionado?.nome || 'Selecionar funcionário'}</Text>
            </View>

            {/* Semana */}
            {semana.map((dia, i) => (
              <View key={i} style={styles.dayCard}>
                <Text style={styles.dayTitle}>
                  {dia.dia} {dia.data ? `- ${dia.data.toLocaleDateString()}` : ''}
                </Text>

                {dia.modo === 'nenhum' && (
                  <View style={styles.optionRow}>
                    <TouchableOpacity
                      style={[styles.optionButton, { backgroundColor: '#a8e6cf89' }]}
                      onPress={() => definirModo(i, 'horario')}
                    >
                      <Text style={styles.optionText}>Definir Horário</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.optionButton, { backgroundColor: '#81d4fa8b' }]}
                      onPress={() => definirModo(i, 'folga')}
                    >
                      <Text style={styles.optionText}>Definir Folga</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {dia.modo === 'horario' && (
                  <>
                    <View style={styles.timeRow}>
                      <TouchableOpacity
                        style={styles.horaBtn}
                        onPress={() => setMostrarPickerHora({ index: i, tipo: 'entrada' })}
                      >
                        <Text>
                          {dia.entrada
                            ? `Entrada: ${dia.entrada.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                            : 'Definir Entrada'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.horaBtn}
                        onPress={() => setMostrarPickerHora({ index: i, tipo: 'saida' })}
                      >
                        <Text>
                          {dia.saida
                            ? `Saída: ${dia.saida.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                            : 'Definir Saída'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    {dia.entrada && (
                      <View style={styles.sugestaoContainer}>
                        <Image
                          source={require('../../assets/images/telas-admin/icone_sugestao.png')}
                          style={styles.sugestaoIcon}
                        />
                        <Text style={styles.sugestaoText}>
                          Sugestão de saída baseada na carga horária do funcionário
                        </Text>
                      </View>
                    )}
                    <TouchableOpacity style={styles.redefinirBtn} onPress={() => redefinirModo(i)}>
                      <Text style={styles.redefinirText}>Redefinir</Text>
                    </TouchableOpacity>
                  </>
                )}

                {dia.modo === 'folga' && (
                  <View style={styles.folgaRow}>
                    <Image
                      source={require('../../assets/images/telas-admin/icone_folga.png')}
                      style={styles.iconFolga}
                    />
                    <Text style={styles.folgaText}>Folga definida</Text>
                    <View style={{ flex: 1 }} />
                    <TouchableOpacity style={styles.redefinirBtn} onPress={() => redefinirModo(i)}>
                      <Text style={styles.redefinirText}>Redefinir</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {mostrarPickerHora.tipo && mostrarPickerHora.index === i && (
                  <DateTimePicker
                    value={
                      mostrarPickerHora.tipo === 'entrada'
                        ? dia.entrada || new Date()
                        : dia.saida || dia.entrada || new Date()
                    }
                    mode="time"
                    is24Hour
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(_: DateTimePickerEvent, hora?: Date) => {
                      if (hora && mostrarPickerHora.tipo)
                        handleHoraChange(mostrarPickerHora.index, mostrarPickerHora.tipo, hora);
                      setMostrarPickerHora({ index: -1, tipo: null });
                    }}
                  />
                )}
              </View>
            ))}

            {/* Botão Salvar */}
            <TouchableOpacity style={styles.saveBtn} onPress={salvarEscalaEditada}>
              <Text style={styles.saveText}>Salvar Escala</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Animação */}
          {animacao && (
            <View style={[styles.successOverlay, { bottom: 60, top: 100 }]} pointerEvents="box-none">
              <LottieView
                source={require('../../assets/lottie/success.json')}
                autoPlay
                loop={false}
                style={{ width: 250, height: 250 }}
              />
              <Text style={styles.successText}>Escala editada com sucesso!</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { backgroundColor: '#fff', borderRadius: 20, width: '92%', maxHeight: '90%', overflow: 'hidden', paddingBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#3C188F', padding: 16 },
  dayCard: { backgroundColor: '#fff', borderRadius: 20, padding: 14, marginBottom: 10, elevation: 3 },
  dayTitle: { fontSize: 16, fontWeight: '600', color: '#3C188F', marginBottom: 8 },
  optionRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 },
  optionButton: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, backgroundColor: '#e0e0ff' },
  optionText: { color: '#3C188F', fontWeight: '500' },
  horaBtn: { borderWidth: 1.5, borderColor: '#3C188F', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16, marginBottom: 4, alignItems: 'center' },
  redefinirText: { color: '#3C188F', fontWeight: '600', marginTop: 4 },
  saveBtn: { backgroundColor: '#3C188F', borderRadius: 30, alignItems: 'center', paddingVertical: 14, marginVertical: 12 },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cancelBtn: { backgroundColor: '#ccc', borderRadius: 30, alignItems: 'center', paddingVertical: 14, marginVertical: 6 },
  cancelText: { color: '#333', fontWeight: '600' },
  label: { fontWeight: '600', marginBottom: 4, color: '#3C188F' },
  inputLabel: {
    position: 'absolute',
    top: -8,
    left: 16,
    backgroundColor: '#fff',
    paddingHorizontal: 5,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: '#1B0A43',
    zIndex: 1
  },
   selectFuncionario: {
    borderWidth: 1.5,
    borderColor: '#3C188F',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center'
  },
  selectText: {
    color: '#3C188F',
    fontFamily: 'Poppins_400Regular'
  },
   timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    gap: 10
  },
    sugestaoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e0ff',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginTop: 4
  },
  sugestaoIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
    marginRight: 6
  },
  sugestaoText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#3C188F',
    flexShrink: 1
  },
   redefinirBtn: {
    alignSelf: 'flex-end',
    marginTop: 6
  },
   folgaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6
  },
  iconFolga: {
    width: 25,
    height: 25,
    resizeMode: 'contain'
  },
   folgaText: {
    fontFamily: 'Poppins_500Medium',
    color: '#3C188F',
    marginBottom: 0
  },
   successOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    paddingVertical: 20
  },
  successText: {
    marginTop: 10,
    fontSize: 16,
    color: '#3C188F',
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'center'
  },
});
