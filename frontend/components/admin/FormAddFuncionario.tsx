import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Platform,
  Animated,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Funcionario } from './FuncionarioCard';

interface FormProps {
  onClose: () => void;
  onAdd: (dados: {
    nome: string;
    email: string;
    senha?: string;
    role: 'funcionario' | 'chefe';
    setor: string;
    cargaHorariaDiaria: number;
    salario: number;
  }) => void;
  funcionario?: Funcionario;
}

export default function FormAdicionarFuncionario({ onClose, onAdd, funcionario }: FormProps) {
  const [nome, setNome] = useState(funcionario?.nome || '');
  const [email, setEmail] = useState(funcionario?.email || '');
  const [senha, setSenha] = useState('');
  const [role, setRole] = useState<'funcionario' | 'chefe'>(funcionario?.role || 'funcionario');
  const [setor, setSetor] = useState(funcionario?.setor || '');
  const [cargaHorariaDiaria, setCargaHorariaDiaria] = useState(funcionario?.cargaHorariaDiaria?.toString() || '8');
  const [salario, setSalario] = useState(funcionario?.salario?.toString() || '');

  const slideAnim = useRef(new Animated.Value(300)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true })
    ]).start();
  }, []);

  const handleSubmit = () => {
    if (!nome || !email || !setor) return;
    const dados = {
      nome,
      email,
      senha,
      role,
      setor,
      cargaHorariaDiaria: Number(cargaHorariaDiaria),
      salario: Number(salario) || 0
    };
    onAdd(dados);
    onClose();
  };

  return (
    <Modal transparent animationType="none">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ width: '100%', alignItems: 'center', marginTop: 50 }}
          >
            <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }], opacity: opacityAnim }]}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
                keyboardShouldPersistTaps="handled"
              >
                <Text style={styles.title}>{funcionario ? 'Atualizar Funcionário' : 'Novo Funcionário'}</Text>

                {/* inputs... */}
                {/* Nome */}
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Nome</Text>
                  <TextInput
                    placeholder=" "
                    style={styles.input}
                    value={nome}
                    onChangeText={setNome}
                    placeholderTextColor="#999"
                  />
                </View>

                {/* Email */}
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <TextInput
                    placeholder=" "
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholderTextColor="#999"
                    keyboardType="email-address"
                  />
                </View>

                {/* Senha */}
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Senha</Text>
                  <TextInput
                    placeholder=" "
                    style={styles.input}
                    value={senha}
                    onChangeText={setSenha}
                    placeholderTextColor="#999"
                    secureTextEntry
                  />
                </View>

                {/* Setor */}
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Setor</Text>
                  <TextInput
                    placeholder=" "
                    style={styles.input}
                    value={setor}
                    onChangeText={setSetor}
                    placeholderTextColor="#999"
                  />
                </View>

                {/* Carga Horária Diária */}
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Carga Horária Diária (h)</Text>
                  <TextInput
                    placeholder="8"
                    style={styles.input}
                    value={cargaHorariaDiaria}
                    onChangeText={setCargaHorariaDiaria}
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                  />
                </View>

                {/* Salário */}
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Salário (R$)</Text>
                  <TextInput
                    placeholder="Ex: 2500"
                    style={styles.input}
                    value={salario}
                    onChangeText={setSalario}
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                  />
                </View>

                {/* Cargo */}
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Cargo</Text>
                  <View style={styles.pickerWrapper}>
                    <Picker
                      selectedValue={role}
                      onValueChange={value => setRole(value)}
                      style={styles.picker}
                      itemStyle={styles.pickerItem}
                    >
                      <Picker.Item label="Funcionário" value="funcionario" />
                      <Picker.Item label="Chefe" value="chefe" />
                    </Picker>
                  </View>
                </View>

                {/* Botões */}
                <View style={styles.buttonsRow}>
                  <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                    <Text style={styles.buttonText}>{funcionario ? 'Atualizar' : 'Adicionar'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose}>
                    <Text style={styles.buttonText}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
              {/* ScrollView fechado corretamente */}
            </Animated.View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#00000044',
    justifyContent: 'center',
    alignItems: 'center'
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '100%' // IMPEDINDO QUE SUBA DEMAIS
  },
  title: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#1B0A43',
    marginBottom: 30,
    textAlign: 'center'
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
    borderWidth: 1,
    borderColor: '#3C188F',
    borderRadius: 28,
    height: 55,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#000'
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#3C188F',
    borderRadius: 15,
    overflow: 'hidden',
    height: 55,
    justifyContent: 'center',
    backgroundColor: '#fff'
  },
  picker: {
    flex: 1,
    color: '#333',
    ...Platform.select({ ios: { height: 55 }, android: {} })
  },
  pickerItem: {
    fontSize: 16,
    color: '#333',
    height: 55
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8
  },
  button: {
    flex: 1,
    backgroundColor: '#377ACF',
    padding: 12,
    borderRadius: 20,
    alignItems: 'center',
    marginHorizontal: 4
  },
  cancelButton: {
    backgroundColor: '#999'
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold'
  }
});
