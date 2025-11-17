CREATE DATABASE IF NOT EXISTS medhome_visits;
USE medhome_visits;

CREATE TABLE IF NOT EXISTS users (
  id            BIGINT PRIMARY KEY AUTO_INCREMENT,
  rut           VARCHAR(20) NOT NULL UNIQUE,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  is_active     TINYINT(1) DEFAULT 1,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                 ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS visits (
  id               BIGINT PRIMARY KEY AUTO_INCREMENT,
  professional_id  BIGINT NOT NULL,
  patient_name     VARCHAR(150) NOT NULL,
  address          VARCHAR(255) NOT NULL,
  lat              DECIMAL(9,6) NOT NULL,
  lng              DECIMAL(9,6) NOT NULL,
  scheduled_start  DATETIME NOT NULL,
  scheduled_end    DATETIME NOT NULL,
  status           ENUM('PENDING','IN_PROGRESS','DONE') DEFAULT 'PENDING',
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                   ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_visits_user FOREIGN KEY (professional_id)
    REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS login_codes (
  id          BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id     BIGINT NOT NULL,
  code_hash   VARCHAR(255) NOT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at  DATETIME NOT NULL,
  used        TINYINT(1) DEFAULT 0,
  used_at     DATETIME NULL,
  CONSTRAINT fk_login_codes_user FOREIGN KEY (user_id)
    REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS visit_checkins (
  id              BIGINT PRIMARY KEY AUTO_INCREMENT,
  visit_id        BIGINT NOT NULL,
  professional_id BIGINT NOT NULL,
  checkin_time    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  lat             DECIMAL(9,6) NOT NULL,
  lng             DECIMAL(9,6) NOT NULL,
  distance_m      INT NOT NULL,
  is_valid_time   TINYINT(1) NOT NULL,
  is_valid_radius TINYINT(1) NOT NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_checkins_visit FOREIGN KEY (visit_id) REFERENCES visits(id),
  CONSTRAINT fk_checkins_user  FOREIGN KEY (professional_id) REFERENCES users(id)
);

