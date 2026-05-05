import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View,
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Radius, Shadow, Spacing, Typography } from '../../theme';

const BOGOTA: Region = { latitude: 4.711, longitude: -74.0721, latitudeDelta: 0.05, longitudeDelta: 0.05 };

export function MapPickerScreen({ navigation, route }: any) {
  const { onConfirm } = route.params as {
    onConfirm: (data: { lat: number; lng: number; label: string }) => void;
  };

  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState<Region>(BOGOTA);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const { coords } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const r = { ...region, latitude: coords.latitude, longitude: coords.longitude };
        setRegion(r);
        reverseGeocode(coords.latitude, coords.longitude);
      }
      setLoading(false);
    })();
  }, []);

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const [result] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (result) {
        const parts = [result.street, result.streetNumber, result.district, result.city].filter(Boolean);
        setAddress(parts.join(', '));
      }
    } catch {
      setAddress('');
    }
  };

  const onRegionChangeComplete = (r: Region) => {
    setRegion(r);
    reverseGeocode(r.latitude, r.longitude);
  };

  const confirm = () => {
    onConfirm({ lat: region.latitude, lng: region.longitude, label: address });
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={24} color={Colors.ink} />
        </Pressable>
        <Text style={styles.title}>Elige tu dirección</Text>
      </View>

      {/* Address bar */}
      <View style={styles.addressBar}>
        <Ionicons name="location" size={18} color={Colors.primary} />
        <TextInput
          style={styles.addressInput}
          value={address}
          onChangeText={setAddress}
          placeholder="Mueve el mapa o escribe una dirección"
          placeholderTextColor={Colors.ink4}
        />
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        {loading ? (
          <ActivityIndicator style={StyleSheet.absoluteFill} size="large" color={Colors.primary} />
        ) : (
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            initialRegion={region}
            onRegionChangeComplete={onRegionChangeComplete}
            showsUserLocation
            showsMyLocationButton={false}
          />
        )}

        {/* Pin centrado */}
        <View style={styles.pinWrapper} pointerEvents="none">
          <Ionicons name="location" size={40} color={Colors.primary} />
          <View style={styles.pinShadow} />
        </View>

        {/* Botón "mi ubicación" */}
        <Pressable
          style={styles.myLocation}
          onPress={async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return;
            const { coords } = await Location.getCurrentPositionAsync({});
            const r = { ...region, latitude: coords.latitude, longitude: coords.longitude };
            setRegion(r);
            mapRef.current?.animateToRegion(r, 500);
            reverseGeocode(coords.latitude, coords.longitude);
          }}
        >
          <Ionicons name="locate" size={22} color={Colors.primary} />
        </Pressable>
      </View>

      {/* Confirmar */}
      <View style={styles.footer}>
        <Text style={styles.footerAddress} numberOfLines={2}>{address || 'Ajusta el pin en el mapa'}</Text>
        <Pressable style={styles.confirmBtn} onPress={confirm}>
          <Text style={styles.confirmText}>Confirmar ubicación</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.bg },
  header:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: 12 },
  back:         { marginRight: 12 },
  title:        { ...Typography.h3, color: Colors.ink },
  addressBar:   { flexDirection: 'row', alignItems: 'center', marginHorizontal: Spacing.md, marginBottom: 8,
                  backgroundColor: '#fff', borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 8,
                  ...Shadow.sm, gap: 8 },
  addressInput: { flex: 1, ...Typography.body, color: Colors.ink },
  mapContainer: { flex: 1, position: 'relative' },
  pinWrapper:   { position: 'absolute', top: '50%', left: '50%',
                  transform: [{ translateX: -20 }, { translateY: -40 }] },
  pinShadow:    { width: 10, height: 4, borderRadius: 5, backgroundColor: 'rgba(0,0,0,0.2)',
                  alignSelf: 'center', marginTop: -4 },
  myLocation:   { position: 'absolute', right: 16, bottom: 16, width: 44, height: 44,
                  borderRadius: 22, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
                  ...Shadow.md },
  footer:       { backgroundColor: '#fff', padding: Spacing.md, ...Shadow.lg },
  footerAddress:{ ...Typography.small, color: Colors.ink2, marginBottom: 12 },
  confirmBtn:   { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingVertical: 14,
                  alignItems: 'center' },
  confirmText:  { ...Typography.smallBold, color: '#fff' },
});
