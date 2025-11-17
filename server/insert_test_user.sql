USE medhome_visits;

-- Insertar usuario de prueba
INSERT INTO users (rut, name, email) VALUES 
('15636274', 'Daniel Hernán', 'dlhernan@uc.cl')
ON DUPLICATE KEY UPDATE name='Daniel Hernán', email='dlhernan@uc.cl';

-- Obtener el ID del usuario
SET @professional_id = (SELECT id FROM users WHERE rut = '15636274' LIMIT 1);

-- Insertar visitas de prueba para hoy
INSERT INTO visits (professional_id, patient_name, address, lat, lng, scheduled_start, scheduled_end) VALUES
(@professional_id, 'Juan Pérez', 'Av. Providencia 1234, Depto 502', -33.4265, -70.6170, 
 DATE_ADD(NOW(), INTERVAL 1 HOUR), DATE_ADD(NOW(), INTERVAL 1 HOUR 45 MINUTE)),
(@professional_id, 'María López', 'Los Leones 765, Santiago', -33.4280, -70.6180,
 DATE_ADD(NOW(), INTERVAL 2 HOUR), DATE_ADD(NOW(), INTERVAL 2 HOUR 45 MINUTE)),
(@professional_id, 'Carlos Núñez', 'Av. Irarrázaval 2300, Ñuñoa', -33.4295, -70.6195,
 DATE_ADD(NOW(), INTERVAL 3 HOUR), DATE_ADD(NOW(), INTERVAL 3 HOUR 45 MINUTE))
ON DUPLICATE KEY UPDATE patient_name=patient_name;

SELECT 'Usuario y visitas insertadas correctamente' as resultado;
