import {
    _decorator,
    assetManager,
    Color,
    Component,
    Enum,
    gfx,
    Label,
    Material,
    Node,
    Sprite,
    Texture2D,
    UITransform,
    Vec2,
    Vec4,
} from 'cc';
import { EDITOR } from 'cc/env';
import { CocosUIEffectRuntime, UIEffectTimeTarget } from './CocosUIEffectRuntime';

const { ccclass, property, executeInEditMode, playOnFocus, disallowMultiple } = _decorator;

export enum UIEffectProfile {
    Color,
    Transition,
    Marquee,
    Detail,
    Pixelate,
    RgbShift,
    BlurFast,
    Composite,
}

export enum UIEffectBlendMode {
    Alpha,
    Additive,
}

export enum UIEffectToneMode {
    None,
    Grayscale,
    Sepia,
    Negative,
    Retro,
    Posterize,
}

export enum UIEffectColorMode {
    None,
    Multiply,
    Additive,
    Subtractive,
    Replace,
    Hsv,
    Contrast,
}

export enum UIEffectTransitionMode {
    Fade,
    Cutoff,
    Dissolve,
    Mask,
    Shiny,
}

export enum UIEffectTargetMode {
    None,
    Hue,
    Luminance,
}

export enum UIEffectGradationMode {
    Horizontal,
    Vertical,
    Angle,
    Radial,
    Rainbow,
}

export enum UIEffectDetailMode {
    Mask,
    Multiply,
    Additive,
    Replace,
}

Enum(UIEffectProfile);
Enum(UIEffectBlendMode);
Enum(UIEffectToneMode);
Enum(UIEffectColorMode);
Enum(UIEffectTransitionMode);
Enum(UIEffectTargetMode);
Enum(UIEffectGradationMode);
Enum(UIEffectDetailMode);

type EffectRenderer = Sprite | Label;
type ChangeListener = () => void;

const EFFECT_ROOT = 'effects/ui-effect';
const PROFILE_PATH: Record<UIEffectProfile, string> = {
    [UIEffectProfile.Color]: 'color',
    [UIEffectProfile.Transition]: 'transition',
    [UIEffectProfile.Marquee]: 'marquee',
    [UIEffectProfile.Detail]: 'detail',
    [UIEffectProfile.Pixelate]: 'pixelate',
    [UIEffectProfile.RgbShift]: 'rgb-shift',
    [UIEffectProfile.BlurFast]: 'blur-fast',
    [UIEffectProfile.Composite]: 'composite',
};

const MATERIAL_UUID: Record<'font' | 'ui', Partial<Record<UIEffectProfile, string>>> = {
    font: {
        [UIEffectProfile.Color]: '584ec1e0-7758-4243-9cac-6213f654a1fb',
        [UIEffectProfile.Transition]: 'a0f360b8-b5a0-4ad3-b827-0cb5c0cc10ef',
        [UIEffectProfile.Marquee]: '0a28784c-ee5f-4440-aba8-925c5609f144',
        [UIEffectProfile.Composite]: 'aa5256f3-590c-4d83-bd20-59e43691b395',
    },
    ui: {
        [UIEffectProfile.Color]: '31546b48-e080-4343-8ad4-7be506c77451',
        [UIEffectProfile.Transition]: '638d49e6-a19e-4e9e-b29f-0014ccc302ea',
        [UIEffectProfile.Marquee]: 'd6960bd8-fadf-4b52-9e00-e052935e511b',
        [UIEffectProfile.Detail]: '1a641eb6-3e34-411b-8342-a59e35ccaecf',
        [UIEffectProfile.Pixelate]: 'fa479cc0-5a8f-4091-9046-589afb7aea5a',
        [UIEffectProfile.RgbShift]: '3e6c9fbf-df39-459c-b07c-723f54afdbba',
        [UIEffectProfile.BlurFast]: '9ad43fc9-d295-4922-b584-5356b57fac99',
        [UIEffectProfile.Composite]: 'ee8d4582-a813-4c41-910b-1b4558e02489',
    },
};

