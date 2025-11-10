import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  TextInput,
  Modal
} from 'react-native';
import Navbar from '../../components/public/Navbar';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { criarOuEditarEscala } from '../../services/userService';
import { AuthContext, Funcionario } from '../../contexts/AuthContext';
import FuncionarioCardSelect from '../../components/admin/FuncionarioCardSelect';
import LottieView from 'lottie-react-native';

// ---------------- CONFIGURAÇÃO DE LOCALE DO CALENDÁRIO ----------------
LocaleConfig.locales['pt-br'] = {
  monthNames: [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro'
  ],
  monthNamesShort: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
  dayNames: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
  dayNamesShort: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
  today: 'Hoje'
};
LocaleConfig.defaultLocale = 'pt-br';

// ---------------- TIPOS ----------------
interface DiaSemana {
  dia: string;
  data: Date | null;
  entrada: Date | null;
  saida: Date | null;
  folga: boolean;
  modo: 'nenhum' | 'horario' | 'folga';
}

interface EscalaRequest {
  funcionario: string;
  data: string;
  horaEntrada?: string;
  horaSaida?: string;
  folga?: boolean;
}

interface MostrarPickerHora {
  index: number;
  tipo: 'entrada' | 'saida' | null;
}

// ---------------- COMPONENTE ----------------
export default function CriarEscalas() {
  const { usuarios } = useContext(AuthContext);
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState<Funcionario | null>(null);
  const [modalFuncionarios, setModalFuncionarios] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [listaFiltrada, setListaFiltrada] = useState<Funcionario[]>([]);

  const [semanaInicio, setSemanaInicio] = useState<Date | null>(null);
  const [semanaFim, setSemanaFim] = useState<Date | null>(null);
  const [mostrarPickerHora, setMostrarPickerHora] = useState<MostrarPickerHora>({ index: -1, tipo: null });
  const [mostrarCalendario, setMostrarCalendario] = useState(false);
  const [erroChefe, setErroChefe] = useState(false);
  const [animacao, setAnimacao] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState('');

  const [semana, setSemana] = useState<DiaSemana[]>([
    { dia: 'Domingo', data: null, entrada: null, saida: null, folga: false, modo: 'nenhum' },
    { dia: 'Segunda', data: null, entrada: null, saida: null, folga: false, modo: 'nenhum' },
    { dia: 'Terça', data: null, entrada: null, saida: null, folga: false, modo: 'nenhum' },
    { dia: 'Quarta', data: null, entrada: null, saida: null, folga: false, modo: 'nenhum' },
    { dia: 'Quinta', data: null, entrada: null, saida: null, folga: false, modo: 'nenhum' },
    { dia: 'Sexta', data: null, entrada: null, saida: null, folga: false, modo: 'nenhum' },
    { dia: 'Sábado', data: null, entrada: null, saida: null, folga: false, modo: 'nenhum' }
  ]);
  useEffect(() => {
    if (modalFuncionarios && usuarios?.length) {
      setListaFiltrada(usuarios);
    }
  }, [modalFuncionarios, usuarios]);

  // ✅ Atualiza busca em tempo real
  useEffect(() => {
    if (usuarios?.length) {
      const filtrados = usuarios.filter(u => u.nome.toLowerCase().includes(searchText.toLowerCase()));
      setListaFiltrada(filtrados);
    }
  }, [searchText, usuarios]);

  // ---------------- SELEÇÃO DE FUNCIONÁRIO ----------------
  const getUserImage = (foto?: string) => {
    if (!foto || foto.trim() === '') return require('../../assets/images/telas-public/sem_foto.png');
    if (foto.includes('sem_foto.png')) return require('../../assets/images/telas-public/sem_foto.png');

    let baseURL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
    if (baseURL?.endsWith('/api')) baseURL = baseURL.replace(/\/api$/, '');
    const cleanFoto = foto.replace(/^\/+/, '');
    return { uri: `${baseURL}/${cleanFoto}` };
  };

  const renderFuncionarioSelecionado = () => {
    if (!funcionarioSelecionado) {
      return (
        <TouchableOpacity style={styles.selectFuncionario} onPress={() => setModalFuncionarios(true)}>
          <Text style={styles.selectText}>Selecione o funcionário</Text>
        </TouchableOpacity>
      );
    }

    const cargoIcon =
      funcionarioSelecionado.role === 'chefe'
        ? require('../../assets/images/telas-admin/icone_chefe.png')
        : require('../../assets/images/telas-admin/icone_funcionario.png');
    const setorIcon = require('../../assets/images/telas-admin/icone_setor.png');
    const IconRemover = require('../../assets/images/telas-admin/icone_excluir.png');

    return (
      <View style={styles.cardFuncionarioSelect}>
        <View style={styles.rowFuncionario}>
          <Image source={getUserImage(funcionarioSelecionado.foto)} style={styles.foto} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.nomeFuncionario}>{funcionarioSelecionado.nome}</Text>
            <View style={styles.infoRowFuncionario}>
              <Image source={cargoIcon} style={styles.infoIconFuncionario} />
              <Text style={styles.infoTextFuncionario}>
                {funcionarioSelecionado.role === 'chefe' ? 'Chefe' : 'Funcionário'}
              </Text>
            </View>
            <View style={styles.infoRowFuncionario}>
              <Image source={setorIcon} style={styles.infoIconFuncionario} />
              <Text style={styles.infoTextFuncionario}>{funcionarioSelecionado.setor || 'Sem setor'}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => setFuncionarioSelecionado(null)}>
            <Image source={IconRemover} style={styles.iconRemover} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ---------------- RENDER MODAL FUNCIONÁRIOS ----------------
  const renderModalFuncionarios = () => (
    <Modal visible={modalFuncionarios} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Selecione o Funcionário</Text>
            <TouchableOpacity onPress={() => setModalFuncionarios(false)} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchRow}>
            <View style={styles.searchContainer}>
              <Image source={require('../../assets/images/telas-admin/icone_lupa.png')} style={styles.searchIcon} />
              <TextInput
                placeholder="Buscar funcionário..."
                value={searchText}
                onChangeText={setSearchText}
                style={styles.searchInput}
                placeholderTextColor="#777"
              />
            </View>
          </View>

          <ScrollView style={{ height: 400, paddingHorizontal: 12, paddingVertical: 8 }}>
            {listaFiltrada.length > 0 ? (
              listaFiltrada.map(u => (
                <FuncionarioCardSelect
                  key={u._id}
                  funcionario={{
                    ...u,
                    id: u._id,
                    role: u.role === 'admin' || u.role === 'chefe' ? 'chefe' : 'funcionario'
                  }}
                  onSelect={f => {
                    if (f.role === 'chefe') {
                      setErroChefe(true);
                    } else {
                      setFuncionarioSelecionado(f);
                    }
                    setModalFuncionarios(false);
                  }}
                />
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <LottieView
                  source={require('../../assets/lottie/nenhum_funcionario_encontrado.json')}
                  autoPlay
                  loop
                  style={{ width: 250, height: 250 }}
                />
                <Text style={styles.emptyText}>Nenhum funcionário encontrado.</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // ---------------- SELEÇÃO DE SEMANA ----------------
  const handleSelecionarData = (dateString: string) => {
    const [ano, mes, dia] = dateString.split('-').map(Number);
    const dataSelecionada = new Date(ano, mes - 1, dia);

    const domingo = new Date(dataSelecionada);
    domingo.setDate(dataSelecionada.getDate() - dataSelecionada.getDay());
    const sabado = new Date(domingo);
    sabado.setDate(domingo.getDate() + 6);

    const novaSemana = semana.map((d, i) => ({
      ...d,
      data: new Date(domingo.getTime() + i * 24 * 60 * 60 * 1000)
    }));

    setSemanaInicio(domingo);
    setSemanaFim(sabado);
    setSemana(novaSemana);
    setMostrarCalendario(false);
  };

  const gerarMarcacoesSemana = () => {
    if (!semanaInicio || !semanaFim) return {};
    const datasMarcadas: any = {};
    const dataAtual = new Date(semanaInicio);
    while (dataAtual <= semanaFim) {
      const key = dataAtual.toISOString().split('T')[0];
      datasMarcadas[key] = { color: '#a286e3ff', textColor: '#fff' };
      dataAtual.setDate(dataAtual.getDate() + 1);
    }
    const inicioKey = semanaInicio.toISOString().split('T')[0];
    const fimKey = semanaFim.toISOString().split('T')[0];
    datasMarcadas[inicioKey].startingDay = true;
    datasMarcadas[fimKey].endingDay = true;
    return datasMarcadas;
  };

  // ---------------- GERENCIAR HORÁRIOS ----------------
  const handleHoraChange = (index: number, tipo: 'entrada' | 'saida', hora: Date) => {
    const novaSemana = [...semana];
    novaSemana[index][tipo] = hora;

    if (tipo === 'entrada' && funcionarioSelecionado?.cargaHorariaDiaria) {
      const saida = new Date(hora);
      saida.setHours(saida.getHours() + funcionarioSelecionado.cargaHorariaDiaria);
      novaSemana[index].saida = saida;
    }

    setSemana(novaSemana);
  };

  const definirModo = (index: number, modo: 'horario' | 'folga') => {
    const novaSemana = [...semana];
    novaSemana[index].modo = modo;
    if (modo === 'folga') {
      novaSemana[index].entrada = null;
      novaSemana[index].saida = null;
      novaSemana[index].folga = true;
    }
    setSemana(novaSemana);
  };

  const redefinirModo = (index: number) => {
    const novaSemana = [...semana];
    novaSemana[index] = { ...novaSemana[index], modo: 'nenhum', entrada: null, saida: null, folga: false };
    setSemana(novaSemana);
  };

  // ---------------- SALVAR ESCALA ----------------
  const salvarEscala = async () => {
    if (!funcionarioSelecionado || !semanaInicio || !semanaFim) {
      Alert.alert('Atenção', 'Selecione o funcionário e uma semana.');
      return;
    }

    try {
      for (const dia of semana) {
        if (!dia.data) continue;

        const dados: EscalaRequest = {
          funcionario: funcionarioSelecionado._id,
          data: dia.data.toISOString()
        };

        if (dia.modo === 'folga') dados.folga = true;
        else if (dia.modo === 'horario' && dia.entrada && dia.saida) {
          const formatarHora = (d: Date) =>
            d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false });
          dados.horaEntrada = formatarHora(dia.entrada);
          dados.horaSaida = formatarHora(dia.saida);
        }

        await criarOuEditarEscala(dados);
      }

      setMensagemSucesso('Escala criada com sucesso!');
      setAnimacao(true);
      setTimeout(() => {
        setAnimacao(false);
        setMensagemSucesso('');
      }, 3000);
    } catch (err) {
      console.error('Erro ao criar escala:', err);
      Alert.alert('Erro', 'Não foi possível criar a escala.');
    }
  };

  // ---------------- RENDER ----------------
  const podeEditarDias = funcionarioSelecionado && semanaInicio && semanaFim;

  return (
    <View style={styles.container}>
      <Navbar />
      {/* ✅ Animação de sucesso (substitui mensagem de alerta) */}
      {animacao && (
        <View style={[styles.successOverlay, { bottom: 60, top: 100 }]} pointerEvents="box-none">
          <LottieView
            source={require('../../assets/lottie/success.json')}
            autoPlay
            loop={false}
            style={{ width: 250, height: 250 }}
          />
          {mensagemSucesso !== '' && <Text style={styles.successText}>{mensagemSucesso}</Text>}
        </View>
      )}

      <ScrollView style={styles.content}>
        <Text style={styles.title}>Criar Escala</Text>

        {/* Seleção de Funcionário */}
        <View style={styles.inputWrapper}>
          {renderFuncionarioSelecionado()}
          {/* Mensagem de erro se o chefe se selecionar */}
          {erroChefe && (
            <View style={styles.erroChefeBox}>
              <Text style={styles.erroChefeText}>Um chefe não pode criar sua própria escala!</Text>
              <TouchableOpacity onPress={() => setErroChefe(false)} style={styles.fecharErroBtn}>
                <Image
                  source={require('../../assets/images/telas-admin/icone_excluir.png')}
                  style={styles.fecharErroIcon}
                />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Modal Funcionários */}
        {renderModalFuncionarios()}

        {/* Seleção de Semana */}
        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>Selecionar Semana</Text>
          <TouchableOpacity style={styles.input} onPress={() => setMostrarCalendario(!mostrarCalendario)}>
            <Text>
              {semanaInicio && semanaFim
                ? `${semanaInicio.toLocaleDateString('pt-BR')} até ${semanaFim.toLocaleDateString('pt-BR')}`
                : 'Selecionar semana'}
            </Text>
          </TouchableOpacity>
          {mostrarCalendario && (
            <Calendar
              onDayPress={day => handleSelecionarData(day.dateString)}
              markedDates={gerarMarcacoesSemana()}
              markingType="period"
              theme={{
                calendarBackground: '#fff',
                textSectionTitleColor: '#3C188F',
                selectedDayBackgroundColor: '#3C188F',
                todayTextColor: '#3C188F',
                arrowColor: '#3C188F'
              }}
            />
          )}
        </View>

        {/* Dias da Semana com Opacidade */}
        {!podeEditarDias && (
          <View style={styles.avisoWrapper}>
            <View style={styles.avisoBox}>
              <Text style={styles.avisoText}>Selecione um funcionário e uma semana para definir horários</Text>
            </View>
            <Image source={require('../../assets/images/telas-admin/icone_aviso.png')} style={styles.avisoBalao} />
          </View>
        )}
        <View style={{ opacity: podeEditarDias ? 1 : 0.5, pointerEvents: podeEditarDias ? 'auto' : 'none' }}>
          {semana.map((dia, i) => (
            <View key={i} style={styles.dayCard}>
              <Text style={styles.dayTitle}>
                {dia.dia}
                {dia.data && ` - ${dia.data.toLocaleDateString('pt-BR')}`}
              </Text>

              {/* Modo Nenhum */}
              {dia.modo === 'nenhum' && (
                <View style={styles.optionRow}>
                  <TouchableOpacity
                    style={[styles.optionButton, { backgroundColor: '#a8e6cf89' }]}
                    onPress={() => definirModo(i, 'horario')}
                  >
                    <Image source={require('../../assets/images/telas-admin/icone_ativo.png')} style={styles.icon} />
                    <Text style={styles.optionText}>Definir horários</Text>
                  </TouchableOpacity>
                  <Text style={styles.orText}>ou</Text>
                  <TouchableOpacity
                    style={[styles.optionButton, { backgroundColor: '#81d4fa8b' }]}
                    onPress={() => definirModo(i, 'folga')}
                  >
                    <Image source={require('../../assets/images/telas-admin/icone_folga.png')} style={styles.icon} />
                    <Text style={styles.optionText}>Definir folga</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Modo Horário */}
              {dia.modo === 'horario' && (
                <>
                  <View style={styles.timeRow}>
                    <TouchableOpacity
                      style={styles.horaBtn}
                      onPress={() => setMostrarPickerHora({ index: i, tipo: 'entrada' })}
                    >
                      <Text>
                        {dia.entrada
                          ? `Entrada: ${dia.entrada.toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}`
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
                      <Text style={styles.sugestaoText}>Sugestão de saída baseada na carga horária do funcionário</Text>
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
                      is24Hour={true}
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={(_: DateTimePickerEvent, hora?: Date) => {
                        if (hora && mostrarPickerHora.tipo)
                          handleHoraChange(mostrarPickerHora.index, mostrarPickerHora.tipo, hora);
                        setMostrarPickerHora({ index: -1, tipo: null });
                      }}
                    />
                  )}

                  <TouchableOpacity style={styles.redefinirBtn} onPress={() => redefinirModo(i)}>
                    <Text style={styles.redefinirText}>Redefinir</Text>
                  </TouchableOpacity>
                </>
              )}

              {/* Modo Folga */}
              {dia.modo === 'folga' && (
                <View style={styles.folgaRow}>
                  <Image source={require('../../assets/images/telas-admin/icone_folga.png')} style={styles.iconFolga} />
                  <Text style={styles.folgaText}>Folga definida</Text>
                  <View style={{ flex: 1 }} />
                  <TouchableOpacity style={styles.redefinirBtn} onPress={() => redefinirModo(i)}>
                    <Text style={styles.redefinirText}>Redefinir</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Botão Salvar */}
        <TouchableOpacity style={styles.saveBtn} onPress={salvarEscala}>
          <Text style={styles.saveText}>Salvar Escala</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  content: {
    padding: 15
  },
  title: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: '#3C188F',
    marginBottom: 20
  },
  inputWrapper: {
    marginBottom: 16,
    position: 'relative'
  },
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
  input: {
    borderWidth: 1.5,
    borderColor: '#3C188F',
    borderRadius: 28,
    height: 55,
    paddingHorizontal: 16,
    justifyContent: 'center',
    fontSize: 16,
    backgroundColor: '#fff'
  },
  dayCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 14,
    marginBottom: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }
  },
  dayTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#3C188F',
    marginBottom: 8
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 10
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20
  },
  optionText: {
    fontFamily: 'Poppins_500Medium',
    color: '#3C188F',
    marginLeft: 6
  },
  icon: {
    width: 22,
    height: 22,
    resizeMode: 'contain'
  },
  orText: {
    fontFamily: 'Poppins_500Medium',
    color: '#888'
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    gap: 10
  },
  horaBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#3C188F',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    minWidth: 100,
    alignItems: 'center'
  },
  redefinirBtn: {
    alignSelf: 'flex-end',
    marginTop: 6
  },
  redefinirText: {
    color: '#3C188F',
    fontWeight: '600'
  },
  folgaText: {
    fontFamily: 'Poppins_500Medium',
    color: '#3C188F',
    marginBottom: 0
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
  saveBtn: {
    backgroundColor: '#3C188F',
    borderRadius: 30,
    alignItems: 'center',
    paddingVertical: 14,
    marginVertical: 20,
    marginBottom: 50
  },
  saveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 0,
    width: '92%',
    overflow: 'hidden'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f0ededff',
    paddingVertical: 12,
    paddingHorizontal: 16
  },
  modalTitle: {
    color: '#3C188F',
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold'
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#3C188F',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12
  },
  cancelButtonText: {
    color: '#3C188F',
    fontWeight: 'bold',
    fontFamily: 'Poppins_500Medium'
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#377ACF',
    borderRadius: 30,
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: 'transparent'
  },
  searchIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
    tintColor: '#377ACF'
  },
  searchInput: {
    flex: 1,
    height: 30,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular'
  },
  cardFuncionarioSelect: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
    borderColor: '#3c188f3e',
    borderWidth: 1
  },
  rowFuncionario: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  fotoFuncionario: {
    width: 50,
    height: 50,
    borderRadius: 25
  },
  nomeFuncionario: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#222'
  },
  infoRowFuncionario: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4
  },
  foto: {
    width: 50,
    height: 50,
    borderRadius: 25
  },
  infoIconFuncionario: {
    width: 16,
    height: 16,
    marginRight: 4
  },
  infoTextFuncionario: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'Poppins_400Regular'
  },
  iconRemover: {
    width: 24,
    height: 24,
    resizeMode: 'contain'
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
  avisoWrapper: {
    marginBottom: 10,
    position: 'relative',
    alignItems: 'flex-start'
  },
  avisoBox: {
    backgroundColor: '#fff3cd',
    borderWidth: 1,
    borderColor: '#ffeeba',
    borderRadius: 10,
    padding: 15,
    paddingTop: 25
  },
  avisoText: {
    color: '#856404',
    fontSize: 14
  },
  avisoBalao: {
    position: 'absolute',
    top: -12,
    left: 10, 
    width: 24,
    height: 24,
    resizeMode: 'contain'
  },
  erroChefeBox: {
    backgroundColor: '#ffdede',
    padding: 12,
    borderRadius: 8,
    marginVertical: 10,
    position: 'relative', 
    justifyContent: 'center',
    alignItems: 'center'
  },
  erroChefeText: {
    color: '#d8000c',
    fontWeight: 'bold',
    textAlign: 'center'
  },
  fecharErroBtn: {
    position: 'absolute',
    top: 11,
    right: 6
  },
  fecharErroIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain'
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 50
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#858383ff',
    fontFamily: 'Poppins_600SemiBold'
  }
});
