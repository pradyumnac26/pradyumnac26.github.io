---
categories:
  - Engineering
topics:
  - distributed systems
sources:
  - article
updated: 2026-01-19
---
This is part of [[Forward Proxy vs Reverse Proxy]], which covers what a proxy is and how proxies compare with VPNs and firewalls. For the server-side counterpart, see [[Reverse Proxy]].

## Simple Analogy for Client-Side Proxy

![[client-proxy-analogy.webp]]

Imagine you are a very famous person, and you want to buy vegetables for cooking, but you do not want anyone to recognize you. So you send your personal assistant to the store to buy them for you. The store owner only sees the assistant, sells the vegetables, and has no idea who they are actually for. In other words, your assistant is hiding your identity from the outside world.

Here:

- You are the client
- Your personal assistant is the forward proxy
- The store / store owner is the internet website / server

So a forward proxy sits between the client and the internet, makes requests on behalf of the client, and helps hide the client's identity (plus it can apply rules like allow/block/log if needed).

## Forward Proxy (Client-Side Proxy)

Forward Proxy (also called a client-side proxy or internet-facing proxy) sits between the client and the internet (for example, between your browser and a website). So whenever your browser makes a request, it sends (in plain text without encryption) that request to the forward proxy first.

The forward proxy can decide whether to allow it, block it, or route it to the correct destination server.

Then the destination server sends the response back to the forward proxy, and the forward proxy forwards that response back to your browser.

So the forward proxy's job is to act as a middleman for the client, it can hide the client's real identity (IP) from the internet and also control/log what the client is allowed to access.

![[forward-proxy-diagram.webp]]

## Advantages of Forward Proxy

- **Content filtering and security:** They can filter out unwanted or dangerous content. Proxies can block access to specific sites and protect the network by filtering out suspicious requests or malicious files before they reach the user.
- **Anonymity:** A forward proxy hides the client's IP address from the destination server. Since the server only sees the proxy's IP, it makes it much harder to track individual user activity or target specific clients for an attack.
- **Caching:** Forward proxies cache frequently requested resources. When another requests the same data, the proxy serves it directly from its cache instead of fetching it from the internet. This reduces bandwidth usage and speeds up load times.
- **Request Modification:** Proxies can modify outgoing requests by adding or removing headers. This allows an organization to customize how traffic looks to the outside world or strip away sensitive information for better privacy.
- **Access Control:** They enforce strict rules on who can access the internet. By requiring authentication and authorization, the proxy ensures that only permitted users or devices can reach external resources.

## Real world example

Usually used in organizations/educational institutions/country when they want to stop people from seeing certain content, they use a proxy. Every request you make must pass through this point. If you try to access a blocked service, the proxy spots it and stops the connection instantly based on certain rules and policies set up on the proxy.

This allows these organizations or even an entire nation to enforce strict rules on what is allowed inside their network.
