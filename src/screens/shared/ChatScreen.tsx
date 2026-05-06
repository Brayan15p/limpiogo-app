import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { Colors, Radius, Shadow, Spacing, Typography } from '../../theme';
import { Message } from '../../types';

export function ChatScreen({ route, navigation }: any) {
  const { jobId, otherName } = route.params as { jobId: string; otherName: string };
  const { profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatRef = useRef<FlatList>(null);

  // Cargar mensajes iniciales
  const fetchMessages = useCallback(async () => {
    const { data } = await supabase
      .from('messages')
      .select('*, profiles(full_name, avatar_url)')
      .eq('job_id', jobId)
      .order('created_at', { ascending: true });
    setMessages(data ?? []);
    setLoading(false);
  }, [jobId]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  // Suscripción Realtime
  useEffect(() => {
    const channel = supabase
      .channel(`chat:${jobId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `job_id=eq.${jobId}` },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages(prev => {
            if (prev.find(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
          // Notificación local si el mensaje es del otro usuario
          if (newMsg.sender_id !== profile?.id) {
            Notifications.scheduleNotificationAsync({
              content: {
                title: otherName,
                body: newMsg.content,
                data: { jobId },
              },
              trigger: null,
            });
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [jobId, profile?.id, otherName]);

  // Marcar como leídos
  useEffect(() => {
    if (!profile) return;
    supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('job_id', jobId)
      .neq('sender_id', profile.id)
      .is('read_at', null)
      .then(() => {});
  }, [messages, jobId, profile]);

  const sendMessage = async () => {
    const content = text.trim();
    if (!content || !profile || sending) return;
    setText('');
    setSending(true);

    // Optimistic update
    const optimistic: Message = {
      id: `temp-${Date.now()}`,
      job_id: jobId,
      sender_id: profile.id,
      content,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);

    await supabase.from('messages').insert({
      job_id: jobId,
      sender_id: profile.id,
      content,
    });
    setSending(false);
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Hoy';
    if (d.toDateString() === yesterday.toDateString()) return 'Ayer';
    return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
  };

  const renderItem = ({ item, index }: { item: Message; index: number }) => {
    const isMe = item.sender_id === profile?.id;
    const prevMsg = messages[index - 1];
    const showDate = !prevMsg || formatDate(prevMsg.created_at) !== formatDate(item.created_at);
    const isTemp = item.id.startsWith('temp-');

    return (
      <>
        {showDate && (
          <View style={styles.dateSep}>
            <Text style={styles.dateSepTxt}>{formatDate(item.created_at)}</Text>
          </View>
        )}
        <View style={[styles.bubbleWrap, isMe ? styles.bubbleWrapMe : styles.bubbleWrapOther]}>
          <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther, Shadow.sm]}>
            <Text style={[styles.bubbleTxt, isMe ? styles.bubbleTxtMe : styles.bubbleTxtOther]}>
              {item.content}
            </Text>
            <View style={styles.bubbleMeta}>
              <Text style={[styles.bubbleTime, isMe && styles.bubbleTimeMe]}>
                {formatTime(item.created_at)}
              </Text>
              {isMe && (
                isTemp
                  ? <Ionicons name="time-outline" size={11} color="rgba(255,255,255,0.6)" />
                  : <Ionicons name="checkmark-done" size={11} color={item.read_at ? '#93C5FD' : 'rgba(255,255,255,0.6)'} />
              )}
            </View>
          </View>
        </View>
      </>
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView edges={['top']} style={styles.safe}>

        {/* Header */}
        <View style={[styles.header, Shadow.sm]}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={8}>
            <Ionicons name="arrow-back" size={22} color={Colors.ink} />
          </Pressable>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarTxt}>{otherName.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerName} numberOfLines={1}>{otherName}</Text>
            <View style={styles.onlineRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineTxt}>En línea</Text>
            </View>
          </View>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          {/* Mensajes */}
          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={Colors.primary} size="large" />
            </View>
          ) : (
            <FlatList
              ref={flatRef}
              data={messages}
              keyExtractor={m => m.id}
              renderItem={renderItem}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Text style={styles.emptyEmoji}>💬</Text>
                  <Text style={styles.emptyTitle}>Inicia la conversación</Text>
                  <Text style={styles.emptySub}>
                    Coordina los detalles del servicio con {otherName}
                  </Text>
                </View>
              }
            />
          )}

          {/* Input */}
          <SafeAreaView edges={['bottom']} style={styles.inputWrap}>
            <View style={[styles.inputRow, Shadow.md]}>
              <TextInput
                style={styles.input}
                placeholder="Escribe un mensaje…"
                placeholderTextColor={Colors.ink4}
                value={text}
                onChangeText={setText}
                multiline
                maxLength={500}
                returnKeyType="send"
                onSubmitEditing={sendMessage}
              />
              <Pressable
                style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
                onPress={sendMessage}
                disabled={!text.trim() || sending}
              >
                {sending
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Ionicons name="send" size={18} color="#fff" />
                }
              </Pressable>
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  safe: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    backgroundColor: Colors.surface, gap: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.sky100,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center',
  },
  headerAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  headerAvatarTxt: { fontSize: 16, fontWeight: '800', color: '#fff' },
  headerInfo: { flex: 1 },
  headerName: { ...Typography.bodyMed, color: Colors.ink },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 1 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.ok },
  onlineTxt: { ...Typography.caption, color: Colors.ok },

  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  list: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.lg, gap: 4 },

  dateSep: {
    alignItems: 'center', marginVertical: Spacing.md,
  },
  dateSepTxt: {
    ...Typography.caption, color: Colors.ink3,
    backgroundColor: Colors.sky100, borderRadius: Radius.full,
    paddingVertical: 3, paddingHorizontal: 10,
  },

  bubbleWrap: { flexDirection: 'row', marginVertical: 2 },
  bubbleWrapMe: { justifyContent: 'flex-end' },
  bubbleWrapOther: { justifyContent: 'flex-start' },

  bubble: {
    maxWidth: '78%', borderRadius: Radius.xl, paddingVertical: 9, paddingHorizontal: 13,
  },
  bubbleMe: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1, borderColor: Colors.sky100,
  },
  bubbleTxt: { ...Typography.body, lineHeight: 20 },
  bubbleTxtMe: { color: '#fff' },
  bubbleTxtOther: { color: Colors.ink },
  bubbleMeta: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3, justifyContent: 'flex-end' },
  bubbleTime: { ...Typography.caption, color: Colors.ink4 },
  bubbleTimeMe: { color: 'rgba(255,255,255,0.65)' },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: Spacing.md, paddingHorizontal: 40 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { ...Typography.h4, color: Colors.ink },
  emptySub: { ...Typography.small, color: Colors.ink3, textAlign: 'center', lineHeight: 20 },

  inputWrap: { backgroundColor: Colors.surface },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    margin: Spacing.md, gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xxl,
    borderWidth: 1, borderColor: Colors.sky200,
    paddingLeft: Spacing.lg, paddingRight: 6, paddingVertical: 6,
  },
  input: {
    flex: 1, ...Typography.body, color: Colors.ink,
    maxHeight: 100, paddingVertical: 6,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: Colors.sky200 },
});
