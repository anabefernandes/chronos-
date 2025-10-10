import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Modal, TouchableWithoutFeedback, Image } from 'react-native';

export interface Categoria {
  nome: string;
  cor: string;
  icone: string;
}

interface CategoriaSelectorProps {
  categorias: Categoria[];
  categoriasSelecionadas: Categoria[];
  setCategorias: React.Dispatch<React.SetStateAction<Categoria[]>>;
  setCategoriasSelecionadas: React.Dispatch<React.SetStateAction<Categoria[]>>;
}

const CategoriaSelector: React.FC<CategoriaSelectorProps> = ({
  categorias,
  categoriasSelecionadas,
  setCategorias,
  setCategoriasSelecionadas
}) => {
  const [showAddCategoria, setShowAddCategoria] = useState(false);
  const [novaCategoriaNome, setNovaCategoriaNome] = useState('');
  const [novaCategoriaCor, setNovaCategoriaCor] = useState('#3C188F');
  const [novaCategoriaIcone, setNovaCategoriaIcone] = useState('⭐');

  const categoriasIniciais: Categoria[] = [
    { nome: 'Antibiótico', cor: '#FF9F1C', icone: '💊' },
    { nome: 'Curativos', cor: '#FF6B6B', icone: '🩹' },
    { nome: 'Soro', cor: '#4ECDC4', icone: '💧' },
    { nome: 'Alta', cor: '#FFD93D', icone: '🏥' }
  ];

  useEffect(() => {
    const carregarCategorias = async () => {
      try {
        const salvas = await AsyncStorage.getItem('@categorias');
        if (salvas) {
          setCategorias(JSON.parse(salvas));
        } else {
          setCategorias(categoriasIniciais);
        }
      } catch (err) {
        console.error('Erro ao carregar categorias:', err);
      }
    };
    carregarCategorias();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('@categorias', JSON.stringify(categorias));
  }, [categorias]);

  const coresDisponiveis = ['#FF6B6B', '#4ECDC4', '#FFD93D', '#FF9F1C', '#6A4C93', '#1982C4', '#36b05fff'];

  const toggleCategoria = (categoria: Categoria) => {
    setCategoriasSelecionadas(prev =>
      prev.find(c => c.nome === categoria.nome) ? prev.filter(c => c.nome !== categoria.nome) : [...prev, categoria]
    );
  };

  const handleAddCategoria = () => {
    if (!novaCategoriaNome) return;

    const novaCat: Categoria = {
      nome: novaCategoriaNome,
      cor: novaCategoriaCor,
      icone: novaCategoriaIcone
    };

    setCategorias(prev => [...prev, novaCat]);
    setCategoriasSelecionadas(prev => [...prev, novaCat]);

    setNovaCategoriaNome('');
    setNovaCategoriaCor('#3C188F');
    setNovaCategoriaIcone('⭐');
    setShowAddCategoria(false);
  };

  const excluirCategoria = (nome: string) => {
    setCategorias(prev => prev.filter(c => c.nome !== nome));
    setCategoriasSelecionadas(prev => prev.filter(c => c.nome !== nome));
  };

  return (
    <View>
      <Text style={styles.sectionTitle}>Selecione a categoria:</Text>

      <View style={styles.gridCategorias}>
        {categorias.map(cat => {
          const selecionada = categoriasSelecionadas.find(c => c.nome === cat.nome);
          return (
            <View key={cat.nome} style={{ position: 'relative' }}>
              <TouchableOpacity
                style={[styles.tag, selecionada && { backgroundColor: cat.cor }]}
                onPress={() => toggleCategoria(cat)}
              >
                <Text style={[styles.tagText, selecionada && { color: '#fff' }]}>
                  {cat.icone} {cat.nome}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => excluirCategoria(cat.nome)} style={styles.btnExcluir}>
                <Ionicons name="close" size={14} color="#f8f5f5ff" />
              </TouchableOpacity>
            </View>
          );
        })}

        <TouchableOpacity style={styles.addTagButton} onPress={() => setShowAddCategoria(true)}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image
              source={require('../../assets/images/dashboard/icone_add.png')}
              style={{ width: 18, height: 18, marginRight: 3 }}
            />
            <Text style={styles.addTagText}>Nova Categoria</Text>
          </View>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showAddCategoria}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddCategoria(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowAddCategoria(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalBox}>
                <Text style={styles.modalTitle}> Nova Categoria</Text>

                {/* Inputs */}
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Título</Text>
                  <TextInput
                    placeholder=""
                    value={novaCategoriaNome}
                    onChangeText={setNovaCategoriaNome}
                    style={styles.input}
                  />
                </View>

                <Text style={{ marginBottom: 4 }}>Cor da categoria</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
                  {coresDisponiveis.map(cor => (
                    <TouchableOpacity
                      key={cor}
                      onPress={() => setNovaCategoriaCor(cor)}
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 15,
                        backgroundColor: cor,
                        marginRight: 8,
                        marginBottom: 8,
                        borderWidth: novaCategoriaCor === cor ? 2 : 0,
                        borderColor: '#000'
                      }}
                    />
                  ))}
                </View>

                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Ícone / Emoji</Text>
                  <TextInput
                    placeholder=""
                    value={novaCategoriaIcone}
                    onChangeText={setNovaCategoriaIcone}
                    style={styles.input}
                  />
                </View>

                {/* Botões lado a lado */}
                <View style={styles.buttonsRow}>
                  <TouchableOpacity style={styles.btnConfirmar} onPress={handleAddCategoria}>
                    <Text style={styles.btnText}>Adicionar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.btnCancelar} onPress={() => setShowAddCategoria(false)}>
                    <Text style={styles.btnCancelarText}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

export default CategoriaSelector;

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins_400Regular',
    color: '#3C188F',
    marginBottom: 12,
    marginLeft: 4
  },
  gridCategorias: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12
  },
  tag: {
    borderWidth: 1.5,
    borderColor: '#3C188F',
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    marginBottom: 14 
  },
  tagText: { 
    color: '#3C188F', 
    fontSize: 14 
  },
  addTagButton: {
    borderWidth: 1.5,
    borderColor: '#3C188F',
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    marginBottom: 14,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row'
  },
  addTagText: { 
    color: '#3C188F', 
    fontSize: 14 
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    width: '92%',
    maxHeight: '80%'
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#3C188F',
    marginBottom: 16,
    textAlign: 'center'
  },
  inputWrapper: { 
    marginBottom: 12, 
    position: 'relative' 
  },
  inputLabel: {
    position: 'absolute',
    top: -8,
    left: 16,
    backgroundColor: '#fff',
    paddingHorizontal: 5,
    fontSize: 12,
    color: '#1B0A43',
    fontWeight: '600',
    zIndex: 1
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#3C188F',
    borderRadius: 28,
    height: 50,
    paddingHorizontal: 16,
    justifyContent: 'center',
    fontSize: 16,
    backgroundColor: '#fff'
  },
  buttonsRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginTop: 8 
  },
  btnConfirmar: {
    backgroundColor: '#3C188F',
    flex: 1,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
    marginRight: 8
  },
  btnCancelar: {
    backgroundColor: '#B0B0B0',
    flex: 1,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
    marginLeft: 8
  },
  btnText: {
    color: '#fff',
    fontWeight: '600'
  },
  btnCancelarText: {
    color: '#fff',
    fontWeight: '600'
  },
  btnExcluir: {
    position: 'absolute',
    top: -9,
    right: -3,
    borderRadius: 10,
    width: 17,
    height: 17,
    backgroundColor: '#a92222ff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10
  }
});
