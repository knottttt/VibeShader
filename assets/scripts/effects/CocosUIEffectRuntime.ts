import { Director, director, game } from 'cc';

export interface UIEffectTimeTarget {
    advanceUIEffectTime(deltaTime: number): void;
}

export class CocosUIEffectRuntime {
    private static readonly targets = new Set<UIEffectTimeTarget>();
    private static listening = false;

    static add(target: UIEffectTimeTarget): void {
        this.targets.add(target);
        if (this.listening) return;
        director.on(Director.EVENT_BEFORE_UPDATE, this.tick, this);
        this.listening = true;
    }

    static remove(target: UIEffectTimeTarget): void {
        this.targets.delete(target);
        if (this.targets.size > 0 || !this.listening) return;
        director.off(Director.EVENT_BEFORE_UPDATE, this.tick, this);
        this.listening = false;
    }

    private static tick(): void {
        const deltaTime = game.deltaTime;
        this.targets.forEach((target) => target.advanceUIEffectTime(deltaTime));
    }
}
