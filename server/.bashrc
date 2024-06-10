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
export PASTA_DOMAIN=$(cat /usr/local/pasta/config/domain.txt)
export PASTA_HOSTNAME=$(cat /usr/local/pasta/config/hostname.txt)
export PASTA_EMAIL=$(cat /usr/local/pasta/config/email.txt)

# Pasta Server scripts aliases
export PATH="$PATH:/usr/local/pasta/bin"