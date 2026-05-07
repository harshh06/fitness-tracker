-- ============================================================
-- Pulse Fitness — 003_seed_exercises.sql
-- Seeds 150 exercises + muscle mappings
-- Idempotent: uses ON CONFLICT DO NOTHING
-- ============================================================

BEGIN;

-- Compact seed table: muscles encoded as 'group:role' pairs
-- Roles: p=primary, s=secondary, t=stabilizer
CREATE TEMP TABLE _seed (
    name TEXT,
    category TEXT,
    equipment TEXT,
    difficulty TEXT,
    is_compound BOOLEAN,
    muscles TEXT
);

INSERT INTO _seed VALUES
-- ==================== STRENGTH (80) ====================
-- Chest (10)
('Barbell Bench Press',          'strength','barbell',   'intermediate', true,  'chest:p,triceps:s,front_delts:s,abs:t'),
('Incline Barbell Bench Press',  'strength','barbell',   'intermediate', true,  'chest:p,front_delts:s,triceps:s,abs:t'),
('Dumbbell Bench Press',         'strength','dumbbell',  'beginner',     true,  'chest:p,triceps:s,front_delts:s,abs:t'),
('Incline Dumbbell Press',       'strength','dumbbell',  'intermediate', true,  'chest:p,front_delts:s,triceps:s,abs:t'),
('Dumbbell Fly',                 'strength','dumbbell',  'intermediate', false, 'chest:p,front_delts:s'),
('Cable Crossover',              'strength','cable',     'intermediate', false, 'chest:p,front_delts:s,abs:t'),
('Push-Up',                      'strength','bodyweight','beginner',     true,  'chest:p,triceps:s,front_delts:s,abs:t'),
('Decline Barbell Bench Press',  'strength','barbell',   'intermediate', true,  'chest:p,triceps:s,front_delts:t'),
('Machine Chest Press',          'strength','machine',   'beginner',     true,  'chest:p,triceps:s,front_delts:s'),
('Pec Deck',                     'strength','machine',   'beginner',     false, 'chest:p,front_delts:s'),
-- Back (12)
('Barbell Deadlift',             'strength','barbell',   'advanced',     true,  'hamstrings:p,glute_max:p,lower_back:p,lats:s,traps:s,forearms:s,abs:t'),
('Conventional Pull-Up',         'strength','bodyweight','intermediate', true,  'lats:p,biceps:s,rhomboids:s,abs:t,forearms:t'),
('Chin-Up',                      'strength','bodyweight','intermediate', true,  'lats:p,biceps:p,rhomboids:s,abs:t,forearms:t'),
('Barbell Bent-Over Row',        'strength','barbell',   'intermediate', true,  'lats:p,rhomboids:p,biceps:s,traps:s,abs:t,lower_back:t'),
('Dumbbell Single-Arm Row',      'strength','dumbbell',  'beginner',     true,  'lats:p,rhomboids:p,biceps:s,traps:s,abs:t'),
('Seated Cable Row',             'strength','cable',     'beginner',     true,  'lats:p,rhomboids:p,biceps:s,traps:s,abs:t'),
('Lat Pulldown',                 'strength','machine',   'beginner',     true,  'lats:p,biceps:s,rhomboids:s,forearms:t'),
('T-Bar Row',                    'strength','barbell',   'intermediate', true,  'lats:p,rhomboids:p,biceps:s,traps:s,abs:t,lower_back:t'),
('Face Pull',                    'strength','cable',     'beginner',     false, 'rear_delts:p,rhomboids:p,traps:p'),
('Cable Straight-Arm Pulldown',  'strength','cable',     'intermediate', false, 'lats:p,triceps:s,rear_delts:s,abs:t'),
('Rack Pull',                    'strength','barbell',   'advanced',     true,  'traps:p,lower_back:p,glute_max:s,forearms:s,abs:t'),
('Inverted Row',                 'strength','bodyweight','beginner',     true,  'lats:p,rhomboids:p,biceps:s,abs:t'),
-- Shoulders (8)
('Overhead Press',               'strength','barbell',   'intermediate', true,  'front_delts:p,side_delts:p,triceps:s,abs:t'),
('Dumbbell Shoulder Press',      'strength','dumbbell',  'intermediate', true,  'front_delts:p,side_delts:p,triceps:s,abs:t'),
('Lateral Raise',                'strength','dumbbell',  'beginner',     false, 'side_delts:p'),
('Front Raise',                  'strength','dumbbell',  'beginner',     false, 'front_delts:p'),
('Reverse Fly',                  'strength','dumbbell',  'beginner',     false, 'rear_delts:p,rhomboids:p'),
('Arnold Press',                 'strength','dumbbell',  'intermediate', true,  'front_delts:p,side_delts:p,triceps:s,abs:t'),
('Upright Row',                  'strength','barbell',   'intermediate', true,  'side_delts:p,traps:p,front_delts:s,biceps:s'),
('Cable Lateral Raise',          'strength','cable',     'beginner',     false, 'side_delts:p'),
-- Biceps (6)
('Barbell Curl',                 'strength','barbell',   'beginner',     false, 'biceps:p,forearms:s'),
('Dumbbell Curl',                'strength','dumbbell',  'beginner',     false, 'biceps:p,forearms:s'),
('Hammer Curl',                  'strength','dumbbell',  'beginner',     false, 'biceps:p,forearms:p'),
('Preacher Curl',                'strength','dumbbell',  'intermediate', false, 'biceps:p,forearms:s'),
('Cable Curl',                   'strength','cable',     'beginner',     false, 'biceps:p,forearms:s'),
('Concentration Curl',           'strength','dumbbell',  'beginner',     false, 'biceps:p'),
-- Triceps (6)
('Close-Grip Bench Press',      'strength','barbell',   'intermediate', true,  'triceps:p,chest:s,front_delts:t'),
('Tricep Dip',                   'strength','bodyweight','intermediate', true,  'triceps:p,chest:s,front_delts:s,abs:t'),
('Skull Crusher',                'strength','barbell',   'intermediate', false, 'triceps:p'),
('Tricep Pushdown',              'strength','cable',     'beginner',     false, 'triceps:p'),
('Overhead Tricep Extension',    'strength','dumbbell',  'beginner',     false, 'triceps:p'),
('Diamond Push-Up',              'strength','bodyweight','intermediate', true,  'triceps:p,chest:s,abs:t,front_delts:t'),
-- Quads (10)
('Barbell Back Squat',           'strength','barbell',   'intermediate', true,  'quads:p,glute_max:p,hamstrings:s,abs:t,lower_back:t'),
('Barbell Front Squat',          'strength','barbell',   'advanced',     true,  'quads:p,glute_max:s,abs:t'),
('Goblet Squat',                 'strength','dumbbell',  'beginner',     true,  'quads:p,glute_max:p,hamstrings:s,abs:t'),
('Leg Press',                    'strength','machine',   'beginner',     true,  'quads:p,glute_max:p,hamstrings:s'),
('Leg Extension',                'strength','machine',   'beginner',     false, 'quads:p'),
('Bulgarian Split Squat',        'strength','dumbbell',  'intermediate', true,  'quads:p,glute_max:p,hamstrings:s,glute_med:s,abs:t'),
('Walking Lunge',                'strength','dumbbell',  'intermediate', true,  'quads:p,glute_max:p,hamstrings:s,glute_med:s,abs:t'),
('Hack Squat',                   'strength','machine',   'intermediate', true,  'quads:p,glute_max:s'),
('Step-Up',                      'strength','dumbbell',  'beginner',     true,  'quads:p,glute_max:p,hamstrings:s,glute_med:s,abs:t'),
('Sissy Squat',                  'strength','bodyweight','advanced',     false, 'quads:p,abs:t'),
-- Posterior Chain (8)
('Romanian Deadlift',            'strength','barbell',   'intermediate', true,  'hamstrings:p,glute_max:p,lower_back:s,abs:t'),
('Dumbbell Romanian Deadlift',   'strength','dumbbell',  'beginner',     true,  'hamstrings:p,glute_max:p,lower_back:s,abs:t'),
('Lying Leg Curl',               'strength','machine',   'beginner',     false, 'hamstrings:p,calves:s'),
('Seated Leg Curl',              'strength','machine',   'beginner',     false, 'hamstrings:p,calves:s'),
('Hip Thrust',                   'strength','barbell',   'intermediate', true,  'glute_max:p,hamstrings:s,abs:t'),
('Cable Pull-Through',           'strength','cable',     'beginner',     true,  'glute_max:p,hamstrings:p,lower_back:s,abs:t'),
('Good Morning',                 'strength','barbell',   'advanced',     true,  'hamstrings:p,lower_back:p,glute_max:s,abs:t'),
('Glute Bridge',                 'strength','bodyweight','beginner',     true,  'glute_max:p,hamstrings:s,abs:t'),
-- Calves (2)
('Standing Calf Raise',          'strength','machine',   'beginner',     false, 'calves:p'),
('Seated Calf Raise',            'strength','machine',   'beginner',     false, 'calves:p'),
-- Core (8)
('Plank',                        'strength','bodyweight','beginner',     false, 'abs:p,obliques:s,front_delts:t'),
('Dead Bug',                     'strength','bodyweight','beginner',     false, 'abs:p,hip_flexors:s,obliques:s'),
('Hanging Leg Raise',            'strength','bodyweight','intermediate', false, 'abs:p,hip_flexors:p,obliques:s,forearms:t'),
('Ab Rollout',                   'strength','other',     'intermediate', false, 'abs:p,front_delts:t'),
('Cable Woodchop',               'strength','cable',     'intermediate', false, 'obliques:p,abs:s'),
('Russian Twist',                'strength','bodyweight','beginner',     false, 'obliques:p,abs:s'),
('Pallof Press',                 'strength','cable',     'beginner',     false, 'abs:p,obliques:p'),
('Bird Dog',                     'strength','bodyweight','beginner',     false, 'abs:p,lower_back:p,glute_max:s'),
-- Full-Body / Compound (10)
('Power Clean',                  'strength','barbell',   'advanced',     true,  'hamstrings:p,glute_max:p,traps:p,front_delts:s,forearms:s,abs:t'),
('Kettlebell Swing',             'strength','kettlebell','intermediate', true,  'glute_max:p,hamstrings:p,lower_back:s,front_delts:s,abs:t'),
('Kettlebell Turkish Get-Up',    'strength','kettlebell','advanced',     true,  'front_delts:p,abs:p,glute_max:s,quads:s,obliques:t'),
('Farmer''s Walk',               'strength','dumbbell',  'intermediate', true,  'forearms:p,traps:p,abs:s'),
('Trap Bar Deadlift',            'strength','barbell',   'intermediate', true,  'quads:p,glute_max:p,hamstrings:p,traps:s,lower_back:s,abs:t,forearms:t'),
('Barbell Thruster',             'strength','barbell',   'advanced',     true,  'quads:p,front_delts:p,glute_max:s,triceps:s,abs:t'),
('Dumbbell Snatch',              'strength','dumbbell',  'advanced',     true,  'front_delts:p,glute_max:p,hamstrings:p,traps:s,abs:t'),
('Kettlebell Goblet Squat',      'strength','kettlebell','beginner',     true,  'quads:p,glute_max:p,hamstrings:s,abs:t'),
('Battle Ropes',                 'strength','other',     'intermediate', true,  'front_delts:p,side_delts:p,abs:p,forearms:s'),
('Sled Push',                    'strength','other',     'intermediate', true,  'quads:p,glute_max:p,calves:s,abs:t'),

