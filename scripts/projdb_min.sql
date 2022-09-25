PRAGMA FOREIGN_KEYS=1;
BEGIN;
DELETE FROM ellipsoid WHERE name != 'WGS 84';
DELETE FROM vertical_crs;
DELETE FROM vertical_datum;
DELETE FROM deprecation;
DELETE FROM alias_name;
DELETE FROM conversion_table WHERE code NOT IN (
  SELECT conversion_code FROM projected_crs WHERE
  cast(code as int) IN (3857, 900913) OR
  (cast(code as int) >= 32601 AND cast(code as int) <= 32660) OR  -- UTM N
  (cast(code as int) >= 32701 AND cast(code as int) <= 32760)  -- UTM S
);
DELETE FROM extent;
DELETE FROM supersession;
DELETE FROM grid_transformation;
DELETE FROM other_transformation;
DELETE FROM grid_alternatives;
DELETE FROM geodetic_crs WHERE cast(code as int) != 4326;
DELETE FROM projected_crs WHERE
  cast(code as int) NOT IN (3857, 900913) AND
  NOT (cast(code as int) >= 32601 AND cast(code as int) <= 32660) AND  -- UTM N
  NOT (cast(code as int) >= 32701 AND cast(code as int) <= 32760);  -- UTM S
-- clean up table usage
DELETE FROM usage WHERE (object_table_name, object_auth_name, object_code) IN (
  SELECT object_table_name, object_auth_name, object_code FROM usage WHERE NOT EXISTS (
    SELECT 1 FROM object_view o WHERE
        o.table_name = object_table_name AND
        o.auth_name = object_auth_name AND
        o.code = object_code));
COMMIT;
VACUUM;
PRAGMA foreign_key_check;