@ccclass('CocosUIEffect')
@executeInEditMode(true)
@playOnFocus(true)
@disallowMultiple(true)
export class CocosUIEffect extends Component implements UIEffectTimeTarget {
    private static readonly sharedColorMaterials = new Map<string, Material>();
    @property({ type: UIEffectProfile })
    effectProfile = UIEffectProfile.Color;

    @property({ type: UIEffectBlendMode })
    blendMode = UIEffectBlendMode.Alpha;

    @property({ type: UIEffectToneMode, visible(this: CocosUIEffect) { return this.usesColor(); } })
    toneMode = UIEffectToneMode.None;

    @property({ range: [0, 1, 0.01], visible(this: CocosUIEffect) { return this.usesColor(); } })
    toneIntensity = 1;

    @property({ type: UIEffectColorMode, visible(this: CocosUIEffect) { return this.usesColor(); } })
    colorMode = UIEffectColorMode.None;

    @property({ visible(this: CocosUIEffect) { return this.usesColor(); } })
    effectColor = Color.WHITE.clone();

    @property({ range: [0, 1, 0.01], visible(this: CocosUIEffect) { return this.usesColor(); } })
    colorIntensity = 1;

    @property({ type: UIEffectTargetMode, visible(this: CocosUIEffect) { return this.usesColor() && !(this.renderer instanceof Label); } })
    targetMode = UIEffectTargetMode.None;

    @property({ range: [0, 1, 0.01], visible(this: CocosUIEffect) { return this.usesColor() && this.targetMode !== UIEffectTargetMode.None; } })
    targetValue = 0.5;

    @property({ range: [0, 1, 0.01], visible(this: CocosUIEffect) { return this.usesColor() && this.targetMode !== UIEffectTargetMode.None; } })
    targetRange = 1;

    @property({ range: [0, 0.5, 0.01], visible(this: CocosUIEffect) { return this.usesColor() && this.targetMode !== UIEffectTargetMode.None; } })
    targetSoftness = 0.1;

    @property({ type: UIEffectTransitionMode, visible(this: CocosUIEffect) { return this.usesTransition(); } })
    transitionMode = UIEffectTransitionMode.Fade;

    @property({ type: Texture2D, visible(this: CocosUIEffect) { return this.usesTransition(); } })
    transitionTexture: Texture2D | null = null;

    @property({ range: [0, 1, 0.001], visible(this: CocosUIEffect) { return this.usesTransition(); } })
    transitionRate = 0;

    @property({ range: [0.001, 0.5, 0.001], visible(this: CocosUIEffect) { return this.usesTransition(); } })
    transitionWidth = 0.1;

    @property({ range: [0, 0.5, 0.001], visible(this: CocosUIEffect) { return this.usesTransition(); } })
    transitionSoftness = 0.02;

    @property({ visible(this: CocosUIEffect) { return this.usesTransition(); } })
    transitionColor = new Color(255, 255, 255, 255);

    @property({ type: UIEffectGradationMode, visible(this: CocosUIEffect) { return this.usesMarquee(); } })
    gradationMode = UIEffectGradationMode.Horizontal;

    @property({ visible(this: CocosUIEffect) { return this.usesMarquee(); } })
    gradationColorA = new Color(255, 255, 255, 255);

    @property({ visible(this: CocosUIEffect) { return this.usesMarquee(); } })
    gradationColorB = new Color(0, 210, 255, 255);

    @property({ range: [0, 360, 1], visible(this: CocosUIEffect) { return this.usesMarquee(); } })
    angle = 0;

    @property({ range: [0.1, 12, 0.05], visible(this: CocosUIEffect) { return this.usesMarquee(); } })
    tiling = 1;

    @property({ visible(this: CocosUIEffect) { return this.usesMarquee(); } })
    gradationOffset = 0;

