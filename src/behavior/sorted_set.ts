import Random from "./random"

export default class SortedSet<T>{
    data: Array<T>;
    comp_op: (a: T, b: T)=>number;
    
    constructor(list: Array<T>, comp_op: (a: T, b: T)=>number){
        list.sort(comp_op)
        this.data = list;
        this.comp_op = comp_op
    }


    //accessors 
    contains(item: T): boolean{
        return this.index(item)!=null;
    }

    get length(): number {
        return this.data.length
    }

    // simple operations
    add(item: T){
        let i = this.insert_point(item);
        this.data.splice(i, 0, item);
    }

    remove(item: T): boolean{
        let i = this.index(item);
        if (i===null) return false;
        this.data.splice(i, 1);
        return true
    }

    // bulk operations
    union(other: SortedSet<T>): SortedSet<T>{
        let i = 0, j = 0;
        let data: Array<T> = []
        while (i<this.length && j<other.length ){
            let comp: number = this.comp_op(this.data[i], other.data[j]);
            if (comp<0){
                data.push(this.data[i++])
            } else if (comp>0){
                data.push(other.data[j++])
            } else {
                data.push(this.data[i++]);
                j++;
            }
        }
        while (i<this.length) data.push(this.data[i++]);
        while (j<other.length) data.push(other.data[j++]);
        return new SortedSet(data, this.comp_op)
    }

    

    intersection(other: SortedSet<T>): SortedSet<T> {
        let i = 0, j = 0;
        let data: Array<T> = []
        while (i<this.length && j<other.length ){
            let comp: number = this.comp_op(this.data[i], other.data[j]);
            if (comp<0) i++;
            else j++;
            if (comp===0) data.push(this.data[i++]);
        }
        return new SortedSet(data, this.comp_op)
    }

    difference(other: SortedSet<T>): SortedSet<T> {
        let data: Array<T> = [];
        let i = 0, j = 0;

        while (i<this.length && j<other.length){
            let comp: number = this.comp_op(this.data[i], other.data[j]);
            if (comp===0) { //The member is shared, skip it
                i++;
                j++;
            } else if (comp>0) { // Pointers are out of order, move 
                j++
            } else {
                data.push(this.data[i++]);
            }
        }
        while(i<this.length){
            data.push(this.data[i++]);
        }

        return new SortedSet(data, this.comp_op);
    }

    symetric_difference(other: SortedSet<T>): SortedSet<T>{
        return this.union(other).difference(this.intersection(other)) // May be a more efficient way, but this will do it
    }

    random(seed: string | number | undefined) {
        let rng = new Random(seed)
        return rng.choice(this.data);
    }

    private insert_point(item: T): number | null{
        let low = 0;
        let high = this.data.length;
        let mid;
        while (low<high){
            mid = (low+high)>>>1;
            let comp: number = this.comp_op(this.data[mid], item);
            if (comp<0) //reverse this?
                low = mid+1;
            else if (comp==0) return null;
            else
                high = mid;
        }
        return mid+1
    }

    private index(item: T, low: number = 0, high: number = -1): number | null {
        if (high<0){
            high = this.data.length
        }
        let i = (high+low) >>> 1;
        let comp: number = this.comp_op(this.data[i], item);
        if (comp==0) return i;
        else if (high==low) return null;
        else if (comp>0) return this.index(item, low, i); // reverse this?
        else return this.index(item, i, high);
    }


}