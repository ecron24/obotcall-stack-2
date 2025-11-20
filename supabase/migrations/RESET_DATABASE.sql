-- =====================================================
-- RESET COMPLET DE LA BASE DE DONNÉES
-- =====================================================
-- Ce script supprime TOUT et permet de repartir à zéro
-- ATTENTION: Cela supprime TOUTES les données !
-- =====================================================

-- 1. Supprimer tous les schémas applicatifs (s'ils existent)
DROP SCHEMA IF EXISTS inter_app CASCADE;
DROP SCHEMA IF EXISTS immo_app CASCADE;
DROP SCHEMA IF EXISTS agent_app CASCADE;
DROP SCHEMA IF EXISTS assist_app CASCADE;

-- 2. Supprimer toutes les tables du schéma public
-- (garder les tables système de Supabase)
DROP TABLE IF EXISTS public.revoked_tokens CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.domains CASCADE;
DROP TABLE IF EXISTS public.user_tenant_roles CASCADE;
DROP TABLE IF EXISTS public.tenants CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.countries CASCADE;

-- 3. Supprimer les fonctions personnalisées
DROP FUNCTION IF EXISTS get_current_user_tenant_ids() CASCADE;
DROP FUNCTION IF EXISTS get_user_role_in_tenant(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS is_tenant_owner(uuid) CASCADE;
DROP FUNCTION IF EXISTS is_tenant_admin(uuid) CASCADE;
DROP FUNCTION IF EXISTS create_audit_log(uuid, text, text, jsonb, jsonb) CASCADE;

-- 4. Nettoyer les extensions (si vous les avez créées)
-- Ne pas DROP les extensions systèmes de Supabase !
-- DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE;
-- DROP EXTENSION IF EXISTS "pgcrypto" CASCADE;

-- =====================================================
-- LA BASE EST MAINTENANT PROPRE
-- =====================================================
-- Vous pouvez maintenant exécuter les migrations dans l'ordre :
-- 1. 001_schema_public.sql (version optimisée)
-- 2. 002_schema_inter_app.sql (version optimisée)
-- 3. 003_schema_immo_app.sql (version optimisée)
-- 4. 004_schema_agent_app.sql
-- =====================================================
