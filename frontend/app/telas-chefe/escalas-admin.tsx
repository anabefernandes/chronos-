import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Text,
  Image,
  Alert // <--- IMPORTANTE: Adicionado Alert
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import Navbar from '../../components/public/Navbar';
import { listarTodasEscalas, minhasEscalas, getUserRole, excluirEscala } from '../../services/userService';
import CardDiaSelecionado from '../../components/admin/CardDiaSelecionado';
import ListaSemanal from '../../components/admin/ListaSemanal';
import { AuthContext } from '../../contexts/AuthContext';

export default function EscalasAdmin() {
  const { userId } = useContext(AuthContext);

  const [escalas, setEscalas] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(null);

  const [filtro, setFiltro] = useState<'todas' | 'minhas'>('todas');
  const [search, setSearch] = useState('');

  useEffect(() => {
    carregarEscalas();
  }, []);

  const formatarDataLocal = (data: string | Date) => {
    const d = new Date(data);
    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  };

  const getUserImage = (foto?: string) => {
    if (!foto || foto.trim() === '') return require('../../assets/images/telas-public/sem_foto.png');
    if (foto.includes('sem_foto.png')) return require('../../assets/images/telas-public/sem_foto.png');
    let baseURL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
    if (baseURL?.endsWith('/api')) baseURL = baseURL.replace(/\/api$/, '');
    const cleanFoto = foto.replace(/^\/+/, '');
    return { uri: `${baseURL}/${cleanFoto}` };
  };

  const carregarEscalas = async () => {
    try {
      setCarregando(true); // Garante loading ao recarregar
      const userRole = await getUserRole();
      setRole(userRole);

      const data = userRole === 'admin' || userRole === 'chefe' ? await listarTodasEscalas() : await minhasEscalas();

      const escalasCompletas = data.map((e: any) => ({
        ...e,
        funcionario: {
          nome: e.funcionario?.nome || 'Funcionário',
          foto: e.funcionario?.foto || 'sem_foto.png',
          setor: e.funcionario?.setor || 'Sem setor',
          role: e.funcionario?.role || 'funcionario',
          _id: e.funcionario?._id || ''
        }
      }));

      setEscalas(escalasCompletas);
    } catch (err) {
      console.error('Erro ao carregar escalas:', err);
    } finally {
      setCarregando(false);
    }
  };

  // ✅ NOVA FUNÇÃO: Lógica para excluir a semana inteira
const handleExcluirSemana = (escalaSemana: any) => {
    
  // 💡 1. EXTRAIA O ID DO DOCUMENTO SEMANAL
  const idDaEscalaSemanal = escalaSemana._id; 

  if (!idDaEscalaSemanal) {
      Alert.alert("Erro", "ID da escala semanal não encontrado. Impossível excluir.");
      console.error("ID da Escala Semanal faltando:", escalaSemana);
      return;
  }
  
  Alert.alert(
    "Excluir Escala Semanal",
    "Tem certeza que deseja excluir todas as escalas desta semana para este funcionário?",
    [
      { text: "Cancelar", style: "cancel" },
      { 
        text: "Excluir", 
        style: "destructive", 
        onPress: async () => {
          try {
            // 💡 2. CHAME A FUNÇÃO DE EXCLUSÃO APENAS UMA VEZ COM O ID SEMANAL
            // O Backend (exports.excluirEscala) vai deletar o documento inteiro.
            await excluirEscala(idDaEscalaSemanal);

            Alert.alert("Sucesso", "Escala semanal excluída com sucesso!");
            
            // Recarrega a lista para sumir o card da tela
            carregarEscalas(); 
          } catch (error) {
            console.error("Erro ao excluir semana", error);
            // Se o 404 persistir, pode ser que o ID não tenha sido encontrado, mas 
            // como você quer a semana excluída, pode tratar como sucesso após o log.
            Alert.alert("Erro", "Não foi possível excluir a semana.");
          }
        }
      }
    ]
  );
};

  const filtrarEscalas = () => {
    return escalas
      .filter(e => filtro === 'todas' || e.funcionario._id === userId)
      .filter(
        e =>
          e.funcionario.nome.toLowerCase().includes(search.toLowerCase()) ||
          (e.funcionario.setor || '').toLowerCase().includes(search.toLowerCase())
      );
  };

  const getMarcadosFiltrados = () => {
    const filtradas = filtrarEscalas();
    const marks: any = {};

    const diasPorData: Record<string, { trabalho: boolean; folga: boolean }> = {};

    filtradas.forEach((escala: any) => {
      escala.dias.forEach((dia: any) => {
        const dateStr = formatarDataLocal(dia.data);
        if (!diasPorData[dateStr]) diasPorData[dateStr] = { trabalho: false, folga: false };
        if (dia.folga) diasPorData[dateStr].folga = true;
        else diasPorData[dateStr].trabalho = true;
      });
    });

    Object.keys(diasPorData).forEach(dateStr => {
      const { trabalho, folga } = diasPorData[dateStr];
      const dots = [];
      if (trabalho) dots.push({ key: 'trabalho', color: '#7B1FA2' });
      if (folga) dots.push({ key: 'folga', color: '#2196F3' });

      marks[dateStr] = { dots, marked: dots.length > 0 };
    });

    if (diaSelecionado) {
      marks[diaSelecionado] = {
        dots: marks[diaSelecionado]?.dots || [],
        selected: true,
        selectedColor: '#423b51ff'
      };
    }

    return marks;
  };

  if (carregando) {
    return (
      <View style={styles.loadingContainer}>
        <Navbar />
        <View style={styles.loaderWrapper}>
          <ActivityIndicator size="large" color="#4A90E2" />
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
      <Navbar />
      <Text style={styles.title}>Gerenciar Escalas</Text>

      {/* Pesquisa e filtro */}
      <View style={styles.filterSearchRow}>
        <View style={styles.searchWrapper}>
          <Image source={require('../../assets/images/telas-admin/icone_lupa.png')} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Pesquisar..."
            placeholderTextColor="#777"
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <TouchableOpacity
          style={styles.filterWrapper}
          onPress={() => setFiltro(filtro === 'todas' ? 'minhas' : 'todas')}
          activeOpacity={0.8}
        >
          <Text style={styles.inputLabel}>Filtrar</Text>
          <Text style={styles.inputFiltro}>{filtro === 'todas' ? 'Todas as escalas' : 'Minhas escalas'}</Text>
        </TouchableOpacity>
      </View>

      {/* Calendário */}
      <View style={styles.calendarWrapper}>
        <Calendar
          markingType="multi-dot"
          markedDates={getMarcadosFiltrados()}
          onDayPress={day => setDiaSelecionado(day.dateString)}
          theme={{
            todayTextColor: '#6b1391ff',
            arrowColor: '#4A90E2',
            monthTextColor: '#1B0A43',
            textMonthFontWeight: 'bold',
            calendarBackground: '#e6f0ff',
            textSectionTitleColor: '#1B0A43',
            dayTextColor: '#000',
            textDisabledColor: '#747474ff'
          }}
        />
      </View>

      {/* Card do dia selecionado */}
      {diaSelecionado && (
        <CardDiaSelecionado
          diaSelecionado={diaSelecionado}
          escalas={filtrarEscalas()}
          onClose={() => setDiaSelecionado(null)}
        />
      )}

      {/* ✅ AQUI: Passei a função onDelete para o componente filho */}
      <ListaSemanal 
        escalas={filtrarEscalas()} 
        role={role} 
        onDelete={handleExcluirSemana} 
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  calendarWrapper: {
    margin: 15,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    backgroundColor: '#91cbd3',
    borderWidth: 1,
    borderColor: '#cadbe5ff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6
  },
  filterSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 18,
    paddingHorizontal: 12
  },
  searchWrapper: {
    flex: 0.58,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3C188F',
    borderRadius: 28,
    height: 45,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    marginRight: 10
  },
  searchIcon: {
    width: 18,
    height: 18,
    marginRight: 6
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#000'
  },
  filterWrapper: {
    flex: 0.4,
    height: 45,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#3C188F',
    borderRadius: 28,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    marginLeft: 0
  },
  inputFiltro: {
    fontSize: 14,
    color: '#000',
    textAlign: 'center',
    lineHeight: 45
  },
  inputLabel: {
    position: 'absolute',
    top: -8,
    left: 16,
    backgroundColor: '#fff',
    paddingHorizontal: 5,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: '#1B0A43',
    zIndex: 1
  },
  title: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#3C188F',
    marginLeft: 15,
    marginTop: 15
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#fff'
  },
  loaderWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  }
});