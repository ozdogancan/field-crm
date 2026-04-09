import React, { useState, useEffect } from 'react';
import {
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import { endVisit, cancelVisit } from '../lib/api';
import ActionButton from '../components/ui/ActionButton';
import InfoRow from '../components/ui/InfoRow';
import InlineAlert from '../components/ui/InlineAlert';
import ScreenContainer from '../components/ui/ScreenContainer';
import SectionHeader from '../components/ui/SectionHeader';
import StatusBadge from '../components/ui/StatusBadge';
import SurfaceCard from '../components/ui/SurfaceCard';
import TextField from '../components/ui/TextField';
import VisitResultCard from '../components/ui/VisitResultCard';
import { useToast } from '../context/ToastContext';
import { theme } from '../theme';

export default function ActiveVisitScreen({ route, navigation }: any) {
  const { visitId, prospectName } = route.params;
  const { showToast } = useToast();
  const [elapsed, setElapsed] = useState(0);
  const [selectedResult, setSelectedResult] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [showCancel, setShowCancel] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [startTime] = useState(Date.now());
  const [errorMessage, setErrorMessage] = useState('');
  const [resultValidation, setResultValidation] = useState('');
  const [gpsState, setGpsState] = useState<'checking' | 'ready' | 'error'>('checking');

  const checkGps = async () => {
    setGpsState('checking');
    try {
      await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setGpsState('ready');
    } catch {
      setGpsState('error');
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  useEffect(() => {
    checkGps();
  }, []);

  const formatElapsed = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}sa ${m}dk`;
    return `${m}dk ${s}s`;
  };

  const handleEnd = async () => {
    if (!selectedResult) {
      setResultValidation('Ziyareti kapatmadan önce bir sonuç kartı seçin.');
      return;
    }

    Alert.alert(
      'Ziyareti sonlandır',
      'Ziyareti sonlandırıp günlük plana dönmek istediğinize emin misiniz?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sonlandır',
          onPress: async () => {
            setSubmitting(true);
            setErrorMessage('');
            setResultValidation('');
            try {
              const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
              const res = await endVisit(visitId, {
                result: selectedResult,
                resultNotes: notes || undefined,
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
              });

              if (res.success) {
                showToast('Ziyaret kaydedildi ve günlük plana geri dönüldü.', {
                  title: 'Başarılı',
                  tone: 'success',
                });
                Alert.alert('Başarılı', 'Ziyaret sonlandırıldı', [
                  { text: 'Tamam', onPress: () => navigation.navigate('MainTabs', { screen: 'TodayTab' }) },
                ]);
              } else {
                setErrorMessage(res.error?.message || res.message || 'Ziyaret sonlandırılamadı');
              }
            } catch (err) {
              setErrorMessage('Konum alınamadı');
            }
            setSubmitting(false);
            checkGps();
          },
        },
      ],
    );
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      Alert.alert('Uyarı', 'İptal sebebi girmelisiniz');
      return;
    }

    Alert.alert(
      'Ziyareti iptal et',
      'Bu ziyareti iptal olarak kaydetmek istediğinize emin misiniz?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'İptal Et',
          style: 'destructive',
          onPress: async () => {
            setSubmitting(true);
            setErrorMessage('');
            const res = await cancelVisit(visitId, { cancelReason: cancelReason.trim() });
            if (res.success) {
              showToast('Ziyaret iptal olarak kaydedildi.', {
                title: 'Ziyaret iptal edildi',
                tone: 'warning',
              });
              Alert.alert('Bilgi', 'Ziyaret iptal edildi', [
                { text: 'Tamam', onPress: () => navigation.navigate('MainTabs', { screen: 'TodayTab' }) },
              ]);
            } else {
              setErrorMessage(res.error?.message || res.message || 'İptal edilemedi');
            }
            setSubmitting(false);
          },
        },
      ],
    );
  };

  const resultOptions = [
    { key: 'positive', label: 'Yatkın', color: '#1F9D61', bg: '#EAF8F0' },
    { key: 'neutral', label: 'Nötr', color: '#D18A12', bg: '#FFF5E1' },
    { key: 'negative', label: 'Yatkın Değil', color: '#D64545', bg: '#FDECEC' },
  ];

  return (
    <ScreenContainer scroll contentStyle={styles.container}>
      <SurfaceCard elevated style={styles.timerCard}>
        <View style={styles.timerHeader}>
          <Text style={styles.timerLabel}>Aktif ziyaret</Text>
          <StatusBadge
            label={
              gpsState === 'ready'
                ? 'Konum aktif'
                : gpsState === 'error'
                  ? 'Konum kontrol et'
                  : 'Konum kontrol'
            }
            tone={gpsState === 'ready' ? 'success' : gpsState === 'error' ? 'warning' : 'info'}
          />
        </View>
        <Text style={styles.timerCompany}>{prospectName}</Text>
        <Text style={styles.timerValue}>{formatElapsed(elapsed)}</Text>
        <Text style={styles.timerHelper}>Süre canlı olarak güncelleniyor.</Text>
      </SurfaceCard>

      {errorMessage ? <InlineAlert title="İşlem tamamlanamadı" message={errorMessage} tone="danger" /> : null}

      {showCancel ? (
        <SurfaceCard style={styles.section}>
          <SectionHeader title="Ziyareti iptal et" subtitle="İptal sebebi zorunludur." />
          <TextField
            label="İptal nedeni"
            style={styles.multilineInput}
            placeholder="İptal sebebini yazın..."
            value={cancelReason}
            onChangeText={setCancelReason}
            multiline
            textAlignVertical="top"
          />
          <View style={styles.actionStack}>
            <ActionButton label="Ziyareti İptal Et" onPress={handleCancel} variant="danger" loading={submitting} />
            <ActionButton label="Geri Dön" onPress={() => setShowCancel(false)} variant="secondary" />
          </View>
        </SurfaceCard>
      ) : (
        <>
          <SurfaceCard style={styles.summaryCard}>
            <InfoRow label="Müşteri" value={prospectName} />
            <InfoRow
              label="Durum"
              value={
                gpsState === 'ready'
                  ? 'Konum doğrulandı, sonuç bekleniyor'
                  : gpsState === 'error'
                    ? 'Konum tekrar kontrol edilmeli'
                    : 'Konum kontrol ediliyor'
              }
              muted
            />
            {gpsState === 'error' ? (
              <InlineAlert
                message="GPS doğrulaması şu an alınamadı. Açık alana çıkıp tekrar deneyin."
                tone="warning"
              />
            ) : null}
          </SurfaceCard>

          <SurfaceCard style={styles.section}>
            <SectionHeader
              title="Ziyaret sonucu"
              subtitle="Sahadaki sonucu tek dokunuşla seçin."
            />
            {resultValidation ? (
              <InlineAlert message={resultValidation} tone="warning" />
            ) : null}
            <View style={styles.resultOptions}>
              {resultOptions.map((opt) => (
                <VisitResultCard
                  key={opt.key}
                  label={opt.label}
                  description={
                    opt.key === 'positive'
                      ? 'İleri aksiyon fırsatı var.'
                      : opt.key === 'neutral'
                        ? 'Takip gerekir, karar net değil.'
                        : 'Potansiyel düşük, kaydı net kapatın.'
                  }
                  accentColor={opt.color}
                  backgroundColor={opt.bg}
                  selected={selectedResult === opt.key}
                  onPress={() => {
                    setSelectedResult(opt.key);
                    setResultValidation('');
                  }}
                />
              ))}
            </View>
          </SurfaceCard>

          <SurfaceCard style={styles.section}>
            <SectionHeader
              title="Ziyaret notu"
              subtitle="Kısa, net ve ekibe faydalı bilgi bırakın."
            />
            <InfoRow label="Müşteri" value={prospectName} muted />
            <TextField
              label="Notlar"
              style={styles.noteInput}
              placeholder="Ziyaret notlarını yazın..."
              value={notes}
              onChangeText={setNotes}
              multiline
              textAlignVertical="top"
            />
          </SurfaceCard>

          <View style={styles.footerActions}>
            <ActionButton label="Ziyareti Sonlandır" onPress={handleEnd} variant="success" loading={submitting} />
            <ActionButton label="Konumu Yenile" onPress={checkGps} variant="secondary" disabled={submitting} />
            <ActionButton label="Ziyareti İptal Et" onPress={() => setShowCancel(true)} variant="ghost" />
          </View>
        </>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.lg,
    paddingBottom: theme.spacing['3xl'],
  },
  timerCard: {
    backgroundColor: theme.colors.primaryStrong,
    borderColor: theme.colors.primaryStrong,
    gap: theme.spacing.sm,
  },
  timerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  timerLabel: {
    color: '#C7F2EE',
    fontSize: theme.typography.bodySm,
    fontWeight: theme.fontWeight.semibold,
  },
  timerCompany: {
    color: theme.colors.surface,
    fontSize: theme.typography.titleSm,
    fontWeight: theme.fontWeight.bold,
  },
  timerValue: {
    color: theme.colors.surface,
    fontSize: theme.typography.display,
    fontWeight: theme.fontWeight.bold,
  },
  timerHelper: {
    color: '#C7F2EE',
    fontSize: theme.typography.bodySm,
  },
  section: {
    gap: theme.spacing.lg,
  },
  summaryCard: {
    gap: theme.spacing.md,
  },
  resultOptions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  noteInput: {
    minHeight: 104,
  },
  multilineInput: {
    minHeight: 120,
  },
  footerActions: {
    gap: theme.spacing.md,
  },
  actionStack: {
    gap: theme.spacing.md,
  },
});
