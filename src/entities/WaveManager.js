import Entity from '../Entity';
import NpcCharacterController from './NPC/CharacterController';
import AttackTrigger from './NPC/AttackTrigger';
import CharacterCollision from './NPC/CharacterCollision';
import DirectionDebug from './NPC/DirectionDebug';
import * as THREE from 'three';
import { SkeletonUtils } from 'three/examples/jsm/utils/SkeletonUtils';

export default class WaveManager {
  constructor(scene, physicsWorld, entityManager, assets, mutantAnims) {
    this.scene = scene;
    this.physicsWorld = physicsWorld;
    this.entityManager = entityManager;
    this.assets = assets;
    this.mutantAnims = mutantAnims;
    this.currentWave = 0;
    this.enemies = [];
  }

  StartNextWave() {
    this.currentWave++;
    const numEnemies = this.currentWave * 5; // Par exemple, 5 ennemis par vague
    this.SpawnEnemies(numEnemies);
  }

  SpawnEnemies(num) {
    const npcLocations = [
      [10.8, 0.0, 22.0],
      [12.0, 0.0, 24.0],
      [14.0, 0.0, 26.0],
      // Ajoutez plus de positions si nécessaire
    ];

    for (let i = 0; i < num; i++) {
      const loc = npcLocations[i % npcLocations.length];
      const npcEntity = new Entity();
      npcEntity.SetPosition(new THREE.Vector3(loc[0], loc[1], loc[2]));
      npcEntity.SetName(`Mutant${i}`);
      npcEntity.AddComponent(new NpcCharacterController(SkeletonUtils.clone(this.assets['mutant']), this.mutantAnims, this.scene, this.physicsWorld));
      npcEntity.AddComponent(new AttackTrigger(this.physicsWorld));
      npcEntity.AddComponent(new CharacterCollision(this.physicsWorld));
      npcEntity.AddComponent(new DirectionDebug(this.scene));
      this.entityManager.Add(npcEntity);
      this.enemies.push(npcEntity);
    }
  }

  Update() {
    this.enemies = this.enemies.filter(enemy => !enemy.IsDead());
    if (this.enemies.length === 0) {
      this.StartNextWave();
    }
  }
}