<?php
// api/logout.php

// 1. Start the session to access session variables
session_start();

// 2. Clear all session variables
$_SESSION = array();

// 3. Destroy the session (makes the session invalid)
session_destroy();

// 4. Set successful response
http_response_code(200);
echo json_encode(array("message" => "Successfully logged out."));
