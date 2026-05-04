CREATE TABLE users (
                       id INT NOT NULL AUTO_INCREMENT,
                       name VARCHAR(100) NOT NULL,
                       email VARCHAR(255) NOT NULL,
                       password_hash VARCHAR(255) NOT NULL,
                       created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
                       PRIMARY KEY (id),
                       UNIQUE KEY unique_user_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE tasks (
                       id INT NOT NULL AUTO_INCREMENT,
                       title VARCHAR(255) NOT NULL,
                       completed TINYINT(1) NOT NULL DEFAULT 0,
                       priority VARCHAR(20) NOT NULL DEFAULT 'medium',
                       due_date DATE DEFAULT NULL,
                       user_id INT NOT NULL,
                       PRIMARY KEY (id),
                       UNIQUE KEY unique_user_task_title (user_id, title),
                       CONSTRAINT fk_tasks_user
                           FOREIGN KEY (user_id) REFERENCES users (id)
                               ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;