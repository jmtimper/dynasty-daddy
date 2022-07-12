CREATE USER docker;
CREATE DATABASE docker;
GRANT ALL PRIVILEGES ON DATABASE docker TO docker;

-- create player values table
create table player_values
(
    id serial not null,
    name_id varchar(30),
    sf_position_rank int,
    position_rank int,
    sf_trade_value int,
    trade_value int,
    created_at timestamp not null default CURRENT_TIMESTAMP
);


create unique index player_values_id_uindex
    on player_values (id);

alter table player_values
    add constraint player_values_pk
        primary key (id);

-- create player info table for player details
create table player_info
(
    id serial primary key not null,
    name_id varchar(30) not null unique,
    full_name varchar(50),
    first_name varchar(30),
    last_name varchar(30),
    team varchar(3),
    position varchar(2),
    age int,
    experience int,
    college varchar(50),
    injury_status varchar(25),
    weight int,
    height varchar(8),
    jersey_number int,
    active boolean,
    updated_at                       TIMESTAMP WITH TIME ZONE    NOT NULL DEFAULT NOW(),
    created_at                       TIMESTAMP WITH TIME ZONE    NOT NULL DEFAULT NOW()
);

create unique index player_info_id_uindex
    on player_info (name_id);

-- create player ids table
create table player_ids
(
    id serial primary key not null,
    name_id varchar(30) not null unique,
    sleeper_id varchar(30),
    updated_at                       TIMESTAMP WITH TIME ZONE    NOT NULL DEFAULT NOW(),
    created_at                       TIMESTAMP WITH TIME ZONE    NOT NULL DEFAULT NOW()
);

create unique index player_ids_id_uindex
    on player_ids (id);

-- create config table
create table config
(
    config_key   text not null
        primary key,
    config_value text not null,
    description  text,
    created_at   timestamp with time zone default now(),
    updated_at   timestamp with time zone default now()
);

-- add active default values
ALTER TABLE player_info ALTER COLUMN active SET DEFAULT true;

