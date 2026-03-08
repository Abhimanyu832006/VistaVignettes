<?php
// api/utils/auth_check.php

// Start buffering immediately just in case this is called early
ob_start();

// CRITICAL: Start the session if it hasn't been started by the calling script
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

/**
 * Checks if a user is logged in.
 * If not, terminates the script with a 401 Unauthorized error.
 * @return int The logged-in user's ID.
 */
function require_login() {
    if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true || !isset($_SESSION['user_id'])) {
        http_response_code(401); // Unauthorized
        echo json_encode(array("message" => "Access denied. Please log in."));
        // End buffering before exiting with JSON
        ob_end_flush();
        exit(); // Stop execution
    }
    return (int)$_SESSION['user_id'];
}

// Ensure the buffer is flushed when the script finishes successfully
ob_end_flush();