import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  Alert
} from 'react-native';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import AsyncStorage from '@react-native-async-storage/async-storage';
import EllipseHeader from '../../components/public/LogoHeader';
import Footer from '../../components/public/FrasesFooter';
import { AuthContext } from '../../contexts/AuthContext';
import React, { useState, useContext } from 'react';
import { useRouter } from 'expo-router';
import api from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const { setUserId, setNome, setRole, setFoto, setSetor } = useContext(AuthContext);
  const router = useRouter();
  const { showToast } = useToast();
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold
  });

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: '#fff' }} />;

  const handleLogin = async () => {
    try {
      const res = await api.post('/auth/login', { email, senha });
      const token = res.data.token;
      const user = res.data.user;

      if (!token || !user?.id || !user?.role) {
        showToast('Resposta inválida do servidor.', 'error');
        return;
      }

      const { id: userId, nome, role: roleBackend, setor, foto } = user;
      const role = roleBackend.toLowerCase();

      // Atualiza o AuthContext
      setUserId(userId);
      setNome(nome || 'NOVO USUÁRIO');
      setRole(role);
      setFoto(foto || '');
      setSetor(setor || 'Setor não informado');

      // Salva no AsyncStorage
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('userId', String(userId));
      await AsyncStorage.setItem('role', role);
      await AsyncStorage.setItem('nome', nome || 'NOVO USUÁRIO');
      await AsyncStorage.setItem('foto', foto || '');
      await AsyncStorage.setItem('setor', setor || 'Setor não informado');
      await AsyncStorage.setItem('userEmail', email); // <-- salvar email

      // Redireciona conforme papel do usuário
      if (role === 'chefe' || role === 'admin') {
        router.replace('/telas-chefe/painel-admin');
      } else {
        router.replace('/telas-iniciais/painel');
      }
    } catch (err: any) {
      showToast('Falha no login. Verifique seu email e senha.', 'error');
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={{ flex: 1, backgroundColor: '#fff' }}
        >
          <View style={styles.container}>
            <EllipseHeader />

            <View style={styles.content}>
              <View style={styles.form}>
                <View style={styles.titleContainer}>
                  <Text style={styles.title}>Bem-vindo de volta</Text>
                  <Image
                    source={require('../../assets/images/telas-public/icone_boasvindas.png')}
                    style={styles.titleIcon}
                  />
                </View>

                <Text style={styles.subtitle}>Coloque suas credenciais para continuar</Text>

                {/* Campos */}
                <View style={styles.inputContainer}>
                  <Image source={require('../../assets/images/iniciais/icone_email.png')} style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="#1E1E1E"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Image source={require('../../assets/images/iniciais/icone_codigo.png')} style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Senha"
                    placeholderTextColor="#1E1E1E"
                    value={senha}
                    onChangeText={setSenha}
                    secureTextEntry={!mostrarSenha} // alterna a visibilidade
                  />
                  <TouchableOpacity onPress={() => setMostrarSenha(!mostrarSenha)}>
                    <Image
                      source={
                        mostrarSenha
                          ? require('../../assets/images/telas-admin/icone_olho-aberto.png')
                          : require('../../assets/images/telas-admin/icone_olho-fechado.png')
                      }
                      style={{ width: 22, height: 22, marginLeft: 10, tintColor: '#1E1E1E' }}
                    />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity onPress={() => router.push('/telas-iniciais/redefinir-email')}>
                  <Text style={styles.forgotPassword}>Esqueci a senha</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.button} onPress={handleLogin}>
                  <Text style={styles.buttonText}>Entrar</Text>
                </TouchableOpacity>
              </View>

              <Footer />
            </View>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  content: {
    flex: 1,
    justifyContent: 'space-between'
  },
  form: {
    padding: 20,
    marginTop: -50
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
    marginBottom: 22
  },
  title: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#3C188F',
    fontFamily: 'Poppins_600SemiBold',
    marginRight: 5
  },
  titleIcon: {
    width: 30,
    height: 30,
    resizeMode: 'contain'
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 40,
    color: '#1B0A43',
    fontFamily: 'Poppins_400Regular',
    top: -15
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#1B0A43',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 5,
    marginBottom: 22,
    width: '90%',
    alignSelf: 'center'
  },
  icon: {
    width: 22,
    height: 22,
    marginRight: 10
  },
  input: {
    flex: 1,
    height: 40,
    color: '#1B0A43',
    fontFamily: 'Poppins_400Regular',
    fontSize: 18,
    paddingVertical: 0,
    textAlignVertical: 'center'
  },
  button: {
    backgroundColor: '#3C188F',
    padding: 12,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 10,
    width: '90%',
    alignSelf: 'center',
    marginBottom: 20
  },
  buttonText: {
    color: '#fff',
    fontSize: 19,
    fontWeight: 'bold',
    fontFamily: 'Poppins_600SemiBold'
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginRight: 25,
    marginTop: -10,
    marginBottom: 20,
    color: '#3C188F',
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    textDecorationLine: 'underline'
  }
});
