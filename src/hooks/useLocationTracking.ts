import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

const INTERVAL_MS = 8000;

export function useLocationTracking() {
  const { profile } = useAuth();
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pushLocation = useCallback(async () => {
    if (!profile?.id) return;
    const { coords } = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    await supabase
      .from('profiles')
      .update({ lat: coords.latitude, lng: coords.longitude, updated_at: new Date().toISOString() })
      .eq('id', profile.id);
  }, [profile?.id]);

  const startTracking = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setError('Permiso de ubicación denegado');
      return;
    }
    setError(null);
    setIsTracking(true);
    await supabase.from('profiles').update({ is_online: true }).eq('id', profile!.id);
    await pushLocation();
    intervalRef.current = setInterval(pushLocation, INTERVAL_MS);
  }, [profile?.id, pushLocation]);

  const stopTracking = useCallback(async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setIsTracking(false);
    if (profile?.id) {
      await supabase.from('profiles').update({ is_online: false }).eq('id', profile.id);
    }
  }, [profile?.id]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return { isTracking, startTracking, stopTracking, error };
}
