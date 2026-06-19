import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  Modal, 
  Alert, 
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAppTheme } from '../context/ThemeContext';
import { requestGraphQL } from '../utils/api';
import { CustomInput, CustomButton, CustomCard } from '../components/ThemeComponents';
import { Ionicons } from '@expo/vector-icons';

const GET_PRODUCTS_QUERY = `
  query GetProducts {
    products {
      id
      name
      category
      price
      stock
    }
  }
`;

const CREATE_PRODUCT_MUTATION = `
  mutation CreateProduct($input: ProductInput!) {
    createProduct(input: $input) {
      id
      name
      category
      price
      stock
    }
  }
`;

const UPDATE_PRODUCT_MUTATION = `
  mutation UpdateProduct($id: ID!, $input: ProductInput!) {
    updateProduct(id: $id, input: $input) {
      id
      name
      category
      price
      stock
    }
  }
`;

const DELETE_PRODUCT_MUTATION = `
  mutation DeleteProduct($id: ID!) {
    deleteProduct(id: $id)
  }
`;

export default function ProductsScreen() {
  const { isDarkMode } = useAppTheme();
  
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Estados dos Modais
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); // null significa cadastrando novo
  const [loadingAction, setLoadingAction] = useState(false);

  // Campos do Formulário
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');

  const themeBgColor = isDarkMode ? '#15181c' : '#f1f5f9';
  const themeTextColor = isDarkMode ? '#f8fafc' : '#212121';
  const themeSubTextColor = isDarkMode ? '#94a3b8' : '#64748b';
  const primaryColor = isDarkMode ? '#00b377' : '#008055';
  const themeBorderColor = isDarkMode ? '#30363d' : '#dbe1e8';
  const cardBgColor = isDarkMode ? '#20252b' : '#ffffff';

  const fetchProducts = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const data = await requestGraphQL(GET_PRODUCTS_QUERY, {}, showRefreshIndicator);
      if (data && data.products) {
        setProducts(data.products);
      }
    } catch (err) {
      console.warn('Erro ao carregar produtos:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setName('');
    setCategory('');
    setPrice('');
    setStock('');
    setModalVisible(true);
  };

  const handleOpenEditModal = (product) => {
    setEditingProduct(product);
    setName(product.name);
    setCategory(product.category || '');
    setPrice(product.price.toString());
    setStock(product.stock.toString());
    setModalVisible(true);
  };

  const handleSaveProduct = async () => {
    if (!name.trim() || !category.trim() || !price.trim() || !stock.trim()) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }

    const priceNum = parseFloat(price.replace(',', '.'));
    const stockNum = parseInt(stock, 10);

    if (isNaN(priceNum) || priceNum < 0) {
      Alert.alert('Erro', 'Insira um preço válido maior ou igual a zero.');
      return;
    }
    if (isNaN(stockNum) || stockNum < 0) {
      Alert.alert('Erro', 'Insira um estoque válido maior ou igual a zero.');
      return;
    }

    setLoadingAction(true);
    try {
      const input = {
        name: name.trim(),
        category: category.trim(),
        price: priceNum,
        stock: stockNum
      };

      if (editingProduct) {
        // Modo Edição
        await requestGraphQL(UPDATE_PRODUCT_MUTATION, { 
          id: editingProduct.id, 
          input 
        });
        Alert.alert('Sucesso', 'Produto atualizado com sucesso!');
      } else {
        // Modo Cadastro
        await requestGraphQL(CREATE_PRODUCT_MUTATION, { input });
        Alert.alert('Sucesso', 'Produto criado com sucesso!');
      }

      setModalVisible(false);
      fetchProducts();
    } catch (err) {
      Alert.alert('Erro', err.message || 'Falha ao salvar produto.');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDeleteProduct = (id, productName) => {
    Alert.alert(
      'Remover Produto',
      `Tem certeza que deseja remover o produto "${productName}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await requestGraphQL(DELETE_PRODUCT_MUTATION, { id });
              if (res && res.deleteProduct) {
                Alert.alert('Sucesso', 'Produto removido com sucesso!');
                fetchProducts();
              } else {
                Alert.alert('Aviso', 'O produto não pôde ser excluído.');
              }
            } catch (err) {
              Alert.alert('Erro', err.message || 'Falha ao remover produto.');
            }
          }
        }
      ]
    );
  };

  const formatCurrency = (val) => {
    return `R$ ${val.toFixed(2).replace('.', ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.')}`;
  };

  // Filtrar produtos de acordo com a pesquisa
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getStockBadgeStyle = (qty) => {
    if (qty < 10) return { color: '#ef4444', label: 'Estoque Baixo' };
    if (qty < 25) return { color: '#f59e0b', label: 'Estoque Médio' };
    return { color: '#10b981', label: 'Estoque Alto' };
  };

  const renderProductItem = ({ item }) => {
    const stockBadge = getStockBadgeStyle(item.stock);
    
    return (
      <CustomCard style={styles.productCard}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.productName, { color: themeTextColor }]}>{item.name}</Text>
            <Text style={[styles.productCategory, { color: themeSubTextColor }]}>{item.category || 'Sem Categoria'}</Text>
          </View>
          <Text style={[styles.productPrice, { color: themeTextColor }]}>
            {formatCurrency(item.price)}
          </Text>
        </View>

        <View style={[styles.cardDivider, { backgroundColor: themeBorderColor }]} />

        <View style={styles.cardFooter}>
          <View style={styles.stockInfo}>
            <Ionicons name="cube-outline" size={16} color={stockBadge.color} style={{ marginRight: 6 }} />
            <Text style={[styles.stockValue, { color: themeTextColor }]}>
              {item.stock} <Text style={{ color: themeSubTextColor, fontSize: 12, fontWeight: 'normal' }}>({stockBadge.label})</Text>
            </Text>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.actionBtn, { borderColor: themeBorderColor }]} 
              onPress={() => handleOpenEditModal(item)}
            >
              <Ionicons name="create-outline" size={18} color={primaryColor} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionBtn, { borderColor: '#fee2e2' }]} 
              onPress={() => handleDeleteProduct(item.id, item.name)}
            >
              <Ionicons name="trash-outline" size={18} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
      </CustomCard>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themeBgColor }]} edges={['top', 'left', 'right']}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} backgroundColor={themeBgColor} />

      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: themeTextColor }]}>Produtos</Text>
          <Text style={[styles.headerSubtitle, { color: themeSubTextColor }]}>
            Gerencie o catálogo de produtos e estoques.
          </Text>
        </View>
        <TouchableOpacity 
          style={[styles.addBtn, { backgroundColor: primaryColor }]} 
          onPress={handleOpenCreateModal}
        >
          <Ionicons name="add" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Barra de Pesquisa */}
      <View style={styles.searchContainer}>
        <CustomInput
          placeholder="Pesquisar por nome ou categoria..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
          autoCorrect={false}
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={primaryColor} />
          <Text style={[styles.loadingText, { color: themeSubTextColor }]}>Carregando catálogo...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          renderItem={renderProductItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchProducts(true)}
              colors={[primaryColor]}
              tintColor={primaryColor}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="cube" size={48} color={themeSubTextColor} style={{ marginBottom: 12 }} />
              <Text style={[styles.emptyText, { color: themeSubTextColor }]}>
                {searchQuery ? 'Nenhum produto corresponde à busca.' : 'Nenhum produto cadastrado.'}
              </Text>
            </View>
          }
        />
      )}

      {/* Modal de Cadastro/Edição */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardBgColor, borderColor: themeBorderColor }]}>
            <Text style={[styles.modalTitle, { color: themeTextColor }]}>
              {editingProduct ? 'Editar Produto' : 'Novo Produto'}
            </Text>

            <CustomInput
              label="Nome do Produto"
              placeholder="Ex: Monitor Gamer 24"
              value={name}
              onChangeText={setName}
            />

            <CustomInput
              label="Categoria"
              placeholder="Ex: Eletrônicos"
              value={category}
              onChangeText={setCategory}
            />

            <View style={styles.formRow}>
              <View style={{ flex: 1 }}>
                <CustomInput
                  label="Preço de Venda (R$)"
                  placeholder="Ex: 899,90"
                  keyboardType="numeric"
                  value={price}
                  onChangeText={setPrice}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 16 }}>
                <CustomInput
                  label="Qtd. em Estoque"
                  placeholder="Ex: 50"
                  keyboardType="number-pad"
                  value={stock}
                  onChangeText={setStock}
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <CustomButton
                title="Cancelar"
                variant="secondary"
                onPress={() => setModalVisible(false)}
                style={styles.modalBtn}
              />
              <CustomButton
                title="Salvar"
                onPress={handleSaveProduct}
                loading={loadingAction}
                style={styles.modalBtn}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  addBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchContainer: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  searchInput: {
    height: 44,
    marginBottom: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    marginTop: 12,
  },
  listContainer: {
    padding: 24,
    paddingTop: 8,
  },
  productCard: {
    marginBottom: 16,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  productCategory: {
    fontSize: 12,
    marginTop: 2,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 8,
  },
  cardDivider: {
    height: 1,
    marginVertical: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  formRow: {
    flexDirection: 'row',
    width: '100%',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
  modalBtn: {
    flex: 1,
  },
});
