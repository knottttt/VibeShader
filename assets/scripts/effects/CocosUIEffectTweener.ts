import { _decorator, Component, Enum } from 'cc';
import { CocosUIEffect } from './CocosUIEffect';

const { ccclass, property } = _decorator;

export enum UIEffectTweenProperty {
    TransitionRate,
    ToneIntensity,
    ColorIntensity,
    SamplingIntensity,
    GradationOffset,
    GradationRotation,
    EdgeShinyRate,
    RuntimeTime,
}

export enum UIEffectTweenEasing {
    Linear,
    Smooth,
    EaseIn,
    EaseOut,
}

export enum UIEffectTweenWrapMode {
    Once,
    Loop,
    PingPongOnce,
    PingPongLoop,
}

export enum UIEffectTweenDirection {
    Forward,
    Reverse,
}

Enum(UIEffectTweenProperty);
Enum(UIEffectTweenEasing);
Enum(UIEffectTweenWrapMode);
Enum(UIEffectTweenDirection);

@ccclass('CocosUIEffectTweener')
export class CocosUIEffectTweener extends Component {
    @property(CocosUIEffect)
    target: CocosUIEffect | null = null;

    @property({ type: UIEffectTweenProperty })
    tweenProperty = UIEffectTweenProperty.TransitionRate;

    @property({ type: UIEffectTweenDirection })
    direction = UIEffectTweenDirection.Forward;

    @property({ type: UIEffectTweenWrapMode })
    wrapMode = UIEffectTweenWrapMode.Once;

    @property({ type: UIEffectTweenEasing })
    easing = UIEffectTweenEasing.Linear;

    @property({ min: 0 })
    delay = 0;

    @property({ min: 0.001 })
    duration = 1;

    @property({ min: 0 })
    interval = 0;

    @property
    playOnEnable = true;

    private time = 0;
    private paused = true;

    protected onLoad(): void {
        this.target = this.target || this.getComponent(CocosUIEffect);
    }

    protected onEnable(): void {
        if (this.playOnEnable) this.playForward();
    }

    protected update(deltaTime: number): void {
        if (this.paused || !this.target) return;
        this.time += deltaTime;
        this.evaluate();
    }

    playForward(): void {
        this.direction = UIEffectTweenDirection.Forward;
        this.paused = false;
    }

    playReverse(): void {
        this.direction = UIEffectTweenDirection.Reverse;
        this.paused = false;
    }

    pause(): void { this.paused = true; }
    resume(): void { this.paused = false; }

    stop(reset = true): void {
        this.paused = true;
        if (reset) this.seek01(this.direction === UIEffectTweenDirection.Forward ? 0 : 1);
    }

    seek01(value: number): void {
        const rate = Math.max(0, Math.min(1, value));
        this.time = this.delay + rate * Math.max(this.duration, 0.001);
        this.applyRate(rate);
    }

    private evaluate(): void {
        const duration = Math.max(this.duration, 0.001);
        let activeTime = this.time - this.delay;
        if (activeTime < 0) {
            this.applyRate(this.direction === UIEffectTweenDirection.Forward ? 0 : 1);
            return;
        }

        let rate = 0;
        const cycle = duration + this.interval;
        switch (this.wrapMode) {
            case UIEffectTweenWrapMode.Once:
                rate = Math.min(activeTime / duration, 1);
                if (activeTime >= duration) this.paused = true;
                break;
            case UIEffectTweenWrapMode.Loop:
                rate = Math.min((activeTime % cycle) / duration, 1);
                break;
            case UIEffectTweenWrapMode.PingPongOnce:
                activeTime = Math.min(activeTime, cycle + duration);
                rate = activeTime <= duration ? activeTime / duration : Math.max(0, 1 - (activeTime - cycle) / duration);
                if (activeTime >= cycle + duration) this.paused = true;
                break;
            case UIEffectTweenWrapMode.PingPongLoop: {
                const pingPongCycle = cycle * 2;
                const local = activeTime % pingPongCycle;
                rate = local <= cycle ? Math.min(local / duration, 1) : Math.max(0, 1 - (local - cycle) / duration);
                break;
            }
        }

        if (this.direction === UIEffectTweenDirection.Reverse) rate = 1 - rate;
        this.applyRate(rate);
    }

    private applyRate(rate: number): void {
        if (!this.target) return;
        rate = this.applyEasing(rate);
        switch (this.tweenProperty) {
            case UIEffectTweenProperty.TransitionRate:
                this.target.setRate(rate);
                break;
            case UIEffectTweenProperty.ToneIntensity:
                this.target.setToneIntensity(rate);
                break;
            case UIEffectTweenProperty.ColorIntensity:
                this.target.setColorIntensity(rate);
                break;
            case UIEffectTweenProperty.SamplingIntensity:
                this.target.setIntensity(rate);
                break;
            case UIEffectTweenProperty.GradationOffset:
                this.target.setGradationOffset(rate);
                break;
            case UIEffectTweenProperty.GradationRotation:
                this.target.setGradationRotation(rate * 360);
                break;
            case UIEffectTweenProperty.EdgeShinyRate:
                this.target.setRate(rate);
                break;
            case UIEffectTweenProperty.RuntimeTime:
                this.target.setRuntimeTime(rate);
                break;
        }
    }

    private applyEasing(rate: number): number {
        switch (this.easing) {
            case UIEffectTweenEasing.Smooth: return rate * rate * (3 - 2 * rate);
            case UIEffectTweenEasing.EaseIn: return rate * rate;
            case UIEffectTweenEasing.EaseOut: return 1 - (1 - rate) * (1 - rate);
            default: return rate;
        }
    }
}
