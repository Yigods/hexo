# Giscus Migration

Current status on April 24, 2026:

- Waline service is reachable
- Waline backend storage is broken because the linked LeanCloud app is archived
- Hexo theme comment system has been switched to `giscus` pre-configuration
- Repository ID for `Yigods/hexo` is already filled: `R_kgDONqfSxQ`
- Remaining blocker: GitHub Discussions is not enabled on the repository yet

## Remaining manual steps

1. Open `https://github.com/Yigods/hexo/settings`
2. In `Features`, enable `Discussions`
3. Install the `giscus` GitHub App on the `Yigods/hexo` repository if it is not installed yet
4. In the repository `Discussions` tab, keep or create an `Announcements` category
5. Get the `category_id`
6. Fill `themes/redefine/_config.yml`:

```yml
comment:
  config:
    giscus:
      category: Announcements
      category_id: <fill-me>
```

## How to get `category_id`

After Discussions is enabled, run:

```bash
TOKEN=YOUR_GITHUB_TOKEN
curl -sS \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  https://api.github.com/graphql \
  -d '{"query":"query { repository(owner:\"Yigods\", name:\"hexo\") { discussionCategories(first:20) { nodes { id name emoji isAnswerable } } } }"}'
```

Pick the `id` of the category you want to use, then write it into `themes/redefine/_config.yml`.

## Deploy

After editing the theme config:

```bash
cd /mnt/e/hexo
git status
hexo generate
```

Then commit and push the repo so Vercel redeploys.

## Validation

After deploy, open a post page and confirm:

- no Waline archived error
- giscus iframe is rendered
- anonymous visitors can read comments
- signed-in GitHub users can comment
