-- Script de datos de prueba
-- Ejecutar después de las migraciones

USE medhome_visits;

-- Insertar usuarios de prueba
-- IMPORTANTE: El email aquí es el email de DESTINO (donde llega el código)
-- Este email debe estar asociado al RUT del usuario en la base de datos
INSERT INTO users (rut, name, email) VALUES 
('156362743', 'Daniel Hernández', 'dlhernan@uc.cl'),
('12345678', 'Dr. Juan Medina', 'dr.medina@example.com')
ON DUPLICATE KEY UPDATE name=name, email=VALUES(email);

-- Obtener el ID del usuario principal (Daniel)
SET @professional_id = (SELECT id FROM users WHERE rut = '156362743' LIMIT 1);

-- Si no existe, usar el usuario de prueba alternativo
SET @professional_id = IFNULL(@professional_id, (SELECT id FROM users WHERE rut = '12345678' LIMIT 1));

-- Insertar visitas de prueba para hoy
-- Ajustar las fechas según sea necesario
INSERT INTO visits (professional_id, patient_name, address, lat, lng, scheduled_start, scheduled_end) VALUES
(@professional_id, 'Juan Pérez', 'Av. Providencia 1234, Depto 502', -33.4265, -70.6170, 
 DATE_ADD(NOW(), INTERVAL 1 HOUR), DATE_ADD(NOW(), INTERVAL 1 HOUR 45 MINUTE)),
(@professional_id, 'María López', 'Los Leones 765, Santiago', -33.4280, -70.6180,
 DATE_ADD(NOW(), INTERVAL 2 HOUR), DATE_ADD(NOW(), INTERVAL 2 HOUR 45 MINUTE)),
(@professional_id, 'Carlos Núñez', 'Av. Irarrázaval 2300, Ñuñoa', -33.4295, -70.6195,
 DATE_ADD(NOW(), INTERVAL 3 HOUR), DATE_ADD(NOW(), INTERVAL 3 HOUR 45 MINUTE))
ON DUPLICATE KEY UPDATE patient_name=patient_name;

