#!/bin/bash

# Fetch all container IDs
container_ids=$(curl --silent --unix-socket /var/run/docker.sock http://localhost/containers/json | jq -r '.[].Id')

# Loop through each container ID
for container_id in $container_ids; do
    # Fetch the environment variables of the container
    env_vars=$(curl --silent --unix-socket /var/run/docker.sock http://localhost/containers/$container_id/json | jq -r '.Config.Env[]')

    # Extract and print VIRTUAL_HOST if it exists
    for env_var in $env_vars; do
        if [[ $env_var == VIRTUAL_HOST=* ]]; then
            # Fetch the container's labels
            labels=$(curl --silent --unix-socket /var/run/docker.sock http://localhost/containers/$container_id/json | jq -r '.Config.Labels')

            # Extract the directory of the docker-compose file if it exists
            compose_file=$(echo $labels | jq -r '."com.docker.compose.project.working_dir"')

            echo "Container ID: $container_id"
            echo "VIRTUAL_HOST: ${env_var#*=}"
            if [ -n "$compose_file" ]; then
                echo "Docker Compose Directory: $compose_file"
            else
                echo "Docker Compose Directory: Not found"
            fi
        fi
    done
done
