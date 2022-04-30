# Dynasty Daddy

*This project is currently in Beta and is deployed to https://dynasty-daddy.com.*

Dynasty Daddy is a webapp that integrates with Sleeper's api and scrapes KeepTradeCut's player evaluations to create metrics on each owners fantasy league.

### 

## Goal

The goal is to provide users with a frictionless way to see player value, team value, draft breakdowns, and more. When managing my teams I would constantly have to switch between multiple websites to figure out what moves I should make. I wanted to find a way to spend less time doing research and leverage the data in more ways than before. Thus Dynasty Daddy was born to help me beat my friends in fantasy easier!



## Architecture

Dynasty Daddy's front end is an angular 11 web application with an node express api connected to a postgres database. This database is populated using a python cron job that scrapes KeepTradeCut's player rankings once a day (since KeepTradeCut currently doesn't have a public api). For Sleeper's data, we use sleeper's public apis found in their documentation.

## How to run locally

Requirements:

- npm
- Node
- Postgres

First, clone repo and open up in your preferred IDE.

### Database

- Run scripts in `/back-end/database/scripts` directory to create database and insert data.

    - data is found in the `data` directory

###  Front End

1. Navigate to the front end project directory `/front-end/fantasy-app/`
2. Run `npm install` and `npm run start` and the front end should spin up.

### API

1. Navigate to the project directory `/back-end/express-api`
2. Copy the `.env.example` file renaming it to just `.env`. Then update the `CONNECTION_STRING` to point to the local db containing the data.
3. Now, run `npm install` and `npm run start` and the api should spin up.



## Future Improvements

- Support other platforms like MFL, Fleaflicker, etc.
- Machine learning on data to predict the best players to buy and sell.
- Better draft predictor based on team needs
- Player value calculation based on points and trade value
- More team analytics
- Team Elo ranking like Chess
- Code clean up on API and Front End

## Packages

- ng2-charts - chart.js with angular 11
- Angular mat - for tables, and other styling components
- javascript-color-gradient - color gradients
- simple-statistics - statistics and probability calculations
- angular2-query-builder - query builder for player comparison advanced search
- ngx-device-detector - detects if using mobile device, tablet, or desktop
- ngx-spinner - displays spinner when waiting for api calls to return
- ngx-mat-select-search - custom mat select search box with dropdown

## Deployment
- CI/CD using Github Actions to build and push images to docker hub when a PR to main is created.
- The project is deployed on a DigitalOcean Ubuntu Droplet and uses docker compose to spin up images.
- Watchtower monitors changes to Docker Hub and pulls new images every 30 seconds and redeploys them.

## Credits

Jeremy Timperio - Creator, Full Stack Dev