    @property({ range: [0.001, 1, 0.001], visible(this: CocosUIEffect) { return this.usesMarquee(); } })
    width = 0.25;

    @property({ range: [0.001, 0.5, 0.001], visible(this: CocosUIEffect) { return this.usesMarquee(); } })
    softness = 0.05;

    @property({ visible(this: CocosUIEffect) { return this.usesMarquee(); } })
    speed = 0.5;

    @property({ visible(this: CocosUIEffect) { return this.usesMarquee(); } })
    autoPlay = true;

    @property({ type: Texture2D, visible(this: CocosUIEffect) { return this.effectProfile === UIEffectProfile.Detail; } })
    detailTexture: Texture2D | null = null;

    @property({ type: UIEffectDetailMode, visible(this: CocosUIEffect) { return this.effectProfile === UIEffectProfile.Detail; } })
    detailMode = UIEffectDetailMode.Mask;

    @property({ range: [0, 1, 0.01] })
    intensity = 1;

    @property({ range: [0, 32, 0.1], visible(this: CocosUIEffect) { return this.isSamplingProfile(); } })
    samplingWidth = 2;

    @property({ visible(this: CocosUIEffect) { return this.effectProfile === UIEffectProfile.RgbShift; } })
    samplingDirection = new Vec2(1, 0);

    private renderer: EffectRenderer | null = null;
    private originalMaterial: Material | null = null;
    private material: Material | null = null;
    private ownsMaterial = false;
    private loadToken = 0;
    private runtimeTime = 0;
    private revision = 0;
    private readonly listeners = new Set<ChangeListener>();
    private readonly size = new Vec2();
    private readonly anchor = new Vec2();
    private readonly textureSize = new Vec2(1, 1);
    private readonly uvMin = new Vec2(0, 0);
    private readonly uvMax = new Vec2(1, 1);
    private editorStructureKey = '';
    private editorParameterKey = '';

    get changeRevision(): number { return this.revision; }

    protected onLoad(): void {
        this.renderer = this.getComponent(Sprite) || this.getComponent(Label);
        this.originalMaterial = this.renderer?.customMaterial || null;
    }

    protected onEnable(): void {
        this.renderer = this.renderer || this.getComponent(Sprite) || this.getComponent(Label);
        if (this.renderer && this.renderer.customMaterial !== this.material) {
            this.originalMaterial = this.renderer.customMaterial;
        }
        this.node.on(Node.EventType.SIZE_CHANGED, this.onTransformChanged, this);
        this.node.on(Node.EventType.ANCHOR_CHANGED, this.onTransformChanged, this);
        this.updateRuntimeRegistration();
        this.refreshMaterial();
    }

    protected onDisable(): void {
        this.loadToken++;
        CocosUIEffectRuntime.remove(this);
        this.node.off(Node.EventType.SIZE_CHANGED, this.onTransformChanged, this);
        this.node.off(Node.EventType.ANCHOR_CHANGED, this.onTransformChanged, this);
        this.restoreOriginalMaterial();
    }

    protected onDestroy(): void {
        this.listeners.clear();
        this.releaseMaterial();
    }

    protected update(): void {
        if (!EDITOR || !this.enabledInHierarchy) return;
        this.syncEditorPreview();
    }

    protected onRestore(): void {
        if (!EDITOR) return;
        this.editorStructureKey = '';
        this.editorParameterKey = '';
        this.syncEditorPreview();
    }

    resetInEditor(): void {
        if (!EDITOR) return;
        this.editorStructureKey = '';
        this.editorParameterKey = '';
        this.syncEditorPreview();
    }

    setProfile(profile: UIEffectProfile): void {
        if (this.effectProfile === profile) return;
        this.effectProfile = profile;
        this.updateRuntimeRegistration();
        this.refreshMaterial();
    }

