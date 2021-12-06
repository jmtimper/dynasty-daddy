create table ktc_players
(
	id serial not null,
	name_id varchar(30),
	sleeper_id varchar(30),
	full_name varchar(50),
	first_name varchar(30),
	last_name varchar(30),
	team varchar(3),
	position varchar(2),
	sf_position_rank int,
	position_rank int,
	age int,
	experience int,
	sf_trade_value int,
	trade_value int,
	date timestamp not null default CURRENT_TIMESTAMP
);


create unique index ktc_players_id_uindex
	on ktc_players (id);

alter table ktc_players
	add constraint ktc_players_pk
		primary key (id);

