<?php
// api/get_session.php

header("Content-Type: application/json; charset=UTF-8");
session_start();

$response = [
    'logged_in' => false,
    'user_id' => null,
    'username' => null
];

if (isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true) {
    $response['logged_in'] = true;
    $response['user_id'] = $_SESSION['user_id'];
    $response['username'] = $_SESSION['username'];
}

echo json_encode($response);
