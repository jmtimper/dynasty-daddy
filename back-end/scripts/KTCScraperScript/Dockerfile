FROM python:3.8.8
RUN apt-get update && apt-get -y install cron vim

WORKDIR /app
COPY back-end/scripts/requirements.txt /app/requirements.txt
RUN pip install -r requirements.txt

RUN echo "00 8 * * * /usr/local/bin/python /app/ktc-rankings-scraper.py >> /var/log/cron.log 2>&1" >> /etc/cron.d/ktc-crontab
COPY back-end/scripts/ktc-rankings-scraper.py /app/ktc-rankings-scraper.py
# execution rights to cron
RUN chmod 0644 /etc/cron.d/ktc-crontab
# Apply cron job
RUN touch /var/log/cron.log
RUN crontab /etc/cron.d/ktc-crontab

CMD cron && tail -f /var/log/cron.log
