import { memo, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Speaker, type MessageDto } from '@cadence/types';
import { ThinkingIndicator } from './ThinkingIndicator';

interface TranscriptProps {
  messages: MessageDto[];
  thinking: boolean;
  /** Live partial transcript while the candidate is speaking (voice mode). */
  partial?: string;
}

function Bubble({ message }: { message: MessageDto }) {
  const isInterviewer = message.speaker === Speaker.INTERVIEWER;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isInterviewer ? 'justify-start' : 'justify-end'}`}
    >
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isInterviewer
            ? 'glass rounded-tl-sm text-slate-200'
            : 'rounded-tr-sm bg-accent/90 text-white'
        }`}
      >
        {!isInterviewer ? null : (
          <span className="mb-0.5 block text-[11px] font-medium uppercase tracking-wide text-cyanic">
            Interviewer
          </span>
        )}
        {message.content}
      </div>
    </motion.div>
  );
}

export const Transcript = memo(function Transcript({ messages, thinking, partial }: TranscriptProps) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, thinking, partial]);

  return (
    <div className="flex flex-col gap-4">
      <AnimatePresence initial={false}>
        {messages.map((m) => (
          <Bubble key={m.id} message={m} />
        ))}
      </AnimatePresence>

      {partial ? (
        <div className="flex justify-end">
          <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-accent/40 px-4 py-2.5 text-sm italic text-white/80">
            {partial}…
          </div>
        </div>
      ) : null}

      {thinking && (
        <div className="pl-1">
          <ThinkingIndicator />
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
});