-- ==================== CARDIO (20) ====================
('Treadmill Running',            'cardio','machine',     'beginner',     true,  'quads:p,hamstrings:p,calves:s,glute_max:s,abs:t'),
('Outdoor Running',              'cardio','bodyweight',  'beginner',     true,  'quads:p,hamstrings:p,calves:s,glute_max:s,abs:t'),
('Stationary Cycling',           'cardio','machine',     'beginner',     true,  'quads:p,hamstrings:s,calves:s'),
('Rowing Machine',               'cardio','machine',     'intermediate', true,  'lats:p,quads:p,biceps:s,hamstrings:s,rhomboids:s,abs:t'),
('Elliptical Trainer',           'cardio','machine',     'beginner',     true,  'quads:p,glute_max:p,hamstrings:s'),
('Stair Climber',                'cardio','machine',     'intermediate', true,  'quads:p,glute_max:p,calves:s,abs:t'),
('Jump Rope',                    'cardio','other',       'intermediate', true,  'calves:p,quads:s,forearms:s,abs:t'),
('Burpee',                       'cardio','bodyweight',  'intermediate', true,  'quads:p,chest:p,front_delts:s,triceps:s,abs:t'),
('Mountain Climber',             'cardio','bodyweight',  'beginner',     true,  'abs:p,hip_flexors:p,front_delts:s,quads:s'),
('Jumping Jack',                 'cardio','bodyweight',  'beginner',     true,  'calves:p,side_delts:s,quads:s'),
('Box Jump',                     'cardio','bodyweight',  'intermediate', true,  'quads:p,glute_max:p,calves:s,abs:t'),
('High Knees',                   'cardio','bodyweight',  'beginner',     true,  'hip_flexors:p,quads:p,calves:s,abs:s'),
('Skating',                      'cardio','other',       'intermediate', true,  'quads:p,glute_max:p,glute_med:p,hamstrings:s,calves:s,abs:t'),
('Swimming',                     'cardio','bodyweight',  'intermediate', true,  'lats:p,front_delts:p,chest:s,abs:s'),
('Sprint Intervals',             'cardio','bodyweight',  'advanced',     true,  'quads:p,hamstrings:p,glute_max:s,calves:s,abs:t'),
('Assault Bike',                 'cardio','machine',     'intermediate', true,  'quads:p,front_delts:s,abs:s'),
('Kettlebell Snatch',            'cardio','kettlebell',  'advanced',     true,  'front_delts:p,glute_max:p,hamstrings:s,abs:s,forearms:t'),
('Bear Crawl',                   'cardio','bodyweight',  'intermediate', true,  'front_delts:p,abs:p,quads:s'),
('Tuck Jump',                    'cardio','bodyweight',  'intermediate', true,  'quads:p,glute_max:p,calves:s,abs:t'),
('Lateral Shuffle',              'cardio','bodyweight',  'beginner',     true,  'quads:p,glute_med:p,calves:s,abs:t'),

