-- COPY ktc_players FROM '/data/datasource.csv' DELIMITER ',' CSV;
-- SELECT SETVAL('ktc_players_id_seq', (SELECT MAX(id) + 1 FROM ktc_players));

COPY player_ids FROM '/data/player_ids.csv' DELIMITER ',' CSV;
SELECT SETVAL('player_ids_id_seq', (SELECT MAX(id) + 1 FROM player_ids));

COPY player_info FROM '/data/player_info.csv' DELIMITER ',' CSV;
SELECT SETVAL('player_info_id_seq', (SELECT MAX(id) + 1 FROM player_info));

COPY player_info FROM '/data/player_values.csv' DELIMITER ',' CSV;
SELECT SETVAL('player_values_id_seq', (SELECT MAX(id) + 1 FROM player_values));