SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;

UPDATE users
SET password_hash = '$2a$12$F9X0WsCVSvro9j5//1HdlunsrmdTrqIy25znJABNIQmII9E2d3aYC'
WHERE email = 'admin@skaev.com';

SELECT LEN(password_hash) AS L, password_hash FROM users WHERE email = 'admin@skaev.com';
