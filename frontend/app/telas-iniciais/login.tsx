import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView
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
  const { setRole, setNome, setUserId, setFoto, setSetor } = useContext(AuthContext);
  const router = useRouter();
  const { showToast } = useToast();

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold
  });

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: '#fff' }} />;

  const handleLogin = async () => {
    try {
      const res = await api.post('/auth/login', { email, senha });
      const token = res.data.token;
      const roleBackend = res.data.user?.role;
      const nome = res.data.user?.nome || 'NOVO USUÁRIO';
      const userId = res.data.user?.id;
      const setor = res.data.user?.setor || 'Setor não informado';
      const foto = res.data.user?.foto ?? '';

      if (!token || !roleBackend || !userId) {
        Alert.alert('Erro', 'Resposta inválida do servidor.');
        console.log('Resposta inválida do backend:', res.data);
        return;
      }

      const role = roleBackend.toLowerCase();

      // Atualiza contexto
      setUserId(userId);
      setRole(role);
      setNome(nome);
      setFoto(foto);
      setSetor(setor);

      // Salva no AsyncStorage
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('userId', userId);
      await AsyncStorage.setItem('role', role);
      await AsyncStorage.setItem('nome', nome);
      await AsyncStorage.setItem('foto', foto);
      await AsyncStorage.setItem('setor', setor);

      // Redireciona
      if (role === 'chefe' || role === 'admin') {
        router.replace('/telas-chefe/painel-admin');
      } else {
        router.replace('/telas-iniciais/painel');
      }
    } catch (err: any) {
      console.error('Erro ao tentar logar:', err.response?.data || err.message);
      showToast('Erro', err.response?.data?.msg || 'Falha no login. Verifique seu email e senha.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#fff' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.container}>
          <EllipseHeader />

          <View style={styles.content}>
            <View style={styles.form}>
              <Text style={styles.title}>Login</Text>
              <Text style={styles.subtitle}>
                Não tem conta?{' '}
                <Text style={styles.link} onPress={() => router.push('/cadastro')}>
                  Cadastre-se
                </Text>
              </Text>

              <View style={styles.inputContainer}>
                <Image source={require('../../assets/images/iniciais/icone_email.png')} style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#1E1E1E"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
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
                  secureTextEntry
                />
              </View>

              <TouchableOpacity style={styles.forgotContainer} onPress={() => router.push('/recuperar-senha')}>
                <Text style={styles.forgotText}>Esqueci a senha</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.button} onPress={handleLogin}>
                <Text style={styles.buttonText}>Entrar</Text>
              </TouchableOpacity>
            </View>

            <Footer />
          </View>
        </View>
      </ScrollView>
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
    marginTop: -60
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#3C188F',
    marginBottom: 5,
    marginTop: 100,
    fontFamily: 'Poppins_600SemiBold'
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 35,
    color: '#1B0A43',
    fontFamily: 'Poppins_400Regular'
  },
  link: {
    color: '#3C188F',
    fontFamily: 'Poppins_600SemiBold'
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#1B0A43',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 5,
    marginBottom: 20,
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
    color: '#000',
    fontFamily: 'Poppins_400Regular',
    fontSize: 18
  },
  forgotContainer: {
    width: '90%',
    alignSelf: 'center',
    alignItems: 'flex-end',
    marginBottom: 10
  },
  forgotText: {
    color: '#1B0A43',
    fontWeight: '500',
    fontFamily: 'Poppins_400Regular'
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
  }
});
