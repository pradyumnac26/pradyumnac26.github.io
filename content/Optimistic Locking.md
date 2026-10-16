---
categories:
  - Engineering
topics:
  - distributed systems
sources:
  - article
updated: 2026-03-22
---
This builds on [[Concurrency Control]], which covers concurrency conflicts, isolation levels, and shared and exclusive locks. 

## Optimistic Concurrency Control

The literal meaning of Optimistic is "hoping good things will happen".

> Optimistic concurrency control assumes that conflicts between transactions are rare. So instead of locking data before performing operations, it allows transactions to proceed freely and checks for conflicts only later, usually at commit time.

In this approach, transactions typically read the currently visible committed data without taking long-held locks upfront, perform their work, and then verify at commit time whether the data has changed in the meantime.

The optimistic lock is not implemented by the locking mechanism of the database management system. Instead, it is more on the application code level lock.

For example, a transaction may:

- read a row along with its version
- perform updates in memory
- attempt to update the row only if the version has not changed

If the version has changed, it means another transaction has already modified the data, and the current transaction fails and must be retried.

## Example

![[locking-optimistic-example.webp]]

## Implementation of Optimistic control

## Limitations and Challenges

1. Late Conflict Detection - Conflicts are detected only at commit time, after the transaction has already done its work.
2. Wasted Work - Multiple transactions may perform the same operations, but only one succeeds while others fail.
3. Poor performance under high contention - frequent conflicts can lead to repeated failures and retries.
4. Additional Metadata Requirement - Requires versioning or timestamps to detect conflicts.
5. Retries Required - Failed transactions must be retried, increasing application complexity.

## When to use it

Optimistic concurrency control is preferred when conflicts are rare, contention is low, and occasional retries are acceptable. It works well for read-heavy systems, low-conflict business workflows, and application-level updates where blocking transactions upfront would unnecessarily reduce concurrency.

If conflicts are likely or retrying is expensive, [[Pessimistic Locking]] is usually the better fit. The right choice depends on the workload, the likelihood of conflicts, and whether waiting or retrying is more acceptable for the system.
