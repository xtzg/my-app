import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { Renderer, Camera, Geometry, Program, Mesh } from "ogl";
import "./BackgroundEffect.css";

interface BackgroundEffectProps {
    // 网格扭曲参数
    grid?: number;
    distortionStrength?: number;
    relaxation?: number;
    imageSrc: string;
    // 粒子参数
    particleCount?: number;
    particleSpread?: number;
    particleSpeed?: number;
    particleColors?: string[];
    particleBaseSize?: number;
    sizeRandomness?: number;
    cameraDistance?: number;
    disableRotation?: boolean;
    mouseForce?: number; // 鼠标力度
    mouseRadius?: number; // 鼠标影响半径
    particleMouseForce?: number; // 粒子受鼠标影响的力度
    className?: string;
}

const defaultColors: string[] = ["#ffffff", "#ffffff", "#ffffff"];

const hexToRgb = (hex: string): [number, number, number] => {
    hex = hex.replace(/^#/, "");
    if (hex.length === 3) {
        hex = hex.split("").map((c) => c + c).join("");
    }
    const int = parseInt(hex, 16);
    const r = ((int >> 16) & 255) / 255;
    const g = ((int >> 8) & 255) / 255;
    const b = (int & 255) / 255;
    return [r, g, b];
};

// 粒子着色器
const particleVertex = /* glsl */ `
  attribute vec3 position;
  attribute vec4 random;
  attribute vec3 color;
  
  uniform mat4 modelMatrix;
  uniform mat4 viewMatrix;
  uniform mat4 projectionMatrix;
  uniform float uTime;
  uniform float uSpread;
  uniform float uBaseSize;
  uniform float uSizeRandomness;
  
  varying vec4 vRandom;
  varying vec3 vColor;
  
  void main() {
    vRandom = random;
    vColor = color;
    
    vec3 pos = position * uSpread;
    pos.z *= 10.0;
    
    vec4 mPos = modelMatrix * vec4(pos, 1.0);
    float t = uTime;
    mPos.x += sin(t * random.z + 6.28 * random.w) * mix(0.1, 1.5, random.x);
    mPos.y += sin(t * random.y + 6.28 * random.x) * mix(0.1, 1.5, random.w);
    mPos.z += sin(t * random.w + 6.28 * random.y) * mix(0.1, 1.5, random.z);
    
    vec4 mvPos = viewMatrix * mPos;
    gl_PointSize = (uBaseSize * (1.0 + uSizeRandomness * (random.x - 0.5))) / length(mvPos.xyz);
    gl_Position = projectionMatrix * mvPos;
  }
`;

const particleFragment = /* glsl */ `
  precision highp float;
  
  uniform float uTime;
  varying vec4 vRandom;
  varying vec3 vColor;
  
  void main() {
    vec2 uv = gl_PointCoord.xy;
    float d = length(uv - vec2(0.5));
    float circle = smoothstep(0.5, 0.4, d) * 0.8;
    gl_FragColor = vec4(vColor + 0.2 * sin(uv.yxx + uTime + vRandom.y * 6.28), circle);
  }
`;

// 着色器代码
const vertexShader = `
uniform float time;
varying vec2 vUv;
varying vec3 vPosition;

void main() {
  vUv = uv;
  vPosition = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
uniform sampler2D uDataTexture;
uniform sampler2D uTexture;
uniform vec4 resolution;
varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  vec4 offset = texture2D(uDataTexture, vUv);
  gl_FragColor = texture2D(uTexture, uv - 0.02 * offset.rg);
}
`;

const BackgroundEffect: React.FC<BackgroundEffectProps> = ({
    grid = 40,
    distortionStrength = 0.1,
    relaxation = 0.9,
    imageSrc,
    particleCount = 400,
    particleSpread = 10,
    particleSpeed = 0.1,
    particleColors = defaultColors,
    particleBaseSize = 100,
    sizeRandomness = 1,
    cameraDistance = 20,
    disableRotation = false,
    mouseForce = 1.5,
    mouseRadius = 0.2,
    particleMouseForce = 0.5,
    className = "",
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const mouseRef = useRef({
        x: 0,
        y: 0,
        prevX: 0,
        prevY: 0,
        vX: 0,
        vY: 0,
        targetX: 0,
        targetY: 0,
        lerpFactor: 0.1
    });
    const imageAspectRef = useRef<number>(1);
    const particlesRef = useRef<{ renderer: Renderer | null; mesh: Mesh | null }>({
        renderer: null,
        mesh: null,
    });

    useEffect(() => {
        if (!containerRef.current) return;
        const container = containerRef.current;
        const distortionLayer = container.querySelector('.distortion-layer') as HTMLElement;
        const particlesLayer = container.querySelector('.particles-layer') as HTMLElement;

        // 初始化THREE.js
        const scene = new THREE.Scene();
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        distortionLayer.appendChild(renderer.domElement);

        // 初始化粒子系统
        const particleRenderer = new Renderer({
            depth: false,
            alpha: true,
            powerPreference: "high-performance",
        });
        const gl = particleRenderer.gl;
        particlesLayer.appendChild(gl.canvas);
        gl.clearColor(0, 0, 0, 0);

        const particleCamera = new Camera(gl, { fov: 15 });
        particleCamera.position.set(0, 0, cameraDistance);

        // 创建粒子几何体
        const count = particleCount;
        const positions = new Float32Array(count * 3);
        const randoms = new Float32Array(count * 4);
        const colors = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            let x: number, y: number, z: number, len: number;
            do {
                x = Math.random() * 2 - 1;
                y = Math.random() * 2 - 1;
                z = Math.random() * 2 - 1;
                len = x * x + y * y + z * z;
            } while (len > 1 || len === 0);
            const r = Math.cbrt(Math.random());
            positions.set([x * r, y * r, z * r], i * 3);
            randoms.set([Math.random(), Math.random(), Math.random(), Math.random()], i * 4);
            const col = hexToRgb(particleColors[Math.floor(Math.random() * particleColors.length)]);
            colors.set(col, i * 3);
        }

        const geometry = new Geometry(gl, {
            position: { size: 3, data: positions },
            random: { size: 4, data: randoms },
            color: { size: 3, data: colors },
        });

        const program = new Program(gl, {
            vertex: particleVertex,
            fragment: particleFragment,
            uniforms: {
                uTime: { value: 0 },
                uSpread: { value: particleSpread },
                uBaseSize: { value: particleBaseSize },
                uSizeRandomness: { value: sizeRandomness },
            },
            transparent: true,
            depthTest: false,
        });

        const particles = new Mesh(gl, { mode: gl.POINTS, geometry, program });
        particlesRef.current = { renderer: particleRenderer, mesh: particles };

        // 加载图片
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(imageSrc, (texture) => {
            texture.minFilter = THREE.LinearFilter;
            imageAspectRef.current = texture.image.width / texture.image.height;
            material.uniforms.uTexture.value = texture;
            handleResize();
        });

        // 创建数据纹理
        const size = grid;
        const data = new Float32Array(4 * size * size);
        for (let i = 0; i < size * size; i++) {
            data[i * 4] = Math.random() * 255 - 125;
            data[i * 4 + 1] = Math.random() * 255 - 125;
        }

        const dataTexture = new THREE.DataTexture(
            data,
            size,
            size,
            THREE.RGBAFormat,
            THREE.FloatType
        );
        dataTexture.needsUpdate = true;

        // 创建材质和几何体
        const uniforms = {
            time: { value: 0 },
            resolution: { value: new THREE.Vector4() },
            uTexture: { value: null as THREE.Texture | null },
            uDataTexture: { value: dataTexture },
        };

        const material = new THREE.ShaderMaterial({
            side: THREE.DoubleSide,
            uniforms,
            vertexShader,
            fragmentShader,
        });

        const geometry2 = new THREE.PlaneGeometry(1, 1, size - 1, size - 1);
        const plane = new THREE.Mesh(geometry2, material);
        scene.add(plane);

        const camera = new THREE.OrthographicCamera(0, 0, 0, 0, -1000, 1000);
        camera.position.z = 2;

        // 处理窗口大小变化
        const handleResize = () => {
            const width = container.offsetWidth;
            const height = container.offsetHeight;
            const containerAspect = width / height;
            const imageAspect = imageAspectRef.current;

            renderer.setSize(width, height);
            particleRenderer.setSize(width, height);

            const scale = Math.max(containerAspect / imageAspect, 1);
            plane.scale.set(imageAspect * scale, scale, 1);

            const frustumHeight = 1;
            const frustumWidth = frustumHeight * containerAspect;
            camera.left = -frustumWidth / 2;
            camera.right = frustumWidth / 2;
            camera.top = frustumHeight / 2;
            camera.bottom = -frustumHeight / 2;
            camera.updateProjectionMatrix();

            particleCamera.perspective({ aspect: width / height });

            uniforms.resolution.value.set(width, height, 1, 1);
        };

        // 修改鼠标事件处理
        const handleMouseMove = (e: MouseEvent) => {
            const rect = container.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = 1 - (e.clientY - rect.top) / rect.height;

            // 计算鼠标速度
            mouseRef.current.vX = (x - mouseRef.current.prevX) * mouseForce;
            mouseRef.current.vY = (y - mouseRef.current.prevY) * mouseForce;

            // 更新目标位置
            mouseRef.current.targetX = (x - 0.5) * 2;
            mouseRef.current.targetY = (y - 0.5) * 2;

            // 更新当前位置
            mouseRef.current = {
                ...mouseRef.current,
                x,
                y,
                prevX: x,
                prevY: y
            };
        };

        const handleMouseLeave = () => {
            mouseRef.current = {
                ...mouseRef.current,
                x: 0.5,
                y: 0.5,
                prevX: 0.5,
                prevY: 0.5,
                vX: 0,
                vY: 0,
                targetX: 0,
                targetY: 0
            };
        };

        let lastTime = performance.now();
        let elapsed = 0;

        // 修改动画循环
        let animationFrameId: number;
        const animate = (t: number) => {
            const delta = t - lastTime;
            lastTime = t;
            elapsed += delta * particleSpeed;

            animationFrameId = requestAnimationFrame(animate);
            uniforms.time.value += 0.05;

            // 更新扭曲效果
            const data = dataTexture.image.data;
            for (let i = 0; i < size * size; i++) {
                const index = i * 4;
                (data as Float32Array)[index] *= relaxation;
                (data as Float32Array)[index + 1] *= relaxation;
            }

            const gridMouseX = size * mouseRef.current.x;
            const gridMouseY = size * mouseRef.current.y;
            const maxDist = size * mouseRadius;

            for (let i = 0; i < size; i++) {
                for (let j = 0; j < size; j++) {
                    const distSq = Math.pow(gridMouseX - i, 2) + Math.pow(gridMouseY - j, 2);
                    if (distSq < maxDist * maxDist) {
                        const index = 4 * (i + size * j);
                        const power = Math.min(maxDist / Math.sqrt(distSq), 10);
                        (data as Float32Array)[index] += distortionStrength * 100 * mouseRef.current.vX * power;
                        (data as Float32Array)[index + 1] -= distortionStrength * 100 * mouseRef.current.vY * power;
                    }
                }
            }

            // 更新粒子
            program.uniforms.uTime.value = elapsed * 0.001;

            // 平滑插值到目标位置
            if (particles) {
                particles.position.x += (mouseRef.current.targetX * particleMouseForce - particles.position.x) * mouseRef.current.lerpFactor;
                particles.position.y += (mouseRef.current.targetY * particleMouseForce - particles.position.y) * mouseRef.current.lerpFactor;

                if (!disableRotation) {
                    particles.rotation.x = Math.sin(elapsed * 0.0002) * 0.1;
                    particles.rotation.y = Math.cos(elapsed * 0.0005) * 0.15;
                    particles.rotation.z += 0.01 * particleSpeed;
                }
            }

            dataTexture.needsUpdate = true;
            renderer.render(scene, camera);
            particleRenderer.render({ scene: particles, camera: particleCamera });
        };

        animationFrameId = requestAnimationFrame(animate);

        // 添加事件监听
        window.addEventListener("resize", handleResize);
        container.addEventListener("mousemove", handleMouseMove);
        container.addEventListener("mouseleave", handleMouseLeave);
        handleResize();

        // 清理函数
        return () => {
            window.removeEventListener("resize", handleResize);
            container.removeEventListener("mousemove", handleMouseMove);
            container.removeEventListener("mouseleave", handleMouseLeave);
            cancelAnimationFrame(animationFrameId);
            renderer.dispose();
            geometry2.dispose();
            material.dispose();
            dataTexture.dispose();
            if (uniforms.uTexture.value) uniforms.uTexture.value.dispose();
            if (distortionLayer.contains(renderer.domElement)) {
                distortionLayer.removeChild(renderer.domElement);
            }
            if (particlesLayer.contains(gl.canvas)) {
                particlesLayer.removeChild(gl.canvas);
            }
            particleRenderer.gl.getExtension('WEBGL_lose_context')?.loseContext();
        };
    }, [
        grid,
        distortionStrength,
        relaxation,
        imageSrc,
        particleCount,
        particleSpread,
        particleSpeed,
        particleColors,
        particleBaseSize,
        sizeRandomness,
        cameraDistance,
        disableRotation,
        mouseForce,
        mouseRadius,
        particleMouseForce,
    ]);

    return (
        <div
            ref={containerRef}
            className={`background-effect ${className}`}
            style={{ touchAction: 'none' }} // 防止移动端滚动干扰
        >
            <div className="distortion-layer" />
            <div className="particles-layer" />
        </div>
    );
};

// 使用 React.memo 包装组件，只有当 props 真正改变时才重新渲染
export default React.memo(BackgroundEffect, (prevProps, nextProps) => {
    // 比较所有可能影响渲染的属性
    return (
        prevProps.grid === nextProps.grid &&
        prevProps.distortionStrength === nextProps.distortionStrength &&
        prevProps.relaxation === nextProps.relaxation &&
        prevProps.imageSrc === nextProps.imageSrc &&
        prevProps.particleCount === nextProps.particleCount &&
        prevProps.particleSpread === nextProps.particleSpread &&
        prevProps.particleSpeed === nextProps.particleSpeed &&
        prevProps.particleColors?.toString() === nextProps.particleColors?.toString() &&
        prevProps.particleBaseSize === nextProps.particleBaseSize &&
        prevProps.sizeRandomness === nextProps.sizeRandomness &&
        prevProps.cameraDistance === nextProps.cameraDistance &&
        prevProps.disableRotation === nextProps.disableRotation &&
        prevProps.mouseForce === nextProps.mouseForce &&
        prevProps.mouseRadius === nextProps.mouseRadius &&
        prevProps.particleMouseForce === nextProps.particleMouseForce &&
        prevProps.className === nextProps.className
    );
}); 