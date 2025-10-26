import React, { useContext, useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Animated,
  Easing,
  ActionSheetIOS,
  Platform,
  Modal,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AuthContext } from '../../contexts/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useToast } from '../../contexts/ToastContext';

export default function PerfilFuncionario() {
  const router = useRouter();
  const { userId, nome, foto, role, setFoto, setor } = useContext(AuthContext);
  const [userFoto, setUserFoto] = useState<string>(foto || '');
  const [loading, setLoading] = useState(false);
  const spinAnim = useRef(new Animated.Value(0)).current;
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [editandoEmail, setEditandoEmail] = useState(false);

  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [modalSenha, setModalSenha] = useState(false);

  useEffect(() => {
    if (foto && typeof foto === 'string') setUserFoto(foto);
  }, [foto]);

  const getFoto = () => {
    if (!userFoto || userFoto.includes('sem_foto.png')) {
      return require('../../assets/images/telas-public/sem_foto.png');
    }
    let baseURL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
    if (baseURL?.endsWith('/api')) baseURL = baseURL.replace(/\/api$/, '');
    const cleanFoto = userFoto.replace(/^\/+/, '').replace(/^uploads\//, '');
    return { uri: `${baseURL}/uploads/${cleanFoto}` };
  };

  const handleBack = () => {
    if (role === 'chefe' || role === 'admin') {
      router.replace('/telas-chefe/painel-admin');
    } else {
      router.replace('/telas-iniciais/painel');
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.clear();
    router.replace('/telas-iniciais/login');
  };

  const selecionarImagem = async () => {
    if (!userId) {
      showToast('Usuário não identificado. Faça login novamente.', 'error');
      return;
    }

    showToast('Selecionando imagem...', 'success');

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showToast('Não foi possível acessar a galeria.', 'error');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8
    });

    if (!result.canceled && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      setLoading(true);
      Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.linear,
          useNativeDriver: true
        })
      ).start();

      const formData = new FormData();
      const filename = uri.split('/').pop() || `foto-${Date.now()}.jpg`;
      const match = /\.(\w+)$/.exec(filename);
      let type = 'image/jpeg';
      if (match) {
        const ext = match[1].toLowerCase();
        if (ext === 'png') type = 'image/png';
        else if (ext === 'heic') type = 'image/heic';
      }
      formData.append('foto', { uri, name: filename, type } as any);

      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          showToast('Token não encontrado. Faça login novamente.', 'error');
          setLoading(false);
          return;
        }

        const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/user/atualizarMinhaFoto`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });

        const data = await res.json();
        if (res.ok && data.user) {
          setUserFoto(data.user.foto);
          setFoto(data.user.foto);
          showToast('Foto atualizada com sucesso!', 'success');
        } else {
          console.log(data);
          showToast(data.msg || 'Não foi possível atualizar a foto.', 'error');
        }
      } catch (err) {
        console.log(err);
        showToast('Erro ao atualizar a foto.', 'error');
      } finally {
        setLoading(false);
        spinAnim.stopAnimation();
        spinAnim.setValue(0);
      }
    }
  };

  const removerFoto = async () => {
    if (!userId) return;

    showToast('Removendo foto...', 'success');

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        showToast('Token não encontrado. Faça login novamente.', 'error');
        return;
      }

      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/user/atualizarMinhaFoto`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (res.ok && data.user) {
        setUserFoto('');
        setFoto('');
        showToast('Foto removida com sucesso!', 'success');
      } else {
        console.log(data);
        showToast(data.msg || 'Não foi possível remover a foto.', 'error');
      }
    } catch (err) {
      console.log(err);
      showToast('Erro ao remover a foto.', 'error');
    }
  };

  const abrirMenuFoto = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancelar', 'Editar Foto', 'Remover Foto'],
          cancelButtonIndex: 0,
          destructiveButtonIndex: 2
        },
        buttonIndex => {
          if (buttonIndex === 1) selecionarImagem();
          else if (buttonIndex === 2) removerFoto();
        }
      );
    } else {
      Alert.alert('Foto', 'Escolha uma opção', [
        { text: 'Editar Foto', onPress: selecionarImagem },
        { text: 'Remover Foto', onPress: removerFoto, style: 'destructive' },
        { text: 'Cancelar', style: 'cancel' }
      ]);
    }
  };

  const validarEmail = (email: string) => /^\S+@\S+\.\S+$/.test(email);

  const salvarEmail = async () => {
    if (!email.trim()) {
      setEditandoEmail(false);
      return;
    }

    if (!validarEmail(email)) {
      showToast('E-mail inválido.', 'error');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/user/atualizarMeusDados`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      if (res.ok) showToast('E-mail atualizado!', 'success');
      else showToast(data.msg || 'Não foi possível atualizar o e-mail.', 'error');
    } catch (e) {
      console.log(e);
      showToast('Falha ao atualizar e-mail.', 'error');
    }

    setEditandoEmail(false);
  };

  const salvarSenha = async () => {
    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      showToast('Preencha todos os campos.', 'error');
      return;
    }

    if (novaSenha.length < 6) {
      showToast('A nova senha deve ter pelo menos 6 caracteres.', 'error');
      return;
    }

    if (novaSenha !== confirmarSenha) {
      showToast('As senhas não coincidem.', 'error');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/user/atualizarMeusDados`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ senhaAtual, novaSenha })
      });

      const data = await res.json();
      if (res.ok) {
        showToast('Senha atualizada!', 'success');
        setModalSenha(false);
        setSenhaAtual('');
        setNovaSenha('');
        setConfirmarSenha('');
      } else showToast(data.msg || 'Não foi possível atualizar a senha.', 'error');
    } catch (e) {
      console.log(e);
      showToast('Falha ao atualizar senha.', 'error');
    }
  };

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#17153A', '#3e39a0fa']} locations={[0, 0.3]} style={styles.header}>
        <View style={styles.iconRow}>
          <TouchableOpacity onPress={handleBack}>
            <Ionicons name="arrow-back" size={28} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('telas-iniciais/notificacoes')}>
            <Ionicons name="notifications-outline" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.profileContent}>
          <View style={{ alignItems: 'center' }}>
            <Image source={getFoto()} style={styles.avatar} />
            <TouchableOpacity style={styles.editIcon} onPress={abrirMenuFoto}>
              <Ionicons name="pencil" size={15} color="#fff" />
            </TouchableOpacity>
            {loading && <Animated.View style={[styles.loadingCircle, { transform: [{ rotate: spin }] }]} />}
          </View>
          <Text style={styles.nome}>{nome || 'NOVO USUÁRIO'}</Text>
          <View style={styles.setorContainer}>
            <Image source={require('../../assets/images/telas-admin/icone_setor.png')} style={styles.setorIcon} />
            <Text style={styles.setor}>{setor || 'Setor não informado'}</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.options}>
        <TouchableOpacity style={styles.option}>
          <Ionicons name="calendar-outline" size={20} color="#3C188F" />
          <Text style={styles.optionText}>Minha Escala</Text>
          <Ionicons name="chevron-forward" size={18} color="#3C188F" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.option}
          onPress={() => (editandoEmail ? salvarEmail() : setEditandoEmail(true))}
        >
          <Ionicons name="mail-outline" size={20} color="#3C188F" />
          {editandoEmail ? (
            <TextInput
              style={[styles.optionText, { borderBottomWidth: 1, borderColor: '#ccc' }]}
              value={email}
              onChangeText={setEmail}
              autoFocus
              keyboardType="email-address"
              placeholder="Digite o novo e-mail"
            />
          ) : (
            <Text style={styles.optionText}>{email || `${nome?.toLowerCase() || 'usuario'}@email.com`}</Text>
          )}
          <Ionicons name="chevron-forward" size={18} color="#3C188F" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.option} onPress={() => setModalSenha(true)}>
          <Ionicons name="lock-closed-outline" size={20} color="#3C188F" />
          <Text style={styles.optionText}>Alterar Senha</Text>
          <Ionicons name="chevron-forward" size={18} color="#3C188F" />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.option, styles.logout]} onPress={handleLogout}>
          <Ionicons name="exit-outline" size={20} color="#3C188F" />
          <Text style={[styles.optionText, styles.logoutText]}>Sair</Text>
          <Ionicons name="chevron-forward" size={18} color="#3C188F" />
        </TouchableOpacity>
      </View>

      <Modal visible={modalSenha} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Alterar Senha</Text>
              <ScrollView style={{ paddingHorizontal: 16 }}>
                <View style={[styles.inputWrapper, { marginTop: 10 }]}>
                  <Text style={styles.inputLabel}>Senha Atual</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Digite sua senha atual"
                    secureTextEntry
                    value={senhaAtual}
                    onChangeText={setSenhaAtual}
                    placeholderTextColor="#999"
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Nova Senha</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Digite a nova senha"
                    secureTextEntry
                    value={novaSenha}
                    onChangeText={setNovaSenha}
                    placeholderTextColor="#999"
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Confirmar Nova Senha</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Confirme a nova senha"
                    secureTextEntry
                    value={confirmarSenha}
                    onChangeText={setConfirmarSenha}
                    placeholderTextColor="#999"
                  />
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
                  <TouchableOpacity
                    style={[styles.btnCancelar, { flex: 1, marginRight: 8 }]}
                    onPress={() => {
                      setModalSenha(false);
                      setSenhaAtual('');
                      setNovaSenha('');
                      setConfirmarSenha('');
                    }}
                  >
                    <Text style={styles.cancelText}>Cancelar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.btnConfirmar, { flex: 1, marginLeft: 8 }]} onPress={salvarSenha}>
                    <Text style={styles.btnText}>Confirmar</Text>
                  </TouchableOpacity>
                </View>
                <View style={{ height: 20 }} />
              </ScrollView>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 40,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    alignItems: 'center'
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%'
  },
  profileContent: {
    alignItems: 'center',
    marginTop: 20
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: '#fff'
  },
  editIcon: {
    position: 'absolute',
    bottom: 62,
    right: -2,
    backgroundColor: '#377ACF',
    width: 25,
    height: 25,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff'
  },
  loadingCircle: {
    position: 'absolute',
    top: -7,
    left: -4,
    width: 98,
    height: 98,
    borderRadius: 49,
    borderWidth: 2,
    borderColor: '#377ACF50',
    borderTopColor: '#377ACF'
  },
  nome: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 10
  },
  setor: {
    color: '#ddd',
    fontSize: 14
  },
  setorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4
  },
  setorIcon: {
    width: 16,
    height: 16,
    marginRight: 6
  },
  options: {
    marginTop: 20,
    paddingHorizontal: 20,
    gap: 10
  },
  option: {
    backgroundColor: '#f6f6f6',
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  optionText: {
    flex: 1,
    marginLeft: 10,
    color: '#3C188F',
    fontSize: 14
  },
  logout: {
    backgroundColor: '#eee'
  },
  logoutText: {
    color: '#3C188F',
    fontWeight: 'bold'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '80%'
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  cancelButton: {
    padding: 10
  },
  saveButton: {
    padding: 10,
    backgroundColor: '#3C188F',
    borderRadius: 8
  },
  inputWrapper: {
    marginBottom: 16,
    position: 'relative'
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
