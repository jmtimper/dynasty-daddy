#
#FROM python:3.8.8
#RUN apt-get update && apt-get -y install cron vim
#WORKDIR /app
#COPY crontab /etc/cron.d/crontab
#COPY hello.py /app/hello.py
#RUN chmod 0644 /etc/cron.d/crontab
#RUN /usr/bin/crontab /etc/cron.d/crontab
#RUN echo "* * * * * echo hello" | crontab -
#
## run crond as main process of container
#RUN touch /var/log/cron.log
#CMD cron && tail -f /var/log/cron.log

FROM python:3.8.8
RUN apt-get update && apt-get -y install cron

WORKDIR /app
COPY requirements.txt /app/requirements.txt
RUN pip install -r requirements.txt
RUN touch /etc/crontab /etc/cron.*/*

# Copy hello-cron file to the cron.d directory
#COPY crontab /etc/cron.d/ktc-crontab

RUN echo "20 14 * * * root /usr/local/bin/python /app/ktc-rankings-scraper.py >> /var/log/cron.log 2>&1" >> /etc/cron.d/ktc-crontab
COPY ktc-rankings-scraper.py /app/ktc-rankings-scraper.py
RUN chmod 0644 /etc/cron.d/ktc-crontab
# Apply cron job
RUN touch /var/log/cron.log
#RUN crontab /etc/cron.d/ktc-crontab

# set cron user
RUN useradd -m cronUser
USER cronUser

CMD cron && tail -f /var/log/cron.log