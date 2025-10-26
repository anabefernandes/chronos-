import React, { useState, useEffect, useContext } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { FontAwesome5 } from '@expo/vector-icons';
import { AuthContext } from '../../contexts/AuthContext';
import api from '../../services/api';
import FuncionarioCardSelect from '../../components/admin/FuncionarioCardSelect';
import CategoriaSelector from '../../components/admin/CategoriaSelector';
import PacienteModal, { PacienteData } from '../../components/admin/PacienteModal';
import { useML } from '../../hooks/useML';

interface EditarTarefaModalProps {
  visible: boolean;
  onClose: () => void;
  tarefa: any;
  onSave: () => void;
}

const EditarTarefaModal: React.FC<EditarTarefaModalProps> = ({ visible, onClose, tarefa, onSave }) => {
  const { usuarios, carregarUsuarios } = useContext(AuthContext);
  const { calcularPrioridade, loading: loadingML } = useML();
  const roboImg = require('../../assets/images/telas-admin/chatbot.png');
  const IconRemover = require('../../assets/images/telas-admin/icone_excluir.png');

  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState(tarefa.funcionario || null);
  const [titulo, setTitulo] = useState(tarefa.titulo || '');
  const [descricao, setDescricao] = useState(tarefa.descricao || '');
  const [data, setData] = useState(new Date(tarefa.dataPrevista) || new Date());
  const [mostrarSeletorData, setMostrarSeletorData] = useState(false);
  const [modalFuncionarios, setModalFuncionarios] = useState(false);

  const [categorias, setCategorias] = useState<{ nome: string; cor?: string; icone?: string }[]>([]);
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState(tarefa.categorias || []);

  const [prioridade, setPrioridade] = useState<'baixa' | 'media' | 'alta'>(tarefa.prioridade || 'media');
  const [prioridadeSugerida, setPrioridadeSugerida] = useState<'baixa' | 'media' | 'alta' | null>(null);

  const [modalPaciente, setModalPaciente] = useState(false);
  const [pacienteSelecionado, setPacienteSelecionado] = useState<PacienteData>(
    tarefa.paciente || { nome: 'Nenhum', temperatura: '', sintomas: '', idade: '', saturacao: '' }
  );

  // --- NOVO useEffect para atualizar os estados quando a tarefa mudar ---
  useEffect(() => {
    if (tarefa) {
      setTitulo(tarefa.titulo || '');
      setDescricao(tarefa.descricao || '');
      setFuncionarioSelecionado(tarefa.funcionario || null);
      setPacienteSelecionado(
        tarefa.paciente || { nome: 'Nenhum', temperatura: '', sintomas: '', idade: '', saturacao: '' }
      );
      setData(tarefa.dataPrevista ? new Date(tarefa.dataPrevista) : new Date());
      setCategoriasSelecionadas(tarefa.categorias || []);
      setPrioridade(tarefa.prioridade || 'media');
      setPrioridadeSugerida(null);
    }
  }, [tarefa]);
  // ------------------------------------------------------------

  useEffect(() => {
    carregarUsuarios();
  }, []);

  const getUserImage = (foto?: string) => {
    if (!foto || foto.trim() === '') return require('../../assets/images/telas-public/sem_foto.png');
    if (foto.includes('sem_foto.png')) return require('../../assets/images/telas-public/sem_foto.png');
    let baseURL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
    if (baseURL?.endsWith('/api')) baseURL = baseURL.replace(/\/api$/, '');
    const cleanFoto = foto.replace(/^\/+/, '');
    return { uri: `${baseURL}/${cleanFoto}` };
  };

  const salvarEdicao = async () => {
    if (!funcionarioSelecionado || !titulo) {
      Alert.alert('Atenção', 'Selecione um funcionário e insira o título!');
      return;
    }

    try {
      await api.put(`/tarefas/${tarefa._id}`, {
        funcionario: funcionarioSelecionado._id,
        titulo,
        descricao,
        paciente: pacienteSelecionado.nome !== 'Nenhum' ? pacienteSelecionado : null,
        categorias: categoriasSelecionadas.map((c: { nome: any; cor: any; icone: any }) => ({
          nome: c.nome,
          cor: c.cor || '#3C188F',
          icone: c.icone || '⭐'
        })),
        dataPrevista: data.toISOString(),
        prioridade
      });
      Alert.alert('Sucesso', 'Tarefa atualizada com sucesso!');
      onSave();
      onClose();
    } catch (err: any) {
      Alert.alert('Erro', err.response?.data?.msg || 'Erro ao atualizar tarefa');
    }
  };

  const confirmarData = (selectedDate: Date) => {
    setData(selectedDate);
    setMostrarSeletorData(false);
  };

  const handleSelectPrioridade = (p: 'baixa' | 'media' | 'alta') => {
    setPrioridade(p);
    setPrioridadeSugerida(null);
  };

  const handlePacienteConfirm = async (pacienteAtualizado: PacienteData) => {
    setPacienteSelecionado(pacienteAtualizado);
    const prioridadeML = await calcularPrioridade(pacienteAtualizado);
    if (prioridadeML) setPrioridade(prioridadeML), setPrioridadeSugerida(prioridadeML);
    else setPrioridadeSugerida(null);
    setModalPaciente(false);
  };

  const renderFuncionarioSelecionado = () => {
    if (!funcionarioSelecionado) {
      return (
        <TouchableOpacity style={styles.selectFuncionario} onPress={() => setModalFuncionarios(true)}>
          <Text style={styles.selectText}>Selecione o funcionário</Text>
        </TouchableOpacity>
      );
    }

    const setorIcon = require('../../assets/images/telas-admin/icone_setor.png');
    const cargoIcon =
      funcionarioSelecionado.role === 'chefe'
        ? require('../../assets/images/telas-admin/icone_chefe.png')
        : require('../../assets/images/telas-admin/icone_funcionario.png');

    return (
      <View style={styles.cardFuncionarioSelect}>
        <View style={styles.rowFuncionario}>
          <Image source={getUserImage(funcionarioSelecionado?.foto)} style={styles.foto} />
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

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.modalHeaderMain}>
            <Text style={styles.title}>Editar Tarefa</Text>
            <TouchableOpacity style={styles.cancelButtonMain} onPress={onClose}>
              <Text style={styles.cancelButtonTextMain}>Cancelar</Text>
            </TouchableOpacity>
          </View>

          {renderFuncionarioSelecionado()}

          {/* Título */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Título da tarefa</Text>
            <TextInput
              style={styles.input}
              value={titulo}
              onChangeText={setTitulo}
              placeholder=" "
              placeholderTextColor="#999"
            />
          </View>

          {/* Descrição */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Descrição da tarefa</Text>
            <TextInput
              style={[styles.input, { height: 80 }]}
              multiline
              value={descricao}
              onChangeText={setDescricao}
              placeholder=" "
              placeholderTextColor="#999"
            />
          </View>

          {/* Paciente */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Paciente vinculado</Text>
            <TouchableOpacity style={styles.input} onPress={() => setModalPaciente(true)}>
              <Text style={{ color: pacienteSelecionado.nome === 'Nenhum' ? '#999' : '#000' }}>
                {pacienteSelecionado.nome !== 'Nenhum'
                  ? `${pacienteSelecionado.nome} (${pacienteSelecionado.idade || '?'} anos)`
                  : 'Nenhum'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Data/Hora */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Data/Hora</Text>
            <TouchableOpacity style={styles.inputDataHora} onPress={() => setMostrarSeletorData(true)}>
              <FontAwesome5 name="calendar-alt" size={18} color="#555" style={{ marginRight: 6 }} />
              <Text style={styles.inputText}>{data.toLocaleDateString('pt-BR')}</Text>
              <View style={{ width: 20 }} />
              <FontAwesome5 name="clock" size={18} color="#555" style={{ marginRight: 6 }} />
              <Text style={styles.inputText}>
                {data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </TouchableOpacity>

            <DateTimePickerModal
              isVisible={mostrarSeletorData}
              mode="datetime"
              date={data}
              onConfirm={confirmarData}
              onCancel={() => setMostrarSeletorData(false)}
              confirmTextIOS="Confirmar"
              cancelTextIOS="Cancelar"
              locale="pt-BR"
              is24Hour={true}
              isDarkModeEnabled={false}
              textColor="#3C188F"
              buttonTextColorIOS="#377ACF"
            />
          </View>

          {/* Categorias */}
          <View style={styles.separator} />
          <CategoriaSelector
            categorias={categorias}
            setCategorias={setCategorias}
            categoriasSelecionadas={categoriasSelecionadas}
            setCategoriasSelecionadas={setCategoriasSelecionadas}
          />
          <View style={styles.separator} />

          {/* Prioridade */}
          <View style={styles.inputWrapper}>
            <Text style={styles.sectionTitle}>Selecione uma Prioridade:</Text>
            {loadingML && <ActivityIndicator size="small" color="#3C188F" style={{ marginVertical: 10 }} />}
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 12 }}>
              {(['baixa', 'media', 'alta'] as const).map(p => {
                const cores: Record<string, string> = { baixa: '#2ECC71', media: '#F1C40F', alta: '#E74C3C' };
                const selecionado = prioridade === p;
                const sugerido = prioridadeSugerida === p;
                return (
                  <View key={p} style={{ alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                      {sugerido && (
                        <>
                          <Text style={{ color: cores[p], fontSize: 12, fontWeight: 'bold' }}>Sugestão IA</Text>
                          <Image source={roboImg} style={{ width: 14, height: 14, marginLeft: 4 }} />
                        </>
                      )}
                    </View>
                    <TouchableOpacity
                      style={{
                        paddingVertical: 8,
                        paddingHorizontal: 20,
                        borderRadius: 20,
                        borderWidth: selecionado ? 2 : 1,
                        borderColor: selecionado ? cores[p] : '#ccc',
                        backgroundColor: selecionado ? cores[p] + '33' : '#fff',
                        marginHorizontal: 6,
                        marginTop: sugerido ? 0 : 18
                      }}
                      onPress={() => handleSelectPrioridade(p)}
                    >
                      <Text
                        style={{
                          color: selecionado ? cores[p] : '#555',
                          textTransform: 'capitalize',
                          fontWeight: selecionado ? '700' : '500'
                        }}
                      >
                        {p}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </View>

          <TouchableOpacity style={styles.btnConfirmar} onPress={salvarEdicao}>
            <Text style={styles.btnText}>Salvar</Text>
          </TouchableOpacity>
          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Modal Funcionário */}
        <Modal visible={modalFuncionarios} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Selecione o Funcionário</Text>
                <TouchableOpacity onPress={() => setModalFuncionarios(false)} style={styles.cancelButton}>
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={{ maxHeight: 400, minHeight: 200, paddingHorizontal: 12, top: -12 }}>
                {usuarios.map(u => (
                  <FuncionarioCardSelect
                    key={u._id}
                    funcionario={u as any} 
                    onSelect={f => {
                      setFuncionarioSelecionado(f);
                      setModalFuncionarios(false);
                    }}
                  />
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Modal Paciente */}
        <PacienteModal
          visible={modalPaciente}
          onClose={() => setModalPaciente(false)}
          pacienteInicial={pacienteSelecionado}
          onConfirm={handlePacienteConfirm}
        />
      </View>
    </Modal>
  );
};

export default EditarTarefaModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  container: {
    padding: 20,
    backgroundColor: '#fff'
  },
  modalHeaderMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 30
  },
  cancelButtonMain: {
    borderWidth: 1,
    borderColor: '#3C188F',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12
  },
  cancelButtonTextMain: {
    color: '#3C188F',
    fontWeight: 'bold',
    fontFamily: 'Poppins_500Medium'
  },
  title: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: '#3C188F'
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
  foto: {
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
  inputDataHora: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#3C188F',
    borderRadius: 28,
    height: 55,
    paddingHorizontal: 16,
    backgroundColor: '#fff'
  },
  inputText: {
    fontSize: 16,
    color: '#000',
    fontFamily: 'Poppins_400Regular'
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins_400Regular',
    color: '#3C188F',
    marginBottom: 1,
    marginLeft: 4
  },
  btnConfirmar: {
    backgroundColor: '#3C188F',
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 8
  },
  btnText: {
    color: '#fff',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16
  },
  separator: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 12,
    borderRadius: 1
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
  }
});
