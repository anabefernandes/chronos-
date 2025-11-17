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
import { useFonts, Poppins_400Regular, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import React, { useState } from 'react';
import EllipseHeader from '../../components/public/LogoHeader';
import Footer from '../../components/public/FrasesFooter';
import { useRouter } from 'expo-router';
import api from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import LottieView from 'lottie-react-native';

export default function RedefinirEmail() {
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState(false); // <- controla se o bloco aparece

  const router = useRouter();
  const { showToast } = useToast();

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold
  });

  if (!fontsLoaded) return null;

  const handleEnviar = async () => {
    if (!email) {
      showToast('Informe seu email.', 'error');
      return;
    }

    try {
      await api.post('/user/solicitar_redefinicao', { email });
      showToast('Token enviado para seu email!', 'success');

      setSuccess(true); // <- ativa o bloco com Lottie + botão
    } catch (err: any) {
      showToast('Erro ao solicitar redefinição.', 'error');
      console.log(err.response?.data || err);
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
                  <Text style={styles.title}>Redefinir Senha</Text>
                  <Image
                    source={require('../../assets/images/telas-public/icone_boasvindas.png')}
                    style={styles.titleIcon}
                  />
                </View>

                <Text style={styles.subtitle}>
                  Para receber o token de redefinição, digite seu email no campo abaixo:
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
                    keyboardType="email-address"
                  />
                </View>

                <TouchableOpacity style={styles.button} onPress={handleEnviar}>
                  <Text style={styles.buttonText}>Enviar Token</Text>
                </TouchableOpacity>

                {success && (
                  <View style={styles.successContainer}>
                    <LottieView
                      source={require('../../assets/lottie/email_enviado.json')}
                      autoPlay
                      loop={false}
                      style={{ width: 150, height: 150 }}
                    />

                    <Text style={styles.successText}>Token enviado! Confira seu email.</Text>

                    <TouchableOpacity
                      style={styles.successButton}
                      onPress={() => router.push('/telas-iniciais/redefinir-token')}
                    >
                      <Text style={styles.successButtonText}>Inserir Token</Text>
                    </TouchableOpacity>
                  </View>
                )}
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
    marginBottom: 20
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
    marginBottom: 30,
    marginLeft: 22,
    color: '#1B0A43',
    fontFamily: 'Poppins_400Regular',
    padding: 3
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
    width: '90%',
    alignSelf: 'center',
    marginTop: 10
  },
  buttonText: {
    color: '#fff',
    fontSize: 19,
    fontFamily: 'Poppins_600SemiBold'
  },
  successContainer: {
    alignItems: 'center',
    marginTop: 20
  },
  successText: {
    fontSize: 18,
    color: '#1B0A43',
    textAlign: 'center',
    marginTop: -10,
    marginBottom: 20,
    fontFamily: 'Poppins_600SemiBold'
  },
  successButton: {
    backgroundColor: '#3C188F',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25
  },
  successButtonText: {
    color: '#fff',
    fontSize: 17,
    fontFamily: 'Poppins_600SemiBold'
  }
});
