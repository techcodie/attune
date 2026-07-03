import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import {
  Speaker,
  type ConversationSnapshot,
  type CoverageReport,
  type InterviewStateDto,
  type MessageDto,
  type TurnResult,
} from '@cadence/types';
import { conversationApi } from './conversation.api';
import { interviewKeys } from '@/features/interview/useInterviews';
import { toast } from '@/features/toast/useToastStore';

let tempId = 0;

/**
 * Orchestrates one interview room: loads the transcript, auto-generates the
 * opening turn, runs each answer through the engine, and exposes the lifecycle
 * controls. Deliberately mode-agnostic — the same `sendAnswer` powers both text
 * and voice input, and all engine business logic stays on the server.
 */
export function useInterviewRoom(interviewId: string) {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [state, setState] = useState<InterviewStateDto | null>(null);
  const [coverage, setCoverage] = useState<CoverageReport | null>(null);
  const [finished, setFinished] = useState(false);
  const [lastTurn, setLastTurn] = useState<TurnResult | null>(null);
  const [thinking, setThinking] = useState(false);
  const seededRef = useRef(false);
  const startedRef = useRef(false);

  const snapshot = useQuery({
    queryKey: ['conversation', interviewId],
    queryFn: () => conversationApi.snapshot(interviewId),
    enabled: Boolean(interviewId),
    staleTime: Infinity,
  });

  const seed = useCallback((snap: ConversationSnapshot) => {
    setMessages(snap.messages);
    setState(snap.state);
    setCoverage(snap.coverage);
    setFinished(snap.finished);
  }, []);

  useEffect(() => {
    if (snapshot.data && !seededRef.current) {
      seededRef.current = true;
      seed(snapshot.data);
    }
  }, [snapshot.data, seed]);

  const applyTurn = useCallback((result: TurnResult) => {
    setMessages((prev) => [...prev, result.message]);
    setState(result.state);
    setCoverage(result.coverage);
    setFinished(result.finished);
    setLastTurn(result);
  }, []);

  // Auto-start the interview when there's no transcript yet. Guarded so the
  // opening turn is generated exactly once (no duplicate responses).
  useEffect(() => {
    if (!seededRef.current || startedRef.current || thinking) return;
    if (messages.length === 0 && !finished) {
      startedRef.current = true;
      setThinking(true);
      conversationApi
        .start(interviewId)
        .then(applyTurn)
        .catch(() => toast.error('Could not start the interview'))
        .finally(() => setThinking(false));
    }
  }, [interviewId, messages.length, finished, thinking, applyTurn, snapshot.data]);

  const sendAnswer = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || thinking || finished) return;

      setMessages((prev) => [
        ...prev,
        { id: `temp_${tempId++}`, speaker: Speaker.CANDIDATE, content: trimmed, atMs: 0 },
      ]);
      setThinking(true);
      try {
        applyTurn(await conversationApi.turn(interviewId, trimmed));
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'The interviewer had trouble responding');
      } finally {
        setThinking(false);
      }
    },
    [interviewId, thinking, finished, applyTurn],
  );

  const endEarly = useCallback(async () => {
    try {
      const snap = await conversationApi.end(interviewId);
      seed(snap);
      setLastTurn(null);
      void queryClient.invalidateQueries({ queryKey: interviewKeys.dashboard() });
      toast.info('Interview ended.');
    } catch {
      toast.error('Could not end the interview');
    }
  }, [interviewId, seed, queryClient]);

  const restart = useCallback(async () => {
    try {
      const snap = await conversationApi.restart(interviewId);
      startedRef.current = false; // allow the opening turn to regenerate
      setLastTurn(null);
      seed(snap);
      toast.info('Interview restarted.');
    } catch {
      toast.error('Could not restart the interview');
    }
  }, [interviewId, seed]);

  const lastInterviewerMessage =
    [...messages].reverse().find((m) => m.speaker === Speaker.INTERVIEWER) ?? null;

  return {
    isLoading: snapshot.isLoading,
    isError: snapshot.isError,
    messages,
    state,
    coverage,
    finished,
    thinking,
    lastTurn,
    lastInterviewerMessage,
    sendAnswer,
    endEarly,
    restart,
  };
}
