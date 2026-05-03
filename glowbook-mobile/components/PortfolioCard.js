import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../constants/theme';

const PortfolioCard = ({ item, onPress, showActions = false, onEdit, onDelete }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      {/* Lead image */}
      <View style={styles.imageContainer}>
        {item.images && item.images.length > 0 ? (
          <Image source={{ uri: item.images[0] }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="image-outline" size={40} color={theme.systemGray3} />
          </View>
        )}
        {item.images && item.images.length > 1 && (
          <View style={styles.photoBadge}>
            <Ionicons name="images-outline" size={11} color="#fff" />
            <Text style={styles.photoBadgeText}>{item.images.length}</Text>
          </View>
        )}
        {!item.isPublic && (
          <View style={styles.draftBadge}>
            <Text style={styles.draftText}>Draft</Text>
          </View>
        )}
        {showActions && (
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionBtn} onPress={onEdit}>
              <Ionicons name="pencil-outline" size={16} color={theme.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={onDelete}>
              <Ionicons name="trash-outline" size={16} color={theme.destructive} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
          <View style={styles.categoryChip}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
        </View>

        {item.description ? (
          <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
        ) : null}

        {item.stylistId?.name ? (
          <Text style={styles.stylist}>
            <Ionicons name="person-outline" size={12} color={theme.labelSecondary} /> By {item.stylistId.name}
          </Text>
        ) : null}

        {item.tags && item.tags.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagsRow}>
            {item.tags.map((tag, i) => (
              <View key={i} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.background,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 180,
  },
  imagePlaceholder: {
    width: '100%',
    height: 180,
    backgroundColor: theme.systemGray6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    gap: 3,
  },
  photoBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  draftBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: theme.warning,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  draftText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  actions: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    gap: 6,
  },
  actionBtn: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 8,
    padding: 6,
  },
  deleteBtn: {},
  content: {
    padding: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.labelPrimary,
    flex: 1,
    marginRight: 8,
  },
  categoryChip: {
    backgroundColor: '#FFF0F4',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.primary,
  },
  description: {
    fontSize: 13,
    color: theme.labelSecondary,
    lineHeight: 18,
    marginBottom: 6,
  },
  stylist: {
    fontSize: 12,
    color: theme.labelSecondary,
    marginBottom: 6,
  },
  tagsRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  tag: {
    backgroundColor: theme.systemGray6,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
    marginRight: 6,
  },
  tagText: {
    fontSize: 11,
    color: theme.labelSecondary,
  },
});

export default PortfolioCard;
