-- PostgreSQL Extension for Generalized Search Tree with btree indexing
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- PostgreSQL Exclusion Constraint guaranteeing zero overlapping confirmed reservations at the database engine level
ALTER TABLE "Reservation" 
ADD CONSTRAINT "no_overlapping_confirmed_reservations" 
EXCLUDE USING gist (
  "resourceId" WITH =, 
  tsrange("startAt", "endAt", '[)') WITH &&
) 
WHERE ("status" = 'CONFIRMED');
