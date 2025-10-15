import { View, Text, StyleSheet } from 'react-native';

export default function Notificacoes() {
  return (
    <View style={styles.container}>
      <Text>Minhas Notificações</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff', 
    padding: 20
  }
});
