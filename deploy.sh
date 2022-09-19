export PROJECT_NAME=subplayer
cat deploy/deployment.yml | envsubst | kubectl apply -f -
cat deploy/service.yml | envsubst | kubectl apply -f -