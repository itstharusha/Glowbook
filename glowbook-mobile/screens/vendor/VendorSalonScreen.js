import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, StatusBar, Alert, FlatList, Image, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import theme from '../../constants/theme';
import PortfolioCard from '../../components/PortfolioCard';

const VendorSalonScreen = ({ navigation }) => {
  const [salon, setSalon] = useState(null);
  const [services, setServices] = useState([]);
  const [stylists, setStylists] = useState([]);
  const [portfolioItems, setPortfolioItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('services');

  const loadData = async () => {
    try {
      const salonRes = await api.get('/api/salons/my');
      const salonData = salonRes.data.data;
      setSalon(salonData);

      if (salonData) {
        const [servicesRes, stylistsRes, portfolioRes] = await Promise.all([
          api.get(`/api/services/salon/${salonData._id}`),
          api.get(`/api/stylists/salon/${salonData._id}`),
          api.get('/api/portfolio/my'),
        ]);
        setServices(servicesRes.data.data || []);
        setStylists(stylistsRes.data.data || []);
        setPortfolioItems(portfolioRes.data.data || []);
      }
    } catch (error) {
      console.error('Error loading salon:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleDeletePortfolio = (item) => {
    Alert.alert(
      'Delete Portfolio Item',
      `Delete "${item.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/api/portfolio/${item._id}`);
              setPortfolioItems(prev => prev.filter(i => i._id !== item._id));
            } catch {
              Alert.alert('Error', 'Failed to delete portfolio item.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Salon</Text>
        <TouchableOpacity onPress={() => navigation.navigate('VendorEditSalon')}>
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
        <View style={styles.heroSection}>
          {salon?.images?.length > 0 ? (
            <Image source={{ uri: salon.images[0] }} style={styles.heroImage} resizeMode="cover" />
          ) : (
            <View style={styles.heroPlaceholder}>
              <Ionicons name="image-outline" size={48} color={theme.systemGray3} />
            </View>
          )}
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.salonName}>{salon?.name}</Text>
          <Text style={styles.location}>
            <Ionicons name="location-outline" size={14} /> {salon?.location}
          </Text>
          <Text style={styles.description}>{salon?.description}</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'services' && styles.activeTab]}
            onPress={() => setActiveTab('services')}
          >
            <Text style={[styles.tabText, activeTab === 'services' && styles.activeTabText]}>Services</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'stylists' && styles.activeTab]}
            onPress={() => setActiveTab('stylists')}
          >
            <Text style={[styles.tabText, activeTab === 'stylists' && styles.activeTabText]}>Stylists</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'portfolio' && styles.activeTab]}
            onPress={() => setActiveTab('portfolio')}
          >
            <Text style={[styles.tabText, activeTab === 'portfolio' && styles.activeTabText]}>Portfolio</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {activeTab === 'services' && (
            <View>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Services ({services.length})</Text>
                <TouchableOpacity onPress={() => navigation.navigate('VendorAddEditService')}>
                  <Ionicons name="add" size={24} color={theme.primary} />
                </TouchableOpacity>
              </View>
              {services.map(s => (
                <TouchableOpacity
                  key={s._id}
                  style={styles.listItem}
                  onPress={() => navigation.navigate('VendorAddEditService', { id: s._id })}
                >
                  <View style={styles.listInfo}>
                    <Text style={styles.listTitle}>{s.name}</Text>
                    <Text style={styles.listSubtitle}>{s.duration} min • ${s.price}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={theme.systemGray3} />
                </TouchableOpacity>
              ))}
              {services.length === 0 && (
                <Text style={styles.emptyTabText}>No services yet. Tap + to add one.</Text>
              )}
            </View>
          )}

          {activeTab === 'stylists' && (
            <View>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Stylists ({stylists.length})</Text>
                <TouchableOpacity onPress={() => navigation.navigate('VendorAddEditStylist')}>
                  <Ionicons name="add" size={24} color={theme.primary} />
                </TouchableOpacity>
              </View>
              {stylists.map(s => (
                <TouchableOpacity
                  key={s._id}
                  style={styles.listItem}
                  onPress={() => navigation.navigate('VendorAddEditStylist', { id: s._id })}
                >
                  <View style={styles.listInfo}>
                    <Text style={styles.listTitle}>{s.name}</Text>
                    <Text style={styles.listSubtitle}>{s.specializations?.join(', ') || 'Stylist'}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={theme.systemGray3} />
                </TouchableOpacity>
              ))}
              {stylists.length === 0 && (
                <Text style={styles.emptyTabText}>No stylists yet. Tap + to add one.</Text>
              )}
            </View>
          )}

          {activeTab === 'portfolio' && (
            <View>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Portfolio ({portfolioItems.length})</Text>
                <TouchableOpacity onPress={() => navigation.navigate('VendorAddEditPortfolio')}>
                  <Ionicons name="add" size={24} color={theme.primary} />
                </TouchableOpacity>
              </View>
              {portfolioItems.map(item => (
                <PortfolioCard
                  key={item._id}
                  item={item}
                  showActions={true}
                  onPress={() => navigation.navigate('VendorAddEditPortfolio', { item })}
                  onEdit={() => navigation.navigate('VendorAddEditPortfolio', { item })}
                  onDelete={() => handleDeletePortfolio(item)}
                />
              ))}
              {portfolioItems.length === 0 && (
                <View style={styles.emptyPortfolio}>
                  <Ionicons name="images-outline" size={48} color={theme.systemGray3} />
                  <Text style={styles.emptyTabText}>No portfolio items yet.</Text>
                  <TouchableOpacity
                    style={styles.addPortfolioBtn}
                    onPress={() => navigation.navigate('VendorAddEditPortfolio')}
                  >
                    <Text style={styles.addPortfolioBtnText}>Add First Item</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.backgroundSecondary },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, backgroundColor: theme.background,
    borderBottomWidth: 1, borderBottomColor: theme.separator,
  },
  headerTitle: { fontSize: 17, fontWeight: '600', color: theme.labelPrimary },
  editText: { color: theme.primary, fontSize: 17 },
  heroSection: { height: 200, backgroundColor: theme.systemGray6 },
  heroImage: { width: '100%', height: 200 },
  heroPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  infoSection: { padding: 16, backgroundColor: theme.background, marginBottom: 12 },
  salonName: { fontSize: 24, fontWeight: 'bold', color: theme.labelPrimary, marginBottom: 8 },
  location: { fontSize: 14, color: theme.labelSecondary, marginBottom: 12 },
  description: { fontSize: 15, color: theme.labelPrimary, lineHeight: 22 },
  tabsContainer: {
    flexDirection: 'row', backgroundColor: theme.background,
    borderBottomWidth: 1, borderBottomColor: theme.separator,
  },
  tab: {
    flex: 1, paddingVertical: 14, alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  activeTab: { borderBottomColor: theme.primary },
  tabText: { fontSize: 14, fontWeight: '500', color: theme.labelSecondary },
  activeTabText: { color: theme.primary, fontWeight: '600' },
  tabContent: { padding: 16 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16,
  },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: theme.labelPrimary },
  listItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: theme.background,
    padding: 16, borderRadius: 12, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 3, elevation: 2,
  },
  listInfo: { flex: 1 },
  listTitle: { fontSize: 16, fontWeight: '600', color: theme.labelPrimary, marginBottom: 4 },
  listSubtitle: { fontSize: 14, color: theme.labelSecondary },
  emptyTabText: {
    textAlign: 'center', color: theme.labelSecondary, fontSize: 14,
    marginTop: 8, marginBottom: 12,
  },
  emptyPortfolio: { alignItems: 'center', paddingVertical: 24 },
  addPortfolioBtn: {
    marginTop: 12, backgroundColor: theme.primary,
    borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10,
  },
  addPortfolioBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});

export default VendorSalonScreen;
