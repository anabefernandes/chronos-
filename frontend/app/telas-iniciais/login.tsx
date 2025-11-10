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
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard
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

      setUserId(userId);
      setRole(role);
      setNome(nome);
      setFoto(foto);
      setSetor(setor);

      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('userId', userId);
      await AsyncStorage.setItem('role', role);
      await AsyncStorage.setItem('nome', nome);
      await AsyncStorage.setItem('foto', foto);
      await AsyncStorage.setItem('setor', setor);

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
                    multiline={false}
                    scrollEnabled={false}
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
                    secureTextEntry
                    multiline={false}
                    scrollEnabled={false}
                  />
                </View>

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
  infoContainer: {
    width: '90%',
    alignSelf: 'center',
    alignItems: 'flex-end',
    marginBottom: 10
  },
  infoText: {
    color: '#6E6E8F',
    fontSize: 13,
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
