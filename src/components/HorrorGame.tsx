import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";

const BEAR_IMAGE = "https://cdn.poehali.dev/projects/c59ea029-efe1-427f-bdcc-1af247384bdd/files/38e4506d-fc90-4f31-a559-dc89f3a4a624.jpg";

const TOYS = [
  { id: 0, name: "Кукла", emoji: "🪆", color: 0xff4444, pos: [-8, 0.5, -8] },
  { id: 1, name: "Машинка", emoji: "🚗", color: 0x4444ff, pos: [8, 0.5, -8] },
  { id: 2, name: "Мячик", emoji: "🎾", color: 0x44ff44, pos: [-8, 0.5, 8] },
  { id: 3, name: "Робот", emoji: "🤖", color: 0xffaa00, pos: [8, 0.5, 8] },
];

type GameState = "menu" | "playing" | "dead" | "win";

export default function HorrorGame() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<GameEngine | null>(null);
  const [gameState, setGameState] = useState<GameState>("menu");
  const [health, setHealth] = useState(100);
  const [collected, setCollected] = useState<number[]>([]);
  const [isDamaged, setIsDamaged] = useState(false);
  const [bearNear, setBearNear] = useState(false);
  const [message, setMessage] = useState("");
  const [screamer, setScreamer] = useState(false);

  const showMessage = useCallback((msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 2500);
  }, []);

  const startGame = useCallback(() => {
    setGameState("playing");
    setHealth(100);
    setCollected([]);
    setIsDamaged(false);
    setBearNear(false);
  }, []);

  useEffect(() => {
    if (gameState !== "playing" || !canvasRef.current) return;

    const engine = new GameEngine(canvasRef.current, {
      onHealthChange: (hp) => {
        setHealth(hp);
        if (hp <= 0) {
          setScreamer(true);
          setTimeout(() => {
            setScreamer(false);
            setGameState("dead");
          }, 2200);
        }
        setIsDamaged(true);
        setTimeout(() => setIsDamaged(false), 300);
      },
      onScreamer: () => {
        setScreamer(true);
        setTimeout(() => setScreamer(false), 2200);
      },
      onCollect: (id) => {
        setCollected((prev) => {
          const next = [...prev, id];
          showMessage(`Подобрал ${TOYS[id].emoji} ${TOYS[id].name}!`);
          if (next.length === 4) {
            setTimeout(() => setGameState("win"), 500);
          }
          return next;
        });
      },
      onBearNear: (near) => setBearNear(near),
    });

    gameRef.current = engine;
    engine.start();

    return () => {
      engine.destroy();
      gameRef.current = null;
    };
  }, [gameState, showMessage]);

  useEffect(() => {
    if (gameState !== "playing") return;
    const handleKey = (e: KeyboardEvent) => {
      gameRef.current?.handleKey(e.code, true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      gameRef.current?.handleKey(e.code, false);
    };
    window.addEventListener("keydown", handleKey);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [gameState]);

  useEffect(() => {
    if (gameState !== "playing") return;
    const handleClick = () => {
      canvasRef.current?.requestPointerLock();
    };
    canvasRef.current?.addEventListener("click", handleClick);
    return () => canvasRef.current?.removeEventListener("click", handleClick);
  }, [gameState]);

  return (
    <div className="horror-root">
      {gameState === "menu" && (
        <div className="horror-screen">
          <div className="horror-menu">
            <div className="horror-logo">
              <span className="horror-title">BEAR HUNT</span>
              <span className="horror-subtitle">— Магазин Игрушек —</span>
            </div>
            <img
              src={BEAR_IMAGE}
              alt="monster bear"
              className="horror-bear-preview"
            />
            <div className="horror-description">
              <p>Ты заперт в тёмном магазине игрушек.</p>
              <p>Собери <strong>4 игрушки</strong> и выберись живым.</p>
              <p className="horror-warning">Он уже здесь...</p>
            </div>
            <button className="horror-btn" onClick={startGame}>
              НАЧАТЬ ИГРУ
            </button>
            <div className="horror-controls">
              <span>WASD — движение</span>
              <span>Мышь — обзор</span>
              <span>Клик — захват курсора</span>
            </div>
          </div>
        </div>
      )}

      {(gameState === "dead" || gameState === "win") && (
        <div className="horror-screen">
          <div className="horror-menu">
            {gameState === "dead" ? (
              <>
                <div className="horror-gameover">
                  <span>ТЫ МЁРТВ</span>
                </div>
                <p className="horror-gameover-text">Медведь тебя нашёл...</p>
              </>
            ) : (
              <>
                <div className="horror-win">
                  <span>ТЫ ВЫЖИЛ!</span>
                </div>
                <p className="horror-win-text">Все игрушки собраны. Ты сбежал!</p>
              </>
            )}
            <button className="horror-btn" onClick={startGame}>
              ИГРАТЬ СНОВА
            </button>
            <button className="horror-btn horror-btn-secondary" onClick={() => setGameState("menu")}>
              МЕНЮ
            </button>
          </div>
        </div>
      )}

      {gameState === "playing" && (
        <>
          <div
            ref={canvasRef}
            className="horror-canvas"
            style={{ cursor: "crosshair" }}
          />

          {isDamaged && <div className="horror-damage-overlay" />}
          {bearNear && !isDamaged && <div className="horror-fear-overlay" />}

          <div className="horror-hud">
            <div className="horror-health-bar">
              <span className="horror-hud-label">❤️ ЗДОРОВЬЕ</span>
              <div className="horror-health-track">
                <div
                  className="horror-health-fill"
                  style={{
                    width: `${health}%`,
                    background: health > 50 ? "#22c55e" : health > 25 ? "#f59e0b" : "#ef4444",
                  }}
                />
              </div>
              <span className="horror-health-num">{health}%</span>
            </div>

            <div className="horror-inventory">
              <span className="horror-hud-label">ИНВЕНТАРЬ</span>
              <div className="horror-toys">
                {TOYS.map((toy) => (
                  <div
                    key={toy.id}
                    className={`horror-toy-slot ${collected.includes(toy.id) ? "collected" : ""}`}
                    title={toy.name}
                  >
                    {toy.emoji}
                    {collected.includes(toy.id) && (
                      <span className="horror-toy-check">✓</span>
                    )}
                  </div>
                ))}
              </div>
              <span className="horror-toys-count">{collected.length} / 4</span>
            </div>
          </div>

          {message && (
            <div className="horror-message">
              {message}
            </div>
          )}

          {bearNear && (
            <div className="horror-bear-warning">
              ⚠ МЕДВЕДЬ БЛИЗКО
            </div>
          )}

          <div className="horror-crosshair">+</div>
          <div className="horror-flashlight-hint">🔦 Мышь = обзор (клик для захвата)</div>
          {screamer && (
            <div className="horror-screamer">
              <img src={BEAR_IMAGE} alt="SCREAMER" className="horror-screamer-img" />
              <div className="horror-screamer-text">ОН ТЕБЯ НАШЁЛ</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

class GameEngine {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private clock: THREE.Clock;
  private animFrameId: number = 0;
  private container: HTMLDivElement;
  private keys: Record<string, boolean> = {};
  private yaw = 0;
  private pitch = 0;
  private health = 100;
  private lastDamageTime = 0;
  private toyMeshes: THREE.Mesh[] = [];
  private collectedIds: Set<number> = new Set();
  private bear: THREE.Group;
  private bearSpeed = 0.015;
  private bearAngle = 0;
  private flashlight!: THREE.SpotLight;
  private flashlightTarget!: THREE.Object3D;
  private mouseSensitivity = 0.002;
  private flickerLights: Array<{
    light: THREE.PointLight;
    bulb: THREE.Mesh;
    baseIntensity: number;
    baseColor: number;
    flickerTimer: number;
    flickerDuration: number;
    isOff: boolean;
    offTimer: number;
    offDuration: number;
    phase: number;
  }> = [];

  private audioCtx!: AudioContext;
  private ambienceGain!: GainNode;
  private bearGain!: GainNode;
  private lastBearSoundTime = 0;
  private lastScreamerTime = 0;
  private screamerShown = false;

  private callbacks: {
    onHealthChange: (hp: number) => void;
    onCollect: (id: number) => void;
    onBearNear: (near: boolean) => void;
    onScreamer: () => void;
  };

  constructor(
    container: HTMLDivElement,
    callbacks: {
      onHealthChange: (hp: number) => void;
      onCollect: (id: number) => void;
      onBearNear: (near: boolean) => void;
      onScreamer: () => void;
    }
  ) {
    this.container = container;
    this.callbacks = callbacks;

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.fog = new THREE.FogExp2(0x000000, 0.07);
    this.renderer.setClearColor(0x000000);
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x050005, 0.07);

    this.camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    this.camera.position.set(0, 1.7, 0);

    this.clock = new THREE.Clock();
    this.bear = new THREE.Group();

    this.buildScene();
    this.setupPointerLock();
    this.setupResize();
    this.initAudio();
  }

  private buildScene() {
    const floorMat = new THREE.MeshLambertMaterial({ color: 0x1a0a0a });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    const ceilMat = new THREE.MeshLambertMaterial({ color: 0x0d0005 });
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), ceilMat);
    ceil.rotation.x = Math.PI / 2;
    ceil.position.y = 4;
    this.scene.add(ceil);

    this.buildWalls();
    this.buildShelves();
    this.buildLights();
    this.buildToys();
    this.buildBear();
    this.buildFlashlight();
  }

  private buildWalls() {
    const wallMat = new THREE.MeshLambertMaterial({ color: 0x110008 });
    const walls = [
      { pos: [0, 2, -15], rot: [0, 0, 0], w: 30, h: 4 },
      { pos: [0, 2, 15], rot: [0, Math.PI, 0], w: 30, h: 4 },
      { pos: [-15, 2, 0], rot: [0, Math.PI / 2, 0], w: 30, h: 4 },
      { pos: [15, 2, 0], rot: [0, -Math.PI / 2, 0], w: 30, h: 4 },
    ];

    walls.forEach(({ pos, rot, w, h }) => {
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), wallMat);
      mesh.position.set(pos[0], pos[1], pos[2]);
      mesh.rotation.set(rot[0], rot[1], rot[2]);
      this.scene.add(mesh);
    });
  }

  private buildShelves() {
    const shelfMat = new THREE.MeshLambertMaterial({ color: 0x2a1010 });
    const shelfPositions = [
      [-5, 0, -12], [0, 0, -12], [5, 0, -12],
      [-5, 0, 12], [0, 0, 12], [5, 0, 12],
      [-12, 0, -5], [-12, 0, 0], [-12, 0, 5],
      [12, 0, -5], [12, 0, 0], [12, 0, 5],
    ];

    shelfPositions.forEach(([x, , z]) => {
      for (let level = 0; level < 3; level++) {
        const shelf = new THREE.Mesh(
          new THREE.BoxGeometry(2.5, 0.1, 0.8),
          shelfMat
        );
        shelf.position.set(x, 0.8 + level * 1.1, z);
        shelf.castShadow = true;
        shelf.receiveShadow = true;
        this.scene.add(shelf);

        const post1 = new THREE.Mesh(
          new THREE.BoxGeometry(0.1, 1.1, 0.8),
          shelfMat
        );
        post1.position.set(x - 1.2, 0.55 + level * 1.1, z);
        this.scene.add(post1);

        const post2 = post1.clone();
        post2.position.x = x + 1.2;
        this.scene.add(post2);
      }

      const decorMat = new THREE.MeshLambertMaterial({
        color: Math.random() > 0.5 ? 0x330000 : 0x001122,
      });
      for (let i = 0; i < 3; i++) {
        const box = new THREE.Mesh(
          new THREE.BoxGeometry(0.3, 0.4, 0.3),
          decorMat
        );
        box.position.set(x + (i - 1) * 0.6, 1.0, z);
        this.scene.add(box);
      }
    });
  }

  private buildLights() {
    const ambient = new THREE.AmbientLight(0x0a0005, 0.25);
    this.scene.add(ambient);

    const lightDefs = [
      { pos: [-5, 3.6, -5],  color: 0xff4422, intensity: 1.4, radius: 14 },
      { pos: [ 5, 3.6, -5],  color: 0xdd2244, intensity: 1.2, radius: 13 },
      { pos: [ 0, 3.6,  0],  color: 0xff3311, intensity: 1.6, radius: 16 },
      { pos: [-5, 3.6,  5],  color: 0xcc1133, intensity: 1.1, radius: 12 },
      { pos: [ 5, 3.6,  5],  color: 0xff5500, intensity: 1.3, radius: 14 },
      { pos: [-10, 3.6, -10], color: 0x881122, intensity: 0.9, radius: 10 },
      { pos: [ 10, 3.6, -10], color: 0x771133, intensity: 0.9, radius: 10 },
      { pos: [-10, 3.6,  10], color: 0x882211, intensity: 0.9, radius: 10 },
      { pos: [ 10, 3.6,  10], color: 0x771122, intensity: 0.9, radius: 10 },
    ];

    lightDefs.forEach(({ pos, color, intensity, radius }, i) => {
      const light = new THREE.PointLight(color, intensity, radius);
      light.position.set(pos[0], pos[1], pos[2]);
      light.castShadow = i < 3;
      this.scene.add(light);

      const bulbMat = new THREE.MeshBasicMaterial({ color });
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), bulbMat);
      bulb.position.set(pos[0], pos[1], pos[2]);
      this.scene.add(bulb);

      const coneGeo = new THREE.CylinderGeometry(0, 0.18, 0.3, 8, 1, true);
      const coneMat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.08,
        side: THREE.BackSide,
      });
      const cone = new THREE.Mesh(coneGeo, coneMat);
      cone.position.set(pos[0], pos[1] - 0.15, pos[2]);
      this.scene.add(cone);

      this.flickerLights.push({
        light,
        bulb,
        baseIntensity: intensity,
        baseColor: color,
        flickerTimer: Math.random() * 3,
        flickerDuration: 0.05 + Math.random() * 0.12,
        isOff: false,
        offTimer: 4 + Math.random() * 10,
        offDuration: 0.08 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
      });
    });
  }

  private updateFlicker(delta: number, t: number) {
    this.flickerLights.forEach((fl) => {
      fl.flickerTimer -= delta;
      fl.offTimer -= delta;

      if (fl.isOff) {
        if (fl.offTimer <= 0) {
          fl.isOff = false;
          fl.offTimer = 3 + Math.random() * 12;
          fl.offDuration = 0.06 + Math.random() * 0.4;
        }
        fl.light.intensity = 0;
        (fl.bulb.material as THREE.MeshBasicMaterial).color.setHex(0x111111);
        return;
      }

      if (fl.offTimer <= 0) {
        fl.isOff = true;
        fl.offTimer = fl.offDuration;
        fl.flickerTimer = 0.05 + Math.random() * 0.1;
        fl.light.intensity = 0;
        return;
      }

      if (fl.flickerTimer <= 0) {
        fl.flickerTimer = 0.04 + Math.random() * 0.15;
        const roll = Math.random();
        if (roll < 0.15) {
          fl.light.intensity = fl.baseIntensity * (0.05 + Math.random() * 0.2);
        } else if (roll < 0.25) {
          fl.light.intensity = fl.baseIntensity * (1.5 + Math.random() * 0.5);
        } else {
          const wave = Math.sin(t * 8 + fl.phase) * 0.15;
          fl.light.intensity = fl.baseIntensity * (0.85 + wave + Math.random() * 0.1);
        }
        const mat = fl.bulb.material as THREE.MeshBasicMaterial;
        const bright = fl.light.intensity / fl.baseIntensity;
        const r = ((fl.baseColor >> 16) & 0xff) * bright;
        const g = ((fl.baseColor >> 8) & 0xff) * bright;
        const b = (fl.baseColor & 0xff) * bright;
        mat.color.setRGB(
          Math.min(1, r / 255),
          Math.min(1, g / 255),
          Math.min(1, b / 255)
        );
      }
    });
  }

  private buildToys() {
    TOYS.forEach((toy) => {
      const geom = toy.id === 1
        ? new THREE.BoxGeometry(0.5, 0.35, 0.8)
        : toy.id === 2
        ? new THREE.SphereGeometry(0.3, 16, 16)
        : toy.id === 3
        ? new THREE.CylinderGeometry(0.2, 0.25, 0.6, 8)
        : new THREE.CapsuleGeometry(0.15, 0.3, 4, 8);

      const mat = new THREE.MeshLambertMaterial({
        color: toy.color,
        emissive: toy.color,
        emissiveIntensity: 0.4,
      });

      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(toy.pos[0], toy.pos[1], toy.pos[2]);
      mesh.userData = { toyId: toy.id };
      mesh.castShadow = true;
      this.scene.add(mesh);
      this.toyMeshes.push(mesh);

      const glow = new THREE.PointLight(toy.color, 0.5, 3);
      glow.position.set(toy.pos[0], toy.pos[1] + 0.5, toy.pos[2]);
      this.scene.add(glow);
    });
  }

  private buildBear() {
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0x3d1c0c });
    const darkMat = new THREE.MeshLambertMaterial({ color: 0x1a0808 });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const toothMat = new THREE.MeshBasicMaterial({ color: 0xf5f5dc });

    const body = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 16), bodyMat);
    this.bear.add(body);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), bodyMat);
    head.position.y = 0.75;
    this.bear.add(head);

    const earL = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), bodyMat);
    earL.position.set(-0.28, 1.05, 0);
    this.bear.add(earL);
    const earInL = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), darkMat);
    earInL.position.set(-0.28, 1.05, 0.05);
    this.bear.add(earInL);

    const earR = earL.clone();
    earR.position.x = 0.28;
    this.bear.add(earR);
    const earInR = earInL.clone();
    earInR.position.x = 0.28;
    this.bear.add(earInR);

    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), eyeMat);
    eyeL.position.set(-0.13, 0.82, 0.3);
    this.bear.add(eyeL);

    const eyeGlowL = new THREE.PointLight(0xff0000, 0.8, 2);
    eyeGlowL.position.copy(eyeL.position);
    this.bear.add(eyeGlowL);

    const eyeR = eyeL.clone();
    eyeR.position.x = 0.13;
    this.bear.add(eyeR);
    const eyeGlowR = new THREE.PointLight(0xff0000, 0.8, 2);
    eyeGlowR.position.copy(eyeR.position);
    this.bear.add(eyeGlowR);

    const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), darkMat);
    muzzle.position.set(0, 0.68, 0.3);
    muzzle.scale.set(1, 0.7, 0.8);
    this.bear.add(muzzle);

    for (let i = -1; i <= 1; i++) {
      const tooth = new THREE.Mesh(
        new THREE.ConeGeometry(0.025, 0.12, 4),
        toothMat
      );
      tooth.position.set(i * 0.07, 0.6, 0.38);
      tooth.rotation.x = 0.3;
      this.bear.add(tooth);
    }

    const armL = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.12, 0.3, 4, 8),
      bodyMat
    );
    armL.position.set(-0.6, 0.1, 0);
    armL.rotation.z = 0.5;
    this.bear.add(armL);

    const armR = armL.clone();
    armR.position.x = 0.6;
    armR.rotation.z = -0.5;
    this.bear.add(armR);

    const legL = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.14, 0.25, 4, 8),
      bodyMat
    );
    legL.position.set(-0.25, -0.65, 0);
    this.bear.add(legL);
    const legR = legL.clone();
    legR.position.x = 0.25;
    this.bear.add(legR);

    this.bear.position.set(5, 1.0, 0);
    this.scene.add(this.bear);
  }

  private setupPointerLock() {
    const onMouseMove = (e: MouseEvent) => {
      const locked =
        document.pointerLockElement === this.container.querySelector("canvas") ||
        document.pointerLockElement === this.container;
      if (locked) {
        this.yaw -= e.movementX * this.mouseSensitivity;
        this.pitch -= e.movementY * this.mouseSensitivity;
        this.pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this.pitch));
      }
    };
    document.addEventListener("mousemove", onMouseMove);
    this._cleanupMouseMove = () => document.removeEventListener("mousemove", onMouseMove);
  }

  private _cleanupMouseMove: (() => void) | null = null;

  private buildFlashlight() {
    this.flashlightTarget = new THREE.Object3D();
    this.scene.add(this.flashlightTarget);

    this.flashlight = new THREE.SpotLight(0xfff5e0, 12, 40, Math.PI / 7, 0.18, 0.8);
    this.flashlight.castShadow = true;
    this.flashlight.shadow.mapSize.width = 512;
    this.flashlight.shadow.mapSize.height = 512;
    this.flashlight.shadow.camera.near = 0.3;
    this.flashlight.shadow.camera.far = 40;
    this.scene.add(this.flashlight);
    this.scene.add(this.flashlight.target);
  }

  private setupResize() {
    const onResize = () => {
      this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    };
    window.addEventListener("resize", onResize);
  }

  handleKey(code: string, down: boolean) {
    this.keys[code] = down;
  }

  start() {
    this.clock.start();
    this.loop();
  }

  private loop() {
    this.animFrameId = requestAnimationFrame(() => this.loop());
    const delta = this.clock.getDelta();
    const t = this.clock.getElapsedTime();

    this.updatePlayer(delta);
    this.updateBear(delta, t);
    this.checkToyPickup();
    this.animateToys(t);
    this.updateFlicker(delta, t);
    this.updateAudio(this.camera.position.distanceTo(this.bear.position));

    this.renderer.render(this.scene, this.camera);
  }

  private updatePlayer(delta: number) {
    const speed = 4.5;
    const dir = new THREE.Vector3();
    if (this.keys["KeyW"] || this.keys["ArrowUp"]) dir.z -= 1;
    if (this.keys["KeyS"] || this.keys["ArrowDown"]) dir.z += 1;
    if (this.keys["KeyA"] || this.keys["ArrowLeft"]) dir.x -= 1;
    if (this.keys["KeyD"] || this.keys["ArrowRight"]) dir.x += 1;

    dir.normalize();
    dir.applyEuler(new THREE.Euler(0, this.yaw, 0));
    dir.multiplyScalar(speed * delta);

    const nx = this.camera.position.x + dir.x;
    const nz = this.camera.position.z + dir.z;

    if (Math.abs(nx) < 14) this.camera.position.x = nx;
    if (Math.abs(nz) < 14) this.camera.position.z = nz;

    this.camera.rotation.order = "YXZ";
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
    this.camera.position.y = 1.7;

    const camDir = new THREE.Vector3();
    this.camera.getWorldDirection(camDir);
    const cp = this.camera.position;

    this.flashlight.position.set(cp.x + camDir.x * 0.1, cp.y - 0.15, cp.z + camDir.z * 0.1);
    this.flashlight.target.position.set(
      cp.x + camDir.x * 10,
      cp.y + camDir.y * 10,
      cp.z + camDir.z * 10
    );
    this.flashlight.target.updateMatrixWorld();
  }

  private updateBear(delta: number, t: number) {
    const playerPos = this.camera.position;
    const bearPos = this.bear.position;

    const dx = playerPos.x - bearPos.x;
    const dz = playerPos.z - bearPos.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    const isNear = dist < 6;
    this.callbacks.onBearNear(isNear);

    if (dist < 18) {
      const speed = dist < 5 ? this.bearSpeed * 2.0 : this.bearSpeed;
      bearPos.x += (dx / dist) * speed * 60 * delta;
      bearPos.z += (dz / dist) * speed * 60 * delta;
      this.bear.lookAt(playerPos.x, bearPos.y, playerPos.z);
    } else {
      this.bearAngle += delta * 0.3;
      bearPos.x = Math.sin(this.bearAngle) * 8;
      bearPos.z = Math.cos(this.bearAngle) * 8;
    }

    bearPos.y = 1.0 + Math.sin(t * 4) * 0.05;

    if (dist < 3 && !this.screamerShown) {
      const now = performance.now();
      if (now - this.lastScreamerTime > 8000) {
        this.lastScreamerTime = now;
        this.screamerShown = true;
        this.playScreamerSound();
        this.callbacks.onScreamer();
        setTimeout(() => { this.screamerShown = false; }, 9000);
      }
    }

    if (dist < 1.5) {
      const now = performance.now();
      if (now - this.lastDamageTime > 600) {
        this.lastDamageTime = now;
        this.health = Math.max(0, this.health - 20);
        this.callbacks.onHealthChange(this.health);
      }
    }
  }

  private checkToyPickup() {
    const playerPos = this.camera.position;
    this.toyMeshes.forEach((mesh) => {
      const id = mesh.userData.toyId;
      if (this.collectedIds.has(id)) return;
      const d = playerPos.distanceTo(mesh.position);
      if (d < 1.5) {
        this.collectedIds.add(id);
        this.scene.remove(mesh);
        this.playPickupSound();
        this.callbacks.onCollect(id);
      }
    });
  }

  private animateToys(t: number) {
    this.toyMeshes.forEach((mesh, i) => {
      if (!this.collectedIds.has(mesh.userData.toyId)) {
        mesh.position.y = TOYS[mesh.userData.toyId].pos[1] + Math.sin(t * 2 + i) * 0.15;
        mesh.rotation.y = t * 1.5 + i;
      }
    });
  }

  private initAudio() {
    try {
      this.audioCtx = new AudioContext();
      this.ambienceGain = this.audioCtx.createGain();
      this.ambienceGain.gain.value = 0.18;
      this.ambienceGain.connect(this.audioCtx.destination);
      this.bearGain = this.audioCtx.createGain();
      this.bearGain.gain.value = 0;
      this.bearGain.connect(this.audioCtx.destination);
      this.startAmbience();
    } catch (e) {
      console.warn("Audio init failed", e);
    }
  }

  private startAmbience() {
    const ctx = this.audioCtx;
    const loop = () => {
      if (!ctx || ctx.state === "closed") return;
      const buf = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.3 * Math.exp(-i / (ctx.sampleRate * 1.5));
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 180 + Math.random() * 80;
      src.connect(lp);
      lp.connect(this.ambienceGain);
      src.start();
      src.onended = () => setTimeout(loop, 800 + Math.random() * 1200);
    };
    loop();
  }

  private playBearGrowl() {
    const ctx = this.audioCtx;
    if (!ctx || ctx.state === "closed") return;
    const dur = 0.6 + Math.random() * 0.4;
    const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const t = i / ctx.sampleRate;
      const env = Math.sin(Math.PI * t / dur);
      data[i] = (Math.random() * 2 - 1) * env * 0.9;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 140 + Math.random() * 60;
    const dist = ctx.createWaveShaper();
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i * 2) / 256 - 1;
      curve[i] = (Math.PI + 200) * x / (Math.PI + 200 * Math.abs(x));
    }
    dist.curve = curve;
    src.connect(lp);
    lp.connect(dist);
    const g = ctx.createGain();
    g.gain.value = 0.5;
    dist.connect(g);
    g.connect(ctx.destination);
    src.start();
  }

  private playScreamerSound() {
    const ctx = this.audioCtx;
    if (!ctx || ctx.state === "closed") return;
    const dur = 1.8;
    const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const t = i / ctx.sampleRate;
      const env = t < 0.1 ? t / 0.1 : Math.exp(-(t - 0.1) * 1.5);
      const freq = 280 + Math.sin(t * 30) * 80;
      data[i] = Math.sin(2 * Math.PI * freq * t) * env * 0.95
        + (Math.random() * 2 - 1) * env * 0.4;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    g.gain.value = 1.4;
    src.connect(g);
    g.connect(ctx.destination);
    src.start();
  }

  private playPickupSound() {
    const ctx = this.audioCtx;
    if (!ctx || ctx.state === "closed") return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
    g.gain.setValueAtTime(0.3, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  }

  private updateAudio(dist: number) {
    if (!this.audioCtx || this.audioCtx.state === "closed") return;
    if (this.audioCtx.state === "suspended") this.audioCtx.resume();

    const now = performance.now();
    if (dist < 7 && now - this.lastBearSoundTime > 2200) {
      this.lastBearSoundTime = now;
      this.playBearGrowl();
    }

    const nearVol = dist < 8 ? Math.max(0, (8 - dist) / 8) * 0.25 : 0;
    this.bearGain.gain.setTargetAtTime(nearVol, this.audioCtx.currentTime, 0.5);
  }

  destroy() {
    cancelAnimationFrame(this.animFrameId);
    this._cleanupMouseMove?.();
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
    try { this.audioCtx?.close(); } catch (e) { void e; }
    document.exitPointerLock();
  }
}