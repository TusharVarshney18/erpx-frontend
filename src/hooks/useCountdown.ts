import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Countdown timer in seconds. `secondsLeft` reaches 0 when done;
 * call `start(seconds)` (or `restart()`) to (re)start.
 */
export function useCountdown(initialSeconds = 0) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const start = useCallback(
    (seconds: number) => {
      stop();
      setSecondsLeft(seconds);
      timerRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = null;
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    },
    [stop],
  );

  useEffect(() => stop, [stop]);

  const restart = useCallback(() => {
    setSecondsLeft((s) => {
      if (s > 0) start(s);
      return s;
    });
  }, [start]);

  const format = useCallback(() => {
    const m = Math.floor(secondsLeft / 60)
      .toString()
      .padStart(2, "0");
    const s = (secondsLeft % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }, [secondsLeft]);

  return { secondsLeft, start, restart, stop, format };
}
