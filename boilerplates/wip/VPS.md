# Self-Hosted PaaS Comparison

## TL;DR

| | Dokploy | Coolify | CapRover | Dokku | Piku |
|---|---|---|---|---|---|
| One-liner install | ✅ | ✅ | ❌ | ✅ | ✅ |
| Web UI | ✅ | ✅ | ✅ | ❌ (paid) | ❌ |
| Docker Compose support | ✅ | ✅ | ✅ | ❌ | ❌ |
| Template export | ❌ | ❌ | ❌ | ❌ | ❌ |
| Multi-node | ✅ (Swarm) | ✅ (Swarm) | ✅ (Swarm) | ❌ | ❌ |
| Reverse proxy | Traefik | Caddy / Traefik | Nginx | Nginx | Nginx |
| Built-in infra monitoring | ✅ | ⚠️ (experimental) | ⚠️ (NetData) | ❌ | ❌ |
| HTTP request analytics | ✅ | ❌ | ❌ | ❌ | ❌ |
| Built-in web analytics | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## Dokploy

- ✅ One-liner installer: `curl -sSL https://dokploy.com/install.sh | sudo sh`
- ✅ Web UI setup on first launch
- ❌ No ability to export a project as a reusable template
  - Tracking: [#3074](https://github.com/Dokploy/dokploy/pull/3074)
- Docs comparison page: https://docs.dokploy.com/docs/core/comparison

### Supported OS

- ✅ Ubuntu 22.04, 24.04 LTS
- ✅ Debian 12
- ✅ CentOS
- ✅ Fedora
- ✅ Rocky Linux, AlmaLinux (community-tested)

### Notable features

- Native Docker Compose support
- Traefik integration (automatic routing, SSL)
- Built-in monitoring (CPU, memory, network, storage)
- Database management: PostgreSQL, MySQL, MongoDB, MariaDB, Redis, LibSQL
- Docker Swarm for multi-node deployments
- One-click templates (Supabase, Cal.com, PocketBase, etc.)
- Automated database backups to external storage
- Nixpacks, Railpack, Heroku, and Paketo buildpack support

### Monitoring & analytics

- ✅ **Infrastructure monitoring**: real-time CPU, memory, disk, and network per server and per container, configurable refresh rate and retention (default: 2 days)
- ✅ **HTTP request analytics**: Traefik access log parsing, request distribution charts and table view built into the dashboard
- ✅ **Real-time log streaming**: WebSocket-based log streaming per container and per deployment, with search/filter
- ✅ **Alerts**: CPU and memory threshold alerts sent to configured notification providers (Slack, Discord, etc.)
- ⚠️ **Advanced per-service metrics**: cloud version only (self-hosted gets server-level metrics)
- ❌ No built-in web analytics (page views, sessions, etc.) — deploy Plausible or Umami via templates

---

## Coolify

- ✅ One-liner installer: `curl -fsSL https://cdn.coollabs.io/coolify/install.sh | sudo bash`
- ✅ Web UI setup on first launch
- ❌ No ability to export a project as a reusable template
- ❌ Does not yet support Railpacks. Latest supported buildpack versions are node@22 and pnpm@10
- ❌ Encountered multiple Nixpacks-related bugs, including [nuxt/nuxt#31954](https://github.com/nuxt/nuxt/issues/31954) — failed to deploy the app through Nixpacks
  - Workaround: use a `docker-compose.yml` instead (fully supported)

### Supported OS

- ✅ Debian-based: Ubuntu (all versions, non-LTS requires manual install), Debian
- ✅ Redhat-based: CentOS, Fedora, RedHat, AlmaLinux, Rocky, Asahi, TencentOS
- ✅ SUSE-based: openSUSE
- ✅ Arch Linux
- ✅ Alpine Linux
- ✅ Raspberry Pi OS (64-bit only)

### Notable features

- Docker Compose and Dockerfile support
- Caddy and Traefik reverse proxy (choice per deployment)
- 280+ one-click service templates
- Preview deployments per pull request (GitHub App required)
- Multi-server management over SSH (no agent needed on remote)
- Automated backups with S3-compatible storage support
- Apache 2.0 license (fully open source)
- Separate recommended server for Coolify itself vs. deployed resources

### Monitoring & analytics

- ⚠️ **Infrastructure monitoring**: Sentinel, a lightweight built-in agent, tracks CPU, memory, and disk per container (~10s interval). Marked experimental. Exposes a local HTTP API on `localhost:8888` for external scraping
- ✅ **Container status monitoring**: alerts when containers stop or restart unexpectedly
- ✅ **Disk usage monitoring**: automatic cleanup when above configured threshold
- ✅ **Real-time logs**: per-service log streaming in the dashboard
- ❌ No HTTP request analytics
- ❌ No built-in web analytics
- ❌ No alerting on CPU/memory thresholds in the free self-hosted version
- ⚠️ **Prometheus + Grafana**: available as one-click templates — deploy alongside your apps for full metrics dashboards and alerting. Sentinel's API can be scraped via Node Exporter + cAdvisor

---

## CapRover

- ❌ No one-liner — requires Docker pre-installed, then a `docker run` command
- ❌ Requires a wildcard DNS record (`*.domain.com`) for HTTPS support
  - Does not support Cloudflare proxy (direct A record required)
- ❌ Strong incentive to use DigitalOcean (referral links throughout docs, one-click droplet)
- ❌ Failed to complete installation on a VM due to port 80 conflict
- ✅ Web UI included for free
- ✅ Docker Compose support
- Oldest and most battle-tested of the group; less actively developed

### Supported OS

- ✅ Officially tested on Ubuntu 22.04
- ⚠️ Any OS with Docker — but only Ubuntu is tested and documented

### Monitoring & analytics

- ⚠️ **NetData integration**: optional built-in server monitoring via NetData — but note that the bundled NetData image ships with upstream telemetry enabled by default, which is a known concern
- ✅ **Per-app log viewer**: real-time logs per deployed app in the dashboard
- ❌ No HTTP request analytics
- ❌ No built-in web analytics
- ❌ No threshold alerting

---

## Dokku

- ✅ One-liner: `wget -NP . https://dokku.com/install/v0.38.5/bootstrap.sh && sudo DOKKU_TAG=v0.38.5 bash bootstrap.sh`
  - ❌ Followed by required CLI config (SSH keys, virtual host settings): [docs](https://dokku.com/docs/getting-started/installation/#2-setup-ssh-key-and-virtualhost-settings)
- ❌ No Web UI in the free version
  - Web UI (Dokku Pro) is a one-time purchase of ~$849 (single server license)
- ❌ No Docker Compose support — apps are deployed via `git push` with buildpacks
- Git-push workflow (Heroku-style): simple but requires SSH access for most operations
- Lightest resource footprint of all options

### Supported OS

- ✅ Ubuntu
- ✅ Debian
- ⚠️ Other distros may work but are untested

### Monitoring & analytics

- ❌ No built-in monitoring of any kind
- ❌ No log aggregation (logs via `dokku logs <app>` CLI only)
- Everything must be set up manually (Prometheus, Grafana, etc.)

---

## Piku

- ✅ One-liner: `curl https://piku.github.io/get | sh && sudo ./piku-bootstrap install`
  - ❌ Followed by manual CLI configuration
- ❌ No Web UI
- ❌ Documentation is sparse and hard to follow
- Extremely lightweight — runs on a Raspberry Pi Zero
- Git-push workflow (similar to Dokku but simpler/smaller)

### Supported OS

- ✅ Any Linux distro where Python 3 can be installed

### Monitoring & analytics

- ❌ No built-in monitoring of any kind
- ❌ No log aggregation
- Everything must be set up manually