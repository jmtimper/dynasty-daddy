#!/bin/bash

printenv >> /etc/environment

cron && tail -f /var/log/cron.log