    setRate(value: number): void {
        this.ensureOwnedMaterial();
        this.transitionRate = this.clamp01(value);
        this.applyProperties();
        this.notifyChanged();
    }

    setIntensity(value: number): void {
        this.ensureOwnedMaterial();
        this.intensity = this.clamp01(value);
        this.applyProperties();
        this.notifyChanged();
    }

    setToneIntensity(value: number): void {
        this.ensureOwnedMaterial();
        this.toneIntensity = this.clamp01(value);
        this.applyProperties();
        this.notifyChanged();
    }

    setColorIntensity(value: number): void {
        this.ensureOwnedMaterial();
        this.colorIntensity = this.clamp01(value);
        this.applyProperties();
        this.notifyChanged();
    }

    setGradationOffset(value: number): void {
        this.ensureOwnedMaterial();
        this.gradationOffset = value;
        this.applyProperties();
        this.notifyChanged();
    }

    setGradationRotation(value: number): void {
        this.ensureOwnedMaterial();
        this.angle = value;
        this.applyProperties();
        this.notifyChanged();
    }

    setEffectColor(color: Color): void {
        this.ensureOwnedMaterial();
        this.effectColor.set(color);
        this.applyProperties();
        this.notifyChanged();
    }

    setRuntimeTime(value: number): void {
        this.ensureOwnedMaterial();
        this.runtimeTime = value;
        this.setMaterialProperty('runtimeTimeN', value);
        this.notifyChanged();
    }

    clearEffect(): void {
        this.enabled = false;
    }

    refreshMaterial(): void {
        if (!this.enabledInHierarchy || !this.renderer) return;
        if (!this.isProfileSupported()) {
            this.restoreOriginalMaterial();
            return;
        }

        const token = ++this.loadToken;
        const rendererKind = this.renderer instanceof Label ? 'font' : 'ui';
        const path = `${EFFECT_ROOT}/${rendererKind}/${rendererKind}-${PROFILE_PATH[this.effectProfile]}`;
        const materialUuid = MATERIAL_UUID[rendererKind][this.effectProfile];
        if (!materialUuid) {
            this.restoreOriginalMaterial();
            return;
        }
        assetManager.loadAny<Material>(materialUuid, (error, materialTemplate) => {
            if (token !== this.loadToken || !this.enabledInHierarchy || !this.renderer) return;
            if (error || !materialTemplate) {
                console.warn(`[CocosUIEffect] Cannot load ${path}`, error);
                this.restoreOriginalMaterial();
                return;
            }

            this.releaseMaterial();
            const sharedKey = this.getSharedMaterialKey();
            const sharedMaterial = sharedKey ? CocosUIEffect.sharedColorMaterials.get(sharedKey) : null;
            if (sharedMaterial) {
                this.material = sharedMaterial;
                this.ownsMaterial = false;
                this.renderer.customMaterial = sharedMaterial;
                this.notifyChanged();
                return;
            }
            const material = new Material();
            material.copy(materialTemplate);
            if (this.blendMode === UIEffectBlendMode.Additive) {
                material.overridePipelineStates({
                    blendState: {
                        targets: [{
                            blend: true,
                            blendSrc: gfx.BlendFactor.SRC_ALPHA,
                            blendDst: gfx.BlendFactor.ONE,
                            blendSrcAlpha: gfx.BlendFactor.SRC_ALPHA,
                            blendDstAlpha: gfx.BlendFactor.ONE_MINUS_SRC_ALPHA,
                        }],
                    },
                });
            }
            this.material = material;
            this.ownsMaterial = !sharedKey;
            this.renderer.customMaterial = material;
            this.applyProperties();
            if (sharedKey) CocosUIEffect.sharedColorMaterials.set(sharedKey, material);
            this.notifyChanged();
        });
    }

    advanceUIEffectTime(deltaTime: number): void {
        if (!this.enabledInHierarchy || !this.autoPlay || !this.usesMarquee()) return;
        this.runtimeTime += deltaTime;
        this.setMaterialProperty('runtimeTimeN', this.runtimeTime);
    }

