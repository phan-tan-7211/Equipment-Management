import { useCallback, useEffect, useMemo, useState } from 'react';
import { cloneSketchDocument, touchSketchDocument } from '../core/document';
import type { SketchDocument } from '../core/types';
import {
  beginSketchHistoryTransaction,
  cancelSketchHistoryTransaction,
  commitSketchHistory,
  commitSketchHistoryTransaction,
  createSketchHistory,
  redoSketchHistory,
  undoSketchHistory,
  updateSketchHistoryTransient,
} from './history';
import { loadSketchDocument, saveSketchDocument } from '../persistence/storage';

type DocumentUpdater =
  | SketchDocument
  | ((current: SketchDocument) => SketchDocument);

const resolveUpdater = (
  current: SketchDocument,
  updater: DocumentUpdater,
): SketchDocument =>
  typeof updater === 'function'
    ? (updater as (value: SketchDocument) => SketchDocument)(current)
    : updater;

export function useSketchDocumentHistory(storageKey: string) {
  const [history, setHistory] = useState(() =>
    createSketchHistory(
      loadSketchDocument(storageKey),
      cloneSketchDocument,
    ),
  );

  useEffect(() => {
    setHistory(
      createSketchHistory(
        loadSketchDocument(storageKey),
        cloneSketchDocument,
      ),
    );
  }, [storageKey]);

  useEffect(() => {
    saveSketchDocument(storageKey, history.present);
  }, [history.present, storageKey]);

  const commit = useCallback((updater: DocumentUpdater) => {
    setHistory((current) => {
      const next = touchSketchDocument(resolveUpdater(current.present, updater));
      return commitSketchHistory(current, next, cloneSketchDocument);
    });
  }, []);

  const beginTransaction = useCallback(() => {
    setHistory((current) =>
      beginSketchHistoryTransaction(current, cloneSketchDocument),
    );
  }, []);

  const updateTransient = useCallback((updater: DocumentUpdater) => {
    setHistory((current) => {
      const next = resolveUpdater(current.present, updater);
      return updateSketchHistoryTransient(current, next, cloneSketchDocument);
    });
  }, []);

  const commitTransaction = useCallback(() => {
    setHistory((current) =>
      commitSketchHistoryTransaction(
        { ...current, present: touchSketchDocument(current.present) },
        cloneSketchDocument,
      ),
    );
  }, []);

  const cancelTransaction = useCallback(() => {
    setHistory((current) =>
      cancelSketchHistoryTransaction(current, cloneSketchDocument),
    );
  }, []);

  const undo = useCallback(() => {
    setHistory((current) => undoSketchHistory(current, cloneSketchDocument));
  }, []);

  const redo = useCallback(() => {
    setHistory((current) => redoSketchHistory(current, cloneSketchDocument));
  }, []);

  return useMemo(() => ({
    document: history.present,
    commit,
    beginTransaction,
    updateTransient,
    commitTransaction,
    cancelTransaction,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    inTransaction: history.transactionStart !== null,
  }), [
    beginTransaction,
    cancelTransaction,
    commit,
    commitTransaction,
    history.future.length,
    history.past.length,
    history.present,
    history.transactionStart,
    redo,
    undo,
    updateTransient,
  ]);
}
