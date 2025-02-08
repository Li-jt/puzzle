import {Engine, InitOptionsType} from "../engine";

export class Puzzle extends Engine{
    constructor(options: InitOptionsType) {
       super(options);
    }

    onUpdate() {
        console.log('Updating puzzle state.');
    }

    onRender(): void {
    }
}
