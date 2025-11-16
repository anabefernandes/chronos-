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
import EllipseHeader from '../../components/public/LogoHeader';
import Footer from '../../components/public/FrasesFooter';
import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import api from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

export default function Redefinicao() {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const router = useRouter();
  const { showToast } = useToast();

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold
  });

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: '#fff' }} />;

  const handleRedefinir = async () => {
    if (!email || !token || !novaSenha || !confirmarSenha) {
      showToast('Preencha todos os campos.', 'error');
      return;
    }

    if (novaSenha !== confirmarSenha) {
      showToast('As senhas não coincidem.', 'error');
      return;
    }

    try {
      await api.post('/user/redefinir_senha', { email, token, novaSenha });
      showToast('Senha redefinida com sucesso!', 'success');
      router.replace('/telas-public/login');
    } catch (err: any) {
      console.error('Erro ao redefinir senha:', err.response?.data || err.message);
      showToast('error', err.response?.data?.msg || 'Falha ao redefinir senha.');
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
                  <Text style={styles.title}>Redefinição de Senha</Text>
                  <Image
                    source={require('../../assets/images/telas-public/icone_boasvindas.png')}
                    style={styles.titleIcon}
                  />
                </View>

                <Text style={styles.subtitle}>Informe um email para receber o token</Text>

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
                <View style={styles.separator} />

                <View style={styles.inputContainer}>
                  <Image source={require('../../assets/images/iniciais/icone_token.png')} style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Token"
                    placeholderTextColor="#1E1E1E"
                    value={token}
                    onChangeText={setToken}
                    multiline={false}
                    scrollEnabled={false}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Image source={require('../../assets/images/iniciais/icone_codigo.png')} style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Nova senha"
                    placeholderTextColor="#1E1E1E"
                    value={novaSenha}
                    onChangeText={setNovaSenha}
                    secureTextEntry
                    multiline={false}
                    scrollEnabled={false}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Image source={require('../../assets/images/iniciais/icone_codigo.png')} style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Confirmar nova senha"
                    placeholderTextColor="#1E1E1E"
                    value={confirmarSenha}
                    onChangeText={setConfirmarSenha}
                    secureTextEntry
                    multiline={false}
                    scrollEnabled={false}
                  />
                </View>

                <TouchableOpacity style={styles.button} onPress={handleRedefinir}>
                  <Text style={styles.buttonText}>Confirmar</Text>
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
    marginTop: -80
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
    marginBottom: 5,
    color: '#1B0A43',
    fontFamily: 'Poppins_400Regular',
    top: -15
  },
  separator: {
    width: '85%',
    alignSelf: 'center',
    height: 1,
    backgroundColor: '#D1C4E9',
    marginVertical: 15,
    marginBottom: 15
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
  }
});
