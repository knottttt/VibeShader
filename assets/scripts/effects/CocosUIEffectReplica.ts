import { _decorator, Component } from 'cc';
import { CocosUIEffect } from './CocosUIEffect';

const { ccclass, property } = _decorator;

@ccclass('CocosUIEffectReplica')
export class CocosUIEffectReplica extends Component {
    @property(CocosUIEffect)
    source: CocosUIEffect | null = null;

    @property(CocosUIEffect)
    target: CocosUIEffect | null = null;

    private readonly syncHandler = (): void => this.syncNow();

    protected onLoad(): void {
        this.target = this.target || this.getComponent(CocosUIEffect);
    }

    protected onEnable(): void {
        this.source?.onChanged(this.syncHandler);
        this.syncNow();
    }

    protected onDisable(): void {
        this.source?.offChanged(this.syncHandler);
    }

    syncNow(): void {
        if (!this.source || !this.target || this.source === this.target) return;
        this.target.copySettingsFrom(this.source);
    }
}
