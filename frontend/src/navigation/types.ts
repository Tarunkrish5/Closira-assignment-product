/**
 * Strongly-typed navigation parameter lists.
 *
 * Why this matters: every ``navigation.navigate(...)`` call in the app is now
 * type-checked. If a screen renames a param or a new param is added without a
 * default, TS will yell at every call site — no runtime "undefined param"
 * surprises.
 */
import type { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList>;
  ConversationDetail: { id: string };
};

export type TabParamList = {
  Home: undefined;
  Leads: undefined;
  Escalations: undefined;
  Followups: undefined;
};
