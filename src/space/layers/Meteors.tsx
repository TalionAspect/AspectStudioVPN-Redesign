import { useMemo } from "react";
import { AdditiveBlending, InstancedBufferAttribute, InstancedBufferGeometry, PlaneGeometry } from "three";
import { seededRandom, shared, useColor } from "../engine";

interface Props {
  count: number;
  head: string;
  tail: string;
  seed?: number;
}

const vertexShader = /* glsl */ `
  attribute vec3 aStart; attribute vec2 aDir; attribute vec4 aParams; attribute float aWidth;
  uniform float uTime;
  varying float vAlong; varying float vAcross; varying float vFade;
  void main() {
    float speed = aParams.x; float len = aParams.y; float period = aParams.w;
    float local = mod(uTime + aParams.z, period);
    float duration = 22.0 / speed;
    if (local > duration) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); vFade = 0.0; return; }
    vec3 dir = vec3(aDir, 0.0);
    vec3 head = aStart + dir * local * speed;
    float along = position.x + 0.5;
    vec3 perp = vec3(-aDir.y, aDir.x, 0.0);
    float grow = min(1.0, local * 2.5);
    vec3 p = head - dir * (1.0 - along) * len * grow + perp * position.y * aWidth * (0.2 + along * 0.8);
    vAlong = along; vAcross = position.y * 2.0;
    vFade = smoothstep(0.0, 0.2, local) * (1.0 - smoothstep(duration * 0.65, duration, local));
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uHead; uniform vec3 uTail;
  varying float vAlong; varying float vAcross; varying float vFade;
  void main() {
    float body = pow(vAlong, 2.6) * (1.0 - abs(vAcross));
    float spark = smoothstep(0.86, 1.0, vAlong) * smoothstep(1.0, 0.0, abs(vAcross));
    vec3 col = mix(uTail, uHead, vAlong) * body + uHead * spark * 1.6;
    float a = (body + spark) * vFade;
    if (a < 0.003) discard;
    gl_FragColor = vec4(col, a);
  }
`;

export default function Meteors({ count, head, tail, seed = 11 }: Props) {
  const headColor = useColor(head);
  const tailColor = useColor(tail);

  const geometry = useMemo(() => {
    const random = seededRandom(seed);
    const base = new PlaneGeometry(1, 1);
    const geo = new InstancedBufferGeometry();
    geo.index = base.index;
    geo.setAttribute("position", base.getAttribute("position"));
    geo.setAttribute("uv", base.getAttribute("uv"));
    const starts = new Float32Array(count * 3);
    const dirs = new Float32Array(count * 2);
    const params = new Float32Array(count * 4);
    const widths = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      starts[i * 3] = -2 + random() * 12;
      starts[i * 3 + 1] = 3.5 + random() * 3.5;
      starts[i * 3 + 2] = -5 + random() * 4;
      const angle = Math.PI + 0.42 + (random() - 0.5) * 0.22;
      dirs[i * 2] = Math.cos(angle);
      dirs[i * 2 + 1] = Math.sin(angle);
      const speed = 5.5 + random() * 6;
      params[i * 4] = speed;
      params[i * 4 + 1] = 1.4 + random() * 2.6;
      params[i * 4 + 2] = random() * 40;
      params[i * 4 + 3] = 22 / speed + 2 + random() * 9;
      widths[i] = 0.025 + random() * 0.035;
    }
    geo.setAttribute("aStart", new InstancedBufferAttribute(starts, 3));
    geo.setAttribute("aDir", new InstancedBufferAttribute(dirs, 2));
    geo.setAttribute("aParams", new InstancedBufferAttribute(params, 4));
    geo.setAttribute("aWidth", new InstancedBufferAttribute(widths, 1));
    geo.instanceCount = count;
    base.dispose();
    return geo;
  }, [count, seed]);

  const uniforms = useMemo(() => ({ uTime: shared.uTime, uHead: { value: headColor }, uTail: { value: tailColor } }), [headColor, tailColor]);

  return (
    <mesh geometry={geometry} frustumCulled={false} renderOrder={5}>
      <shaderMaterial vertexShader={vertexShader} fragmentShader={fragmentShader} uniforms={uniforms} transparent depthWrite={false} blending={AdditiveBlending} />
    </mesh>
  );
}