-- exported files of data insert calls with reset primary key
COPY player_ids FROM '/data/player_ids.csv' DELIMITER ',' CSV;
SELECT SETVAL('player_ids_id_seq', (SELECT MAX(id) + 1 FROM player_ids));

COPY player_info FROM '/data/player_info.csv' DELIMITER ',' CSV;
SELECT SETVAL('player_info_id_seq', (SELECT MAX(id) + 1 FROM player_info));

COPY player_values FROM '/data/player_values.csv' DELIMITER ',' CSV;
SELECT SETVAL('player_values_id_seq', (SELECT MAX(id) + 1 FROM player_values));

-- insert config options into table with defaults
INSERT INTO config (config_key, config_value, description, created_at, updated_at) VALUES ('show_home_dialog', 'false', 'Boolean - if true display the home page dialog', '2022-06-22 12:26:12.376665 +00:00', '2022-06-22 12:26:12.376665 +00:00');
INSERT INTO config (config_key, config_value, description, created_at, updated_at) VALUES ('home_dialog_header', 'Upcoming release on 6/30/22', 'Header text for the dialog', '2022-06-22 12:26:12.376665 +00:00', '2022-06-22 12:26:12.376665 +00:00');
INSERT INTO config (config_key, config_value, description, created_at, updated_at) VALUES ('home_dialog_body', 'An upcoming release will occur on 6/20/22. There may be a few minutes of downtime. For more information about the release check out the discord.', 'Body text for the Home Dialog', '2022-06-22 12:26:12.376665 +00:00', '2022-06-22 12:26:12.376665 +00:00');
INSERT INTO config (config_key, config_value, description, created_at, updated_at) VALUES ('home_dialog_bg_color', '#a8882b', 'Background color for the modal', DEFAULT, DEFAULT)