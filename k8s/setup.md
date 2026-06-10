# Kubernetes Cluster — Dependency Setup Guide
> Run all commands on the **master node** via SSH before triggering the CI/CD pipeline.
> Master node internal IP: `172.31.86.181` (update if it changes after EC2 restart)

---

## 0. Pre-requisites — Create Secrets

```bash
# Groq API key
kubectl create secret generic groq-secret \
  --from-literal=api-key=gsk_your_actual_groq_key

# Postgres password
kubectl create secret generic pg-secret \
  --from-literal=password=yourStrongPassword123

# verify both exist
kubectl get secrets
```

---

## 1. Install Helm

```bash
curl -fsSL -o get_helm.sh \
  https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3
chmod 700 get_helm.sh
./get_helm.sh
helm version
```

---

## 2. Install Longhorn (Persistent Storage)

```bash
# install longhorn
kubectl apply -f \
  https://raw.githubusercontent.com/longhorn/longhorn/v1.6.0/deploy/longhorn.yaml

# watch pods come up — wait until ALL are Running (takes 2-3 mins)
kubectl get pods -n longhorn-system -w

# verify both worker nodes detected
kubectl get nodes.longhorn.io -n longhorn-system
```

---

## 3. Install Nginx Ingress Controller

```bash
# install ingress-nginx (bare-metal / NodePort version)
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.10.1/deploy/static/provider/baremetal/deploy.yaml

# watch controller pod come up
kubectl get pods -n ingress-nginx -w
# ingress-nginx-controller-xxx   1/1   Running ✅

# verify NodePort assigned on port 80
kubectl get svc -n ingress-nginx
```

---

## 4. Install Prometheus + Grafana (kube-prometheus-stack)

```bash
# add helm repos
helm repo add prometheus-community \
  https://prometheus-community.github.io/helm-charts
helm repo update

# create monitoring namespace
kubectl create namespace monitoring

# install kube-prometheus-stack
helm install kind-prometheus \
  prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --set prometheus.service.type=NodePort \
  --set prometheus.service.nodePort=30000 \
  --set grafana.service.type=NodePort \
  --set grafana.service.nodePort=31000 \
  --set alertmanager.service.type=NodePort \
  --set alertmanager.service.nodePort=32000 \
  --set prometheus-node-exporter.service.type=NodePort \
  --set prometheus-node-exporter.service.nodePort=32001 \
  --set kubelet.serviceMonitor.https=false \
  --set kubeControllerManager.endpoints[0]=172.31.86.181 \
  --set kubeScheduler.endpoints[0]=172.31.86.181 \
  --set kubeEtcd.endpoints[0]=172.31.86.181 \
  --set kubeProxy.enabled=false

# watch all pods come up (takes 3-4 mins)
kubectl get pods -n monitoring -w
# wait until ALL show Running before proceeding
```

---

## 5. Fix kubeadm-specific Prometheus Scraping Issues

```bash
# fix kube-controller-manager bind address
sudo sed -i \
  's/--bind-address=127.0.0.1/--bind-address=0.0.0.0/' \
  /etc/kubernetes/manifests/kube-controller-manager.yaml

# fix kube-scheduler bind address
sudo sed -i \
  's/--bind-address=127.0.0.1/--bind-address=0.0.0.0/' \
  /etc/kubernetes/manifests/kube-scheduler.yaml

# wait for both to restart (about 30 seconds)
kubectl get pods -n kube-system | grep -E "controller-manager|scheduler"
# both should show 1/1 Running
```

### Fix kube-proxy metrics

```bash
# open configmap editor
kubectl edit configmap kube-proxy -n kube-system
# find:   metricsBindAddress: ""
# change: metricsBindAddress: "0.0.0.0:10249"
# save and exit (:wq in vim)

# restart kube-proxy daemonset
kubectl rollout restart daemonset kube-proxy -n kube-system

# verify
kubectl get pods -n kube-system | grep proxy
```

---

## 6. Verify All Dependencies Are Ready

```bash
# ── Longhorn ──
kubectl get pods -n longhorn-system | grep -v Running
# should show nothing (all Running)

# ── Ingress ──
kubectl get pods -n ingress-nginx
# ingress-nginx-controller   1/1   Running ✅

# ── Monitoring ──
kubectl get pods -n monitoring
# all pods Running ✅

# ── Secrets ──
kubectl get secrets
# groq-secret ✅
# pg-secret   ✅
```

---

## 7. Get Grafana Admin Password

```bash
kubectl get secret -n monitoring \
  kind-prometheus-grafana \
  -o jsonpath="{.data.admin-password}" | base64 -d ; echo
```

---

## 8. AWS Security Group — Open These Ports

| Port  | Purpose             | Source     |
|-------|---------------------|------------|
| 22    | SSH                 | Your IP    |
| 80    | HTTP / Ingress      | 0.0.0.0/0  |
| 443   | HTTPS               | 0.0.0.0/0  |
| 30000 | Prometheus UI       | 0.0.0.0/0  |
| 31000 | Grafana UI          | 0.0.0.0/0  |
| 32000 | Alertmanager        | 0.0.0.0/0  |
| 30090 | Longhorn UI         | Your IP    |
| All traffic | Same SG (node-to-node) | sg-xxxxxxxx |

---

## 9. Access Dashboards

```bash
# get worker node public IP from AWS console then open:

http://<worker-public-ip>:30000     # Prometheus
http://<worker-public-ip>:31000     # Grafana  (admin / password from step 7)

# OR via domain (after DNS + ingress setup):
http://grafana.izhardev.me
http://prometheus.izhardev.me
http://app.izhardev.me
```

---

## 10. Verify Prometheus Targets

```
Prometheus UI → Status → Target health

Expected GREEN targets:
✅ alertmanager          1/1
✅ grafana               1/1
✅ node-exporter         3/3  (one per EC2 node)
✅ kube-state-metrics    1/1
✅ prometheus            1/1
✅ coredns               2/2
✅ controller-manager    1/1
✅ scheduler             1/1
```

---

## 11. GitHub Actions Secrets to Configure

Go to: **GitHub repo → Settings → Secrets and variables → Actions → New repository secret**

| Secret Name        | Value                              |
|--------------------|------------------------------------|
| DOCKERHUB_USERNAME | izhardev                           |
| DOCKERHUB_TOKEN    | your Docker Hub access token       |
| SSH_HOST           | master node public IP              |
| SSH_USER           | ubuntu                             |
| SSH_PRIVATE_KEY    | contents of your EC2 .pem key file |

---

## 12. Grafana Dashboards to Import

```
Grafana → Dashboards → New → Import

ID: 1860   → Node Exporter Full (EC2 CPU/Memory/Disk)
ID: 3119   → Kubernetes cluster monitoring
ID: 6417   → Kubernetes pod/namespace metrics
```

---

## Notes

- Run this setup **once** on a fresh cluster. CI/CD pipeline handles all subsequent app deployments.
- If EC2 instances are stopped and restarted, worker node kubelets may disconnect. Fix:
  ```bash
  # SSH into each worker and run:
  sudo systemctl restart kubelet
  ```
- Always ensure the "All traffic from same SG" inbound rule exists in your Security Group — this is required for pod-to-pod communication across nodes.
