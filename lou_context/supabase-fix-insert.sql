-- ============================================================
-- LIKASLENS SUPABASE FIX — INSERT POLICIES
-- Run this AFTER supabase-setup.sql
-- Allows anonymous + authenticated users to submit reports
-- ============================================================

-- Drop the existing INSERT policies that require auth
DROP POLICY IF EXISTS "auth_insert_tickets" ON tickets;
DROP POLICY IF EXISTS "auth_insert_reports" ON reports;
DROP POLICY IF EXISTS "auth_insert_notifications" ON notifications;
DROP POLICY IF EXISTS "auth_insert_evidence" ON ticket_evidence;
DROP POLICY IF EXISTS "auth_insert_timeline" ON ticket_timeline;
DROP POLICY IF EXISTS "auth_insert_contact" ON contact_messages;

-- Allow ANY user (anonymous or authenticated) to INSERT tickets
-- This is needed for citizen report submission
CREATE POLICY "public_insert_tickets" ON tickets FOR INSERT WITH CHECK (true);

-- Allow ANY user to INSERT reports (evidence table)
CREATE POLICY "public_insert_reports" ON reports FOR INSERT WITH CHECK (true);

-- Authenticated-only for notifications, evidence, timeline, contact
CREATE POLICY "auth_insert_notifications" ON notifications FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_evidence" ON ticket_evidence FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_timeline" ON ticket_timeline FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_contact" ON contact_messages FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
