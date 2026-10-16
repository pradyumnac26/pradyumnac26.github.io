---
categories:
  - Engineering
topics:
  - distributed systems
sources:
  - article
updated: 2026-01-19
---
This is part of [[Forward Proxy vs Reverse Proxy]], which covers what a proxy is and how proxies compare with VPNs and firewalls. For the client-side counterpart, see [[Forward Proxy]].

## Simple Analogy for Server-Side Proxy

![[server-proxy-analogy.webp]]

When you go to a restaurant and want to order food, you do not walk into the kitchen and talk to the chefs directly, right? Instead, you place your order with the waiter/host. They check the menu, make sure the order is valid, and then pass it to the chef so it can be prepared.

In this scenario:

- You are the client
- The waiter/host is the reverse proxy (server-side proxy)
- The chef/kitchen is the server

So the reverse proxy's job is to sit in between and make sure the client does not interact with the server directly, it accepts the request, applies rules/filters if needed, and forwards it to the right server. The reverse proxy (the host/waiter) is protecting and managing the kitchen (server) from bad/too many/invalid requests.

## Reverse Proxy (Server-Side Proxy)

A Reverse Proxy (Server-Side Proxy / internal-facing proxy) sits between the internet and the web servers (the destination). When a user makes a request to a website, the request hits the Reverse Proxy first. The proxy then decides which backend server should handle the request.

Once the server finishes the job, it sends the data back to the proxy, which then passes it back to the user.

While a forward proxy acts as a middleman for the client, a reverse proxy acts as a middleman for the server. It hides the servers' real identity and protects them from the internet. It abstracts away the complexity of the downstream systems.

![[reverse-proxy-diagram.webp]]

## Advantages of Reverse Proxy

- **Load Balancing:** Reverse proxies act as traffic controllers. They distribute incoming requests across multiple servers so that no single server gets overwhelmed.
- **Server Protection and Security:** The proxy acts as a shield. It hides the real IP addresses of the backend servers, making it impossible for hackers to target them directly. It can also block DDoS attacks or suspicious traffic before it even reaches the actual data.
- **SSL Termination:** Handling the HTTPS lock icon (encryption) is heavy work for a server. The reverse proxy handles all the encryption and decryption, freeing up the backend servers to focus strictly on its tasks.
- **Caching:** Reverse proxies can cache frequently requested resources, reducing the need for repeated requests to the web servers.
- **Response Modification and Compression:** The proxy can compress files to make them load faster. It can also add or remove information from the server's response (headers) to make it more secure before it reaches the user.

## Examples

- An API Gateway is a specialized reverse proxy built for APIs
- A load balancer is a specialized reverse proxy for traffic distribution (see [[L4 Load Balancer vs L7 Load Balancer]])
- DB Proxies are specialized forms of reverse proxy (sits in front of databases, handles connection pooling, and caches common query results)
- CDN (Content Delivery Network): A specialized, globally distributed reverse proxy

> Reverse Proxy can be all of these, but all of these cannot be a reverse proxy.

Industry-standard reverse proxies: Nginx, HAProxy, Kong Gateway, ProxySQL