    onChanged(listener: ChangeListener): void { this.listeners.add(listener); }
    offChanged(listener: ChangeListener): void { this.listeners.delete(listener); }

    copySettingsFrom(source: CocosUIEffect): void {
        const requiresMaterialRefresh = this.effectProfile !== source.effectProfile
            || this.blendMode !== source.blendMode
            || !this.material;
        this.effectProfile = source.effectProfile;
        this.blendMode = source.blendMode;
        this.toneMode = source.toneMode;
        this.toneIntensity = source.toneIntensity;
        this.colorMode = source.colorMode;
        this.effectColor.set(source.effectColor);
        this.colorIntensity = source.colorIntensity;
        this.targetMode = source.targetMode;
        this.targetValue = source.targetValue;
        this.targetRange = source.targetRange;
        this.targetSoftness = source.targetSoftness;
        this.transitionMode = source.transitionMode;
        this.transitionTexture = source.transitionTexture;
        this.transitionRate = source.transitionRate;
        this.transitionWidth = source.transitionWidth;
        this.transitionSoftness = source.transitionSoftness;
        this.transitionColor.set(source.transitionColor);
        this.gradationMode = source.gradationMode;
        this.gradationColorA.set(source.gradationColorA);
        this.gradationColorB.set(source.gradationColorB);
        this.angle = source.angle;
        this.tiling = source.tiling;
        this.gradationOffset = source.gradationOffset;
        this.width = source.width;
        this.softness = source.softness;
        this.speed = source.speed;
        this.autoPlay = source.autoPlay;
        this.detailTexture = source.detailTexture;
        this.detailMode = source.detailMode;
        this.intensity = source.intensity;
        this.samplingWidth = source.samplingWidth;
        this.samplingDirection.set(source.samplingDirection);
        this.runtimeTime = source.runtimeTime;
        this.updateRuntimeRegistration();
        if (requiresMaterialRefresh) {
            this.refreshMaterial();
        } else {
            this.ensureOwnedMaterial();
            this.applyProperties();
            this.notifyChanged();
        }
    }

    private usesColor(): boolean {
        return this.effectProfile === UIEffectProfile.Color || this.effectProfile === UIEffectProfile.Composite;
    }

    private usesTransition(): boolean {
        return this.effectProfile === UIEffectProfile.Transition || this.effectProfile === UIEffectProfile.Composite;
    }

    private usesMarquee(): boolean {
        return this.effectProfile === UIEffectProfile.Marquee || this.effectProfile === UIEffectProfile.Composite;
    }

    private isSamplingProfile(): boolean {
        return this.effectProfile === UIEffectProfile.Pixelate
            || this.effectProfile === UIEffectProfile.RgbShift
            || this.effectProfile === UIEffectProfile.BlurFast;
    }

    private isProfileSupported(): boolean {
        if (!(this.renderer instanceof Label)) return true;
        return this.effectProfile === UIEffectProfile.Color
            || this.effectProfile === UIEffectProfile.Transition
            || this.effectProfile === UIEffectProfile.Marquee
            || this.effectProfile === UIEffectProfile.Composite;
    }

    private updateRuntimeRegistration(): void {
        if (this.enabledInHierarchy && this.autoPlay && this.usesMarquee()) {
            CocosUIEffectRuntime.add(this);
        } else {
            CocosUIEffectRuntime.remove(this);
        }
    }

