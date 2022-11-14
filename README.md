# POCO

## 项目目录结构

- `lib/`：项目的各部分组件
- `doc/`：项目的文档

## 项目 Commit 格式

**请在项目根本目下使用 `pnpm run cz` 进行递交**

每次提交的 Commit message 都包括三个部分：`Header`，`Body` 和 `Footer`。

```text
<type>(<scope>): <subject>
// 空一行
<body>
// 空一行
<footer>
```

其中，`Header` 是必需的，`Body` 和 `Footer` 可以省略。

### Header 部分

`Header` 部分只有一行，包括三个字段：`type`（必需）、`scope`（可选）和 `subject`（必需）。

1. `type`

   `type` 用于说明 commit 的类别，只允许使用下面 7 个标识。

   - `feat`：新功能
   - `fix`：修补 bug
   - `perf`：性能优化相关
   - `docs`：文档
   - `style`： 格式化
   - `refactor`：重构
   - `test`：增加测试
   - `chore`：构建过程或辅助工具的变动
   - `merge`：合并分支
   - `build`：构建相关
   - `ci`: 持续集成相关
   - `revert`：撤回 commit
   - `sync`：用以临时同步，不应存在于最后发布的分支

2. `scope`

   `scope` 用于说明 commit 影响的范围。

3. `subject`

   `subject` 是 commit 目的的简短描述。

### Body

`Body` 部分是对本次 commit 的详细描述，可以分成多行。

### Footer

`Footer` 部分只用于两种情况。

1. 不兼容变动

   如果当前代码与上一个版本不兼容，则 `Footer` 部分以 **BREAKING CHANGE** 开头，后面是对变动的描述、以及变动理由和迁移方法。

2. 关闭 Issue

   如果当前 commit 针对某个 issue，那么可以在 Footer 部分关闭这个 issue 。

### Revert

如果当前 commit 用于撤销以前的 commit，则必须以 `revert:` 开头，后面跟着被撤销 Commit 的 Header。

```text
revert: feat(pencil): add 'graphiteWidth' option

This reverts commit 667ecc1654a317a13331b17617d973392f415f02.
```

`Body` 部分的格式是固定的，必须写成 `This reverts commit <hash>.`，其中的 `hash` 是被撤销 commit 的 SHA 标识符。
