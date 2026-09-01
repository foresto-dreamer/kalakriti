export type OperatorQueueEntry = {
  id: string;
  tokenId: string;
  farmerName: string;
  centreName: string;
  crop: string;
  weight: number;
  appointmentDate: string;
  appointmentTime: string;
  checkedInAt: string;
  status: string;
};

declare global {
  var operatorQueueStore: OperatorQueueEntry[] | undefined;
}

export function getOperatorQueueStore() {
  if (!globalThis.operatorQueueStore) {
    globalThis.operatorQueueStore = [];
  }

  return globalThis.operatorQueueStore;
}

export function upsertOperatorQueueEntry(entry: OperatorQueueEntry) {
  const queue = getOperatorQueueStore();
  const existingIndex = queue.findIndex((item) => item.tokenId === entry.tokenId || item.id === entry.id);

  if (existingIndex >= 0) {
    queue[existingIndex] = entry;
    return queue;
  }

  queue.push(entry);
  return queue;
}

export function getOperatorQueue() {
  return [...getOperatorQueueStore()].sort((a, b) =>
    new Date(a.checkedInAt).getTime() - new Date(b.checkedInAt).getTime()
  );
}
