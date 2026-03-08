<?php
// api/config/db.php

class Database
{
    private $host = "your_db_host";        // Your host (usually localhost)
    private $db_name = "your_db_name";      // Your database name
    // !! IMPORTANT SECURITY NOTE: Change these credentials for production !!
    private $username = "your_db_username";
    private $password = "your_db_password";
    private $conn;

    /**
     * Get the database connection.
     * @return PDO|null The PDO connection object or null on failure.
     */
    public function getConnection()
    {
        $this->conn = null;

        try {
            // Set up DSN (Data Source Name)
            $dsn = "mysql:host={$this->host};dbname={$this->db_name};charset=utf8mb4";

            $options = [
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4",
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, // Throw exceptions on errors
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                // CRITICAL: Forces native prepared statements (SQL Injection defense)
                PDO::ATTR_EMULATE_PREPARES => false,
            ];

            $this->conn = new PDO($dsn, $this->username, $this->password, $options);

        } catch (PDOException $exception) {
            throw new Exception("Database Connection error: " . $exception->getMessage());
        }

        return $this->conn;
    }
}