-- ==================== FLEXIBILITY (15) ====================
('Standing Hamstring Stretch',   'flexibility','bodyweight','beginner',  false, 'hamstrings:p,lower_back:s'),
('Seated Forward Fold',          'flexibility','bodyweight','beginner',  false, 'hamstrings:p,lower_back:p'),
('Hip Flexor Stretch',           'flexibility','bodyweight','beginner',  false, 'hip_flexors:p,quads:s'),
('Pigeon Stretch',               'flexibility','bodyweight','intermediate',false,'glute_max:p,hip_flexors:p,glute_med:s'),
('Quad Stretch (Standing)',      'flexibility','bodyweight','beginner',  false, 'quads:p,hip_flexors:s'),
('Chest Doorway Stretch',        'flexibility','bodyweight','beginner',  false, 'chest:p,front_delts:s'),
('Cat-Cow Stretch',              'flexibility','bodyweight','beginner',  false, 'lower_back:p,abs:p'),
('Child''s Pose',                'flexibility','bodyweight','beginner',  false, 'lower_back:p,lats:p'),
('Shoulder Cross-Body Stretch',  'flexibility','bodyweight','beginner',  false, 'rear_delts:p,rhomboids:s'),
('Figure-Four Stretch',          'flexibility','bodyweight','beginner',  false, 'glute_max:p,hip_flexors:s'),
('Butterfly Stretch',            'flexibility','bodyweight','beginner',  false, 'hip_flexors:p,glute_med:s'),
('Calf Stretch (Wall)',          'flexibility','bodyweight','beginner',  false, 'calves:p'),
('Foam Roller IT Band',          'flexibility','other',     'beginner',  false, 'quads:p,glute_med:s'),
('Foam Roller Thoracic Spine',   'flexibility','other',     'beginner',  false, 'traps:p,rhomboids:s'),
('Lat Stretch (Doorway)',        'flexibility','bodyweight','beginner',  false, 'lats:p'),

