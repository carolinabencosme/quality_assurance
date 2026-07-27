# LTS reciente: plugins actuales exigen >= 2.504.1
FROM jenkins/jenkins:2.504.3-lts-jdk21

USER root
RUN apt-get update \
  && apt-get install -y --no-install-recommends curl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Pipeline + JCasC (sin Blue Ocean: mas liviano y estable para demo local)
RUN jenkins-plugin-cli --plugins \
    configuration-as-code \
    workflow-aggregator \
    git \
    pipeline-stage-view \
    ws-cleanup \
    credentials-binding \
    timestamper

USER jenkins

COPY casc/ /usr/share/jenkins/ref/casc_configs/
COPY init.groovy.d/ /usr/share/jenkins/ref/init.groovy.d/
