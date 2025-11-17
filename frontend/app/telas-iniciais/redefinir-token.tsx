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
  Keyboard
} from 'react-native';
import React, { useState } from 'react';
import EllipseHeader from '../../components/public/LogoHeader';
import Footer from '../../components/public/FrasesFooter';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import { useRouter } from 'expo-router';
import api from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

export default function RedefinirToken() {
  const [token, setToken] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const router = useRouter();
  const { showToast } = useToast();

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold
  });

  if (!fontsLoaded) return null;

  const handleRedefinir = async () => {
    if (!token || !novaSenha || !confirmarSenha) {
      showToast('Preencha todos os campos.', 'error');
      return;
    }

    if (token.length !== 8) {
      showToast('O token deve ter 8 dígitos.', 'error');
      return;
    }

    if (novaSenha !== confirmarSenha) {
      showToast('As senhas não coincidem.', 'error');
      return;
    }

    try {
      await api.post('/user/redefinir_senha', { token, novaSenha });

      showToast('Senha redefinida com sucesso!', 'success');
      router.replace('/telas-iniciais/login');
    } catch (err: any) {
      console.log(err.response?.data || err);
      showToast(err.response?.data?.mensagem || 'Erro ao redefinir senha.', 'error');
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          style={{ backgroundColor: '#fff' }}
        >
          <View style={styles.container}>
            <EllipseHeader />

            <View style={styles.content}>
              <View style={styles.form}>
                <View style={styles.titleContainer}>
                  <Text style={styles.title}>Inserir Token</Text>
                  <Image
                    source={require('../../assets/images/telas-public/icone_boasvindas.png')}
                    style={styles.titleIcon}
                  />
                </View>

                <Text style={styles.subtitle}>Digite o token enviado para seu email</Text>

                <View style={styles.inputContainer}>
                  <Image source={require('../../assets/images/iniciais/icone_token.png')} style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Token"
                    value={token}
                    onChangeText={setToken}
                    maxLength={8}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Image source={require('../../assets/images/iniciais/icone_codigo.png')} style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Nova senha"
                    placeholderTextColor="#1E1E1E"
                    secureTextEntry
                    value={novaSenha}
                    onChangeText={setNovaSenha}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Image source={require('../../assets/images/iniciais/icone_codigo.png')} style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Confirmar nova senha"
                    placeholderTextColor="#1E1E1E"
                    secureTextEntry
                    value={confirmarSenha}
                    onChangeText={setConfirmarSenha}
                  />
                </View>

                <TouchableOpacity style={styles.button} onPress={handleRedefinir}>
                  <Text style={styles.buttonText}>Redefinir Senha</Text>
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
    marginTop: -60
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 90,
    marginBottom: 22
  },
  title: {
    fontSize: 25,
    fontFamily: 'Poppins_600SemiBold',
    color: '#3C188F',
    marginRight: 5
  },
  titleIcon: {
    width: 30,
    height: 30,
    resizeMode: 'contain'
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 30,
    color: '#1B0A43',
    fontFamily: 'Poppins_400Regular'
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
    fontSize: 18
  },
  button: {
    backgroundColor: '#3C188F',
    padding: 12,
    borderRadius: 25,
    alignItems: 'center',
    width: '90%',
    alignSelf: 'center',
    marginTop: 10
  },
  buttonText: {
    color: '#fff',
    fontSize: 19,
    fontFamily: 'Poppins_600SemiBold'
  }
});
