import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  RefreshControl,
  ActivityIndicator,
  useColorScheme
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';
import { useAppTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { requestGraphQL } from '../utils/api';
import OfflineView from '../components/OfflineView';
import { CustomCard } from '../components/ThemeComponents';
import { Ionicons } from '@expo/vector-icons';

const DASHBOARD_QUERY = `
  query GetDashboardStats {
    dashboardStats {
      totalRevenue
      revenueGrowth
      totalSales
      averageTicket
      topProducts {
        name
        revenue
        count
      }
      lowStock {
        id
        name
        stock
      }
      salesChart {
        date
        total
      }
    }
  }
`;

export default function DashboardScreen() {
  const { isDarkMode } = useAppTheme();
  const { user } = useAuth();
  
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  const themeBgColor = isDarkMode ? '#15181c' : '#f1f5f9';
  const themeTextColor = isDarkMode ? '#f8fafc' : '#212121';
  const themeSubTextColor = isDarkMode ? '#94a3b8' : '#64748b';
  const primaryColor = isDarkMode ? '#00b377' : '#008055';
  const themeBorderColor = isDarkMode ? '#30363d' : '#dbe1e8';
  const cardBgColor = isDarkMode ? '#20252b' : '#ffffff';

  // Monitorar conexão de rede
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected !== false);
    });
    return () => unsubscribe();
  }, []);

  const fetchDashboardData = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const data = await requestGraphQL(DASHBOARD_QUERY, {}, showRefreshIndicator);
      if (data && data.dashboardStats) {
        setStats(data.dashboardStats);
      }
    } catch (err) {
      console.warn('Erro ao carregar dados do dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (isConnected) {
        fetchDashboardData();
      }
    }, [isConnected])
  );

  const formatCurrency = (val) => {
    if (val === undefined || val === null) return 'R$ 0,00';
    return `R$ ${val.toFixed(2).replace('.', ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.')}`;
  };

  const formatPercent = (val) => {
    if (!val) return '0%';
    const sign = val > 0 ? '+' : '';
    return `${sign}${val.toFixed(1)}%`;
  };

  if (!isConnected) {
    return (
      <OfflineView 
        themeBgColor={themeBgColor} 
        themeTextColor={themeTextColor} 
        themeSubTextColor={themeSubTextColor} 
        onRetry={() => fetchDashboardData()} 
      />
    );
  }

  // Obter as datas abreviadas para o gráfico semanal
  const renderChart = () => {
    if (!stats || !stats.salesChart || stats.salesChart.length === 0) {
      return (
        <View style={styles.emptyChartContainer}>
          <Text style={{ color: themeSubTextColor }}>Sem histórico de vendas recente</Text>
        </View>
      );
    }

    // Pegar no máximo os últimos 7 dias para caber na tela
    const recentChartData = stats.salesChart.slice(-7);
    const maxVal = Math.max(...recentChartData.map(d => d.total), 100);

    return (
      <View style={styles.chartWrapper}>
        <View style={styles.chartBarsContainer}>
          {recentChartData.map((day, idx) => {
            const barHeightPercent = (day.total / maxVal) * 100;
            // Formatar data AAAA-MM-DD para DD/MM
            let formattedDate = day.date;
            if (day.date && day.date.includes('-')) {
              const parts = day.date.split('-');
              formattedDate = `${parts[2]}/${parts[1]}`;
            }

            return (
              <View key={idx} style={styles.chartCol}>
                <View style={styles.barBackground}>
                  <View 
                    style={[
                      styles.barActive, 
                      { 
                        height: `${Math.max(barHeightPercent, 5)}%`, 
                        backgroundColor: primaryColor 
                      }
                    ]} 
                  />
                </View>
                <Text style={[styles.chartDateLabel, { color: themeSubTextColor }]}>
                  {formattedDate}
                </Text>
                <Text style={[styles.chartValueLabel, { color: themeTextColor }]}>
                  {day.total > 0 ? `R$ ${Math.round(day.total)}` : '-'}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themeBgColor }]} edges={['top', 'left', 'right']}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} backgroundColor={themeBgColor} />
      
      <View style={styles.header}>
        <View>
          <Text style={[styles.welcomeText, { color: themeSubTextColor }]}>Olá, {user?.name || 'Usuário'}</Text>
          <Text style={[styles.titleText, { color: themeTextColor }]}>Painel Comercial</Text>
        </View>
        <Ionicons name="stats-chart" size={26} color={primaryColor} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={primaryColor} />
          <Text style={[styles.loadingText, { color: themeSubTextColor }]}>Buscando dados no servidor...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={() => fetchDashboardData(true)} 
              colors={[primaryColor]}
              tintColor={primaryColor}
            />
          }
        >
          {/* Alerta de Estoque Baixo */}
          {stats?.lowStock && stats.lowStock.length > 0 && (
            <View style={[styles.alertBanner, { backgroundColor: '#fef3c7', borderColor: '#f59e0b' }]}>
              <Ionicons name="warning-outline" size={20} color="#b45309" style={{ marginRight: 8 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.alertTitle}>Alerta de Estoque</Text>
                <Text style={styles.alertDescription}>
                  Você possui {stats.lowStock.length} produto(s) com estoque abaixo de 10 unidades.
                </Text>
              </View>
            </View>
          )}

          {/* Cards de Métricas Principais (Grid 2x2) */}
          <View style={styles.gridRow}>
            <CustomCard style={styles.gridCard}>
              <View style={styles.metricHeader}>
                <Text style={[styles.metricLabel, { color: themeSubTextColor }]}>Receita</Text>
                <Ionicons name="cash-outline" size={20} color="#10b981" />
              </View>
              <Text style={[styles.metricValue, { color: themeTextColor }]}>
                {formatCurrency(stats?.totalRevenue)}
              </Text>
              <View style={styles.growthContainer}>
                <Ionicons 
                  name={stats?.revenueGrowth >= 0 ? 'trending-up' : 'trending-down'} 
                  size={14} 
                  color={stats?.revenueGrowth >= 0 ? '#10b981' : '#ef4444'} 
                  style={{ marginRight: 4 }}
                />
                <Text style={{ 
                  color: stats?.revenueGrowth >= 0 ? '#10b981' : '#ef4444', 
                  fontSize: 12, 
                  fontWeight: 'bold' 
                }}>
                  {formatPercent(stats?.revenueGrowth)}
                </Text>
              </View>
            </CustomCard>

            <CustomCard style={styles.gridCard}>
              <View style={styles.metricHeader}>
                <Text style={[styles.metricLabel, { color: themeSubTextColor }]}>Vendas</Text>
                <Ionicons name="cart-outline" size={20} color={primaryColor} />
              </View>
              <Text style={[styles.metricValue, { color: themeTextColor }]}>
                {stats?.totalSales || 0}
              </Text>
              <Text style={[styles.metricSubText, { color: themeSubTextColor }]}>Registradas</Text>
            </CustomCard>
          </View>

          <View style={styles.gridRow}>
            <CustomCard style={styles.gridCard}>
              <View style={styles.metricHeader}>
                <Text style={[styles.metricLabel, { color: themeSubTextColor }]}>Ticket Médio</Text>
                <Ionicons name="receipt-outline" size={20} color="#8b5cf6" />
              </View>
              <Text style={[styles.metricValue, { color: themeTextColor }]}>
                {formatCurrency(stats?.averageTicket)}
              </Text>
              <Text style={[styles.metricSubText, { color: themeSubTextColor }]}>Por pedido</Text>
            </CustomCard>

            <CustomCard style={styles.gridCard}>
              <View style={styles.metricHeader}>
                <Text style={[styles.metricLabel, { color: themeSubTextColor }]}>Produtos Alerta</Text>
                <Ionicons name="cube-outline" size={20} color="#ef4444" />
              </View>
              <Text style={[styles.metricValue, { color: themeTextColor }]}>
                {stats?.lowStock?.length || 0}
              </Text>
              <Text style={[styles.metricSubText, { color: themeSubTextColor }]}>Necessitam reposição</Text>
            </CustomCard>
          </View>

          {/* Gráfico de Vendas Semanais */}
          <CustomCard>
            <Text style={[styles.sectionTitle, { color: themeTextColor }]}>Vendas Recentes</Text>
            {renderChart()}
          </CustomCard>

          {/* Top 5 Produtos Vendidos */}
          <CustomCard>
            <Text style={[styles.sectionTitle, { color: themeTextColor, marginBottom: 12 }]}>Produtos Mais Vendidos</Text>
            {stats?.topProducts && stats.topProducts.length > 0 ? (
              stats.topProducts.map((p, idx) => (
                <View 
                  key={idx} 
                  style={[
                    styles.productRow, 
                    idx < stats.topProducts.length - 1 && { borderBottomWidth: 1, borderBottomColor: themeBorderColor }
                  ]}
                >
                  <View style={styles.productIndexBadge}>
                    <Text style={styles.productIndexText}>{idx + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.productName, { color: themeTextColor }]}>{p.name}</Text>
                    <Text style={[styles.productDetails, { color: themeSubTextColor }]}>{p.count} unid. vendidas</Text>
                  </View>
                  <Text style={[styles.productRevenue, { color: themeTextColor }]}>
                    {formatCurrency(p.revenue)}
                  </Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={{ color: themeSubTextColor }}>Nenhum produto registrado neste período.</Text>
              </View>
            )}
          </CustomCard>

        </ScrollView>
      )}
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
  welcomeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  titleText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 12,
  },
  scrollContainer: {
    padding: 24,
    paddingTop: 12,
  },
  alertBanner: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    alignItems: 'center',
  },
  alertTitle: {
    color: '#92400e',
    fontWeight: 'bold',
    fontSize: 14,
  },
  alertDescription: {
    color: '#b45309',
    fontSize: 12,
    marginTop: 2,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  gridCard: {
    flex: 1,
    padding: 16,
    marginBottom: 0,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  metricSubText: {
    fontSize: 11,
  },
  growthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  emptyContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyChartContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartWrapper: {
    height: 160,
    justifyContent: 'flex-end',
    paddingTop: 12,
  },
  chartBarsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: '100%',
  },
  chartCol: {
    alignItems: 'center',
    flex: 1,
  },
  barBackground: {
    width: 14,
    height: 90,
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  barActive: {
    width: '100%',
    borderRadius: 8,
  },
  chartDateLabel: {
    fontSize: 9,
    fontWeight: '600',
  },
  chartValueLabel: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  productIndexBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  productIndexText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748b',
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
  },
  productDetails: {
    fontSize: 12,
    marginTop: 2,
  },
  productRevenue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});
