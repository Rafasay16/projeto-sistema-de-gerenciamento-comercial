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
  ScrollView,
  Platform,
  Linking
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAppTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { requestGraphQL, getBaseUrl } from '../utils/api';
import { CustomInput, CustomButton, CustomCard } from '../components/ThemeComponents';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Ionicons } from '@expo/vector-icons';

// --- QUERIES E MUTATIONS ---

const GET_CUSTOMERS_QUERY = `
  query GetCustomers {
    customers {
      id
      name
      email
      phone
      tier
      totalSpent
    }
  }
`;

const ADD_CUSTOMER_MUTATION = `
  mutation AddCustomer($input: CustomerInput!) {
    addCustomer(input: $input) {
      id
      name
      email
      phone
      tier
      totalSpent
    }
  }
`;

const UPDATE_CUSTOMER_MUTATION = `
  mutation UpdateCustomer($id: ID!, $input: CustomerInput!) {
    updateCustomer(id: $id, input: $input) {
      id
      name
      email
      phone
      tier
      totalSpent
    }
  }
`;

const DELETE_CUSTOMER_MUTATION = `
  mutation DeleteCustomer($id: ID!) {
    deleteCustomer(id: $id)
  }
`;

const GET_CAMPAIGNS_QUERY = `
  query GetCampaigns {
    campaigns {
      id
      name
      platform
      status
      budget
      spent
      impressions
      clicks
      conversions
      roi
    }
  }
`;

const ADD_CAMPAIGN_MUTATION = `
  mutation AddCampaign($input: CampaignInput!) {
    addCampaign(input: $input) {
      id
      name
      platform
      status
      budget
      spent
      roi
    }
  }
`;

