import { QueueStatus } from '@prisma/client';
import { canTransition } from './queue-transition.policy';

describe('canTransition', () => {
  it.each([
    [QueueStatus.WAITING, QueueStatus.IN_PROGRESS],
    [QueueStatus.IN_PROGRESS, QueueStatus.COMPLETED],
    [QueueStatus.WAITING, QueueStatus.CANCELLED],
    [QueueStatus.IN_PROGRESS, QueueStatus.CANCELLED],
  ])('permite %s → %s', (from, to) => {
    expect(canTransition(from, to)).toBe(true);
  });

  it.each([
    [QueueStatus.WAITING, QueueStatus.COMPLETED],
    [QueueStatus.COMPLETED, QueueStatus.WAITING],
    [QueueStatus.COMPLETED, QueueStatus.IN_PROGRESS],
    [QueueStatus.CANCELLED, QueueStatus.WAITING],
    [QueueStatus.CANCELLED, QueueStatus.IN_PROGRESS],
    [QueueStatus.IN_PROGRESS, QueueStatus.WAITING],
    [QueueStatus.WAITING, QueueStatus.WAITING],
    [QueueStatus.COMPLETED, QueueStatus.COMPLETED],
  ])('rechaza %s → %s', (from, to) => {
    expect(canTransition(from, to)).toBe(false);
  });
});
