# 简单的项目使用说明书

## 如何启动项目

> **重要提示**
>
> 下列命令的根目录/项目根目录都认为是 `lib` 目录
>

1. 运行本地区块链 ganache， 你可以任意选择以下两种方式的其中一种

    * 在根目录执行

    ```bash
    pnpm --filter "@poco/contract" run ganache
    ```

    * 在 `packages/poco-contract` 下执行

    ```bash
    pnpm run ganache
    ```

    在 ganache 运行后，记得保存 1 ~ 2 个账户私钥留作后续测试使用

    > **注意**
    >
    > 合约部署脚本默认将一个 MESSENGER 服务以最后一个账户发布了一个 `endpoint` 为 `http://localhost:8080` 的服务，如果可能，请避免使用最后一个账户进行测试，以免发生混淆
    >

2. 将智能合约部署到 ganache ，你可以任意选择以下两种方式的其中一种

    * 在根目录执行

    ```bash
    pnpm --filter "@poco/contract" run migrate
    ```

    * 在 `packages/poco-contract` 下执行

    ```bash
    pnpm run migrate
    ```
    > **注意**
    >
    > 如果需要重新部署合约，请将 `migrate` 更换为 `remigrate`
    >

3. 运行 MESSENGER 服务，你可以任意选择以下两种方式的其中一种

    * 在根目录执行

    ```bash
    pnpm --filter "@poco/messenger" run serve
    ```

    * 在 `apps/messenger` 下执行

    ```bash
    pnpm run serve
    ```

    默认情况下，该服务监听 `0.0.0.0` 的 `8080` 端口

4. 按需选择 **编译/监听** `@poco/net`, `@poco/util`, `@poco/client` 等模块，以`@poco/net`为例, 如果在开发时希望监听文件更改并自动编译，你可以任意选择以下两种方式的其中一种

    * 在根目录执行

    ```bash
    pnpm --filter "@poco/net" run watch
    ```

    * 在 `packages/poco-net` 下执行

    ```bash
    pnpm run watch
    ```

    如果希望直接构建（目前未编写生产模式下打包的脚本），你可以任意选择以下两种方式的其中一种

    * 在根目录执行

    ```bash
    pnpm --filter "@poco/net" run build
    ```

    * 在 `packages/poco-net` 下执行

    ```bash
    pnpm run build
    ```

5. 在某些模块下提供了部分测试，如果希望运行他们，以 `@poco/util` 为例，你可以任意选择以下两种方式的其中一种

    * 在根目录执行

    ```bash
    pnpm --filter "@poco/util" run test
    ```

    * 在 `packages/poco-util` 下执行

    ```bash
    pnpm run test
    ```

6. 启动前端项目 `@poco/portal`，你可以任意选择以下两种方式的其中一种

    * 在根目录执行

    ```bash
    pnpm --filter "@poco/portal" run serve
    ```

    * 在 `packages/portal` 下执行

    ```bash
    pnpm run serve
    ```

    Vite 项目默认监听 `localhost` 的 `5173` 端口。

    > **注意**
    >
    > Vite 的热重载可能在某些时刻产生预期之外的行为，此时，请尝试刷新页面或重新运行 `serve` 命令
    >

7. 将 ganache 的账户添加到 `MetaMask` 中

    如果你正确的完成了 ganache 的启动，`MetaMask` 应该能自动发现本地的区块链网络，如果不能，请尝试手动添加网络。

    在 `MetaMask` 就绪后，点击导入账户，粘贴在第一步中保存的私钥，此时，你应该能成功连接到测试网络，并显示账户余额为 100。

    在一切就绪后，打开前端页面, `MetaMask` 会自动弹出提示，选择您的测试账户，并连接到页面。

    此时，你应该能正常访问页面的相关功能。


## 关于项目的命名

### 项目名称

项目统一以 `@poco/` 开头，后续添加具体的项目名称，如 `@poco/net`, `@poco/util`。如果该项目属于具体的应用, 如`@poco/portal`, `@poco/messenger` 你应该将它放置到 `apps` 目录下，如果该项目属于多项目共享的依赖库，那么你应该将它放置到 `libs` 目录下。

### PNPM Scripts

通常来讲， `apps` 目录下的项目，开发模式运行的脚本名称为 `serve`。 `libs` 目录下的项目，开发模式运行的脚本名称为 `watch`，构建的脚本名称为`build`。所有项目进行测试的脚本名称均为 `test`。

## 关于项目的依赖

通常来讲，对于多个项目共同的依赖需要提升到工作空间的依赖中，如：`typescript`, `ByteBuffer` 等。同时，对于每个项目中单独的依赖，请务必保留好 `lock` 文件，推荐在 `package.json` 中写死具体的项目版本，避免意外升级依赖版本进而产生错误。