-- ==================== REHAB (20) ====================
('Terminal Knee Extension',      'rehab','band',       'beginner',     false, 'quads:p'),
('Straight Leg Raise',           'rehab','bodyweight', 'beginner',     false, 'quads:p,hip_flexors:p,abs:t'),
('Clamshell',                    'rehab','band',       'beginner',     false, 'glute_med:p'),
('Side-Lying Hip Abduction',     'rehab','bodyweight', 'beginner',     false, 'glute_med:p'),
('Wall Sit',                     'rehab','bodyweight', 'beginner',     false, 'quads:p,glute_max:s,abs:t'),
('Mini-Band Lateral Walk',       'rehab','band',       'beginner',     false, 'glute_med:p,quads:s'),
('Ankle Alphabet',               'rehab','bodyweight', 'beginner',     false, 'calves:p'),
('Prone Y Raise',                'rehab','bodyweight', 'beginner',     false, 'traps:p,rear_delts:p,rhomboids:s'),
('Scapular Push-Up',             'rehab','bodyweight', 'beginner',     false, 'traps:p,front_delts:s'),
('Band Pull-Apart',              'rehab','band',       'beginner',     false, 'rear_delts:p,rhomboids:p,traps:s'),
('External Rotation (Band)',     'rehab','band',       'beginner',     false, 'rear_delts:p'),
('Internal Rotation (Band)',     'rehab','band',       'beginner',     false, 'front_delts:p'),
('Single-Leg Balance',           'rehab','bodyweight', 'beginner',     false, 'quads:p,glute_med:s,calves:s,abs:t'),
('Heel Slide',                   'rehab','bodyweight', 'beginner',     false, 'quads:p,hamstrings:p'),
('Eccentric Heel Drop',          'rehab','bodyweight', 'beginner',     false, 'calves:p'),
('Towel Squeeze (VMO)',          'rehab','other',      'beginner',     false, 'quads:p'),
('Supine Hip Flexor March',      'rehab','bodyweight', 'beginner',     false, 'hip_flexors:p,abs:s'),
('Pelvic Tilt',                  'rehab','bodyweight', 'beginner',     false, 'abs:p,lower_back:p'),
('Wrist Flexor Stretch',         'rehab','bodyweight', 'beginner',     false, 'forearms:p'),
('Neck Retraction (Chin Tuck)',  'rehab','bodyweight', 'beginner',     false, 'traps:p'),

