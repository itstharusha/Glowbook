import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, StatusBar, ScrollView, Image, ActivityIndicator, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import api from '../../services/api';
import theme from '../../constants/theme';

const MAX_IMAGES = 5;

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

const VendorEditSalonScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
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

  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [removingImage, setRemovingImage] = useState(null);

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
          setExistingImages(s.images || []);
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadSalon();
  }, []);

  const totalImages = existingImages.length + newImages.length;

  const pickImages = async () => {
    if (totalImages >= MAX_IMAGES) {
      Alert.alert('Limit reached', `You can add up to ${MAX_IMAGES} photos.`);
      return;
    }
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Please allow access to your photo library.');
      return;
    }
    const remaining = MAX_IMAGES - totalImages;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      setNewImages(prev => [...prev, ...result.assets.slice(0, remaining)]);
    }
  };

  const removeNewImage = (index) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = async (imageUrl) => {
    if (!salonId) return;
    setRemovingImage(imageUrl);
    try {
      await api.delete(`/api/salons/${salonId}/images`, { data: { imageUrl } });
      setExistingImages(prev => prev.filter(url => url !== imageUrl));
    } catch {
      Alert.alert('Could Not Remove Photo', 'We could not remove that photo. Please try again.');
    } finally {
      setRemovingImage(null);
    }
  };

  const handleUpdateSalon = async () => {
    if (!salonId) return;
    if (!salonData.name.trim()) {
      Alert.alert('Missing Information', 'Your salon must have a name.');
      return;
    }
    setLoading(true);
    try {
      if (newImages.length > 0) {
        const formData = new FormData();
        newImages.forEach((img, i) => {
          formData.append('images', {
            uri: img.uri,
            type: 'image/jpeg',
            name: `salon_${Date.now()}_${i}.jpg`,
          });
        });
        await api.post(`/api/salons/${salonId}/images`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setNewImages([]);
      }

      const response = await api.put(`/api/salons/${salonId}`, salonData);
      if (response.data.success) {
        navigation.goBack();
      } else {
        Alert.alert('Something Went Wrong', 'We could not save your changes. Please try again.');
      }
    } catch (error) {
      Alert.alert('Something Went Wrong', 'We could not save your changes. Please check your connection and try again.');
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
        <Text style={styles.headerTitle}>Edit Salon</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Photos section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Photos ({totalImages}/{MAX_IMAGES})</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesRow}>
            {existingImages.map((url) => (
              <View key={url} style={styles.thumbContainer}>
                <Image source={{ uri: url }} style={styles.thumb} resizeMode="cover" />
                <TouchableOpacity
                  style={styles.removeThumb}
                  onPress={() => removeExistingImage(url)}
                  disabled={removingImage === url}
                >
                  {removingImage === url
                    ? <ActivityIndicator size="small" color={theme.destructive} />
                    : <Ionicons name="close-circle" size={22} color={theme.destructive} />
                  }
                </TouchableOpacity>
              </View>
            ))}
            {newImages.map((img, index) => (
              <View key={`new-${index}`} style={styles.thumbContainer}>
                <Image source={{ uri: img.uri }} style={styles.thumb} resizeMode="cover" />
                <TouchableOpacity style={styles.removeThumb} onPress={() => removeNewImage(index)}>
                  <Ionicons name="close-circle" size={22} color={theme.destructive} />
                </TouchableOpacity>
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>New</Text>
                </View>
              </View>
            ))}
            {totalImages < MAX_IMAGES && (
              <TouchableOpacity style={styles.addImageBtn} onPress={pickImages}>
                <Ionicons name="add" size={28} color={theme.primary} />
                <Text style={styles.addImageText}>Add</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        {/* Text fields */}
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

      <View style={[styles.footerAction, { paddingBottom: 16 + insets.bottom }]}>
        <TouchableOpacity onPress={handleUpdateSalon} disabled={loading} activeOpacity={0.8}>
          <LinearGradient
            colors={[theme.primary, '#E40E5A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitButton}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.submitButtonText}>Save Changes</Text>
            }
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
  section: { backgroundColor: theme.background, borderRadius: 12, padding: 14, marginBottom: 12, ...theme.shadows.card },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: theme.labelSecondary, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.4 },
  imagesRow: { flexDirection: 'row' },
  thumbContainer: { position: 'relative', marginRight: 10 },
  thumb: { width: 80, height: 80, borderRadius: 10 },
  removeThumb: { position: 'absolute', top: -6, right: -6, backgroundColor: '#fff', borderRadius: 11 },
  newBadge: { position: 'absolute', bottom: 4, left: 4, backgroundColor: theme.primary, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  newBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  addImageBtn: { width: 80, height: 80, borderRadius: 10, borderWidth: 1.5, borderColor: theme.primary, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF0F4' },
  addImageText: { fontSize: 11, color: theme.primary, fontWeight: '600', marginTop: 2 },
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
