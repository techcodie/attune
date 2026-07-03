import type { ConversationSnapshot, TurnResult } from '@cadence/types';
import { api } from '@/lib/api';

export const conversationApi = {
  snapshot: (id: string) => api.get<ConversationSnapshot>(`/interviews/${id}/conversation`),
  start: (id: string) => api.post<TurnResult>(`/interviews/${id}/start`),
  turn: (id: string, candidateText: string) =>
    api.post<TurnResult>(`/interviews/${id}/turn`, { candidateText }),
  end: (id: string) => api.post<ConversationSnapshot>(`/interviews/${id}/end`),
  restart: (id: string) => api.post<ConversationSnapshot>(`/interviews/${id}/restart`),
};
