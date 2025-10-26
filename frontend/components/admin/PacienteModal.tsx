import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback
} from 'react-native';

export interface PacienteData {
  nome: string;
  temperatura: string;
  sintomas: string;
  idade: string;
  saturacao: string;
}

interface PacienteModalProps {
  visible: boolean;
  onClose: () => void;
  pacienteInicial: PacienteData;
  onConfirm: (paciente: PacienteData) => void;
}

export default function PacienteModal({ visible, onClose, pacienteInicial, onConfirm }: PacienteModalProps) {
  const [nome, setNome] = useState('');
  const [temperatura, setTemperatura] = useState('');
  const [sintomas, setSintomas] = useState('');
  const [idade, setIdade] = useState('');
  const [saturacao, setSaturacao] = useState('');

  useEffect(() => {
    if (pacienteInicial) {
      setNome(pacienteInicial.nome === 'Nenhum' ? '' : pacienteInicial.nome);
      setTemperatura(pacienteInicial.temperatura);
      setSintomas(pacienteInicial.sintomas);
      setIdade(pacienteInicial.idade);
      setSaturacao(pacienteInicial.saturacao);
    }
  }, [pacienteInicial, visible]);

  const handleConfirm = () => {
    if (!nome) {
      alert('Insira o nome do paciente.');
      return;
    }
    onConfirm({ nome, temperatura, sintomas, idade, saturacao });
    onClose();
  };

  const handleClose = () => {
    setNome('');
    setTemperatura('');
    setSintomas('');
    setIdade('');
    setSaturacao('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Informações do Paciente</Text>
            <ScrollView style={{ paddingHorizontal: 16 }}>
              <View style={[styles.inputWrapper, { marginTop: 10 }]}>
                <Text style={styles.inputLabel}>Nome</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nome do paciente"
                  value={nome}
                  onChangeText={setNome}
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Idade</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 42"
                  value={idade}
                  onChangeText={setIdade}
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Saturação O₂ (%)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 98"
                  value={saturacao}
                  onChangeText={setSaturacao}
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Temperatura (°C)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 36.5"
                  value={temperatura}
                  onChangeText={setTemperatura}
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Sintomas (Queixa Principal)</Text>
                <TextInput
                  style={[styles.input, { height: 80, paddingTop: 10, textAlignVertical: 'top' }]}
                  placeholder="Descreva os sintomas ou a queixa principal"
                  value={sintomas}
                  onChangeText={setSintomas}
                  multiline
                  placeholderTextColor="#999"
                />
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
                <TouchableOpacity style={[styles.btnConfirmar, { flex: 1, marginRight: 8 }]} onPress={handleConfirm}>
                  <Text style={styles.btnText}>Confirmar</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.btnCancelar, { flex: 1, marginLeft: 8 }]} onPress={handleClose}>
                  <Text style={styles.cancelText}>Cancelar</Text>
                </TouchableOpacity>
              </View>

              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalBox: {
    width: '92%',
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    paddingVertical: 16
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#3C188F',
    textAlign: 'center',
    marginBottom: 16
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
  btnConfirmar: {
    backgroundColor: '#3C188F',
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: 'center'
  },
  btnText: {
    color: '#fff',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16
  },
  btnCancelar: {
    backgroundColor: '#B0B0B0',
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: 'center'
  },
  cancelText: {
    color: '#fff',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16
  }
});
