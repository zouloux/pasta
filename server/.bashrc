# Enhanced prompt with user, domain, and command status
RED='\[\e[1;31m\]'
GREEN='\[\e[1;32m\]'
CYAN='\[\e[0;36m\]'
RESET='\[\e[0m\]'
PS1="${RED}$(whoami)@\h \$(if [ \$? == 0 ]; then echo '${GREEN}➜'; else echo '${RED}➜'; fi) ${CYAN}\w ${RESET}"

# LS helpers
export LS_OPTIONS='--color=auto'
eval "$(dircolors)"
alias ls='ls $LS_OPTIONS'
alias ll='ls $LS_OPTIONS -l'
alias l='ls $LS_OPTIONS -lA'

# Pasta Server config
export PASTA_DOMAIN=$(cat ~/.config/pasta/domain.txt)
export PASTA_HOSTNAME=$(cat ~/.config/pasta/hostname.txt)
export PASTA_EMAIL=$(cat ~/.config/pasta/email.txt)

# Pasta Server aliases
export PATH="$PATH:$HOME/scripts/"

#alias download="$HOME/scripts/alias-download.sh"
#alias rsync-download="$HOME/scripts/alias-rsync-download.sh"
#alias rsync-upload="$HOME/scripts/alias-rsync-upload.sh"
#alias docker-restart="$HOME/scripts/alias-docker-restart.sh"
#alias docker-clean="$HOME/scripts/alias-docker-clean.sh"
#alias nginx-reload="$HOME/scripts/alias-docker-clean.sh"