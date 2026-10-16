---
categories:
  - Engineering
topics:
  - distributed systems
sources:
  - article
updated: 2026-01-19
---
## What is a Proxy?

Proxy is nothing but a machine that sits between two systems. A proxy terminates the incoming connection and initiates a new, separate connection to the destination.

It acts like an intermediate layer that can:

- apply rules (allow/block),
- route traffic,
- hide details of the other side,
- and make communication more controlled and predictable.

Common misconception is that it can be only between a client and a backend servers, but it can also be between two backend servers.

Depending on the kind of proxy that we are using in our system, it will have different applications:

- [[Forward Proxy]]: This type of proxy is used to protect the clients accessing the websites via the internet.
- [[Reverse Proxy]]: This type of proxy is used to guard the web servers from the clients trying to access websites via the internet.

Both notes start with a simple analogy and then dive into how each proxy works, its advantages, and real world examples.

Some must-know differences when it comes to this topic would be:

## Proxy vs VPN

**VPN:** A VPN creates a secure, encrypted tunnel for all the device's traffic (browsers, apps, system updates). It is secure because it encrypts your data, unlike proxies where it send in plain text (unencrypted). This hides your IP system-wide.

**Proxy:** It only works at the application level (for example, just your web browser). It does not usually encrypt your data; it just masks your IP address for that specific app. It allows only for one app, not system wide.

## Proxy vs Firewall

**Firewall:** A firewall sits at the edge of the network and scans incoming and outgoing data packets (it only looks at the header of the data: IP and Port). It does not open the data. It can block/allow connections instantly based on rules, no need to terminate the connection. If the data is coming from a suspicious source, the firewall stops it at the door before it can get into your computer. So it just filters and blocks, it does not have proxy characteristics like caching.

**Proxy:** It is a middleman that terminates the client connection and starts a new connection to the server. Because it acts as the destination, it can read the data to perform caching or content filtering.
