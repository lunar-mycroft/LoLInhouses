export function random_step(x_0: number): number{
    let m = 0x80000000;
    x_0 = (x_0 | 0) & 0x3fffffff;
    let a = 1103515245;
    let c = 12345;
    
    return ((a*x_0+c) % m) & 0x3fffffff;

}

export default class Random{
    x: number
    constructor(x_0: number){
        this.x = x_0;
    }

    next(): number {
        //this.x = random_step(this.x);
        //return this.x;
        return Math.random()*0x3fffffff | 0 // My rng isn't working, so this will fix it for now
    }

    between(min: number, max: number): number{
        let x = this.next();
        let delta = max-min;
        let res = min+(this.next() % delta);
        return res
    }

    shuffle<T>(arr: T[]): T[]{
        for (var i = arr.length-1; i>0; i--){
            let j = this.between(0, i+1);
            [arr[i], arr[j]] = [arr[j], arr[i]]
        }
        return arr
    }

    choice<T>(arr: T[]): T{
        return arr[this.between(0, arr.length)]
    }
}