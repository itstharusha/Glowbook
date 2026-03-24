import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Image, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import theme from '../../constants/theme';

const VendorSalonScreen = () => {
  const [salon, setSalon] = useState(null);
  const [services, setServices] = useState([]);
  const [stylists, setStylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('services');

  const loadData = async () => {
    try {
      const salonRes = await api.get('/api/salons/my');
      const salonData = salonRes.data.data;
      setSalon(salonData);

      if (salonData) {
        const [servicesRes, stylistsRes] = await Promise.all([
          api.get(`/api/services/salon/${salonData._id}`),
          api.get(`/api/stylists/salon/${salonData._id}`)
        ]);
        setServices(servicesRes.data.data || []);
        setStylists(stylistsRes.data.data || []);
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

  if (loading) return <View style={styles.center}><Text>Loading Salon...</Text></View>;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Salon</Text>
        <TouchableOpacity onPress={() => alert('Navigate to Edit Salon')}>
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
        <View style={styles.heroSection}>
          <View style={styles.heroPlaceholder}>
            <Ionicons name="image-outline" size={48} color={theme.systemGray3} />
            <TouchableOpacity style={styles.editPhotosBtn} onPress={() => alert('Edit Photos')}>
              <Text style={styles.editPhotosText}>Edit Photos</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.salonName}>{salon?.name}</Text>
          <Text style={styles.location}><Ionicons name="location-outline" size={14}/> {salon?.location}</Text>
          <Text style={styles.description}>{salon?.description}</Text>
        </View>

        <View style={styles.tabsContainer}>
          <TouchableOpacity style={[styles.tab, activeTab === 'services' && styles.activeTab]} onPress={() => setActiveTab('services')}>
            <Text style={[styles.tabText, activeTab === 'services' && styles.activeTabText]}>Services</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'stylists' && styles.activeTab]} onPress={() => setActiveTab('stylists')}>
            <Text style={[styles.tabText, activeTab === 'stylists' && styles.activeTabText]}>Stylists</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabContent}>
          {activeTab === 'services' && (
            <View>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Services ({services.length})</Text>
                <TouchableOpacity onPress={() => alert('Navigate to Add Service')}><Ionicons name="add" size={24} color={theme.primary}/></TouchableOpacity>
              </View>
              {services.map(s => (
                <TouchableOpacity key={s._id} style={styles.listItem} onPress={() => alert('Navigate to Edit Service')}>
                  <View style={styles.listInfo}>
                    <Text style={styles.listTitle}>{s.name}</Text>
                    <Text style={styles.listSubtitle}>{s.duration} min • ${s.price}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={theme.systemGray3} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {activeTab === 'stylists' && (
            <View>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Stylists ({stylists.length})</Text>
                <TouchableOpacity onPress={() => alert('Navigate to Add Stylist')}><Ionicons name="add" size={24} color={theme.primary}/></TouchableOpacity>
              </View>
              {stylists.map(s => (
                <TouchableOpacity key={s._id} style={styles.listItem} onPress={() => alert('Navigate to Edit Stylist')}>
                  <View style={styles.listInfo}>
                    <Text style={styles.listTitle}>{s.name}</Text>
                    <Text style={styles.listSubtitle}>{s.specializations?.join(', ') || 'Stylist'}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={theme.systemGray3} />
                </TouchableOpacity>
              ))}
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: theme.background, borderBottomWidth: 1, borderBottomColor: theme.separator },
  headerTitle: { fontSize: 17, fontWeight: '600', color: theme.labelPrimary },
  editText: { color: theme.primary, fontSize: 17 },
  heroSection: { height: 200, backgroundColor: theme.systemGray6 },
  heroPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  editPhotosBtn: { position: 'absolute', bottom: 16, right: 16, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  editPhotosText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  infoSection: { padding: 16, backgroundColor: theme.background, marginBottom: 12 },
  salonName: { fontSize: 24, fontWeight: 'bold', color: theme.labelPrimary, marginBottom: 8 },
  location: { fontSize: 14, color: theme.labelSecondary, marginBottom: 12 },
  description: { fontSize: 15, color: theme.labelPrimary, lineHeight: 22 },
  tabsContainer: { flexDirection: 'row', backgroundColor: theme.background, borderBottomWidth: 1, borderBottomColor: theme.separator },
  tab: { flex: 1, paddingVertical: 16, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: theme.primary },
  tabText: { fontSize: 15, fontWeight: '500', color: theme.labelSecondary },
  activeTabText: { color: theme.primary, fontWeight: '600' },
  tabContent: { padding: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: theme.labelPrimary },
  listItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.background, padding: 16, borderRadius: 12, marginBottom: 12, ...theme.shadows.card },
  listInfo: { flex: 1 },
  listTitle: { fontSize: 16, fontWeight: '600', color: theme.labelPrimary, marginBottom: 4 },
  listSubtitle: { fontSize: 14, color: theme.labelSecondary },
});

export default VendorSalonScreen;
