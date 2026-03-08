<?php
// api/login.php (FINAL FIX FOR HTML OUTPUT ERROR)

// ----------------------------------------------------------------
// CRITICAL FIX: Temporarily disable HTML-formatted errors
// This prevents rogue <br><b> tags from breaking JSON parsing.
// ----------------------------------------------------------------
error_reporting(E_ALL);
ini_set('display_errors', 0); // don't print errors in browser
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/error_log.txt'); // log them to /api/error_log.txt
header('Content-Type: application/json; charset=utf-8');
ob_start();
// 1. Set headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// **CRITICAL SECURITY STEP: Start session for user tracking**
session_start();
// 2. Include database connection
include_once __DIR__ . '/config/db.php';

try {
    // 3. Instantiate database
    $database = new Database();
    // Assuming you implemented the fix in db.php to throw an Exception instead of die()
    $db = $database->getConnection(); 

    // 4. Get posted data
    $data = json_decode(file_get_contents("php://input"));

    // 5. Basic input validation
    if (empty($data->username) || empty($data->password)) {
        http_response_code(400);
        echo json_encode(array("message" => "Error: Please provide username and password."));
        exit();
    }

    // 6. SQL Query: Select user by username/email. Use a placeholder.
    $query = "SELECT id, username, password_hash 
              FROM users 
              WHERE username = :username OR email = :email
              LIMIT 0,1"; // Limit to 1 result

    // 7. Prepare the statement
    $stmt = $db->prepare($query);

    // 8. Security: Sanitize input and bind parameters
    $username_or_email = htmlspecialchars(strip_tags($data->username));
    $stmt->bindParam(':username', $username_or_email);
    $stmt->bindParam(':email', $username_or_email);

    // 9. Execute the query
    $stmt->execute();
    $num = $stmt->rowCount();

    // 10. Check if user exists
    if ($num > 0) {
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $id = $row['id'];
        $username = $row['username'];
        $password_hash = $row['password_hash'];
        $password_entered = $data->password;

        // 11. CRITICAL SECURITY STEP: Verify the password against the hash
        if (password_verify($password_entered, $password_hash)) {
            
            // 12. Success: Set session variables
            $_SESSION['user_id'] = $id;
            $_SESSION['username'] = $username;
            $_SESSION['logged_in'] = true;

            http_response_code(200);
            echo json_encode(array(
                "message" => "Successful login.",
                "user_id" => $id,
                "username" => $username
            ));
        } else {
            // Failure: Wrong password
            http_response_code(401); // Unauthorized
            echo json_encode(array("message" => "Login failed. Invalid credentials."));
        }
    } else {
        // Failure: User not found
        http_response_code(401); // Unauthorized
        echo json_encode(array("message" => "Login failed. Invalid credentials."));
    }

} catch (Exception $e) {
    // Catch database connection failure or any other internal exception
    // This will output clean JSON because html_errors is Off
    http_response_code(500);
    echo json_encode(array("message" => "Server Error: Internal system failure."));
}

exit();