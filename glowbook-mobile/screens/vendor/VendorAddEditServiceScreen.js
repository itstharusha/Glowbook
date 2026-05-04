import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar, ScrollView, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Picker } from '@react-native-picker/picker';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import theme from '../../constants/theme';

const InputRow = ({ label, value, onChangeText, multiline = false, ...props }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={[styles.input, multiline && styles.textArea]}
      value={value}
      onChangeText={onChangeText}
      placeholderTextColor={theme.labelTertiary}
      multiline={multiline}
      {...props}
    />
  </View>
);

const VendorAddEditServiceScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();

  const editId = route.params?.id || null;
  const editService = route.params?.service || null;

  const [loading, setLoading] = useState(false);
  const [serviceData, setServiceData] = useState({
    name: editService?.name || '',
    description: editService?.description || '',
    category: editService?.category || 'Hair',
    price: editService?.price?.toString() || '',
    duration: editService?.duration?.toString() || '',
    isActive: editService?.isActive ?? true,
  });

  const handleSubmit = async () => {
    if (!serviceData.name.trim()) {
      Alert.alert('Missing Information', 'Please enter a name for this service.');
      return;
    }
    if (!serviceData.price) {
      Alert.alert('Missing Information', 'Please enter a price for this service.');
      return;
    }
    const priceNum = parseFloat(serviceData.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid price greater than $0.');
      return;
    }
    if (!serviceData.duration) {
      Alert.alert('Missing Information', 'Please enter the duration of this service in minutes.');
      return;
    }
    const durationNum = parseInt(serviceData.duration, 10);
    if (isNaN(durationNum) || durationNum <= 0) {
      Alert.alert('Invalid Duration', 'Please enter a valid duration in minutes (e.g. 30, 60).');
      return;
    }
    setLoading(true);
    try {
      if (editId) {
        await api.put(`/api/services/${editId}`, serviceData);
      } else {
        await api.post('/api/services', { ...serviceData, salonId: user.ownedSalon });
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert('Something Went Wrong', 'We could not save this service. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color={theme.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{editId ? 'Edit Service' : 'Add Service'}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.formContainer}>
          <InputRow label="Service Name" value={serviceData.name} onChangeText={(t) => setServiceData({ ...serviceData, name: t })} placeholder="e.g. Women's Haircut" />

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.pickerContainer}>
              <Picker selectedValue={serviceData.category} onValueChange={(v) => setServiceData({ ...serviceData, category: v })} style={styles.picker}>
                <Picker.Item label="Hair" value="Hair" />
                <Picker.Item label="Nails" value="Nails" />
                <Picker.Item label="Skin" value="Skin" />
                <Picker.Item label="Makeup" value="Makeup" />
                <Picker.Item label="Spa" value="Spa" />
              </Picker>
            </View>
          </View>

          <InputRow label="Description" value={serviceData.description} onChangeText={(t) => setServiceData({ ...serviceData, description: t })} multiline />
          
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <View style={{ flex: 1 }}>
              <InputRow label="Price ($)" value={serviceData.price.toString()} onChangeText={(t) => setServiceData({ ...serviceData, price: t })} keyboardType="numeric" placeholder="0.00" />
            </View>
            <View style={{ flex: 1 }}>
              <InputRow label="Duration (mins)" value={serviceData.duration.toString()} onChangeText={(t) => setServiceData({ ...serviceData, duration: t })} keyboardType="numeric" placeholder="60" />
            </View>
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.label}>Active</Text>
            <Switch
              value={serviceData.isActive}
              onValueChange={(v) => setServiceData({ ...serviceData, isActive: v })}
              trackColor={{ false: theme.systemGray4, true: theme.primary }}
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.footerAction}>
        <TouchableOpacity onPress={handleSubmit} disabled={loading} activeOpacity={0.8}>
          <LinearGradient colors={[theme.primary, '#E40E5A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitButton}>
            <Text style={styles.submitButtonText}>{loading ? 'Saving...' : 'Save Service'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.backgroundSecondary },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, height: 44, backgroundColor: theme.background, borderBottomWidth: 1, borderBottomColor: theme.separator },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 17, fontWeight: '600', color: theme.labelPrimary },
  headerRight: { width: 44 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  formContainer: { backgroundColor: theme.background, borderRadius: 12, padding: 16, ...theme.shadows.card },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '500', color: theme.labelSecondary, marginBottom: 8 },
  input: { backgroundColor: theme.backgroundSecondary, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: theme.labelPrimary, borderWidth: 1, borderColor: 'transparent' },
  textArea: { height: 100, textAlignVertical: 'top' },
  pickerContainer: { backgroundColor: theme.backgroundSecondary, borderRadius: 8, overflow: 'hidden' },
  picker: { height: 50 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  footerAction: { padding: 16, backgroundColor: theme.background, borderTopWidth: 1, borderTopColor: theme.separator },
  submitButton: { height: 56, borderRadius: 14, justifyContent: 'center', alignItems: 'center', shadowColor: theme.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  submitButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '600' },
});

export default VendorAddEditServiceScreen;
