import React, { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { EmptyState, EscalationCard, ScreenHeader } from '../components';
import { mockEscalations } from '../mock';
import type { RootStackParamList, TabParamList } from '../navigation/types';
import { colors, spacing } from '../theme';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Escalations'>,
  NativeStackScreenProps<RootStackParamList>
>;

/**
 * Escalations screen.
 *
 * Open escalations are sorted with high-urgency first because — by design —
 * that's the *only* reason a business owner opens this tab. Resolved cards
 * slide down to a secondary section so the screen feels productive after
 * the owner acts on a card.
 */
export function EscalationsScreen({ navigation }: Props) {
  const [resolved, setResolved] = useState<Set<string>>(new Set());

  const escalations = [...mockEscalations].sort((a, b) => {
    // High urgency first, then medium, then low.
    const order = { high: 0, medium: 1, low: 2 } as const;
    return order[a.urgency] - order[b.urgency];
  });

  const handleResolve = (id: string) => {
    setResolved((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const openCount = escalations.length - resolved.size;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title="Escalations"
        subtitle={
          openCount === 0
            ? 'All clear — great job!'
            : `${openCount} need your attention`
        }
      />

      <FlatList
        data={escalations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          escalations.length === 0 && { flex: 1 },
        ]}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        renderItem={({ item }) => (
          <EscalationCard
            escalation={item}
            resolved={resolved.has(item.id)}
            onPress={() =>
              navigation.navigate('ConversationDetail', { id: item.id })
            }
            onResolve={() => handleResolve(item.id)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="checkmark-circle"
            title="No escalations"
            description="Nothing needs human attention right now. The AI is handling everything."
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  list: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.huge,
  },
});
