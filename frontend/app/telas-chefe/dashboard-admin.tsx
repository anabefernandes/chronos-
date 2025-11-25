import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import Navbar from '../../components/public/Navbar';
import DashboardCarousel from '../../components/admin/DashboardCarrossel';
import FuncionarioCardSelect from '../../components/admin/FuncionarioCardSelect';
import { Funcionario } from '../../components/admin/FuncionarioCard';
import api from '../../services/api';
import LottieView from 'lottie-react-native';

interface DashboardProps {
  setActiveScreen: (screen: string) => void;
}

export default function Dashboard({ setActiveScreen }: DashboardProps) {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [showFiltroModal, setShowFiltroModal] = useState(false);
  const [filtro, setFiltro] = useState<'todos' | 'Ativo' | 'Almoço' | 'Atraso' | 'Folga' | 'Inativo'>('todos');

  const opcoesStatus = [
    { label: 'Todos', value: 'todos' },
    { label: 'Ativo', value: 'Ativo' },
    { label: 'Almoço', value: 'Almoço' },
    { label: 'Atraso', value: 'Atraso' },
    { label: 'Folga', value: 'Folga' },
    { label: 'Inativo', value: 'Inativo' }
  ];

  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const resFuncionarios = await api.get('/user/listarFuncionarios');
        const funcionarios = resFuncionarios.data;

        const resChefes = await api.get('/user/listarChefe');
        const chefes = resChefes.data;

        const usuariosFiltrados: Funcionario[] = [...funcionarios, ...chefes].map((u: any) => ({
          id: u._id,
          _id: u._id,
          nome: u.nome,
          email: u.email,
          role: u.role as 'funcionario' | 'chefe',
          cargo: u.cargo,
          foto: u.foto,
          status: u.status as 'Ativo' | 'Atraso' | 'Almoço' | 'Inativo' | 'Folga',
          horario: u.horario,
          observacao: u.observacao,
          tarefas: u.tarefas,
          escala: u.escala,
          setor: u.setor,
        }));

        setFuncionarios(usuariosFiltrados);
      } catch (err) {
        console.error('Erro ao buscar usuários:', err);
      }
    };

    fetchUsuarios();
  }, []);

  const filteredFuncionariosComFiltro =
    filtro === 'todos' ? funcionarios : funcionarios.filter(f => f.status === filtro);

  // Contagem de status
  const total = funcionarios.length;
  const ativos = funcionarios.filter(f => f.status === 'Ativo').length;
  const almoco = funcionarios.filter(f => f.status === 'Almoço').length;
  const atrasos = funcionarios.filter(f => f.status === 'Atraso').length;
  const folgas = funcionarios.filter(f => f.status === 'Folga').length;
  const inativo = funcionarios.filter(f => f.status === 'Inativo').length;

  // Ícones
  const iconTotal = require('../../assets/images/telas-admin/icone_total.png');
  const iconAtivos = require('../../assets/images/telas-admin/icone_ativo.png');
  const iconAtrasos = require('../../assets/images/telas-admin/icone_atraso.png');
  const iconFolgas = require('../../assets/images/telas-admin/icone_folga.png');
  const iconAlmoco = require('../../assets/images/telas-admin/icone_almoco.png');
  const iconInativo = require('../../assets/images/telas-admin/icone_inativo.png');

  const registros = [
    { label: 'Total', count: total, color: '#D9D4F3', icon: iconTotal },
    { label: 'Ativos', count: ativos, color: '#C1E1C1', icon: iconAtivos },
    { label: 'Atrasos', count: atrasos, color: '#F4C7C3', icon: iconAtrasos },
    { label: 'Folgas', count: folgas, color: '#B9D7F0', icon: iconFolgas },
    { label: 'Almoço', count: almoco, color: '#FFD580', icon: iconAlmoco },
    { label: 'Inativo', count: inativo, color: '#BDBDBD', icon: iconInativo }
  ];

  return (
    <ScrollView style={styles.container}>
      <Navbar />
      <View style={styles.content}>
        <Text style={styles.title}>Dashboard</Text>
        <DashboardCarousel setActiveScreen={setActiveScreen} />

        <Text style={styles.titleEquipe}>Registros da Equipe</Text>
        <View style={styles.registrosContainer}>
          {registros.map((r, index) => (
            <View key={index} style={[styles.registroBox, { backgroundColor: r.color }]}>
              <Image source={r.icon} style={styles.registroIcon} />
              <Text style={styles.registroLabel}>{r.label}</Text>
              <Text style={styles.registroCount}>{r.count}</Text>
            </View>
          ))}
        </View>

        {/* Filtro de status */}
        <View style={styles.statusHeader}>
          <Text style={styles.titleStatusEquipe}>Status da Equipe</Text>
          <TouchableOpacity
            style={styles.filterWrapper}
            onPress={() => setShowFiltroModal(prev => !prev)}
            activeOpacity={0.8}
          >
            <Text style={styles.inputLabel}>Filtrar</Text>
            <Text style={styles.inputFiltro}>{filtro === 'todos' ? 'Todos os status' : filtro}</Text>
          </TouchableOpacity>
        </View>

        {showFiltroModal && (
          <View style={styles.modalFiltroOverlay}>
            <View style={styles.modalFiltro}>
              {opcoesStatus.map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  style={styles.modalOption}
                  onPress={() => {
                    setFiltro(opt.value as any);
                    setShowFiltroModal(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Lista de funcionários filtrados ou Lottie */}
        <View style={styles.funcionariosContainer}>
          {filteredFuncionariosComFiltro.length > 0 ? (
            filteredFuncionariosComFiltro.map(f => (
              <View key={f.id} style={{ width: '95%' }}>
                <FuncionarioCardSelect funcionario={f} onSelect={() => {}} />
              </View>
            ))
          ) : (
            <View style={styles.semDadosContainer}>
              <LottieView
                source={require('../../assets/lottie/sem_dados.json')}
                autoPlay
                loop
                style={{ width: 200, height: 200 }}
              />
              <Text style={{ fontSize: 16, color: '#555', marginTop: 12 }}>Nenhum funcionário encontrado</Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
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
    marginBottom: 16,
    color: '#3C188F'
  },
  titleEquipe: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    marginTop: 10,
    color: '#3C188F'
  },
  titleStatusEquipe: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#3C188F'
  },
  registrosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '90%',
    marginBottom: 16
  },
  registroBox: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  registroIcon: {
    width: 50,
    height: 50,
    marginBottom: 6
  },
  registroLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4
  },
  registroCount: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 0,
    textAlign: 'center'
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '90%',
    marginBottom: 12,
    position: 'relative'
  },
  filterWrapper: {
    width: 150,
    height: 45,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#3C188F',
    borderRadius: 28,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    zIndex: 1
  },
  inputLabel: {
    position: 'absolute',
    top: -8,
    left: 16,
    backgroundColor: '#fff',
    paddingHorizontal: 5,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: '#1B0A43'
  },
  inputFiltro: {
    fontSize: 14,
    color: '#000',
    textAlign: 'center',
    lineHeight: 45
  },
  modalFiltroOverlay: {
    position: 'absolute',
    top: 620,
    right: 22,
    width: 150,
    zIndex: 1000
  },
  modalFiltro: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 10
  },
  modalOption: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE'
  },
  modalOptionText: {
    fontSize: 14,
    color: '#1B0A43',
    textAlign: 'center'
  },
  funcionariosContainer: {
    width: '100%',
    minHeight: 300,
    alignItems: 'center',
    paddingBottom: 20,
    flexGrow: 1
  },
  semDadosContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 40
  }
});
