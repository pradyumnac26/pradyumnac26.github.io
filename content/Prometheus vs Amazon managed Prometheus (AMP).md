---
categories:
  - Engineering
topics:
  - distributed systems
sources:
updated: 2026-10-23
---

Today I learned that AMP is different from Prometheus in terms of scraping. Prometheus has a component called retrieval that scrapes (pulls) metrics from the targets specified in its config. AMP does not offer that.

In the case of AMP, we have to push data to its `remote_write` endpoint. So when we expose `/metrics` in our services, we need an agent or an OTel Collector to scrape the data and then push it to AMP.

Prometheus is also provides some basic UI for monitoring but AMP has no UI, so Grafana has to be integrated for dashboards.

