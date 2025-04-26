import { FirstPersonWeapon } from './firstPersonWeapon.js';

class Game {
    constructor() {
        // Initialize first-person weapon
        this.weapon = new FirstPersonWeapon(this.camera);
    }
} 