// js/world-3d-engine.js (v7：色彩還原修正 + 篩選重繪無殘留 + 雲層不遮擋視線 + 月相地照光清晰輪廓)
(function() {
  let scene, camera, renderer, labelRenderer, controls;
  let sunLight, ambientLight, hemiLight, sunMesh, moonMesh, starPoints, celestialPivot, skyDomeMesh;
  let oceanMesh, oceanBasePositions;
  let cloudGroup, rainSystem, rainVelocities, splashRings = [];
  let isInitialized = false;

  const islandGroups = [];
  const islandBridges = [];
  const persistentAnimations = [];
  const islandAnimations = [];
  const clickableTargets = [];
  let selectedIslandIndex = -1;
  let cameraGoalPos = null;
  let cameraGoalTarget = null;
  let isCameraAutoFlying = false;

  let raycaster = null;
  let pointer = null;
  let pointerDownPos = { x: 0, y: 0 };

  let isAutoRealTime = true;
  let realTimeInterval = null;
  let currentWeatherMode = 'sunny';
  let currentWeatherSourceLabel = '初始化中';

  function getDeviceTier() {
    const w = window.innerWidth || 1024;
    const isLowHardware = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;
    if (w < 640) {
      return {
        tier: 'mobile', fov: 52,
        overviewPos: { x: 0, y: 23.0, z: 33.0 },
        overviewTarget: { x: 0, y: 0.4, z: 1.5 },
        focusOffset: { dx: 0, dy: 11.5, dz: 14.5, targetDy: -0.5 },
        minDist: 6.5, maxDist: 65, lowPower: true
      };
    } else if (w < 1024) {
      return {
        tier: 'tablet', fov: 46,
        overviewPos: { x: 0, y: 19.5, z: 27.5 },
        overviewTarget: { x: 0, y: 0.2, z: 0 },
        focusOffset: { dx: 2.2, dy: 10.0, dz: 13.0, targetDy: 0.5 },
        minDist: 6.0, maxDist: 65, lowPower: !!isLowHardware
      };
    } else {
      return {
        tier: 'desktop', fov: 40,
        overviewPos: { x: -2.2, y: 17.5, z: 25.0 },
        overviewTarget: { x: -1.8, y: 0.2, z: 0 },
        focusOffset: { dx: 1.8, dy: 9.0, dz: 12.0, targetDy: 0.6 },
        minDist: 6.0, maxDist: 65, lowPower: !!isLowHardware
      };
    }
  }

  function calculateLunarPhase(dateObj) {
    const d = dateObj || new Date();
    const knownNewMoon = Date.UTC(2000, 0, 6, 18, 14, 0);
    const synodicMonth = 29.53058867 * 24 * 60 * 60 * 1000;
    const elapsed = d.getTime() - knownNewMoon;
    let phase = (elapsed % synodicMonth) / synodicMonth;
    if (phase < 0) phase += 1;

    const lunarDay = Math.floor(phase * 29.53) + 1;
    let name = '滿月';
    let icon = '🌕';
    if (phase < 0.03 || phase >= 0.97) { name = '新月 (朔)'; icon = '🌑'; }
    else if (phase < 0.22) { name = '眉月'; icon = '🌒'; }
    else if (phase < 0.28) { name = '上弦月'; icon = '🌓'; }
    else if (phase < 0.47) { name = '盈凸月'; icon = '🌔'; }
    else if (phase < 0.53) { name = '滿月 (望)'; icon = '🌕'; }
    else if (phase < 0.72) { name = '虧凸月'; icon = '🌖'; }
    else if (phase < 0.78) { name = '下弦月'; icon = '🌗'; }
    else { name = '殘月'; icon = '🌘'; }

    return { phase: phase, lunarDay: lunarDay, name: name, icon: icon };
  }

  function generateHexSpiralCoords(count) {
    const coords = [{ q: 0, r: 0 }];
    if (count <= 1) return coords;
    const dirs = [
      { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
      { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 }
    ];
    let radius = 1;
    while (coords.length < count) {
      let q = dirs[4].q * radius;
      let r = dirs[4].r * radius;
      for (let side = 0; side < 6; side++) {
        for (let step = 0; step < radius; step++) {
          if (coords.length >= count) break;
          coords.push({ q, r });
          q += dirs[side].q;
          r += dirs[side].r;
        }
      }
      radius++;
    }
    return coords;
  }

  function hexToWorld(q, r, hexSize) {
    const size = hexSize || 4.85;
    const x = size * Math.sqrt(3) * (q + r / 2);
    const z = size * (3 / 2) * r;
    return { x, z };
  }

  function init3DEngine() {
    if (isInitialized) return true;
    if (typeof THREE === 'undefined') return false;

    const viewport = document.getElementById('world-3d-viewport');
    const canvas = document.getElementById('world-3d-canvas');
    const labelContainer = document.getElementById('world-3d-labels');
    if (!viewport || !canvas || !labelContainer) return false;

    const w = viewport.clientWidth || window.innerWidth;
    const h = viewport.clientHeight || window.innerHeight;
    const cfg = getDeviceTier();

    cameraGoalPos = new THREE.Vector3(cfg.overviewPos.x, cfg.overviewPos.y, cfg.overviewPos.z);
    cameraGoalTarget = new THREE.Vector3(cfg.overviewTarget.x, cfg.overviewTarget.y, cfg.overviewTarget.z);
    raycaster = new THREE.Raycaster();
    pointer = new THREE.Vector2();

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x7dd3fc);
    scene.fog = new THREE.FogExp2(0xbae6fd, 0.008);

    camera = new THREE.PerspectiveCamera(cfg.fov, w / h, 0.1, 260);
    camera.position.copy(cameraGoalPos);

    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: !cfg.lowPower, powerPreference: 'high-performance' });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, cfg.lowPower ? 1.5 : 2));
    renderer.shadowMap.enabled = !cfg.lowPower;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // 修正 1：使用 LinearToneMapping 與標準曝光，避免高飽和色彩被 ACES 洗白泛灰
    renderer.toneMapping = THREE.LinearToneMapping;
    renderer.toneMappingExposure = 1.0;

    if (typeof THREE.CSS2DRenderer === 'function') {
      labelRenderer = new THREE.CSS2DRenderer({ element: labelContainer });
      labelRenderer.setSize(w, h);
    }

    if (typeof THREE.OrbitControls === 'function') {
      controls = new THREE.OrbitControls(camera, viewport);
      controls.target.copy(cameraGoalTarget);
      controls.enableDamping = true;
      controls.dampingFactor = 0.065;
      controls.enableZoom = true;
      controls.zoomSpeed = 1.05;
      controls.enableRotate = true;
      controls.rotateSpeed = 0.85;
      controls.enablePan = true;
      controls.panSpeed = 0.85;
      controls.screenSpacePanning = false;
      controls.minPolarAngle = Math.PI * 0.08;
      controls.maxPolarAngle = Math.PI * 0.46;
      controls.minDistance = cfg.minDist;
      controls.maxDistance = cfg.maxDist;
      controls.addEventListener('start', function() { isCameraAutoFlying = false; });
    }

    setupSkyDomeAndLights(cfg);
    setupOceanMountainsAndMarineLife(cfg);
    setupWeatherSystems(cfg);
    bindInteractionEvents(viewport);

    window.addEventListener('resize', onWindowResize);
    window.addEventListener('orientationchange', function() {
      setTimeout(function() {
        onWindowResize();
        if (selectedIslandIndex === -1) window.reset3DCameraView();
      }, 200);
    });

    isInitialized = true;

    startRealTimeClockSync();
    window.fetchLiveSchoolWeather();

    animate();
    return true;
  }

  function setupSkyDomeAndLights(cfg) {
    const skyGeo = new THREE.SphereGeometry(140, 24, 16);
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        topColor: { value: new THREE.Color(0x0284c7) },
        bottomColor: { value: new THREE.Color(0xe0f2fe) },
        offset: { value: 12 },
        exponent: { value: 0.65 }
      },
      vertexShader: [
        'varying vec3 vWorldPosition;',
        'void main() {',
        '  vec4 worldPosition = modelMatrix * vec4(position, 1.0);',
        '  vWorldPosition = worldPosition.xyz;',
        '  gl_Position = projectionMatrix * viewMatrix * worldPosition;',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform vec3 topColor;',
        'uniform vec3 bottomColor;',
        'uniform float offset;',
        'uniform float exponent;',
        'varying vec3 vWorldPosition;',
        'void main() {',
        '  float h = normalize(vWorldPosition + vec3(0.0, offset, 0.0)).y;',
        '  gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);',
        '}'
      ].join('\n')
    });
    skyDomeMesh = new THREE.Mesh(skyGeo, skyMat);
    scene.add(skyDomeMesh);

    // 修正 1：柔和均衡光照強度，確保細沙灘（#FDE68A 與 #FEF9C3）和草地色階層次鮮明
    hemiLight = new THREE.HemisphereLight(0xf0f9ff, 0x0369a1, 0.62);
    scene.add(hemiLight);

    ambientLight = new THREE.AmbientLight(0xffffff, 0.32);
    scene.add(ambientLight);

    sunLight = new THREE.DirectionalLight(0xfffbeb, 1.05);
    sunLight.position.set(18, 28, 16);
    if (!cfg.lowPower) {
      sunLight.castShadow = true;
      sunLight.shadow.mapSize.set(1024, 1024);
      sunLight.shadow.camera.near = 2;
      sunLight.shadow.camera.far = 95;
      const d = 32;
      sunLight.shadow.camera.left = -d;
      sunLight.shadow.camera.right = d;
      sunLight.shadow.camera.top = d;
      sunLight.shadow.camera.bottom = -d;
    }
    scene.add(sunLight);

    celestialPivot = new THREE.Group();
    scene.add(celestialPivot);

    sunMesh = new THREE.Mesh(
      new THREE.IcosahedronGeometry(2.6, 1),
      new THREE.MeshBasicMaterial({ color: 0xfde047 })
    );
    sunMesh.position.set(0, 44, -32);
    celestialPivot.add(sunMesh);

    // 修正 4：3D 月球暗面加入微弱地照光藍灰 (0x334155)，讓陰晴圓缺的輪廓在夜空中清晰可見
    const lunar = calculateLunarPhase(new Date());
    const moonGeo = new THREE.SphereGeometry(2.5, 24, 24);
    const moonMat = new THREE.ShaderMaterial({
      uniforms: {
        phaseAngle: { value: lunar.phase * Math.PI * 2 },
        litColor: { value: new THREE.Color(0xfef9c3) },
        darkColor: { value: new THREE.Color(0x334155) }
      },
      vertexShader: [
        'varying vec3 vNormal;',
        'void main() {',
        '  vNormal = normalize(normal);',
        '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform float phaseAngle;',
        'uniform vec3 litColor;',
        'uniform vec3 darkColor;',
        'varying vec3 vNormal;',
        'void main() {',
        '  vec3 sunDir = normalize(vec3(sin(phaseAngle), 0.12, -cos(phaseAngle)));',
        '  float ndotl = dot(normalize(vNormal), sunDir);',
        '  float lit = smoothstep(-0.06, 0.10, ndotl);',
        '  vec3 col = mix(darkColor, litColor, lit);',
        '  gl_FragColor = vec4(col, 1.0);',
        '}'
      ].join('\n')
    });
    moonMesh = new THREE.Mesh(moonGeo, moonMat);
    moonMesh.position.set(0, -44, -32);
    celestialPivot.add(moonMesh);

    const moonBadgeEl = document.getElementById('moon-phase-label');
    if (moonBadgeEl) {
      moonBadgeEl.textContent = `${lunar.icon} 農曆初${lunar.lunarDay}・${lunar.name}`;
    }

    const starGeo = new THREE.BufferGeometry();
    const starCount = 420;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.48;
      const rad = 85 + Math.random() * 20;
      starPos[i * 3] = rad * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = rad * Math.cos(phi) + 8;
      starPos[i * 3 + 2] = rad * Math.sin(phi) * Math.sin(theta);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starPoints = new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({ color: 0xffffff, size: 0.72, transparent: true, opacity: 0 })
    );
    scene.add(starPoints);
  }

  // 修正 3：雲層配置於天際線外圍高空 (y = 14 ~ 18, 半徑 15 ~ 30)，不擋住中央島嶼視線
  function setupWeatherSystems(cfg) {
    cloudGroup = new THREE.Group();
    cloudGroup.visible = false;
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.92,
      flatShading: true,
      transparent: true,
      opacity: 0.86
    });
    for (let i = 0; i < 14; i++) {
      const cluster = new THREE.Group();
      const puffs = 3 + (i % 3);
      for (let p = 0; p < puffs; p++) {
        const puff = new THREE.Mesh(new THREE.DodecahedronGeometry(1.5 + (p % 2) * 0.55, 0), cloudMat);
        puff.position.set((p - 1) * 1.45, (p % 2) * 0.35, ((p + i) % 2) * 0.65);
        puff.scale.set(1.35, 0.62, 1.0);
        cluster.add(puff);
      }
      const angle = (i / 14) * Math.PI * 2 + 0.2;
      const dist = 15 + (i % 4) * 4.5;
      cluster.position.set(Math.cos(angle) * dist, 14.2 + (i % 3) * 1.6, Math.sin(angle) * dist);
      cloudGroup.add(cluster);
      persistentAnimations.push({ type: 'cloud', mesh: cluster, speed: 0.25 + (i % 3) * 0.1 });
    }
    scene.add(cloudGroup);

    const rainCount = cfg.lowPower ? 450 : 950;
    const rainGeo = new THREE.BufferGeometry();
    const rainPositions = new Float32Array(rainCount * 3);
    rainVelocities = new Float32Array(rainCount);
    for (let i = 0; i < rainCount; i++) {
      rainPositions[i * 3] = (Math.random() - 0.5) * 68;
      rainPositions[i * 3 + 1] = Math.random() * 26;
      rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 68;
      rainVelocities[i] = 18 + Math.random() * 8;
    }
    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
    const rainMat = new THREE.PointsMaterial({
      color: 0xe0f2fe,
      size: 0.26,
      transparent: true,
      opacity: 0.78
    });
    rainSystem = new THREE.Points(rainGeo, rainMat);
    rainSystem.visible = false;
    scene.add(rainSystem);

    for (let s = 0; s < 16; s++) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.12, 0.24, 12),
        new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.75 })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set((Math.random() - 0.5) * 38, -0.26, (Math.random() - 0.5) * 38);
      ring.visible = false;
      scene.add(ring);
      splashRings.push({ mesh: ring, phase: Math.random() * Math.PI * 2 });
    }
  }

  function applyRealTimeToScene() {
    if (!isAutoRealTime) return;
    const now = new Date();
    const hourFloat = now.getHours() + now.getMinutes() / 60;
    const slider = document.getElementById('day-night-slider');
    if (slider) slider.value = hourFloat.toFixed(1);
    renderAtmosphere(hourFloat, currentWeatherMode, now);
  }

  function startRealTimeClockSync() {
    applyRealTimeToScene();
    if (realTimeInterval) clearInterval(realTimeInterval);
    realTimeInterval = setInterval(applyRealTimeToScene, 60000);
  }

  window.toggleAutoRealTime = function(enabled) {
    isAutoRealTime = !!enabled;
    const chk = document.getElementById('auto-realtime-chk');
    if (chk) chk.checked = isAutoRealTime;
    if (isAutoRealTime) applyRealTimeToScene();
  };

  window.set3DTimeOfDay = function(hour) {
    isAutoRealTime = false;
    const chk = document.getElementById('auto-realtime-chk');
    if (chk) chk.checked = false;
    renderAtmosphere(parseFloat(hour), currentWeatherMode, new Date());
  };

  window.set3DWeather = function(mode, sourceText) {
    currentWeatherMode = mode || 'sunny';
    if (sourceText) currentWeatherSourceLabel = sourceText;
    document.querySelectorAll('.weather-mode-btn').forEach(function(btn) {
      btn.classList.toggle('active', btn.dataset.weather === currentWeatherMode);
    });
    const statusEl = document.getElementById('weather-status-label');
    const modeNames = { sunny: '☀️ 晴天', cloudy: '☁️ 陰天', rainy: '🌧️ 雨天' };
    if (statusEl) {
      statusEl.textContent = (modeNames[currentWeatherMode] || '☀️ 晴天') + (currentWeatherSourceLabel ? '（' + currentWeatherSourceLabel + '）' : '');
    }
    const slider = document.getElementById('day-night-slider');
    const hour = isAutoRealTime ? (new Date().getHours() + new Date().getMinutes() / 60) : (slider ? parseFloat(slider.value) : 11.5);
    renderAtmosphere(hour, currentWeatherMode, new Date());
  };

  window.fetchLiveSchoolWeather = function() {
    const schoolCfg = (typeof ACTIVE_SCHOOL !== 'undefined') ? ACTIVE_SCHOOL : {
      locationName: '南投縣埔里鎮',
      cwaLocationName: '埔里鎮',
      cwaDatasetId: 'F-D0047-021',
      lat: 23.9663,
      lon: 120.9695
    };
    const apiCfg = (typeof WEATHER_API_CONFIG !== 'undefined') ? WEATHER_API_CONFIG : { cwaApiKey: '' };

    if (apiCfg.cwaApiKey && apiCfg.cwaApiKey.trim() !== '') {
      const dataset = schoolCfg.cwaDatasetId || 'F-D0047-017';
      const cwaUrl = `https://opendata.cwa.gov.tw/api/v1/rest/datastore/${dataset}?Authorization=${encodeURIComponent(apiCfg.cwaApiKey.trim())}&LocationName=${encodeURIComponent(schoolCfg.cwaLocationName)}`;
      fetch(cwaUrl)
        .then(function(r) { return r.json(); })
        .then(function(data) {
          const loc = data?.records?.Locations?.[0]?.Location?.[0] || data?.records?.locations?.[0]?.location?.[0];
          const wxElem = (loc?.WeatherElement || loc?.weatherElement || []).find(function(el) {
            return el.ElementName === '天氣現象' || el.elementName === 'Wx';
          });
          const valObj = wxElem?.Time?.[0]?.ElementValue?.[0] || wxElem?.time?.[0]?.elementValue?.[0];
          const wxText = valObj?.Weather || valObj?.value || '';
          if (wxText) {
            let detected = 'sunny';
            if (wxText.includes('雨') || wxText.includes('雷')) detected = 'rainy';
            else if (wxText.includes('陰') || wxText.includes('雲') || wxText.includes('霧')) detected = 'cloudy';
            window.set3DWeather(detected, `${schoolCfg.locationName}氣象署:${wxText}`);
            return;
          }
          fetchOpenMeteoFallback(schoolCfg);
        })
        .catch(function() {
          fetchOpenMeteoFallback(schoolCfg);
        });
    } else {
      fetchOpenMeteoFallback(schoolCfg);
    }
  };

  function fetchOpenMeteoFallback(schoolCfg) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${schoolCfg.lat}&longitude=${schoolCfg.lon}&current=weather_code,temperature_2m&timezone=Asia%2FTaipei`;
    fetch(url)
      .then(function(r) { return r.json(); })
      .then(function(data) {
        const code = data?.current?.weather_code;
        const temp = data?.current?.temperature_2m;
        if (typeof code === 'number') {
          let detected = 'sunny';
          if (code >= 51) detected = 'rainy';
          else if (code >= 2) detected = 'cloudy';
          const tempStr = typeof temp === 'number' ? ` ${Math.round(temp)}°C` : '';
          window.set3DWeather(detected, `${schoolCfg.locationName}即時${tempStr}`);
        } else {
          window.set3DWeather('sunny', `${schoolCfg.locationName}預設晴空`);
        }
      })
      .catch(function() {
        window.set3DWeather('sunny', `${schoolCfg.locationName}離線模式`);
      });
  }

  function renderAtmosphere(hour, weather, dateObj) {
    const label = document.getElementById('time-display-label');
    const hh = String(Math.floor(hour)).padStart(2, '0');
    const mm = String(Math.round((hour - Math.floor(hour)) * 60)).padStart(2, '0');
    const isNight = hour < 5.5 || hour > 18.5;
    const isSunset = (hour >= 16.5 && hour <= 18.5) || (hour >= 5.5 && hour <= 7);

    if (label) {
      const modeTag = isAutoRealTime ? '🕒 即時 ' : '';
      label.textContent = `${modeTag}${hh}:${mm} ${isNight ? '夜晚' : isSunset ? '晨昏' : '白天'}`;
    }
    if (!scene) return;

    const angle = ((hour - 6) / 24) * Math.PI * 2;
    if (celestialPivot) celestialPivot.rotation.z = -angle;
    const lunar = calculateLunarPhase(dateObj || new Date());
    if (moonMesh && moonMesh.material && moonMesh.material.uniforms) {
      moonMesh.material.uniforms.phaseAngle.value = lunar.phase * Math.PI * 2;
    }

    const isCloudy = weather === 'cloudy';
    const isRainy = weather === 'rainy';
    if (cloudGroup) {
      cloudGroup.visible = isCloudy || isRainy;
      cloudGroup.traverse(function(c) {
        if (c.isMesh && c.material) {
          c.material.color.setHex(isRainy ? 0x64748b : 0xf1f5f9);
        }
      });
    }
    if (rainSystem) rainSystem.visible = isRainy;
    splashRings.forEach(function(sr) { sr.mesh.visible = isRainy; });

    persistentAnimations.forEach(function(item) {
      if (item.type === 'seagull') item.mesh.visible = !isRainy;
    });

    if (sunMesh) sunMesh.visible = !isRainy;
    if (moonMesh) moonMesh.visible = !isRainy;

    if (isRainy) {
      const bgHex = isNight ? 0x090d16 : 0x334155;
      scene.background.setHex(bgHex);
      scene.fog.color.setHex(bgHex);
      scene.fog.density = 0.013;
      if (skyDomeMesh) {
        skyDomeMesh.material.uniforms.topColor.value.setHex(isNight ? 0x020617 : 0x1e293b);
        skyDomeMesh.material.uniforms.bottomColor.value.setHex(isNight ? 0x1e293b : 0x64748b);
      }
      if (oceanMesh) oceanMesh.material.color.setHex(0x0369a1);
      sunLight.intensity = isNight ? 0.18 : 0.42;
      hemiLight.intensity = isNight ? 0.25 : 0.45;
      if (starPoints) starPoints.material.opacity = 0;
    } else if (isCloudy) {
      const bgHex = isNight ? 0x1e293b : 0x94a3b8;
      scene.background.setHex(bgHex);
      scene.fog.color.setHex(bgHex);
      scene.fog.density = 0.010;
      if (skyDomeMesh) {
        skyDomeMesh.material.uniforms.topColor.value.setHex(isNight ? 0x0f172a : 0x64748b);
        skyDomeMesh.material.uniforms.bottomColor.value.setHex(isNight ? 0x334155 : 0xcbd5e1);
      }
      if (oceanMesh) oceanMesh.material.color.setHex(0x0284c7);
      sunLight.intensity = isNight ? 0.22 : 0.58;
      hemiLight.intensity = isNight ? 0.35 : 0.55;
      if (starPoints) starPoints.material.opacity = isNight ? 0.2 : 0;
    } else {
      scene.fog.density = 0.008;
      if (oceanMesh) oceanMesh.material.color.setHex(0x0284c7);
      if (isNight) {
        scene.background.setHex(0x0f172a);
        scene.fog.color.setHex(0x0f172a);
        if (skyDomeMesh) {
          skyDomeMesh.material.uniforms.topColor.value.setHex(0x020617);
          skyDomeMesh.material.uniforms.bottomColor.value.setHex(0x1e293b);
        }
        sunLight.intensity = 0.25;
        hemiLight.intensity = 0.35;
        if (starPoints) starPoints.material.opacity = 0.92;
      } else if (isSunset) {
        scene.background.setHex(0xfb923c);
        scene.fog.color.setHex(0xfdba74);
        if (skyDomeMesh) {
          skyDomeMesh.material.uniforms.topColor.value.setHex(0x3b82f6);
          skyDomeMesh.material.uniforms.bottomColor.value.setHex(0xfb923c);
        }
        sunLight.intensity = 0.92;
        hemiLight.intensity = 0.56;
        if (starPoints) starPoints.material.opacity = 0.25;
      } else {
        scene.background.setHex(0x7dd3fc);
        scene.fog.color.setHex(0xbae6fd);
        if (skyDomeMesh) {
          skyDomeMesh.material.uniforms.topColor.value.setHex(0x0284c7);
          skyDomeMesh.material.uniforms.bottomColor.value.setHex(0xe0f2fe);
        }
        sunLight.intensity = 1.05;
        hemiLight.intensity = 0.62;
        if (starPoints) starPoints.material.opacity = 0;
      }
    }
  }

  function setupOceanMountainsAndMarineLife(cfg) {
    const segs = cfg.lowPower ? 26 : 48;
    const oceanGeo = new THREE.PlaneGeometry(210, 210, segs, segs);
    oceanGeo.rotateX(-Math.PI / 2);
    oceanBasePositions = Float32Array.from(oceanGeo.attributes.position.array);

    const oceanMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.26,
      metalness: 0.12,
      flatShading: true
    });
    oceanMesh = new THREE.Mesh(oceanGeo, oceanMat);
    oceanMesh.position.y = -0.35;
    oceanMesh.receiveShadow = true;
    scene.add(oceanMesh);

    const mtnCount = 14;
    for (let i = 0; i < mtnCount; i++) {
      const angle = (i / mtnCount) * Math.PI * 2 + 0.15;
      const dist = 39 + (i % 3) * 5.2;
      const mx = Math.cos(angle) * dist;
      const mz = Math.sin(angle) * dist;
      const h = 5.2 + (i % 4) * 2.3;
      const r = 3.7 + (i % 3) * 1.1;

      const mtnGroup = new THREE.Group();
      mtnGroup.position.set(mx, -0.35, mz);

      const base = new THREE.Mesh(
        new THREE.ConeGeometry(r, h, 6),
        new THREE.MeshStandardMaterial({ color: 0x475569, flatShading: true, roughness: 0.9 })
      );
      base.position.y = h / 2;
      mtnGroup.add(base);

      const snow = new THREE.Mesh(
        new THREE.ConeGeometry(r * 0.42, h * 0.42, 6),
        new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true, roughness: 0.55 })
      );
      snow.position.y = h * 0.79;
      mtnGroup.add(snow);

      const foam = new THREE.Mesh(
        new THREE.RingGeometry(r * 0.95, r * 1.25, 12),
        new THREE.MeshBasicMaterial({ color: 0xe0f2fe, side: THREE.DoubleSide, transparent: true, opacity: 0.55 })
      );
      foam.rotation.x = -Math.PI / 2;
      foam.position.y = 0.08;
      mtnGroup.add(foam);
      persistentAnimations.push({ type: 'foam', mesh: foam, phase: i });

      scene.add(mtnGroup);
    }

    const sailColors = [0xf43f5e, 0xfbbf24];
    for (let s = 0; s < 2; s++) {
      const boat = new THREE.Group();
      const hull = new THREE.Mesh(
        new THREE.BoxGeometry(0.75, 0.35, 1.5),
        new THREE.MeshStandardMaterial({ color: 0x92400e, flatShading: true })
      );
      hull.position.y = 0.1;
      boat.add(hull);

      const mast = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 1.4, 5),
        new THREE.MeshStandardMaterial({ color: 0xf8fafc })
      );
      mast.position.y = 0.85;
      boat.add(mast);

      const sail = new THREE.Mesh(
        new THREE.ConeGeometry(0.65, 1.15, 3),
        new THREE.MeshStandardMaterial({ color: sailColors[s], flatShading: true })
      );
      sail.position.set(0, 0.9, 0.15);
      sail.rotation.y = Math.PI / 2;
      boat.add(sail);

      scene.add(boat);
      persistentAnimations.push({
        type: 'sailboat',
        mesh: boat,
        radius: 18 + s * 7.5,
        speed: (s === 0 ? 0.14 : -0.11),
        phase: s * Math.PI
      });
    }

    for (let g = 0; g < 6; g++) {
      const gull = new THREE.Group();
      const wingMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
      const leftWing = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 0.16), wingMat);
      leftWing.position.x = -0.22;
      const rightWing = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 0.16), wingMat);
      rightWing.position.x = 0.22;
      gull.add(leftWing);
      gull.add(rightWing);
      scene.add(gull);
      persistentAnimations.push({
        type: 'seagull',
        mesh: gull,
        leftWing: leftWing,
        rightWing: rightWing,
        radius: 10.5 + (g % 3) * 5.5,
        height: 6.8 + (g % 3) * 1.4,
        speed: 0.35 + (g % 2) * 0.12,
        phase: (g / 6) * Math.PI * 2
      });
    }
  }

  function addIslandNatureDecor(group, isDimmed) {
    const treeColor = isDimmed ? 0x64748b : 0x15803d;
    const rockColor = isDimmed ? 0x94a3b8 : 0xe2e8f0;
    const spots = [
      { x: -1.6, z: -1.0, scale: 0.95 },
      { x: -1.4, z: 1.2, scale: 0.78 },
      { x: 1.5, z: -1.1, scale: 0.85 }
    ];
    spots.forEach(function(sp) {
      const tree = new THREE.Group();
      tree.position.set(sp.x, 0.48, sp.z);
      tree.scale.setScalar(sp.scale);

      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.14, 0.45, 5),
        new THREE.MeshStandardMaterial({ color: 0x78350f, flatShading: true })
      );
      trunk.position.y = 0.22;
      tree.add(trunk);

      const c1 = new THREE.Mesh(
        new THREE.ConeGeometry(0.46, 0.75, 6),
        new THREE.MeshStandardMaterial({ color: treeColor, flatShading: true })
      );
      c1.position.y = 0.72;
      c1.castShadow = true;
      tree.add(c1);

      const c2 = new THREE.Mesh(
        new THREE.ConeGeometry(0.34, 0.6, 6),
        new THREE.MeshStandardMaterial({ color: treeColor, flatShading: true })
      );
      c2.position.y = 1.12;
      tree.add(c2);

      group.add(tree);
    });

    const rock = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.24, 0),
      new THREE.MeshStandardMaterial({ color: rockColor, flatShading: true })
    );
    rock.position.set(1.2, 0.54, 1.4);
    group.add(rock);
  }

  function createLandmarkForCategory(category, index) {
    const group = new THREE.Group();

    if (category === 'phonics') {
      const basket = new THREE.Mesh(
        new THREE.BoxGeometry(0.65, 0.5, 0.65),
        new THREE.MeshStandardMaterial({ color: 0xb45309, flatShading: true })
      );
      basket.position.y = 0.72;
      group.add(basket);

      const balloon = new THREE.Mesh(
        new THREE.IcosahedronGeometry(1.15, 1),
        new THREE.MeshStandardMaterial({ color: 0xf43f5e, flatShading: true, roughness: 0.45 })
      );
      balloon.position.y = 2.38;
      balloon.castShadow = true;
      group.add(balloon);
      islandAnimations.push({ type: 'bob', mesh: balloon, baseY: 2.38, phase: index });

      const cloud = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.42, 0),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      cloud.position.set(-1.1, 2.75, 0.7);
      cloud.scale.set(1.4, 0.7, 0.9);
      group.add(cloud);
      return group;
    }

    if (category === 'topic1_story' || category === 'topic2_story' || category === 'story') {
      const isTopic2 = category === 'topic2_story';
      const towerColor = isTopic2 ? 0xfde047 : 0xfef3c7;
      const roofColor = isTopic2 ? 0x0284c7 : 0xdc2626;

      const tower = new THREE.Mesh(
        new THREE.CylinderGeometry(0.48, 0.78, 2.5, 8),
        new THREE.MeshStandardMaterial({ color: towerColor, flatShading: true })
      );
      tower.position.y = 1.68;
      tower.castShadow = true;
      group.add(tower);

      const roof = new THREE.Mesh(
        new THREE.ConeGeometry(0.62, 0.75, 8),
        new THREE.MeshStandardMaterial({ color: roofColor, flatShading: true })
      );
      roof.position.y = 3.55;
      group.add(roof);

      const lantern = new THREE.Mesh(
        new THREE.CylinderGeometry(0.45, 0.45, 0.5, 8),
        new THREE.MeshBasicMaterial({ color: 0xfef08a })
      );
      lantern.position.y = 3.1;
      group.add(lantern);

      const beamPivot = new THREE.Group();
      beamPivot.position.y = 3.1;
      const beam = new THREE.Mesh(
        new THREE.ConeGeometry(0.85, 4.2, 8, 1, true),
        new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.3, side: THREE.DoubleSide })
      );
      beam.rotation.z = Math.PI / 2;
      beam.position.x = 2.1;
      beamPivot.add(beam);
      group.add(beamPivot);
      islandAnimations.push({ type: 'spinY', mesh: beamPivot, speed: isTopic2 ? -1.4 : 1.4 });

      const pier = new THREE.Mesh(
        new THREE.BoxGeometry(0.55, 0.14, 1.3),
        new THREE.MeshStandardMaterial({ color: 0x92400e, flatShading: true })
      );
      pier.position.set(0, 0.18, 2.65);
      group.add(pier);
      return group;
    }

    if (category === 'festival') {
      const stand = new THREE.Mesh(
        new THREE.ConeGeometry(0.95, 2.2, 4),
        new THREE.MeshStandardMaterial({ color: 0xc026d3, flatShading: true })
      );
      stand.position.y = 1.52;
      group.add(stand);

      const wheel = new THREE.Mesh(
        new THREE.TorusGeometry(1.15, 0.14, 6, 12),
        new THREE.MeshStandardMaterial({ color: 0xfde047, flatShading: true })
      );
      wheel.position.y = 2.48;
      group.add(wheel);
      islandAnimations.push({ type: 'spinZ', mesh: wheel, speed: 0.8 });
      return group;
    }

    if (category === 'review') {
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(1.1, 1.35, 0.8, 6),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, flatShading: true })
      );
      base.position.y = 0.82;
      group.add(base);

      const crystal = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.95, 0),
        new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xd97706, emissiveIntensity: 0.35, flatShading: true })
      );
      crystal.position.y = 2.32;
      group.add(crystal);
      islandAnimations.push({ type: 'spinY', mesh: crystal, speed: 1.1 });

      const walkerPivot = new THREE.Group();
      walkerPivot.position.y = 0.5;
      const walker = new THREE.Group();
      walker.position.set(1.95, 0, 0);
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16, 0.2, 0.38, 6),
        new THREE.MeshStandardMaterial({ color: 0x0284c7, flatShading: true })
      );
      body.position.y = 0.2;
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xfde68a })
      );
      head.position.y = 0.5;
      const hat = new THREE.Mesh(
        new THREE.ConeGeometry(0.24, 0.18, 6),
        new THREE.MeshStandardMaterial({ color: 0xf43f5e, flatShading: true })
      );
      hat.position.y = 0.66;
      walker.add(body);
      walker.add(head);
      walker.add(hat);
      walkerPivot.add(walker);
      group.add(walkerPivot);
      islandAnimations.push({ type: 'spinY', mesh: walkerPivot, speed: 0.55 });
      return group;
    }

    if (category === 'lesson1') {
      const fuji = new THREE.Mesh(
        new THREE.ConeGeometry(1.45, 2.3, 8),
        new THREE.MeshStandardMaterial({ color: 0x2563eb, flatShading: true })
      );
      fuji.position.set(-0.2, 1.58, -0.2);
      group.add(fuji);
      const cap = new THREE.Mesh(
        new THREE.ConeGeometry(0.62, 0.95, 8),
        new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true })
      );
      cap.position.set(-0.2, 2.28, -0.2);
      group.add(cap);

      const toriiMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, flatShading: true });
      const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.85, 6), toriiMat);
      p1.position.set(0.55, 0.88, 0.95);
      const p2 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.85, 6), toriiMat);
      p2.position.set(1.05, 0.88, 0.95);
      const topBar = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.1, 0.12), toriiMat);
      topBar.position.set(0.8, 1.28, 0.95);
      group.add(p1); group.add(p2); group.add(topBar);
    } else if (category === 'lesson2') {
      const tower = new THREE.Mesh(
        new THREE.ConeGeometry(0.9, 3.1, 4),
        new THREE.MeshStandardMaterial({ color: 0xd97706, flatShading: true })
      );
      tower.position.y = 1.98;
      tower.castShadow = true;
      group.add(tower);
    } else if (category === 'lesson3') {
      for (let s = 0; s < 3; s++) {
        const seg = new THREE.Mesh(
          new THREE.CylinderGeometry(0.58 - s * 0.08, 0.42 - s * 0.06, 0.85, 4),
          new THREE.MeshStandardMaterial({ color: 0x059669, flatShading: true })
        );
        seg.position.y = 0.88 + s * 0.82;
        seg.castShadow = true;
        group.add(seg);
      }
    } else {
      const hall = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 1.1, 1.2),
        new THREE.MeshStandardMaterial({ color: 0xf8fafc, flatShading: true })
      );
      hall.position.y = 1.05;
      hall.castShadow = true;
      group.add(hall);
      const roof = new THREE.Mesh(
        new THREE.ConeGeometry(1.15, 0.8, 4),
        new THREE.MeshStandardMaterial({ color: 0x7c3aed, flatShading: true })
      );
      roof.position.y = 1.98;
      roof.rotation.y = Math.PI / 4;
      group.add(roof);
    }
    return group;
  }

  function createVictoryFlag() {
    const flagGroup = new THREE.Group();
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 2.2, 6),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc })
    );
    pole.position.y = 1.1;
    flagGroup.add(pole);

    const banner = new THREE.Mesh(
      new THREE.BoxGeometry(0.95, 0.55, 0.08),
      new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xeab308, emissiveIntensity: 0.4 })
    );
    banner.position.set(0.48, 1.85, 0);
    flagGroup.add(banner);
    return flagGroup;
  }

  window.render3DWorldFromCatalog = function(catalog, progressMap, categoryFilter) {
    const ok = init3DEngine();
    if (!ok) return;
    onWindowResize();

    const filter = categoryFilter || 'all';

    // 修正 2：徹底清除舊島嶼、木橋、漂浮名牌與島嶼專屬動畫，避免切換分類後累積殘留
    islandGroups.forEach(function(item) {
      if (item.labelObj && item.labelObj.parent) item.labelObj.parent.remove(item.labelObj);
      scene.remove(item.group);
    });
    islandGroups.length = 0;

    islandBridges.forEach(function(b) {
      scene.remove(b);
    });
    islandBridges.length = 0;

    islandAnimations.length = 0;
    clickableTargets.length = 0;
    selectedIslandIndex = -1;

    const labelContainer = document.getElementById('world-3d-labels');
    if (labelContainer) labelContainer.innerHTML = '';

    const list = Array.isArray(catalog) ? catalog : [];
    if (!list.length) return;

    const sorted = [...list].sort(function(a, b) {
      return a.category === 'review' ? -1 : b.category === 'review' ? 1 : 0;
    });
    const coords = generateHexSpiralCoords(sorted.length);

    // 鮮明高對比自然地貌調色盤（濕沙金 #F59E0B 邊緣 + 乾白沙 #FEF08A + 飽和草地色）
    const catColorMap = {
      review: 0x059669,        // 翡翠深綠（中央總複習主島）
      lesson1: 0x22c55e,       // 鮮嫩草綠（Lesson 1）
      lesson2: 0x84cc16,       // 陽光青檸綠（Lesson 2）
      lesson3: 0xf97316,       // 珊瑚暖橘砂岩（Lesson 3）
      lesson4: 0x8b5cf6,       // 薰衣草紫羅蘭（Lesson 4）
      topic1_story: 0xeab308,  // 琥珀暖金沙（Topic 1 Story）
      topic2_story: 0xd97706,  // 夕陽蜜橘金（Topic 2 Story）
      numbers: 0x3b82f6,
      phonics: 0xf43f5e,       // 櫻花粉珊瑚（Phonics 發音）
      dailytalk: 0x14b8a6,     // 薄荷青綠（Daily Talk）
      festival: 0xd946ef       // 莓果紫紅（Festival 節慶）
    };

    const catTagPrefixMap = {
      lesson1: '[L1] ',
      lesson2: '[L2] ',
      lesson3: '[L3] ',
      lesson4: '[L4] ',
      topic1_story: '[T1 Story] ',
      topic2_story: '[T2 Story] ',
      numbers: '[123] '
    };

    sorted.forEach(function(unit, idx) {
      const q = coords[idx].q;
      const r = coords[idx].r;
      const pos = hexToWorld(q, r, 4.85);
      let isMatch = true;
      if (filter === 'all') {
        isMatch = true;
      } else if (filter === 'lesson_all') {
        isMatch = /^lesson[1-4]$/.test(unit.category);
      } else if (filter === 'story_all') {
        isMatch = unit.category === 'topic1_story' || unit.category === 'topic2_story';
      } else if (filter.startsWith('unit:')) {
        isMatch = unit.id === filter.slice(5);
      } else {
        isMatch = unit.category === filter;
      }
      const isDimmed = !isMatch;

      const unitProg = (progressMap && progressMap[unit.id]) ? progressMap[unit.id] : {};
      const doneCount = Object.values(unitProg).filter(function(v) { return v && v.completed; }).length;
      const totalMissions = typeof getAvailableMissionsForUnit === 'function' ? getAvailableMissionsForUnit(unit).length : 1;
      const isCompleted = totalMissions > 0 && doneCount >= totalMissions;

      const group = new THREE.Group();
      group.position.set(pos.x, 0, pos.z);

      // 1. 最外層：青綠色淺灘水暈（Shallow Lagoon Glow）
      const lagoonRing = new THREE.Mesh(
        new THREE.CylinderGeometry(3.28, 3.38, 0.08, 6),
        new THREE.MeshBasicMaterial({ color: isDimmed ? 0x94a3b8 : 0x38bdf8, transparent: true, opacity: 0.45 })
      );
      lagoonRing.position.y = -0.32;
      group.add(lagoonRing);

      // 2. 外圈濕潤金沙海岸（Wet Golden Sand - 溫暖焦糖沙色，與白沙明顯區隔）
      const wetSandBase = new THREE.Mesh(
        new THREE.CylinderGeometry(3.0, 3.15, 0.28, 6),
        new THREE.MeshStandardMaterial({ color: isDimmed ? 0x94a3b8 : 0xf59e0b, flatShading: true, roughness: 0.88 })
      );
      wetSandBase.position.y = -0.22;
      wetSandBase.receiveShadow = true;
      group.add(wetSandBase);

      // 3. 內圈乾爽細沙灘（Dry Warm Sand - 暖米黃細沙）
      const drySandBase = new THREE.Mesh(
        new THREE.CylinderGeometry(2.74, 2.9, 0.36, 6),
        new THREE.MeshStandardMaterial({ color: isDimmed ? 0xcbd5e1 : 0xfef08a, flatShading: true, roughness: 0.92 })
      );
      drySandBase.position.y = -0.05;
      drySandBase.receiveShadow = true;
      group.add(drySandBase);

      // 4. 頂部主題草地六角島嶼主體
      const baseColor = isDimmed ? 0x94a3b8 : (catColorMap[unit.category] || 0x22c55e);
      const hexBase = new THREE.Mesh(
        new THREE.CylinderGeometry(2.5, 2.65, 0.56, 6),
        new THREE.MeshStandardMaterial({ color: baseColor, flatShading: true, roughness: 0.78 })
      );
      hexBase.position.y = 0.22;
      hexBase.receiveShadow = true;
      hexBase.castShadow = true;
      hexBase.userData = { unitId: unit.id, islandIndex: idx };
      group.add(hexBase);
      if (!isDimmed) clickableTargets.push(hexBase);

      // 5. 微縮生態樹木與圓石
      addIslandNatureDecor(group, isDimmed);

      // 6. 海岸動態呼吸白色浪花環
      const foam = new THREE.Mesh(
        new THREE.RingGeometry(3.08, 3.38, 6),
        new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.65 })
      );
      foam.rotation.x = -Math.PI / 2;
      foam.position.y = -0.28;
      group.add(foam);
      islandAnimations.push({ type: 'foam', mesh: foam, phase: idx * 0.7 });

      // 7. 主題 3D 地標建築
      const landmark = createLandmarkForCategory(unit.category, idx);
      landmark.traverse(function(c) {
        if (c.isMesh) {
          c.userData = { unitId: unit.id, islandIndex: idx };
          if (!isDimmed) clickableTargets.push(c);
        }
      });
      group.add(landmark);

      if (isCompleted) {
        const flag = createVictoryFlag();
        flag.position.set(1.35, 0.5, 0.85);
        group.add(flag);
      }

      if (idx > 0 && idx <= 6) {
        const bridgeLen = Math.hypot(pos.x, pos.z) - 4.9;
        if (bridgeLen > 0.4) {
          const bridge = new THREE.Mesh(
            new THREE.BoxGeometry(0.75, 0.14, bridgeLen),
            new THREE.MeshStandardMaterial({ color: 0xb45309, flatShading: true })
          );
          bridge.position.set(pos.x * 0.5, 0.16, pos.z * 0.5);
          bridge.lookAt(pos.x, 0.16, pos.z);
          scene.add(bridge);
          islandBridges.push(bridge);
        }
      }

      let labelObj = null;
      const tagDiv = document.createElement('div');
      tagDiv.className = 'island-floating-tag ' + (isCompleted ? 'stamped' : '');
      tagDiv.style.opacity = isDimmed ? '0.32' : '1';
      tagDiv.style.pointerEvents = isDimmed ? 'none' : 'auto';
      const prefix = catTagPrefixMap[unit.category] || '';
      const shortTitle = prefix + unit.title.replace(/^Topic \d+\s*-?\s*/i, '');
      const badgeStr = isCompleted ? '🛂 已蓋章通關' : ('⭐ ' + doneCount + '/' + totalMissions + ' 任務');
      tagDiv.innerHTML = '<div class="island-tag-title">' + shortTitle + '</div><div class="island-tag-badge">' + badgeStr + '</div>';
      tagDiv.addEventListener('pointerdown', function(e) {
        e.stopPropagation();
      });
      tagDiv.addEventListener('click', function(e) {
        e.stopPropagation();
        focusOnIsland(idx, true);
      });

      if (typeof THREE.CSS2DObject === 'function') {
        labelObj = new THREE.CSS2DObject(tagDiv);
        labelObj.position.set(0, 3.8, 0);
        group.add(labelObj);
      }

      scene.add(group);
      islandGroups.push({ unit: unit, group: group, labelObj: labelObj, tagDiv: tagDiv, x: pos.x, z: pos.z, isDimmed: isDimmed });
    });

    if (filter !== 'all') {
      const firstMatchIdx = islandGroups.findIndex(function(it) { return !it.isDimmed; });
      if (firstMatchIdx !== -1) focusOnIsland(firstMatchIdx, false);
    }
  };

  function focusOnIsland(index, openPreview) {
    if (!islandGroups[index]) return;
    selectedIslandIndex = index;
    islandGroups.forEach(function(it, i) {
      it.tagDiv.classList.toggle('active', i === index);
    });

    const target = islandGroups[index];
    const cfg = getDeviceTier();
    cameraGoalTarget.set(target.x + cfg.focusOffset.dx, cfg.focusOffset.targetDy, target.z);
    cameraGoalPos.set(target.x + cfg.focusOffset.dx, cfg.focusOffset.dy, target.z + cfg.focusOffset.dz);
    isCameraAutoFlying = true;

    if (openPreview && typeof window.openStationPreviewDrawer === 'function') {
      window.openStationPreviewDrawer(target.unit.id);
    }
  }

  window.navigate3DIsland = function(delta) {
    if (!islandGroups.length) return;
    const activeIndices = islandGroups
      .map(function(it, i) { return it.isDimmed ? -1 : i; })
      .filter(function(i) { return i !== -1; });
    const pool = activeIndices.length ? activeIndices : islandGroups.map(function(_, i) { return i; });
    const curPos = pool.indexOf(selectedIslandIndex);
    const nextPoolIdx = curPos === -1 ? 0 : (curPos + delta + pool.length) % pool.length;
    focusOnIsland(pool[nextPoolIdx], true);
  };

  window.reset3DCameraView = function() {
    selectedIslandIndex = -1;
    islandGroups.forEach(function(it) { it.tagDiv.classList.remove('active'); });
    const cfg = getDeviceTier();
    if (cameraGoalTarget) cameraGoalTarget.set(cfg.overviewTarget.x, cfg.overviewTarget.y, cfg.overviewTarget.z);
    if (cameraGoalPos) cameraGoalPos.set(cfg.overviewPos.x, cfg.overviewPos.y, cfg.overviewPos.z);
    isCameraAutoFlying = true;
    if (typeof window.closeStationPreview === 'function') window.closeStationPreview();
  };

  function bindInteractionEvents(domElem) {
    domElem.addEventListener('pointerdown', function(e) {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    });
    domElem.addEventListener('pointerup', function(e) {
      const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
      if (dist > 6 || !raycaster || !camera) return;
      const rect = domElem.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(clickableTargets, false);
      if (hits.length > 0) {
        const idx = hits[0].object.userData.islandIndex;
        if (typeof idx === 'number') focusOnIsland(idx, true);
      }
    });
  }

  function onWindowResize() {
    const viewport = document.getElementById('world-3d-viewport');
    if (!viewport || !renderer || !camera) return;
    const w = viewport.clientWidth || window.innerWidth;
    const h = viewport.clientHeight || window.innerHeight;
    const cfg = getDeviceTier();

    camera.fov = cfg.fov;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();

    if (controls) {
      controls.minDistance = cfg.minDist;
      controls.maxDistance = cfg.maxDist;
    }

    renderer.setSize(w, h);
    if (labelRenderer) labelRenderer.setSize(w, h);
  }

  function runAnimationItem(item, elapsed, isRainy) {
    if (item.type === 'bob') {
      item.mesh.position.y = item.baseY + Math.sin(elapsed * 2 + item.phase) * 0.18;
    } else if (item.type === 'spinY') {
      item.mesh.rotation.y += 0.015 * (item.speed || 1);
    } else if (item.type === 'spinZ') {
      item.mesh.rotation.z += 0.012 * (item.speed || 1);
    } else if (item.type === 'foam') {
      const s = 1 + Math.sin(elapsed * 2.2 + item.phase) * 0.05;
      item.mesh.scale.set(s, s, 1);
    } else if (item.type === 'cloud') {
      item.mesh.position.x += item.speed * 0.012;
      if (item.mesh.position.x > 34) item.mesh.position.x = -34;
    } else if (item.type === 'sailboat') {
      const a = elapsed * item.speed + item.phase;
      item.mesh.position.set(Math.cos(a) * item.radius, -0.25, Math.sin(a) * item.radius);
      item.mesh.rotation.y = -a + (item.speed > 0 ? Math.PI : 0);
      item.mesh.rotation.z = Math.sin(elapsed * 2.5 + item.phase) * (isRainy ? 0.14 : 0.06);
    } else if (item.type === 'seagull') {
      const a = elapsed * item.speed + item.phase;
      item.mesh.position.set(
        Math.cos(a) * item.radius,
        item.height + Math.sin(elapsed * 1.8 + item.phase) * 0.45,
        Math.sin(a) * item.radius
      );
      item.mesh.rotation.y = -a;
      const flap = Math.sin(elapsed * 7 + item.phase) * 0.45;
      item.leftWing.rotation.z = flap;
      item.rightWing.rotation.z = -flap;
    }
  }

  const clock = typeof THREE !== 'undefined' ? new THREE.Clock() : null;
  function animate() {
    requestAnimationFrame(animate);
    const elapsed = clock ? clock.getElapsedTime() : 0;
    const cfg = getDeviceTier();
    const isRainy = currentWeatherMode === 'rainy';

    if (oceanMesh && oceanBasePositions && !cfg.lowPower) {
      const pos = oceanMesh.geometry.attributes.position;
      const amp = isRainy ? 0.22 : 0.12;
      const spd = isRainy ? 2.2 : 1.4;
      for (let i = 0; i < pos.count; i++) {
        const bx = oceanBasePositions[i * 3];
        const bz = oceanBasePositions[i * 3 + 2];
        pos.setY(i, Math.sin(bx * 0.25 + elapsed * spd) * amp + Math.cos(bz * 0.25 + elapsed * (spd * 0.8)) * amp);
      }
      pos.needsUpdate = true;
    }

    if (isRainy && rainSystem && rainVelocities) {
      const rPos = rainSystem.geometry.attributes.position;
      for (let i = 0; i < rPos.count; i++) {
        let ry = rPos.getY(i) - rainVelocities[i] * 0.016;
        let rx = rPos.getX(i) - 0.04;
        if (ry < -0.3) {
          ry = 24 + Math.random() * 4;
          rx = (Math.random() - 0.5) * 68;
        }
        rPos.setY(i, ry);
        rPos.setX(i, rx);
      }
      rPos.needsUpdate = true;

      splashRings.forEach(function(sr) {
        const t = (elapsed * 2.5 + sr.phase) % 1;
        const sc = 0.3 + t * 2.4;
        sr.mesh.scale.set(sc, sc, 1);
        sr.mesh.material.opacity = (1 - t) * 0.7;
      });
    }

    persistentAnimations.forEach(function(item) { runAnimationItem(item, elapsed, isRainy); });
    islandAnimations.forEach(function(item) { runAnimationItem(item, elapsed, isRainy); });

    if (isCameraAutoFlying && controls && camera) {
      camera.position.lerp(cameraGoalPos, 0.08);
      controls.target.lerp(cameraGoalTarget, 0.08);
      if (camera.position.distanceTo(cameraGoalPos) < 0.15) isCameraAutoFlying = false;
    }

    if (controls) controls.update();
    if (renderer && scene && camera) renderer.render(scene, camera);
    if (labelRenderer && scene && camera) labelRenderer.render(scene, camera);
  }
})();
