// Vue Bits LightPillar — Copyright (c) 2025 David Haz.
// Source: https://github.com/DavidHDev/vue-bits/blob/3766ebeeed37ec35bce29f001b6d101c7b17da35/src/content/Backgrounds/LightPillar/LightPillar.vue
// MIT + Commons Clause; full notice: /licenses/vue-bits-LightPillar.txt.
// Original vertex/fragment shaders below are copied verbatim. Quality selection
// is retained; device inputs are explicit so importing this module is SSR-safe.
export type LightPillarQuality = 'low' | 'medium' | 'high'
export function lightPillarQuality(quality: LightPillarQuality, mobile: boolean, cores: number, pixelRatio: number) {
  let effective = quality
  if ((mobile || (cores > 0 && cores <= 4)) && quality === 'high') effective = 'medium'
  if (mobile && quality !== 'low') effective = 'low'
  const choices = {
    low: { iterations: 24, waveIterations: 1, pixelRatio: .5, precision: 'mediump' as const, stepMultiplier: 1.5, fps: 30 },
    medium: { iterations: 40, waveIterations: 2, pixelRatio: .65, precision: 'mediump' as const, stepMultiplier: 1.2, fps: 60 },
    high: { iterations: 80, waveIterations: 4, pixelRatio: Math.min(pixelRatio, 2), precision: 'highp' as const, stepMultiplier: 1, fps: 60 },
  }
  return { ...choices[effective], effective }
}
export function lightPillarShaders(settings: ReturnType<typeof lightPillarQuality>) {
  const vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 1.0);
    }
  `;
  const fragmentShader = `
    uniform float uTime;
    uniform vec2 uResolution;
    uniform vec2 uMouse;
    uniform vec3 uTopColor;
    uniform vec3 uBottomColor;
    uniform float uIntensity;
    uniform bool uInteractive;
    uniform float uGlowAmount;
    uniform float uPillarWidth;
    uniform float uPillarHeight;
    uniform float uNoiseIntensity;
    uniform float uPillarRotation;
    uniform float uRotCos;
    uniform float uRotSin;
    uniform float uPillarRotCos;
    uniform float uPillarRotSin;
    uniform float uWaveSin[4];
    uniform float uWaveCos[4];
    varying vec2 vUv;

    const float PI = 3.141592653589793;
    const float EPSILON = 0.001;
    const float E = 2.71828182845904523536;

    float noise(vec2 coord) {
      vec2 r = (E * sin(E * coord));
      return fract(r.x * r.y * (1.0 + coord.x));
    }

    void main() {
      vec2 fragCoord = vUv * uResolution;
      vec2 uv = (fragCoord * 2.0 - uResolution) / uResolution.y;

      uv = vec2(
        uv.x * uPillarRotCos - uv.y * uPillarRotSin,
        uv.x * uPillarRotSin + uv.y * uPillarRotCos
      );

      vec3 origin = vec3(0.0, 0.0, -10.0);
      vec3 direction = normalize(vec3(uv, 1.0));

      float maxDepth = 50.0;
      float depth = 0.1;

      float rotCos = uRotCos;
      float rotSin = uRotSin;
      if(uInteractive && length(uMouse) > 0.0) {
        float mouseAngle = uMouse.x * PI * 2.0;
        rotCos = cos(mouseAngle);
        rotSin = sin(mouseAngle);
      }

      vec3 color = vec3(0.0);

      const int ITERATIONS = ${settings.iterations};
      const int WAVE_ITERATIONS = ${settings.waveIterations};
      const float STEP_MULT = ${settings.stepMultiplier.toFixed(1)};

      for(int i = 0; i < ITERATIONS; i++) {
        vec3 pos = origin + direction * depth;

        float newX = pos.x * rotCos - pos.z * rotSin;
        float newZ = pos.x * rotSin + pos.z * rotCos;
        pos.x = newX;
        pos.z = newZ;

        vec3 deformed = pos;
        deformed.y *= uPillarHeight;
        deformed = deformed + vec3(0.0, uTime, 0.0);

        float frequency = 1.0;
        float amplitude = 1.0;
        for(int j = 0; j < WAVE_ITERATIONS; j++) {
          float wx = deformed.x * uWaveCos[j] - deformed.z * uWaveSin[j];
          float wz = deformed.x * uWaveSin[j] + deformed.z * uWaveCos[j];
          deformed.x = wx;
          deformed.z = wz;

          float phase = uTime * float(j) * 2.0;
          vec3 oscillation = cos(deformed.zxy * frequency - phase);
          deformed += oscillation * amplitude;
          frequency *= 2.0;
          amplitude *= 0.5;
        }

        vec2 cosinePair = cos(deformed.xz);
        float fieldDistance = length(cosinePair) - 0.2;

        float radialBound = length(pos.xz) - uPillarWidth;
        float k = 4.0;
        float h = max(k - abs(-radialBound - (-fieldDistance)), 0.0);
        fieldDistance = -(min(-radialBound, -fieldDistance) - h * h * 0.25 / k);

        fieldDistance = abs(fieldDistance) * 0.15 + 0.01;

        vec3 gradient = mix(uBottomColor, uTopColor, smoothstep(15.0, -15.0, pos.y));
        color += gradient / fieldDistance;

        if(fieldDistance < EPSILON || depth > maxDepth) break;
        depth += fieldDistance * STEP_MULT;
      }

      float widthNormalization = uPillarWidth / 3.0;
      color = tanh(color * uGlowAmount / widthNormalization);

      float rnd = noise(gl_FragCoord.xy);
      color -= rnd / 15.0 * uNoiseIntensity;

      gl_FragColor = vec4(color * uIntensity, 1.0);
    }
  `;
  return { vertexShader, fragmentShader }
}
