# wishlist

## Get Started

1. Create a new Supabases project
2. Enter your new project, open the SQLeditor and create the necessary tables and relations with the following script

    ```sql
    CREATE TABLE lists (
      id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
      title varchar NOT NULL,
      description text,
      slug_public varchar NOT NULL,
      slug_private varchar NOT NULL,
      spoiler bool DEFAULT false NOT NULL,
      created TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    );
    COMMENT ON TABLE lists IS 'Wishlists';
    COMMENT ON COLUMN lists.id IS 'Autogenerated list identity';
    COMMENT ON COLUMN lists.title IS 'Heading of the Wishlist';
    COMMENT ON COLUMN lists.description IS 'Longer description of the Wishlist';
    COMMENT ON COLUMN lists.slug_public IS 'URL Segment to build public link';
    COMMENT ON COLUMN lists.slug_private IS 'URL Segment to build private link';
    COMMENT ON COLUMN lists.spoiler IS 'Show reservations and purchases on private view';
    COMMENT ON COLUMN lists.created IS 'Timestamp of list creation';
    ```

    ```sql
    CREATE TYPE state AS ENUM ('open', 'reserved', 'purchased');
    CREATE TABLE items (
      id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
      list bigint REFERENCES lists NOT NULL,
      title varchar NOT NULL,
      description text,
      links varchar[] NOT NULL,
      state state DEFAULT 'open',
      created TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
      modified TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    );
    COMMENT ON TABLE items IS 'Wishlist items';
    COMMENT ON COLUMN items.id IS 'Autogenerated item identity';
    COMMENT ON COLUMN items.list IS 'Reference to wishlist item belongs to';
    COMMENT ON COLUMN items.title IS 'Heading of list item';
    COMMENT ON COLUMN items.description IS 'Longer description of list item';
    COMMENT ON COLUMN items.links IS 'At least one link to a shop, where item can be bought';
    COMMENT ON COLUMN items.state IS 'Item status, can be open, reserved or purchased';
    COMMENT ON COLUMN items.created IS 'Timestamp of list item creation';
    COMMENT ON COLUMN items.modified IS 'Timestamp of list item modification';
    CREATE EXTENSION IF NOT EXISTS moddatetime SCHEMA extensions;
    CREATE TRIGGER handle_updated_at BEFORE UPDATE ON items 
      FOR EACH ROW EXECUTE PROCEDURE moddatetime (modified);
    ```

## Development

Install dependencies:

```bash
yarn install
```

Compiles and hot-reloads for development:

```bash
yarn serve
```

Compiles and minifies for production:

```bash
yarn build
```