export default function MoreScreen() {
  const { isDarkMode } = useAppTheme();
  const { logout, user } = useAuth();

  // Seção ativa: 'main', 'customers', 'marketing', 'settings', 'support'
  const [activeSection, setActiveSection] = useState('main');

  // Cores do Tema
  const themeBgColor = isDarkMode ? '#15181c' : '#f1f5f9';
  const themeTextColor = isDarkMode ? '#f8fafc' : '#212121';
  const themeSubTextColor = isDarkMode ? '#94a3b8' : '#64748b';
  const primaryColor = isDarkMode ? '#00b377' : '#008055';
  const themeBorderColor = isDarkMode ? '#30363d' : '#dbe1e8';
  const cardBgColor = isDarkMode ? '#20252b' : '#ffffff';

  // --- ESTADOS DA SEÇÃO CLIENTES ---
  const [customers, setCustomers] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [custModalVisible, setCustModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [cName, setCName] = useState('');
  const [cEmail, setCEmail] = useState('');
  const [cPhone, setCPhone] = useState('');

  // --- ESTADOS DA SEÇÃO MARKETING ---
  const [campaigns, setCampaigns] = useState([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [campModalVisible, setCampModalVisible] = useState(false);
  const [campName, setCampName] = useState('');
  const [campPlatform, setCampPlatform] = useState('Google');
  const [campBudget, setCampBudget] = useState('');

  // --- ESTADOS DA SEÇÃO AJUSTES (API) ---
  const [apiUrl, setApiUrl] = useState('');
  const [apiUrlInput, setApiUrlInput] = useState('');

  // --- ESTADOS DA SEÇÃO SUPORTE ---
  const [netInfo, setNetInfo] = useState(null);

  // --- UTILS ---
  const formatCurrency = (val) => {
    if (val === undefined || val === null) return 'R$ 0,00';
    return `R$ ${val.toFixed(2).replace('.', ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.')}`;
  };

  // --- EFEITOS E BUSCA ---

  useEffect(() => {
    if (activeSection === 'customers') {
      fetchCustomers();
    } else if (activeSection === 'marketing') {
      fetchCampaigns();
    } else if (activeSection === 'settings') {
      getBaseUrl().then(url => {
        setApiUrl(url);
        setApiUrlInput(url);
      });
    } else if (activeSection === 'support') {
      NetInfo.fetch().then(setNetInfo);
      const unsubscribe = NetInfo.addEventListener(setNetInfo);
      return () => unsubscribe();
    }
  }, [activeSection]);

  // --- CLIENTES ACTIONS ---
  const fetchCustomers = async (forceRefresh = false) => {
    setLoadingCustomers(true);
    try {
      const data = await requestGraphQL(GET_CUSTOMERS_QUERY, {}, forceRefresh);
      if (data) setCustomers(data.customers || []);
    } catch (err) {
      console.warn(err);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const handleOpenCreateCust = () => {
    setEditingCustomer(null);
    setCName('');
    setCEmail('');
    setCPhone('');
    setCustModalVisible(true);
  };

  const handleOpenEditCust = (c) => {
    setEditingCustomer(c);
    setCName(c.name);
    setCEmail(c.email || '');
    setCPhone(c.phone || '');
    setCustModalVisible(true);
  };

  const handleSaveCustomer = async () => {
    if (!cName.trim()) {
      Alert.alert('Erro', 'O nome é obrigatório.');
      return;
    }
    try {
      const input = {
        name: cName.trim(),
        email: cEmail.trim() || null,
        phone: cPhone.trim() || null
      };

      if (editingCustomer) {
        await requestGraphQL(UPDATE_CUSTOMER_MUTATION, { id: editingCustomer.id, input });
        Alert.alert('Sucesso', 'Cliente atualizado!');
      } else {
        await requestGraphQL(ADD_CUSTOMER_MUTATION, { input });
        Alert.alert('Sucesso', 'Cliente cadastrado!');
      }
      setCustModalVisible(false);
      fetchCustomers();
    } catch (err) {
      Alert.alert('Erro', err.message);
    }
  };

  const handleDeleteCustomer = (id, name) => {
    Alert.alert('Remover Cliente', `Deseja excluir o cliente "${name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { 
        text: 'Excluir', 
        style: 'destructive',
        onPress: async () => {
          try {
            await requestGraphQL(DELETE_CUSTOMER_MUTATION, { id });
            Alert.alert('Sucesso', 'Cliente removido!');
            fetchCustomers();
          } catch (err) {
            Alert.alert('Erro', err.message);
          }
        }
      }
    ]);
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    (c.email && c.email.toLowerCase().includes(customerSearch.toLowerCase()))
  );

  // --- MARKETING ACTIONS ---
  const fetchCampaigns = async (forceRefresh = false) => {
    setLoadingCampaigns(true);
    try {
      const data = await requestGraphQL(GET_CAMPAIGNS_QUERY, {}, forceRefresh);
      if (data) setCampaigns(data.campaigns || []);
    } catch (err) {
      console.warn(err);
    } finally {
      setLoadingCampaigns(false);
    }
  };

  const handleSaveCampaign = async () => {
    if (!campName.trim() || !campBudget.trim()) {
      Alert.alert('Erro', 'Preencha todos os campos.');
      return;
    }
    const budgetNum = parseFloat(campBudget);
    if (isNaN(budgetNum) || budgetNum <= 0) {
      Alert.alert('Erro', 'Insira um orçamento válido.');
      return;
    }

    try {
      await requestGraphQL(ADD_CAMPAIGN_MUTATION, {
        input: {
          name: campName.trim(),
          platform: campPlatform,
          budget: budgetNum
        }
      });
      Alert.alert('Sucesso', 'Campanha criada!');
      setCampModalVisible(false);
      fetchCampaigns();
    } catch (err) {
      Alert.alert('Erro', err.message);
    }
  };

  // --- SETTINGS ACTIONS ---
  const handleSaveApiSettings = async () => {
    const formatted = apiUrlInput.trim();
    if (!formatted) return;
    try {
      await AsyncStorage.setItem('WEB_URL', formatted);
      setApiUrl(formatted);
      Alert.alert('Sucesso', 'Endereço da API configurado!');
    } catch (e) {
      Alert.alert('Erro', 'Falha ao salvar URL.');
    }
  };

  const handleOpenLink = (url) => {
    Linking.openURL(url).catch(err => console.warn(err));
  };

  // --- RENDERIZADORES DE SUB-TELAS ---

  const renderHeader = (title) => (
    <View style={styles.subHeader}>
      <TouchableOpacity onPress={() => setActiveSection('main')} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={24} color={primaryColor} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: themeTextColor }]}>{title}</Text>
    </View>
  );

  if (activeSection === 'customers') {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: themeBgColor }]} edges={['top', 'left', 'right']}>
        <StatusBar style={isDarkMode ? 'light' : 'dark'} backgroundColor={themeBgColor} />
        {renderHeader('Clientes (CRM)')}
        
        <View style={styles.toolRow}>
          <View style={{ flex: 1 }}>
            <CustomInput
              placeholder="Pesquisar cliente..."
              value={customerSearch}
              onChangeText={setCustomerSearch}
              style={{ height: 40, marginBottom: 0 }}
            />
          </View>
          <TouchableOpacity 
            style={[styles.miniAddBtn, { backgroundColor: primaryColor }]}
            onPress={handleOpenCreateCust}
          >
            <Ionicons name="person-add" size={18} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {loadingCustomers ? (
          <ActivityIndicator size="large" color={primaryColor} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={filteredCustomers}
            keyExtractor={item => item.id}
            contentContainerStyle={{ padding: 24 }}
            refreshControl={
              <RefreshControl
                refreshing={loadingCustomers}
                onRefresh={() => fetchCustomers(true)}
                colors={[primaryColor]}
                tintColor={primaryColor}
              />
            }
            renderItem={({ item }) => (
              <CustomCard style={{ padding: 16, marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: themeTextColor }}>{item.name}</Text>
                    <Text style={{ fontSize: 12, color: themeSubTextColor, marginTop: 2 }}>{item.email || 'Sem E-mail'} | {item.phone || 'Sem Telefone'}</Text>
                    <View style={{ flexDirection: 'row', gap: 6, marginTop: 6, alignItems: 'center' }}>
                      <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', paddingVertical: 2, paddingHorizontal: 6, borderRadius: 4 }}>
                        {item.tier.toUpperCase()}
                      </Text>
                      <Text style={{ fontSize: 12, color: themeTextColor, fontWeight: '500' }}>
                        Total: {formatCurrency(item.totalSpent)}
                      </Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity onPress={() => handleOpenEditCust(item)} style={[styles.actionIconBtn, { borderColor: themeBorderColor }]}>
                      <Ionicons name="create-outline" size={16} color={primaryColor} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteCustomer(item.id, item.name)} style={[styles.actionIconBtn, { borderColor: '#fee2e2' }]}>
                      <Ionicons name="trash-outline" size={16} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </CustomCard>
            )}
          />
        )}

        <Modal visible={custModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: cardBgColor, borderColor: themeBorderColor }]}>
              <Text style={[styles.modalTitle, { color: themeTextColor }]}>{editingCustomer ? 'Editar Cliente' : 'Novo Cliente'}</Text>
              <CustomInput label="Nome do Cliente" value={cName} onChangeText={setCName} />
              <CustomInput label="E-mail" value={cEmail} onChangeText={setCEmail} keyboardType="email-address" autoCapitalize="none" />
              <CustomInput label="Telefone" value={cPhone} onChangeText={setCPhone} keyboardType="phone-pad" />
              <View style={styles.modalActions}>
                <CustomButton title="Cancelar" variant="secondary" onPress={() => setCustModalVisible(false)} style={{ flex: 1 }} />
                <CustomButton title="Salvar" onPress={handleSaveCustomer} style={{ flex: 1 }} />
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  if (activeSection === 'marketing') {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: themeBgColor }]} edges={['top', 'left', 'right']}>
        <StatusBar style={isDarkMode ? 'light' : 'dark'} backgroundColor={themeBgColor} />
        {renderHeader('Campanhas')}

        <View style={styles.toolRow}>
          <Text style={{ fontSize: 14, color: themeSubTextColor, flex: 1 }}>Lista de campanhas ativas de marketing.</Text>
          <TouchableOpacity 
            style={[styles.miniAddBtn, { backgroundColor: primaryColor }]}
            onPress={() => {
              setCampName('');
              setCampBudget('');
              setCampPlatform('Google');
              setCampModalVisible(true);
            }}
          >
            <Ionicons name="add" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {loadingCampaigns ? (
          <ActivityIndicator size="large" color={primaryColor} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={campaigns}
            keyExtractor={item => item.id}
            contentContainerStyle={{ padding: 24 }}
            refreshControl={
              <RefreshControl
                refreshing={loadingCampaigns}
                onRefresh={() => fetchCampaigns(true)}
                colors={[primaryColor]}
                tintColor={primaryColor}
              />
            }
            renderItem={({ item }) => (
              <CustomCard style={{ padding: 16, marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: themeTextColor }}>{item.name}</Text>
                    <Text style={{ fontSize: 12, color: themeSubTextColor, marginTop: 2 }}>Plataforma: {item.platform} | Status: {item.status}</Text>
                    <View style={{ flexDirection: 'row', gap: 12, marginTop: 6 }}>
                      <Text style={{ fontSize: 12, color: themeTextColor }}>
                        Orçamento: <Text style={{ fontWeight: 'bold' }}>{formatCurrency(item.budget)}</Text>
                      </Text>
                      <Text style={{ fontSize: 12, color: themeTextColor }}>
                        Gasto: <Text style={{ fontWeight: 'bold' }}>{formatCurrency(item.spent)}</Text>
                      </Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: 'bold', color: item.roi >= 1.0 ? '#10b981' : '#ef4444' }}>
                    ROI: {item.roi.toFixed(2)}x
                  </Text>
                </View>
              </CustomCard>
            )}
          />
        )}

        <Modal visible={campModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: cardBgColor, borderColor: themeBorderColor }]}>
              <Text style={[styles.modalTitle, { color: themeTextColor }]}>Nova Campanha</Text>
              <CustomInput label="Nome da Campanha" value={campName} onChangeText={setCampName} />
              
              <Text style={{ fontSize: 14, color: themeSubTextColor, marginBottom: 6 }}>Plataforma</Text>
              <View style={{ flexDirection: 'row', gap: 6, marginBottom: 16 }}>
                {['Google', 'Facebook', 'Instagram', 'TikTok'].map(plat => (
                  <TouchableOpacity 
                    key={plat}
                    style={[styles.miniSelectOption, { borderColor: themeBorderColor }, campPlatform === plat && { backgroundColor: primaryColor, borderColor: primaryColor }]}
                    onPress={() => setCampPlatform(plat)}
                  >
                    <Text style={{ fontSize: 11, fontWeight: 'bold', color: campPlatform === plat ? '#ffffff' : themeTextColor }}>{plat}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <CustomInput label="Orçamento Limite (R$)" value={campBudget} onChangeText={setCampBudget} keyboardType="numeric" />
              <View style={styles.modalActions}>
                <CustomButton title="Cancelar" variant="secondary" onPress={() => setCampModalVisible(false)} style={{ flex: 1 }} />
                <CustomButton title="Salvar" onPress={handleSaveCampaign} style={{ flex: 1 }} />
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  if (activeSection === 'settings') {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: themeBgColor }]} edges={['top', 'left', 'right']}>
        <StatusBar style={isDarkMode ? 'light' : 'dark'} backgroundColor={themeBgColor} />
        {renderHeader('Ajustes da API')}
        <View style={{ padding: 24 }}>
          <CustomCard>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: themeTextColor, marginBottom: 8 }}>Servidor API de Comunicação</Text>
            <Text style={{ fontSize: 13, color: themeSubTextColor, marginBottom: 16 }}>Modifique o IP de conexão abaixo para que o celular possa ler o backend de desenvolvimento local.</Text>
            <CustomInput label="URL Base do Backend" value={apiUrlInput} onChangeText={setApiUrlInput} placeholder="Ex: http://192.168.10.15:3000" autoCapitalize="none" />
            <CustomButton title="Salvar Configurações" onPress={handleSaveApiSettings} style={{ marginTop: 8 }} />
          </CustomCard>
        </View>
      </SafeAreaView>
    );
  }

  if (activeSection === 'support') {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: themeBgColor }]} edges={['top', 'left', 'right']}>
        <StatusBar style={isDarkMode ? 'light' : 'dark'} backgroundColor={themeBgColor} />
        {renderHeader('Suporte Técnico')}
        <ScrollView contentContainerStyle={{ padding: 24 }}>
          <CustomCard>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: themeTextColor, marginBottom: 6 }}>Falar Conosco</Text>
            <Text style={{ fontSize: 13, color: themeSubTextColor, marginBottom: 16 }}>Deseja tirar dúvidas ou relatar um problema técnico?</Text>
            
            <TouchableOpacity 
              style={[styles.linkRow, { borderBottomWidth: 1, borderBottomColor: themeBorderColor }]}
              onPress={() => handleOpenLink('https://wa.me/5500000000000?text=Suporte%20no%20InsightGestor')}
            >
              <View style={styles.iconWrapper}>
                <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
                <Text style={{ fontSize: 15, fontWeight: '500', color: themeTextColor }}>WhatsApp Suporte</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={themeSubTextColor} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.linkRow}
              onPress={() => handleOpenLink('https://instagram.com/insightgestor')}
            >
              <View style={styles.iconWrapper}>
                <Ionicons name="logo-instagram" size={24} color="#E1306C" />
                <Text style={{ fontSize: 15, fontWeight: '500', color: themeTextColor }}>Siga-nos no Instagram</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={themeSubTextColor} />
            </TouchableOpacity>
          </CustomCard>

          <CustomCard>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: themeTextColor, marginBottom: 16 }}>Diagnóstico de Rede</Text>
            <View style={styles.infoRow}>
              <Text style={{ color: themeSubTextColor }}>Status da Conexão</Text>
              <Text style={{ fontWeight: 'bold', color: netInfo?.isConnected ? '#10b981' : '#ef4444' }}>
                {netInfo?.isConnected ? 'Conectado' : 'Sem Internet'}
              </Text>
            </View>
            <View style={[styles.infoRow, { borderTopWidth: 1, borderTopColor: themeBorderColor, paddingTop: 12, marginTop: 12 }]}>
              <Text style={{ color: themeSubTextColor }}>Tipo de Conectividade</Text>
              <Text style={{ fontWeight: 'bold', color: themeTextColor }}>{netInfo?.type?.toUpperCase() || 'N/A'}</Text>
            </View>
          </CustomCard>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // --- TELA PRINCIPAL DO MENU "MAIS" ---
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themeBgColor }]} edges={['top', 'left', 'right']}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} backgroundColor={themeBgColor} />
      <View style={styles.mainHeader}>
        <Text style={[styles.welcomeMini, { color: themeSubTextColor }]}>{user?.role?.toUpperCase() || 'GERENTE'}</Text>
        <Text style={[styles.headerTitle, { color: themeTextColor }]}>Mais Recursos</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24 }}>
        
        {/* Perfil Mini Card */}
        <CustomCard style={{ marginBottom: 24, padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={[styles.avatar, { backgroundColor: primaryColor }]}>
              <Text style={styles.avatarText}>{(user?.name || 'U').substring(0, 2).toUpperCase()}</Text>
            </View>
            <View style={{ marginLeft: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: themeTextColor }}>{user?.name || 'Usuário'}</Text>
              <Text style={{ fontSize: 12, color: themeSubTextColor }}>{user?.email || 'email@servidor.com'}</Text>
            </View>
          </View>
        </CustomCard>

        {/* Lista de Opções */}
        <CustomCard style={{ padding: 8 }}>
          <TouchableOpacity style={[styles.menuOption, { borderBottomWidth: 1, borderBottomColor: themeBorderColor }]} onPress={() => setActiveSection('customers')}>
            <Ionicons name="people-outline" size={22} color={primaryColor} />
            <Text style={[styles.menuText, { color: themeTextColor }]}>Clientes (CRM)</Text>
            <Ionicons name="chevron-forward" size={18} color={themeSubTextColor} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuOption, { borderBottomWidth: 1, borderBottomColor: themeBorderColor }]} onPress={() => setActiveSection('marketing')}>
            <Ionicons name="megaphone-outline" size={22} color={primaryColor} />
            <Text style={[styles.menuText, { color: themeTextColor }]}>Campanhas de Marketing</Text>
            <Ionicons name="chevron-forward" size={18} color={themeSubTextColor} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuOption, { borderBottomWidth: 1, borderBottomColor: themeBorderColor }]} onPress={() => setActiveSection('support')}>
            <Ionicons name="help-buoy-outline" size={22} color={primaryColor} />
            <Text style={[styles.menuText, { color: themeTextColor }]}>Suporte e Conectividade</Text>
            <Ionicons name="chevron-forward" size={18} color={themeSubTextColor} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuOption, { borderBottomWidth: 1, borderBottomColor: themeBorderColor }]} onPress={() => setActiveSection('settings')}>
            <Ionicons name="server-outline" size={22} color={primaryColor} />
            <Text style={[styles.menuText, { color: themeTextColor }]}>Configuração de API</Text>
            <Ionicons name="chevron-forward" size={18} color={themeSubTextColor} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuOption} onPress={logout}>
            <Ionicons name="log-out-outline" size={22} color="#ef4444" />
            <Text style={[styles.menuText, { color: '#ef4444' }]}>Sair da Conta</Text>
          </TouchableOpacity>
        </CustomCard>

        {/* Direitos Autorais */}
        <Text style={[styles.copyright, { color: themeSubTextColor }]}>
          InsightGestor Mobile v1.0.0{'\n'}© 2026 Academic Assignment.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  mainHeader: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  welcomeMini: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backBtn: {
    padding: 8,
    marginRight: 8,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuText: {
    fontSize: 15,
    fontWeight: '500',
  },
  copyright: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 40,
    lineHeight: 18,
  },
  toolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 12,
  },
  miniAddBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  miniSelectOption: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  iconWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
