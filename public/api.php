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
		$admin = hash_equals($list['slug_private'], (string) ($input['private'] ?? ''));
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
		if (empty($input['title'])) {
			throw new ApiException(400, 'Title required');
		}
		$stmt = $this->db->prepare(
			'INSERT INTO lists (title, color, description, slug_public, slug_private) VALUES (?, ?, ?, ?, ?)'
		);
		$stmt->execute([
			$input['title'],
			$input['color'] ?? '#0ea5e9',
			$input['description'] ?? null,
			generateSlug(10),
			generateSlug(16),
		]);
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
		$item = $input['item'] ?? [];
		if (empty($item['title'])) {
			throw new ApiException(400, 'Title required');
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
		[$sets, $params] = $this->assignments($input['item'] ?? [], self::ITEM_FIELDS);
		if ($sets) {
			$this->db->prepare("UPDATE items SET $sets WHERE id = :id AND list = :list")
				->execute([...$params, 'id' => (int) ($input['id'] ?? 0), 'list' => $list['id']]);
			$this->touchList($list['id']);
		}
		return ['updated' => true];
	}

	// Delete single item
	private function deleteItem(array $input): array
	{
		$list = $this->findAdminList($input);
		$this->db->prepare('DELETE FROM items WHERE id = ? AND list = ?')
			->execute([(int) ($input['id'] ?? 0), $list['id']]);
		$this->touchList($list['id']);
		return ['deleted' => true];
	}

	// Save new item order, given as list of item ids
	private function reorder(array $input): array
	{
		$list = $this->findAdminList($input);
		$stmt = $this->db->prepare('UPDATE items SET weight = ? WHERE id = ? AND list = ?');
		$this->db->beginTransaction();
		foreach (array_values((array) ($input['ids'] ?? [])) as $weight => $id) {
			$stmt->execute([$weight, (int) $id, $list['id']]);
		}
		$this->touchList($list['id']);
		$this->db->commit();
		return ['updated' => true];
	}

	// Change item state, only if it still has the state the client expects
	private function setState(array $input): array
	{
		$list = $this->findList($input);
		$from = ItemState::tryFrom((string) ($input['from'] ?? ''));
		$to = ItemState::tryFrom((string) ($input['to'] ?? ''));
		if (!$from || !$to || $from === $to) {
			throw new ApiException(400, 'Invalid state');
		}
		$stmt = $this->db->prepare('UPDATE items SET state = ? WHERE id = ? AND list = ? AND state = ?');
		$stmt->execute([$to->value, (int) ($input['id'] ?? 0), $list['id'], $from->value]);
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
		$stmt->execute([(string) ($input['public'] ?? '')]);
		return $stmt->fetch() ?: throw new ApiException(404, 'List not found');
	}

	// Find list by public slug and check private slug
	private function findAdminList(array $input): array
	{
		$list = $this->findList($input);
		if (!hash_equals($list['slug_private'], (string) ($input['private'] ?? ''))) {
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

	// Build "a = :a, b = :b" assignments and parameters from allowed fields present in data
	private function assignments(array $data, array $allowed): array
	{
		$sets = [];
		$params = [];
		foreach ($allowed as $field) {
			if (array_key_exists($field, $data)) {
				$value = $data[$field];
				if ($field === 'links') {
					$value = $value !== null ? json_encode(array_values((array) $value)) : null;
				}
				if ($field === 'spoiler') {
					$value = (int) (bool) $value;
				}
				$sets[] = "$field = :$field";
				$params[$field] = $value;
			}
		}
		return [implode(', ', $sets), $params];
	}
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

try {
	// Validate requested action and HTTP method
	$action = Action::tryFrom($_GET['action'] ?? '') ?? throw new ApiException(400, 'Unknown action');
	if ($action->isWrite() && $_SERVER['REQUEST_METHOD'] !== 'POST') {
		throw new ApiException(405, 'Method not allowed');
	}

	// Read parameters from query string (reads) or JSON body (writes)
	$input = $action->isWrite() ? (json_decode(file_get_contents('php://input'), true) ?? []) : $_GET;

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
} catch (PDOException $e) {
	error_log($e->getMessage());
	respond(['error' => 'Database error'], 500);
}
