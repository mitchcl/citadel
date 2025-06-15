-- Insert sample games if they don't exist
INSERT INTO games (id, name) VALUES 
(1, 'Team Fortress 2')
ON CONFLICT (id) DO NOTHING;

-- Insert sample formats if they don't exist
INSERT INTO formats (id, game_id, name, description, player_count, max_player_count) VALUES 
(1, 1, '6v6', 'Competitive 6v6 format', 6, 12),
(2, 1, 'Highlander', 'Competitive 9v9 format with one of each class', 9, 18),
(3, 2, '5v5', 'Competitive 5v5 format', 5, 10)
ON CONFLICT (id) DO NOTHING;

-- Insert sample leagues if they don't exist
INSERT INTO leagues (id, format_id, name, description, category, status, signuppable, roster_locked, matches_submittable, transfers_require_approval, allow_set_ready, min_players, max_players, created_at, updated_at) VALUES 
(1, 1, 'Summer 6v6 Season', 'Competitive 6v6 Team Fortress 2 league for summer 2025', 'Seasonal', 1, true, false, true, false, true, 6, 12, NOW(), NOW()),
(2, 2, 'Winter Highlander Cup', 'Annual highlander tournament featuring the best 9v9 teams', 'Tournament', 1, true, false, true, true, true, 9, 18, NOW(), NOW()),
ON CONFLICT (id) DO NOTHING;

-- Insert sample divisions
INSERT INTO league_divisions (id, league_id, name) VALUES 
(1, 1, 'Premier Division'),
(2, 1, 'Intermediate Division'),
(3, 2, 'Main Division')
ON CONFLICT (id) DO NOTHING;

-- Insert sample users
INSERT INTO users (id, steam_id, name, email, alias, avatar, description, steam_profile, enabled, admin, banned, created_at, updated_at) VALUES 
(1, '76561198000000001', 'DemoKnight', 'demo@example.com', 'Demo', null, 'Experienced demoman main looking for a competitive team', 'https://steamcommunity.com/profiles/76561198000000001', true, false, false, NOW(), NOW()),
(2, '76561198000000002', 'MedicMain', 'medic@example.com', 'Doc', null, 'Main medic with 5+ years competitive experience', 'https://steamcommunity.com/profiles/76561198000000002', true, false, false, NOW(), NOW()),
(3, '76561198000000003', 'ScoutSpeed', 'scout@example.com', 'Speedy', null, 'Fast scout player, loves to flank', 'https://steamcommunity.com/profiles/76561198000000003', true, false, false, NOW(), NOW()),
(4, '76561198000000004', 'AdminUser', 'admin@example.com', 'Admin', null, 'League administrator and organizer', 'https://steamcommunity.com/profiles/76561198000000004', true, true, false, NOW(), NOW()),
(5, '76561198000000005', 'SoldierMain', 'soldier@example.com', 'Rocket', null, 'Pocket soldier with tournament experience', 'https://steamcommunity.com/profiles/76561198000000005', true, false, false, NOW(), NOW()),
(6, '76561198000000006', 'SniperPro', 'sniper@example.com', 'Headshot', null, 'Professional sniper, love long range picks', 'https://steamcommunity.com/profiles/76561198000000006', true, false, false, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert sample teams
INSERT INTO teams (id, name, tag, description, notice, avatar, created_at, updated_at) VALUES 
(1, 'Team Fortress Elite', 'TFE', 'Premier division team with years of competitive experience. We are looking for dedicated players who want to compete at the highest level.', 'Tryouts this weekend!', null, NOW(), NOW()),
(2, 'Mercenary Squad', 'MERC', 'Fun-loving team that focuses on teamwork and improvement. Great environment for newer competitive players.', null, null, NOW(), NOW()),
(3, 'The Highlanders', 'HL9', 'Dedicated highlander team competing in multiple leagues. We value strategy and communication above all.', 'New roster forming for winter season', null, NOW(), NOW()),
(4, 'Rocket Scientists', 'RS', 'Soldier mains unite! We focus on explosive gameplay and strategic bombing runs.', null, null, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert team players (connect users to teams)
INSERT INTO team_players (id, team_id, user_id) VALUES 
(1, 1, 1),  -- DemoKnight in Team Fortress Elite
(2, 1, 2),  -- MedicMain in Team Fortress Elite
(3, 1, 5),  -- SoldierMain in Team Fortress Elite
(4, 2, 3),  -- ScoutSpeed in Mercenary Squad
(5, 2, 6),  -- SniperPro in Mercenary Squad
(6, 3, 4),  -- AdminUser in The Highlanders
(7, 4, 5)   -- SoldierMain also in Rocket Scientists (can be on multiple teams)
ON CONFLICT (id) DO NOTHING;

-- Insert sample rosters (teams registered for leagues)
INSERT INTO league_rosters (id, league_id, division_id, team_id, name, description, approved, disbanded, created_at, updated_at) VALUES 
(1, 1, 1, 1, 'TFE Premier Roster', 'Our main competitive roster for the premier division', true, false, NOW(), NOW()),
(2, 1, 2, 2, 'MERC Intermediate', 'Development roster for intermediate play', true, false, NOW(), NOW()),
(3, 2, 3, 3, 'HL9 Main Roster', 'Highlander main team roster', true, false, NOW(), NOW()),
(4, 1, 2, 4, 'RS Intermediate', 'Rocket Scientists intermediate roster', false, false, NOW(), NOW())  -- pending approval
ON CONFLICT (id) DO NOTHING;

-- Insert roster players (connect users to specific league rosters)
INSERT INTO league_roster_players (id, roster_id, user_id) VALUES 
(1, 1, 1),  -- DemoKnight in TFE Premier
(2, 1, 2),  -- MedicMain in TFE Premier
(3, 1, 5),  -- SoldierMain in TFE Premier
(4, 2, 3),  -- ScoutSpeed in MERC Intermediate
(5, 2, 6),  -- SniperPro in MERC Intermediate
(6, 3, 4),  -- AdminUser in HL9 Main
(7, 4, 5)   -- SoldierMain in RS Intermediate
ON CONFLICT (id) DO NOTHING;

-- Insert some sample matches
INSERT INTO league_matches (id, division_id, home_roster_id, away_roster_id, round, status, created_at, updated_at) VALUES 
(1, 1, 1, 1, 1, 0, NOW(), NOW()),  -- TFE vs TFE (placeholder match)
(2, 2, 2, 4, 1, 0, NOW(), NOW())   -- MERC vs RS
ON CONFLICT (id) DO NOTHING;

-- Insert some sample maps
INSERT INTO maps (id, name) VALUES 
(1, 'cp_badlands'),
(2, 'cp_granary'),
(3, 'cp_gullywash'),
(4, 'cp_metalworks'),
(5, 'cp_process'),
(6, 'cp_snakewater'),
(7, 'koth_viaduct'),
(8, 'de_dust2'),
(9, 'de_inferno'),
(10, 'de_mirage')
ON CONFLICT (id) DO NOTHING;
