import Prando from 'prando';

export default class Random extends Prando{

    between(min: number, max: number): number{
        let res = this.nextInt(min | 0, max-1 | 0)
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