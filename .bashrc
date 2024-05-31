# Prompt
RED='\[\e[1;31m\]'
GREEN='\[\e[1;32m\]'
CYAN='\[\e[0;36m\]'
RESET='\[\e[0m\]'
PS1="${RED}$(whoami)@\h $(if [ $? == 0 ]; then echo '${GREEN}➜'; else echo '${RED}➜'; fi) ${CYAN}\w ${RESET}"

# LS helpers
export LS_OPTIONS='--color=auto'
eval "$(dircolors)"
alias ls='ls $LS_OPTIONS'
alias ll='ls $LS_OPTIONS -l'
alias l='ls $LS_OPTIONS -lA'

# Halloumi config
export HALLOUMI_DOMAIN=$(cat ~/.config/halloumi/domain.txt)
export HALLOUMI_HOSTNAME=$(cat ~/.config/halloumi/hostname.txt)
export HALLOUMI_EMAIL=$(cat ~/.config/halloumi/email.txt)

# Halloumi aliases
alias quick-download="$HOME/scripts/quick-download-file.sh"
alias rsync-download="$HOME/scripts/rsync-download-file.sh"
alias rsync-upload="$HOME/scripts/rsync-upload-file.sh"
alias docker-restart="$HOME/scripts/docker-restart.sh"
alias docker-clean="$HOME/scripts/docker-clean.sh"