    private syncEditorPreview(): void {
        this.renderer = this.renderer || this.getComponent(Sprite) || this.getComponent(Label);
        if (!this.renderer) return;

        const rendererKind = this.renderer instanceof Label ? 'font' : 'ui';
        const structureKey = `${rendererKind}|${this.effectProfile}|${this.blendMode}`;
        const parameterKey = this.buildEditorParameterKey();
        if (structureKey !== this.editorStructureKey) {
            this.editorStructureKey = structureKey;
            this.editorParameterKey = parameterKey;
            this.updateRuntimeRegistration();
            this.refreshMaterial();
            return;
        }

        if (parameterKey === this.editorParameterKey) return;
        this.editorParameterKey = parameterKey;
        this.updateRuntimeRegistration();
        if (!this.material) {
            this.refreshMaterial();
            return;
        }
        this.ensureOwnedMaterial();
        this.applyProperties();
        this.renderer.markForUpdateRenderData();
        this.notifyChanged();
    }

    private buildEditorParameterKey(): string {
        const ec = this.effectColor;
        const tc = this.transitionColor;
        const ga = this.gradationColorA;
        const gb = this.gradationColorB;
        const transform = this.getComponent(UITransform);
        return [
            this.toneMode, this.toneIntensity,
            this.colorMode, ec.r, ec.g, ec.b, ec.a, this.colorIntensity,
            this.targetMode, this.targetValue, this.targetRange, this.targetSoftness,
            this.transitionMode, this.transitionTexture?.uuid || '', this.transitionRate,
            this.transitionWidth, this.transitionSoftness, tc.r, tc.g, tc.b, tc.a,
            this.gradationMode, ga.r, ga.g, ga.b, ga.a, gb.r, gb.g, gb.b, gb.a,
            this.angle, this.tiling, this.gradationOffset, this.width, this.softness,
            this.speed, this.autoPlay ? 1 : 0,
            this.detailTexture?.uuid || '', this.detailMode,
            this.intensity, this.samplingWidth, this.samplingDirection.x, this.samplingDirection.y,
            transform?.width || 0, transform?.height || 0,
            transform?.anchorPoint.x || 0, transform?.anchorPoint.y || 0,
        ].join('|');
    }

    private onTransformChanged(): void {
        this.applyTransformProperties();
    }

    private applyProperties(): void {
        if (!this.material || !this.renderer) return;
        this.setMaterialProperty('toneModeN', this.toneMode);
        this.setMaterialProperty('toneIntensityN', this.toneIntensity);
        this.setMaterialProperty('colorModeN', this.colorMode);
        this.setMaterialProperty('effectColor', this.toVec4(this.effectColor));
        this.setMaterialProperty('colorIntensityN', this.colorIntensity);
        this.setMaterialProperty('targetModeN', this.targetMode);
        this.setMaterialProperty('targetValueN', this.targetValue);
        this.setMaterialProperty('targetRangeN', this.targetRange);
        this.setMaterialProperty('targetSoftnessN', this.targetSoftness);
        this.setMaterialProperty('transitionModeN', this.transitionMode);
        this.setMaterialProperty('transitionRateN', this.transitionRate);
        this.setMaterialProperty('transitionWidthN', this.transitionWidth);
        this.setMaterialProperty('transitionSoftnessN', this.transitionSoftness);
        this.setMaterialProperty('transitionColor', this.toVec4(this.transitionColor));
        this.setMaterialProperty('hasTransitionTextureN', this.transitionTexture ? 1 : 0);
        if (this.transitionTexture) this.setMaterialProperty('transitionTexture', this.transitionTexture);
        this.setMaterialProperty('gradationModeN', this.gradationMode);
        this.setMaterialProperty('gradationColorA', this.toVec4(this.gradationColorA));
        this.setMaterialProperty('gradationColorB', this.toVec4(this.gradationColorB));
        this.setMaterialProperty('angleN', this.angle);
        this.setMaterialProperty('tilingN', this.tiling);
        this.setMaterialProperty('gradationOffsetN', this.gradationOffset);
        this.setMaterialProperty('widthN', this.width);
        this.setMaterialProperty('softnessN', this.softness);
        this.setMaterialProperty('speedN', this.speed);
        this.setMaterialProperty('runtimeTimeN', this.runtimeTime);
        this.setMaterialProperty('detailModeN', this.detailMode);
        this.setMaterialProperty('hasDetailTextureN', this.detailTexture ? 1 : 0);
        if (this.detailTexture) this.setMaterialProperty('detailTexture', this.detailTexture);
        this.setMaterialProperty('intensityN', this.intensity);
        this.setMaterialProperty('samplingWidthN', this.samplingWidth);
        this.setMaterialProperty('samplingDirectionN', this.samplingDirection);
        this.applySamplingProperties();
        this.applyTransformProperties();
    }

