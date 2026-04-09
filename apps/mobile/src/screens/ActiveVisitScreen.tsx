import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import * as Location from 'expo-location';
import { endVisit, cancelVisit } from '../lib/api';

export default function ActiveVisitScreen({ route, navigation }: any) {
  const { visitId, prospectName } = route.params;
  const [elapsed, setElapsed] = useState(0);
  const [selectedResult, setSelectedResult] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [showCancel, setShowCancel] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  const formatElapsed = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}sa ${m}dk`;
    return `${m}dk ${s}s`;
  };

  const handleEnd = async () => {
    if (!selectedResult) {
      Alert.alert('Uyarı', 'Lütfen bir ziyaret sonucu seçin');
      return;
    }

    setSubmitting(true);
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const res = await endVisit(visitId, {
        result: selectedResult,
        resultNotes: notes || undefined,
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      if (res.success) {
        Alert.alert('Başarılı', 'Ziyaret sonlandırıldı', [
          { text: 'Tamam', onPress: () => navigation.navigate('Home') },
        ]);
      } else {
        Alert.alert('Hata', res.error?.message || res.message || 'Ziyaret sonlandırılamadı');
      }
    } catch (err) {
      Alert.alert('Hata', 'Konum alınamadı');
    }
    setSubmitting(false);
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      Alert.alert('Uyarı', 'İptal sebebi girmelisiniz');
      return;
    }

    setSubmitting(true);
    const res = await cancelVisit(visitId, { cancelReason: cancelReason.trim() });
    if (res.success) {
      Alert.alert('Bilgi', 'Ziyaret iptal edildi', [
        { text: 'Tamam', onPress: () => navigation.navigate('Home') },
      ]);
    } else {
      Alert.alert('Hata', res.error?.message || res.message || 'İptal edilemedi');
    }
    setSubmitting(false);
  };

  const resultOptions = [
    { key: 'positive', label: 'Yatkın', color: '#22c55e', bg: '#f0fdf4' },
    { key: 'neutral', label: 'Nötr', color: '#eab308', bg: '#fefce8' },
    { key: 'negative', label: 'Yatkın Değil', color: '#ef4444', bg: '#fef2f2' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Visit Timer */}
      <View style={styles.timerCard}>
        <View style={styles.timerDot} />
        <Text style={styles.timerLabel}>Ziyaret Süresi</Text>
        <Text style={styles.timerValue}>{formatElapsed(elapsed)}</Text>
        <Text style={styles.timerCompany}>{prospectName}</Text>
      </View>

      {showCancel ? (
        /* Cancel Section */
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ziyaret İptali</Text>
          <TextInput
            style={[styles.input, { height: 100 }]}
            placeholder="İptal sebebini yazın..."
            value={cancelReason}
            onChangeText={setCancelReason}
            multiline
            textAlignVertical="top"
          />
          <TouchableOpacity
            style={[styles.cancelConfirmBtn, submitting && styles.disabled]}
            onPress={handleCancel}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.cancelConfirmText}>İptal Et</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowCancel(false)} style={styles.backLink}>
            <Text style={styles.backLinkText}>Geri Dön</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* End Visit Section */
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ziyaret Sonucu</Text>
            <View style={styles.resultOptions}>
              {resultOptions.map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    styles.resultBtn,
                    { backgroundColor: selectedResult === opt.key ? opt.bg : '#fff', borderColor: selectedResult === opt.key ? opt.color : '#e2e8f0' },
                  ]}
                  onPress={() => setSelectedResult(opt.key)}
                >
                  <Text
                    style={[
                      styles.resultLabel,
                      { color: selectedResult === opt.key ? opt.color : '#64748b' },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notlar (Opsiyonel)</Text>
            <TextInput
              style={[styles.input, { height: 80 }]}
              placeholder="Ziyaret notlarını yazın..."
              value={notes}
              onChangeText={setNotes}
              multiline
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity
            style={[styles.endBtn, submitting && styles.disabled]}
            onPress={handleEnd}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.endBtnText}>Ziyareti Sonlandır</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelLink}
            onPress={() => setShowCancel(true)}
          >
            <Text style={styles.cancelLinkText}>Ziyareti İptal Et</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  timerCard: {
    backgroundColor: '#1e40af',
    margin: 16,
    marginTop: 60,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  timerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22c55e',
    marginBottom: 8,
  },
  timerLabel: { color: '#bfdbfe', fontSize: 14 },
  timerValue: { color: '#fff', fontSize: 40, fontWeight: 'bold', marginVertical: 4 },
  timerCompany: { color: '#bfdbfe', fontSize: 16 },

  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1e293b', marginBottom: 12 },

  resultOptions: { flexDirection: 'row', gap: 8 },
  resultBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
  },
  resultLabel: { fontWeight: '600', fontSize: 14 },

  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
  },

  endBtn: {
    backgroundColor: '#22c55e',
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  endBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  cancelLink: { alignItems: 'center', marginTop: 16 },
  cancelLinkText: { color: '#ef4444', fontSize: 15 },

  cancelConfirmBtn: {
    backgroundColor: '#ef4444',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  cancelConfirmText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  backLink: { alignItems: 'center', marginTop: 12 },
  backLinkText: { color: '#64748b', fontSize: 15 },

  disabled: { opacity: 0.5 },
});