-- create material view for player values and initalize data
DROP MATERIALIZED VIEW if EXISTS mat_vw_players;
CREATE MATERIALIZED VIEW if not exists mat_vw_players
AS
Select *
From (
         WITH allTimeHighSF (name_id, all_time_high_sf) as (select player_info.name_id    as name_id,
                                                                   max(pv.sf_trade_value) as all_time_high_sf
                                                            from player_info
                                                                     left join player_values pv on player_info.name_id = pv.name_id
                                                            group by player_info.name_id),
              allTimeHigh (name_id, all_time_high) as (select player_info.name_id as name_id,
                                                              max(pv.trade_value) as all_time_high
                                                       from player_info
                                                                left join player_values pv on player_info.name_id = pv.name_id
                                                       group by player_info.name_id),
              allTimeLowSF (name_id, all_time_low_sf) as (select player_info.name_id    as name_id,
                                                                 min(pv.sf_trade_value) as all_time_high
                                                          from player_info
                                                                   left join player_values pv on player_info.name_id = pv.name_id
                                                          group by player_info.name_id),
              allTimeLow (name_id, all_time_low) as (select player_info.name_id as name_id,
                                                            min(pv.trade_value) as all_time_low
                                                     from player_info
                                                              left join player_values pv on player_info.name_id = pv.name_id
                                                     group by player_info.name_id),
              threeMonthHighSf (name_id, three_month_high_sf) as (select player_info.name_id    as name_id,
                                                                         max(pv.sf_trade_value) as three_month_high_sf
                                                                  from player_info
                                                                           left join player_values pv on player_info.name_id = pv.name_id
                                                                  WHERE pv.created_at::date > now()::date - 90
         group by player_info.name_id),
    threeMonthHigh (name_id, three_month_high) as (select player_info.name_id as name_id,
    max(pv.trade_value) as three_month_high
from player_info
    left join player_values pv on player_info.name_id = pv.name_id
WHERE pv.created_at::date > now()::date - 90
group by player_info.name_id),
    threeMonthLowSf (name_id, three_month_low_sf) as (select player_info.name_id    as name_id,
    min(pv.sf_trade_value) as three_month_low_sf
from player_info
    left join player_values pv on player_info.name_id = pv.name_id
WHERE pv.created_at::date > now()::date - 90
group by player_info.name_id),
    threeMonthLow (name_id, three_month_low) as (select player_info.name_id as name_id,
    min(pv.trade_value) as three_month_low
from player_info
    left join player_values pv on player_info.name_id = pv.name_id
WHERE pv.created_at::date > now()::date - 90
group by player_info.name_id),
    lastMonthValue (name_id, last_month_value_sf, last_month_value) as (select player_info.name_id as name_id,
    pv.sf_trade_value   as last_month_value_sf,
    pv.trade_value      as last_month_value
from player_info
    left join player_values pv on player_info.name_id = pv.name_id
WHERE pv.created_at::date = now()::date - 30),
    mostRecentDataPoint (name_id, most_recent_data_point) as (select player_info.name_id as name_id,
    max(pv.created_at)  as most_recent_data_point
from player_info
    left join player_values pv on player_info.name_id = pv.name_id
group by player_info.name_id)
select distinct
on (player_info.name_id) player_info.name_id              as name_id,
    pi.sleeper_id                    as sleeper_id,
    player_info.full_name            as full_name,
    player_info.first_name           as first_name,
    player_info.last_name            as last_name,
    player_info.team                 as team,
    player_info.position             as position,
    player_info.age                  as age,
    player_info.experience           as experience,
    player_info.injury_status        as injury_status,
    coalesce(pv.trade_value, 0)      as trade_value,
    coalesce(pv.sf_trade_value, 0)   as sf_trade_value,
    pv.sf_position_rank              as sf_position_rank,
    coalesce(pv.position_rank, null) as position_rank,
    pv.created_at                    as date,
    allTimeHighSF.all_time_high_sf,
    allTimeLowSF.all_time_low_sf,
    allTimeHigh.all_time_high,
    allTimeLow.all_time_low,
    threeMonthHighSf.three_month_high_sf,
    threeMonthHigh.three_month_high,
    threeMonthLowSf.three_month_low_sf,
    threeMonthLow.three_month_low,
    lastMonthValue.last_month_value,
    lastMonthValue.last_month_value_sf,
    mostRecentDataPoint.most_recent_data_point
from player_info
    left join player_values pv
on player_info.name_id = pv.name_id and pv.created_at > now()::date - 1
    left join player_ids pi on player_info.name_id = pi.name_id
    left join allTimeHighSF on allTimeHighSF.name_id = player_info.name_id
    left join allTimeHigh on allTimeHigh.name_id = player_info.name_id
    left join allTimeLowSF on allTimeLowSF.name_id = player_info.name_id
    left join allTimeLow on allTimeLow.name_id = player_info.name_id
    left join threeMonthHighSf on threeMonthHighSf.name_id = player_info.name_id
    left join threeMonthHigh on threeMonthHigh.name_id = player_info.name_id
    left join threeMonthLowSf on threeMonthLowSf.name_id = player_info.name_id
    left join threeMonthLow on threeMonthLow.name_id = player_info.name_id
    left join lastMonthValue on lastMonthValue.name_id = player_info.name_id
    left join mostRecentDataPoint on mostRecentDataPoint.name_id = player_info.name_id
where player_info.active is not false
order by player_info.name_id, pv.id desc
    ) as T
order by sf_trade_value desc
WITH NO DATA;


CREATE UNIQUE INDEX ON mat_vw_players (name_id);
REFRESH MATERIALIZED VIEW mat_vw_players;
-- REFRESH MATERIALIZED VIEW CONCURRENTLY mat_vw_players;

