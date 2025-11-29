<?php
// Test 1: PDO creation
$start = microtime(true);
$pdo = new PDO('mysql:host=127.0.0.1;dbname=lms', 'root', '');
$duration1 = (microtime(true) - $start) * 1000;
echo "PDO creation: {$duration1}ms\n";

// Test 2: Simple query
$start = microtime(true);
$stmt = $pdo->query("SELECT COUNT(*) FROM permission_overrides");
$result = $stmt->fetch();
$duration2 = (microtime(true) - $start) * 1000;
echo "Query execution: {$duration2}ms\n";

// Test 3: Another connection
$start = microtime(true);
$pdo2 = new PDO('mysql:host=127.0.0.1;dbname=lms', 'root', '');
$duration3 = (microtime(true) - $start) * 1000;
echo "Second PDO creation: {$duration3}ms\n";

echo "\nTotal: " . ($duration1 + $duration2 + $duration3) . "ms\n";