-- ==================== YOGA (15) ====================
('Downward-Facing Dog',          'yoga','bodyweight',  'beginner',     false, 'hamstrings:p,front_delts:p,calves:s,lats:s,abs:t'),
('Warrior I',                    'yoga','bodyweight',  'beginner',     false, 'quads:p,hip_flexors:p,glute_max:s,abs:t'),
('Warrior II',                   'yoga','bodyweight',  'beginner',     false, 'quads:p,glute_med:p,side_delts:s,abs:t'),
('Triangle Pose',                'yoga','bodyweight',  'intermediate', false, 'hamstrings:p,hip_flexors:p,obliques:s'),
('Tree Pose',                    'yoga','bodyweight',  'beginner',     false, 'quads:p,glute_med:p,calves:s,abs:t'),
('Chair Pose',                   'yoga','bodyweight',  'beginner',     false, 'quads:p,glute_max:p,front_delts:s,abs:t'),
('Cobra Pose',                   'yoga','bodyweight',  'beginner',     false, 'lower_back:p,chest:s'),
('Bridge Pose',                  'yoga','bodyweight',  'beginner',     false, 'glute_max:p,lower_back:p,hamstrings:s,abs:t'),
('Seated Twist',                 'yoga','bodyweight',  'beginner',     false, 'obliques:p,lower_back:s'),
('Crow Pose',                    'yoga','bodyweight',  'advanced',     true,  'front_delts:p,abs:p,triceps:s,forearms:t'),
('Half Moon Pose',               'yoga','bodyweight',  'intermediate', false, 'glute_med:p,abs:p,hamstrings:s,obliques:t'),
('Boat Pose',                    'yoga','bodyweight',  'intermediate', false, 'abs:p,hip_flexors:p,quads:s'),
('Camel Pose',                   'yoga','bodyweight',  'intermediate', false, 'hip_flexors:p,chest:p,lower_back:s'),
('Sun Salutation A',             'yoga','bodyweight',  'beginner',     true,  'front_delts:p,quads:p,hamstrings:s,chest:s,abs:s'),
('Corpse Pose (Savasana)',       'yoga','bodyweight',  'beginner',     false, 'lower_back:p');


-- ============================================================
-- 1. Insert into exercise_library
-- ============================================================
INSERT INTO exercise_library (name, category, equipment, difficulty, is_compound, is_system)
SELECT name, category, equipment, difficulty, is_compound, true
FROM _seed
ON CONFLICT (name) DO NOTHING;


-- ============================================================
-- 2. Insert into exercise_muscles
-- ============================================================
INSERT INTO exercise_muscles (exercise_id, muscle_group, role)
SELECT
    el.id,
    split_part(m.val, ':', 1),
    CASE split_part(m.val, ':', 2)
        WHEN 'p' THEN 'primary'
        WHEN 's' THEN 'secondary'
        WHEN 't' THEN 'stabilizer'
    END
FROM _seed s
JOIN exercise_library el ON el.name = s.name
CROSS JOIN LATERAL unnest(string_to_array(s.muscles, ',')) AS m(val)
ON CONFLICT (exercise_id, muscle_group) DO NOTHING;


-- Cleanup
DROP TABLE _seed;

COMMIT;
