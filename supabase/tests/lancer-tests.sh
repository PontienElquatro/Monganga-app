#!/usr/bin/env bash
# Teste les migrations sur un PostgreSQL local (16+), sans toucher à Supabase.
# Usage : PGHOST=127.0.0.1 PGPORT=5432 PGUSER=postgres ./supabase/tests/lancer-tests.sh
set -euo pipefail
cd "$(dirname "$0")/.."
DB=monganga_tests
psql -v ON_ERROR_STOP=1 -q -d postgres -c "drop database if exists $DB" -c "create database $DB"
psql -v ON_ERROR_STOP=1 -q -d $DB -f tests/00_stubs_local.sql
for f in migrations/*.sql; do psql -v ON_ERROR_STOP=1 -q -d $DB -f "$f"; done
psql -v ON_ERROR_STOP=1 -d $DB -f tests/10_scenarios.sql 2>&1 | grep -E "ok :|ÉCHEC|ERROR|===" | sed 's/^psql:[^ ]* //'
