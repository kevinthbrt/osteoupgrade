import * as Haptics from 'expo-haptics';

/**
 * Petits retours haptiques pour les actions clés. Silencieux si l'appareil
 * ne supporte pas le retour (ex. web / simulateur).
 */
export const tap = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
export const success = () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
export const warning = () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
export const selection = () => Haptics.selectionAsync().catch(() => {});