    private applySamplingProperties(): void {
        if (!(this.renderer instanceof Sprite) || !this.renderer.spriteFrame) return;
        const spriteFrame = this.renderer.spriteFrame;
        const texture = spriteFrame.texture;
        this.textureSize.set(Math.max(texture.width, 1), Math.max(texture.height, 1));
        const uv = spriteFrame.uv;
        if (uv.length >= 2) {
            let minX = uv[0];
            let maxX = uv[0];
            let minY = uv[1];
            let maxY = uv[1];
            for (let i = 2; i + 1 < uv.length; i += 2) {
                minX = Math.min(minX, uv[i]);
                maxX = Math.max(maxX, uv[i]);
                minY = Math.min(minY, uv[i + 1]);
                maxY = Math.max(maxY, uv[i + 1]);
            }
            this.uvMin.set(minX, minY);
            this.uvMax.set(maxX, maxY);
        }
        this.setMaterialProperty('textureSizeN', this.textureSize);
        this.setMaterialProperty('uvMinN', this.uvMin);
        this.setMaterialProperty('uvMaxN', this.uvMax);
    }

    private applyTransformProperties(): void {
        const transform = this.getComponent(UITransform);
        if (!transform) return;
        this.size.set(Math.max(transform.width, 0.0001), Math.max(transform.height, 0.0001));
        this.anchor.set(transform.anchorPoint);
        this.setMaterialProperty('spriteSizeN', this.size);
        this.setMaterialProperty('spriteAnchorN', this.anchor);
    }

    private setMaterialProperty(name: string, value: number | Vec2 | Vec4 | Texture2D): void {
        if (!this.material || !this.material.passes.length) return;
        const handle = this.material.passes[0].getHandle(name);
        if (!handle) return;
        this.material.setProperty(name, value);
    }

    private restoreOriginalMaterial(): void {
        if (this.renderer && this.renderer.customMaterial !== this.originalMaterial) {
            this.renderer.customMaterial = this.originalMaterial;
        }
        this.releaseMaterial();
    }

    private getSharedMaterialKey(): string | null {
        if (this.effectProfile !== UIEffectProfile.Color || !this.renderer) return null;
        const rendererKind = this.renderer instanceof Label ? 'font' : 'ui';
        const c = this.effectColor;
        return [
            rendererKind,
            this.blendMode,
            this.toneMode,
            this.toneIntensity,
            this.colorMode,
            c.r, c.g, c.b, c.a,
            this.colorIntensity,
            this.targetMode,
            this.targetValue,
            this.targetRange,
            this.targetSoftness,
            this.intensity,
        ].join('|');
    }

    private ensureOwnedMaterial(): void {
        if (!this.material || this.ownsMaterial || !this.renderer) return;
        const material = new Material();
        material.copy(this.material);
        this.material = material;
        this.ownsMaterial = true;
        this.renderer.customMaterial = material;
    }

    private releaseMaterial(): void {
        if (this.material && this.ownsMaterial) this.material.destroy();
        this.material = null;
        this.ownsMaterial = false;
    }

    private notifyChanged(): void {
        this.revision++;
        this.listeners.forEach((listener) => listener());
    }

    private toVec4(color: Color): Vec4 {
        return new Vec4(color.r / 255, color.g / 255, color.b / 255, color.a / 255);
    }

    private clamp01(value: number): number {
        return Math.max(0, Math.min(1, value));
    }
}
