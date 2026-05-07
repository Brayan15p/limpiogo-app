import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, Animated, Dimensions,
  FlatList, Image, Modal, Pressable, StatusBar,
  StyleSheet, Text, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { Colors, Radius, Shadow, Spacing, Typography } from '../../theme';

const { width: W } = Dimensions.get('window');
const ITEM_SIZE = (W - Spacing.xl * 2 - Spacing.sm * 2) / 3;

type Photo = { id: string; url: string; caption?: string; created_at: string };

function PhotoItem({ photo, onDelete, onExpand }: { photo: Photo; onDelete: () => void; onExpand: () => void }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleLongPress = () => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 0.92, useNativeDriver: true, speed: 30 }),
      Animated.spring(scaleAnim, { toValue: 1,    useNativeDriver: true, speed: 30 }),
    ]).start(() => {
      Alert.alert('Eliminar foto', '¿Quieres eliminar esta foto de tu portafolio?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: onDelete },
      ]);
    });
  };

  return (
    <Pressable onLongPress={handleLongPress} onPress={onExpand}>
      <Animated.View style={[styles.photoItem, { transform: [{ scale: scaleAnim }] }]}>
        <Image source={{ uri: photo.url }} style={styles.photoImg} resizeMode="cover" />
        <View style={styles.photoOverlay}>
          <Ionicons name="expand-outline" size={14} color="rgba(255,255,255,0.8)" />
        </View>
      </Animated.View>
    </Pressable>
  );
}

