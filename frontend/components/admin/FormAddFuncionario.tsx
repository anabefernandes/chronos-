import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, Platform, Animated, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import { Funcionario } from './FuncionarioCard';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface FormProps {
  onClose: () => void;
  onAdd: (dados: { nome: string; email: string; senha?: string; role: 'funcionario' | 'chefe'; foto?: string }) => void;
  funcionario?: Funcionario;
}

export default function FormAdicionarFuncionario({ onClose, onAdd, funcionario }: FormProps) {
  const [nome, setNome] = useState(funcionario?.nome || '');
  const [email, setEmail] = useState(funcionario?.email || '');
  const [senha, setSenha] = useState('');
  const [role, setRole] = useState<'funcionario' | 'chefe'>(funcionario?.role || 'funcionario');
  const [foto, setFoto] = useState(funcionario?.foto || '');

  const slideAnim = useRef(new Animated.Value(300)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true })
    ]).start();
  }, []);

  const selecionarImagem = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Permissão negada para acessar a galeria.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setFoto(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!nome || !email) return;

    const formData = new FormData();
    formData.append('nome', nome);
    formData.append('email', email);
    formData.append('role', role);
    if (senha.trim()) formData.append('senha', senha);

    if (foto && !foto.startsWith('http')) {
      const uri = foto; // ImagePicker já retorna 'file://...'
      const filename = uri.split('/').pop() || `foto-${Date.now()}.jpg`;
      const match = /\.(\w+)$/.exec(filename);
      let type = 'image/jpeg';

      if (match) {
        const ext = match[1].toLowerCase();
        if (ext === 'png') type = 'image/png';
        else if (ext === 'heic') type = 'image/heic';
        else if (ext === 'jpg' || ext === 'jpeg') type = 'image/jpeg';
      }

      formData.append('foto', {
        uri,
        name: filename,
        type
      } as any);
    }

    const url = funcionario
      ? `${process.env.EXPO_PUBLIC_API_URL}/user/atualizarUsuario/${funcionario._id}`
      : `${process.env.EXPO_PUBLIC_API_URL}/user/criarUsuario`;

    const method = funcionario ? 'PUT' : 'POST';

    const token = await AsyncStorage.getItem('token');
    const res = await fetch(url, {
      method,
      body: formData,
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();
    console.log(data);

    if (data.user) {
      const usuarioCompleto = {
        nome: data.user.nome,
        email: data.user.email,
        role: data.user.role,
        foto: data.user.foto,
        senha: senha
      };
      onAdd(usuarioCompleto);
      onClose();
    }
  };

  return (
    <Modal transparent animationType="none">
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ translateY: slideAnim }],
              opacity: opacityAnim
            }
          ]}
        >
          <Text style={styles.title}>{funcionario ? 'Atualizar Funcionário' : 'Novo Funcionário'}</Text>

          {/* Foto */}
          <View style={styles.imageContainer}>
            <Image
              source={
                foto
                  ? {
                      uri:
                        foto.startsWith('http') || foto.startsWith('https') || foto.startsWith('/')
                          ? `${process.env.EXPO_PUBLIC_API_URL}${foto}`
                          : foto
                    }
                  : require('../../assets/images/telas-public/sem_foto.png')
              }
              style={styles.foto}
            />

            <TouchableOpacity style={styles.imageButton} onPress={selecionarImagem}>
              <Text style={styles.imageButtonText}>Selecionar imagem</Text>
            </TouchableOpacity>
          </View>

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
        </Animated.View>
      </View>
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
    width: '90%'
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
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 20
  },
  foto: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 8
  },
  imageButton: {
    borderWidth: 1,
    borderColor: '#3C188F',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6
  },
  imageButtonText: {
    color: '#3C188F',
    fontWeight: 'bold'
  }
});
