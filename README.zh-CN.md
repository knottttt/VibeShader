# VibeShader

简体中文 | [English](README.md)

VibeShader 是一个由 Codex 辅助完成的实验项目，尝试将 Unity 中知名的开源项目 [mob-sakai/UIEffect](https://github.com/mob-sakai/UIEffect) 迁移到 Cocos Creator 3.8。

这个项目主要用于验证：Unity UI Shader 的功能和组织方式，如何用 Cocos Creator 的 TypeScript 组件、Effect、材质以及编辑器预览机制重新实现。它不是原项目的官方移植版本，也与原项目作者没有隶属或授权关系。

## 需要明确的说明

- 这是一次实验性迁移，不是完整的一比一复刻。
- Unity 与 Cocos Creator 的渲染管线、材质系统、UI 合批规则和 Shader 语法不同，最终效果与性能可能和原项目存在差异。
- 当前只实现了下方列出的功能，不能默认兼容 UIEffect 的全部功能或 API。
- 项目由 Codex 辅助开发，进入正式项目之前仍需要自行审查代码并进行目标平台测试。
- UIEffect 原项目的设计与实现归原作者所有，具体署名和许可见 [第三方声明](THIRD_PARTY_NOTICES.md) 与 [许可证](LICENSE.md)。

## 当前实现

### 组件

- `CocosUIEffect`：为 Cocos Creator 的 `Sprite` 或 `Label` 应用效果，并支持在编辑器中预览参数变化。
- `CocosUIEffectTweener`：为支持的效果参数提供方向、延迟、时长、缓动、循环和往返动画。
- `CocosUIEffectReplica`：将一个 `CocosUIEffect` 的配置同步到另一个效果组件。
- `CocosUIEffectRuntime`：统一推进动画效果使用的运行时时间。

### Sprite 效果

- 颜色与色调滤镜
- Transition 与 Dissolve 类过渡
- Marquee 与渐变
- Detail 纹理合成
- 像素化
- RGB 偏移
- 快速模糊
- Composite 组合效果

### Label 效果

- 颜色与色调滤镜
- Transition 过渡
- Marquee 与渐变
- Composite 组合效果

仓库内的 `sample.scene` 展示了目前支持的 Sprite 和 Label 效果。

## 环境要求

- Cocos Creator 3.8.8

## 运行方法

1. 克隆本仓库。
2. 使用 Cocos Creator 3.8.8 打开仓库目录。
3. 打开 `assets/scenes/sample.scene`。
4. 运行场景，或者直接在编辑器中查看演示节点。

在自己的节点上使用：

1. 添加 `Sprite` 或 `Label` 组件。
2. 在同一个节点上添加 `CocosUIEffect`。
3. 选择效果类型并调整 Inspector 中的参数。
4. 如需动画，可添加 `CocosUIEffectTweener`；如需同步其他节点的配置，可添加 `CocosUIEffectReplica`。

## 项目结构

```text
assets/scripts/effects/                 TypeScript 效果组件
assets/shader/effects/ui-effect/ui/     Sprite 使用的 Effect 与材质
assets/shader/effects/ui-effect/font/   Label 使用的 Effect 与材质
assets/scenes/sample.scene              演示场景
```

## 原项目与许可证

本项目参考并迁移自 [mob-sakai/UIEffect](https://github.com/mob-sakai/UIEffect)，原项目 Copyright 2017–2024 mob-sakai，使用 MIT License。

Cocos Creator 适配部分同样以 MIT License 发布，详情见 [LICENSE.md](LICENSE.md) 和 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
