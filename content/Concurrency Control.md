---
categories:
  - Engineering
topics:
  - distributed systems
sources:
  - article
updated: 2026-03-22
---
In real systems, there might be multiple transactions that happen at the same time like:

- Multiple users reading the same row
- Multiple users updating the same row
- Reads happening while writes are in progress

This leads to different types of conflicts:

- Read-Read
- Read-Write
- Write-Read
- Write-Write

These concurrent interactions can cause anomalies like dirty reads, non-repeatable reads, phantom reads, lost updates.

To control these concurrency anomalies databases provide isolation levels like Read Committed, Repeatable Read, and Serializable.

You can read about Concurrent Anomalies and Isolation Levels in depth in one of my previous article here: [Relational Database & ACID Transactions : Part 2](https://pradyumnachippigiri.substack.com/p/relational-database-and-acid-transactions)

But an important question is:

> How are these isolation levels actually implemented under the hood?

The answer is: using different concurrency control mechanisms.

There are three major approaches:

- [[Pessimistic Locking|Pessimistic Concurrency Control]]
- [[Optimistic Locking|Optimistic Concurrency Control]]
- MVCC

> Optimistic locking or Pessimistic locking are just approaches for concurrency control, they are not specific keywords in the database query language sense.

When dealing with conflicts, we have two options:

- we can try to avoid the conflict, and that is what [[Pessimistic Locking]] does.
- Or, we allow transactions to proceed concurrently and detect conflicts at commit time, and that is what [[Optimistic Locking]] does.

Lets understand the 2 basic locks before we understand concurrency control techniques.

![[locking-lock-overview.webp]]

## Shared Lock (S-Lock)

A shared lock is used when a transaction needs to read a resource (such as a database row or table) without modifying it. Multiple transactions can acquire a shared lock on the same resource at the same time. However, as long as one or more shared locks exist on a resource, no transaction can modify/update/write to that resource.

![[locking-shared-lock.webp]]

Credits : [https://parottasalna.com/2025/01/06/learning-notes-41-shared-lock-and-exclusive-locks-postgres/](https://parottasalna.com/2025/01/06/learning-notes-41-shared-lock-and-exclusive-locks-postgres/)

## Exclusive Lock (X-Lock)

An exclusive lock is used when a transaction wants to change data. Only one transaction can hold this lock at a time, and while it is held, no other transaction can read or write that data.

![[locking-exclusive-lock.webp]]

## Concurrency Control Techniques

Now that we understand shared and exclusive locks, let's look at how they are used:

- [[Pessimistic Locking]] - avoid conflicts upfront by acquiring locks before working on data.
- [[Optimistic Locking]] - let transactions proceed freely and detect conflicts at commit time.
