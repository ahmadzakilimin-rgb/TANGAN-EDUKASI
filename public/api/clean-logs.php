<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function respond(int $status, array $body): never
{
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function database(): PDO
{
    $configPath = dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . 'tanganedukasi-private' . DIRECTORY_SEPARATOR . 'database.php';
    if (!is_file($configPath)) {
        throw new RuntimeException('Database configuration is missing.');
    }

    $config = require $configPath;
    $dsn = sprintf(
        'mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
        $config['host'],
        $config['port'],
        $config['database']
    );

    return new PDO($dsn, $config['username'], $config['password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
}

function readEntry(array $entry): array
{
    $id = $entry['id'] ?? null;
    $rawTitle = $entry['title'] ?? null;
    $rawLocation = $entry['location'] ?? null;
    $rawNotes = $entry['notes'] ?? null;
    $title = is_string($rawTitle) ? trim($rawTitle) : '';
    $location = is_string($rawLocation) ? trim($rawLocation) : '';
    $date = $entry['date'] ?? null;
    $participants = filter_var($entry['participants'] ?? null, FILTER_VALIDATE_INT);
    $plasticKg = filter_var($entry['plasticKg'] ?? null, FILTER_VALIDATE_FLOAT);
    $otherKg = filter_var($entry['otherKg'] ?? null, FILTER_VALIDATE_FLOAT);
    $bags = filter_var($entry['bags'] ?? null, FILTER_VALIDATE_INT);
    $notes = is_string($rawNotes) ? trim($rawNotes) : '';

    $parsedDate = is_string($date) ? DateTimeImmutable::createFromFormat('!Y-m-d', $date) : false;
    $dateIsValid = $parsedDate !== false && $parsedDate->format('Y-m-d') === $date;

    if (
        !is_string($id) || !preg_match('/^[A-Za-z0-9-]{1,64}$/', $id) ||
        $title === '' || mb_strlen($title) > 100 ||
        $location === '' || mb_strlen($location) > 100 ||
        !$dateIsValid ||
        $participants === false || $participants < 1 ||
        $participants > 4294967295 ||
        $plasticKg === false || !is_finite((float) $plasticKg) || $plasticKg < 0 || $plasticKg > 999999999.9 ||
        $otherKg === false || !is_finite((float) $otherKg) || $otherKg < 0 || $otherKg > 999999999.9 ||
        $bags === false || $bags < 0 || $bags > 4294967295 ||
        !is_string($rawTitle) || !is_string($rawLocation) || !is_string($rawNotes) ||
        mb_strlen($notes) > 300
    ) {
        throw new InvalidArgumentException('A clean-up entry contains invalid fields.');
    }

    return [
        'id' => $id,
        'title' => $title,
        'location' => $location,
        'date' => $date,
        'participants' => $participants,
        'plasticKg' => round((float) $plasticKg, 1),
        'otherKg' => round((float) $otherKg, 1),
        'bags' => $bags,
        'notes' => $notes,
    ];
}

function databaseEntry(array $row): array
{
    return [
        'id' => $row['id'],
        'title' => $row['title'],
        'location' => $row['location'],
        'date' => $row['activity_date'],
        'participants' => (int) $row['participants'],
        'plasticKg' => (float) $row['plastic_kg'],
        'otherKg' => (float) $row['other_kg'],
        'bags' => (int) $row['bags'],
        'notes' => $row['notes'],
    ];
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if (!in_array($method, ['GET', 'POST', 'DELETE'], true)) {
    header('Allow: GET, POST, DELETE');
    respond(405, ['error' => 'Method not allowed.']);
}

if ($method !== 'GET' && isset($_SERVER['HTTP_ORIGIN'])) {
    $requestHost = $_SERVER['HTTP_HOST'] ?? '';
    $originHost = parse_url($_SERVER['HTTP_ORIGIN'], PHP_URL_HOST);
    $originPort = parse_url($_SERVER['HTTP_ORIGIN'], PHP_URL_PORT);
    $requestPort = (int) ($_SERVER['SERVER_PORT'] ?? 80);
    if (
        !is_string($originHost) ||
        strtolower($originHost) !== strtolower(preg_replace('/:\d+$/', '', $requestHost)) ||
        ($originPort !== null && (int) $originPort !== $requestPort)
    ) {
        respond(403, ['error' => 'Cross-origin request blocked.']);
    }
}

try {
    $pdo = database();

    if ($method === 'GET') {
        $rows = $pdo->query(
            'SELECT id, title, location, activity_date, participants, plastic_kg, other_kg, bags, notes
             FROM clean_logs
             ORDER BY activity_date DESC, created_at DESC'
        )->fetchAll();
        respond(200, ['entries' => array_map('databaseEntry', $rows)]);
    }

    if ($method === 'DELETE') {
        $id = $_GET['id'] ?? '';
        if (!is_string($id) || !preg_match('/^[A-Za-z0-9-]{1,64}$/', $id)) {
            respond(400, ['error' => 'A valid entry id is required.']);
        }
        $statement = $pdo->prepare('DELETE FROM clean_logs WHERE id = ?');
        $statement->execute([$id]);
        respond(200, ['deleted' => $statement->rowCount() > 0]);
    }

    $body = json_decode(file_get_contents('php://input'), true, 512, JSON_THROW_ON_ERROR);
    if (!is_array($body)) {
        respond(400, ['error' => 'A JSON object is required.']);
    }
    $isImport = ($body['mode'] ?? '') === 'import';
    $rawEntries = $isImport ? ($body['entries'] ?? null) : [$body['entry'] ?? null];
    if (!is_array($rawEntries) || count($rawEntries) > 500) {
        respond(400, ['error' => 'The request must contain at most 500 entries.']);
    }

    $entries = array_map(static function ($entry): array {
        if (!is_array($entry)) {
            throw new InvalidArgumentException('Each entry must be an object.');
        }
        return readEntry($entry);
    }, $rawEntries);

    $insertSql = $isImport
        ? 'INSERT IGNORE INTO clean_logs (id, title, location, activity_date, participants, plastic_kg, other_kg, bags, notes)
           VALUES (:id, :title, :location, :date, :participants, :plasticKg, :otherKg, :bags, :notes)'
        : 'INSERT INTO clean_logs (id, title, location, activity_date, participants, plastic_kg, other_kg, bags, notes)
           VALUES (:id, :title, :location, :date, :participants, :plasticKg, :otherKg, :bags, :notes)';

    $statement = $pdo->prepare($insertSql);
    $pdo->beginTransaction();
    foreach ($entries as $entry) {
        $statement->execute([
            'id' => $entry['id'],
            'title' => $entry['title'],
            'location' => $entry['location'],
            'date' => $entry['date'],
            'participants' => $entry['participants'],
            'plasticKg' => $entry['plasticKg'],
            'otherKg' => $entry['otherKg'],
            'bags' => $entry['bags'],
            'notes' => $entry['notes'],
        ]);
    }
    $pdo->commit();

    respond(200, ['saved' => count($entries)]);
} catch (JsonException $error) {
    respond(400, ['error' => 'The request body is not valid JSON.']);
} catch (InvalidArgumentException $error) {
    respond(422, ['error' => $error->getMessage()]);
} catch (Throwable $error) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('Tangan Edukasi clean-logs API: ' . $error->getMessage());
    respond(500, ['error' => 'Database service is unavailable. Check the local XAMPP API configuration and database.']);
}
