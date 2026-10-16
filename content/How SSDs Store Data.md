---
categories:
  - Engineering
topics:
  - distributed systems
sources:
  - article
updated: 2026-02-15
---
This builds on [[How Databases Store Data on HDD and SSD]], which explains disk blocks, database pages, and how a database reads an 8 KB page from an HDD.

![[disk-storage-ssd-structure.webp]]

In SSDs, there are no spinning platters. Instead, data is stored across multiple NAND flash chips (often exposed as separate targets inside the SSD) and managed by an NVMe controller (as shown above). The important thing is: even on SSDs, the OS still talks to storage in terms of fixed-size blocks (e.g., 4KB) using logical block addresses.

So when the database requests an 8KB page, the OS issues reads for the corresponding 2 blocks. The NVMe controller then routes those block reads to the correct target / flash chip, fetches the data from the underlying flash pages, and returns the bytes back into RAM. From the database's point of view, the page-based model stays the same only the physical storage mechanics under the hood change.

For how SSDs attached directly to a machine compare with network-attached SSDs, see [[Local SSD (NVMe) vs Network SSD (Block Storage)]].
