import React, { useCallback, useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { getActiveVisit } from '../../lib/api';
import StickyBanner from './StickyBanner';

interface ActiveVisit {
  id: string;
  prospect?: {
    companyName?: string;
  } | null;
}

export default function ActiveVisitBanner() {
  const navigation = useNavigation<any>();
  const [activeVisit, setActiveVisit] = useState<ActiveVisit | null>(null);

  const loadActiveVisit = useCallback(async () => {
    const res = await getActiveVisit();
    if (res.success && res.data) {
      setActiveVisit(res.data as ActiveVisit);
    } else {
      setActiveVisit(null);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadActiveVisit();
    }, [loadActiveVisit]),
  );

  if (!activeVisit) return null;

  return (
    <StickyBanner
      title="Devam eden ziyaret"
      description={activeVisit.prospect?.companyName || 'Aktif müşteri ziyareti devam ediyor'}
      badge="Canlı"
      onPress={() =>
        navigation.navigate('ActiveVisit', {
          visitId: activeVisit.id,
          prospectName: activeVisit.prospect?.companyName || 'Müşteri',
        })
      }
    />
  );
}
