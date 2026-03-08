<?php
// api/register.php

// 1. Set headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// 2. Include database connection
include_once __DIR__ . '/config/db.php';

// 3. Instantiate database and get connection
$database = new Database();
$db = $database->getConnection();

// 4. Get posted data
$data = json_decode(file_get_contents("php://input"));

// 5. Basic input validation
if (empty($data->username) || empty($data->email) || empty($data->password)) {
    http_response_code(400); // Bad Request
    echo json_encode(array("message" => "Error: Please provide username, email, and password."));
    exit();
}

// 6. SQL Query: Use named placeholders for security
$query = "INSERT INTO users 
          (username, email, password_hash) 
          VALUES (:username, :email, :password_hash)";

// 7. Prepare the statement
$stmt = $db->prepare($query);

// 8. Security: Sanitize inputs
$username = htmlspecialchars(strip_tags($data->username));
$email = htmlspecialchars(strip_tags($data->email));
$password = $data->password; 

// 9. CRITICAL SECURITY STEP: Hash the password
$password_hash = password_hash($password, PASSWORD_BCRYPT);

// 10. Bind the parameters
$stmt->bindParam(':username', $username);
$stmt->bindParam(':email', $email);
$stmt->bindParam(':password_hash', $password_hash);

// 11. Execute the query
try {
    if ($stmt->execute()) {
        http_response_code(201); // Created
        echo json_encode(array("message" => "User was successfully registered."));
    } else {
        http_response_code(503); // Service Unavailable (database error)
        echo json_encode(array("message" => "Error: Unable to register user."));
    }
} catch (PDOException $e) {
    // Catch unique constraint errors (duplicate username/email)
    if ($e->getCode() == '23000') {
        http_response_code(409); // Conflict
        echo json_encode(array("message" => "Error: Username or email already exists."));
    } else {
        http_response_code(500); // Internal Server Error
        echo json_encode(array("message" => "An unexpected error occurred."));
    }
}
