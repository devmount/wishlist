<?php
// Wishlist API
// Reads:  GET  api.php?action=<name>&public=<slug>[&private=<slug>]
// Writes: POST api.php?action=<name> with a JSON body
// Admin actions require the private slug of the list, item state changes only the public one.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

enum ItemState: string
{
	case Open = 'open';
	case Reserved = 'reserved';
	case Purchased = 'purchased';
}

enum Action: string
{
	case GetList = 'list';
	case GetVersion = 'version';
	case CreateList = 'createList';
	case UpdateList = 'updateList';
	case DeleteList = 'deleteList';
	case CreateItem = 'createItem';
	case UpdateItem = 'updateItem';
	case DeleteItem = 'deleteItem';
	case Reorder = 'reorder';
	case SetState = 'setState';

	// Read actions are served via GET, all others need POST
	public function isWrite(): bool
	{
		return !in_array($this, [self::GetList, self::GetVersion], true);
	}
}

// Error with HTTP status code, sent as JSON error response
class ApiException extends Exception
{
	public function __construct(public readonly int $status, string $message)
	{
		parent::__construct($message);
	}
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

// Send JSON response and stop
function respond(mixed $data, int $status = 200): never
{
	http_response_code($status);
	header('Content-Type: application/json');
	echo json_encode($data);
	exit;
}

// Convert database datetime to ISO 8601 UTC string
function isoDate(string $value): string
{
	return str_replace(' ', 'T', $value) . 'Z';
}

// Get random slug string
function generateSlug(int $length): string
{
	$chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
	$slug = '';
	for ($i = 0; $i < $length; $i++) {
		$slug .= $chars[random_int(0, strlen($chars) - 1)];
	}
	return $slug;
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

class Api
{
	// Columns that may be changed by clients
	private const LIST_FIELDS = ['title', 'color', 'description', 'spoiler'];
	private const ITEM_FIELDS = ['title', 'price', 'description', 'links'];

	// Limits for client input
	private const MAX_TITLE = 200;
	private const MAX_DESCRIPTION = 5000;
	private const MAX_PRICE = 50;
	private const MAX_LINKS = 10;
	private const MAX_LINK_LENGTH = 2048;
	private const MAX_ITEMS = 200;

	public function __construct(private PDO $db) {}

	// Execute given action and return response data
	public function handle(Action $action, array $input): array
	{
		return match ($action) {
			Action::GetList => $this->getList($input),
			Action::GetVersion => $this->getVersion($input),
			Action::CreateList => $this->createList($input),
			Action::UpdateList => $this->updateList($input),
			Action::DeleteList => $this->deleteList($input),
			Action::CreateItem => $this->createItem($input),
			Action::UpdateItem => $this->updateItem($input),
			Action::DeleteItem => $this->deleteItem($input),
			Action::Reorder => $this->reorder($input),
			Action::SetState => $this->setState($input),
		};
	}

	// Get list with items, private slug only if given correctly
	private function getList(array $input): array
	{
		$list = $this->findList($input);
		$admin = hash_equals($list['slug_private'], $this->param($input, 'private'));
		$stmt = $this->db->prepare('SELECT * FROM items WHERE list = ? ORDER BY weight, created DESC');
		$stmt->execute([$list['id']]);
		return [
			'list' => $this->formatList($list, $admin),
			'items' => array_map($this->formatItem(...), $stmt->fetchAll()),
		];
	}

	// Get change marker of list, cheap check for polling
	private function getVersion(array $input): array
	{
		$list = $this->findList($input);
		return ['version' => isoDate($list['modified'])];
	}

	// Create new list with random slugs
	private function createList(array $input): array
	{
		if (!isset($input['title'])) {
			throw new ApiException(400, 'Title required');
		}
		[$sets, $params] = $this->assignments($input, self::LIST_FIELDS);
		$this->db->prepare("INSERT INTO lists SET $sets, slug_public = :slug_public, slug_private = :slug_private")
			->execute([...$params, 'slug_public' => generateSlug(10), 'slug_private' => generateSlug(16)]);
		return $this->formatList($this->fetchList((int) $this->db->lastInsertId()), true);
	}

	// Update list properties
	private function updateList(array $input): array
	{
		$list = $this->findAdminList($input);
		[$sets, $params] = $this->assignments($input, self::LIST_FIELDS);
		if ($sets) {
			$this->db->prepare("UPDATE lists SET $sets WHERE id = :id")->execute([...$params, 'id' => $list['id']]);
		}
		return $this->formatList($this->fetchList($list['id']), true);
	}

	// Delete list including all its items
	private function deleteList(array $input): array
	{
		$list = $this->findAdminList($input);
		$this->db->prepare('DELETE FROM lists WHERE id = ?')->execute([$list['id']]);
		return ['deleted' => true];
	}

	// Add new item at the end of the list
	private function createItem(array $input): array
	{
		$list = $this->findAdminList($input);
		$item = $this->data($input, 'item');
		if (!isset($item['title'])) {
			throw new ApiException(400, 'Title required');
		}
		$stmt = $this->db->prepare('SELECT COUNT(*) FROM items WHERE list = ?');
		$stmt->execute([$list['id']]);
		if ($stmt->fetchColumn() >= self::MAX_ITEMS) {
			throw new ApiException(400, 'Too many items');
		}
		[$sets, $params] = $this->assignments($item, self::ITEM_FIELDS);
		$this->db->prepare(
			"INSERT INTO items SET $sets, list = :list,
			weight = (SELECT COALESCE(MAX(i.weight), -1) + 1 FROM items i WHERE i.list = :list2)"
		)->execute([...$params, 'list' => $list['id'], 'list2' => $list['id']]);
		$id = (int) $this->db->lastInsertId();
		$this->touchList($list['id']);
		return ['id' => $id];
	}

	// Update item properties
	private function updateItem(array $input): array
	{
		$list = $this->findAdminList($input);
		[$sets, $params] = $this->assignments($this->data($input, 'item'), self::ITEM_FIELDS);
		if ($sets) {
			$this->db->prepare("UPDATE items SET $sets WHERE id = :id AND list = :list")
				->execute([...$params, 'id' => $this->id($input), 'list' => $list['id']]);
			$this->touchList($list['id']);
		}
		return ['updated' => true];
	}

	// Delete single item
	private function deleteItem(array $input): array
	{
		$list = $this->findAdminList($input);
		$this->db->prepare('DELETE FROM items WHERE id = ? AND list = ?')
			->execute([$this->id($input), $list['id']]);
		$this->touchList($list['id']);
		return ['deleted' => true];
	}

	// Save new item order, given as list of item ids
	private function reorder(array $input): array
	{
		$list = $this->findAdminList($input);
		$ids = $input['ids'] ?? null;
		if (!is_array($ids) || !array_is_list($ids) || count($ids) > self::MAX_ITEMS || array_filter($ids, fn ($id) => !is_int($id))) {
			throw new ApiException(400, 'Invalid ids');
		}
		$stmt = $this->db->prepare('UPDATE items SET weight = ? WHERE id = ? AND list = ?');
		$this->db->beginTransaction();
		foreach ($ids as $weight => $id) {
			$stmt->execute([$weight, $id, $list['id']]);
		}
		$this->touchList($list['id']);
		$this->db->commit();
		return ['updated' => true];
	}

	// Change item state, only if it still has the state the client expects
	private function setState(array $input): array
	{
		$list = $this->findList($input);
		$from = ItemState::tryFrom($this->param($input, 'from'));
		$to = ItemState::tryFrom($this->param($input, 'to'));
		if (!$from || !$to || $from === $to) {
			throw new ApiException(400, 'Invalid state');
		}
		$stmt = $this->db->prepare('UPDATE items SET state = ? WHERE id = ? AND list = ? AND state = ?');
		$stmt->execute([$to->value, $this->id($input), $list['id'], $from->value]);
		if ($stmt->rowCount() === 0) {
			throw new ApiException(409, 'State was changed in the meantime');
		}
		$this->touchList($list['id']);
		return ['state' => $to->value];
	}

	// Find list by public slug
	private function findList(array $input): array
	{
		$stmt = $this->db->prepare('SELECT * FROM lists WHERE slug_public = ?');
		$stmt->execute([$this->param($input, 'public')]);
		return $stmt->fetch() ?: throw new ApiException(404, 'List not found');
	}

	// Find list by public slug and check private slug
	private function findAdminList(array $input): array
	{
		$list = $this->findList($input);
		if (!hash_equals($list['slug_private'], $this->param($input, 'private'))) {
			throw new ApiException(403, 'Not allowed');
		}
		return $list;
	}

	// Get list row by id, used to return fresh data after writes
	private function fetchList(int $id): array
	{
		$stmt = $this->db->prepare('SELECT * FROM lists WHERE id = ?');
		$stmt->execute([$id]);
		return $stmt->fetch();
	}

	// Mark list as changed, so polling clients notice item changes
	private function touchList(int $id): void
	{
		$this->db->prepare('UPDATE lists SET modified = CURRENT_TIMESTAMP(6) WHERE id = ?')->execute([$id]);
	}

	// Prepare list row for output, private slug only for admins
	private function formatList(array $row, bool $admin): array
	{
		$list = [
			'id' => $row['id'],
			'title' => $row['title'],
			'color' => $row['color'],
			'description' => $row['description'],
			'slug_public' => $row['slug_public'],
			'spoiler' => (bool) $row['spoiler'],
			'created' => isoDate($row['created']),
			'modified' => isoDate($row['modified']),
		];
		if ($admin) {
			$list['slug_private'] = $row['slug_private'];
		}
		return $list;
	}

	// Prepare item row for output
	private function formatItem(array $row): array
	{
		$row['links'] = $row['links'] !== null ? json_decode($row['links']) : null;
		$row['created'] = isoDate($row['created']);
		$row['modified'] = isoDate($row['modified']);
		return $row;
	}

	// Build "a = :a, b = :b" assignments and validated parameters from allowed fields present in data
	private function assignments(array $data, array $allowed): array
	{
		$sets = [];
		$params = [];
		foreach ($allowed as $field) {
			if (array_key_exists($field, $data)) {
				$sets[] = "$field = :$field";
				$params[$field] = $this->value($field, $data[$field]);
			}
		}
		return [implode(', ', $sets), $params];
	}

	// Validate client value of given field and convert it for the database
	private function value(string $field, mixed $value): mixed
	{
		return match ($field) {
			'title' => $this->text($field, $value, self::MAX_TITLE, false),
			'description' => $this->text($field, $value, self::MAX_DESCRIPTION),
			'price' => $this->text($field, $value, self::MAX_PRICE),
			'color' => is_string($value) && preg_match('/^#[0-9a-f]{6}$/i', $value)
				? $value
				: throw new ApiException(400, 'Invalid color'),
			'spoiler' => is_bool($value) ? (int) $value : throw new ApiException(400, 'Invalid spoiler'),
			'links' => $this->links($value),
		};
	}

	// Validate text with maximum length, optional texts may be null
	private function text(string $field, mixed $value, int $max, bool $optional = true): ?string
	{
		if ($value === null && $optional) {
			return null;
		}
		if (!is_string($value) || mb_strlen($value) > $max || (!$optional && trim($value) === '')) {
			throw new ApiException(400, "Invalid $field");
		}
		return $value;
	}

	// Validate list of http(s) links and encode it as JSON
	private function links(mixed $value): ?string
	{
		if ($value === null) {
			return null;
		}
		if (!is_array($value) || !array_is_list($value) || count($value) > self::MAX_LINKS) {
			throw new ApiException(400, 'Invalid links');
		}
		foreach ($value as $link) {
			if (!is_string($link) || strlen($link) > self::MAX_LINK_LENGTH || !preg_match('#^https?://\S+$#i', $link)) {
				throw new ApiException(400, 'Invalid links');
			}
		}
		return json_encode($value);
	}

	// Get string parameter, empty if missing or not a string
	private function param(array $input, string $key): string
	{
		return is_string($input[$key] ?? null) ? $input[$key] : '';
	}

	// Get id parameter, 0 if missing or not an integer
	private function id(array $input): int
	{
		return is_int($input['id'] ?? null) ? $input['id'] : 0;
	}

	// Get object parameter, fails if given but not an object
	private function data(array $input, string $key): array
	{
		$data = $input[$key] ?? [];
		return is_array($data) ? $data : throw new ApiException(400, "Invalid $key");
	}
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

// Never output PHP errors, they are logged instead
ini_set('display_errors', '0');

try {
	// Validate requested action and HTTP method
	$name = $_GET['action'] ?? '';
	$action = (is_string($name) ? Action::tryFrom($name) : null) ?? throw new ApiException(400, 'Unknown action');
	if ($action->isWrite() && $_SERVER['REQUEST_METHOD'] !== 'POST') {
		throw new ApiException(405, 'Method not allowed');
	}

	// Read parameters from query string (reads) or JSON body (writes)
	$input = $action->isWrite() ? (json_decode(file_get_contents('php://input'), true) ?? []) : $_GET;
	if (!is_array($input)) {
		throw new ApiException(400, 'Invalid input');
	}

	// Connect to database, all dates are handled as UTC
	$config = require __DIR__ . '/config.php';
	$dsn = "mysql:host={$config['host']};dbname={$config['name']};charset=utf8mb4";
	$db = new PDO($dsn, $config['user'], $config['pass'], [
		PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
		PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
		PDO::ATTR_EMULATE_PREPARES => false,
	]);
	$db->exec("SET time_zone = '+00:00'");

	// Execute action and send result
	respond((new Api($db))->handle($action, $input));
} catch (ApiException $e) {
	respond(['error' => $e->getMessage()], $e->status);
} catch (Throwable $e) {
	error_log((string) $e);
	respond(['error' => 'Server error'], 500);
}
