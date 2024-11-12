import * as THREE from 'three';
import Component from '../../Component';
import Input from '../../Input';
import { Ammo } from '../../AmmoLib';

export default class PlayerControls extends Component {
    constructor(camera) {
        super();
        this.name = 'PlayerControls';
        this.camera = camera;

        this.timeZeroToMax = 0.08;
        this.maxSpeed = 7.0;
        this.speed = new THREE.Vector3();
        this.acceleration = this.maxSpeed / this.timeZeroToMax;
        this.deceleration = -7.0;

        this.mouseSpeed = 0.002;
        this.physicsComponent = null;
        this.isLocked = false;

        this.currentWeaponIndex = 0; // L'index de l'arme actuellement utilisée
        this.weapons = []; // Liste des armes disponibles

        this.angles = new THREE.Euler();
        this.pitch = new THREE.Quaternion();
        this.yaw = new THREE.Quaternion();

        this.jumpVelocity = 5;
        this.yOffset = 0.5;
        this.tempVec = new THREE.Vector3();
        this.moveDir = new THREE.Vector3();
        this.xAxis = new THREE.Vector3(1.0, 0.0, 0.0);
        this.yAxis = new THREE.Vector3(0.0, 1.0, 0.0);
    }

    Initialize() {
        this.physicsComponent = this.GetComponent("PlayerPhysics");
        this.physicsBody = this.physicsComponent.body;
        this.transform = new Ammo.btTransform();
        this.zeroVec = new Ammo.btVector3(0.0, 0.0, 0.0);
        this.angles.setFromQuaternion(this.parent.Rotation);
        this.UpdateRotation();

        Input.AddMouseMoveListner(this.OnMouseMove);

        document.addEventListener('pointerlockchange', this.OnPointerlockChange);

        Input.AddKeyDownListner((event) => {
            if (event.code === 'Digit1') this.SwitchWeapon(0); // Touche "1"
            if (event.code === 'Digit2') this.SwitchWeapon(1); // Touche "2"
        });

        
        Input.AddClickListner(() => {
            if (!this.isLocked) {
                document.body.requestPointerLock();
            }
        });

        // Ajouter les armes au tableau des armes
        this.weapons.push(this.GetComponent('WeaponAK47')); // AK47
        this.weapons.push(this.GetComponent('WeaponScar')); // SCAR

        // Activer la première arme (AK47 par défaut)
        this.ActivateWeapon(this.currentWeaponIndex);

    }

    OnPointerlockChange = () => {
        if (document.pointerLockElement) {
            this.isLocked = true;
            return;
        }
        this.isLocked = false;
    };

    OnMouseMove = (event) => {
        if (!this.isLocked) {
            return;
        }

        const { movementX, movementY } = event;

        this.angles.y -= movementX * this.mouseSpeed;
        this.angles.x -= movementY * this.mouseSpeed;

        this.angles.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.angles.x));

        this.UpdateRotation();
    };

    UpdateRotation() {
        this.pitch.setFromAxisAngle(this.xAxis, this.angles.x);
        this.yaw.setFromAxisAngle(this.yAxis, this.angles.y);

        this.parent.Rotation.multiplyQuaternions(this.yaw, this.pitch).normalize();
        this.camera.quaternion.copy(this.parent.Rotation);
    }

    Accelerate = (direction, t) => {
        const accel = this.tempVec.copy(direction).multiplyScalar(this.acceleration * t);
        this.speed.add(accel);
        this.speed.clampLength(0.0, this.maxSpeed);
    };

    Deccelerate = (t) => {
        const frameDeccel = this.tempVec.copy(this.speed).multiplyScalar(this.deceleration * t);
        this.speed.add(frameDeccel);
    };

    ActivateWeapon(index) {
        this.weapons.forEach((weapon, i) => {
            weapon.SetVisible(i === index); // Affiche uniquement l'arme sélectionnée
        });
        this.currentWeaponIndex = index;
    }

    SwitchWeapon(index) {
        if (index >= 0 && index < this.weapons.length) {
            this.ActivateWeapon(index); // Change l'arme active
        }
    }

    Update(t) {
        const forwardFactor = Input.GetKeyDown("KeyS") - Input.GetKeyDown("KeyW");
        const rightFactor = Input.GetKeyDown("KeyD") - Input.GetKeyDown("KeyA");
        const direction = this.moveDir.set(rightFactor, 0.0, forwardFactor).normalize();

        const velocity = this.physicsBody.getLinearVelocity();

        if (Input.GetKeyDown('Space') && this.physicsComponent.canJump) {
            velocity.setY(this.jumpVelocity);
            this.physicsComponent.canJump = false;
        }

        this.Deccelerate(t);
        this.Accelerate(direction, t);

        const moveVector = this.tempVec.copy(this.speed);
        moveVector.applyQuaternion(this.yaw);

        velocity.setX(moveVector.x);
        velocity.setZ(moveVector.z);

        this.physicsBody.setLinearVelocity(velocity);
        this.physicsBody.setAngularVelocity(this.zeroVec);

        const ms = this.physicsBody.getMotionState();
        if (ms) {
            ms.getWorldTransform(this.transform);
            const p = this.transform.getOrigin();
            this.camera.position.set(p.x(), p.y() + this.yOffset, p.z());
            this.parent.SetPosition(this.camera.position);
        }
    }
}