function PhotoViewer({ photo, onClose }: { photo: Photo | null; onClose: () => void }) {
  if (!photo) return null;
  return (
    <Modal visible animationType="fade" transparent statusBarTranslucent onRequestClose={onClose}>
      <View style={viewerStyles.overlay}>
        <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.95)" />
        <Pressable style={viewerStyles.closeBtn} onPress={onClose} hitSlop={12}>
          <Ionicons name="close" size={26} color="#fff" />
        </Pressable>
        <Image source={{ uri: photo.url }} style={viewerStyles.image} resizeMode="contain" />
        {photo.caption ? (
          <View style={viewerStyles.captionWrap}>
            <Text style={viewerStyles.caption}>{photo.caption}</Text>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const viewerStyles = StyleSheet.create({
  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  closeBtn:   { position: 'absolute', top: 52, right: 20, zIndex: 10,
                width: 40, height: 40, borderRadius: 20,
                backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  image:      { width: Dimensions.get('window').width, height: Dimensions.get('window').height * 0.75 },
  captionWrap:{ position: 'absolute', bottom: 60, left: 24, right: 24 },
  caption:    { color: 'rgba(255,255,255,0.85)', fontSize: 14, textAlign: 'center' },
});

export function ProPortfolioScreen({ navigation }: any) {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [viewerPhoto, setViewerPhoto] = useState<Photo | null>(null);

  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    const { data } = await supabase
      .from('portfolio_photos')
      .select('*')
      .eq('pro_id', user?.id)
      .order('created_at', { ascending: false });
    setPhotos((data as Photo[]) ?? []);
    setLoading(false);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permisos necesarios', 'Necesitamos acceso a tu galería para subir fotos del portafolio.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: 5,
    });

    if (result.canceled || !result.assets?.length) return;
    setUploading(true);

    for (const asset of result.assets) {
      try {
        const ext = (asset.uri.split('.').pop() ?? 'jpg').toLowerCase();
        const fileName = `${user?.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const response = await fetch(asset.uri);
        const blob = await response.blob();

        const { data: uploaded, error: upErr } = await supabase.storage
          .from('portfolio')
          .upload(fileName, blob, { contentType: `image/${ext}` });

        if (upErr || !uploaded) continue;

        const { data: { publicUrl } } = supabase.storage.from('portfolio').getPublicUrl(uploaded.path);

        await supabase.from('portfolio_photos').insert({
          pro_id: user?.id,
          url: publicUrl,
          storage_path: uploaded.path,
        });
      } catch (_) {
        // foto individual falla silenciosamente, continúa con las demás
      }
    }

    setUploading(false);
    loadPhotos();
  };

  const deletePhoto = async (photo: Photo) => {
    await supabase.from('portfolio_photos').delete().eq('id', photo.id);
    setPhotos(prev => prev.filter(p => p.id !== photo.id));
  };

  const renderItem = ({ item }: { item: Photo | 'add' }) => {
    if (item === 'add') {
      return (
        <Pressable style={styles.addBtn} onPress={pickImage}>
          {uploading ? (
            <ActivityIndicator color={Colors.proAccent} />
          ) : (
            <>
              <View style={styles.addIcon}>
                <Ionicons name="add" size={24} color={Colors.proAccent} />
              </View>
              <Text style={styles.addText}>Agregar</Text>
            </>
          )}
        </Pressable>
      );
    }
    return <PhotoItem photo={item} onDelete={() => deletePhoto(item)} onExpand={() => setViewerPhoto(item)} />;
  };

  const listData: (Photo | 'add')[] = ['add', ...photos];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.sky50} />
      <PhotoViewer photo={viewerPhoto} onClose={() => setViewerPhoto(null)} />
      <SafeAreaView edges={['top']} style={styles.safe}>

        <LinearGradient colors={[Colors.sky100, Colors.sky50]} style={styles.header}>
          <View style={styles.headerRow}>
            <Pressable style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={8}>
              <Ionicons name="arrow-back" size={20} color={Colors.ink} />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Mi portafolio</Text>
              <Text style={styles.headerSub}>{photos.length} foto{photos.length !== 1 ? 's' : ''}</Text>
            </View>
          </View>
        </LinearGradient>

        {loading ? (
          <View style={styles.loadWrap}>
            <ActivityIndicator size="large" color={Colors.proAccent} />
          </View>
        ) : (
          <FlatList
            data={listData}
            keyExtractor={(item, i) => typeof item === 'string' ? 'add' : item.id}
            numColumns={3}
            contentContainerStyle={styles.grid}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <>
                {/* Banner tips */}
                <View style={styles.tipBanner}>
                  <Ionicons name="bulb" size={18} color={Colors.warn} />
                  <Text style={styles.tipText}>Los pros con fotos reales reciben <Text style={styles.tipBold}>3x más contratos</Text>. Muestra tu mejor trabajo.</Text>
                </View>

                {photos.length === 0 && (
                  <View style={styles.emptyWrap}>
                    <Text style={styles.emptyEmoji}>📸</Text>
                    <Text style={styles.emptyTitle}>Sin fotos aún</Text>
                    <Text style={styles.emptySub}>Sube fotos de antes/después de tus trabajos para generar más confianza</Text>
                  </View>
                )}
              </>
            }
            renderItem={renderItem}
            columnWrapperStyle={styles.row}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:     { flex: 1, backgroundColor: Colors.bg },
  safe:     { flex: 1 },
  loadWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header:    { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  backBtn:   { width: 38, height: 38, borderRadius: Radius.md, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  headerTitle: { ...Typography.h3, color: Colors.ink },
  headerSub:   { ...Typography.small, color: Colors.ink3, marginTop: 2 },

  grid:  { padding: Spacing.xl },
  row:   { marginBottom: Spacing.sm, gap: Spacing.sm },

  tipBanner: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: Colors.warnLight, borderRadius: Radius.xl, padding: Spacing.lg, marginBottom: Spacing.xl, borderWidth: 1, borderColor: '#FDE68A' },
  tipText:   { ...Typography.small, color: '#92400E', flex: 1, marginLeft: Spacing.sm, lineHeight: 18 },
  tipBold:   { fontWeight: '700' },

  emptyWrap:  { alignItems: 'center', paddingVertical: Spacing.xxxl },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { ...Typography.h4, color: Colors.ink, marginBottom: Spacing.sm },
  emptySub:   { ...Typography.body, color: Colors.ink3, textAlign: 'center', lineHeight: 22 },

  addBtn:  { width: ITEM_SIZE, height: ITEM_SIZE, borderRadius: Radius.xl, backgroundColor: Colors.proLight, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderStyle: 'dashed', borderColor: Colors.proAccent },
  addIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  addText: { ...Typography.caption, color: Colors.proAccent, fontWeight: '700' },

  photoItem:   { width: ITEM_SIZE, height: ITEM_SIZE, borderRadius: Radius.xl, overflow: 'hidden' },
  photoImg:    { width: '100%', height: '100%' },
  photoOverlay:{ position: 'absolute', bottom: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 6, padding: 3 },
});
