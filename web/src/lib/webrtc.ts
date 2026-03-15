export type VoiceScope = { kind: 'global' } | { kind: 'team'; teamId: string }

export function scopeKey(scope: VoiceScope): string {
  return scope.kind === 'global' ? 'global' : `team:${scope.teamId}`
}
