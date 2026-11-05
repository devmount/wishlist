<p align="center">
<img src="https://user-images.githubusercontent.com/5441654/121005785-73fb5000-c790-11eb-82ea-ab8bd4b3d448.png" alt="logo" />
</p>

<h1 align="center">wishlist</h1>
<p align="center">Create wishlists, add wishes, share with friends. Independent of shops or platforms.</p>

<p align="center">
<a href="https://github.com/devmount/wishlist/releases" target="_blank"><img src="https://img.shields.io/github/v/tag/devmount/wishlist.svg?label=wishlist&colorB=00abfb&style=flat-square" alt="release" /></a>
<a href="https://github.com/devmount/wishlist/commits/main" target="_blank"><img src="https://img.shields.io/github/last-commit/devmount/wishlist?label=updated&color=00abfb&style=flat-square" alt="last commit" /></a>
<a href="https://github.com/devmount/wishlist/actions?query=workflow%3ACodeQL" target="_blank"><img src="https://img.shields.io/github/actions/workflow/status/devmount/wishlist/codeql.yml?branch=main&label=CodeQL&logo=github&color=00abfb&style=flat-square" alt="CodeQL analysis" /></a>
<a href="./LICENSE" target="_blank"><img src="https://img.shields.io/github/license/devmount/wishlist.svg?colorB=00abfb&style=flat-square" alt="license" /></a>
<a href="./.github/CONTRIBUTING.md" target="_blank"><img src="https://img.shields.io/badge/contributions-welcome-00abfb.svg?style=flat-square" alt="contributions welcome" /></a>
</p>

## How does this work?

This is a little web app with a Vue3 frontend and a small PHP + MySQL backend that enables people to create wishlists without creating a user account. Every wishlist has a public link to share and a private link to manage. Everyone with the public link can reserve or buy items, and changes show up for everyone within a few seconds. That's it.

It runs on any ordinary webhosting with PHP and MySQL/MariaDB. No Node.js or other services are needed on the server.

## Local development

Requirements: [ddev](https://ddev.com/) (provides PHP and MariaDB), Node.js and [pnpm](https://pnpm.io/).

1. Clone this project and enter its root directory

    ```bash
    git clone https://github.com/devmount/wishlist.git
    cd wishlist
    ```

2. Start the backend and create the database tables

    ```bash
    ddev start
    ddev import-db --file=install.sql
    ```

3. Create the backend configuration. The defaults in `config.example.php` already match ddev.

    ```bash
    cp config.example.php public/config.php
    ```

4. Install dependencies and start the frontend with hot-reload. API requests to `/api.php` are proxied to `https://wishlist.ddev.site`.

    ```bash
    pnpm install
    pnpm dev
    ```

5. Run tests, type checks and linting

    ```bash
    pnpm test
    pnpm typecheck
    pnpm lint
    ```

## Production

1. Create a MySQL/MariaDB database on your server and import `install.sql` (e.g. via phpMyAdmin)
2. Copy `config.example.php` to `config.php` in the web directory the app is deployed to (next to `api.php`), and enter your database credentials. The deployment excludes this file, so it is neither overwritten nor removed.
3. Build the app and upload the content of `dist/` (including `api.php`) to the web directory

    ```bash
    pnpm build
    ```

## Migrating from Supabase

Older versions of this app used Supabase. To move existing wishlists over and keep all shared links working:

1. In the Supabase dashboard, export the tables `lists` and `items` as CSV
2. Convert them into an SQL file with the migration script (any local PHP works, e.g. via ddev)

    ```bash
    ddev exec php scripts/migrate.php lists.csv items.csv > migration.sql
    ```

3. Import `migration.sql` into the new database (e.g. via phpMyAdmin)
