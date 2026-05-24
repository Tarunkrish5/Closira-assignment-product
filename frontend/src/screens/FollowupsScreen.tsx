import React, { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { EmptyState, FollowupCard, ScreenHeader } from '../components';
import { mockFollowups } from '../mock';
import type { RootStackParamList, TabParamList } from '../navigation/types';
import { colors, spacing } from '../theme';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Followups'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function FollowupsScreen({ navigation }: Props) {
  const [done, setDone] = useState<Set<string>>(new Set());

  // Sort by due time so the most imminent task is always first.
  const followups = [...mockFollowups].sort(
    (a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime(),
  );

  const handleDone = (id: string) => {
    setDone((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const openCount = followups.length - done.size;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title="Follow-ups"
        subtitle={
          openCount === 0
            ? "You're all caught up!"
            : `${openCount} scheduled — next one soon`
        }
      />

      <FlatList
        data={followups}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          followups.length === 0 && { flex: 1 },
        ]}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        renderItem={({ item }) => (
          <FollowupCard
            followup={item}
            done={done.has(item.id)}
            onPress={() =>
              navigation.navigate('ConversationDetail', { id: item.enquiryId })
            }
            onMarkDone={() => handleDone(item.id)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="calendar"
            title="No follow-ups scheduled"
            description="Schedule a follow-up from any conversation and it will show up here."
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
