-- CREATE USER docker;
-- CREATE DATABASE docker;
GRANT ALL PRIVILEGES ON DATABASE docker TO docker;

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