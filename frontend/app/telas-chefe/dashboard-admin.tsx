import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Navbar from '../../components/public/Navbar';
import DashboardCarousel from '../../components/admin/DashboardCarrossel';

interface DashboardProps {
  setActiveScreen: (screen: string) => void;
}

export default function Dashboard({ setActiveScreen }: DashboardProps) {
  return (
    <View style={styles.container}>
      <Navbar />
      <View style={styles.content}>
        <Text style={styles.title}>Dashboard</Text>
        <DashboardCarousel setActiveScreen={setActiveScreen} />
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
    width: '100%',
    paddingTop: 20,
    alignItems: 'center'
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20
  }
});
