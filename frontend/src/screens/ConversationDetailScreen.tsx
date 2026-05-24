import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import {
  ChannelBadge,
  EmptyState,
  MessageBubble,
  StatusPill,
  TimelineEntry,
} from '../components';
import { getConversation } from '../mock';
import type { RootStackParamList } from '../navigation/types';
import { colors, radius, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ConversationDetail'>;

/**
 * Conversation detail.
 *
 * One screen, three sections in vertical priority:
 *   1. Customer header — who, channel, status
 *   2. AI summary card — saves the agent reading the whole thread
 *   3. Matched SOP — confirms why the AI did what it did
 *   4. Message thread — actual conversation
 *   5. Status timeline — audit trail of the enquiry
 *
 * Stacked top-down so the most decision-relevant info loads first.
 */
export function ConversationDetailScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const conversation = getConversation(id);

  if (!conversation) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header onBack={() => navigation.goBack()} title="Conversation" />
        <EmptyState
          icon="search"
          title="Conversation not found"
          description="We couldn't find this enquiry. It may have been resolved and archived."
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header onBack={() => navigation.goBack()} title="Conversation" />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Customer header */}
        <View style={styles.customerCard}>
          <Text style={styles.customer}>{conversation.customer}</Text>
          <View style={styles.metaRow}>
            <ChannelBadge channel={conversation.channel} size="sm" />
            <StatusPill status={conversation.status} size="sm" />
          </View>
        </View>

        {/* AI summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View style={styles.summaryIcon}>
              <Ionicons name="sparkles" size={14} color={colors.brand} />
            </View>
            <Text style={styles.summaryTitle}>AI summary</Text>
          </View>
          <Text style={styles.summaryBody}>{conversation.aiSummary}</Text>
        </View>

        {/* Matched SOP */}
        {conversation.matchedSop ? (
          <View style={styles.sopCard}>
            <Ionicons
              name="git-branch"
              size={14}
              color={colors.brandTextOnSoft}
            />
            <Text style={styles.sopLabel}>
              Matched SOP:{' '}
              <Text style={styles.sopValue}>
                {conversation.matchedSop.replace(/_/g, ' ')}
              </Text>
            </Text>
          </View>
        ) : null}

        {/* Message thread */}
        <SectionTitle title="Messages" />
        <View style={styles.thread}>
          {conversation.messages.map((m) => (
            <MessageBubble
              key={m.id}
              role={m.role}
              content={m.content}
              createdAt={m.createdAt}
            />
          ))}
        </View>

        {/* Status timeline */}
        <SectionTitle title="Status timeline" />
        <View style={styles.timeline}>
          {conversation.timeline.map((entry, i) => (
            <TimelineEntry
              key={entry.id}
              entry={entry}
              isLast={i === conversation.timeline.length - 1}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Local sub-components — these are deliberately not exported, they only make
// sense inside this screen and would just clutter the components folder.
// ---------------------------------------------------------------------------

function Header({ onBack, title }: { onBack: () => void; title: string }) {
  return (
    <View style={styles.header}>
      <Pressable
        onPress={onBack}
        style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
        accessibilityRole="button"
        accessibilityLabel="Back"
      >
        <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
      </Pressable>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.backBtn} />
    </View>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <View style={styles.sectionTitleWrap}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingBottom: spacing.huge },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: {
    ...typography.heading,
    color: colors.textPrimary,
  },

  customerCard: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  customer: {
    ...typography.title,
    color: colors.textPrimary,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },

  summaryCard: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.brandSoft,
    borderRadius: radius.lg,
    gap: spacing.sm,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  summaryIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
  },
  summaryTitle: {
    ...typography.captionMedium,
    color: colors.brandTextOnSoft,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  summaryBody: {
    ...typography.body,
    color: colors.brandTextOnSoft,
  },

  sopCard: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    alignSelf: 'flex-start',
    marginLeft: spacing.xl,
  },
  sopLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  sopValue: {
    ...typography.captionMedium,
    color: colors.brandTextOnSoft,
    textTransform: 'capitalize',
  },

  sectionTitleWrap: {
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.heading,
    color: colors.textPrimary,
  },

  thread: {
    paddingVertical: spacing.sm,
  },

  timeline: {
    paddingTop: spacing.sm,
  },
});
