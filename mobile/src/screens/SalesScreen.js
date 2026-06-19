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
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAppTheme } from '../context/ThemeContext';
import { requestGraphQL } from '../utils/api';
import { CustomInput, CustomButton, CustomCard } from '../components/ThemeComponents';
import { Ionicons } from '@expo/vector-icons';

const GET_SALES_QUERY = `
  query GetSales {
    sales {
      id
      customerId
      customerName
      items {
        productId
        productName
        quantity
        price
        total
      }
      total
      createdAt
    }
  }
`;

const GET_CUSTOMERS_AND_PRODUCTS_QUERY = `
  query GetCustomersAndProducts {
    customers {
      id
      name
      tier
    }
    products {
      id
      name
      price
      stock
    }
  }
`;

const ADD_SALE_MUTATION = `
  mutation AddSale($customerId: String!, $customerName: String, $items: [SaleItemInput]!, $total: Float!) {
    addSale(customerId: $customerId, customerName: $customerName, items: $items, total: $total) {
      id
      total
      createdAt
    }
  }
`;

export default function SalesScreen() {
  const { isDarkMode } = useAppTheme();

  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Estados do Checkout Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadingModalData, setLoadingModalData] = useState(false);

  // Dados da Nova Venda
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [cart, setCart] = useState([]); // [{ product, quantity, total }]
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedQty, setSelectedQty] = useState(1);
  const [loadingAction, setLoadingAction] = useState(false);

  const themeBgColor = isDarkMode ? '#15181c' : '#f1f5f9';
  const themeTextColor = isDarkMode ? '#f8fafc' : '#212121';
  const themeSubTextColor = isDarkMode ? '#94a3b8' : '#64748b';
  const primaryColor = isDarkMode ? '#00b377' : '#008055';
  const themeBorderColor = isDarkMode ? '#30363d' : '#dbe1e8';
  const cardBgColor = isDarkMode ? '#20252b' : '#ffffff';

  const fetchSales = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const data = await requestGraphQL(GET_SALES_QUERY, {}, showRefreshIndicator);
      if (data && data.sales) {
        setSales(data.sales);
      }
    } catch (err) {
      console.warn('Erro ao carregar vendas:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const handleOpenNewSale = async () => {
    setLoadingModalData(true);
    setSelectedCustomerId('');
    setCart([]);
    setSelectedProductId('');
    setSelectedQty(1);
    setModalVisible(true);

    try {
      const data = await requestGraphQL(GET_CUSTOMERS_AND_PRODUCTS_QUERY);
      if (data) {
        setCustomers(data.customers || []);
        setProducts(data.products || []);
      }
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível buscar clientes e produtos.');
      setModalVisible(false);
    } finally {
      setLoadingModalData(false);
    }
  };

  const handleAddItemToCart = () => {
    if (!selectedProductId) {
      Alert.alert('Aviso', 'Selecione um produto.');
      return;
    }

    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    if (product.stock < selectedQty) {
      Alert.alert('Estoque Insuficiente', `Estoque disponível: ${product.stock} unidades.`);
      return;
    }

    // Verificar se já está no carrinho
    const existingIndex = cart.findIndex(item => item.product.id === product.id);
    if (existingIndex > -1) {
      const newQty = cart[existingIndex].quantity + selectedQty;
      if (product.stock < newQty) {
        Alert.alert('Estoque Insuficiente', `O total no carrinho (${newQty}) excede o estoque disponível.`);
        return;
      }
      const newCart = [...cart];
      newCart[existingIndex].quantity = newQty;
      newCart[existingIndex].total = newQty * product.price;
      setCart(newCart);
    } else {
      setCart([...cart, {
        product,
        quantity: selectedQty,
        total: selectedQty * product.price
      }]);
    }

    // Resetar seletores
    setSelectedProductId('');
    setSelectedQty(1);
  };

  const handleRemoveItemFromCart = (index) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const handleFinalizeSale = async () => {
    if (!selectedCustomerId) {
      Alert.alert('Erro', 'Selecione um cliente para a venda.');
      return;
    }
    if (cart.length === 0) {
      Alert.alert('Erro', 'O carrinho está vazio.');
      return;
    }

    const customer = customers.find(c => c.id === selectedCustomerId);
    const total = cart.reduce((sum, item) => sum + item.total, 0);

    setLoadingAction(true);
    try {
      const itemsInput = cart.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
        total: item.total
      }));

      await requestGraphQL(ADD_SALE_MUTATION, {
        customerId: selectedCustomerId,
        customerName: customer.name,
        items: itemsInput,
        total
      });

      Alert.alert('Sucesso', 'Venda realizada com sucesso!');
      setModalVisible(false);
      fetchSales();
    } catch (err) {
      Alert.alert('Erro', err.message || 'Falha ao registrar venda.');
    } finally {
      setLoadingAction(false);
    }
  };

  const formatCurrency = (val) => {
    if (val === undefined || val === null) return 'R$ 0,00';
    return `R$ ${val.toFixed(2).replace('.', ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.')}`;
  };

  const formatDate = (isoString) => {
    try {
      const date = new Date(isoString);
      return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()} às ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    } catch (e) {
      return isoString;
    }
  };

  const renderSaleItem = ({ item }) => {
    return (
      <CustomCard style={styles.saleCard}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.clientName, { color: themeTextColor }]}>{item.customerName || 'Cliente Indefinido'}</Text>
            <Text style={[styles.saleDate, { color: themeSubTextColor }]}>{formatDate(item.createdAt)}</Text>
          </View>
          <Text style={[styles.saleTotal, { color: primaryColor }]}>
            {formatCurrency(item.total)}
          </Text>
        </View>

        <View style={[styles.cardDivider, { backgroundColor: themeBorderColor }]} />

        <Text style={[styles.itemsTitle, { color: themeTextColor }]}>Itens do Pedido:</Text>
        {item.items.map((prod, idx) => (
          <View key={idx} style={styles.itemRow}>
            <Text style={[styles.itemName, { color: themeTextColor }]}>
              {prod.quantity}x {prod.productName}
            </Text>
            <Text style={[styles.itemSubTotal, { color: themeSubTextColor }]}>
              {formatCurrency(prod.total)}
            </Text>
          </View>
        ))}
      </CustomCard>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themeBgColor }]} edges={['top', 'left', 'right']}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} backgroundColor={themeBgColor} />

      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: themeTextColor }]}>Vendas</Text>
          <Text style={[styles.headerSubtitle, { color: themeSubTextColor }]}>
            Histórico e registro de pedidos comerciais.
          </Text>
        </View>
        <TouchableOpacity 
          style={[styles.addBtn, { backgroundColor: primaryColor }]} 
          onPress={handleOpenNewSale}
        >
          <Ionicons name="cart-sharp" size={22} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={primaryColor} />
          <Text style={[styles.loadingText, { color: themeSubTextColor }]}>Buscando vendas...</Text>
        </View>
      ) : (
        <FlatList
          data={sales}
          keyExtractor={(item) => item.id}
          renderItem={renderSaleItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchSales(true)}
              colors={[primaryColor]}
              tintColor={primaryColor}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={48} color={themeSubTextColor} style={{ marginBottom: 12 }} />
              <Text style={[styles.emptyText, { color: themeSubTextColor }]}>
                Nenhuma venda registrada ainda.
              </Text>
            </View>
          }
        />
      )}

      {/* Modal de Nova Venda (Multi-Step Checkout) */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardBgColor, borderColor: themeBorderColor }]}>
            <Text style={[styles.modalTitle, { color: themeTextColor }]}>Nova Venda</Text>

            {loadingModalData ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color={primaryColor} />
                <Text style={{ color: themeSubTextColor, marginTop: 12 }}>Carregando dados da loja...</Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* 1. Selecionar Cliente */}
                <Text style={[styles.formSectionLabel, { color: themeTextColor }]}>1. Selecionar Cliente</Text>
                <View style={styles.pickerContainer}>
                  {customers.map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      style={[
                        styles.pickerOption,
                        { borderColor: themeBorderColor },
                        selectedCustomerId === c.id && { backgroundColor: primaryColor, borderColor: primaryColor }
                      ]}
                      onPress={() => setSelectedCustomerId(c.id)}
                    >
                      <Text style={[
                        styles.pickerOptionText,
                        selectedCustomerId === c.id ? { color: '#ffffff', fontWeight: 'bold' } : { color: themeTextColor }
                      ]}>
                        {c.name} ({c.tier.toUpperCase()})
                      </Text>
                    </TouchableOpacity>
                  ))}
                  {customers.length === 0 && (
                    <Text style={{ color: themeSubTextColor, fontSize: 13 }}>Nenhum cliente cadastrado.</Text>
                  )}
                </View>

                {/* 2. Selecionar Produto e Qtd */}
                <Text style={[styles.formSectionLabel, { color: themeTextColor, marginTop: 20 }]}>2. Adicionar Itens ao Carrinho</Text>
                
                <Text style={[styles.fieldMiniLabel, { color: themeSubTextColor }]}>Selecione o Produto</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.productSelectionRow}>
                  {products.map((p) => (
                    <TouchableOpacity
                      key={p.id}
                      style={[
                        styles.productSelectionCard,
                        { backgroundColor: isDarkMode ? '#15181c' : '#f8fafc', borderColor: themeBorderColor },
                        selectedProductId === p.id && { borderColor: primaryColor, borderWidth: 2 }
                      ]}
                      onPress={() => setSelectedProductId(p.id)}
                    >
                      <Text style={[styles.miniProdName, { color: themeTextColor }]} numberOfLines={1}>{p.name}</Text>
                      <Text style={[styles.miniProdDetails, { color: themeSubTextColor }]}>Estoque: {p.stock} | {formatCurrency(p.price)}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {selectedProductId && (
                  <View style={styles.qtyContainer}>
                    <Text style={[styles.qtyLabel, { color: themeTextColor }]}>Quantidade:</Text>
                    <View style={styles.qtyControls}>
                      <TouchableOpacity 
                        style={[styles.qtyBtn, { borderColor: themeBorderColor }]}
                        onPress={() => setSelectedQty(prev => Math.max(1, prev - 1))}
                      >
                        <Ionicons name="remove" size={18} color={themeTextColor} />
                      </TouchableOpacity>
                      <Text style={[styles.qtyValue, { color: themeTextColor }]}>{selectedQty}</Text>
                      <TouchableOpacity 
                        style={[styles.qtyBtn, { borderColor: themeBorderColor }]}
                        onPress={() => setSelectedQty(prev => prev + 1)}
                      >
                        <Ionicons name="add" size={18} color={themeTextColor} />
                      </TouchableOpacity>
                    </View>

                    <CustomButton 
                      title="Adicionar" 
                      onPress={handleAddItemToCart}
                      style={styles.addToCartBtn}
                    />
                  </View>
                )}

                {/* 3. Carrinho */}
                <Text style={[styles.formSectionLabel, { color: themeTextColor, marginTop: 24 }]}>3. Carrinho de Compras</Text>
                {cart.length > 0 ? (
                  cart.map((item, idx) => (
                    <View key={idx} style={[styles.cartItem, { borderBottomColor: themeBorderColor }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.cartItemName, { color: themeTextColor }]}>{item.product.name}</Text>
                        <Text style={[styles.cartItemQty, { color: themeSubTextColor }]}>
                          {item.quantity}x {formatCurrency(item.product.price)}
                        </Text>
                      </View>
                      <Text style={[styles.cartItemTotal, { color: themeTextColor }]}>
                        {formatCurrency(item.total)}
                      </Text>
                      <TouchableOpacity 
                        style={styles.cartDeleteBtn} 
                        onPress={() => handleRemoveItemFromCart(idx)}
                      >
                        <Ionicons name="close-circle-outline" size={22} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  ))
                ) : (
                  <Text style={[styles.emptyCartText, { color: themeSubTextColor }]}>Carrinho vazio</Text>
                )}

                {/* Total e Envio */}
                {cart.length > 0 && (
                  <View style={[styles.summaryContainer, { borderTopColor: themeBorderColor }]}>
                    <View style={styles.summaryRow}>
                      <Text style={[styles.summaryLabel, { color: themeSubTextColor }]}>Total Geral:</Text>
                      <Text style={[styles.summaryValue, { color: primaryColor }]}>
                        {formatCurrency(cart.reduce((sum, item) => sum + item.total, 0))}
                      </Text>
                    </View>
                  </View>
                )}

                <View style={styles.modalActions}>
                  <CustomButton
                    title="Fechar"
                    variant="secondary"
                    onPress={() => setModalVisible(false)}
                    style={styles.modalBtn}
                  />
                  <CustomButton
                    title="Concluir Venda"
                    onPress={handleFinalizeSale}
                    loading={loadingAction}
                    disabled={cart.length === 0 || !selectedCustomerId}
                    style={styles.modalBtn}
                  />
                </View>

              </ScrollView>
            )}
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
  },
  saleCard: {
    marginBottom: 16,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  clientName: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  saleDate: {
    fontSize: 11,
    marginTop: 2,
  },
  saleTotal: {
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 8,
  },
  cardDivider: {
    height: 1,
    marginVertical: 12,
  },
  itemsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  itemName: {
    fontSize: 13,
  },
  itemSubTotal: {
    fontSize: 13,
    fontWeight: '500',
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
    maxHeight: '90%',
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
    marginBottom: 16,
  },
  modalLoading: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  formSectionLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pickerOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  pickerOptionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  fieldMiniLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 6,
  },
  productSelectionRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  productSelectionCard: {
    width: 140,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 10,
  },
  miniProdName: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  miniProdDetails: {
    fontSize: 10,
    marginTop: 4,
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.02)',
    padding: 10,
    borderRadius: 8,
  },
  qtyLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  qtyBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyValue: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  addToCartBtn: {
    height: 36,
    paddingHorizontal: 12,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  cartItemName: {
    fontSize: 13,
    fontWeight: '600',
  },
  cartItemQty: {
    fontSize: 11,
    marginTop: 2,
  },
  cartItemTotal: {
    fontSize: 13,
    fontWeight: 'bold',
    marginRight: 12,
  },
  cartDeleteBtn: {
    padding: 4,
  },
  emptyCartText: {
    fontSize: 12,
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  summaryContainer: {
    borderTopWidth: 1,
    marginTop: 16,
    paddingTop: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '900',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 24,
  },
  modalBtn: {
    flex: 1,
  },
});
