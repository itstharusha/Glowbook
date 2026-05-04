import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Switch,
  Image,
  Alert,
  ActivityIndicator,
  FlatList,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import theme from '../../constants/theme';

const CATEGORIES = ['Hair', 'Nails', 'Skin', 'Makeup', 'Spa', 'Waxing'];
const MAX_IMAGES = 5;

const VendorAddEditPortfolioScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const editItem = route.params?.item || null;
  const isEdit = !!editItem;

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Hair',
    tags: '',
    stylistId: '',
    isPublic: true,
  });
  const [existingImages, setExistingImages] = useState([]); // Cloudinary URLs (edit mode)
  const [newImages, setNewImages] = useState([]);            // Local { uri } objects (not yet uploaded)
  const [stylists, setStylists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [removingImage, setRemovingImage] = useState(null);

  useEffect(() => {
    loadStylists();
    if (isEdit) {
      setForm({
        title: editItem.title || '',
        description: editItem.description || '',
        category: editItem.category || 'Hair',
        tags: (editItem.tags || []).join(', '),
        stylistId: editItem.stylistId?._id || editItem.stylistId || '',
        isPublic: editItem.isPublic !== false,
      });
      setExistingImages(editItem.images || []);
    }
  }, []);

  const loadStylists = async () => {
    try {
      const salonId = user.ownedSalon;
      if (!salonId) return;
      const res = await api.get(`/api/stylists/salon/${salonId}`);
      setStylists(res.data.data || []);
    } catch (err) {
      console.error('Load stylists error:', err.message);
    }
  };

  const totalImages = existingImages.length + newImages.length;

  const pickImages = async () => {
    if (totalImages >= MAX_IMAGES) {
      Alert.alert('Photo Limit Reached', `You can add up to ${MAX_IMAGES} photos per portfolio item.`);
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
    if (!isEdit) return;
    setRemovingImage(imageUrl);
    try {
      await api.delete(`/api/portfolio/${editItem._id}/images`, { data: { imageUrl } });
      setExistingImages(prev => prev.filter(url => url !== imageUrl));
    } catch (err) {
      Alert.alert('Could Not Remove Photo', 'We could not remove that photo. Please try again.');
    } finally {
      setRemovingImage(null);
    }
  };

  const buildFormData = () => {
    const formData = new FormData();
    formData.append('title', form.title.trim());
    formData.append('description', form.description.trim());
    formData.append('category', form.category);
    formData.append('tags', form.tags.trim());
    formData.append('isPublic', String(form.isPublic));
    if (form.stylistId) formData.append('stylistId', form.stylistId);

    newImages.forEach((img, i) => {
      formData.append('images', {
        uri: img.uri,
        type: 'image/jpeg',
        name: `portfolio_${Date.now()}_${i}.jpg`,
      });
    });

    return formData;
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      Alert.alert('Missing Information', 'Please enter a title for this portfolio item.');
      return;
    }
    if (!isEdit && newImages.length === 0) {
      Alert.alert('Missing Photos', 'Please add at least one photo to your portfolio item.');
      return;
    }

    setLoading(true);
    try {
      if (isEdit) {
        await api.put(`/api/portfolio/${editItem._id}`, {
          title: form.title.trim(),
          description: form.description.trim(),
          category: form.category,
          tags: form.tags.trim(),
          stylistId: form.stylistId || null,
          isPublic: form.isPublic,
        });

        if (newImages.length > 0) {
          const formData = new FormData();
          newImages.forEach((img, i) => {
            formData.append('images', {
              uri: img.uri,
              type: 'image/jpeg',
              name: `portfolio_${Date.now()}_${i}.jpg`,
            });
          });
          await api.post(`/api/portfolio/${editItem._id}/images`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        }
      } else {
        const formData = buildFormData();
        await api.post('/api/portfolio', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      navigation.goBack();
    } catch (error) {
      Alert.alert('Something Went Wrong', 'We could not save this portfolio item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={theme.labelPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? 'Edit Portfolio Item' : 'New Portfolio Item'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Image Picker Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Photos ({totalImages}/{MAX_IMAGES})</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesRow}>
            {/* Existing images */}
            {existingImages.map((url) => (
              <View key={url} style={styles.thumbContainer}>
                <Image source={{ uri: url }} style={styles.thumb} resizeMode="cover" />
                <TouchableOpacity
                  style={styles.removeThumb}
                  onPress={() => removeExistingImage(url)}
                  disabled={removingImage === url}
                >
                  {removingImage === url
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Ionicons name="close-circle" size={20} color={theme.destructive} />
                  }
                </TouchableOpacity>
              </View>
            ))}
            {/* Newly picked images */}
            {newImages.map((img, index) => (
              <View key={`new-${index}`} style={styles.thumbContainer}>
                <Image source={{ uri: img.uri }} style={styles.thumb} resizeMode="cover" />
                <TouchableOpacity style={styles.removeThumb} onPress={() => removeNewImage(index)}>
                  <Ionicons name="close-circle" size={20} color={theme.destructive} />
                </TouchableOpacity>
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>New</Text>
                </View>
              </View>
            ))}
            {/* Add button */}
            {totalImages < MAX_IMAGES && (
              <TouchableOpacity style={styles.addImageBtn} onPress={pickImages}>
                <Ionicons name="add" size={28} color={theme.primary} />
                <Text style={styles.addImageText}>Add</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        {/* Title */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Balayage & Highlights"
            placeholderTextColor={theme.systemGray3}
            value={form.title}
            onChangeText={v => setForm(p => ({ ...p, title: v }))}
            maxLength={100}
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Description</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Describe the work, techniques used, etc."
            placeholderTextColor={theme.systemGray3}
            value={form.description}
            onChangeText={v => setForm(p => ({ ...p, description: v }))}
            multiline
            numberOfLines={3}
            maxLength={500}
          />
        </View>

        {/* Category */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Category *</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={form.category}
              onValueChange={v => setForm(p => ({ ...p, category: v }))}
              style={styles.picker}
            >
              {CATEGORIES.map(cat => (
                <Picker.Item key={cat} label={cat} value={cat} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Stylist (optional) */}
        {stylists.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Stylist (optional)</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={form.stylistId}
                onValueChange={v => setForm(p => ({ ...p, stylistId: v }))}
                style={styles.picker}
              >
                <Picker.Item label="None" value="" />
                {stylists.map(s => (
                  <Picker.Item key={s._id} label={s.name} value={s._id} />
                ))}
              </Picker>
            </View>
          </View>
        )}

        {/* Tags */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Tags (comma-separated)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. blonde, balayage, summer"
            placeholderTextColor={theme.systemGray3}
            value={form.tags}
            onChangeText={v => setForm(p => ({ ...p, tags: v }))}
          />
        </View>

        {/* isPublic toggle */}
        <View style={styles.section}>
          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.sectionLabel}>Visible to customers</Text>
              <Text style={styles.toggleHint}>Disable to save as a draft</Text>
            </View>
            <Switch
              value={form.isPublic}
              onValueChange={v => setForm(p => ({ ...p, isPublic: v }))}
              trackColor={{ false: theme.systemGray4, true: theme.primary }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Submit button */}
        <TouchableOpacity onPress={handleSubmit} disabled={loading} style={styles.submitWrapper}>
          <LinearGradient
            colors={['#FF2D6B', '#FF6B9D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitBtn}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.submitText}>{isEdit ? 'Save Changes' : 'Publish Portfolio Item'}</Text>
            }
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.backgroundGrouped,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.separator,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.labelPrimary,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    backgroundColor: theme.background,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.labelSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  input: {
    fontSize: 16,
    color: theme.labelPrimary,
    backgroundColor: theme.systemGray6,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
  },
  textarea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerWrapper: {
    backgroundColor: theme.systemGray6,
    borderRadius: 10,
    overflow: 'hidden',
  },
  picker: {
    color: theme.labelPrimary,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleHint: {
    fontSize: 12,
    color: theme.labelSecondary,
    marginTop: 2,
  },
  imagesRow: {
    flexDirection: 'row',
  },
  thumbContainer: {
    position: 'relative',
    marginRight: 10,
  },
  thumb: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },
  removeThumb: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  newBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: theme.primary,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  newBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  addImageBtn: {
    width: 80,
    height: 80,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: theme.primary,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF0F4',
  },
  addImageText: {
    fontSize: 11,
    color: theme.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  submitWrapper: {
    marginTop: 8,
  },
  submitBtn: {
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
});

export default VendorAddEditPortfolioScreen;
