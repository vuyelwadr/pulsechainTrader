pids=$(ps aux | grep 'server.js --scripts-prepend-node-path' | grep 'vuyeezti' | grep -v grep | awk '{print $2}'); if [ -n "$pids" ]; then echo "$pids" | xargs kill; fi; pids=$(awk '$2 == "00000000:0BB8" {print $9}' /proc/net/tcp /proc/net/tcp6 2>/dev/null | xargs -I{} sh -c 'basename $(readlink /proc/{}/fd/* 2>/dev/null) 2>/dev/null | grep -q "node" && echo {}' | grep -o '[0-9]*'); if [ -n "$pids" ]; then echo "$pids" | xargs kill; fi; source /home/vuyeezti/nodevenv/trade.vuyelwa.com/pulsechainTrader/22/bin/activate && cd /home/vuyeezti/trade.vuyelwa.com/pulsechainTrader && npm run production