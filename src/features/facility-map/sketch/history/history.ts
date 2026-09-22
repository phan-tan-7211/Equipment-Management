export type SketchHistory<T> = {
  past: T[];
  present: T;
  future: T[];
  transactionStart: T | null;
  limit: number;
};

type Clone<T> = (value: T) => T;

export function createSketchHistory<T>(
  initial: T,
  clone: Clone<T>,
  limit = 80,
): SketchHistory<T> {
  return {
    past: [],
    present: clone(initial),
    future: [],
    transactionStart: null,
    limit,
  };
}

export function commitSketchHistory<T>(
  history: SketchHistory<T>,
  next: T,
  clone: Clone<T>,
): SketchHistory<T> {
  const previous = clone(history.present);
  return {
    ...history,
    past: [...history.past, previous].slice(-history.limit),
    present: clone(next),
    future: [],
  };
}

export function beginSketchHistoryTransaction<T>(
  history: SketchHistory<T>,
  clone: Clone<T>,
): SketchHistory<T> {
  if (history.transactionStart) return history;
  return {
    ...history,
    transactionStart: clone(history.present),
  };
}

export function updateSketchHistoryTransient<T>(
  history: SketchHistory<T>,
  next: T,
  clone: Clone<T>,
): SketchHistory<T> {
  return {
    ...history,
    present: clone(next),
  };
}

export function commitSketchHistoryTransaction<T>(
  history: SketchHistory<T>,
  clone: Clone<T>,
): SketchHistory<T> {
  if (!history.transactionStart) return history;
  return {
    ...history,
    past: [...history.past, clone(history.transactionStart)].slice(-history.limit),
    future: [],
    transactionStart: null,
  };
}

export function cancelSketchHistoryTransaction<T>(
  history: SketchHistory<T>,
  clone: Clone<T>,
): SketchHistory<T> {
  if (!history.transactionStart) return history;
  return {
    ...history,
    present: clone(history.transactionStart),
    transactionStart: null,
  };
}

export function undoSketchHistory<T>(
  history: SketchHistory<T>,
  clone: Clone<T>,
): SketchHistory<T> {
  const previous = history.past[history.past.length - 1];
  if (!previous) return history;
  return {
    ...history,
    past: history.past.slice(0, -1),
    present: clone(previous),
    future: [clone(history.present), ...history.future].slice(0, history.limit),
    transactionStart: null,
  };
}

export function redoSketchHistory<T>(
  history: SketchHistory<T>,
  clone: Clone<T>,
): SketchHistory<T> {
  const next = history.future[0];
  if (!next) return history;
  return {
    ...history,
    past: [...history.past, clone(history.present)].slice(-history.limit),
    present: clone(next),
    future: history.future.slice(1),
    transactionStart: null,
  };
}
