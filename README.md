<p align="center">
<img src="https://user-images.githubusercontent.com/5441654/121005785-73fb5000-c790-11eb-82ea-ab8bd4b3d448.png" />
</p>

<h1 align="center">wishlist</h1>
<p align="center">Create wishlists, add wishes, share with friends. Independent of shops or platforms.</p>

<p align="center">
<a href="https://github.com/devmount/wishlist/releases" target="_blank"><img src="https://img.shields.io/github/v/tag/devmount/wishlist.svg?label=wishlist&colorB=00abfb&style=flat-square" alt="release" /></a>
<a href="https://github.com/devmount/wishlist/commits/main" target="_blank"><img src="https://img.shields.io/github/last-commit/devmount/wishlist?label=updated&color=00abfb&style=flat-square" alt="last commit" /></a>
<a href="https://github.com/devmount/wishlist/actions?query=workflow%3ACodeQL" target="_blank"><img src="https://img.shields.io/github/workflow/status/devmount/wishlist/CodeQL?label=CodeQL&logo=github&color=00abfb&style=flat-square" alt="CodeQL analysis" /></a>
<a href="./LICENSE" target="_blank"><img src="https://img.shields.io/github/license/devmount/wishlist.svg?colorB=00abfb&style=flat-square" alt="license" /></a>
<a href="./.github/CONTRIBUTING.md" target="_blank"><img src="https://img.shields.io/badge/contributions-welcome-00abfb.svg?style=flat-square" alt="contributions welcome" /></a>
</p>

## How does this work?

This is a little web app with a Vue3 frontend and a Supabase backend that enables people to create wishlists without creating a user account. Every wishlist has a public link to share and a private link to manage. Everyone with the public link can reserver or by items in realtime. That's it.

*This app is still in development. As there is currently no security mechanism that keeps users from destroying the whole database, it's not yet ready to be used in production.*

## How can I run this myself?

1. Clone this project and enter its root directory

    ```bash
    git clone https://github.com/devmount/wishlist.git
    cd wishlist
    ```

2. Create a new Supabase project on [app.supabase.io](https://app.supabase.io/)
3. Enter your new Supabase project, open the SQLeditor and run the content of `install.sql` provided in this repository
4. Fill the `.env.example` file with your Supabase credentials and rename it to `.env`
5. Install dependencies with [Yarn](https://yarnpkg.com/getting-started)

    ```bash
    yarn
    ```

6. Compile and hot-reload for development ...

    ```bash
    yarn serve
    ```

7. ... or compile and minify for production:

    ```bash
    yarn build
    ```
