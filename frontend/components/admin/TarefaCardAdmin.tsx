import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { Categoria } from '../admin/CategoriaSelector';

interface TarefaCardAdminProps {
  titulo: string;
  descricao?: string;
  paciente?: string;
  funcionario?: { nome: string; foto?: string; setor?: string }; //setor
  categorias?: Categoria[];
  dataPrevista?: string;
  concluida?: boolean;
  onEditar?: () => void;
  onDeletar?: () => void;
}

const TarefaCardAdmin: React.FC<TarefaCardAdminProps> = ({
  titulo,
  descricao,
  paciente,
  funcionario,
  categorias,
  dataPrevista,
  concluida = false,
  onEditar,
  onDeletar
}) => {
  return (
    <View style={[styles.card, concluida && styles.cardConcluida]}>
      {/* Topo: Foto + Nome + Setor + Ações */}
      {funcionario && (
        <View style={styles.topContainer}>
          <View style={styles.funcionarioContainer}>
            {funcionario.foto && <Image source={{ uri: funcionario.foto }} style={styles.foto} />}
            <View>
              <Text style={styles.funcionarioNome}>{funcionario.nome}</Text>
              <Text style={styles.funcionarioSetor}>{funcionario.setor || 'Setor: Exemplo'}</Text>
            </View>
          </View>

          {/* Botões de ação no canto oposto */}
          <View style={styles.actionsContainer}>
            {onEditar && (
              <TouchableOpacity onPress={onEditar}>
                <Image source={require('../../assets/images/dashboard/icone_editar.png')} style={styles.actionIcon} />
              </TouchableOpacity>
            )}
            {onDeletar && (
              <TouchableOpacity onPress={onDeletar}>
                <Image source={require('../../assets/images/dashboard/icone_excluir.png')} style={styles.actionIcon} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Conteúdo da tarefa */}
      <Text style={styles.titulo}>{titulo}</Text>
      {descricao && <Text style={styles.descricao}>{descricao}</Text>}
      {paciente && <Text style={styles.paciente}>Paciente: {paciente}</Text>}

      {dataPrevista && (
        <View style={styles.dataContainer}>
          <FontAwesome5 name="calendar-alt" size={14} color="#555" />
          <Text style={styles.dataText}>{new Date(dataPrevista).toLocaleDateString('pt-BR')}</Text>
          <FontAwesome5 name="clock" size={14} color="#555" style={{ marginLeft: 12 }} />
          <Text style={styles.dataText}>
            {new Date(dataPrevista).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      )}

      {/* Categorias */}
      {categorias && categorias.length > 0 && (
        <View style={styles.categoriasContainer}>
          {categorias.map(cat => (
            <View key={cat.nome} style={[styles.tag, { backgroundColor: cat.cor }]}>
              <Text style={styles.tagText}>
                {cat.icone} {cat.nome}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

export default TarefaCardAdmin;

const styles = StyleSheet.create({
  card: {
    borderWidth: 1.5,
    borderColor: '#3C188F',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#F9FAFF'
  },
  cardConcluida: { 
    opacity: 0.6 
  },
  topContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 8 
  },
  funcionarioContainer: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  foto: { 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    marginRight: 8 
  },
  funcionarioNome: { 
    fontSize: 14, 
    fontWeight: '500', 
    color: '#3C188F' 
  },
  funcionarioSetor: { 
    fontSize: 12, 
    color: '#555'
  },
  titulo: { 
    fontSize: 16, 
    fontWeight: '600', 
    marginBottom: 4, 
    color: '#1B0A43' 
  },
  descricao: { 
    fontSize: 14, 
    marginBottom: 4, 
    color: '#222' 
  },
  paciente: { 
    fontSize: 14, 
    marginBottom: 4, 
    color: '#555' 
  },
  dataContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 8 
  },
  dataText: {
     fontSize: 12, 
     color: '#555', 
     marginLeft: 4 
    },
  categoriasContainer: { 
    flexDirection: 'row', 
    marginTop: 8, 
    flexWrap: 'wrap' 
  },
  tag: { 
    borderRadius: 28, 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    marginRight: 6, 
    marginTop: 4 
  },
  tagText: { 
    color: '#fff', 
    fontSize: 12, 
    fontWeight: '600' 
  },
  actionsContainer: { 
    flexDirection: 'row' 
  },
  actionIcon: { 
    width: 24, 
    height: 24, 
    marginLeft: 8 
  }
});
