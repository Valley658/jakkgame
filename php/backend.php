<?php
require 'vendor/autoload.php'; // GeoIP2 라이브러리 로드

use GeoIp2\Database\Reader;

// 설정
$geoDbFile = __DIR__ . '/GeoLite2-City.mmdb';
$logFile = __DIR__ . '/logs/game_log.txt';
$backupDir = __DIR__ . '/logs/backup/';

// 로그 디렉토리 생성
if (!file_exists(__DIR__ . '/logs')) {
    mkdir(__DIR__ . '/logs', 0777, true);
}
if (!file_exists($backupDir)) {
    mkdir($backupDir, 0777, true);
}

// GeoIP 정보 가져오기
function getGeoInfo($ip, $geoDbFile) {
    if (!file_exists($geoDbFile)) {
        return ['country' => 'Unknown', 'city' => 'Unknown'];
    }

    try {
        $reader = new Reader($geoDbFile);
        $record = $reader->city($ip);

        return [
            'country' => $record->country->name ?? 'Unknown',
            'city' => $record->city->name ?? 'Unknown',
        ];
    } catch (Exception $e) {
        return ['country' => 'Error', 'city' => 'Error'];
    }
}

// POST 요청 처리
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!isset($data['action'], $data['score'])) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Invalid data format']);
        exit;
    }

    $ip = $_SERVER['REMOTE_ADDR'];
    $geoInfo = getGeoInfo($ip, $geoDbFile);

    $action = $data['action'];
    $mouse = json_encode($data['mouse'] ?? []);
    $keyboard = json_encode($data['keyboard'] ?? []);
    $score = (int) $data['score'];

    $logEntry = sprintf(
        "[%s] IP: %s, Country: %s, City: %s, Action: %s, Score: %d, Mouse: %s, Keyboard: %s\n",
        date('Y-m-d H:i:s'),
        $ip,
        $geoInfo['country'],
        $geoInfo['city'],
        $action,
        $score,
        $mouse,
        $keyboard
    );

    file_put_contents($logFile, $logEntry, FILE_APPEND);

    echo json_encode([
        'status' => 'logged',
        'message' => 'Log saved successfully',
        'ip' => $ip,
        'geo' => $geoInfo,
        'score' => $score
    ]);
    exit;
}

// 로그 통계 확인 (/stats)
if (basename($_SERVER['REQUEST_URI']) === 'stats') {
    if (!file_exists($logFile)) {
        echo json_encode(['total_logs' => 0, 'total_score' => 0]);
        exit;
    }

    $logs = file($logFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    $totalScore = 0;

    foreach ($logs as $log) {
        preg_match('/Score: (\d+)/', $log, $matches);
        $totalScore += $matches[1] ?? 0;
    }

    echo json_encode([
        'total_logs' => count($logs),
        'total_score' => $totalScore
    ]);
    exit;
}

// 특정 IP의 활동 로그 (/user-logs?ip=xxx.xxx.xxx.xxx)
if (basename($_SERVER['REQUEST_URI']) === 'user-logs') {
    $queryIp = $_GET['ip'] ?? null;

    if (!$queryIp) {
        http_response_code(400);
        echo "Missing 'ip' parameter.";
        exit;
    }

    header('Content-Type: text/plain');
    if (!file_exists($logFile)) {
        echo "No logs available.";
        exit;
    }

    $logs = file($logFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    $filteredLogs = array_filter($logs, function ($log) use ($queryIp) {
        return strpos($log, $queryIp) !== false;
    });

    echo implode("\n", $filteredLogs) ?: "No logs for IP: $queryIp.";
    exit;
}

// 검색 결과 포맷 개선 (/search-logs)
if (basename($_SERVER['REQUEST_URI']) === 'search-logs') {
    $queryDate = $_GET['date'] ?? null;
    $queryIp = $_GET['ip'] ?? null;

    if (!file_exists($logFile)) {
        echo json_encode([]);
        exit;
    }

    $logs = file($logFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    $filteredLogs = array_filter($logs, function ($log) use ($queryDate, $queryIp) {
        if ($queryDate && strpos($log, $queryDate) === false) {
            return false;
        }
        if ($queryIp && strpos($log, $queryIp) === false) {
            return false;
        }
        return true;
    });

    $result = [];
    foreach ($filteredLogs as $log) {
        $result[] = $log;
    }

    echo json_encode($result);
    exit;
}

// 로그 백업 (/backup-logs)
if (basename($_SERVER['REQUEST_URI']) === 'backup-logs') {
    if (!file_exists($logFile)) {
        echo "No logs available to backup.";
        exit;
    }

    $backupFile = $backupDir . 'game_log_' . date('Ymd_His') . '.txt';
    copy($logFile, $backupFile);

    echo "Logs have been backed up to $backupFile.";
    exit;
}
?>