# Vercel 环境变量配置

这个 Hexo 站点里的 `api/github/oauth/exchange.mjs` 用来给 Android 后台完成 GitHub 浏览器 OAuth 的 code -> access_token 交换。

## 需要配置的变量

在 Vercel 项目里添加下面两个环境变量：

- `GITHUB_OAUTH_CLIENT_ID`
- `GITHUB_OAUTH_CLIENT_SECRET`

## 配置位置

Vercel 控制台：

1. 打开你的项目
2. 进入 `Settings`
3. 打开 `Environment Variables`
4. 分别添加上面的变量
5. 至少勾选 `Production`，建议同时勾选 `Preview` 和 `Development`
6. 保存后重新部署

## Android App 对应配置

应用设置页里保持：

- `OAuth App Client ID` = 你的 GitHub OAuth App Client ID
- `OAuth Token 交换接口` = `https://你的博客域名/api/github/oauth/exchange`
- OAuth 回调地址 = `top.yigod.blogadmin://oauth/github`

## GitHub OAuth App 也要同步配置

在 GitHub `Settings -> Developer settings -> OAuth Apps` 中确认：

- Homepage URL: 你的博客地址，例如 `https://blog.yigod.top`
- Authorization callback URL: `top.yigod.blogadmin://oauth/github`
- 如果要使用设备码登录，还要启用 `Device Flow`

## 本项目当前接口读取逻辑

文件：`api/github/oauth/exchange.mjs`

运行时会读取：

- `process.env.GITHUB_OAUTH_CLIENT_SECRET`
- `process.env.GITHUB_OAUTH_CLIENT_ID`

其中：

- `GITHUB_OAUTH_CLIENT_SECRET` 必填
- `GITHUB_OAUTH_CLIENT_ID` 可选，但建议填写，用来校验 App 传来的 Client ID

## Vercel CLI 示例

如果你想用命令行配置，可以在本地项目目录执行：

```bash
cd /mnt/e/hexo
vercel env add GITHUB_OAUTH_CLIENT_ID production
vercel env add GITHUB_OAUTH_CLIENT_SECRET production
```

然后按提示输入值，再重新部署：

```bash
vercel --prod
```

## 验证方式

部署完成后，用浏览器或 App 发起 GitHub 浏览器登录；接口可用时，App 会在 GitHub 授权后自动完成 token 交换。
