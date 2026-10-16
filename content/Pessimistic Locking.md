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

## Pessimistic Concurrency Control

The literal meaning of pessimistic is "believing that bad things will happen".

> Pessimistic concurrency control assumes that conflicts between transactions are likely. So, before a transaction performs operations on data, it acquires locks to prevent other transactions from accessing the same data in a conflicting way.

In simple terms, it follows this idea:

> since conflicts are likely, prevent them upfront instead of detecting them later.

If a transaction wants to read data, it may acquire a shared lock.
If a transaction wants to modify data, it acquires an exclusive lock.

This means:

- Multiple transactions can still read the same data at the same time using shared locks
- But once a transaction acquires an exclusive lock on a resource, other transactions must wait before they can read or write that same resource

So pessimistic concurrency control avoids concurrency anomalies and other conflicting operations by making transactions wait until the current lock is released.

## Example

![[locking-pessimistic-example.webp]]

## Implementation of Pessimistic control

## Limitations and Challenges

1. Reduced Concurrency - Exclusive locks prevent other transactions from accessing the locked resource, which can lead to bottlenecks in highly concurrent systems.
2. Blocking Writes - Shared locks can delay write operations, potentially impacting performance in write-heavy systems.
3. Deadlocks - Example:
   - T1 locks row A, wants row B
   - T2 locks row B, wants row A
   - Now both wait forever unless database detects and breaks the deadlock.
4. Higher latency - Transactions will be spending time waiting for locks to be released. So response time can increase.
5. Lock Management Overhead - Tracking, maintaining, and resolving locks adds internal overhead to the database.

## When to use it

Pessimistic concurrency control is preferred when conflicts are likely, when retrying failed work would be expensive, and when strong correctness and consistency are critical. It is a good fit for systems like banking, ticket booking, inventory management, and other high-contention workloads where it is better to make transactions wait rather than risk conflicting updates.

If conflicts are rare and occasional retries are acceptable, [[Optimistic Locking]] is usually the better fit. The right choice depends on the workload, the likelihood of conflicts, and whether waiting or retrying is more acceptable for the system.
