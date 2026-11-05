<?php
// Convert Supabase CSV exports of the tables lists and items into an SQL file for MySQL/MariaDB.
// Ids and slugs are kept, so all existing links keep working.
// Usage: php scripts/migrate.php lists.csv items.csv > migration.sql

if (PHP_SAPI !== 'cli') {
	exit;
}
if ($argc !== 3) {
	fwrite(STDERR, "Usage: php {$argv[0]} lists.csv items.csv > migration.sql\n");
	exit(1);
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

// Read CSV file into list of rows, keyed by column names of header line
function readCsv(string $path): array
{
	$file = fopen($path, 'r') ?: exit("Cannot read $path\n");
	$header = fgetcsv($file, escape: '');
	$header[0] = preg_replace('/^\xEF\xBB\xBF/', '', $header[0]); // Strip byte order mark
	$rows = [];
	while (($values = fgetcsv($file, escape: '')) !== false) {
		if ($values !== [null]) {
			$rows[] = array_combine($header, $values);
		}
	}
	fclose($file);
	return $rows;
}

// Quote value as SQL string literal, empty values become NULL if allowed
function quote(?string $value, bool $nullable = false): string
{
	if ($value === null || ($nullable && $value === '')) {
		return 'NULL';
	}
	return "'" . str_replace(['\\', "'"], ['\\\\', "\\'"], $value) . "'";
}

// Convert Postgres timestamp to UTC datetime literal
function timestamp(string $value, bool $micro = false): string
{
	$date = new DateTime($value);
	$date->setTimezone(new DateTimeZone('UTC'));
	return quote($date->format($micro ? 'Y-m-d H:i:s.u' : 'Y-m-d H:i:s'));
}

// Convert Postgres boolean to 0 or 1
function boolean(string $value): string
{
	return in_array(strtolower($value), ['true', 't', '1'], true) ? '1' : '0';
}

// Convert links array to JSON literal. Accepts JSON arrays and Postgres array literals like {a,"b c"}.
function links(string $value): string
{
	if ($value === '') {
		return 'NULL';
	}
	if (str_starts_with($value, '[')) {
		return quote(json_encode(json_decode($value), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
	}
	preg_match_all('/"((?:[^"\\\\]|\\\\.)*)"|([^,{}]+)/', $value, $matches, PREG_SET_ORDER);
	$links = array_map(
		fn ($m) => isset($m[2]) ? trim($m[2]) : stripcslashes($m[1]),
		$matches
	);
	return quote(json_encode($links, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

$lists = readCsv($argv[1]);
$items = readCsv($argv[2]);

echo "-- Wishlist migration from Supabase, generated " . gmdate('Y-m-d H:i:s') . " UTC\n";
echo "SET NAMES utf8mb4;\n";
echo "SET time_zone = '+00:00';\n";
echo "START TRANSACTION;\n\n";

// Lists first, items reference them
foreach ($lists as $l) {
	echo 'INSERT INTO lists (id, title, color, description, slug_public, slug_private, spoiler, created) VALUES ('
		. implode(', ', [
			(int) $l['id'],
			quote($l['title']),
			quote($l['color']),
			quote($l['description'], true),
			quote($l['slug_public']),
			quote($l['slug_private']),
			boolean($l['spoiler']),
			timestamp($l['created']),
		]) . ");\n";
}
echo "\n";

foreach ($items as $i) {
	echo 'INSERT INTO items (id, list, title, price, description, links, state, weight, created, modified) VALUES ('
		. implode(', ', [
			(int) $i['id'],
			(int) $i['list'],
			quote($i['title']),
			quote($i['price'], true),
			quote($i['description'], true),
			links($i['links']),
			quote($i['state']),
			(int) $i['weight'],
			timestamp($i['created']),
			timestamp($i['modified'], true),
		]) . ");\n";
}

echo "\nCOMMIT;\n";
fwrite(STDERR, count($lists) . " lists and " . count($items) . " items converted\n");
