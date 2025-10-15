import { View, Text, StyleSheet } from 'react-native';
import Navbar from '../../components/public/Navbar';

export default function Escalas() {
  return (
    <View style={styles.container}>
      <Navbar />
      <View style={styles.content}>
        <Text style={styles.text}>📅 Tela de Escalas</Text>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold'
  }
});
