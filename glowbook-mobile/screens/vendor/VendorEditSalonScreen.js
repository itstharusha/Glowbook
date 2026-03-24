import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Picker } from '@react-native-picker/picker';
import api from '../../services/api';
import theme from '../../constants/theme';

const VendorEditSalonScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [salonId, setSalonId] = useState(null);

  const [salonData, setSalonData] = useState({
    name: '',
    description: '',
    location: '',
    phoneNumber: '',
    category: 'Hair',
    openingHours: '',
  });

  useEffect(() => {
    const loadSalon = async () => {
      try {
        const res = await api.get('/api/salons/my');
        if (res.data.data) {
          const s = res.data.data;
          setSalonId(s._id);
          setSalonData({
            name: s.name || '',
            description: s.description || '',
            location: s.location || '',
            phoneNumber: s.phoneNumber || '',
            category: s.category || 'Hair',
            openingHours: s.openingHours || '',
          });
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadSalon();
  }, []);

  const handleUpdateSalon = async () => {
    if (!salonId) return;
    setLoading(true);
    try {
      const response = await api.put(`/api/salons/${salonId}`, salonData);
      if (response.data.success) {
        navigation.goBack();
      } else {
        alert(response.data.message || 'Failed to update salon');
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Server error occurred');
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color={theme.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Salon</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          <InputRow label="Salon Name" value={salonData.name} onChangeText={(t) => setSalonData({ ...salonData, name: t })} />

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={salonData.category}
                onValueChange={(v) => setSalonData({ ...salonData, category: v })}
                style={styles.picker}
              >
                <Picker.Item label="Hair" value="Hair" />
                <Picker.Item label="Nails" value="Nails" />
                <Picker.Item label="Skin" value="Skin" />
                <Picker.Item label="Makeup" value="Makeup" />
                <Picker.Item label="Spa" value="Spa" />
                <Picker.Item label="Waxing" value="Waxing" />
              </Picker>
            </View>
          </View>

          <InputRow label="Description" value={salonData.description} onChangeText={(t) => setSalonData({ ...salonData, description: t })} multiline maxLength={500} />
          <InputRow label="Location / Address" value={salonData.location} onChangeText={(t) => setSalonData({ ...salonData, location: t })} />
          <InputRow label="Phone Number" value={salonData.phoneNumber} onChangeText={(t) => setSalonData({ ...salonData, phoneNumber: t })} keyboardType="phone-pad" />
          <InputRow label="Opening Hours" value={salonData.openingHours} onChangeText={(t) => setSalonData({ ...salonData, openingHours: t })} />
        </View>
      </ScrollView>

      <View style={styles.footerAction}>
        <TouchableOpacity onPress={handleUpdateSalon} disabled={loading} activeOpacity={0.8}>
          <LinearGradient
            colors={[theme.primary, '#E40E5A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitButton}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Saving Changes...' : 'Save Changes'}
            </Text>
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
  footerAction: { padding: 16, backgroundColor: theme.background, borderTopWidth: 1, borderTopColor: theme.separator },
  submitButton: { height: 56, borderRadius: 14, justifyContent: 'center', alignItems: 'center', shadowColor: theme.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  submitButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '600' },
});

export default VendorEditSalonScreen;
